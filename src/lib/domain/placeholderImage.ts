import { COLOR_HEX } from "@/lib/constants";
import type { ColorFamily, ItemCategory } from "@/lib/types";

type PlaceholderItem = {
  name: string;
  category: ItemCategory;
  primaryColor: ColorFamily;
};

export function createPlaceholderImage(item: PlaceholderItem) {
  const fill = COLOR_HEX[item.primaryColor] || "#65748B";
  const bg = "#F3F1EC";
  let body = "";

  if (item.category === "bottom") {
    body = `
      <path d="M120 42 L186 42 L206 236 L165 236 L154 122 L144 236 L102 236 Z" fill="${fill}" opacity="0.95"/>
      <path d="M132 42 L176 42 L180 76 L128 76 Z" fill="rgba(255,255,255,.18)" />
    `;
  } else if (item.category === "shoes") {
    body = `
      <path d="M85 170 C120 170 134 184 164 184 C192 184 202 194 210 214 L154 214 C124 214 108 206 86 206 C74 206 64 198 64 186 C64 176 72 170 85 170 Z" fill="${fill}"/>
      <path d="M142 146 C170 146 184 158 214 158 C236 158 252 166 258 184 L202 184 C172 184 158 176 132 176 C120 176 112 168 112 158 C112 150 122 146 142 146 Z" fill="${fill}" opacity=".88"/>
    `;
  } else {
    const shoulder = item.category === "layer" || item.category === "outerwear" ? 64 : 76;
    const hem = item.category === "layer" || item.category === "outerwear" ? 224 : 206;
    body = `
      <path d="M105 ${shoulder} L134 38 L176 38 L205 ${shoulder} L238 88 L214 104 L203 ${hem} L107 ${hem} L96 104 L72 88 Z" fill="${fill}" opacity=".96"/>
      <path d="M134 38 L154 58 L176 38" stroke="rgba(255,255,255,.3)" stroke-width="4" fill="none"/>
      <rect x="145" y="64" width="10" height="${Math.max(96, hem - 76)}" rx="5" fill="rgba(255,255,255,.16)"/>
    `;
  }

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 260">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#DCE3EC"/>
      </linearGradient>
    </defs>
    <rect width="310" height="260" rx="26" fill="url(#bg)"/>
    <circle cx="42" cy="42" r="20" fill="rgba(255,255,255,.55)"/>
    <circle cx="270" cy="220" r="34" fill="rgba(255,255,255,.38)"/>
    ${body}
    <rect x="14" y="208" width="282" height="42" rx="16" fill="rgba(255,255,255,.82)"/>
    <text x="26" y="232" fill="#171717" font-size="14" font-family="Inter, Arial" font-weight="800">${escapeXml(item.name)}</text>
    <text x="26" y="248" fill="#6F6F6F" font-size="11" font-family="Inter, Arial">${escapeXml(item.primaryColor)} · ${escapeXml(item.category)}</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
