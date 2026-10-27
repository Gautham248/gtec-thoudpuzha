import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";

interface FooterBottomProps {
  currentYear: number;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  whatsappUrl?: string | null;
  googleReviewsUrl?: string | null;
  centreName?: string;
}

export function FooterBottom({
  currentYear,
  facebookUrl = "https://www.facebook.com/share/1FLZXJZ7ux/",
  instagramUrl = "https://www.instagram.com/gtec_thodupuzha/",
  youtubeUrl = "https://www.youtube.com/@gtecthodupuzha",
  whatsappUrl = "https://wa.me/919744221113",
  googleReviewsUrl = "https://www.google.com/maps/search/?api=1&query=G-TEC+EDUCATION+Thodupuzha+reviews",
  centreName = "THODUPUZHA",
}: FooterBottomProps) {
  const effectiveFacebook = facebookUrl ?? null;
  const effectiveInstagram = instagramUrl ?? null;
  const effectiveYoutube = youtubeUrl ?? null;
  const effectiveWhatsapp = whatsappUrl ?? null;
  const effectiveGoogleReviews = googleReviewsUrl ?? null;

  return (
    <div className="border-t border-white/10 py-6 text-sm text-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-center lg:text-left">
          {/* Left: Copyright & Legal */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p>
              &copy; {currentYear} G-TEC {centreName}. All Rights Reserved.
            </p>
            <div className="hidden sm:inline-block text-white/20">|</div>
            <div className="flex items-center gap-3">
              <Link
                href="/privacy"
                data-testid="footer-privacy-link"
                className="transition-colors hover:text-white"
              >
                Privacy Policy
              </Link>
              <span>•</span>
              <Link
                href="/terms"
                data-testid="footer-terms-link"
                className="transition-colors hover:text-white"
              >
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Center: Official Portal Note */}
          <div className="hidden text-xs text-white/40 md:block">
            <p>Official Digital Portal for G-TEC EDUCATION, Thodupuzha</p>
          </div>

          {/* Right: Circular Social Media Icons */}
          <div className="flex items-center gap-1">
            {/* Facebook */}
            {effectiveFacebook && (
              <a
                href={effectiveFacebook}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-facebook-link"
                aria-label="Visit G-TEC Thodupuzha on Facebook"
                className="flex size-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" />
                </svg>
              </a>
            )}

            {/* Instagram */}
            {effectiveInstagram && (
              <a
                href={effectiveInstagram}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-instagram-link"
                aria-label="Follow G-TEC Thodupuzha on Instagram"
                className="flex size-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
            )}

            {/* YouTube */}
            {effectiveYoutube && (
              <a
                href={effectiveYoutube}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-youtube-link"
                aria-label="Subscribe to G-TEC Thodupuzha YouTube Channel"
                className="flex size-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>
            )}

            {/* WhatsApp */}
            {effectiveWhatsapp && (
              <a
                href={effectiveWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-whatsapp-link"
                aria-label="Chat with G-TEC Thodupuzha on WhatsApp"
                className="flex size-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </a>
            )}

            {/* Google Reviews / Maps */}
            {effectiveGoogleReviews && (
              <a
                href={effectiveGoogleReviews}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-google-reviews-link"
                aria-label="Read G-TEC Thodupuzha Google Reviews and Ratings"
                className="flex size-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Star className="size-4 fill-current" />
              </a>
            )}
          </div>
        </div>

        {/* Mobile notice */}
        <div className="mt-3 text-center text-xs text-white/40 md:hidden">
          <p>Official Digital Portal for G-TEC EDUCATION, Thodupuzha</p>
        </div>
      </div>
    </div>
  );
}
