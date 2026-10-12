"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { candidateProfile, studentRecord, user } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export async function lookupStudentRecord(formData: FormData) {
  // Rate-limit: 5 per minute per IP — this is a public, unauthenticated
  // endpoint that acts as an enumeration oracle for Student ID / phone pairs.
  const ip = await getClientIp();
  const rateCheck = checkRateLimit(`student-lookup:${ip}`);
  if (!rateCheck.allowed) {
    return {
      success: false as const,
      error: "Too many attempts. Please try again later.",
    };
  }
  const studentId = formData.get("studentId") as string;
  const phone = formData.get("phone") as string;

  if (!studentId || !phone) {
    return {
      success: false as const,
      error: "Please provide both Student ID and phone number.",
    };
  }

  const record = await db.query.studentRecord.findFirst({
    where: (r, { and, eq }) =>
      and(eq(r.studentId, studentId), eq(r.phone, phone)),
  });

  if (!record) {
    return {
      success: false as const,
      error: "We couldn't verify these details — please contact the centre.",
    };
  }

  if (record.linkedUserId) {
    return {
      success: false as const,
      alreadyLinked: true as const,
      error:
        "This Student ID has already been registered — if this is you, please sign in instead.",
    };
  }

  if (!record.email) {
    return {
      success: false as const,
      error:
        "Your record doesn't have an email on file yet — please contact the centre to add one before verifying.",
    };
  }

  return {
    success: true as const,
    studentRecordId: record.id,
    email: record.email,
  };
}

export async function finalizeStudentVerification(studentRecordId: string) {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  const record = await db.query.studentRecord.findFirst({
    where: (r, { eq }) => eq(r.id, studentRecordId),
  });

  if (!record || record.linkedUserId) {
    redirect("/portal/sign-up/student");
  }

  const client = await clerkClient();
  await client.users.updateUser(session.userId, {
    publicMetadata: { role: "STUDENT" },
  });

  const userId = session.userId;
  // All-or-nothing: a failure part-way must not leave a profile without its
  // record link (which would also block every retry on the unique userId).
  await db.transaction(async (tx) => {
    await tx
      .insert(user)
      .values({ id: userId, role: "STUDENT" })
      .onConflictDoUpdate({ target: user.id, set: { role: "STUDENT" } });

    await tx.insert(candidateProfile).values({
      userId,
      isVerifiedStudent: true,
      studentRecordId,
    });

    // Only claim a record that is still unlinked, so two concurrent sign-ups
    // can't both link the same student record.
    expectRow(
      await tx
        .update(studentRecord)
        .set({ linkedUserId: userId })
        .where(
          and(
            eq(studentRecord.id, studentRecordId),
            isNull(studentRecord.linkedUserId),
          ),
        )
        .returning({ id: studentRecord.id }),
      "Unlinked student record",
    );
  });

  redirect("/portal/student/biodata");
}
