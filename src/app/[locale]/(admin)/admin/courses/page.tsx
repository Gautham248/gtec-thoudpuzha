import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  createCategory,
  updateCategory as _updateCategory,
  deleteCategory,
  moveCategory,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadCourseImage,
} from "./actions";

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
}

function _formatDate(d: Date): string {
  return d.toISOString().slice(0, 16);
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { locale } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const [categories, courses] = await Promise.all([
    prisma.courseCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { courses: true } } },
    }),
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
  ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-10">
      <h1 className="text-2xl font-semibold">Courses</h1>

      {/* ── Categories ── */}
      <section className="rounded border border-border p-4">
        <h2 className="text-lg font-medium">Course Categories</h2>

        <form action={createCategory} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="locale" value={locale} />
          <div>
            <label htmlFor="cat-nameEn" className="block text-sm font-medium">
              Name (English) <span className="text-destructive">*</span>
            </label>
            <input
              id="cat-nameEn"
              name="nameEn"
              required
              className="mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="cat-nameMl" className="block text-sm font-medium">
              Name (Malayalam)
            </label>
            <input
              id="cat-nameMl"
              name="nameMl"
              className="mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit">Add Category</Button>
        </form>

        {categories.length > 0 && (
          <>
            {/* Desktop Categories Table */}
            <div className="hidden md:block overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">Order</th>
                    <th className="border border-border px-3 py-2 text-left">English</th>
                    <th className="border border-border px-3 py-2 text-left">Malayalam</th>
                    <th className="border border-border px-3 py-2 text-left">Courses</th>
                    <th className="border border-border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, index) => (
                    <tr key={cat.id}>
                      <td className="border border-border px-3 py-2">
                        <div className="flex items-center gap-1">
                          <form action={moveCategory}>
                            <input type="hidden" name="id" value={cat.id} />
                            <input type="hidden" name="direction" value="up" />
                            <input type="hidden" name="locale" value={locale} />
                            <Button type="submit" size="icon-xs" variant="outline" disabled={index === 0} aria-label="Move up">↑</Button>
                          </form>
                          <form action={moveCategory}>
                            <input type="hidden" name="id" value={cat.id} />
                            <input type="hidden" name="direction" value="down" />
                            <input type="hidden" name="locale" value={locale} />
                            <Button type="submit" size="icon-xs" variant="outline" disabled={index === categories.length - 1} aria-label="Move down">↓</Button>
                          </form>
                          <span className="ml-1 text-sm">{cat.sortOrder}</span>
                        </div>
                      </td>
                      <td className="border border-border px-3 py-2">{cat.nameEn}</td>
                      <td className="border border-border px-3 py-2">{cat.nameMl || "—"}</td>
                      <td className="border border-border px-3 py-2">{cat._count.courses}</td>
                      <td className="border border-border px-3 py-2">
                        <form action={deleteCategory}>
                          <input type="hidden" name="id" value={cat.id} />
                          <input type="hidden" name="locale" value={locale} />
                          <Button type="submit" size="xs" variant="destructive">Delete</Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Categories Cards */}
            <div className="space-y-3 mt-4 md:hidden">
              {categories.map((cat, index) => (
                <div key={cat.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{cat.nameEn}</span>
                    <span className="text-sm text-muted-foreground">{cat._count.courses} courses</span>
                  </div>
                  {cat.nameMl && <div className="text-sm text-muted-foreground">ML: {cat.nameMl}</div>}
                  <div className="flex items-center justify-between pt-2 border-t text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground mr-1">Order ({cat.sortOrder}):</span>
                      <form action={moveCategory}>
                        <input type="hidden" name="id" value={cat.id} />
                        <input type="hidden" name="direction" value="up" />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit" size="icon-xs" variant="outline" disabled={index === 0}>↑</Button>
                      </form>
                      <form action={moveCategory}>
                        <input type="hidden" name="id" value={cat.id} />
                        <input type="hidden" name="direction" value="down" />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit" size="icon-xs" variant="outline" disabled={index === categories.length - 1}>↓</Button>
                      </form>
                    </div>
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={cat.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <Button type="submit" size="xs" variant="destructive">Delete</Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {categories.length === 0 && (
          <p className="mt-4 text-muted-foreground">No categories yet.</p>
        )}
      </section>

      {/* ── Create Course ── */}
      <section className="rounded border border-border p-4">
        <h2 className="text-lg font-medium">Create Course</h2>
        <form action={createCourse} className="mt-4 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="co-titleEn" className="text-sm font-medium">Title (English) <span className="text-destructive">*</span></label>
              <input id="co-titleEn" name="titleEn" required className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="co-titleMl" className="text-sm font-medium">Title (Malayalam)</label>
              <input id="co-titleMl" name="titleMl" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="co-slug" className="text-sm font-medium">Slug (auto-generated if empty)</label>
              <input id="co-slug" name="slug" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="co-categoryId" className="text-sm font-medium">Category</label>
              <select id="co-categoryId" name="categoryId" className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
                <option value="">— None —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nameEn}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="co-descriptionEn" className="text-sm font-medium">Description (English)</label>
              <textarea id="co-descriptionEn" name="descriptionEn" rows={3} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="co-descriptionMl" className="text-sm font-medium">Description (Malayalam)</label>
              <textarea id="co-descriptionMl" name="descriptionMl" rows={3} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="co-durationText" className="text-sm font-medium">Duration</label>
              <input id="co-durationText" name="durationText" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="co-certifications" className="text-sm font-medium">Certifications (comma-separated)</label>
              <input id="co-certifications" name="certifications" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="co-careerOutcomesEn" className="text-sm font-medium">Career Outcomes (English)</label>
              <textarea id="co-careerOutcomesEn" name="careerOutcomesEn" rows={2} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="co-careerOutcomesMl" className="text-sm font-medium">Career Outcomes (Malayalam)</label>
              <textarea id="co-careerOutcomesMl" name="careerOutcomesMl" rows={2} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="co-syllabus" className="text-sm font-medium">Syllabus (JSON)</label>
              <textarea id="co-syllabus" name="syllabus" rows={3} className="w-full rounded border border-border bg-background px-3 py-2 text-sm font-mono" placeholder='[{"topic":"Introduction","hours":4}]' />
            </div>
            <div className="space-y-1">
              <label htmlFor="co-status" className="text-sm font-medium">Status</label>
              <select id="co-status" name="status" className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input id="co-featured" name="featured" type="checkbox" className="h-4 w-4" />
              <label htmlFor="co-featured" className="text-sm font-medium">Featured</label>
            </div>
          </div>
          <Button type="submit">Create Course</Button>
        </form>
      </section>

      {/* ── Course List ── */}
      <section>
        <h2 className="text-lg font-medium">All Courses</h2>
        {courses.length > 0 ? (
          <>
            {/* Desktop Courses Table */}
            <div className="hidden md:block overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">Title</th>
                    <th className="border border-border px-3 py-2 text-left">Slug</th>
                    <th className="border border-border px-3 py-2 text-left">Category</th>
                    <th className="border border-border px-3 py-2 text-left">Status</th>
                    <th className="border border-border px-3 py-2 text-left">Featured</th>
                    <th className="border border-border px-3 py-2 text-left">Cover Image</th>
                    <th className="border border-border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="border border-border px-3 py-2">{course.titleEn}</td>
                      <td className="border border-border px-3 py-2 text-sm font-mono">{course.slug}</td>
                      <td className="border border-border px-3 py-2">{course.category?.nameEn || "—"}</td>
                      <td className="border border-border px-3 py-2">{course.status}</td>
                      <td className="border border-border px-3 py-2">{course.featured ? "Yes" : "No"}</td>
                      <td className="border border-border px-3 py-2">
                        {course.coverImageUrl ? (
                          <span className="text-sm">{course.coverImageUrl}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <div className="flex flex-col gap-2">
                          <a
                            href={`/${locale}/admin/courses/${course.id}/content`}
                            className="text-sm text-primary hover:underline"
                          >
                            Edit Content
                          </a>
                          <form action={uploadCourseImage} className="flex items-center gap-2">
                            <input type="hidden" name="courseId" value={course.id} />
                            <input type="hidden" name="locale" value={locale} />
                            <input type="file" name="coverImage" accept="image/*" required className="text-sm" />
                            <Button type="submit" size="xs" variant="outline">Upload Cover</Button>
                          </form>
                          <details>
                            <summary className="cursor-pointer text-sm text-primary">Edit</summary>
                            <form action={updateCourse} className="mt-2 space-y-2 border border-border rounded p-2 text-left">
                              <input type="hidden" name="id" value={course.id} />
                              <input type="hidden" name="locale" value={locale} />
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Title (English) *</label>
                                <input name="titleEn" defaultValue={course.titleEn} className="w-full rounded border border-border px-2 py-1 text-sm" required />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Title (Malayalam)</label>
                                <input name="titleMl" defaultValue={course.titleMl ?? ""} className="w-full rounded border border-border px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Slug *</label>
                                <input name="slug" defaultValue={course.slug} className="w-full rounded border border-border px-2 py-1 text-sm" required />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Category</label>
                                <select name="categoryId" defaultValue={course.categoryId ?? ""} className="w-full rounded border border-border px-2 py-1 text-sm">
                                  <option value="">— None —</option>
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.nameEn}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Description (English)</label>
                                <textarea name="descriptionEn" defaultValue={course.descriptionEn ?? ""} rows={2} className="w-full rounded border border-border px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Description (Malayalam)</label>
                                <textarea name="descriptionMl" defaultValue={course.descriptionMl ?? ""} rows={2} className="w-full rounded border border-border px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Duration</label>
                                <input name="durationText" defaultValue={course.durationText ?? ""} className="w-full rounded border border-border px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Certifications (comma-separated)</label>
                                <input name="certifications" defaultValue={course.certifications.join(", ")} className="w-full rounded border border-border px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Career Outcomes (English)</label>
                                <textarea name="careerOutcomesEn" defaultValue={course.careerOutcomesEn ?? ""} rows={2} className="w-full rounded border border-border px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Career Outcomes (Malayalam)</label>
                                <textarea name="careerOutcomesMl" defaultValue={course.careerOutcomesMl ?? ""} rows={2} className="w-full rounded border border-border px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Syllabus (JSON)</label>
                                <textarea name="syllabus" defaultValue={course.syllabus ? JSON.stringify(course.syllabus, null, 2) : ""} rows={3} className="w-full rounded border border-border px-2 py-1 text-sm font-mono" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Status</label>
                                <select name="status" defaultValue={course.status} className="w-full rounded border border-border px-2 py-1 text-sm">
                                  <option value="DRAFT">Draft</option>
                                  <option value="PUBLISHED">Published</option>
                                  <option value="ARCHIVED">Archived</option>
                                </select>
                              </div>
                              <label className="flex items-center gap-2 text-sm pt-1">
                                <input type="checkbox" name="featured" defaultChecked={course.featured} />
                                Featured
                              </label>
                              <Button type="submit" size="xs" className="w-full">Save Changes</Button>
                            </form>
                            <form action={deleteCourse} className="mt-2">
                              <input type="hidden" name="id" value={course.id} />
                              <input type="hidden" name="locale" value={locale} />
                              <Button type="submit" size="xs" variant="destructive" className="w-full">Delete</Button>
                            </form>
                          </details>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Courses Cards */}
            <div className="space-y-3 mt-4 md:hidden">
              {courses.map((course) => (
                <div key={course.id} className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2 border-b pb-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground text-sm block leading-snug">{course.titleEn}</span>
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded bg-primary/10 px-2 py-0.5 text-sm font-semibold uppercase tracking-wider text-primary">
                      {course.status}
                    </span>
                  </div>

                  <div className="text-sm space-y-1.5 text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Category:</span>
                      <span>{course.category?.nameEn || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Featured:</span>
                      <span>{course.featured ? "Yes" : "No"}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <a
                      href={`/${locale}/admin/courses/${course.id}/content`}
                      className="inline-block w-full text-center rounded bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
                    >
                      Edit Course Content →
                    </a>

                    <form action={uploadCourseImage} className="flex items-center gap-2 pt-1">
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <input type="file" name="coverImage" accept="image/*" required className="text-sm max-w-[170px]" />
                      <Button type="submit" size="xs" variant="outline">Upload Cover</Button>
                    </form>

                    <details className="pt-1">
                      <summary className="cursor-pointer text-sm font-medium text-primary">Edit</summary>
                      <form action={updateCourse} className="mt-2 space-y-2.5 border border-border rounded p-3 bg-muted/20 text-left">
                        <input type="hidden" name="id" value={course.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Title (English) *</label>
                          <input name="titleEn" defaultValue={course.titleEn} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Title (Malayalam)</label>
                          <input name="titleMl" defaultValue={course.titleMl ?? ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Slug *</label>
                          <input name="slug" defaultValue={course.slug} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                          <select name="categoryId" defaultValue={course.categoryId ?? ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background">
                            <option value="">— None —</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.nameEn}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Description (English)</label>
                          <textarea name="descriptionEn" defaultValue={course.descriptionEn ?? ""} rows={2} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Description (Malayalam)</label>
                          <textarea name="descriptionMl" defaultValue={course.descriptionMl ?? ""} rows={2} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Duration</label>
                          <input name="durationText" defaultValue={course.durationText ?? ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Certifications (comma-separated)</label>
                          <input name="certifications" defaultValue={course.certifications.join(", ")} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Career Outcomes (English)</label>
                          <textarea name="careerOutcomesEn" defaultValue={course.careerOutcomesEn ?? ""} rows={2} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Career Outcomes (Malayalam)</label>
                          <textarea name="careerOutcomesMl" defaultValue={course.careerOutcomesMl ?? ""} rows={2} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Syllabus (JSON)</label>
                          <textarea name="syllabus" defaultValue={course.syllabus ? JSON.stringify(course.syllabus, null, 2) : ""} rows={3} className="w-full rounded border border-border px-2 py-1.5 text-sm font-mono bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                          <select name="status" defaultValue={course.status} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background">
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="ARCHIVED">Archived</option>
                          </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm pt-1">
                          <input type="checkbox" name="featured" defaultChecked={course.featured} />
                          Featured
                        </label>
                        <Button type="submit" size="xs" className="w-full">Save Changes</Button>
                      </form>
                      <form action={deleteCourse} className="mt-2">
                        <input type="hidden" name="id" value={course.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit" size="xs" variant="destructive" className="w-full">Delete Course</Button>
                      </form>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">No courses yet.</p>
        )}
      </section>
    </main>
  );
}
