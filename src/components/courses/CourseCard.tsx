import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { getMediaUrl } from "@/lib/media";
import { ArrowRight, BookOpen } from "lucide-react";

interface CourseCardProps {
  slug: string;
  titleEn: string;
  titleMl: string | null;
  descriptionEn: string | null;
  descriptionMl: string | null;
  coverImageUrl: string | null;
  locale: string;
}

export function CourseCard({
  slug,
  titleEn,
  titleMl,
  descriptionEn,
  descriptionMl,
  coverImageUrl,
  locale,
}: CourseCardProps) {
  const title = locale === "ml" && titleMl ? titleMl : titleEn;
  const description = locale === "ml" && descriptionMl
    ? descriptionMl
    : descriptionEn;

  return (
    <Link
      href={`/courses/${slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-border/80 overflow-hidden bg-card shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40"
    >
      <div>
        {coverImageUrl ? (
          <div className="relative h-48 sm:h-52 overflow-hidden bg-muted">
            <Image
              src={getMediaUrl(coverImageUrl)}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="h-48 sm:h-52 bg-gradient-to-br from-primary/10 to-muted flex flex-col items-center justify-center text-muted-foreground gap-2">
            <BookOpen className="size-8 text-primary/40" />
            <span className="text-sm font-medium">Course Overview</span>
          </div>
        )}
        <div className="p-5">
          <h2 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors leading-snug">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 pt-0">
        <div className="flex items-center gap-1 text-sm font-semibold text-primary pt-3 border-t border-border/40">
          <span>Explore Curriculum</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

