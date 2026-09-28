"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ChevronDown, CircleCheck, Loader2 } from "lucide-react";
import { submitEnquiry, type EnquiryPayload } from "@/lib/enquiry";
import { CourseSelect, type CourseOption } from "./CourseSelect";
export type { EnquiryPayload };

type EnquiryFormProps = {
  source: string;
  courses: CourseOption[];
  onSubmit?: (payload: EnquiryPayload) => void | Promise<void>;
  /** Course id to preselect (e.g. on a course page). */
  defaultCourseId?: string;
  /** "card" = standalone white card; "bare" = no chrome, for use inside a modal/panel. */
  variant?: "card" | "bare";
  /** Hide the built-in heading when the container already provides one. */
  hideHeading?: boolean;
  /** Called after a successful submission. */
  onSuccess?: () => void;
};

type FormErrors = {
  fullName?: string;
  phone?: string;
  course?: string;
};

function indianMobileRegex() {
  return /^[6-9]\d{9}$/;
}

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

const labelClass = "text-sm font-semibold text-[#344054]";
const fieldClass =
  "w-full rounded-2xl border border-[#EAECF0] bg-[#F9FAFB] px-4 text-sm text-[#111827] outline-none transition placeholder:text-[#98A2B3] focus:border-[#1753DA] focus:bg-white focus:ring-4 focus:ring-[#1753DA]/15 aria-[invalid=true]:border-red-400 aria-[invalid=true]:bg-red-50/40";
const errorClass = "text-xs font-medium text-red-600";

export function EnquiryForm({
  source,
  courses,
  onSubmit,
  defaultCourseId,
  variant = "card",
  hideHeading = false,
  onSuccess,
}: EnquiryFormProps) {
  const t = useTranslations("enquiry");
  const initialCourse =
    defaultCourseId && courses.some((c) => c.id === defaultCourseId)
      ? defaultCourseId
      : "";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState(initialCourse);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const resetForm = useCallback(() => {
    setFullName("");
    setPhone("");
    setCourse(initialCourse);
    setMessage("");
    setErrors({});
  }, [initialCourse]);

  const validate = useCallback((): boolean => {
    const nextErrors: FormErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = t("validationNameRequired");
    }

    if (!phone) {
      nextErrors.phone = t("validationPhoneRequired");
    } else if (!indianMobileRegex().test(phone)) {
      nextErrors.phone = t("validationPhoneInvalid");
    }

    if (!course) {
      nextErrors.course = t("validationCourseRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [fullName, phone, course, t]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus("idle");

      if (!validate()) {
        return;
      }

      const payload: EnquiryPayload = {
        source,
        fullName: fullName.trim(),
        phone,
        course,
        message: message.trim(),
      };

      try {
        setStatus("submitting");
        if (onSubmit) {
          await onSubmit(payload);
        } else {
          await submitEnquiry(payload);
        }
        setStatus("success");
        resetForm();
        onSuccess?.();
      } catch {
        setStatus("error");
      }
    },
    [
      source,
      fullName,
      phone,
      course,
      message,
      validate,
      onSubmit,
      resetForm,
      onSuccess,
    ],
  );

  const fieldId = (name: string) => `enquiry-${name}-${source}`;

  return (
    <form
      onSubmit={handleSubmit}
      className={
        variant === "card"
          ? "flex flex-col gap-5 rounded-[28px] border border-[#EAECF0] bg-white p-6 shadow-[0_24px_60px_-24px_rgba(11,18,32,0.25)] sm:p-8"
          : "flex flex-col gap-5"
      }
      aria-label={`Enquiry form${source ? ` — ${source}` : ""}`}
      noValidate
    >
      {!hideHeading && (
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#111827]">
            {t("heading")}
          </h2>
          <p className="mt-1 text-sm text-[#667085]">{t("description")}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={fieldId("fullName")} className={labelClass}>
            {t("fullName")}
          </label>
          <input
            id={fieldId("fullName")}
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            aria-invalid={errors.fullName ? "true" : "false"}
            aria-describedby={
              errors.fullName ? `${fieldId("fullName")}-error` : undefined
            }
            placeholder={t("fullNamePlaceholder")}
            className={`${fieldClass} h-12`}
            required
          />
          {errors.fullName && (
            <p id={`${fieldId("fullName")}-error`} className={errorClass}>
              {errors.fullName}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={fieldId("phone")} className={labelClass}>
            {t("phoneNumber")}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#667085]">
              +91
            </span>
            <input
              id={fieldId("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(sanitizePhone(e.target.value))}
              aria-invalid={errors.phone ? "true" : "false"}
              aria-describedby={
                errors.phone ? `${fieldId("phone")}-error` : undefined
              }
              placeholder={t("phonePlaceholder")}
              className={`${fieldClass} h-12 pl-12`}
              required
            />
          </div>
          {errors.phone && (
            <p id={`${fieldId("phone")}-error`} className={errorClass}>
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId("course")} className={labelClass}>
          {t("courseInterested")}
        </label>
        <div className="relative">
          <CourseSelect
            courses={courses}
            mode="single"
            value={course}
            onChange={(v: string | string[]) => {
              if (typeof v === "string") setCourse(v);
            }}
            id={fieldId("course")}
            error={errors.course}
            selectClassName={`${fieldClass} h-12 appearance-none pr-11`}
          />
          <ChevronDown
            className="pointer-events-none absolute right-4 top-6 size-4 -translate-y-1/2 text-[#667085]"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId("message")} className={labelClass}>
          {t("messageQuery")}
        </label>
        <textarea
          id={fieldId("message")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder={t("messagePlaceholder")}
          className={`${fieldClass} resize-none py-3`}
        />
      </div>

      {status === "success" && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-2xl bg-[#ECFDF3] p-4 text-sm font-medium text-[#067647]"
        >
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("success")}
        </div>
      )}
      {status === "error" && (
        <div
          role="alert"
          className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {t("error")}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group flex w-full items-center justify-between gap-4 rounded-full bg-[#0B1220] py-2 pl-6 pr-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
      >
        <span>{status === "submitting" ? t("submitting") : t("submit")}</span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1753DA] transition-transform group-hover:scale-105">
          {status === "submitting" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowUpRight className="size-4" aria-hidden="true" />
          )}
        </span>
      </button>
    </form>
  );
}
