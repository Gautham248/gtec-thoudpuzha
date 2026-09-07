"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitEnquiry, type EnquiryPayload } from "@/lib/enquiry";
import { CourseSelect } from "./CourseSelect";
import type { PublicCourse } from "@/lib/courses";
import { Sparkles, Send, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
export type { EnquiryPayload };

type EnquiryFormProps = {
  source: string;
  courses: PublicCourse[];
  onSubmit?: (payload: EnquiryPayload) => void | Promise<void>;
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

export function EnquiryForm({ source, courses, onSubmit }: EnquiryFormProps) {
  const t = useTranslations("enquiry");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const resetForm = useCallback(() => {
    setFullName("");
    setPhone("");
    setCourse("");
    setMessage("");
    setErrors({});
  }, []);

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
      } catch {
        setStatus("error");
      }
    },
    [source, fullName, phone, course, message, validate, onSubmit, resetForm],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-6 sm:p-7 shadow-xl transition-all duration-300 hover:border-primary/30"
      aria-label={`Enquiry form${source ? ` — ${source}` : ""}`}
      noValidate
    >
      {/* Decorative top gradient line */}
      <div className="absolute top-0 inset-x-0 h-1 rounded-t-2xl bg-gradient-to-r from-primary via-primary/80 to-amber-500" />

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-sm font-bold text-primary mb-2.5">
          <Sparkles className="size-3.5 text-amber-500" />
          <span>Quick Admission Enquiry</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {t("heading")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {t("description")}
        </p>
      </div>

      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor={`enquiry-fullName-${source}`} className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("fullName")}
        </Label>
        <Input
          id={`enquiry-fullName-${source}`}
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          aria-invalid={errors.fullName ? "true" : "false"}
          aria-describedby={errors.fullName ? `enquiry-fullName-${source}-error` : undefined}
          placeholder={t("fullNamePlaceholder")}
          required
          className="rounded-xl border-border/80 bg-background/80 px-3.5 py-2 text-sm transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />
        {errors.fullName && (
          <p id={`enquiry-fullName-${source}-error`} className="text-sm font-semibold text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{errors.fullName}</span>
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div className="space-y-1.5">
        <Label htmlFor={`enquiry-phone-${source}`} className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("phoneNumber")}
        </Label>
        <Input
          id={`enquiry-phone-${source}`}
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(sanitizePhone(e.target.value))}
          aria-invalid={errors.phone ? "true" : "false"}
          aria-describedby={errors.phone ? `enquiry-phone-${source}-error` : undefined}
          placeholder={t("phonePlaceholder")}
          required
          className="rounded-xl border-border/80 bg-background/80 px-3.5 py-2 text-sm transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />
        {errors.phone && (
          <p id={`enquiry-phone-${source}-error`} className="text-sm font-semibold text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{errors.phone}</span>
          </p>
        )}
      </div>

      {/* Course Selection */}
      <div className="space-y-1.5">
        <Label htmlFor={`enquiry-course-${source}`} className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("courseInterested")}
        </Label>
        <CourseSelect
          courses={courses}
          mode="single"
          value={course}
          onChange={(v: string | string[]) => { if (typeof v === "string") setCourse(v); }}
          id={`enquiry-course-${source}`}
          error={errors.course}
        />
      </div>

      {/* Message Query */}
      <div className="space-y-1.5">
        <Label htmlFor={`enquiry-message-${source}`} className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("messageQuery")}
        </Label>
        <textarea
          id={`enquiry-message-${source}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder={t("messagePlaceholder")}
          className="w-full resize-none rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </div>

      {/* Notifications */}
      {status === "success" && (
        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <span>{t("success")}</span>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm font-semibold text-destructive">
          <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
          <span>{t("error")}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-2xl bg-primary py-3 text-sm sm:text-base font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 cursor-pointer"
      >
        {status === "submitting" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-5 animate-spin" />
            <span>{t("submitting")}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Send className="size-5" />
            <span>{t("submit")}</span>
          </span>
        )}
      </Button>

      {/* Trust & Privacy Guarantee Note */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-1.5">
        <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
        <span>100% Confidential • Instant response from counsellor</span>
      </div>
    </form>
  );
}

