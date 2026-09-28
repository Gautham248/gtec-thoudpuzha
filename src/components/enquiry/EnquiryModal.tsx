"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useLocale } from "next-intl";
import {
  CircleCheck,
  Clock,
  MessageCircle,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { EnquiryForm } from "@/components/shared/EnquiryForm";
import type { CourseOption } from "@/components/shared/CourseSelect";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { siteConfig } from "@/lib/site";
import { EASE_OUT } from "@/components/motion/Reveal";

export type EnquiryCourse = CourseOption & { slug: string };

export interface OpenEnquiryOptions {
  /** Preselect by course id… */
  courseId?: string;
  /** …or by slug (for places that only know the slug). */
  courseSlug?: string;
  /** Stored with the enquiry so admins can see where it came from. */
  source?: string;
}

interface EnquiryModalContextValue {
  openEnquiry: (options?: OpenEnquiryOptions) => void;
}

const EnquiryModalContext = createContext<EnquiryModalContextValue | null>(
  null,
);

/** Opens the app-wide enquiry modal; falls back to the home enquiry section. */
export function useEnquiryModal(): EnquiryModalContextValue {
  const ctx = useContext(EnquiryModalContext);
  return (
    ctx ?? {
      openEnquiry: () => {
        window.location.assign("/#enquiry");
      },
    }
  );
}

const COPY = {
  en: {
    title: "Start your journey with G-TEC",
    subtitle:
      "Tell us a little about yourself and our counsellors will call you back shortly.",
    perks: [
      "100% Placement Assistance",
      "ISO 9001:2015 Certified",
      "Flexible Batch Timings",
    ],
    orReach: "Prefer to talk now?",
    whatsapp: "WhatsApp",
    close: "Close enquiry form",
    successTitle: "Enquiry received!",
    successText: "Thank you — our team will contact you soon.",
    done: "Done",
  },
  ml: {
    title: "G-TEC-നൊപ്പം നിങ്ങളുടെ യാത്ര ആരംഭിക്കൂ",
    subtitle: "നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക, ഞങ്ങളുടെ കൗൺസിലർമാർ ഉടൻ വിളിക്കും.",
    perks: [
      "100% പ്ലേസ്മെന്റ് സഹായം",
      "ISO 9001:2015 സർട്ടിഫൈഡ്",
      "സൗകര്യപ്രദമായ ബാച്ച് സമയങ്ങൾ",
    ],
    orReach: "ഇപ്പോൾ സംസാരിക്കണോ?",
    whatsapp: "WhatsApp",
    close: "എൻക്വയറി ഫോം അടയ്ക്കുക",
    successTitle: "എൻക്വയറി ലഭിച്ചു!",
    successText: "നന്ദി — ഞങ്ങളുടെ ടീം ഉടൻ ബന്ധപ്പെടും.",
    done: "ശരി",
  },
} as const;

const PERK_ICONS = [ShieldCheck, ShieldCheck, Clock];

const subscribeNoop = () => () => {};

export function EnquiryModalProvider({
  courses,
  children,
}: {
  courses: EnquiryCourse[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<OpenEnquiryOptions>({});
  // Bumped per open so the form remounts with fresh state and preselection.
  const [session, setSession] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const openEnquiry = useCallback((opts: OpenEnquiryOptions = {}) => {
    setOptions(opts);
    setSubmitted(false);
    setSession((s) => s + 1);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ openEnquiry }), [openEnquiry]);

  const defaultCourseId =
    options.courseId ??
    (options.courseSlug
      ? courses.find((c) => c.slug === options.courseSlug)?.id
      : undefined);

  return (
    <EnquiryModalContext.Provider value={value}>
      {children}
      <EnquiryDialog
        open={open}
        onClose={close}
        courses={courses}
        defaultCourseId={defaultCourseId}
        source={options.source ?? "enquiry-modal"}
        session={session}
        submitted={submitted}
        onSubmitted={() => setSubmitted(true)}
      />
    </EnquiryModalContext.Provider>
  );
}

function EnquiryDialog({
  open,
  onClose,
  courses,
  defaultCourseId,
  source,
  session,
  submitted,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  courses: EnquiryCourse[];
  defaultCourseId?: string;
  source: string;
  session: number;
  submitted: boolean;
  onSubmitted: () => void;
}) {
  const locale = useLocale();
  const copy = locale === "ml" ? COPY.ml : COPY.en;
  const titleId = useId();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const containerRef = useFocusTrap(open);

  // Esc to close + lock page scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <motion.div
            key="enquiry-backdrop"
            // Above the floating header (z-50) and everything else.
            className="fixed inset-0 z-100 flex items-stretch justify-center bg-[#0B1220]/60 backdrop-blur-sm md:items-center md:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <motion.div
              ref={containerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative flex h-svh w-full flex-col overflow-hidden bg-white md:h-auto md:max-h-[min(92svh,780px)] md:max-w-4xl md:rounded-[32px] md:shadow-2xl"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.35, ease: EASE_OUT },
              }}
              exit={{
                opacity: 0,
                y: 24,
                scale: 0.98,
                transition: { duration: 0.2, ease: "easeIn" },
              }}
            >
              {/* Close: first focusable, pinned to the panel so it never scrolls away. */}
              <button
                type="button"
                onClick={onClose}
                aria-label={copy.close}
                className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex size-11 items-center justify-center rounded-full bg-white text-[#111827] shadow-lg ring-1 ring-black/5 transition hover:bg-[#F2F4F7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1753DA]/30"
              >
                <X className="size-5" aria-hidden="true" />
              </button>

              <div className="flex-1 overflow-y-auto overscroll-contain md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                {/* Blue intro panel: compact header on mobile, full column on desktop */}
                <div className="relative overflow-hidden bg-linear-to-b from-[#1759CF] from-[6.49%] to-[#0A2B68] px-6 pb-8 pt-[max(1.75rem,env(safe-area-inset-top))] pr-20 text-white md:flex md:flex-col md:p-10">
                  <div
                    className="pointer-events-none absolute -bottom-20 -right-24 h-40 w-[140%] -rotate-45 bg-[#810000]/70 md:h-48"
                    aria-hidden="true"
                  />
                  <p className="relative text-sm font-bold tracking-tight text-white/70">
                    G-TEC {siteConfig.centreName}
                  </p>
                  <h2
                    id={titleId}
                    className="relative mt-3 text-2xl font-bold leading-tight tracking-[-0.04em] md:text-3xl"
                  >
                    {copy.title}
                  </h2>
                  <p className="relative mt-3 text-sm leading-relaxed text-white/80">
                    {copy.subtitle}
                  </p>

                  <ul className="relative mt-6 hidden flex-col gap-3 md:flex">
                    {copy.perks.map((perk, i) => {
                      const Icon = PERK_ICONS[i] ?? ShieldCheck;
                      return (
                        <li
                          key={perk}
                          className="flex items-center gap-3 text-sm font-semibold"
                        >
                          <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                          {perk}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="relative mt-6 md:mt-auto md:pt-10">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                      {copy.orReach}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`tel:${siteConfig.phoneNumber}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/25"
                      >
                        <Phone className="size-4" aria-hidden="true" />
                        {siteConfig.phoneNumber}
                      </a>
                      <a
                        href={`https://wa.me/${siteConfig.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-[#2EB700] px-4 py-2 text-sm font-semibold transition hover:bg-[#28a100]"
                      >
                        <MessageCircle className="size-4" aria-hidden="true" />
                        {copy.whatsapp}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Form / success */}
                <div className="px-6 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:p-10 md:pt-16">
                  {submitted ? (
                    <div className="flex flex-col items-center py-10 text-center">
                      <span className="flex size-16 items-center justify-center rounded-full bg-[#ECFDF3] text-[#12B76A]">
                        <CircleCheck className="size-8" aria-hidden="true" />
                      </span>
                      <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#111827]">
                        {copy.successTitle}
                      </h3>
                      <p className="mt-2 text-sm text-[#667085]">
                        {copy.successText}
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-8 rounded-full bg-[#0B1220] px-8 py-3 text-sm font-semibold text-white transition hover:bg-black"
                      >
                        {copy.done}
                      </button>
                    </div>
                  ) : (
                    <EnquiryForm
                      key={session}
                      source={source}
                      courses={courses}
                      defaultCourseId={defaultCourseId}
                      variant="bare"
                      onSuccess={onSubmitted}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}

type EnquiryButtonProps = Omit<ComponentPropsWithoutRef<"button">, "onClick"> &
  OpenEnquiryOptions;

/** A button that opens the enquiry modal. Safe to render from server components. */
export function EnquiryButton({
  courseId,
  courseSlug,
  source,
  type = "button",
  ...props
}: EnquiryButtonProps) {
  const { openEnquiry } = useEnquiryModal();
  return (
    <button
      type={type}
      {...props}
      onClick={() => openEnquiry({ courseId, courseSlug, source })}
    />
  );
}
