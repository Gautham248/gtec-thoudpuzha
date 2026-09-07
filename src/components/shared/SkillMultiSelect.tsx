"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import type { SkillDto } from "@/lib/skills";

type SkillMultiSelectProps = {
  skills: SkillDto[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onAddNewSkill: (label: string) => Promise<SkillDto>;
};

export function SkillMultiSelect({
  skills,
  selectedIds,
  onChange,
  onAddNewSkill,
}: SkillMultiSelectProps) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [localSkills, setLocalSkills] = useState<SkillDto[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allSkills = useMemo(
    () => [...skills, ...localSkills],
    [skills, localSkills],
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allSkills.filter(
      (s) =>
        !selectedSet.has(s.id) &&
        s.label.toLowerCase().includes(q),
    );
  }, [search, allSkills, selectedSet]);

  const exactMatch = search.trim()
    ? allSkills.some(
        (s) => s.label.toLowerCase() === search.trim().toLowerCase(),
      )
    : false;

  const selectedSkills = useMemo(
    () => allSkills.filter((s) => selectedSet.has(s.id)),
    [allSkills, selectedSet],
  );

  const addExisting = (skill: SkillDto) => {
    onChange([...selectedIds, skill.id]);
    setSearch("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const remove = (id: string) => {
    onChange(selectedIds.filter((s) => s !== id));
  };

  const addNew = async () => {
    const label = search.trim();
    if (!label) return;
    setAdding(true);
    try {
      const created = await onAddNewSkill(label);
      setLocalSkills((prev) => [...prev, created]);
      onChange([...selectedIds, created.id]);
      setSearch("");
      setOpen(false);
    } finally {
      setAdding(false);
    }
    inputRef.current?.focus();
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        const target = e.target as HTMLElement;
        if (target.closest('[role="listbox"]')) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm">
        {selectedSkills.map((skill) => (
          <span
            key={skill.id}
            className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-sm"
          >
            {skill.label}
            <button
              type="button"
              onClick={() => remove(skill.id)}
              className="ml-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${skill.label}`}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !search && selectedIds.length > 0) {
              remove(selectedIds[selectedIds.length - 1]);
            }
            if (e.key === "Enter" && search.trim()) {
              e.preventDefault();
              if (filtered.length > 0) {
                addExisting(filtered[0]);
              } else if (!exactMatch) {
                addNew();
              }
            }
          }}
          placeholder={selectedIds.length === 0 ? "Type to add skills..." : "Add more..."}
          role="combobox"
          aria-controls="skill-listbox"
          aria-label="Search skills"
          className="min-w-[120px] flex-1 border-none bg-transparent p-0 text-sm outline-none"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
      </div>

      {open && (
        <ul
          id="skill-listbox"
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md"
        >
          {filtered.map((skill) => (
            <li key={skill.id}>
              <button
                type="button"
                role="option"
                aria-selected={selectedSet.has(skill.id)}
                onClick={() => addExisting(skill)}
                className="w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-accent"
              >
                {skill.label}
              </button>
            </li>
          ))}
          {search.trim() && !exactMatch && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={addNew}
                disabled={adding}
                className="w-full rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
              >
                {adding
                  ? "Adding..."
                  : `Add "${search.trim()}" as new skill`}
              </button>
            </li>
          )}
          {search.trim() && filtered.length === 0 && exactMatch && (
            <li className="px-2.5 py-1.5 text-sm text-muted-foreground">
              Skill already selected
            </li>
          )}
          {!search.trim() && selectedIds.length > 0 && (
            <li className="px-2.5 py-1.5 text-sm text-muted-foreground">
              Type to find more skills
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
