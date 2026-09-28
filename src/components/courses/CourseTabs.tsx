"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface CourseTabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export function CourseTabs({ tabs }: { tabs: CourseTabItem[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  if (!active) return null;

  const selectTab = (id: string) => {
    setActiveId(id);
    tabRefs.current[id]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    let next = index;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    const nextTab = tabs[next];
    if (nextTab) selectTab(nextTab.id);
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Course information"
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto rounded-full bg-muted/60 p-1.5 w-fit max-w-full"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === active.id;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              type="button"
              role="tab"
              id={`course-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`course-tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
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

      <div
        role="tabpanel"
        id={`course-tabpanel-${active.id}`}
        aria-labelledby={`course-tab-${active.id}`}
        tabIndex={0}
        className="mt-8 sm:mt-10"
      >
        {active.content}
      </div>
    </div>
  );
}
