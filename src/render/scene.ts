import type { WeatherEffectsQuality, WeatherPrefs, WeatherState } from "../types";
import { clamp, weatherSignature } from "../shared";

export type RGB = [number, number, number];

export interface SceneProfile {
  signature: string;
  // sky gradient
  skyTop: RGB;
  skyMid: RGB;
  skyBottom: RGB;
  // celestial bodies
  showSun: boolean;
  sunColor: RGB;
  sunRadius: number;
  sunY: number;
  showMoon: boolean;
  moonColor: RGB;
  moonRadius: number;
  moonY: number;
  // stars
  showStars: boolean;
  starDensity: number;
  starColor: RGB;
  // clouds
  cloudCount: number;
  cloudOpacity: number;
  cloudColor: RGB;
  cloudShade: RGB;
  cloudSpeed: number;
  cloudCoverage: number;
  // precipitation
  precipKind: "none" | "rain" | "snow";
  precipCount: number;
  precipColor: RGB;
  precipOpacity: number;
  precipSpeed: number;
  precipAngle: number;
  // fog
  fogOpacity: number;
  fogColor: RGB;
  fogBands: number;
  // lightning
  lightningEnabled: boolean;
  lightningColor: RGB;
  // wind dust
  dustOpacity: number;
  dustColor: RGB;
  // atmosphere
  vignetteOpacity: number;
  bloomStrength: number;
  ambientGlow: RGB;
  ambientGlowOpacity: number;
  // perf
  qualityScale: number;
  fps: number;
  reducedMotion: boolean;
  paused: boolean;
}

const PALETTE_BASE: Record<
  string,
  { skyTop: RGB; skyMid: RGB; skyBottom: RGB; ambientGlow: RGB; vignette: number }
> = {
  dawn: {
    skyTop: [40, 35, 76],
    skyMid: [196, 117, 122],
    skyBottom: [248, 198, 154],
    ambientGlow: [255, 184, 130],
    vignette: 0.18,
  },
  day: {
    skyTop: [101, 156, 220],
    skyMid: [156, 196, 240],
    skyBottom: [212, 230, 246],
    ambientGlow: [255, 242, 210],
    vignette: 0.1,
  },
  dusk: {
    skyTop: [42, 38, 84],
    skyMid: [182, 88, 116],
    skyBottom: [240, 156, 110],
    ambientGlow: [255, 158, 110],
    vignette: 0.22,
  },
  night: {
    skyTop: [10, 14, 32],
    skyMid: [22, 28, 56],
    skyBottom: [40, 50, 86],
    ambientGlow: [120, 138, 188],
    vignette: 0.34,
  },
  storm: {
    skyTop: [22, 26, 42],
    skyMid: [50, 56, 76],
    skyBottom: [78, 84, 102],
    ambientGlow: [180, 196, 226],
    vignette: 0.32,
  },
  mist: {
    skyTop: [124, 138, 156],
    skyMid: [172, 184, 200],
    skyBottom: [202, 212, 222],
    ambientGlow: [220, 226, 232],
    vignette: 0.18,
  },
  snow: {
    skyTop: [128, 152, 188],
    skyMid: [184, 200, 220],
    skyBottom: [224, 232, 244],
    ambientGlow: [232, 240, 252],
    vignette: 0.16,
  },
};

const QUALITY_SCALE: Record<WeatherEffectsQuality, { scale: number; fps: number }> = {
  lite: { scale: 0.62, fps: 28 },
  standard: { scale: 1.0, fps: 32 },
  cinematic: { scale: 1.35, fps: 36 },
};

