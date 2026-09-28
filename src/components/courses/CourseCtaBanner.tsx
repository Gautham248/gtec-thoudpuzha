import { ArrowUpRight, MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { EnquiryButton } from "@/components/enquiry/EnquiryModal";

export function CourseCtaBanner({ courseId }: { courseId?: string } = {}) {
  return (
    <section className="relative overflow-hidden bg-[#0B1220] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-white">
      {/* Decorative wine geometric arcs, consistent with AboutSection */}
      <div
        className="pointer-events-none absolute -bottom-32 -left-20 h-[360px] w-[360px] lg:h-[440px] lg:w-[440px] rounded-tr-[1457px] bg-[#810000]/50 mix-blend-screen"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-32 -right-16 h-[340px] w-[340px] lg:h-[420px] lg:w-[420px] rounded-tr-[1457px] bg-[#810000]/35 mix-blend-screen"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl text-center z-10">
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.04em] text-white leading-tight">
          Ready to Transform Your Career with G-TEC?
        </h2>
        <p className="mt-4 text-sm sm:text-lg text-white/80 max-w-xl mx-auto">
          Start learning with practical, industry-focused training, certified
          mentors, and 100% dedicated placement support.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <EnquiryButton
            courseId={courseId}
            source="course-cta"
            className="group flex items-center justify-between sm:justify-start gap-4 rounded-full bg-[#0B57D0] hover:bg-[#0a4bb8] pl-6 pr-2 py-2 text-sm sm:text-base font-semibold text-white shadow-lg transition-all active:scale-[0.98]"
          >
            <span>Enroll Now</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-transform group-hover:scale-105">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </EnquiryButton>
          <a
            href={`https://wa.me/${siteConfig.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between sm:justify-start gap-4 rounded-full bg-[#2EB700] hover:bg-[#28a100] pl-6 pr-2 py-2 text-sm sm:text-base font-semibold text-white shadow-lg transition-all active:scale-[0.98]"
          >
            <span>WhatsApp Us</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#067914] text-white transition-transform group-hover:scale-105">
              <MessageCircle className="h-4 w-4" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
