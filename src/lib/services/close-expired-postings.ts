import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { jobPosting } from "@/db/schema";
import { logSystemAction } from "@/lib/audit";

export async function closeExpiredPostings(): Promise<{ closed: number }> {
  const expiredPostings = await db.query.jobPosting.findMany({
    where: (p, { and, eq, isNull, lt }) =>
      and(
        eq(p.status, "APPROVED"),
        isNull(p.deletedAt),
        lt(p.applicationDeadline, new Date()),
      ),
  });

  if (expiredPostings.length === 0) return { closed: 0 };

  const ids = expiredPostings.map((p) => p.id);

  await db
    .update(jobPosting)
    .set({ status: "CLOSED" })
    .where(inArray(jobPosting.id, ids));

  await Promise.all(
    expiredPostings.map((p) =>
      logSystemAction({
        action: "VACANCY_AUTO_CLOSE",
        entityType: "JobPosting",
        entityId: p.id,
        metadata: {
          title: p.title,
          employerId: p.employerId,
          deadline: p.applicationDeadline.toISOString(),
        },
      }),
    ),
  );

  return { closed: ids.length };
}
