import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { siteConfig } from "@/lib/site";

interface FooterContactProps {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  centreName?: string;
}

export function FooterContact({
  phone = "+91 97442 21113",
  email = "thodupuzha.idk@gteceducation.com",
  address = siteConfig.locationAddress,
  centreName = "THODUPUZHA",
}: FooterContactProps) {
  const displayPhone = phone || "+91 97442 21113";
  const rawPhone = displayPhone.replace(/[^0-9+]/g, "");
  const displayEmail = email || "thodupuzha.idk@gteceducation.com";
  const displayAddress = address || siteConfig.locationAddress;

  return (
    <div className="space-y-7 text-left">
      {/* Brand & Logo */}
      <div className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-3.5"
          aria-label="G-TEC EDUCATION Thodupuzha"
        >
          <div className="relative h-12 w-16 aspect-[1600/1094] shrink-0 overflow-hidden rounded-lg bg-white p-1">
            <Image
              src="/icons/gtec.png"
              alt="G-TEC Logo"
              fill
              sizes="64px"
              className="object-contain p-0.5"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white">
                G-TEC <span className="text-sky-300">{centreName}</span>
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Education
            </p>
          </div>
        </Link>

        {/* Tagline */}
        <div className="flex items-center gap-2 text-sm font-medium text-sky-300">
          <Sparkles className="size-3.5" aria-hidden="true" />
          <span>Learn | Build | Grow</span>
        </div>
      </div>

      {/* Description */}
      <p className="max-w-sm text-[15px] leading-relaxed text-white/70">
        G-TEC EDUCATION, Thodupuzha is committed to delivering industry-focused
        training and practical skills that help students build successful
        careers.
      </p>

      {/* Contact Details with Icons */}
      <div className="space-y-4 text-[15px]">
        {/* Phone */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 text-sky-300">
            <Phone className="size-4" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-white/50">
              Phone
            </p>
            <a
              href={`tel:${rawPhone}`}
              className="block font-medium text-white transition-colors hover:text-sky-300"
            >
              {displayPhone}
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 text-sky-300">
            <Mail className="size-4" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-white/50">
              Email
            </p>
            <a
              href={`mailto:${displayEmail}`}
              className="block font-medium text-white transition-colors hover:text-sky-300"
            >
              {displayEmail}
            </a>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 text-sky-300">
            <MapPin className="size-4" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-white/50">
              Address
            </p>
            <p className="leading-snug text-white/70">{displayAddress}</p>
            <a
              href={siteConfig.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 transition-colors hover:text-white"
            >
              <span>Find Us on Google Maps</span>
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* ISO Quality Badge */}
      <div className="flex items-center gap-2 text-sm text-white/60">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        <span>ISO 9001:2015 Certified Training Centre</span>
      </div>
    </div>
  );
}
