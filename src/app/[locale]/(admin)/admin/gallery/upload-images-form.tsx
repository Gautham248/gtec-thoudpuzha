"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/admin/action-form";
import { uploadGalleryImages } from "./actions";

interface Preview {
  name: string;
  url: string;
}

/** Bulk image upload for one category, with thumbnails of the picked files before submitting. */
export function UploadImagesForm({ categoryId, locale }: { categoryId: string; locale: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);

  // Revoke object URLs when the selection changes or the form unmounts.
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  // ActionForm resets the form after a successful upload; drop the previews with it.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const clear = () => setPreviews([]);
    form.addEventListener("reset", clear);
    return () => form.removeEventListener("reset", clear);
  }, []);

  function onFilesChange(files: FileList | null) {
    setPreviews(
      Array.from(files ?? []).map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    );
  }

  const count = previews.length;

  return (
    <ActionForm
      action={uploadGalleryImages}
      success={count === 1 ? "Image uploaded" : `${count} images uploaded`}
      resetOnSuccess
      className="space-y-3"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="categoryId" value={categoryId} />

      <label
        htmlFor={`files-${categoryId}`}
        className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-background px-4 py-5 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      >
        <ImagePlus className="size-6" />
        <span className="font-medium">
          {count > 0 ? `${count} image${count === 1 ? "" : "s"} selected — click to change` : "Click to choose images"}
        </span>
        <span className="text-xs">You can select several files at once</span>
      </label>
      <input
        ref={inputRef}
        id={`files-${categoryId}`}
        type="file"
        name="files"
        multiple
        accept="image/*"
        required
        onChange={(e) => onFilesChange(e.target.files)}
        className="sr-only"
      />

      {count > 0 && (
        <ul className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6 lg:grid-cols-8">
          {previews.map((p) => (
            <li key={p.url} className="aspect-square overflow-hidden rounded border border-border bg-muted">
              {/* Local blob: URLs can't go through next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} title={p.name} className="size-full object-cover" />
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor={`capEn-${categoryId}`} className="text-sm font-medium">
            Caption (English)
          </label>
          <input
            id={`capEn-${categoryId}`}
            name="captionEn"
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor={`capMl-${categoryId}`} className="text-sm font-medium">
            Caption (Malayalam)
          </label>
          <input
            id={`capMl-${categoryId}`}
            name="captionMl"
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={count === 0}>
        {count > 1 ? `Upload ${count} images` : "Upload"}
      </Button>
    </ActionForm>
  );
}
