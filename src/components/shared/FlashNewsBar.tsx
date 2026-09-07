import { getLocale } from "next-intl/server";
import { getActiveFlashNews } from "@/lib/flash-news";
import type { PublicFlashNewsItem } from "@/lib/flash-news";


type Locale = "en" | "ml";

export async function FlashNewsBar({
  items: providedItems,
}: {
  items?: PublicFlashNewsItem[];
} = {}) {
  const locale = (await getLocale()) as Locale;
  const items = providedItems ?? (await getActiveFlashNews(locale));

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="relative w-full max-w-full overflow-x-hidden bg-primary/95 text-primary-foreground py-2 text-sm font-medium border-b border-primary-foreground/10 shadow-xs backdrop-blur-sm"
      aria-label="Flash news"
      role="region"
    >
      <div className="flex items-center">
        <div className="flash-marquee flex items-center whitespace-nowrap will-change-transform max-w-full">
          <span className="inline-flex items-center gap-8 px-4">
            {items.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-300 shrink-0 inline-block animate-pulse" />
                {item.link ? (
                  <a
                    href={item.link}
                    className="underline underline-offset-4 decoration-primary-foreground/40 hover:decoration-primary-foreground transition-all hover:opacity-95"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.text}
                  </a>
                ) : (
                  <span>{item.text}</span>
                )}
              </span>
            ))}
            <span aria-hidden="true" className="opacity-40">•</span>
            <span aria-hidden="true">
              {items.map((item) => (
                <span key={`dup-${item.id}`} className="inline-flex items-center gap-1.5 ml-8">
                  <span className="size-1.5 rounded-full bg-amber-300 shrink-0 inline-block animate-pulse" />
                  {item.link ? (
                    <a
                      href={item.link}
                      className="underline underline-offset-4 decoration-primary-foreground/40 hover:decoration-primary-foreground transition-all hover:opacity-95"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span>{item.text}</span>
                  )}
                </span>
              ))}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

