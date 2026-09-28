import {
  BookOpen,
  BrainCircuit,
  Calculator,
  CodeXml,
  Cpu,
  Globe,
  Languages,
  Megaphone,
  Monitor,
  Palette,
  type LucideIcon,
} from "lucide-react";

// Most specific first: a "Python" course inside an "IT & Software" category
// should get the code icon, not the generic monitor.
const ICON_RULES: [RegExp, LucideIcon][] = [
  [
    /\b(accounts?|accounting|finance|tally|gst|taxation|banking)\b/i,
    Calculator,
  ],
  [/\b(ai|artificial|data|machine learning|analytics)\b/i, BrainCircuit],
  [/\b(web|website|full ?stack|front ?end|back ?end)\b/i, Globe],
  [/\b(programming|python|java|coding|developer|development)\b/i, CodeXml],
  [/\b(multimedia|design|graphics?|animation|video|photoshop|vfx)\b/i, Palette],
  [/\b(marketing|seo|social media)\b/i, Megaphone],
  [/\b(hardware|networking|network|cloud)\b/i, Cpu],
  [/\b(english|spoken|language|communication|ielts)\b/i, Languages],
  [/\b(it|software|computer|office)\b/i, Monitor],
];

/** Picks an icon from the course title first, then its category name. */
export function courseIcon(
  titleEn: string,
  categoryNameEn?: string | null,
): LucideIcon {
  for (const text of [titleEn, categoryNameEn ?? ""]) {
    const rule = ICON_RULES.find(([pattern]) => pattern.test(text));
    if (rule) return rule[1];
  }
  return BookOpen;
}
