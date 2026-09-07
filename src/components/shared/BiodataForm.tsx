"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CourseSelect } from "@/components/shared/CourseSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillMultiSelect } from "@/components/shared/SkillMultiSelect";
import type { PublicCourse } from "@/lib/courses";
import type { SkillDto } from "@/lib/skills";
import { isProfileComplete, type CandidateProfileWithCompletion } from "@/lib/biodata";
import type { BiodataFormData } from "@/app/[locale]/(portal)/portal/student/biodata/actions";
import type { EducationalQualification, PreferredJobType } from "@prisma/client";

const QUALIFICATION_OPTIONS: { value: EducationalQualification; label: string }[] = [
  { value: "SSLC", label: "SSLC / 10th" },
  { value: "PLUS_TWO", label: "Plus Two / 12th" },
  { value: "DIPLOMA", label: "Diploma" },
  { value: "GRADUATE", label: "Graduate" },
  { value: "POST_GRADUATE", label: "Post Graduate" },
  { value: "OTHER", label: "Other" },
];

const JOB_TYPE_OPTIONS: { value: PreferredJobType; label: string }[] = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "WORK_FROM_HOME", label: "Work from Home" },
];

type BiodataFormProps = {
  profile: CandidateProfileWithCompletion | null;
  isVerifiedStudent: boolean;
  courses: PublicCourse[];
  skills: SkillDto[];
  onAddNewSkill: (label: string) => Promise<SkillDto>;
  onSubmit: (data: BiodataFormData) => Promise<void>;
};

