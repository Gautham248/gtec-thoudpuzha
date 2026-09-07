import { Resend } from "resend";

export const resend = new Resend(
  process.env.RESEND_API_KEY || "re_123456789_placeholder"
);

export interface EnquiryNotificationInput {
  name: string;
  phone: string;
  course: string;
  message: string | null;
  source: string;
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
}

export function getCentreStaffEmails(): string[] {
  const raw = process.env.CENTRE_STAFF_NOTIFICATION_EMAILS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function sendEnquiryNotification(
  input: EnquiryNotificationInput,
): Promise<void> {
  const { EnquiryNotificationEmail } = await import(
    "@/emails/EnquiryNotification"
  );

  const to = getCentreStaffEmails();
  if (to.length === 0) {
    console.warn(
      "[email] No Centre Staff notification addresses configured; skipping send.",
    );
    return;
  }

  await resend.emails.send({
    from: getFromEmail(),
    to,
    subject: `New enquiry from ${input.name}`,
    react: EnquiryNotificationEmail(input),
  });
}

export interface EmployerModerationNotificationInput {
  companyName: string;
  contactPersonName: string;
  employerEmail: string;
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
}

export async function sendEmployerModerationNotification(
  input: EmployerModerationNotificationInput,
): Promise<void> {
  const { EmployerModerationNotification } = await import(
    "@/emails/EmployerModerationNotification"
  );

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: input.employerEmail,
      subject:
        input.status === "APPROVED"
          ? `Employer registration approved — ${input.companyName}`
          : `Employer registration update — ${input.companyName}`,
      react: EmployerModerationNotification({
        companyName: input.companyName,
        contactPersonName: input.contactPersonName,
        status: input.status,
        rejectionReason: input.rejectionReason,
      }),
    });
  } catch (error) {
    console.error("[email] failed to send moderation notification:", error);
  }
}

export interface JobPostingModerationNotificationInput {
  jobTitle: string;
  companyName: string;
  employerEmail: string;
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
}

export async function sendJobPostingModerationNotification(
  input: JobPostingModerationNotificationInput,
): Promise<void> {
  const { JobPostingModerationNotification } = await import(
    "@/emails/JobPostingModerationNotification"
  );

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: input.employerEmail,
      subject:
        input.status === "APPROVED"
          ? `Job posting approved — ${input.jobTitle}`
          : `Job posting update — ${input.jobTitle}`,
      react: JobPostingModerationNotification({
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        status: input.status,
        rejectionReason: input.rejectionReason,
      }),
    });
  } catch (error) {
    console.error(
      "[email] failed to send job posting moderation notification:",
      error,
    );
  }
}
