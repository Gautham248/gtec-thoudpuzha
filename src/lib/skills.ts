"use server";

import { api, run } from "@/server/action";
import type { SkillDto as Skill } from "@/server/routers/public";

export type SkillDto = Skill;

export async function getApprovedSkills(): Promise<SkillDto[]> {
  return run(() => api().public.skills.approved());
}

export async function getSkillsByIds(ids: string[]): Promise<SkillDto[]> {
  return run(() => api().public.skills.byIds(ids));
}

export async function createPENDINGSkill(label: string): Promise<SkillDto> {
  return run(() => api().public.skills.createPending(label));
}
