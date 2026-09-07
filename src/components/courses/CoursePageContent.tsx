import Image from "next/image";
import type { CourseContent, CourseListBlock } from "@/lib/course-content.types";

interface CoursePageContentProps {
  titleEn: string;
  titleMl: string | null;
  descriptionEn: string | null;
  descriptionMl: string | null;
  coverImageUrl: string | null;
  contentBlocks: CourseContent | null;
  preview?: boolean;
  locale?: string;
}

export function CoursePageContent({
  titleEn,
  titleMl,
  descriptionEn,
  descriptionMl,
  coverImageUrl: _coverImageUrl,
  contentBlocks,
  preview = false,
  locale = "en",
}: CoursePageContentProps) {
  const t = (en: string | undefined | null, ml: string | undefined | null) =>
    locale === "ml" && ml ? ml : en ?? "";

  const tagline = t(contentBlocks?.heroTaglineEn, contentBlocks?.heroTaglineMl);
  const overview = t(contentBlocks?.overviewEn, contentBlocks?.overviewMl);
  const detailedContent = t(contentBlocks?.detailedContentEn, contentBlocks?.detailedContentMl);
  const detailedImage = contentBlocks?.detailedContentImageUrl;
  const courseLists = contentBlocks?.courseLists ?? [];
  const benefits = contentBlocks?.benefits;
  const description = t(descriptionEn, descriptionMl);

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 sm:space-y-10">
      {/* Hero */}
      {tagline && (
        <section className="rounded-xl border border-border/60 bg-muted/40 p-5 sm:p-7 text-center shadow-xs">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2.5 text-foreground break-words">
            {t(titleEn, titleMl)}
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto break-words leading-relaxed">
            {tagline}
          </p>
        </section>
      )}

      {/* Fallback hero when no tagline */}
      {!tagline && (
        <section className="py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2.5 text-foreground break-words">
            {t(titleEn, titleMl)}
          </h1>
          {description && (
            <p className="text-base text-muted-foreground break-words leading-relaxed">{description}</p>
          )}
        </section>
      )}

      {/* Overview */}
      {overview && (
        <section className="prose prose-base max-w-none break-words leading-relaxed text-muted-foreground">
          <p className="break-words">{overview}</p>
        </section>
      )}

      {/* Detailed Content */}
      {detailedContent && (
        <section className="space-y-4">
          {detailedContent
            .split("\n\n")
            .filter(Boolean)
            .map((para, i) => (
              <p key={i} className="text-base leading-relaxed text-muted-foreground break-words">
                {para}
              </p>
            ))}
        </section>
      )}

      {/* Content Image */}
      {detailedImage && (
        <section className="flex justify-center">
          <Image
            src={detailedImage}
            alt=""
            width={800}
            height={400}
            className="w-full max-w-full rounded-xl object-cover max-h-80 shadow-xs"
            loading="lazy"
          />
        </section>
      )}

      {/* Course Lists */}
      {courseLists.length > 0 && (
        <section className="space-y-8">
          {courseLists.map((list, listIdx) => (
            <CourseListSection key={listIdx} list={list} />
          ))}
        </section>
      )}

      {/* Benefits */}
      {benefits && benefits.items.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            {benefits.heading || "Benefits of the course"}
          </h3>
          <ul className="space-y-2.5">
            {benefits.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <span className="text-base text-muted-foreground break-words leading-relaxed">
                  {t(item.textEn, item.textMl)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Preview indicator when no content */}
      {preview && !tagline && !overview && !detailedContent && courseLists.length === 0 && !benefits?.items.length && (
        <section className="text-center py-8 text-muted-foreground">
          <p>No content configured yet. Fill in the tabs above to build this page.</p>
        </section>
      )}
    </div>
  );
}

function CourseListSection({ list }: { list: CourseListBlock }) {
  return (
    <div className="space-y-3">
      {list.heading && (
        <h3 className="text-lg sm:text-xl font-bold text-foreground break-words">{list.heading}</h3>
      )}
      <div className="w-full max-w-full rounded-xl border border-border overflow-x-auto shadow-xs">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="border-b border-border px-3.5 py-2.5 text-left font-semibold w-1/3 whitespace-nowrap text-foreground">
                Code
              </th>
              <th className="border-b border-border px-3.5 py-2.5 text-left font-semibold whitespace-nowrap text-foreground">
                Course Name
              </th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((item, idx) => (
              <tr key={idx} className="even:bg-muted/20 hover:bg-muted/40 transition-colors">
                <td className="border-b border-border/60 px-3.5 py-2.5 font-mono text-sm text-foreground/90 whitespace-nowrap">
                  {item.code}
                </td>
                <td className="border-b border-border/60 px-3.5 py-2.5 text-muted-foreground break-words">{item.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
