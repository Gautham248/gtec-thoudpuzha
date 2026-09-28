import Image from "next/image";
import { Clock, GraduationCap, MonitorPlay, Award, Briefcase, CheckCircle2 } from "lucide-react";
import { CourseTabs, type CourseTabItem } from "./CourseTabs";
import { CourseListSection } from "./CoursePageContent";
import type { CourseContent } from "@/lib/course-content.types";

interface CourseDetailSectionsProps {
  overview: string;
  detailedContent: string;
  detailedContentImageUrl?: string | null;
  courseLists: CourseContent["courseLists"];
  benefits?: CourseContent["benefits"];
  durationText: string | null;
  certificationSummary: string | null;
  careerOutcomes: string | null;
  locale: string;
}

function parseCareerOutcomes(text: string | null): string[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return text.split(",").map((s) => s.trim()).filter(Boolean);
}

export function CourseDetailSections({
  overview,
  detailedContent,
  detailedContentImageUrl,
  courseLists,
  benefits,
  durationText,
  certificationSummary,
  careerOutcomes,
  locale,
}: CourseDetailSectionsProps) {
  const t = (en: string | undefined | null, ml: string | undefined | null) =>
    locale === "ml" && ml ? ml : en ?? "";

  const roles = parseCareerOutcomes(careerOutcomes);

  const courseDetailsTab = (
    <div className="space-y-12 sm:space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            About This Course
          </h2>
          {overview ? (
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground break-words">
              {overview}
            </p>
          ) : (
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              Details about this course will be available soon.
            </p>
          )}
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
          <FactCard
            icon={<Clock className="h-5 w-5" />}
            label="Course Duration"
            value={durationText || "Flexible"}
            hint="Flexible Batch Timings"
          />
          <FactCard
            icon={<GraduationCap className="h-5 w-5" />}
            label="Course Level"
            value="Beginner to Advanced"
            hint="Practical Lab Oriented"
          />
          <FactCard
            icon={<MonitorPlay className="h-5 w-5" />}
            label="Training Mode"
            value="Classroom & Hands-on Lab"
            hint="100% Practical Sessions"
          />
          <FactCard
            icon={<Award className="h-5 w-5" />}
            label="Certification"
            value={certificationSummary || "G-TEC Certified"}
            hint="Globally Recognized"
          />
        </div>
      </div>

      {roles.length > 0 && (
        <div className="space-y-5">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Career Opportunities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {roles.map((role, idx) => (
              <div
                key={idx}
                className="rounded-[20px] bg-[#121926] p-5 shadow-md"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/90">
                  <Briefcase className="h-3 w-3" />
                  Job Role
                </span>
                <h4 className="mt-3 text-base sm:text-lg font-semibold text-white break-words">
                  {role}
                </h4>
                <p className="mt-1.5 text-xs sm:text-sm text-white/65 leading-relaxed">
                  High-demand role across leading private, MNC, and public sector organizations.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const additionalDetailsTab = detailedContent ? (
    <div className="space-y-6 max-w-3xl">
      {detailedContent
        .split("\n\n")
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className="text-sm sm:text-base leading-relaxed text-muted-foreground break-words">
            {para}
          </p>
        ))}
      {detailedContentImageUrl && (
        <Image
          src={detailedContentImageUrl}
          alt=""
          width={800}
          height={400}
          className="w-full max-w-full rounded-xl object-cover max-h-80 shadow-xs"
          loading="lazy"
        />
      )}
    </div>
  ) : (
    <p className="text-sm sm:text-base text-muted-foreground">
      No additional details have been added for this course yet.
    </p>
  );

  const topicsTab =
    courseLists.length > 0 ? (
      <div className="space-y-8">
        {courseLists.map((list, idx) => (
          <CourseListSection key={idx} list={list} />
        ))}
      </div>
    ) : (
      <p className="text-sm sm:text-base text-muted-foreground">
        Topic-wise breakdown will be published soon.
      </p>
    );

  const eligibilityTab =
    benefits && benefits.items.length > 0 ? (
      <div className="space-y-4 max-w-2xl">
        <h3 className="text-lg sm:text-xl font-bold text-foreground">
          {benefits.heading || "Who Can Join This Course"}
        </h3>
        <ul className="space-y-2.5">
          {benefits.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <span className="text-sm sm:text-base text-muted-foreground break-words leading-relaxed">
                {t(item.textEn, item.textMl)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <p className="text-sm sm:text-base text-muted-foreground">
        Eligibility details will be published soon.
      </p>
    );

  const tabs: CourseTabItem[] = [
    { id: "details", label: "Course Details", content: courseDetailsTab },
    { id: "additional", label: "Additional Details", content: additionalDetailsTab },
    { id: "topics", label: "Topics", content: topicsTab },
    { id: "eligibility", label: "Eligibility Criteria", content: eligibilityTab },
  ];

  return <CourseTabs tabs={tabs} />;
}

function FactCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="mt-3 text-[11px] sm:text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm sm:text-base font-semibold text-foreground break-words">{value}</p>
      <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
