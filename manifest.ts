import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "JobMatch AI",
    short_name: "JobMatch AI",
    orientation: "portrait",
    scope: "/",
    description: "Tailor your resume and cover letter, build a CV with your photo, practice interviews and find recent jobs.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
