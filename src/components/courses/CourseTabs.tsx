"use client";

import { useState, type ReactNode } from "react";

export interface CourseTabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export function CourseTabs({ tabs }: { tabs: CourseTabItem[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  if (!active) return null;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Course information"
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto rounded-full bg-muted/60 p-1.5 w-fit max-w-full"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-8 sm:mt-10">
        {active.content}
      </div>
    </div>
  );
}
