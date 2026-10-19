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
    <div className="space-y-6 text-left">
      {/* Brand & Logo */}
      <div className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-3.5 group transition-transform duration-200"
          aria-label="G-TEC EDUCATION Thodupuzha"
        >
          <div className="relative h-12 w-16 aspect-[1600/1094] shrink-0 overflow-hidden rounded-lg bg-white/95 p-1 transition-transform duration-300 group-hover:scale-105 shadow-sm">
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
              <span className="text-xl font-black tracking-tight text-white">
                G-TEC <span className="text-sky-400">{centreName}</span>
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Education
            </p>
          </div>
        </Link>

        {/* Tagline */}
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
          <Sparkles className="size-3 text-sky-400" />
          <span>Learn | Build | Grow</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed text-slate-300 max-w-sm">
        G-TEC EDUCATION, Thodupuzha is committed to delivering industry-focused
        training and practical skills that help students build successful
        careers.
      </p>

      {/* Contact Details with Icons */}
      <div className="space-y-3 pt-1 text-sm">
        {/* Phone */}
        <div className="flex items-start gap-3 text-slate-300">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-sky-400 mt-0.5">
            <Phone className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Phone
            </p>
            <a
              href={`tel:${rawPhone}`}
              className="font-semibold text-white hover:text-sky-400 hover:underline transition-colors block"
            >
              {displayPhone}
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-3 text-slate-300">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-sky-400 mt-0.5">
            <Mail className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Email
            </p>
            <a
              href={`mailto:${displayEmail}`}
              className="font-semibold text-white hover:text-sky-400 hover:underline transition-colors block"
            >
              {displayEmail}
            </a>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-3 text-slate-300">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-sky-400 mt-0.5">
            <MapPin className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Address
            </p>
            <p className="font-normal text-slate-300 leading-snug">
              {displayAddress}
            </p>
            <a
              href={siteConfig.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-white hover:underline mt-1.5 transition-colors group"
            >
              <span>Find Us on Google Maps</span>
              <ExternalLink className="size-3 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* ISO Quality Badge */}
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
        <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
        <span className="font-medium">
          ISO 9001:2015 Certified Training Centre
        </span>
      </div>
    </div>
  );
}
