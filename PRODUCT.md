# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Prospective students** browsing the public site to discover courses, evaluate the institution, and enroll.
- **Active students** using the authenticated student portal to access academic resources (notes, lectures, assignments, past papers, timetable, progress tracking), manage biodata, and apply for jobs.
- **Job seekers** browsing and applying to vacancies posted by employers.
- **Employers** registering companies, posting vacancies, and searching candidates.
- **Admins (Super Admin / Centre Staff)** managing courses, students, employers, job postings, gallery, news, site settings, and academic resources.

## Product Purpose

GTEC Thodupuzha is the digital platform for the GTEC Education Centre in Thodupuzha, Kerala. It serves as a public marketing site, a student academic portal, a job matching platform, and an admin backend — all in one system. Success means prospective students enroll, active students stay engaged with resources, and employers find qualified candidates.

## Positioning

Three reinforcing differentiators:
- **Industry-aligned job-ready training** — courses designed for placement outcomes with strong employer ties.
- **Comprehensive digital learning platform** — a full student portal with online resources, progress tracking, and job matching that competing centres lack.
- **Local trust and community presence** — established reputation in Thodupuzha with genuine local relationships.

## Operating Context

- Bilingual: English and Malayalam (via next-intl).
- WhatsApp and phone are primary conversion channels for prospective students.
- Employer registration and job posting require admin approval before going live.
- Academic resources, timetable, and progress are managed by staff and accessed by enrolled students.
- Site content (about text, stats, why-choose-us cards, address) is database-driven and editable via admin panel.

## Capabilities and Constraints

- Next.js 16 App Router with TypeScript, Tailwind CSS v4, shadcn/ui, Drizzle ORM (PostgreSQL), Clerk auth.
- Three route groups: `(public)`, `(portal)`, `(admin)` with distinct layouts.
- Fine-grained role-based permissions (Super Admin, Centre Staff) with row-level access control.
- File storage via AWS S3 for media, gallery, and certification partner logos.
- Email via Resend, background jobs via Inngest, monitoring via Sentry.
- No image-based logo exists — brand identity is currently text-based (G-TEC THODUPUZHA) with a monogram placeholder.

## Brand Commitments

- **Name:** GTEC Thodupuzha (GTEC Education Centre, Thodupuzha)
- **Logo colors:** Dark Blue `#003973`, Bright Red `#FF071B`, White `#FEFEFE`
- **Personality:** Professional and trustworthy — credible institution, polished and dignified, not playful or casual.
- **Voice:** Competent, welcoming, clear. Bilingual English/Malayalam with consistent professional tone.

## Evidence on Hand

- Real course offerings, centre address, phone numbers, WhatsApp number (`+919544229992`).
- Certification partner logos stored in S3.
- Site settings including about text, stats, and why-choose-us cards.
- **No real student/employer testimonials or case studies exist.** These must not be fabricated.

## Product Principles

1. **Earn trust through clarity** — every page must communicate competence and reliability at a glance.
2. **One platform, distinct experiences** — public site, student portal, employer portal, and admin each feel cohesive to their audience while sharing a single brand identity.
3. **Conversion is action** — public pages guide visitors to enroll, call, or WhatsApp; portal pages guide students to resources and jobs.
4. **Local relevance** — Malayalam support, local contact details, and regional presence are authentic advantages, not afterthoughts.

## Accessibility & Inclusion

- Bilingual (English / Malayalam) with full i18n coverage.
- WCAG 2.1 AA as baseline for all surfaces.
