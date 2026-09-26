import Link from "next/link";

const categories = [
  { name: "ACCOUNTING & FINANCE", href: "/courses?category=accounting" },
  { name: "IT & SOFTWARE", href: "/courses?category=it-software" },
  { name: "MULTIMEDIA & DESIGN", href: "/courses?category=multimedia" },
  { name: "PROGRAMMING", href: "/courses?category=programming" },
  { name: "WEB DEVELOPMENT", href: "/courses?category=web-dev" },
  { name: "DATASCIENCE & AI", href: "/courses?category=datascience" },
];

export function CourseCategoryStrip() {
  return (
    <section className="relative z-20 w-full bg-[#121926] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="inline-flex items-center justify-center rounded-[75px] bg-[#093C98] hover:bg-[#0b48b5] px-5 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-base lg:text-lg font-semibold tracking-tight text-white shadow-md transition-all hover:scale-105 active:scale-95"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