export function BiodataForm({
  profile,
  isVerifiedStudent,
  courses,
  skills,
  onAddNewSkill,
  onSubmit,
}: BiodataFormProps) {
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    profile?.dateOfBirth
      ? profile.dateOfBirth.toISOString().split("T")[0]
      : "",
  );
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [courseCompletedIds, setCourseCompletedIds] = useState<string[]>(
    profile?.courseCompletedIds ?? [],
  );
  const [certificationIds, setCertificationIds] = useState<string[]>(
    profile?.certificationIds ?? [],
  );
  const [educationalQualification, setEducationalQualification] = useState<
    EducationalQualification | undefined
  >((profile?.educationalQualification as EducationalQualification) ?? undefined);
  const [yearOfPassing, setYearOfPassing] = useState(
    profile?.yearOfPassing?.toString() ?? "",
  );
  const [address, setAddress] = useState(profile?.address ?? "");
  const [languagesKnownInput, setLanguagesKnownInput] = useState(
    profile?.languagesKnown?.join(", ") ?? "",
  );
  const [skillIds, setSkillIds] = useState<string[]>(
    profile?.skillIds ?? [],
  );
  const [preferredJobLocation, setPreferredJobLocation] = useState(
    profile?.preferredJobLocation ?? "",
  );
  const [preferredJobType, setPreferredJobType] = useState<
    PreferredJobType | undefined
  >((profile?.preferredJobType as PreferredJobType) ?? undefined);
  const [careerObjective, setCareerObjective] = useState(
    profile?.careerObjective ?? "",
  );
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl ?? "");
  const [profileVisible, setProfileVisible] = useState(
    profile?.profileVisible ?? true,
  );
  const [consentAcknowledged, setConsentAcknowledged] = useState(
    !!profile?.id,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getFormData = (): BiodataFormData => ({
    fullName: fullName || undefined,
    dateOfBirth: dateOfBirth || undefined,
    phone: phone || undefined,
    email: email || undefined,
    courseCompletedIds,
    certificationIds,
    educationalQualification,
    yearOfPassing: yearOfPassing ? parseInt(yearOfPassing, 10) : undefined,
    address: address || undefined,
    languagesKnown: languagesKnownInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    skillIds,
    preferredJobLocation: preferredJobLocation || undefined,
    preferredJobType,
    careerObjective: careerObjective || undefined,
    photoUrl: photoUrl || undefined,
    profileVisible,
  });

  const isFirstSave = !profile?.id;

  const complete = useMemo(() => {
    const data: BiodataFormData = {
      fullName: fullName || undefined,
      dateOfBirth: dateOfBirth || undefined,
      phone: phone || undefined,
      email: email || undefined,
      courseCompletedIds,
      certificationIds,
      educationalQualification,
      yearOfPassing: yearOfPassing ? parseInt(yearOfPassing, 10) : undefined,
      address: address || undefined,
      languagesKnown: languagesKnownInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      skillIds,
      preferredJobLocation: preferredJobLocation || undefined,
      preferredJobType,
      careerObjective: careerObjective || undefined,
      photoUrl: photoUrl || undefined,
      profileVisible,
    };
    const profileForCheck: CandidateProfileWithCompletion = {
      id: profile?.id ?? "",
      fullName: data.fullName ?? null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      courseCompletedIds: data.courseCompletedIds,
      certificationIds: data.certificationIds,
      educationalQualification: data.educationalQualification ?? null,
      yearOfPassing: data.yearOfPassing ?? null,
      address: data.address ?? null,
      languagesKnown: data.languagesKnown,
      skillIds: data.skillIds,
      preferredJobLocation: data.preferredJobLocation ?? null,
      preferredJobType: data.preferredJobType ?? null,
      careerObjective: data.careerObjective ?? null,
      photoUrl: data.photoUrl ?? null,
      profileVisible,
      isVerifiedStudent,
      studentRecordId: profile?.studentRecordId ?? null,
    };
    return isProfileComplete(profileForCheck);
  }, [
    fullName,
    dateOfBirth,
    phone,
    email,
    courseCompletedIds,
    certificationIds,
    educationalQualification,
    yearOfPassing,
    address,
    languagesKnownInput,
    skillIds,
    preferredJobLocation,
    preferredJobType,
    careerObjective,
    photoUrl,
    profileVisible,
    isVerifiedStudent,
    profile,
  ]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSubmit(getFormData());
      setSaved(true);
      setConsentAcknowledged(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {isVerifiedStudent ? "Student Biodata" : "Candidate Profile"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Fill in your details below. You can save a partial profile and come
          back later.
        </p>
        {complete && (
          <p className="text-sm font-medium text-primary">
            ✓ Your profile is complete
          </p>
        )}
      </div>

      {/* Personal Information */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Personal Information</h2>

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yearOfPassing">Year of Passing</Label>
            <Input
              id="yearOfPassing"
              type="number"
              min={1950}
              max={2030}
              value={yearOfPassing}
              onChange={(e) => setYearOfPassing(e.target.value)}
              placeholder="e.g. 2024"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address"
            rows={3}
            className="h-auto min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
          />
        </div>
      </section>

      {/* Education */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Education & Qualifications</h2>

        <div className="space-y-1.5">
          <Label htmlFor="educationalQualification">
            Highest Educational Qualification
          </Label>
          <Select
            value={educationalQualification}
            onValueChange={(v) =>
              setEducationalQualification(v as EducationalQualification)
            }
          >
            <SelectTrigger id="educationalQualification" className="w-full">
              <SelectValue placeholder="Select qualification" />
            </SelectTrigger>
            <SelectContent>
              {QUALIFICATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isVerifiedStudent && (
          <>
            <div className="space-y-1.5">
              <Label>Course Completed</Label>
              <CourseSelect
                courses={courses}
                mode="multi"
                value={courseCompletedIds}
                onChange={(v) => setCourseCompletedIds(v as string[])}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="certificationIds">
                Certification Earned
              </Label>
              <CourseSelect
                courses={courses}
                mode="multi"
                value={certificationIds}
                onChange={(v) => setCertificationIds(v as string[])}
              />
            </div>
          </>
        )}
      </section>

      {/* Skills & Preferences */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Skills & Preferences</h2>

        <div className="space-y-1.5">
          <Label>Skills</Label>
          <SkillMultiSelect
            skills={skills}
            selectedIds={skillIds}
            onChange={setSkillIds}
            onAddNewSkill={onAddNewSkill}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="languagesKnown">
            Languages Known
          </Label>
          <Input
            id="languagesKnown"
            value={languagesKnownInput}
            onChange={(e) => setLanguagesKnownInput(e.target.value)}
            placeholder="e.g. English, Malayalam, Hindi (comma separated)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="preferredJobLocation">
              Preferred Job Location
            </Label>
            <Input
              id="preferredJobLocation"
              value={preferredJobLocation}
              onChange={(e) => setPreferredJobLocation(e.target.value)}
              placeholder="e.g. Kochi, Bangalore"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preferredJobType">Preferred Job Type</Label>
            <Select
              value={preferredJobType}
              onValueChange={(v) =>
                setPreferredJobType(v as PreferredJobType)
              }
            >
              <SelectTrigger id="preferredJobType" className="w-full">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="careerObjective">Career Objective</Label>
          <textarea
            id="careerObjective"
            value={careerObjective}
            onChange={(e) => setCareerObjective(e.target.value)}
            placeholder="Briefly describe your career objective"
            rows={3}
            className="h-auto min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
          />
        </div>
      </section>

      {/* Photo */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Profile Photo</h2>

        <div className="space-y-1.5">
          <Label htmlFor="photoUrl">Photo URL (optional)</Label>
          <Input
            id="photoUrl"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="Enter a URL to your profile photo"
          />
        </div>
      </section>

      {/* Profile Visibility */}
      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Profile Visibility</h2>

        <div className="flex items-start gap-3">
          <input
            id="profileVisible"
            type="checkbox"
            checked={profileVisible}
            onChange={(e) => setProfileVisible(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border"
          />
          <div className="space-y-1">
            <Label htmlFor="profileVisible" className="font-medium cursor-pointer">
              Allow employers to search and view my profile
            </Label>
            <p className="text-sm text-muted-foreground">
              When enabled, your profile will appear in employer candidate
              searches. Employers can view your qualifications, skills, and
              career preferences. You can disable this at any time.
            </p>
          </div>
        </div>

        {isFirstSave && !consentAcknowledged && (
          <div className="rounded-md bg-primary/10 p-4 text-sm text-primary dark:bg-primary/20 dark:text-primary-foreground">
            <p className="font-medium">Consent to profile visibility</p>
            <p className="mt-1">
              By saving this profile, you agree to make it visible to
              registered employers searching for candidates. Your contact
              information will be shared with employers who express interest.
              You can change this setting at any time.
            </p>
            <p className="mt-2 text-sm text-primary/80 dark:text-primary-foreground/80">
              Your data is handled in accordance with our{" "}
              <Link href="/privacy" className="underline hover:no-underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
        )}
      </section>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Biodata"}
        </Button>
        {profile?.id && (
          <a
            href={`/api/biodata/${profile.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" type="button">
              Download as PDF
            </Button>
          </a>
        )}
        {saved && (
          <span className="text-sm text-primary">
            ✓ Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
