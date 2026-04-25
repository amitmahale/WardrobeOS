import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wardrobe OS",
    short_name: "Wardrobe OS",
    description: "A practical wardrobe optimizer for outfits, packing, and buy-next decisions.",
    start_url: "/app/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0B1020",
    theme_color: "#B7FF6A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
