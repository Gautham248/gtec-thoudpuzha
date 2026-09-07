"use client";

import { useState, useCallback } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupStudentRecord, finalizeStudentVerification } from "./actions";

type Step = "form" | "password" | "verifying" | "otp" | "done" | "error";

const MIN_PASSWORD_LENGTH = 8;

function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export default function StudentSignUpPage() {
  const { signUp } = useSignUp();
  const locale = useLocale();
  const t = useTranslations("studentVerification");
  const signUpT = useTranslations("signUp");

  const [step, setStep] = useState<Step>("form");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [alreadyLinked, setAlreadyLinked] = useState(false);
  const [studentRecordId, setStudentRecordId] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLookup = useCallback(async () => {
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("studentId", studentId);
      formData.set("phone", phone);
      const result = await lookupStudentRecord(formData);

      if (!result.success) {
        setError(result.error);
        setAlreadyLinked("alreadyLinked" in result && result.alreadyLinked === true);
        setStep("error");
        return;
      }

      setStudentRecordId(result.studentRecordId);
      setVerifiedEmail(result.email);
      setStep("password");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  }, [studentId, phone]);

  const handleSetPassword = useCallback(
    async (password: string) => {
      if (!isValidPassword(password)) {
        setError(t("passwordTooShort", { minLength: MIN_PASSWORD_LENGTH }));
        return;
      }

      setSubmitting(true);
      setError("");

      try {
        if (!signUp) {
          setError("Verification service is not ready. Please try again.");
          setStep("error");
          return;
        }

        // Per Clerk's documented custom email/password flow, password()
        // is the call that STARTS the sign-up attempt (it plays the role
        // create() plays for other strategies) — it must come before
        // sendEmailCode()/verifyEmailCode(), not after. Calling it after
        // email is already verified re-arms email as unverified, which
        // is what caused finalize() to fail with "Cannot finalize sign-up
        // without a created session" earlier.
        let { error } = await signUp.password({
          password,
          emailAddress: verifiedEmail,
        });
        if (error) {
          setError(error.message);
          setStep("error");
          return;
        }

        setStep("verifying");

        ({ error } = await signUp.verifications.sendEmailCode());
        if (error) {
          setError(error.message);
          setStep("error");
          return;
        }

        setStep("otp");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setError(message);
        setStep("error");
      } finally {
        setSubmitting(false);
      }
    },
    [signUp, verifiedEmail, t],
  );

  const handleVerifyOtp = useCallback(
    async (code: string) => {
      if (!signUp) return;

      setSubmitting(true);
      setError("");

      try {
        let { error } = await signUp.verifications.verifyEmailCode({ code });

        if (error) {
          setError(error.message);
          return;
        }

        ({ error } = await signUp.finalize());
        if (error) {
          setError(error.message);
          return;
        }

        await finalizeStudentVerification(studentRecordId);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Verification failed. Please try again.";
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [signUp, studentRecordId],
  );

  if (step === "password") {
    return (
      <PasswordForm
        onSubmit={handleSetPassword}
        submitting={submitting}
        error={error}
        minLength={MIN_PASSWORD_LENGTH}
        t={t}
      />
    );
  }

  if (step === "otp") {
    return <OtpForm onVerify={handleVerifyOtp} submitting={submitting} error={error} t={t} />;
  }

  const isError = step === "error";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-semibold">{t("heading")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        {isError && (
          <div
            className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm text-accent"
            role="alert"
          >
            <p>{error}</p>
            {!alreadyLinked && (
              <div className="mt-3 flex gap-3">
                <a
                  href="https://wa.me/yournumber"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
                >
                  {t("whatsapp")}
                </a>
                <a
                  href="tel:+919999999999"
                  className="inline-flex items-center gap-1 rounded-md bg-muted-foreground px-3 py-1.5 text-sm font-medium text-white hover:bg-foreground/10"
                >
                  {t("callCentre")}
                </a>
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="studentId">{t("studentId")}</Label>
            <Input
              id="studentId"
              name="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder={t("studentIdPlaceholder")}
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              required
              disabled={submitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t("verifying") : t("verifyDetails")}
          </Button>
        </form>

        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            {t("noStudentId")}{" "}
            <Link href={`/${locale}/contact`} className="underline">
              {t("contactCentre")}
            </Link>
            .
          </p>
          <p>
            {signUpT("alreadyHaveAccount")}{" "}
            <Link href={`/${locale}/sign-in`} className="font-semibold text-primary underline">
              {signUpT("signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function OtpForm({
  onVerify,
  submitting,
  error,
  t,
}: {
  onVerify: (code: string) => Promise<void>;
  submitting: boolean;
  error: string;
  t: (key: string) => string;
}) {
  const [code, setCode] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-semibold">{t("verifyYourEmail")}</h1>
          <p className="text-muted-foreground">{t("otpDescription")}</p>
        </div>

        {error && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onVerify(code);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="otp">{t("verificationCode")}</Label>
            <Input
              id="otp"
              name="otp"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("otpPlaceholder")}
              required
              disabled={submitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t("verifying") : t("verifyCode")}
          </Button>
        </form>
      </div>
    </div>
  );
}

function PasswordForm({
  onSubmit,
  submitting,
  error,
  minLength,
  t,
}: {
  onSubmit: (password: string) => Promise<void>;
  submitting: boolean;
  error: string;
  minLength: number;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatchError, setMismatchError] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-semibold">{t("setPasswordHeading")}</h1>
          <p className="text-muted-foreground">{t("setPasswordDescription")}</p>
        </div>

        {(error || mismatchError) && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
          >
            {mismatchError || error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMismatchError("");
            if (password !== confirmPassword) {
              setMismatchError(t("passwordMismatch"));
              return;
            }
            onSubmit(password);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={minLength}
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={minLength}
              required
              disabled={submitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t("settingPassword") : t("continueButton")}
          </Button>
        </form>
      </div>
    </div>
  );
}