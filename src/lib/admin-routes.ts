import {
  LayoutDashboard,
  GraduationCap,
  BookOpenCheck,
  BookOpen,
  Image,
  Award,
  Newspaper,
  Zap,
  Building2,
  Briefcase,
  Tag,
  FolderOpen,
  ScrollText,
  MessageSquare,
  Calendar,
  Settings,
  PanelBottom,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PermissionKey =
  | "canEditCourses"
  | "canEditGallery"
  | "canEditCertificationPartners"
  | "canEditNewsEvents"
  | "canEditFlashNews"
  | "canProvisionStudents"
  | "canApproveEmployers"
  | "canApproveJobPostings"
  | "canModerateSkillsTaxonomy";

export interface AdminRoute {
  href: string;
  label: string;
  icon: LucideIcon;
  permissionKey?: PermissionKey;
  superAdminOnly?: boolean;
}

export const ADMIN_ROUTES: AdminRoute[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/students",
    label: "Students",
    icon: GraduationCap,
    permissionKey: "canProvisionStudents",
  },
  {
    href: "/admin/students/course-enrollment",
    label: "Course Enrollment",
    icon: BookOpenCheck,
    permissionKey: "canProvisionStudents",
  },
  {
    href: "/admin/courses",
    label: "Courses",
    icon: BookOpen,
    permissionKey: "canEditCourses",
  },
  {
    href: "/admin/gallery",
    label: "Gallery",
    icon: Image,
    permissionKey: "canEditGallery",
  },
  {
    href: "/admin/certification-partners",
    label: "Certification Partners",
    icon: Award,
    permissionKey: "canEditCertificationPartners",
  },
  {
    href: "/admin/news-events",
    label: "News & Events",
    icon: Newspaper,
    permissionKey: "canEditNewsEvents",
  },
  {
    href: "/admin/flash-news",
    label: "Flash News",
    icon: Zap,
    permissionKey: "canEditFlashNews",
  },
  {
    href: "/admin/employers",
    label: "Employers",
    icon: Building2,
    permissionKey: "canApproveEmployers",
  },
  {
    href: "/admin/job-postings",
    label: "Job Postings",
    icon: Briefcase,
    permissionKey: "canApproveJobPostings",
  },
  {
    href: "/admin/skills-taxonomy",
    label: "Skills Taxonomy",
    icon: Tag,
    permissionKey: "canModerateSkillsTaxonomy",
  },
  {
    href: "/admin/academic-resources",
    label: "Academic Resources",
    icon: FolderOpen,
  },
  {
    href: "/admin/audit-log",
    label: "Audit Log",
    icon: ScrollText,
  },
  {
    href: "/admin/enquiries",
    label: "Enquiries",
    icon: MessageSquare,
  },
  {
    href: "/admin/timetable-progress",
    label: "Timetable & Progress",
    icon: Calendar,
  },
  {
    href: "/admin/settings/site",
    label: "Site Settings",
    icon: Settings,
    superAdminOnly: true,
  },
  {
    href: "/admin/settings/footer",
    label: "Footer Settings",
    icon: PanelBottom,
    superAdminOnly: true,
  },
  {
    href: "/admin/staff",
    label: "Staff Management",
    icon: ShieldCheck,
    superAdminOnly: true,
  },
];

export function isRouteVisible(
  route: AdminRoute,
  isSuperAdmin: boolean,
  permissions: Partial<Record<PermissionKey, boolean>>,
): boolean {
  if (isSuperAdmin) return true;
  if (route.superAdminOnly) return false;
  if (route.permissionKey) return permissions[route.permissionKey] === true;
  return true;
}
