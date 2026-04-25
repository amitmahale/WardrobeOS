import { COLOR_HEX, COLOR_NAMES } from "@/lib/constants";
import type { ColorFamily } from "@/lib/types";

export async function resizeImageToDataUrl(file: File, maxSize = 1200, quality = 0.78) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas is not available."));
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = reject;
      image.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function estimateDominantColorFamily(dataUrl: string) {
  return new Promise<ColorFamily>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const sample = 32;
      canvas.width = sample;
      canvas.height = sample;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("navy");
        return;
      }
      ctx.drawImage(image, 0, 0, sample, sample);
      const { data } = ctx.getImageData(0, 0, sample, sample);
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let index = 0; index < data.length; index += 4) {
        const alpha = data[index + 3];
        if (alpha < 40) continue;
        r += data[index];
        g += data[index + 1];
        b += data[index + 2];
        count += 1;
      }
      if (!count) {
        resolve("navy");
        return;
      }
      resolve(nearestColor({ r: r / count, g: g / count, b: b / count }));
    };
    image.onerror = () => resolve("navy");
    image.src = dataUrl;
  });
}

function nearestColor(avg: { r: number; g: number; b: number }) {
  let bestColor: ColorFamily = "navy";
  let bestDistance = Infinity;
  for (const name of COLOR_NAMES) {
    const rgb = hexToRgb(COLOR_HEX[name]);
    const distance = Math.sqrt((avg.r - rgb.r) ** 2 + (avg.g - rgb.g) ** 2 + (avg.b - rgb.b) ** 2);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestColor = name;
    }
  }
  return bestColor;
}

function hexToRgb(hex: string) {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((char) => char + char).join("") : raw;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16)
  };
}
