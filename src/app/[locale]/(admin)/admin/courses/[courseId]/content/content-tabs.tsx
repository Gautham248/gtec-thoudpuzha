"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { CourseContent, CourseListBlock, BenefitsBlock, BenefitsItem, CourseListItem } from "@/lib/course-content.types";
import { CoursePageContent } from "@/components/courses/CoursePageContent";

interface CourseContentEditorProps {
  courseId: string;
  locale: string;
  courseTitleEn: string;
  courseTitleMl: string | null;
  courseDescriptionEn: string | null;
  courseDescriptionMl: string | null;
  courseCoverImageUrl: string | null;
  initialContent: CourseContent;
}

type Tab = "hero" | "detailed" | "lists" | "benefits" | "preview";

export function CourseContentEditor({
  courseId,
  locale,
  courseTitleEn,
  courseTitleMl,
  courseDescriptionEn,
  courseDescriptionMl,
  courseCoverImageUrl,
  initialContent,
}: CourseContentEditorProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("hero");
  const [content, setContent] = useState<CourseContent>(initialContent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updateContent = useCallback((partial: Partial<CourseContent>) => {
    setContent((prev) => ({ ...prev, ...partial }));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("courseId", courseId);
      formData.append("locale", locale);
      formData.append("contentBlocks", JSON.stringify(content));

      const { saveCourseContent } = await import("./actions");
      await saveCourseContent(formData);
      setMessage({ type: "success", text: "Content saved successfully." });
      router.refresh();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save content.",
      });
    } finally {
      setSaving(false);
    }
  }

  function hasContentForSection(): boolean {
    const hasHero = !!(content.heroTaglineEn || content.overviewEn);
    const hasDetailed = !!(content.detailedContentEn || content.detailedContentImageUrl);
    const hasLists = content.courseLists.length > 0;
    const hasBenefits = !!(content.benefits && content.benefits.items.length > 0);
    return hasHero || hasDetailed || hasLists || hasBenefits;
  }

  return (
    <main className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words min-w-0 flex-1">
          Course Content — {courseTitleEn}
        </h1>
        <div className="flex items-center gap-3 shrink-0">
          {message && (
            <span
              className={`text-sm font-medium ${message.type === "success" ? "text-green-600" : "text-destructive"}`}
            >
              {message.text}
            </span>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm" className="whitespace-nowrap">
            {saving ? "Saving..." : "Save Content"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border overflow-x-auto whitespace-nowrap pb-px scrollbar-none">
        {(["hero", "detailed", "lists", "benefits", "preview"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-2 text-sm font-medium border-b-2 transition-colors shrink-0 ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "hero" && "Hero & Overview"}
            {t === "detailed" && "Detailed Content"}
            {t === "lists" && "Course Lists"}
            {t === "benefits" && "Benefits"}
            {t === "preview" && "Preview"}
          </button>
        ))}
      </div>

      <div className="w-full max-w-3xl overflow-x-hidden">
        {tab === "hero" && (
          <HeroTab content={content} updateContent={updateContent} />
        )}
        {tab === "detailed" && (
          <DetailedTab content={content} updateContent={updateContent} courseId={courseId} locale={locale} />
        )}
        {tab === "lists" && (
          <ListsTab content={content} updateContent={updateContent} />
        )}
        {tab === "benefits" && (
          <BenefitsTab content={content} updateContent={updateContent} />
        )}
        {tab === "preview" && (
          <PreviewTab
            courseTitleEn={courseTitleEn}
            courseTitleMl={courseTitleMl}
            courseDescriptionEn={courseDescriptionEn}
            courseDescriptionMl={courseDescriptionMl}
            courseCoverImageUrl={courseCoverImageUrl}
            content={content}
            hasContent={hasContentForSection()}
          />
        )}
      </div>
    </main>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function HeroTab({
  content,
  updateContent,
}: {
  content: CourseContent;
  updateContent: (partial: Partial<CourseContent>) => void;
}) {
  return (
    <div className="space-y-4">
      <FieldGroup label="Hero Tagline (English)">
        <textarea
          value={content.heroTaglineEn ?? ""}
          onChange={(e) => updateContent({ heroTaglineEn: e.target.value })}
          rows={2}
          maxLength={2000}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          placeholder="e.g. Kickstart your career with real-world accounting skills."
        />
      </FieldGroup>
      <FieldGroup label="Hero Tagline (Malayalam)">
        <textarea
          value={content.heroTaglineMl ?? ""}
          onChange={(e) => updateContent({ heroTaglineMl: e.target.value })}
          rows={2}
          maxLength={2000}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
        />
      </FieldGroup>
      <FieldGroup label="Overview (English)">
        <textarea
          value={content.overviewEn ?? ""}
          onChange={(e) => updateContent({ overviewEn: e.target.value })}
          rows={4}
          maxLength={5000}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          placeholder="A short overview of what this course teaches."
        />
      </FieldGroup>
      <FieldGroup label="Overview (Malayalam)">
        <textarea
          value={content.overviewMl ?? ""}
          onChange={(e) => updateContent({ overviewMl: e.target.value })}
          rows={4}
          maxLength={5000}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
        />
      </FieldGroup>
    </div>
  );
}

function DetailedTab({
  content,
  updateContent,
}: {
  content: CourseContent;
  updateContent: (partial: Partial<CourseContent>) => void;
  courseId: string;
  locale: string;
}) {
  return (
    <div className="space-y-4">
      <FieldGroup label="Detailed Content (English)">
        <textarea
          value={content.detailedContentEn ?? ""}
          onChange={(e) => updateContent({ detailedContentEn: e.target.value })}
          rows={6}
          maxLength={5000}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          placeholder="Long-form content — 'Built for Business - Trained by G-TEC' style."
        />
      </FieldGroup>
      <FieldGroup label="Detailed Content (Malayalam)">
        <textarea
          value={content.detailedContentMl ?? ""}
          onChange={(e) => updateContent({ detailedContentMl: e.target.value })}
          rows={6}
          maxLength={5000}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
        />
      </FieldGroup>
      <FieldGroup label="Content Image URL">
        <input
          type="text"
          value={content.detailedContentImageUrl ?? ""}
          onChange={(e) => updateContent({ detailedContentImageUrl: e.target.value })}
          maxLength={2000}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          placeholder="Media key or URL for the content section image."
        />
      </FieldGroup>
    </div>
  );
}

function ListsTab({
  content,
  updateContent,
}: {
  content: CourseContent;
  updateContent: (partial: Partial<CourseContent>) => void;
}) {
  function updateList(index: number, updated: CourseListBlock) {
    const lists = [...content.courseLists];
    lists[index] = updated;
    updateContent({ courseLists: lists });
  }

  function removeList(index: number) {
    updateContent({ courseLists: content.courseLists.filter((_, i) => i !== index) });
  }

  function addList() {
    updateContent({
      courseLists: [
        ...content.courseLists,
        { type: "course_list" as const, heading: "", items: [] },
      ],
    });
  }

  function addItem(listIndex: number) {
    const list = { ...content.courseLists[listIndex] };
    list.items = [...list.items, { code: "", name: "" }];
    updateList(listIndex, list);
  }

  function updateItem(listIndex: number, itemIndex: number, item: CourseListItem) {
    const list = { ...content.courseLists[listIndex] };
    list.items = [...list.items];
    list.items[itemIndex] = item;
    updateList(listIndex, list);
  }

  function removeItem(listIndex: number, itemIndex: number) {
    const list = { ...content.courseLists[listIndex] };
    list.items = list.items.filter((_, i) => i !== itemIndex);
    updateList(listIndex, list);
  }

  function updateHeading(listIndex: number, heading: string) {
    const list = { ...content.courseLists[listIndex] };
    list.heading = heading;
    updateList(listIndex, list);
  }

  return (
    <div className="space-y-6">
      {content.courseLists.map((list, listIdx) => (
        <div key={listIdx} className="rounded border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <FieldGroup label="List Heading">
              <input
                type="text"
                value={list.heading}
                onChange={(e) => updateHeading(listIdx, e.target.value)}
                maxLength={500}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g. G-TEC Diploma Courses"
              />
            </FieldGroup>
            <Button
              type="button"
              size="xs"
              variant="destructive"
              onClick={() => removeList(listIdx)}
            >
              Remove List
            </Button>
          </div>

          {list.items.map((item, itemIdx) => (
            <div key={itemIdx} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="block text-sm font-medium">Code</label>
                <input
                  type="text"
                  value={item.code}
                  onChange={(e) =>
                    updateItem(listIdx, itemIdx, { ...item, code: e.target.value })
                  }
                  maxLength={200}
                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                  placeholder="e.g. PDIFAS"
                />
              </div>
              <div className="flex-[2] space-y-1">
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    updateItem(listIdx, itemIdx, { ...item, name: e.target.value })
                  }
                  maxLength={500}
                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                  placeholder="e.g. Professional Diploma in Indian, Foreign and SAP Accounting"
                />
              </div>
              <Button
                type="button"
                size="icon-xs"
                variant="outline"
                onClick={() => removeItem(listIdx, itemIdx)}
                aria-label="Remove item"
              >
                ×
              </Button>
            </div>
          ))}

          <Button type="button" size="xs" variant="outline" onClick={() => addItem(listIdx)}>
            + Add Item
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addList}>
        + Add List
      </Button>
    </div>
  );
}

function BenefitsTab({
  content,
  updateContent,
}: {
  content: CourseContent;
  updateContent: (partial: Partial<CourseContent>) => void;
}) {
  const benefits = content.benefits ?? { type: "benefits" as const, items: [] };

  function updateBenefits(updated: BenefitsBlock) {
    updateContent({ benefits: updated });
  }

  function updateHeading(heading: string) {
    updateBenefits({ ...benefits, heading });
  }

  function addItem() {
    updateBenefits({ ...benefits, items: [...benefits.items, { textEn: "", textMl: "" }] });
  }

  function updateItem(index: number, item: BenefitsItem) {
    const items = [...benefits.items];
    items[index] = item;
    updateBenefits({ ...benefits, items });
  }

  function removeItem(index: number) {
    updateBenefits({ ...benefits, items: benefits.items.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      <FieldGroup label="Benefits Heading (optional, defaults to translated heading)">
        <input
          type="text"
          value={benefits.heading ?? ""}
          onChange={(e) => updateHeading(e.target.value)}
          maxLength={500}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          placeholder="e.g. Benefits of the course"
        />
      </FieldGroup>

      {benefits.items.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="block text-sm font-medium">English</label>
            <input
              type="text"
              value={item.textEn}
              onChange={(e) => updateItem(idx, { ...item, textEn: e.target.value })}
              maxLength={1000}
              className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
              placeholder="e.g. 100% Job-Oriented Training"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="block text-sm font-medium">Malayalam</label>
            <input
              type="text"
              value={item.textMl ?? ""}
              onChange={(e) => updateItem(idx, { ...item, textMl: e.target.value })}
              maxLength={1000}
              className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
            />
          </div>
          <Button
            type="button"
            size="icon-xs"
            variant="outline"
            onClick={() => removeItem(idx)}
            aria-label="Remove benefit"
          >
            ×
          </Button>
        </div>
      ))}

      <Button type="button" size="xs" variant="outline" onClick={addItem}>
        + Add Benefit
      </Button>
    </div>
  );
}

function PreviewTab({
  courseTitleEn,
  courseTitleMl,
  courseDescriptionEn,
  courseDescriptionMl,
  courseCoverImageUrl,
  content,
  hasContent,
}: {
  courseTitleEn: string;
  courseTitleMl: string | null;
  courseDescriptionEn: string | null;
  courseDescriptionMl: string | null;
  courseCoverImageUrl: string | null;
  content: CourseContent;
  hasContent: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {hasContent
          ? "This is how the course page will look with the current content."
          : "No content sections have been filled yet. The page will show only the course title and description."}
      </p>
      <div className="rounded border border-border p-4 bg-background">
        <CoursePageContent
          titleEn={courseTitleEn}
          titleMl={courseTitleMl}
          descriptionEn={courseDescriptionEn}
          descriptionMl={courseDescriptionMl}
          coverImageUrl={courseCoverImageUrl}
          contentBlocks={content}
          preview
        />
      </div>
    </div>
  );
}
