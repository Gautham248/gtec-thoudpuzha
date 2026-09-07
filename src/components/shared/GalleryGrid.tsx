"use client";

import { useState, useCallback, useEffect, useRef as _useRef } from "react";
import Image from "next/image";
import type { PublicGalleryCategory } from "@/lib/gallery";
import { getMediaUrl } from "@/lib/media";
import { useFocusTrap } from "@/hooks/useFocusTrap";

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // bare video ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}`;
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/,
  );
  return match
    ? `https://player.vimeo.com/video/${match[1]}`
    : null;
}

function getEmbedUrl(url: string): string | null {
  return getYouTubeEmbedUrl(url) ?? getVimeoEmbedUrl(url) ?? null;
}

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getVideoThumbnail(url: string): string | null {
  const ytId = getYouTubeVideoId(url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
  return null;
}

function pickLocalizedText(
  localized: { en: string; ml?: string | null },
  locale: "en" | "ml",
): string {
  return locale === "ml" && localized.ml ? localized.ml : localized.en;
}

function Lightbox({
  items,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  locale = "en",
}: {
  items: PublicGalleryCategory["items"];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  locale?: "en" | "ml";
}) {
  const item = items[currentIndex];
  const itemCaption = item ? pickLocalizedText({ en: item.captionEn ?? "", ml: item.captionMl }, locale) : "";
  const containerRef = useFocusTrap(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onPrev();
          break;
        case "ArrowRight":
          onNext();
          break;
      }
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  if (!item) return null;

  const embedUrl = item.mediaType === "VIDEO" ? getEmbedUrl(item.url) : null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:right-4 sm:top-4"
        aria-label="Close lightbox"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 sm:p-3 text-white hover:bg-black/70"
          aria-label="Previous image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 sm:size-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {currentIndex < items.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 sm:p-3 text-white hover:bg-black/70"
          aria-label="Next image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 sm:size-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      <div
        className="flex max-h-[90vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.mediaType === "VIDEO" && embedUrl ? (
          <iframe
            src={embedUrl}
            className="aspect-video w-full max-w-4xl"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={itemCaption || "Video"}
          />
        ) : (
          <Image
            src={getMediaUrl(item.url)}
            alt={itemCaption || "Gallery image"}
            width={1200}
            height={900}
            className="max-h-[85vh] w-auto rounded-lg object-contain"
            priority
          />
        )}
        {itemCaption && (
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/60 px-4 py-2 text-sm text-white">
            {itemCaption}
          </p>
        )}
      </div>
    </div>
  );
}

export function GalleryGrid({
  categories,
  initialCategorySlug,
  locale = "en",
}: {
  categories: PublicGalleryCategory[];
  initialCategorySlug?: string;
  locale?: "en" | "ml";
}) {
  const initialId = initialCategorySlug
    ? categories.find((c) => c.slug === initialCategorySlug)?.id
    : undefined;
  const [activeTab, setActiveTab] = useState<string>(
    initialId ?? (categories.length > 0 ? categories[0].id : ""),
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const activeCategory = categories.find((c) => c.id === activeTab);
  const activeItems = activeCategory?.items ?? [];

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const goToPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : prev,
    );
  }, []);

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null && prev < activeItems.length - 1 ? prev + 1 : prev,
    );
  }, [activeItems.length]);

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-lg text-muted-foreground">No gallery categories yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div
        className="mb-8 flex flex-wrap gap-2 border-b border-border pb-2"
        role="tablist"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeTab === cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === cat.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {pickLocalizedText({ en: cat.nameEn, ml: cat.nameMl }, locale)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {activeItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">No photos yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {activeItems.map((item, index) => {
            const itemCaption = pickLocalizedText({ en: item.captionEn ?? "", ml: item.captionMl }, locale);
            return (
            <button
              key={item.id}
              onClick={() =>
                item.mediaType === "IMAGE"
                  ? openLightbox(index)
                  : (() => {
                      const embedUrl = getEmbedUrl(item.url);
                      if (embedUrl) {
                        openLightbox(index);
                      } else {
                        window.open(item.url, "_blank", "noopener");
                      }
                    })()
              }
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
              aria-label={
                item.mediaType === "VIDEO"
                  ? `Play video: ${itemCaption || "Video"}`
                  : `View image: ${itemCaption || "Gallery image"}`
              }
            >
              <Image
                src={
                  item.mediaType === "VIDEO"
                    ? (getVideoThumbnail(item.url) ?? getMediaUrl(item.url))
                    : getMediaUrl(item.url)
                }
                alt={itemCaption || "Gallery image"}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              {item.mediaType === "VIDEO" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="ml-0.5 h-6 w-6 text-foreground"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
              {itemCaption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="truncate text-sm font-medium text-white">
                    {itemCaption}
                  </p>
                </div>
              )}
            </button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          items={activeItems}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goToPrev}
          onNext={goToNext}
          locale={locale}
        />
      )}
    </div>
  );
}
