import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Sparkles, Award, ShieldCheck, GraduationCap } from "lucide-react";
import { getCachedPublishedCourses } from "@/lib/data-cache";
import { CourseFilterSystem } from "@/components/courses/CourseFilterSystem";
import type { Locale } from "@/lib/site-settings";

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CoursesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: `${t("courses")} | G-TEC Education Thodupuzha`,
    description:
      "Explore comprehensive computer, software engineering, multimedia, accounting, and networking diploma courses with 100% placement assistance at G-TEC Thodupuzha.",
  };
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  const isMl = locale === "ml";

  const courses = await getCachedPublishedCourses();

  return (
    <main className="min-h-screen pb-20">
      {/* ── Page Header & Hero Banner ── */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/8 via-muted/30 to-background py-12 sm:py-16 lg:py-20">
        {/* Subtle Background Glow */}
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-96 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary mb-4">
            <Sparkles className="size-4 text-amber-500" />
            <span>{isMl ? "തൊഴിലധിഷ്ഠിത പ്രോഗ്രാമുകൾ" : "Explore Career-Oriented Programs"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-[1.15]">
            {isMl
              ? "പ്രൊഫഷണൽ കോഴ്‌സുകൾ & സർട്ടിഫിക്കേഷനുകൾ"
              : "Professional Courses & Global Certifications"}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isMl
              ? "ഐടി, സോഫ്റ്റ്‌വെയർ, മൾട്ടിമീഡിയ, അക്കൗണ്ടിംഗ് എന്നീ മേഖലകളിൽ അന്താരാഷ്ട്ര സർട്ടിഫിക്കേഷനുകളോടെയുള്ള സമഗ്ര പരിശീലനം."
              : "Discover industry-aligned diploma courses designed to fast-track your career. Learn with practical lab projects, experienced mentors, and guaranteed placement support."}
          </p>

          {/* Value Propositions Strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-bold text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <Award className="size-4 text-primary" />
              <span>{isMl ? "അംഗീകൃത സർട്ടിഫിക്കറ്റുകൾ" : "Globally Recognized"}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              <span>{isMl ? "100% പ്ലേസ്‌മെന്റ് പിന്തുണ" : "100% Placement Support"}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <span>{isMl ? "പ്രാക്ടിക്കൽ ലാബ് ട്രെയിനിംഗ്" : "Hands-On Lab Training"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Courses & Filter System Container ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12">
        <CourseFilterSystem courses={courses} locale={locale} />
      </div>
    </main>
  );
}
