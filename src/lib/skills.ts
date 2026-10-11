"use server";

import { db } from "@/db";
import { skill } from "@/db/schema";

export type SkillDto = {
  id: string;
  label: string;
  status: string;
  createdAt: Date;
};

export async function getApprovedSkills(): Promise<SkillDto[]> {
  return db.query.skill.findMany({
    where: (s, { eq }) => eq(s.status, "APPROVED"),
    orderBy: (s, { asc }) => asc(s.label),
    columns: { id: true, label: true, status: true, createdAt: true },
  });
}

export async function getSkillsByIds(ids: string[]): Promise<SkillDto[]> {
  if (ids.length === 0) return [];
  return db.query.skill.findMany({
    where: (s, { inArray }) => inArray(s.id, ids),
    columns: { id: true, label: true, status: true, createdAt: true },
  });
}

export async function createPENDINGSkill(label: string): Promise<SkillDto> {
  const [created] = await db
    .insert(skill)
    .values({ label, status: "PENDING" })
    .returning({
      id: skill.id,
      label: skill.label,
      status: skill.status,
      createdAt: skill.createdAt,
    });
  return created;
}
