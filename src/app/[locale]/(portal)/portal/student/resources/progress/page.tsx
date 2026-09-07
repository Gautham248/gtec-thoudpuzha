import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import Link from "next/link";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function MyProgressPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();
  if (!session.userId) return null;

  const rt = await getTranslations({ locale, namespace: "resources" });
  const t = await getTranslations({ locale, namespace: "progress" });

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">{t("heading")}</h1>
          <p className="mt-4 text-muted-foreground">{rt("completeProfile")}</p>
        </div>
      </div>
    );
  }

  const entries = await prisma.studentProgressEntry.findMany({
    where: { studentProfileId: profile.id },
    orderBy: { recordedAt: "desc" },
    include: { course: { select: { titleEn: true } } },
  });

  if (entries.length === 0) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-semibold">{t("heading")}</h1>
        <p className="text-muted-foreground">{t("noEntries")}</p>
        <Link
          href="/portal/student"
          className="mt-4 inline-block text-primary underline"
        >
          {t("backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t("heading")}</h1>
      <div className="space-y-4">
        {entries.map((e) => (
          <div
            key={e.id}
            className="rounded border border-border p-4"
          >
            <div className="mb-1 text-sm text-muted-foreground">
              {e.course.titleEn} &middot;{" "}
              {e.recordedAt.toISOString().slice(0, 10)}
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {e.noteEn}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
