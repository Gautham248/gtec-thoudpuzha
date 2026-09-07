"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { SkillDto } from "@/lib/skills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JobsFilterProps {
  skills: SkillDto[];
}

export function JobsFilter({ skills }: JobsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("jobs");
  const jt = useTranslations("jobType");

  const currentJobType = searchParams.get("jobType") ?? "";
  const currentSkillId = searchParams.get("skillId") ?? "";
  const currentLocation = searchParams.get("location") ?? "";

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const params = new URLSearchParams();

      const jobType = formData.get("jobType");
      const skillId = formData.get("skillId");
      const location = formData.get("location");

      if (jobType) params.set("jobType", jobType.toString());
      if (skillId) params.set("skillId", skillId.toString());
      if (location) params.set("location", location.toString());

      const qs = params.toString();
      router.push(qs ? `?${qs}` : ".");
    },
    [router],
  );

  const handleClear = useCallback(() => {
    router.push(".");
  }, [router]);

  const hasFilters = currentJobType || currentSkillId || currentLocation;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/50 p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="jobType" className="text-sm font-medium text-muted-foreground">
          {t("filterJobType")}
        </label>
        <Select name="jobType" defaultValue={currentJobType}>
          <SelectTrigger id="jobType" className="w-40">
            <SelectValue placeholder={t("allTypes")} />
          </SelectTrigger>
          <SelectContent>
            {(["FULL_TIME", "PART_TIME", "CONTRACT"] as const).map((type) => (
              <SelectItem key={type} value={type}>
                {jt(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="skillId" className="text-sm font-medium text-muted-foreground">
          {t("filterSkill")}
        </label>
        <Select name="skillId" defaultValue={currentSkillId}>
          <SelectTrigger id="skillId" className="w-48">
            <SelectValue placeholder={t("allSkills")} />
          </SelectTrigger>
          <SelectContent>
            {skills.map((skill) => (
              <SelectItem key={skill.id} value={skill.id}>
                {skill.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="location" className="text-sm font-medium text-muted-foreground">
          {t("filterLocation")}
        </label>
        <Input
          id="location"
          name="location"
          defaultValue={currentLocation}
          placeholder={t("locationPlaceholder")}
          className="w-44"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          {t("applyFilters")}
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
          >
            {t("clear")}
          </Button>
        )}
      </div>
    </form>
  );
}
