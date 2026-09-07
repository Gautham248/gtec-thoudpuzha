"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitEmployerRegistration } from "./actions";
import type { IndustrySector, EmployeeCountRange } from "@prisma/client";

const SECTORS = [
  { value: "IT_SOFTWARE", key: "IT_SOFTWARE" },
  { value: "EDUCATION_TRAINING", key: "EDUCATION_TRAINING" },
  { value: "HEALTHCARE", key: "HEALTHCARE" },
  { value: "BANKING_FINANCE", key: "BANKING_FINANCE" },
  { value: "MANUFACTURING", key: "MANUFACTURING" },
  { value: "RETAIL", key: "RETAIL" },
  { value: "HOSPITALITY", key: "HOSPITALITY" },
  { value: "CONSTRUCTION", key: "CONSTRUCTION" },
  { value: "TELECOMMUNICATION", key: "TELECOMMUNICATION" },
  { value: "OTHER", key: "OTHER" },
] as const;

const EMPLOYEE_RANGES = [
  { value: "RANGE_1_10", key: "RANGE_1_10" },
  { value: "RANGE_11_50", key: "RANGE_11_50" },
  { value: "RANGE_51_200", key: "RANGE_51_200" },
  { value: "RANGE_200_PLUS", key: "RANGE_200_PLUS" },
] as const;

interface RegistrationFormProps {
  initialData?: {
    companyName: string;
    industrySector: IndustrySector;
    contactPersonName: string;
    designation: string;
    phone: string;
    email: string;
    companyAddress: string;
    hasWebsite: boolean;
    websiteUrl?: string | null;
    employeeCountRange: EmployeeCountRange;
    aboutCompany: string;
  };
  onSubmit?: (
    formData: FormData,
  ) => Promise<{ success: false; error: string } | undefined>;
}

export function RegistrationForm({
  initialData,
  onSubmit,
}: RegistrationFormProps) {
  const t = useTranslations("employerRegister");
  const st = useTranslations("sector");
  const ert = useTranslations("employeeRange");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [companyName, setCompanyName] = useState(initialData?.companyName ?? "");
  const [industrySector, setIndustrySector] = useState(initialData?.industrySector ?? "");
  const [contactPersonName, setContactPersonName] = useState(initialData?.contactPersonName ?? "");
  const [designation, setDesignation] = useState(initialData?.designation ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [companyAddress, setCompanyAddress] = useState(initialData?.companyAddress ?? "");
  const [hasWebsite, setHasWebsite] = useState<"yes" | "no" | "">(
    initialData ? (initialData.hasWebsite ? "yes" : "no") : "",
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.websiteUrl ?? "");
  const [employeeCountRange, setEmployeeCountRange] = useState(initialData?.employeeCountRange ?? "");
  const [aboutCompany, setAboutCompany] = useState(initialData?.aboutCompany ?? "");

  const isEdit = Boolean(initialData);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError("");

      const fd = new FormData();
      fd.set("companyName", companyName);
      fd.set("industrySector", industrySector);
      fd.set("contactPersonName", contactPersonName);
      fd.set("designation", designation);
      fd.set("phone", phone);
      fd.set("email", email);
      fd.set("companyAddress", companyAddress);
      fd.set("hasWebsite", hasWebsite);
      if (hasWebsite === "yes") {
        fd.set("websiteUrl", websiteUrl);
      }
      fd.set("employeeCountRange", employeeCountRange);
      fd.set("aboutCompany", aboutCompany);

      try {
        const submitFn = onSubmit ?? submitEmployerRegistration;
        const result = await submitFn(fd);
        if (result && !result.success) {
          setError(result.error);
          setSubmitting(false);
        } else {
          setSubmitting(false);
          if (isEdit) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }
        }
      } catch {
        setError(t("error"));
        setSubmitting(false);
      }
    },
    [
      companyName,
      industrySector,
      contactPersonName,
      designation,
      phone,
      email,
      companyAddress,
      hasWebsite,
      websiteUrl,
      employeeCountRange,
      aboutCompany,
      t,
      onSubmit,
      isEdit,
    ],
  );

  return (
    <div className="mx-auto max-w-2xl p-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-semibold">
          {isEdit ? t("editHeading") : t("heading")}
        </h1>
        <p className="text-muted-foreground">
          {isEdit ? t("editDescription") : t("description")}
        </p>
      </div>

      {error && (
        <div
          className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary" role="status">
          {t("saved")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Company Name */}
        <div className="space-y-1.5">
          <Label htmlFor="companyName">{t("companyName")}</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        {/* Industry Sector */}
        <div className="space-y-1.5">
          <Label htmlFor="industrySector">{t("industrySector")}</Label>
          <Select
            value={industrySector}
            onValueChange={(v) => setIndustrySector(v ?? "")}
            disabled={submitting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("selectIndustry")} />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {st(s.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contact Person Name */}
        <div className="space-y-1.5">
          <Label htmlFor="contactPersonName">{t("contactPersonName")}</Label>
          <Input
            id="contactPersonName"
            value={contactPersonName}
            onChange={(e) => setContactPersonName(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        {/* Designation */}
        <div className="space-y-1.5">
          <Label htmlFor="designation">{t("designation")}</Label>
          <Input
            id="designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        {/* Company Address */}
        <div className="space-y-1.5">
          <Label htmlFor="companyAddress">{t("companyAddress")}</Label>
          <Input
            id="companyAddress"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        {/* Website - radio group */}
        <fieldset className="space-y-1.5">
          <span className="flex items-center gap-2 text-sm leading-none font-medium select-none">
            {t("website")}
          </span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="hasWebsite"
                value="yes"
                checked={hasWebsite === "yes"}
                onChange={() => setHasWebsite("yes")}
                className="accent-blue-600"
                disabled={submitting}
              />
              {t("addLink")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="hasWebsite"
                value="no"
                checked={hasWebsite === "no"}
                onChange={() => {
                  setHasWebsite("no");
                  setWebsiteUrl("");
                }}
                className="accent-blue-600"
                disabled={submitting}
              />
              {t("noWebsite")}
            </label>
          </div>
        </fieldset>

        {/* Website URL (shown only when "yes" is selected) */}
        {hasWebsite === "yes" && (
          <div className="space-y-1.5">
            <Label htmlFor="websiteUrl">{t("websiteUrl")}</Label>
            <Input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder={t("websiteUrlPlaceholder")}
              required
              disabled={submitting}
            />
          </div>
        )}

        {/* Employee Count Range */}
        <div className="space-y-1.5">
          <Label htmlFor="employeeCountRange">{t("employeeCount")}</Label>
          <Select
            value={employeeCountRange}
            onValueChange={(v) => setEmployeeCountRange(v ?? "")}
            disabled={submitting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("selectRange")} />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYEE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {ert(r.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* About Company */}
        <div className="space-y-1.5">
          <Label htmlFor="aboutCompany">{t("aboutCompany")}</Label>
          <textarea
            id="aboutCompany"
            value={aboutCompany}
            onChange={(e) => setAboutCompany(e.target.value)}
            required
            disabled={submitting}
            className="h-24 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 resize-y"
            data-slot="input"
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t("submitting") : isEdit ? t("saveChanges") : t("register")}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          Your company data is handled in accordance with our{" "}
          <Link href="/privacy" className="underline hover:no-underline">Privacy Policy</Link>
          {" "}and{" "}
          <Link href="/terms" className="underline hover:no-underline">Terms of Service</Link>.
        </p>
      </form>
    </div>
  );
}
