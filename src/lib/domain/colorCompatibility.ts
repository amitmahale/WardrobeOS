import type { ColorFamily } from "@/lib/types";

export const COLOR_COMPATIBILITY: Partial<Record<ColorFamily, Partial<Record<ColorFamily, number>>>> = {
  navy: {
    white: 10,
    cream: 10,
    gray: 9,
    charcoal: 8,
    tan: 9,
    khaki: 9,
    olive: 8,
    blue: 8,
    burgundy: 8,
    brown: 8,
    black: 6
  },
  white: {
    navy: 10,
    cream: 8,
    gray: 9,
    charcoal: 9,
    tan: 9,
    khaki: 9,
    olive: 9,
    blue: 9,
    burgundy: 8,
    brown: 8,
    black: 10
  },
  cream: {
    navy: 10,
    white: 8,
    gray: 8,
    charcoal: 7,
    tan: 6,
    khaki: 8,
    olive: 9,
    blue: 8,
    burgundy: 7,
    brown: 8,
    black: 6
  },
  charcoal: {
    navy: 8,
    white: 10,
    cream: 7,
    gray: 8,
    olive: 8,
    blue: 8,
    burgundy: 8,
    brown: 7,
    black: 8,
    tan: 8,
    khaki: 8
  },
  olive: {
    white: 9,
    cream: 9,
    gray: 8,
    navy: 8,
    khaki: 7,
    tan: 7,
    blue: 7,
    burgundy: 7,
    brown: 8,
    black: 7
  },
  tan: {
    navy: 9,
    white: 9,
    cream: 6,
    gray: 7,
    olive: 8,
    blue: 8,
    brown: 8,
    burgundy: 7,
    black: 6,
    charcoal: 8
  },
  khaki: {
    navy: 9,
    white: 9,
    olive: 8,
    blue: 8,
    cream: 8,
    burgundy: 7,
    brown: 8,
    charcoal: 8,
    black: 6
  },
  blue: {
    white: 9,
    navy: 8,
    cream: 8,
    khaki: 8,
    tan: 8,
    olive: 7,
    charcoal: 8,
    burgundy: 7,
    brown: 7
  },
  burgundy: {
    navy: 8,
    gray: 8,
    white: 8,
    charcoal: 8,
    cream: 7,
    brown: 8,
    black: 8,
    tan: 7
  },
  brown: {
    white: 8,
    cream: 8,
    navy: 8,
    olive: 8,
    tan: 8,
    khaki: 8,
    burgundy: 8,
    blue: 7,
    charcoal: 7
  },
  black: {
    white: 10,
    gray: 9,
    burgundy: 8,
    charcoal: 8,
    olive: 7,
    navy: 6,
    brown: 6,
    cream: 6
  },
  gray: {
    navy: 9,
    white: 9,
    charcoal: 8,
    black: 9,
    burgundy: 8,
    olive: 8,
    cream: 8
  },
  camel: {
    navy: 9,
    white: 9,
    cream: 7,
    olive: 8,
    blue: 8,
    charcoal: 7,
    brown: 7
  },
  green: {
    white: 8,
    navy: 8,
    cream: 8,
    tan: 7,
    brown: 8,
    black: 7
  }
};

export function colorCompatibility(a: ColorFamily, b: ColorFamily) {
  if (a === b) return ["navy", "charcoal", "gray", "white", "cream", "ivory", "beige", "stone", "black"].includes(a) ? 8 : 6;
  return COLOR_COMPATIBILITY[a]?.[b] ?? COLOR_COMPATIBILITY[b]?.[a] ?? 5;
}