function tint(rgb: RGB, factor: number): RGB {
  return [
    clamp(rgb[0] * factor, 0, 255),
    clamp(rgb[1] * factor, 0, 255),
    clamp(rgb[2] * factor, 0, 255),
  ];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  const k = clamp(t, 0, 1);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

export function buildSceneProfile(state: WeatherState, prefs: WeatherPrefs, reducedMotion: boolean): SceneProfile {
  const { scale, fps } = QUALITY_SCALE[prefs.qualityMode] ?? QUALITY_SCALE.standard;
  const intensityMul = clamp(prefs.intensity, 0.25, 1.5);
  const intensity = clamp(state.intensity, 0, 1);
  const palette = PALETTE_BASE[state.palette] ?? PALETTE_BASE.day;

  let skyTop = [...palette.skyTop] as RGB;
  let skyMid = [...palette.skyMid] as RGB;
  let skyBottom = [...palette.skyBottom] as RGB;

  // Cloud cover darkens the sky and pushes mid/bottom toward grey.
  const cloudPaletteMul = state.condition === "storm" ? 0.6 : state.condition === "rain" ? 0.78 : state.condition === "cloudy" ? 0.86 : 1;
  if (cloudPaletteMul < 1) {
    skyTop = tint(skyTop, cloudPaletteMul);
    skyMid = tint(skyMid, cloudPaletteMul + 0.04);
    skyBottom = tint(skyBottom, cloudPaletteMul + 0.08);
  }

  // Celestial logic
  const isNight = state.palette === "night" || state.palette === "storm";
  const isDay = state.palette === "day" || state.palette === "dawn" || state.palette === "dusk";
  const cloudCoverage =
    state.condition === "storm" ? 0.95 :
    state.condition === "rain" ? 0.78 :
    state.condition === "cloudy" ? 0.6 :
    state.condition === "snow" ? 0.55 :
    state.condition === "fog" ? 0.45 :
    0.12;

  const showSun = isDay && cloudCoverage < 0.5 && state.condition !== "fog";
  const showMoon = isNight && cloudCoverage < 0.7 && state.condition !== "storm";
  const showStars = (isNight || state.palette === "dawn" || state.palette === "dusk") && cloudCoverage < 0.6 && state.condition !== "fog";

  const sunColor: RGB = state.palette === "dawn"
    ? [255, 198, 152]
    : state.palette === "dusk"
    ? [255, 156, 102]
    : [255, 232, 188];
  const moonColor: RGB = [220, 226, 244];

  // Cloud shading
  const cloudColor: RGB = state.condition === "storm"
    ? [60, 64, 78]
    : state.palette === "dawn"
    ? [232, 196, 198]
    : state.palette === "dusk"
    ? [218, 174, 174]
    : state.palette === "night"
    ? [60, 70, 96]
    : state.palette === "snow"
    ? [228, 234, 244]
    : state.palette === "mist"
    ? [196, 206, 220]
    : [232, 238, 248];
  const cloudShade = tint(cloudColor, 0.62);

  // Precipitation
  let precipKind: SceneProfile["precipKind"] = "none";
  let precipCount = 0;
  let precipColor: RGB = [180, 200, 230];
  let precipSpeed = 0;
  let precipAngle = 0;

  if (state.condition === "rain" || state.condition === "storm") {
    precipKind = "rain";
    const base = state.condition === "storm" ? 320 : 200;
    precipCount = Math.round(base * (0.6 + intensity * 0.9) * scale);
    precipColor = state.condition === "storm" ? [170, 192, 220] : [196, 214, 236];
    precipSpeed = state.condition === "storm" ? 1700 : 1200;
    precipAngle = state.condition === "storm" ? 0.35 : 0.22;
  } else if (state.condition === "snow") {
    precipKind = "snow";
    precipCount = Math.round(180 * (0.55 + intensity * 0.85) * scale);
    precipColor = [240, 246, 254];
    precipSpeed = 220;
    precipAngle = 0.08;
  }

  // Fog
  const fogOpacity =
    state.condition === "fog" ? 0.55 + intensity * 0.3 :
    state.condition === "storm" ? 0.18 + intensity * 0.12 :
    state.condition === "rain" ? 0.12 + intensity * 0.1 :
    state.condition === "snow" ? 0.16 + intensity * 0.12 :
    0;
  const fogColor: RGB = state.palette === "night" || state.palette === "storm"
    ? [80, 92, 116]
    : state.palette === "snow"
    ? [220, 232, 246]
    : [196, 208, 222];
  const fogBands = Math.max(2, Math.round(4 * scale));

  // Lightning
  const lightningEnabled = state.condition === "storm" && intensity > 0.4;
  const lightningColor: RGB = [240, 244, 255];

  // Stars
  const starDensity = showStars ? clamp(0.4 + (1 - cloudCoverage) * 0.6, 0, 1) : 0;
  const starColor: RGB = state.palette === "dawn" || state.palette === "dusk" ? [232, 226, 252] : [240, 244, 255];

  // Clouds count
  const cloudCount = Math.max(0, Math.round(
    (state.condition === "storm" ? 14 : state.condition === "rain" ? 10 : state.condition === "cloudy" ? 9 : state.condition === "snow" ? 6 : state.condition === "fog" ? 4 : 3) *
    scale,
  ));
  const cloudOpacity = clamp(0.55 + cloudCoverage * 0.3, 0, 1);
  const cloudSpeed = state.condition === "storm" ? 0.06 : state.condition === "rain" ? 0.04 : 0.02;

  // Sun/moon Y position (relative 0..1)
  const sunY = state.palette === "dawn" ? 0.7 : state.palette === "dusk" ? 0.72 : 0.32;
  const moonY = 0.28;
  const sunRadius = 64;
  const moonRadius = 48;

  // Wind dust (visible only on clear-ish scenes)
  const dustOpacity =
    (state.condition === "clear" || state.condition === "cloudy") && state.palette !== "night"
      ? 0.16 + intensity * 0.18
      : 0.06;
  const dustColor: RGB = mix(palette.ambientGlow, [240, 240, 240], 0.35);

  // Atmosphere
  const vignetteOpacity = palette.vignette + (state.condition === "storm" ? 0.12 : 0) + (state.condition === "fog" ? 0.06 : 0);
  const bloomStrength = state.condition === "clear" ? 0.6 : state.condition === "storm" ? 0.2 : 0.35;
  const ambientGlow = palette.ambientGlow as RGB;
  const ambientGlowOpacity = clamp(0.18 + intensity * 0.12, 0, 0.5);

  return {
    signature: weatherSignature(state),
    skyTop,
    skyMid,
    skyBottom,
    showSun,
    sunColor,
    sunRadius,
    sunY,
    showMoon,
    moonColor,
    moonRadius,
    moonY,
    showStars,
    starDensity,
    starColor,
    cloudCount,
    cloudOpacity,
    cloudColor,
    cloudShade,
    cloudSpeed,
    cloudCoverage,
    precipKind,
    precipCount,
    precipColor,
    precipOpacity: clamp(0.65 + intensity * 0.3, 0, 1) * intensityMul,
    precipSpeed,
    precipAngle,
    fogOpacity: fogOpacity * intensityMul,
    fogColor,
    fogBands,
    lightningEnabled,
    lightningColor,
    dustOpacity: dustOpacity * intensityMul * 0.6,
    dustColor,
    vignetteOpacity,
    bloomStrength,
    ambientGlow,
    ambientGlowOpacity,
    qualityScale: scale,
    fps,
    reducedMotion,
    paused: prefs.pauseEffects,
  };
}

export function rgba(rgb: RGB, alpha: number): string {
  return `rgba(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}, ${alpha})`;
}

export function rgb(rgb: RGB): string {
  return `rgb(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])})`;
}
