import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GTEC Thodupuzha — Education Centre",
    short_name: "GTEC Thodupuzha",
    description:
      "G-TEC EDUCATION, Thodupuzha — IT, Multimedia, Accounting & Language courses",
    start_url: "/en",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b2d5e",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192-maskable.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshots/mobile.png",
        sizes: "375x812",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
    categories: ["education", "business"],
  };
}
