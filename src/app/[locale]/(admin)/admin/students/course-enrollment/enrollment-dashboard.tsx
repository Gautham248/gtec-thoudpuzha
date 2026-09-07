"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { enrollStudentInCourses, unenrollStudentFromCourse } from "./actions";

interface EnrollmentRecord {
  id: string;
  courseId: string;
  enrolledAt: Date;
  course: { id: string; titleEn: string };
}

interface StudentWithEnrollments {
  id: string;
  fullName: string | null;
  phone: string | null;
  studentId: string | null;
  studentRecordId: string | null;
  enrollments: EnrollmentRecord[];
}

interface Course {
  id: string;
  titleEn: string;
}

interface Props {
  students: StudentWithEnrollments[];
  courses: Course[];
  locale: string;
  selectedStudentProfileId: string | null;
}

export default function EnrollmentDashboard({
  students,
  courses,
  locale,
  selectedStudentProfileId,
}: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [selectedNewCourseIds, setSelectedNewCourseIds] = useState<Set<string>>(
    new Set(),
  );

  const filteredStudents = useMemo(() => {
    let result = students;

    if (courseFilter) {
      result = result.filter((s) =>
        s.enrollments.some((e) => e.courseId === courseFilter),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const name = (s.fullName || "").toLowerCase();
        const sid = (s.studentId || "").toLowerCase();
        return name.includes(q) || sid.includes(q);
      });
    }

    return result;
  }, [students, searchQuery, courseFilter]);

  const selectedStudent = selectedStudentProfileId
    ? students.find((s) => s.id === selectedStudentProfileId) ?? null
    : null;

  const enrolledCourseIds = new Set(
    selectedStudent?.enrollments.map((e) => e.courseId) || [],
  );

  function toggleCourse(courseId: string) {
    setSelectedNewCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label
            htmlFor="enrollment-search"
            className="block text-sm font-medium"
          >
            Search
          </label>
          <input
            id="enrollment-search"
            type="text"
            placeholder="Name or Student ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="w-full sm:w-64 space-y-1">
          <label
            htmlFor="enrollment-course-filter"
            className="block text-sm font-medium"
          >
            Course Filter
          </label>
          <select
            id="enrollment-course-filter"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titleEn}
              </option>
            ))}
          </select>
        </div>
        {(searchQuery || courseFilter) && (
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setCourseFilter("");
              }}
              className="w-full sm:w-auto"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredStudents.length} student
        {filteredStudents.length !== 1 ? "s" : ""}
      </p>

      <section>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-3 py-2 text-left">
                  Student ID
                </th>
                <th className="border border-border px-3 py-2 text-left">
                  Full Name
                </th>
                <th className="border border-border px-3 py-2 text-left">
                  Phone
                </th>
                <th className="border border-border px-3 py-2 text-left">
                  Enrolled Courses
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  onClick={() =>
                    router.push(
                      `/${locale}/admin/students/course-enrollment?studentProfileId=${encodeURIComponent(student.id)}`,
                    )
                  }
                  className={`cursor-pointer hover:bg-muted ${
                    student.id === selectedStudentProfileId ? "bg-muted" : ""
                  }`}
                >
                  <td className="border border-border px-3 py-2 font-mono text-sm">
                    {student.studentId || "N/A"}
                  </td>
                  <td className="border border-border px-3 py-2">
                    {student.fullName || "Unknown"}
                  </td>
                  <td className="border border-border px-3 py-2">
                    {student.phone || "N/A"}
                  </td>
                  <td className="border border-border px-3 py-2">
                    {student.enrollments.length === 0 ? (
                      <span className="text-muted-foreground">None</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        {student.enrollments.length > 1 && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                            {student.enrollments.length}
                          </span>
                        )}
                        <span>
                          {student.enrollments
                            .map((e) => e.course.titleEn)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="space-y-3 md:hidden">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() =>
                router.push(
                  `/${locale}/admin/students/course-enrollment?studentProfileId=${encodeURIComponent(student.id)}`,
                )
              }
              className={`cursor-pointer rounded-lg border p-4 space-y-2 transition-colors ${
                student.id === selectedStudentProfileId
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-semibold text-foreground">{student.fullName || "Unknown"}</span>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-sm text-foreground">
                  {student.studentId || "N/A"}
                </span>
              </div>
              <div className="text-sm space-y-1 text-muted-foreground">
                <div><span className="font-medium text-foreground">Phone:</span> {student.phone || "N/A"}</div>
                <div>
                  <span className="font-medium text-foreground">Enrolled Courses:</span>{" "}
                  {student.enrollments.length === 0 ? (
                    <span className="text-muted-foreground">None</span>
                  ) : (
                    <span className="text-foreground">{student.enrollments.map((e) => e.course.titleEn).join(", ")}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <p className="mt-4 text-muted-foreground">No students found.</p>
        )}
      </section>

      {selectedStudent && (
        <section className="space-y-6 rounded border border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">
              {selectedStudent.fullName || "Unknown"}
              {selectedStudent.studentId && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({selectedStudent.studentId})
                </span>
              )}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/${locale}/admin/students/course-enrollment`)
              }
            >
              Back to All Students
            </Button>
          </div>

          <div>
            <h3 className="text-md font-medium">
              Current Enrollments ({selectedStudent.enrollments.length})
            </h3>
            {selectedStudent.enrollments.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Not enrolled in any courses.
              </p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto mt-2">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border border-border px-3 py-2 text-left">
                          Course
                        </th>
                        <th className="border border-border px-3 py-2 text-left">
                          Enrolled
                        </th>
                        <th className="border border-border px-3 py-2 text-left">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.enrollments.map((enrollment) => (
                        <tr key={enrollment.id}>
                          <td className="border border-border px-3 py-2 text-sm">
                            {enrollment.course.titleEn}
                          </td>
                          <td className="border border-border px-3 py-2 text-sm">
                            {new Date(
                              enrollment.enrolledAt,
                            ).toLocaleDateString()}
                          </td>
                          <td className="border border-border px-3 py-2">
                            <form action={unenrollStudentFromCourse}>
                              <input
                                type="hidden"
                                name="enrollmentId"
                                value={enrollment.id}
                              />
                              <input
                                type="hidden"
                                name="studentProfileId"
                                value={selectedStudent.id}
                              />
                              <input
                                type="hidden"
                                name="courseTitle"
                                value={enrollment.course.titleEn}
                              />
                              <input
                                type="hidden"
                                name="locale"
                                value={locale}
                              />
                              <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                              >
                                Unenroll
                              </Button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-2 mt-2 md:hidden">
                  {selectedStudent.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="rounded-md border p-3 bg-card flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-foreground">{enrollment.course.titleEn}</div>
                        <div className="text-sm text-muted-foreground">Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</div>
                      </div>
                      <form action={unenrollStudentFromCourse}>
                        <input type="hidden" name="enrollmentId" value={enrollment.id} />
                        <input type="hidden" name="studentProfileId" value={selectedStudent.id} />
                        <input type="hidden" name="courseTitle" value={enrollment.course.titleEn} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit" variant="destructive" size="sm">
                          Unenroll
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <h3 className="text-md font-medium">
              Enroll in Additional Courses
            </h3>
            <form
              action={enrollStudentInCourses}
              className="mt-2 space-y-3"
            >
              <input
                type="hidden"
                name="studentProfileId"
                value={selectedStudent.id}
              />
              <input type="hidden" name="locale" value={locale} />

              <div className="max-h-64 space-y-1 overflow-y-auto rounded border border-border p-3">
                {courses.map((course) => {
                  const isAlreadyEnrolled = enrolledCourseIds.has(
                    course.id,
                  );
                  return (
                    <label
                      key={course.id}
                      className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
                        isAlreadyEnrolled
                          ? "text-muted-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="courseIds"
                        value={course.id}
                        checked={
                          isAlreadyEnrolled ||
                          selectedNewCourseIds.has(course.id)
                        }
                        disabled={isAlreadyEnrolled}
                        onChange={() => toggleCourse(course.id)}
                        className="h-4 w-4"
                      />
                      {course.titleEn}
                      {isAlreadyEnrolled && (
                        <span className="text-sm text-accent">
                          (already enrolled)
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <Button
                type="submit"
                disabled={selectedNewCourseIds.size === 0}
              >
                Enroll Selected Courses
              </Button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
