import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VarshaVani – Monsoon onset & break advisory",
    short_name: "VarshaVani",
    description: "Block-level monsoon onset, dry-spell and heavy-rain outlook with crop advice in English, Hindi and Marathi (prototype, simulated data).",
    start_url: "/farmer",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf6f1",
    theme_color: "#1a4577",
    lang: "en-IN",
    categories: ["weather", "agriculture", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
