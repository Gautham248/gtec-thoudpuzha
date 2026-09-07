import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { approveSkill, mergeSkill, deleteSkill } from "./actions";

interface SkillsTaxonomyPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function SkillsTaxonomyPage({
  params,
  searchParams,
}: SkillsTaxonomyPageProps) {
  const { locale } = await params;
  const { status } = await searchParams;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  // Fetch all skills with reference counts
  const allSkills = await prisma.skill.findMany({ orderBy: { label: "asc" } });

  const skillsWithCounts = await Promise.all(
    allSkills.map(async (skill) => {
      const [candidateCount, jobPostingCount] = await Promise.all([
        prisma.candidateProfile.count({
          where: { skillIds: { has: skill.id } },
        }),
        prisma.jobPosting.count({
          where: { skillIds: { has: skill.id } },
        }),
      ]);
      return { ...skill, candidateCount, jobPostingCount };
    }),
  );

  // Filter by status if param is provided
  const filtered =
    status && status !== "ALL"
      ? skillsWithCounts.filter((s) => s.status === status)
      : skillsWithCounts;

  const canDelete = (candidateCount: number, jobPostingCount: number) =>
    candidateCount === 0 && jobPostingCount === 0;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">Skills Taxonomy</h1>

      {/* Status filter */}
      <form className="mt-4 flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium">
          Filter by status:
        </label>
        <select
          id="status-filter"
          name="status"
          defaultValue={status || "ALL"}
          className="rounded border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
        </select>
        <Button type="submit" size="xs">
          Filter
        </Button>
      </form>

      <section className="mt-6">
        {filtered.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">Label</th>
                    <th className="border border-border px-3 py-2 text-left">Status</th>
                    <th className="border border-border px-3 py-2 text-right">
                      Candidate refs
                    </th>
                    <th className="border border-border px-3 py-2 text-right">
                      Job Posting refs
                    </th>
                    <th className="border border-border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((skill) => (
                    <tr key={skill.id}>
                      <td className="border border-border px-3 py-2 font-medium">
                        {skill.label}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${
                            skill.status === "APPROVED"
                              ? "bg-primary/10 text-primary"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {skill.status}
                        </span>
                      </td>
                      <td className="border border-border px-3 py-2 text-right">
                        {skill.candidateCount}
                      </td>
                      <td className="border border-border px-3 py-2 text-right">
                        {skill.jobPostingCount}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Approve */}
                          {skill.status === "PENDING" && (
                            <form action={approveSkill}>
                              <input type="hidden" name="id" value={skill.id} />
                              <input type="hidden" name="locale" value={locale} />
                              <Button type="submit" size="xs" variant="default">
                                Approve
                              </Button>
                            </form>
                          )}

                          {/* Merge */}
                          <form action={mergeSkill} className="flex items-center gap-1">
                            <input type="hidden" name="sourceId" value={skill.id} />
                            <input type="hidden" name="locale" value={locale} />
                            <span className="text-sm text-muted-foreground">merge into</span>
                            <select
                              name="targetId"
                              className="max-w-[120px] rounded border border-border bg-background px-1 py-0.5 text-sm"
                              required
                            >
                              <option value="">Select...</option>
                              {allSkills
                                .filter((s) => s.id !== skill.id)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.label}
                                  </option>
                                ))}
                            </select>
                            <Button type="submit" size="xs" variant="outline">
                              Merge
                            </Button>
                          </form>

                          {/* Delete (only if zero references) */}
                          {canDelete(skill.candidateCount, skill.jobPostingCount) && (
                            <form action={deleteSkill}>
                              <input type="hidden" name="id" value={skill.id} />
                              <input type="hidden" name="locale" value={locale} />
                              <Button type="submit" size="xs" variant="destructive">
                                Delete
                              </Button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
              {filtered.map((skill) => (
                <div key={skill.id} className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-semibold text-foreground text-sm">{skill.label}</span>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${
                        skill.status === "APPROVED"
                          ? "bg-primary/10 text-primary"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {skill.status}
                    </span>
                  </div>

                  <div className="text-sm space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Candidate refs:</span>
                      <span className="font-medium text-foreground">{skill.candidateCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Job Posting refs:</span>
                      <span className="font-medium text-foreground">{skill.jobPostingCount}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    {/* Approve */}
                    {skill.status === "PENDING" && (
                      <form action={approveSkill} className="w-full">
                        <input type="hidden" name="id" value={skill.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit" size="xs" variant="default" className="w-full">
                          Approve Skill
                        </Button>
                      </form>
                    )}

                    {/* Merge */}
                    <form action={mergeSkill} className="flex flex-col gap-1.5 bg-muted/30 p-2 rounded border border-border/50">
                      <input type="hidden" name="sourceId" value={skill.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <label className="text-sm font-medium text-muted-foreground">Merge into target skill:</label>
                      <div className="flex items-center gap-2">
                        <select
                          name="targetId"
                          className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                          required
                        >
                          <option value="">Select Target...</option>
                          {allSkills
                            .filter((s) => s.id !== skill.id)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                        </select>
                        <Button type="submit" size="xs" variant="outline">
                          Merge
                        </Button>
                      </div>
                    </form>

                    {/* Delete */}
                    {canDelete(skill.candidateCount, skill.jobPostingCount) && (
                      <form action={deleteSkill} className="w-full">
                        <input type="hidden" name="id" value={skill.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit" size="xs" variant="destructive" className="w-full">
                          Delete Skill
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">No skills found.</p>
        )}
      </section>
    </main>
  );
}
