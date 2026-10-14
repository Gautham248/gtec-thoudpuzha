"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const PANEL_SELECTOR = "[data-gallery-panel]";

function panels() {
  return Array.from(document.querySelectorAll<HTMLDetailsElement>(PANEL_SELECTOR));
}

/**
 * Filter + expand/collapse controls for the category panels below it.
 * The panels are server-rendered <details> elements, so this works on the DOM
 * directly instead of owning their open state (which then survives refreshes).
 */
export function GalleryToolbar({ total }: { total: number }) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(total);

  function filter(value: string) {
    setQuery(value);
    const q = value.trim().toLowerCase();
    let shown = 0;
    for (const panel of panels()) {
      const match = !q || (panel.dataset.name ?? "").includes(q);
      panel.hidden = !match;
      if (match) shown++;
    }
    setVisible(shown);
  }

  function setAll(open: boolean) {
    for (const panel of panels()) {
      if (!panel.hidden) panel.open = open;
    }
  }

  return (
    <div className="sticky top-14 z-30 -mx-4 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 md:top-0 lg:-mx-8 lg:px-8">
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => filter(e.target.value)}
          placeholder="Filter categories…"
          aria-label="Filter categories"
          className="w-full rounded border border-border bg-background py-2 pl-8 pr-3 text-sm"
        />
      </div>
      <span className="text-sm text-muted-foreground">
        {visible} of {total}
      </span>
      <Button type="button" size="sm" variant="outline" onClick={() => setAll(true)}>
        Expand all
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => setAll(false)}>
        Collapse all
      </Button>
    </div>
  );
}
