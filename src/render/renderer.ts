import { clamp, DEFAULT_PREFS, makeDefaultWeatherState } from "../shared";
import type { WeatherCondition, WeatherPalette, WeatherPrefs, WeatherState } from "../types";
import { requestWeatherSprite, type WeatherSpriteKind, type WeatherSpritePalette } from "./assets";
import { getQualityBudget, type WeatherQualityBudget } from "./quality";

type RendererKind = "back" | "front";
type Phase = "dawn" | "day" | "dusk" | "night";
type ResizeObserverHandle = { disconnect(): void };

interface PaletteBase {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  horizon: string;
  sun: string;
  moon: string;
}

interface SceneProfile {
  phase: Phase;
  isNight: boolean;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  horizonGlow: string;
  vignette: string;
  sunColor: string;
  moonColor: string;
  celestialGlow: string;
  celestialAlpha: number;
  starColor: string;
  starAlpha: number;
  cloudLight: string;
  cloudMid: string;
  cloudShadow: string;
  cloudAccent: string;
  fogLight: string;
  fogShadow: string;
  mistColor: string;
  rainColor: string;
  snowColor: string;
  lightningColor: string;
  lightningGlow: string;
  glassTint: string;
  glassGlow: string;
  anchorFarColor: string;
  anchorNearColor: string;
  anchorRimColor: string;
  terrainMistColor: string;
  surfaceLight: string;
  surfaceMid: string;
  surfaceShadow: string;
  overcast: number;
  haze: number;
  fogDensity: number;
  precipitation: number;
  wind: number;
  turbulence: number;
  cloudCeiling: number;
  cloudAlpha: number;
  frontCloudAlpha: number;
  mistAlpha: number;
  frontMistAlpha: number;
  curtainAlpha: number;
  distantPrecipAlpha: number;
  nearPrecipAlpha: number;
  windowOpacity: number;
  glassBlur: number;
  frostOpacity: number;
  horizonLift: number;
  anchorAlpha: number;
  relightAlpha: number;
  occlusionStrength: number;
  contactHazeAlpha: number;
  wetSheenAlpha: number;
  impactAlpha: number;
  runoffAlpha: number;
  accumulationAlpha: number;
  fogCreepAlpha: number;
  condensationAlpha: number;
  distortionAlpha: number;
  shadowSweepAlpha: number;
  thermalShimmerAlpha: number;
  horizonGlintAlpha: number;
  surfaceRelightAlpha: number;
}

interface StarParticle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
}

interface MoteParticle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  driftX: number;
  driftY: number;
  speed: number;
  phase: number;
}

interface SpriteLayer {
  sprite: WeatherSpriteKind;
  palette: WeatherSpritePalette;
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  speed: number;
  driftY: number;
  phase: number;
  rotation: number;
}

interface RainParticle {
  x: number;
  offset: number;
  width: number;
  height: number;
  alpha: number;
  cycle: number;
  drift: number;
  sway: number;
  phase: number;
}

interface SnowParticle {
  x: number;
  offset: number;
  size: number;
  alpha: number;
  cycle: number;
  drift: number;
  sway: number;
  phase: number;
  rotation: number;
}

interface CurtainBand {
  x: number;
  width: number;
  alpha: number;
  slant: number;
  speed: number;
  phase: number;
  blur: number;
}

interface HorizonAnchor {
  sprite: WeatherSpriteKind;
  palette: WeatherSpritePalette;
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  blur: number;
  speed: number;
  parallax: number;
  depth: number;
  relight: number;
}

interface GlassParticle {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  speed: number;
  drift: number;
  phase: number;
}

interface LightningBolt {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  rotation: number;
}

interface LightningEvent {
  start: number;
  duration: number;
  flash: number;
  bolts: LightningBolt[];
}

interface SceneComposition {
  signature: string;
  budget: WeatherQualityBudget;
  profile: SceneProfile;
  stars: StarParticle[];
  motes: MoteParticle[];
  anchors: HorizonAnchor[];
  clouds: SpriteLayer[];
  scud: SpriteLayer[];
  frontClouds: SpriteLayer[];
  fogWisps: SpriteLayer[];
  frontMist: SpriteLayer[];
  rain: RainParticle[];
  snow: SnowParticle[];
  curtains: CurtainBand[];
  curtainTextures: SpriteLayer[];
  contactBands: SpriteLayer[];
  impactBursts: SpriteLayer[];
  runoffSheets: SpriteLayer[];
  accumulationBands: SpriteLayer[];
  fogCreep: SpriteLayer[];
  condensationBlooms: SpriteLayer[];
  glassBeads: GlassParticle[];
  glassRivulets: GlassParticle[];
}

const PALETTE_BASES: Record<WeatherPalette | "storm-night", PaletteBase> = {
  dawn: {
    skyTop: "#1f3558",
    skyMid: "#566fa0",
    skyBottom: "#efa06a",
    horizon: "#ffd3a7",
    sun: "#ffd8a7",
    moon: "#dce7ff",
  },
  day: {
    skyTop: "#4071a9",
    skyMid: "#7ca7de",
    skyBottom: "#dff0ff",
    horizon: "#f7fbff",
    sun: "#fff0be",
    moon: "#dce7ff",
  },
  dusk: {
    skyTop: "#1d1f4a",
    skyMid: "#6a4a77",
    skyBottom: "#ea875c",
    horizon: "#ffccac",
    sun: "#ffbb8b",
    moon: "#e0e6ff",
  },
  night: {
    skyTop: "#040f1b",
    skyMid: "#10263a",
    skyBottom: "#2b4a69",
    horizon: "#7ba0d8",
    sun: "#ffd9a8",
    moon: "#dce6ff",
  },
  storm: {
    skyTop: "#050f19",
    skyMid: "#13273a",
    skyBottom: "#32485d",
    horizon: "#8ba3b6",
    sun: "#c9ddff",
    moon: "#dbe8ff",
  },
  "storm-night": {
    skyTop: "#020910",
    skyMid: "#0a1826",
    skyBottom: "#1e3449",
    horizon: "#6989aa",
    sun: "#c7dbff",
    moon: "#dbe8ff",
  },
  mist: {
    skyTop: "#20313d",
    skyMid: "#5c6d78",
    skyBottom: "#b5c2c8",
    horizon: "#eef4f7",
    sun: "#f9f8ed",
    moon: "#eef4ff",
  },
  snow: {
    skyTop: "#435c76",
    skyMid: "#8398ac",
    skyBottom: "#e4edf6",
    horizon: "#f9fcff",
    sun: "#fff5e6",
    moon: "#eef4ff",
  },
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((segment) => segment + segment)
          .join("")
      : value;
  const parsed = Number.parseInt(normalized, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixHex(a: string, b: string, amount: number): string {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  return rgbToHex(
    left.r + (right.r - left.r) * amount,
    left.g + (right.g - left.g) * amount,
    left.b + (right.b - left.b) * amount,
  );
}

function rgba(hex: string, alpha: number): string {
  const value = hexToRgb(hex);
  return `rgba(${value.r}, ${value.g}, ${value.b}, ${clamp(alpha, 0, 1).toFixed(3)})`;
}

function withLight(hex: string, amount: number): string {
  return mixHex(hex, "#ffffff", amount);
}

function withShade(hex: string, amount: number): string {
  return mixHex(hex, "#05070b", amount);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: number): () => number {
  let current = seed >>> 0;
  return () => {
    current += 0x6d2b79f5;
    let output = current;
    output = Math.imul(output ^ (output >>> 15), output | 1);
    output ^= output + Math.imul(output ^ (output >>> 7), output | 61);
    return ((output ^ (output >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, values: readonly T[]): T {
  return values[Math.floor(rng() * values.length)] ?? values[0];
}

function parseHour(value: string): number | null {
  const match = value.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return null;
  let hour = Number.parseInt(match[1], 10);
  if (!Number.isFinite(hour)) return null;
  const meridiem = (match[3] || "").toUpperCase();
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (meridiem === "PM" && hour < 12) hour += 12;
  return clamp(hour, 0, 23);
}

function resolvePhase(state: WeatherState): Phase {
  if (state.palette === "dawn" || state.palette === "day" || state.palette === "dusk" || state.palette === "night") {
    return state.palette;
  }
  const hour = parseHour(state.time);
  if (hour === null) return state.condition === "storm" ? "night" : "day";
  if (hour < 6) return "night";
  if (hour < 9) return "dawn";
  if (hour < 18) return "day";
  if (hour < 21) return "dusk";
  return "night";
}

function buildSceneProfile(state: WeatherState, effectiveIntensity: number): SceneProfile {
  const phase = resolvePhase(state);
  const intensity = clamp(effectiveIntensity, 0.2, 1.5);
  const isNight = phase === "night";
  const paletteKey =
    state.condition === "storm" && isNight
      ? "storm-night"
      : state.condition === "storm"
        ? "storm"
        : state.condition === "fog"
          ? "mist"
          : state.condition === "snow"
            ? "snow"
            : state.palette;
  const base = PALETTE_BASES[paletteKey];
  let skyTop = base.skyTop;
  let skyMid = base.skyMid;
  let skyBottom = base.skyBottom;
  let horizonGlow = withLight(base.horizon, 0.08);
  let vignette = rgba(withShade(base.skyTop, 0.6), 0.22);
  let cloudLight = withLight(base.skyMid, 0.48);
  let cloudMid = mixHex(base.skyMid, base.skyBottom, 0.34);
  let cloudShadow = withShade(base.skyTop, 0.52);
  let cloudAccent = withLight(base.skyBottom, 0.24);
  let fogLight = withLight(base.skyBottom, 0.56);
  let fogShadow = mixHex(base.skyMid, base.skyTop, 0.62);
  let mistColor = mixHex(base.skyBottom, base.skyMid, 0.28);
  let rainColor = isNight ? "#d4e4ff" : "#bed8ff";
  let snowColor = isNight ? "#e5efff" : "#f8fbff";
  let lightningColor = "#f6fbff";
  let lightningGlow = "#b8dcff";
  let glassTint = rgba(withLight(base.skyMid, 0.3), 0.18);
  let glassGlow = rgba(withLight(base.skyBottom, 0.4), 0.24);
  let anchorFarColor = mixHex(base.skyTop, "#0b1015", 0.56);
  let anchorNearColor = mixHex(base.skyMid, "#0d1218", 0.66);
  let anchorRimColor = rgba(withLight(base.horizon, 0.16), 0.34);
  let terrainMistColor = rgba(withLight(base.skyBottom, 0.12), 0.24);
  let surfaceLight = withLight(base.horizon, 0.18);
  let surfaceMid = mixHex(base.skyBottom, base.horizon, 0.28);
  let surfaceShadow = mixHex(base.skyTop, "#091019", 0.72);
  let celestialAlpha = phase === "day" ? 0.82 : phase === "dawn" || phase === "dusk" ? 0.54 : 0.28;
  let starAlpha = isNight ? 0.82 : phase === "dusk" || phase === "dawn" ? 0.2 : 0;
  let overcast = 0.08;
  let haze = 0.1;
  let fogDensity = 0.04;
  let precipitation = 0;
  let wind = 0.22;
  let turbulence = 0.12;
  let cloudCeiling = 0.18;
  let cloudAlpha = isNight ? 0.2 : 0.28;
  let frontCloudAlpha = 0.06;
  let mistAlpha = 0.08;
  let frontMistAlpha = 0.06;
  let curtainAlpha = 0;
  let distantPrecipAlpha = 0;
  let nearPrecipAlpha = 0;
  let windowOpacity = 0;
  let glassBlur = 0;
  let frostOpacity = 0;
  let horizonLift = 0.14;
  let anchorAlpha = 0.2;
  let relightAlpha = 0.12;
  let occlusionStrength = 0.18;
  let contactHazeAlpha = 0.06;
  let wetSheenAlpha = 0.08;
  let impactAlpha = 0;
  let runoffAlpha = 0;
  let accumulationAlpha = 0;
  let fogCreepAlpha = 0.04;
  let condensationAlpha = 0;
  let distortionAlpha = 0.04;
  let shadowSweepAlpha = 0.04;
  let thermalShimmerAlpha = phase === "day" ? 0.1 : phase === "dawn" || phase === "dusk" ? 0.06 : 0.02;
  let horizonGlintAlpha = phase === "day" ? 0.16 : phase === "dawn" || phase === "dusk" ? 0.24 : 0.04;
  let surfaceRelightAlpha = 0.08;

  switch (state.condition) {
    case "cloudy":
      skyMid = mixHex(base.skyMid, "#8798ab", 0.34);
      skyBottom = mixHex(base.skyBottom, "#a8b8c8", 0.5);
      horizonGlow = withLight(skyBottom, 0.18);
      cloudLight = withLight(skyMid, 0.34);
      cloudMid = mixHex(skyMid, skyBottom, 0.24);
      cloudShadow = withShade(skyTop, 0.42);
      cloudAccent = withLight(skyBottom, 0.14);
      fogLight = withLight(skyBottom, 0.28);
      fogShadow = mixHex(skyMid, skyTop, 0.58);
      celestialAlpha = 0.16;
      starAlpha = isNight ? 0.03 : 0;
      overcast = 0.52;
      haze = 0.16;
      fogDensity = 0.12;
      wind = 0.28;
      turbulence = 0.22;
      cloudCeiling = 0.48;
      cloudAlpha = 0.78;
      frontCloudAlpha = 0.12;
      mistAlpha = 0.14;
      frontMistAlpha = 0.08;
      anchorFarColor = mixHex(skyTop, "#11161c", 0.54);
      anchorNearColor = mixHex(skyMid, "#121820", 0.64);
      anchorRimColor = rgba(withLight(skyBottom, 0.12), 0.22);
      terrainMistColor = rgba(withLight(skyBottom, 0.04), 0.18);
      surfaceLight = mixHex(skyBottom, "#e6edf4", 0.24);
      surfaceMid = mixHex(skyBottom, "#9aa9b8", 0.42);
      surfaceShadow = mixHex(skyTop, "#0e151d", 0.72);
      horizonLift = 0.18;
      anchorAlpha = 0.34;
      relightAlpha = 0.14;
      occlusionStrength = 0.28;
      contactHazeAlpha = 0.05;
      wetSheenAlpha = 0.02;
      fogCreepAlpha = 0.06;
      shadowSweepAlpha = 0.12;
      thermalShimmerAlpha = 0.02;
      horizonGlintAlpha = 0.06;
      surfaceRelightAlpha = 0.1;
      break;
    case "rain":
      skyTop = withShade(base.skyTop, 0.24);
      skyMid = mixHex(base.skyMid, "#44556a", 0.56);
      skyBottom = mixHex(base.skyBottom, "#6d8094", 0.64);
      horizonGlow = withLight(skyBottom, 0.12);
      cloudLight = withLight(skyMid, 0.2);
      cloudMid = mixHex(skyMid, skyBottom, 0.14);
      cloudShadow = withShade(skyTop, 0.24);
      cloudAccent = mixHex(skyBottom, "#b0c3d8", 0.34);
      fogLight = mixHex(skyBottom, "#b6c4d2", 0.4);
      fogShadow = mixHex(skyMid, skyTop, 0.7);
      mistColor = mixHex(skyBottom, "#d9e6f4", 0.24);
      celestialAlpha = 0.08;
      starAlpha = 0;
      overcast = 0.84;
      haze = 0.24;
      fogDensity = 0.22;
      precipitation = 0.76;
      wind = 0.44;
      turbulence = 0.3;
      cloudCeiling = 0.76;
      cloudAlpha = 0.98;
      frontCloudAlpha = 0.38;
      mistAlpha = 0.28;
      frontMistAlpha = 0.24;
      curtainAlpha = 0.44;
      distantPrecipAlpha = 0.36;
      nearPrecipAlpha = 0.86;
      windowOpacity = 0.24;
      glassBlur = 0.8;
      anchorFarColor = mixHex(skyTop, "#0c1116", 0.48);
      anchorNearColor = mixHex(skyMid, "#11161c", 0.72);
      anchorRimColor = rgba(withLight(skyBottom, 0.08), 0.14);
      terrainMistColor = rgba(withLight(skyBottom, 0.06), 0.24);
      surfaceLight = mixHex(skyBottom, "#c8d6e6", 0.26);
      surfaceMid = mixHex(skyBottom, "#6b8094", 0.46);
      surfaceShadow = mixHex(skyTop, "#091018", 0.78);
      horizonLift = 0.22;
      anchorAlpha = 0.28;
      relightAlpha = 0.2;
      occlusionStrength = 0.42;
      contactHazeAlpha = 0.1;
      wetSheenAlpha = 0.18;
      impactAlpha = 0.36;
      runoffAlpha = 0.38;
      fogCreepAlpha = 0.08;
      condensationAlpha = 0.12;
      distortionAlpha = 0.08;
      shadowSweepAlpha = 0.1;
      horizonGlintAlpha = 0.08;
      surfaceRelightAlpha = 0.24;
      break;
    case "storm":
      skyTop = withShade(base.skyTop, 0.12);
      skyMid = mixHex(base.skyMid, "#2e3b4f", 0.56);
      skyBottom = mixHex(base.skyBottom, "#44586e", 0.52);
      horizonGlow = withLight(skyBottom, 0.12);
      cloudLight = mixHex(skyMid, "#8298af", 0.18);
      cloudMid = mixHex(skyMid, skyBottom, 0.08);
      cloudShadow = withShade(skyTop, 0.16);
      cloudAccent = mixHex("#97abc0", skyBottom, 0.5);
      fogLight = mixHex(skyBottom, "#9bb0c1", 0.24);
      fogShadow = mixHex(skyMid, skyTop, 0.78);
      mistColor = mixHex(skyBottom, "#bfd1e0", 0.22);
      rainColor = "#d7e8ff";
      lightningColor = "#fbfeff";
      lightningGlow = "#c4e1ff";
      glassTint = rgba("#87a3bc", 0.22);
      glassGlow = rgba("#dcecff", 0.26);
      celestialAlpha = 0.04;
      starAlpha = 0;
      overcast = 1;
      haze = 0.32;
      fogDensity = 0.32;
      precipitation = 1;
      wind = 0.72;
      turbulence = 0.72;
      cloudCeiling = 0.9;
      cloudAlpha = 1;
      frontCloudAlpha = 0.58;
      mistAlpha = 0.32;
      frontMistAlpha = 0.3;
      curtainAlpha = 0.62;
      distantPrecipAlpha = 0.46;
      nearPrecipAlpha = 0.98;
      windowOpacity = 0.32;
      glassBlur = 1;
      anchorFarColor = mixHex(skyTop, "#06090d", 0.42);
      anchorNearColor = mixHex(skyMid, "#0d1218", 0.78);
      anchorRimColor = rgba(withLight(lightningGlow, 0.16), 0.28);
      terrainMistColor = rgba(withLight(skyBottom, 0.08), 0.2);
      surfaceLight = mixHex(lightningGlow, skyBottom, 0.42);
      surfaceMid = mixHex(skyBottom, "#4e6072", 0.56);
      surfaceShadow = mixHex(skyTop, "#05080c", 0.84);
      horizonLift = 0.16;
      anchorAlpha = 0.4;
      relightAlpha = 0.42;
      occlusionStrength = 0.58;
      contactHazeAlpha = 0.14;
      wetSheenAlpha = 0.24;
      impactAlpha = 0.52;
      runoffAlpha = 0.58;
      fogCreepAlpha = 0.12;
      condensationAlpha = 0.18;
      distortionAlpha = 0.12;
      shadowSweepAlpha = 0.14;
      horizonGlintAlpha = 0.04;
      thermalShimmerAlpha = 0;
      surfaceRelightAlpha = 0.48;
      break;
    case "snow":
      skyTop = mixHex(base.skyTop, "#557190", 0.22);
      skyMid = mixHex(base.skyMid, "#c1d0dd", 0.28);
      skyBottom = mixHex(base.skyBottom, "#f6f9fd", 0.14);
      horizonGlow = withLight(skyBottom, 0.06);
      cloudLight = withLight(skyMid, 0.24);
      cloudMid = mixHex(skyMid, skyBottom, 0.18);
      cloudShadow = mixHex(skyTop, "#455a72", 0.54);
      cloudAccent = withLight(skyBottom, 0.08);
      fogLight = mixHex(skyBottom, "#ffffff", 0.2);
      fogShadow = mixHex(skyMid, skyTop, 0.5);
      mistColor = mixHex(skyBottom, "#f5fbff", 0.1);
      celestialAlpha = isNight ? 0.22 : 0.34;
      starAlpha = 0;
      overcast = 0.62;
      haze = 0.22;
      fogDensity = 0.18;
      precipitation = 0.78;
      wind = 0.36;
      turbulence = 0.24;
      cloudCeiling = 0.66;
      cloudAlpha = 0.58;
      frontCloudAlpha = 0.08;
      mistAlpha = 0.18;
      frontMistAlpha = 0.2;
      curtainAlpha = 0.08;
      distantPrecipAlpha = 0.12;
      nearPrecipAlpha = 0.82;
      windowOpacity = 0.1;
      glassBlur = 0.45;
      frostOpacity = 0.34;
      anchorFarColor = mixHex(skyTop, "#17212b", 0.42);
      anchorNearColor = mixHex(skyMid, "#243341", 0.56);
      anchorRimColor = rgba(withLight(skyBottom, 0.1), 0.2);
      terrainMistColor = rgba(withLight(skyBottom, 0.08), 0.28);
      surfaceLight = mixHex("#ffffff", skyBottom, 0.42);
      surfaceMid = mixHex(skyBottom, "#d7e3ed", 0.34);
      surfaceShadow = mixHex(skyTop, "#24313d", 0.52);
      horizonLift = 0.28;
      anchorAlpha = 0.18;
      relightAlpha = 0.12;
      occlusionStrength = 0.22;
      contactHazeAlpha = 0.08;
      wetSheenAlpha = 0.02;
      accumulationAlpha = 0.24;
      fogCreepAlpha = 0.08;
      condensationAlpha = 0.08;
      distortionAlpha = 0.03;
      shadowSweepAlpha = 0.03;
      horizonGlintAlpha = 0.06;
      surfaceRelightAlpha = 0.12;
      break;
    case "fog":
      skyTop = mixHex(base.skyTop, "#71808b", 0.3);
      skyMid = mixHex(base.skyMid, "#b9c4ca", 0.4);
      skyBottom = mixHex(base.skyBottom, "#edf2f4", 0.24);
      horizonGlow = withLight(skyBottom, 0.08);
      cloudLight = withLight(skyMid, 0.18);
      cloudMid = mixHex(skyMid, skyBottom, 0.12);
      cloudShadow = mixHex(skyTop, "#566771", 0.58);
      cloudAccent = mixHex(skyBottom, "#ffffff", 0.1);
      fogLight = mixHex(skyBottom, "#ffffff", 0.16);
      fogShadow = mixHex(skyMid, skyTop, 0.32);
      mistColor = mixHex(skyBottom, "#f8fcff", 0.08);
      celestialAlpha = 0.12;
      starAlpha = 0;
      overcast = 0.18;
      haze = 0.46;
      fogDensity = 0.92;
      precipitation = 0.08;
      wind = 0.16;
      turbulence = 0.12;
      cloudCeiling = 0.28;
      cloudAlpha = 0.18;
      frontCloudAlpha = 0.02;
      mistAlpha = 0.46;
      frontMistAlpha = 0.68;
      windowOpacity = 0.18;
      glassBlur = 0.7;
      frostOpacity = 0.24;
      anchorFarColor = mixHex(skyTop, "#1b232b", 0.34);
      anchorNearColor = mixHex(skyMid, "#263038", 0.42);
      anchorRimColor = rgba(withLight(skyBottom, 0.04), 0.12);
      terrainMistColor = rgba(withLight(skyBottom, 0.12), 0.36);
      surfaceLight = mixHex("#ffffff", skyBottom, 0.22);
      surfaceMid = mixHex(skyBottom, "#c9d4d8", 0.3);
      surfaceShadow = mixHex(skyTop, "#394953", 0.58);
      horizonLift = 0.38;
      anchorAlpha = 0.12;
      relightAlpha = 0.08;
      occlusionStrength = 0.14;
      contactHazeAlpha = 0.14;
      wetSheenAlpha = 0.04;
      fogCreepAlpha = 0.22;
      condensationAlpha = 0.14;
      distortionAlpha = 0.06;
      shadowSweepAlpha = 0.04;
      thermalShimmerAlpha = 0;
      horizonGlintAlpha = 0.03;
      surfaceRelightAlpha = 0.08;
      break;
    case "clear":
    default:
      if (phase === "day") {
        celestialAlpha = 0.88;
      } else if (phase === "dawn" || phase === "dusk") {
        celestialAlpha = 0.6;
      } else {
        celestialAlpha = 0.34;
      }
      anchorFarColor = mixHex(skyTop, "#10161d", 0.46);
      anchorNearColor = mixHex(skyMid, "#17222d", 0.52);
      anchorRimColor = rgba(withLight(base.horizon, 0.24), 0.34);
      terrainMistColor = rgba(withLight(base.skyBottom, 0.12), 0.2);
      surfaceLight = withLight(base.horizon, phase === "day" ? 0.22 : 0.18);
      surfaceMid = mixHex(base.skyBottom, base.horizon, phase === "night" ? 0.18 : 0.3);
      surfaceShadow = mixHex(base.skyTop, "#0b1118", 0.64);
      horizonLift = phase === "day" ? 0.12 : phase === "dawn" || phase === "dusk" ? 0.2 : 0.1;
      anchorAlpha = phase === "night" ? 0.24 : 0.18;
      relightAlpha = 0.12;
      occlusionStrength = 0.14;
      contactHazeAlpha = phase === "night" ? 0.04 : 0.06;
      wetSheenAlpha = phase === "night" ? 0.04 : 0.12;
      fogCreepAlpha = phase === "night" ? 0.02 : 0.04;
      horizonGlintAlpha = phase === "night" ? 0.05 : phase === "day" ? 0.18 : 0.26;
      thermalShimmerAlpha = phase === "day" ? 0.12 : phase === "dawn" || phase === "dusk" ? 0.08 : 0.02;
      surfaceRelightAlpha = 0.08;
      break;
  }

  const atmosphereScale = clamp(0.78 + intensity * 0.26, 0.72, 1.12);
  const detailScale = clamp(0.84 + intensity * 0.24, 0.8, 1.16);

  return {
    phase,
    isNight,
    skyTop,
    skyMid,
    skyBottom,
    horizonGlow,
    vignette,
    sunColor: base.sun,
    moonColor: base.moon,
    celestialGlow: rgba(withLight(base.sun, isNight ? 0.12 : 0.08), isNight ? 0.32 : 0.52),
    celestialAlpha: celestialAlpha * atmosphereScale,
    starColor: withLight(base.moon, 0.08),
    starAlpha: starAlpha * atmosphereScale,
    cloudLight,
    cloudMid,
    cloudShadow,
    cloudAccent,
    fogLight,
    fogShadow,
    mistColor,
    rainColor,
    snowColor,
    lightningColor,
    lightningGlow,
    glassTint,
    glassGlow,
    anchorFarColor,
    anchorNearColor,
    anchorRimColor,
    terrainMistColor,
    surfaceLight,
    surfaceMid,
    surfaceShadow,
    overcast: clamp(overcast * detailScale, 0, 1),
    haze: clamp(haze * atmosphereScale, 0, 1),
    fogDensity: clamp(fogDensity * detailScale, 0, 1),
    precipitation: clamp(precipitation * detailScale, 0, 1.2),
    wind: clamp(wind * (0.82 + intensity * 0.26), 0.08, 1.2),
    turbulence: clamp(turbulence * detailScale, 0.08, 1.2),
    cloudCeiling: clamp(cloudCeiling, 0.1, 1),
    cloudAlpha: clamp(cloudAlpha * detailScale, 0, 1.2),
    frontCloudAlpha: clamp(frontCloudAlpha * detailScale, 0, 1.1),
    mistAlpha: clamp(mistAlpha * detailScale, 0, 1),
    frontMistAlpha: clamp(frontMistAlpha * detailScale, 0, 1),
    curtainAlpha: clamp(curtainAlpha * detailScale, 0, 1),
    distantPrecipAlpha: clamp(distantPrecipAlpha * detailScale, 0, 1),
    nearPrecipAlpha: clamp(nearPrecipAlpha * detailScale, 0, 1.2),
    windowOpacity: clamp(windowOpacity * detailScale, 0, 1),
    glassBlur,
    frostOpacity: clamp(frostOpacity * detailScale, 0, 1),
    horizonLift: clamp(horizonLift * atmosphereScale, 0.06, 0.44),
    anchorAlpha: clamp(anchorAlpha * detailScale, 0.08, 0.5),
    relightAlpha: clamp(relightAlpha * detailScale, 0.06, 0.6),
    occlusionStrength: clamp(occlusionStrength * detailScale, 0.08, 0.7),
    contactHazeAlpha: clamp(contactHazeAlpha * detailScale, 0, 0.72),
    wetSheenAlpha: clamp(wetSheenAlpha * detailScale, 0, 0.8),
    impactAlpha: clamp(impactAlpha * detailScale, 0, 0.9),
    runoffAlpha: clamp(runoffAlpha * detailScale, 0, 0.9),
    accumulationAlpha: clamp(accumulationAlpha * detailScale, 0, 0.9),
    fogCreepAlpha: clamp(fogCreepAlpha * detailScale, 0, 0.9),
    condensationAlpha: clamp(condensationAlpha * detailScale, 0, 0.9),
    distortionAlpha: clamp(distortionAlpha * detailScale, 0, 0.8),
    shadowSweepAlpha: clamp(shadowSweepAlpha * detailScale, 0, 0.6),
    thermalShimmerAlpha: clamp(thermalShimmerAlpha * atmosphereScale, 0, 0.36),
    horizonGlintAlpha: clamp(horizonGlintAlpha * atmosphereScale, 0, 0.5),
    surfaceRelightAlpha: clamp(surfaceRelightAlpha * detailScale, 0, 0.7),
  };
}

function createSpritePalette(profile: SceneProfile, useAccent = false): WeatherSpritePalette {
  const overcastMix = clamp(profile.overcast * 0.65 + profile.haze * 0.15, 0, 0.75);
  const primary = mixHex(profile.cloudMid, profile.cloudShadow, overcastMix * 0.16);
  const secondary = mixHex(primary, profile.cloudShadow, 0.25 + overcastMix * 0.16);
  return {
    primary,
    secondary,
    shadow: profile.cloudShadow,
    highlight: mixHex(profile.cloudLight, profile.cloudMid, 0.18 + overcastMix * 0.74),
    accent: mixHex(useAccent ? profile.cloudAccent : profile.cloudLight, profile.cloudMid, 0.22 + overcastMix * 0.58),
    glow: rgba(mixHex(profile.cloudAccent, profile.cloudMid, 0.36 + overcastMix * 0.34), 0.18 - overcastMix * 0.08),
  };
}

function buildCloudPalette(profile: SceneProfile, kind: WeatherSpriteKind): WeatherSpritePalette {
  if (kind === "cloud-shelf" || kind === "cloud-anvil") {
    return {
      primary: mixHex(profile.cloudMid, profile.cloudShadow, 0.16),
      secondary: profile.cloudMid,
      shadow: withShade(profile.cloudShadow, 0.06),
      highlight: mixHex(profile.cloudLight, profile.cloudMid, 0.54),
      accent: mixHex(profile.cloudAccent, profile.cloudMid, 0.52),
      glow: rgba(profile.cloudAccent, 0.14),
    };
  }
  if (kind === "fog-wisp") {
    return {
      primary: profile.fogLight,
      secondary: profile.mistColor,
      shadow: profile.fogShadow,
      highlight: withLight(profile.fogLight, 0.12),
      accent: withLight(profile.mistColor, 0.14),
      glow: rgba(profile.fogLight, 0.28),
    };
  }
  return createSpritePalette(profile);
}

function buildRainPalette(profile: SceneProfile): WeatherSpritePalette {
  return {
    primary: profile.rainColor,
    secondary: profile.rainColor,
    shadow: rgba(profile.rainColor, 0.08),
    highlight: withLight(profile.rainColor, 0.18),
    accent: withLight(profile.rainColor, 0.3),
    glow: rgba(profile.rainColor, 0.34),
  };
}

function buildSnowPalette(profile: SceneProfile): WeatherSpritePalette {
  return {
    primary: profile.snowColor,
    secondary: withLight(profile.snowColor, 0.08),
    shadow: rgba(profile.snowColor, 0.12),
    highlight: withLight(profile.snowColor, 0.06),
    accent: withLight(profile.snowColor, 0.18),
    glow: rgba(profile.snowColor, 0.16),
  };
}

function buildGlassPalette(profile: SceneProfile): WeatherSpritePalette {
  return {
    primary: profile.glassTint,
    secondary: profile.glassTint,
    shadow: rgba(withShade("#55718f", 0.3), 0.12),
    highlight: "#ffffff",
    accent: rgba("#d8e8ff", 0.76),
    glow: profile.glassGlow,
  };
}

function buildLightningPalette(profile: SceneProfile): WeatherSpritePalette {
  return {
    primary: profile.lightningColor,
    secondary: profile.lightningColor,
    shadow: rgba(profile.lightningGlow, 0.12),
    highlight: "#ffffff",
    accent: profile.lightningGlow,
    glow: rgba(profile.lightningGlow, 0.55),
  };
}

function buildAnchorPalette(profile: SceneProfile, depth: number): WeatherSpritePalette {
  const primary = mixHex(profile.anchorNearColor, profile.anchorFarColor, depth);
  const secondary = mixHex(primary, profile.anchorFarColor, 0.4);
  return {
    primary,
    secondary,
    shadow: mixHex(primary, "#06090d", 0.5),
    highlight: profile.anchorRimColor,
    accent: mixHex(profile.anchorRimColor, profile.terrainMistColor, 0.35),
    glow: profile.terrainMistColor,
  };
}

function buildCurtainPalette(profile: SceneProfile, condition: WeatherCondition): WeatherSpritePalette {
  const precipitationBase = condition === "snow" ? profile.snowColor : profile.rainColor;
  return {
    primary: rgba(precipitationBase, condition === "snow" ? 0.24 : 0.18),
    secondary: rgba(precipitationBase, condition === "snow" ? 0.18 : 0.14),
    shadow: rgba(precipitationBase, 0.04),
    highlight: rgba(withLight(precipitationBase, 0.16), 0.22),
    accent: rgba(withLight(precipitationBase, 0.24), 0.18),
    glow: rgba(precipitationBase, condition === "snow" ? 0.18 : 0.14),
  };
}

function buildScudPalette(profile: SceneProfile): WeatherSpritePalette {
  return {
    primary: mixHex(profile.cloudShadow, profile.cloudMid, 0.18),
    secondary: mixHex(profile.cloudShadow, profile.cloudMid, 0.28),
    shadow: withShade(profile.cloudShadow, 0.08),
    highlight: mixHex(profile.cloudLight, "#dbe8f7", 0.12),
    accent: mixHex(profile.cloudAccent, profile.cloudMid, 0.3),
    glow: rgba(profile.cloudAccent, 0.18),
  };
}

function buildInteractionPalette(
  profile: SceneProfile,
  variant: "contact" | "impact" | "runoff" | "accumulation" | "condensation" | "fog-creep",
): WeatherSpritePalette {
  switch (variant) {
    case "impact":
      return {
        primary: rgba(profile.rainColor, 0.28),
        secondary: rgba(profile.surfaceLight, 0.16),
        shadow: rgba(profile.surfaceShadow, 0.06),
        highlight: rgba(withLight(profile.rainColor, 0.2), 0.34),
        accent: rgba(withLight(profile.rainColor, 0.34), 0.4),
        glow: rgba(profile.rainColor, 0.3),
      };
    case "runoff":
      return {
        primary: rgba(profile.surfaceMid, 0.26),
        secondary: rgba(profile.rainColor, 0.18),
        shadow: rgba(profile.surfaceShadow, 0.08),
        highlight: rgba(withLight(profile.surfaceLight, 0.14), 0.3),
        accent: rgba(withLight(profile.rainColor, 0.26), 0.3),
        glow: rgba(profile.surfaceLight, 0.26),
      };
    case "accumulation":
      return {
        primary: rgba(profile.snowColor, 0.44),
        secondary: rgba(profile.surfaceMid, 0.3),
        shadow: rgba(profile.surfaceShadow, 0.12),
        highlight: rgba(withLight(profile.snowColor, 0.12), 0.42),
        accent: rgba(withLight(profile.surfaceLight, 0.16), 0.32),
        glow: rgba(profile.snowColor, 0.26),
      };
    case "condensation":
      return {
        primary: profile.glassTint,
        secondary: rgba(profile.mistColor, 0.18),
        shadow: rgba(profile.surfaceShadow, 0.06),
        highlight: rgba(withLight(profile.fogLight, 0.12), 0.34),
        accent: rgba(withLight(profile.surfaceLight, 0.18), 0.26),
        glow: profile.glassGlow,
      };
    case "fog-creep":
      return {
        primary: rgba(profile.fogLight, 0.28),
        secondary: rgba(profile.mistColor, 0.2),
        shadow: rgba(profile.surfaceShadow, 0.08),
        highlight: rgba(withLight(profile.fogLight, 0.12), 0.32),
        accent: rgba(withLight(profile.surfaceLight, 0.14), 0.22),
        glow: rgba(profile.fogLight, 0.24),
      };
    case "contact":
    default:
      return {
        primary: rgba(profile.surfaceMid, 0.34),
        secondary: rgba(profile.surfaceMid, 0.24),
        shadow: rgba(profile.surfaceShadow, 0.12),
        highlight: rgba(withLight(profile.surfaceLight, 0.1), 0.32),
        accent: rgba(withLight(profile.surfaceLight, 0.18), 0.28),
        glow: rgba(profile.surfaceLight, 0.22),
      };
  }
}

function buildCelestialPosition(phase: Phase, width: number, height: number): { x: number; y: number; radius: number } {
  switch (phase) {
    case "dawn":
      return { x: width * 0.22, y: height * 0.28, radius: Math.min(width, height) * 0.08 };
    case "dusk":
      return { x: width * 0.76, y: height * 0.32, radius: Math.min(width, height) * 0.082 };
    case "night":
      return { x: width * 0.74, y: height * 0.2, radius: Math.min(width, height) * 0.054 };
    case "day":
    default:
      return { x: width * 0.68, y: height * 0.22, radius: Math.min(width, height) * 0.092 };
  }
}

function buildSceneSignature(kind: RendererKind, state: WeatherState, prefs: WeatherPrefs, phase: Phase, intensity: number): string {
  return [
    kind,
    state.condition,
    state.palette,
    phase,
    prefs.qualityMode,
    intensity.toFixed(2),
    state.date,
    state.time,
    state.layer,
  ].join("|");
}

function conditionCloudSprites(condition: WeatherCondition): WeatherSpriteKind[] {
  switch (condition) {
    case "cloudy":
      return ["cloud-stratus", "cloud-bank", "cloud-stratus"];
    case "rain":
      return ["cloud-stratus", "cloud-bank", "cloud-stratus", "cloud-stratus"];
    case "storm":
      return ["cloud-anvil", "cloud-shelf", "cloud-bank", "cloud-stratus"];
    case "snow":
      return ["cloud-stratus", "cloud-bank", "cloud-stratus"];
    case "fog":
      return ["fog-wisp", "cloud-stratus", "fog-wisp"];
    case "clear":
    default:
      return ["cloud-wisp", "cloud-bank"];
  }
}

function createStars(rng: () => number, profile: SceneProfile, budget: WeatherQualityBudget): StarParticle[] {
  if (!budget.flags.stars || profile.starAlpha <= 0.01) return [];
  const count = Math.round(budget.stars * (profile.isNight ? 1 : profile.phase === "dusk" || profile.phase === "dawn" ? 0.38 : 0.08));
  return Array.from({ length: count }, () => ({
    x: rng(),
    y: rng() * 0.72,
    radius: 0.7 + rng() * 1.8,
    alpha: 0.3 + rng() * 0.7,
    twinkleSpeed: 0.2 + rng() * 0.9,
    phase: rng() * Math.PI * 2,
  }));
}

function createMotes(rng: () => number, profile: SceneProfile, budget: WeatherQualityBudget, kind: RendererKind): MoteParticle[] {
  if (!budget.flags.motes || kind !== "back") return [];
  const weight =
    profile.phase === "day" && profile.overcast < 0.2 ? 1 : profile.phase === "dawn" || profile.phase === "dusk" ? 0.44 : 0.18;
  const count = Math.round(budget.motes * weight);
  return Array.from({ length: count }, () => ({
    x: rng(),
    y: 0.12 + rng() * 0.72,
    radius: 1.6 + rng() * 3.8,
    alpha: 0.18 + rng() * 0.44,
    driftX: (rng() - 0.5) * 0.04,
    driftY: (rng() - 0.5) * 0.05,
    speed: 0.22 + rng() * 0.45,
    phase: rng() * Math.PI * 2,
  }));
}

function createCloudLayers(
  rng: () => number,
  condition: WeatherCondition,
  profile: SceneProfile,
  budget: WeatherQualityBudget,
  kind: RendererKind,
): SpriteLayer[] {
  const isFront = kind === "front";
  const total =
    condition === "clear" && isFront
      ? budget.frontCloudSprites > 0 && budget.flags.frontCloudBank
        ? 1
        : 0
      : isFront
        ? budget.frontCloudSprites
        : budget.cloudSprites;
  if (total <= 0) return [];

  const layerCount = Math.max(1, isFront ? Math.min(2, budget.cloudLayers) : budget.cloudLayers);
  const sprites = conditionCloudSprites(condition);
  const result: SpriteLayer[] = [];

  for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
    const depth = layerCount === 1 ? 0.5 : layerIndex / (layerCount - 1);
    const perLayer = Math.max(1, Math.round(total / layerCount + depth * (isFront ? 0.5 : 1.2)));
    for (let itemIndex = 0; itemIndex < perLayer; itemIndex += 1) {
      const sprite = pick(rng, sprites);
      const widthScale =
        sprite === "cloud-anvil" ? 1.9 : sprite === "cloud-shelf" ? 2.1 : sprite === "cloud-stratus" ? 2 : sprite === "cloud-bank" ? 1.45 : 1.18;
      const baseWidth =
        condition === "storm"
          ? isFront
            ? 420
            : 360
          : condition === "rain" || condition === "snow" || condition === "cloudy"
            ? isFront
              ? 390
              : 320
            : condition === "fog"
              ? isFront
                ? 360
                : 300
              : isFront
                ? 340
                : 260;
      const width = baseWidth * widthScale * (0.8 + rng() * 0.9) * (1 + depth * 0.45);
      const heightRatio = sprite === "cloud-stratus" || sprite === "cloud-shelf" ? 0.34 : sprite === "cloud-anvil" ? 0.62 : 0.42;
      const yBase =
        condition === "fog"
          ? 0.24 + depth * 0.2
          : condition === "storm"
            ? 0.01 + depth * 0.14
            : condition === "rain"
              ? 0.02 + depth * 0.12
              : condition === "snow"
                ? 0.03 + depth * 0.12
              : condition === "cloudy"
                ? 0.04 + depth * 0.14
                : 0.04 + depth * 0.22;
      result.push({
        sprite,
        palette: buildCloudPalette(profile, sprite),
        x: rng() * 1.6 - 0.3,
        y: yBase + (rng() - 0.5) * (isFront ? 0.05 : 0.08),
        width,
        height: width * heightRatio,
        alpha:
          (isFront ? profile.frontCloudAlpha : profile.cloudAlpha) *
          clamp(
            (condition === "rain" || condition === "storm" || condition === "snow" || condition === "cloudy" ? 0.16 : 0.22) +
              (1 - depth) * 0.14 +
              rng() * 0.18,
            0.08,
            0.72,
          ),
        speed: (isFront ? 10 : 6) + rng() * 12 + depth * 8,
        driftY: 3 + rng() * 12 + depth * 6,
        phase: rng() * Math.PI * 2,
        rotation:
          sprite === "cloud-shelf"
            ? -3 + rng() * 6
            : sprite === "cloud-anvil"
              ? -2 + rng() * 4
              : -1.5 + rng() * 3,
      });
    }
  }

  if (!budget.flags.deepOvercast && !isFront) {
    return result.slice(0, Math.max(1, Math.round(result.length * 0.65)));
  }

  if (condition === "clear") {
    return result.slice(0, Math.max(1, isFront ? 1 : Math.round(result.length * 0.42)));
  }

  return result;
}

function createFogWisps(rng: () => number, profile: SceneProfile, budget: WeatherQualityBudget, kind: RendererKind): SpriteLayer[] {
  const count = kind === "front" ? budget.frontMistWisps : budget.fogWisps;
  const alphaBase = kind === "front" ? profile.frontMistAlpha : profile.mistAlpha;
  if (count <= 0 || alphaBase <= 0.01) return [];
  return Array.from({ length: count }, (_, index) => {
    const layer = index / Math.max(count - 1, 1);
    const width = (kind === "front" ? 320 : 420) + rng() * (kind === "front" ? 420 : 560);
    return {
      sprite: "fog-wisp",
      palette: buildCloudPalette(profile, "fog-wisp"),
      x: rng() * 1.4 - 0.2,
      y: kind === "front" ? 0.54 + layer * 0.18 + rng() * 0.1 : 0.46 + layer * 0.13 + rng() * 0.1,
      width,
      height: width * 0.22,
      alpha: alphaBase * clamp(0.28 + rng() * 0.34, 0.12, 0.72),
      speed: 4 + rng() * 8 + layer * 4,
      driftY: 5 + rng() * 10,
      phase: rng() * Math.PI * 2,
      rotation: -2 + rng() * 4,
    };
  });
}

function createAnchorLayers(
  rng: () => number,
  condition: WeatherCondition,
  profile: SceneProfile,
  budget: WeatherQualityBudget,
): HorizonAnchor[] {
  const count = Math.max(1, budget.anchorBands);
  const densityScale =
    condition === "storm" ? 1.08 : condition === "cloudy" || condition === "rain" ? 1 : condition === "snow" ? 0.84 : condition === "fog" ? 0.72 : 0.68;
  const total = Math.max(1, Math.round(count * densityScale));
  const anchors: HorizonAnchor[] = [];

  for (let index = 0; index < total; index += 1) {
    const depth = total === 1 ? 0.5 : index / (total - 1);
    let sprite: WeatherSpriteKind = depth < 0.22 ? "horizon-ridge" : depth < 0.74 ? "horizon-treeline" : "horizon-ridge";
    if (budget.flags.horizonPoles && depth > 0.66 && (condition === "clear" || condition === "cloudy" || condition === "rain")) {
      sprite = index % 2 === 0 ? "horizon-poles" : "horizon-treeline";
    }

    const width =
      sprite === "horizon-poles"
        ? 1260 + rng() * 260
        : sprite === "horizon-treeline"
          ? 1180 + rng() * 320
          : 1220 + rng() * 280;
    const height = sprite === "horizon-poles" ? 154 + rng() * 44 : sprite === "horizon-treeline" ? 132 + rng() * 44 : 110 + rng() * 38;
    const blurBase = condition === "fog" ? 14 : condition === "snow" ? 10 : condition === "rain" ? 6 : condition === "storm" ? 4 : 3;

    anchors.push({
      sprite,
      palette: buildAnchorPalette(profile, depth),
      x: rng() * 0.18 - 0.08,
      y: 0.67 + depth * 0.12 + (rng() - 0.5) * 0.03,
      width,
      height,
      alpha:
        profile.anchorAlpha *
        (condition === "fog" ? 0.42 : condition === "snow" ? 0.58 : condition === "rain" ? 0.84 : condition === "storm" ? 0.92 : 0.76) *
        (0.42 + depth * 0.36),
      blur: blurBase + depth * (condition === "fog" ? 10 : condition === "snow" ? 6 : 4),
      speed: 0.8 + rng() * 2 + depth * 2.2,
      parallax: 0.015 + depth * 0.03,
      depth,
      relight: 0.18 + depth * 0.36,
    });
  }

  return anchors.sort((left, right) => left.depth - right.depth);
}

function createScudLayers(
  rng: () => number,
  condition: WeatherCondition,
  profile: SceneProfile,
  budget: WeatherQualityBudget,
): SpriteLayer[] {
  const count =
    condition === "storm"
      ? Math.max(1, budget.scudLayers)
      : condition === "rain" && budget.scudLayers > 0
        ? Math.max(1, budget.scudLayers - 1)
        : 0;
  if (count <= 0) return [];

  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const width = 560 + rng() * 480;
    return {
      sprite: "storm-scud",
      palette: buildScudPalette(profile),
      x: rng() * 1.4 - 0.2,
      y: (condition === "storm" ? 0.18 : 0.24) + depth * 0.12 + (rng() - 0.5) * 0.04,
      width,
      height: width * 0.24,
      alpha: (condition === "storm" ? 0.34 : 0.18) + depth * 0.12,
      speed: 8 + rng() * 8 + depth * 4,
      driftY: 4 + rng() * 10,
      phase: rng() * Math.PI * 2,
      rotation: -4 + rng() * 8,
    };
  });
}

function createCurtainTextures(
  rng: () => number,
  condition: WeatherCondition,
  profile: SceneProfile,
  budget: WeatherQualityBudget,
): SpriteLayer[] {
  if (!budget.flags.texturedCurtains) return [];
  if (condition !== "rain" && condition !== "storm" && condition !== "snow") return [];
  const count = Math.max(1, budget.curtainTextures);
  const alphaBase = condition === "snow" ? profile.curtainAlpha * 0.72 : profile.curtainAlpha;
  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const width = condition === "snow" ? 90 + rng() * 80 : 80 + rng() * 72;
    const height = condition === "snow" ? 360 + rng() * 240 : 420 + rng() * 260;
    return {
      sprite: "precip-curtain",
      palette: buildCurtainPalette(profile, condition),
      x: rng() * 1.2 - 0.1,
      y: 0.28 + depth * 0.14 + (rng() - 0.5) * 0.06,
      width,
      height,
      alpha: alphaBase * (0.3 + depth * 0.28 + rng() * 0.12),
      speed: condition === "snow" ? 2.6 + rng() * 4 : 4 + rng() * 7,
      driftY: 6 + rng() * 12,
      phase: rng() * Math.PI * 2,
      rotation: condition === "snow" ? -6 + rng() * 12 : 10 + rng() * 10,
    };
  });
}

function createRainParticles(rng: () => number, profile: SceneProfile, budget: WeatherQualityBudget, kind: RendererKind): RainParticle[] {
  if (profile.precipitation <= 0.04) return [];
  const target = kind === "front" ? budget.rainFront : budget.rainBack;
  if (target <= 0) return [];
  const count = Math.round(target * clamp(profile.precipitation, 0.18, 1.15));
  return Array.from({ length: count }, () => ({
    x: rng(),
    offset: rng(),
    width: kind === "front" ? 3 + rng() * 3.8 : 1.4 + rng() * 1.8,
    height: kind === "front" ? 42 + rng() * 124 : 20 + rng() * 78,
    alpha: (kind === "front" ? profile.nearPrecipAlpha : profile.distantPrecipAlpha) * (0.35 + rng() * 0.65),
    cycle: kind === "front" ? 0.58 + rng() * 0.48 : 0.78 + rng() * 0.68,
    drift: (0.04 + rng() * 0.08) * (kind === "front" ? 1.6 : 1),
    sway: rng() * 0.02,
    phase: rng() * Math.PI * 2,
  }));
}

function createSnowParticles(rng: () => number, profile: SceneProfile, budget: WeatherQualityBudget, kind: RendererKind): SnowParticle[] {
  if (profile.precipitation <= 0.04) return [];
  const target = kind === "front" ? budget.snowFront : budget.snowBack;
  if (target <= 0) return [];
  const count = Math.round(target * clamp(profile.precipitation, 0.22, 1.1));
  return Array.from({ length: count }, () => ({
    x: rng(),
    offset: rng(),
    size: kind === "front" ? 8 + rng() * 16 : 5 + rng() * 10,
    alpha: (kind === "front" ? profile.nearPrecipAlpha : profile.distantPrecipAlpha) * (0.4 + rng() * 0.6),
    cycle: kind === "front" ? 3.2 + rng() * 2.8 : 4.1 + rng() * 4.2,
    drift: (0.05 + rng() * 0.18) * (kind === "front" ? 1.05 : 0.88),
    sway: 0.02 + rng() * 0.06,
    phase: rng() * Math.PI * 2,
    rotation: rng() * 360,
  }));
}

function createCurtains(rng: () => number, profile: SceneProfile, budget: WeatherQualityBudget, condition: WeatherCondition): CurtainBand[] {
  if (!budget.flags.distantCurtains || profile.curtainAlpha <= 0.02) return [];
  const count =
    condition === "snow"
      ? Math.max(1, Math.round(budget.snowGusts * clamp(profile.precipitation, 0.25, 1)))
      : Math.max(1, Math.round(budget.rainCurtains * clamp(profile.precipitation, 0.25, 1)));
  return Array.from({ length: count }, () => ({
    x: rng(),
    width: 0.12 + rng() * 0.2,
    alpha: profile.curtainAlpha * (0.35 + rng() * 0.5),
    slant: condition === "snow" ? -0.03 + rng() * 0.06 : 0.08 + rng() * 0.08,
    speed: 6 + rng() * 12,
    phase: rng() * Math.PI * 2,
    blur: condition === "snow" ? 28 + rng() * 24 : 18 + rng() * 18,
  }));
}

function createContactBands(
  rng: () => number,
  condition: WeatherCondition,
  profile: SceneProfile,
  budget: WeatherQualityBudget,
): SpriteLayer[] {
  const base = budget.contactBands;
  const alphaBase = Math.max(profile.wetSheenAlpha, profile.horizonGlintAlpha * 0.88);
  if (base <= 0 || alphaBase <= 0.01) return [];
  const conditionScale =
    condition === "storm" ? 1.16 : condition === "rain" ? 1 : condition === "fog" ? 0.92 : condition === "cloudy" ? 0.8 : condition === "snow" ? 0.66 : 0.52;
  const count = Math.max(1, Math.round(base * conditionScale));
  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const yBase =
      condition === "storm"
        ? 0.72
        : condition === "rain"
          ? 0.74
          : condition === "snow"
            ? 0.78
            : condition === "fog"
              ? 0.7
              : condition === "cloudy"
                ? 0.76
                : 0.8;
    const width = 620 + rng() * 780;
    const alphaScale =
      condition === "clear"
        ? profile.horizonGlintAlpha
        : condition === "cloudy"
          ? profile.wetSheenAlpha * 0.9
          : profile.wetSheenAlpha;
    return {
      sprite: "surface-sheen",
      palette: buildInteractionPalette(profile, "contact"),
      x: rng() * 0.22 - 0.08,
      y: yBase + depth * 0.08 + (rng() - 0.5) * 0.03,
      width,
      height: 48 + rng() * 92 + depth * 18,
      alpha: alphaScale * (0.28 + depth * 0.3 + rng() * 0.14),
      speed: 1.2 + rng() * 3.2 + depth * 1.2,
      driftY: 1.5 + rng() * 5.5,
      phase: rng() * Math.PI * 2,
      rotation: -2 + rng() * 4,
    };
  });
}

function createImpactBursts(rng: () => number, profile: SceneProfile, budget: WeatherQualityBudget, condition: WeatherCondition): SpriteLayer[] {
  if ((condition !== "rain" && condition !== "storm") || profile.impactAlpha <= 0.01 || budget.impactBursts <= 0) return [];
  const count = Math.max(
    1,
    Math.round(budget.impactBursts * clamp(profile.precipitation, 0.2, 1.2) * (condition === "storm" ? 1.22 : 1)),
  );
  return Array.from({ length: count }, () => {
    const width = 56 + rng() * 124;
    return {
      sprite: "surface-splash",
      palette: buildInteractionPalette(profile, "impact"),
      x: rng() * 1.15 - 0.08,
      y: 0.66 + rng() * 0.28,
      width,
      height: width * (0.44 + rng() * 0.22),
      alpha: profile.impactAlpha * (0.28 + rng() * 0.34),
      speed: 3.2 + rng() * 8,
      driftY: 2 + rng() * 10,
      phase: rng() * Math.PI * 2,
      rotation: -12 + rng() * 24,
    };
  });
}

function createRunoffSheets(rng: () => number, profile: SceneProfile, budget: WeatherQualityBudget, condition: WeatherCondition): SpriteLayer[] {
  if ((condition !== "rain" && condition !== "storm") || profile.runoffAlpha <= 0.01 || budget.runoffSheets <= 0) return [];
  const count = Math.max(1, Math.round(budget.runoffSheets * clamp(profile.precipitation, 0.3, 1.2)));
  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const width = 72 + rng() * 112;
    return {
      sprite: "surface-runoff",
      palette: buildInteractionPalette(profile, "runoff"),
      x: rng() * 1.1 - 0.06,
      y: 0.46 + depth * 0.16 + rng() * 0.08,
      width,
      height: 220 + rng() * 320,
      alpha: profile.runoffAlpha * (0.26 + depth * 0.26 + rng() * 0.1),
      speed: 2.2 + rng() * 5.6 + depth * 1.8,
      driftY: 6 + rng() * 14,
      phase: rng() * Math.PI * 2,
      rotation: condition === "storm" ? 14 + rng() * 18 : 8 + rng() * 12,
    };
  });
}

function createAccumulationBands(rng: () => number, profile: SceneProfile, budget: WeatherQualityBudget, condition: WeatherCondition): SpriteLayer[] {
  if (condition !== "snow" || profile.accumulationAlpha <= 0.01 || budget.accumulationBands <= 0) return [];
  const count = Math.max(1, budget.accumulationBands);
  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const width = 980 + rng() * 420;
    return {
      sprite: "surface-accumulation",
      palette: buildInteractionPalette(profile, "accumulation"),
      x: rng() * 0.14 - 0.08,
      y: 0.78 + depth * 0.07 + rng() * 0.02,
      width,
      height: 64 + rng() * 76,
      alpha: profile.accumulationAlpha * (0.34 + depth * 0.28 + rng() * 0.12),
      speed: 0.8 + rng() * 1.8,
      driftY: 1 + rng() * 4,
      phase: rng() * Math.PI * 2,
      rotation: -1.4 + rng() * 2.8,
    };
  });
}

function createFogCreepLayers(
  rng: () => number,
  condition: WeatherCondition,
  profile: SceneProfile,
  budget: WeatherQualityBudget,
): SpriteLayer[] {
  if (profile.fogCreepAlpha <= 0.01 || budget.fogCreepBands <= 0) return [];
  const conditionScale =
    condition === "fog" ? 1.1 : condition === "snow" ? 0.86 : condition === "rain" || condition === "storm" ? 0.72 : condition === "cloudy" ? 0.62 : 0.42;
  const count = Math.max(1, Math.round(budget.fogCreepBands * conditionScale));
  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const width = 900 + rng() * 520;
    return {
      sprite: "fog-creep",
      palette: buildInteractionPalette(profile, "fog-creep"),
      x: rng() * 0.2 - 0.08,
      y: 0.7 + depth * 0.1 + rng() * 0.04,
      width,
      height: 88 + rng() * 140,
      alpha: profile.fogCreepAlpha * (0.24 + depth * 0.3 + rng() * 0.16),
      speed: 0.8 + rng() * 2.4 + depth,
      driftY: 2 + rng() * 8,
      phase: rng() * Math.PI * 2,
      rotation: -2 + rng() * 4,
    };
  });
}

function createCondensationBlooms(
  rng: () => number,
  profile: SceneProfile,
  budget: WeatherQualityBudget,
  condition: WeatherCondition,
): SpriteLayer[] {
  if (
    !budget.flags.glassOverlay ||
    (condition !== "rain" && condition !== "storm" && condition !== "snow" && condition !== "fog") ||
    profile.condensationAlpha <= 0.01 ||
    budget.condensationBlooms <= 0
  ) {
    return [];
  }
  const count = Math.max(1, Math.round(budget.condensationBlooms * clamp(profile.windowOpacity, 0.3, 1)));
  return Array.from({ length: count }, () => {
    const edgeWeightedX = rng() > 0.55 ? rng() * 0.22 : 0.68 + rng() * 0.28;
    const width = 72 + rng() * 210;
    return {
      sprite: "condensation-bloom",
      palette: buildInteractionPalette(profile, "condensation"),
      x: rng() > 0.28 ? edgeWeightedX : 0.18 + rng() * 0.5,
      y: rng() * 0.86,
      width,
      height: width * (0.72 + rng() * 0.28),
      alpha: profile.condensationAlpha * (0.24 + rng() * 0.34),
      speed: 0.3 + rng() * 1.6,
      driftY: 1.5 + rng() * 7,
      phase: rng() * Math.PI * 2,
      rotation: -20 + rng() * 40,
    };
  });
}

function createGlassParticles(
  rng: () => number,
  profile: SceneProfile,
  budget: WeatherQualityBudget,
  condition: WeatherCondition,
): { beads: GlassParticle[]; rivulets: GlassParticle[] } {
  if (!budget.flags.glassOverlay || profile.windowOpacity <= 0.02) {
    return { beads: [], rivulets: [] };
  }

  const conditionScale =
    condition === "storm" ? 1.16 : condition === "rain" ? 1 : condition === "snow" ? 0.7 : condition === "fog" ? 0.56 : 0;
  const moistureScale = clamp(profile.windowOpacity + profile.condensationAlpha * 0.5, 0.2, 1.2);
  const beadCount = budget.flags.glassDroplets ? Math.round(budget.glassBeads * moistureScale * conditionScale) : 0;
  const rivuletCount = budget.flags.glassDroplets ? Math.round(budget.glassRivulets * moistureScale * conditionScale) : 0;
  const condensationScale = condition === "snow" || condition === "fog" ? 0.55 : 1;

  return {
    beads: Array.from({ length: beadCount }, () => ({
      x: rng(),
      y: rng(),
      width: 10 + rng() * 24,
      height: 12 + rng() * 28,
      alpha: profile.windowOpacity * condensationScale * (0.36 + rng() * 0.54),
      speed: condition === "fog" ? 0.02 + rng() * 0.04 : 0.06 + rng() * 0.12,
      drift: (rng() - 0.5) * 0.015,
      phase: rng() * Math.PI * 2,
    })),
    rivulets: Array.from({ length: rivuletCount }, () => ({
      x: rng(),
      y: rng() * 0.35,
      width: 8 + rng() * 10,
      height: 120 + rng() * 260,
      alpha: profile.windowOpacity * (0.3 + rng() * 0.5),
      speed: condition === "snow" || condition === "fog" ? 0.03 + rng() * 0.04 : 0.08 + rng() * 0.1,
      drift: (rng() - 0.5) * 0.02,
      phase: rng() * Math.PI * 2,
    })),
  };
}

function buildComposition(kind: RendererKind, state: WeatherState, prefs: WeatherPrefs): SceneComposition {
  const effectiveIntensity = clamp(state.intensity * prefs.intensity, 0.2, 1.5);
  const profile = buildSceneProfile(state, effectiveIntensity);
  const budget = getQualityBudget(prefs.qualityMode);
  const signature = buildSceneSignature(kind, state, prefs, profile.phase, effectiveIntensity);
  const rng = createRng(hashString(signature));
  const anchors = kind === "back" ? createAnchorLayers(rng, state.condition, profile, budget) : [];
  const clouds = kind === "back" ? createCloudLayers(rng, state.condition, profile, budget, "back") : [];
  const scud = kind === "back" ? createScudLayers(rng, state.condition, profile, budget) : [];
  const frontClouds =
    kind === "front" && budget.flags.frontCloudBank ? createCloudLayers(rng, state.condition, profile, budget, "front") : [];
  const fogWisps = kind === "back" ? createFogWisps(rng, profile, budget, "back") : [];
  const frontMist = kind === "front" ? createFogWisps(rng, profile, budget, "front") : [];
  const rain = state.condition === "rain" || state.condition === "storm" ? createRainParticles(rng, profile, budget, kind) : [];
  const snow = state.condition === "snow" ? createSnowParticles(rng, profile, budget, kind) : [];
  const curtains = kind === "back" ? createCurtains(rng, profile, budget, state.condition) : [];
  const curtainTextures = kind === "back" ? createCurtainTextures(rng, state.condition, profile, budget) : [];
  const contactBands = kind === "back" ? createContactBands(rng, state.condition, profile, budget) : [];
  const impactBursts = kind === "back" ? createImpactBursts(rng, profile, budget, state.condition) : [];
  const runoffSheets = kind === "back" ? createRunoffSheets(rng, profile, budget, state.condition) : [];
  const accumulationBands = kind === "back" ? createAccumulationBands(rng, profile, budget, state.condition) : [];
  const fogCreep = kind === "back" ? createFogCreepLayers(rng, state.condition, profile, budget) : [];
  const condensationBlooms = kind === "back" ? createCondensationBlooms(rng, profile, budget, state.condition) : [];
  const glass = kind === "back" ? createGlassParticles(rng, profile, budget, state.condition) : { beads: [], rivulets: [] };

  return {
    signature,
    budget,
    profile,
    stars: kind === "back" ? createStars(rng, profile, budget) : [],
    motes: createMotes(rng, profile, budget, kind),
    anchors,
    clouds,
    scud,
    frontClouds,
    fogWisps,
    frontMist,
    rain,
    snow,
    curtains,
    curtainTextures,
    contactBands,
    impactBursts,
    runoffSheets,
    accumulationBands,
    fogCreep,
    condensationBlooms,
    glassBeads: glass.beads,
    glassRivulets: glass.rivulets,
  };
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: WeatherSpriteKind,
  palette: WeatherSpritePalette,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha: number,
  rotation: number,
  onReady: () => void,
): void {
  const image = requestWeatherSprite(sprite, palette, onReady);
  if (!image) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}

class CanvasWeatherRenderer {
  readonly root: HTMLDivElement;

  private readonly kind: RendererKind;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly glassOverlay: HTMLDivElement | null;
  private readonly resizeObserver: ResizeObserverHandle | null;
  private readonly onAssetReady = () => this.drawOnce();
  private readonly onWindowResize = () => {
    if (this.resizeCanvas()) {
      this.drawOnce();
    }
  };
  private composition: SceneComposition | null = null;
  private prefs: WeatherPrefs = DEFAULT_PREFS;
  private state: WeatherState = makeDefaultWeatherState();
  private reducedMotion = false;
  private visible = false;
  private rafId: number | null = null;
  private animationTime = 0;
  private lastFrameAt: number | null = null;
  private width = 1;
  private height = 1;
  private dpr = 1;
  private lightningEvents: LightningEvent[] = [];
  private failed = false;

  constructor(kind: RendererKind) {
    this.kind = kind;
    this.root = document.createElement("div");
    this.root.className = "weather-fx-root weather-fx-renderer-root";
    this.root.dataset.kind = kind;
    this.root.dataset.glass = "none";
    this.root.setAttribute("aria-hidden", "true");

    this.canvas = document.createElement("canvas");
    this.canvas.className = "weather-fx-canvas";
    this.root.appendChild(this.canvas);

    const context = this.canvas.getContext("2d", { alpha: true }) ?? this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Weather renderer could not acquire a 2D canvas context.");
    }
    this.context = context;

    if (kind === "back") {
      this.glassOverlay = document.createElement("div");
      this.glassOverlay.className = "weather-fx-glass";
      this.root.appendChild(this.glassOverlay);
    } else {
      this.glassOverlay = null;
    }

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        if (this.resizeCanvas()) {
          this.drawOnce();
        }
      });
      observer.observe(this.root);
      this.resizeObserver = observer;
    } else {
      this.resizeObserver = null;
      window.addEventListener("resize", this.onWindowResize);
    }
  }

  setScene(state: WeatherState, prefs: WeatherPrefs, reducedMotion: boolean): void {
    if (this.failed) return;
    this.state = state;
    this.prefs = prefs;
    this.reducedMotion = reducedMotion;
    const nextComposition = buildComposition(this.kind, state, prefs);
    this.composition = nextComposition;
    this.lightningEvents = [];

    this.root.dataset.condition = state.condition;
    this.root.dataset.palette = state.palette;
    this.root.dataset.quality = prefs.qualityMode;
    this.root.classList.toggle("weather-paused", prefs.pauseEffects);
    this.root.classList.toggle("weather-reduced-motion", reducedMotion);
    this.syncGlassOverlay();
    this.drawOnce();
    this.refreshLoop();
  }

  setVisible(visible: boolean): void {
    if (this.failed) {
      this.root.classList.add("weather-hidden");
      this.root.classList.remove("weather-visible");
      return;
    }
    this.visible = visible;
    this.root.classList.toggle("weather-hidden", !visible);
    this.root.classList.toggle("weather-visible", visible);
    this.drawOnce();
    this.refreshLoop();
  }

  refreshLayout(): void {
    if (this.failed) return;
    if (this.resizeCanvas()) {
      this.drawOnce();
    }
  }

  triggerLightning(): void {
    if (this.failed) return;
    if (!this.visible || this.state.condition !== "storm" || this.reducedMotion || this.prefs.pauseEffects || !this.composition) {
      return;
    }

    const budget = this.composition.budget;
    const flashCount = budget.flags.multiFlash ? 2 + (Math.random() > 0.65 ? 1 : 0) : 1;
    for (let flashIndex = 0; flashIndex < flashCount; flashIndex += 1) {
      const bolts: LightningBolt[] = [];
      const boltCount = budget.flags.lightningForks ? Math.max(1, budget.lightningForks - flashIndex) : 0;
      for (let index = 0; index < boltCount; index += 1) {
        bolts.push({
          x: 0.12 + Math.random() * 0.72,
          y: 0.04 + Math.random() * 0.18,
          width: this.kind === "front" ? 90 + Math.random() * 120 : 70 + Math.random() * 90,
          height: this.kind === "front" ? 200 + Math.random() * 210 : 140 + Math.random() * 180,
          alpha: 0.68 + Math.random() * 0.3,
          rotation: -16 + Math.random() * 32,
        });
      }
      this.lightningEvents.push({
        start: this.animationTime + flashIndex * (0.08 + Math.random() * 0.08),
        duration: 0.18 + Math.random() * 0.08,
        flash: (0.58 + Math.random() * 0.34) * budget.lightningGlow,
        bolts,
      });
    }
    this.refreshLoop();
  }

  destroy(): void {
    this.stopLoop();
    this.resizeObserver?.disconnect();
    if (!this.resizeObserver) {
      window.removeEventListener("resize", this.onWindowResize);
    }
    this.root.remove();
  }

  private syncGlassOverlay(): void {
    if (!this.glassOverlay || !this.composition) return;
    const variant =
      !this.composition.budget.flags.glassOverlay
        ? "none"
        : this.state.condition === "rain" || this.state.condition === "storm"
          ? "rain"
          : this.state.condition === "snow"
            ? "snow"
            : this.state.condition === "fog"
              ? "fog"
              : "none";
    this.root.dataset.glass = variant;
    this.root.style.setProperty("--weather-glass-opacity", this.composition.profile.windowOpacity.toFixed(3));
    this.root.style.setProperty("--weather-glass-blur", this.composition.profile.glassBlur.toFixed(2));
    this.root.style.setProperty("--weather-glass-tint", this.composition.profile.glassTint);
    this.root.style.setProperty("--weather-glass-glow", this.composition.profile.glassGlow);
    this.root.style.setProperty("--weather-frost-opacity", this.composition.profile.frostOpacity.toFixed(3));
    this.root.style.setProperty("--weather-glass-condensation", this.composition.profile.condensationAlpha.toFixed(3));
    this.root.style.setProperty("--weather-glass-distortion", this.composition.profile.distortionAlpha.toFixed(3));
    this.root.style.setProperty(
      "--weather-glass-edge-opacity",
      clamp(this.composition.profile.condensationAlpha * 0.74 + this.composition.profile.windowOpacity * 0.22, 0, 1).toFixed(3),
    );
  }

  private resizeCanvas(): boolean {
    if (!this.root.isConnected) return false;
    const rect = this.root.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    const budget = getQualityBudget(this.prefs.qualityMode);
    const viewportPixels = Math.max(1, nextWidth * nextHeight);
    const desiredDpr = Math.max(0.65, window.devicePixelRatio * budget.resolutionScale);
    const maxPixelDpr = Math.max(0.65, Math.sqrt(budget.maxPixelCount / viewportPixels));
    const nextDpr = Math.min(desiredDpr, budget.maxDevicePixelRatio, maxPixelDpr);
    const pixelWidth = Math.max(1, Math.round(nextWidth * nextDpr));
    const pixelHeight = Math.max(1, Math.round(nextHeight * nextDpr));
    if (this.width === nextWidth && this.height === nextHeight && this.dpr === nextDpr) return false;
    this.width = nextWidth;
    this.height = nextHeight;
    this.dpr = nextDpr;
    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    this.canvas.style.width = `${nextWidth}px`;
    this.canvas.style.height = `${nextHeight}px`;
    return true;
  }

  private refreshLoop(): void {
    if (this.failed) {
      this.stopLoop();
      return;
    }
    const shouldRun =
      this.visible &&
      this.root.isConnected &&
      !this.reducedMotion &&
      !this.prefs.pauseEffects &&
      !!this.composition;
    if (shouldRun) {
      if (this.rafId === null) {
        this.rafId = window.requestAnimationFrame(this.step);
      }
      return;
    }
    this.stopLoop();
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastFrameAt = null;
  }

  private readonly step = (now: number) => {
    this.rafId = null;
    if (!this.composition || !this.visible || !this.root.isConnected || this.reducedMotion || this.prefs.pauseEffects) {
      this.stopLoop();
      return;
    }
    if (this.lastFrameAt === null) {
      this.lastFrameAt = now;
    }
    const delta = Math.min(0.06, Math.max(0, (now - this.lastFrameAt) / 1000));
    this.lastFrameAt = now;
    this.animationTime += delta;
    try {
      this.render(this.animationTime);
    } catch (error) {
      this.handleFatalError(error);
      return;
    }
    this.refreshLoop();
  };

  private drawOnce(): void {
    if (this.failed || !this.composition) return;
    try {
      this.resizeCanvas();
      this.render(this.animationTime);
    } catch (error) {
      this.handleFatalError(error);
    }
  }

  private clearCanvas(): void {
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.context.clearRect(0, 0, this.width, this.height);
  }

  private render(time: number): void {
    if (!this.composition || this.width <= 0 || this.height <= 0) return;
    this.clearCanvas();
    if (this.kind === "back") {
      this.drawBack(time);
    } else {
      this.drawFront(time);
    }
  }

  private drawBack(time: number): void {
    if (!this.composition) return;
    const ctx = this.context;
    const {
      profile,
      stars,
      motes,
      anchors,
      clouds,
      scud,
      fogWisps,
      curtains,
      curtainTextures,
      condensationBlooms,
      rain,
      snow,
      glassBeads,
      glassRivulets,
    } = this.composition;
    const lightning = this.resolveLightningState(time);

    const sky = ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, profile.skyTop);
    sky.addColorStop(0.52, profile.skyMid);
    sky.addColorStop(1, profile.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, this.height);

    const skyGlow = ctx.createRadialGradient(this.width * 0.5, this.height * 0.08, 0, this.width * 0.5, this.height * 0.08, this.width);
    skyGlow.addColorStop(0, rgba(profile.cloudAccent, 0.08 + profile.haze * 0.18));
    skyGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = skyGlow;
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawCelestialOrb(profile);
    this.drawStars(time, stars, profile);
    this.drawAtmosphericDepth(profile, lightning.flash);
    this.drawAnchorLayers(time, anchors, profile, lightning.flash);
    this.drawCloudLayers(time, clouds);
    this.drawCloudLayers(time, scud);
    this.drawCurtainTextures(time, curtainTextures);
    this.drawCurtains(time, curtains, profile);
    this.drawFogWisps(time, fogWisps);
    this.drawRain(time, rain, profile, "back");
    this.drawSnow(time, snow, profile, "back");
    this.drawMotes(time, motes, profile);
    this.drawHorizon(profile, lightning.flash);
    this.drawGlass(profile, time, glassRivulets, glassBeads, condensationBlooms, lightning.flash);
    this.drawVignette(profile);
    this.drawLightningState(profile, lightning);
  }

  private drawFront(time: number): void {
    if (!this.composition) return;
    const ctx = this.context;
    const { profile, frontClouds, frontMist, rain, snow } = this.composition;
    const lightning = this.resolveLightningState(time);

    if (profile.frontCloudAlpha > 0.02) {
      const topShadow = ctx.createLinearGradient(0, 0, 0, this.height * 0.5);
      topShadow.addColorStop(0, rgba(profile.cloudShadow, 0.26 + profile.frontCloudAlpha * 0.34));
      topShadow.addColorStop(0.34, rgba(profile.cloudMid, profile.frontCloudAlpha * 0.18));
      topShadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = topShadow;
      ctx.fillRect(0, 0, this.width, this.height * 0.54);
    }

    this.drawCloudLayers(time, frontClouds);
    this.drawFogWisps(time, frontMist);
    this.drawRain(time, rain, profile, "front");
    this.drawSnow(time, snow, profile, "front");
    this.drawLightningState(profile, lightning);
  }

  private drawCelestialOrb(profile: SceneProfile): void {
    if (profile.celestialAlpha <= 0.02) return;
    const ctx = this.context;
    const celestial = buildCelestialPosition(profile.phase, this.width, this.height);
    const coreColor = profile.isNight ? profile.moonColor : profile.sunColor;
    const glow = ctx.createRadialGradient(celestial.x, celestial.y, celestial.radius * 0.24, celestial.x, celestial.y, celestial.radius * 4.4);
    glow.addColorStop(0, rgba(coreColor, profile.celestialAlpha * 0.95));
    glow.addColorStop(0.4, profile.celestialGlow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(celestial.x, celestial.y, celestial.radius * 4.4, 0, Math.PI * 2);
    ctx.fill();

    const core = ctx.createRadialGradient(celestial.x, celestial.y, celestial.radius * 0.12, celestial.x, celestial.y, celestial.radius);
    core.addColorStop(0, rgba("#ffffff", profile.isNight ? 0.94 : 0.98));
    core.addColorStop(0.4, rgba(coreColor, profile.celestialAlpha * 0.9));
    core.addColorStop(1, rgba(coreColor, profile.celestialAlpha * 0.1));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(celestial.x, celestial.y, celestial.radius, 0, Math.PI * 2);
    ctx.fill();

    if (profile.horizonGlintAlpha > 0.02) {
      const flare = ctx.createLinearGradient(celestial.x - this.width * 0.22, 0, celestial.x + this.width * 0.22, 0);
      flare.addColorStop(0, "rgba(255,255,255,0)");
      flare.addColorStop(0.5, rgba(coreColor, profile.horizonGlintAlpha * 0.22));
      flare.addColorStop(1, "rgba(255,255,255,0)");
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = flare;
      ctx.fillRect(celestial.x - this.width * 0.22, celestial.y - 2, this.width * 0.44, 4);
      ctx.restore();
    }
  }

  private drawStars(time: number, stars: StarParticle[], profile: SceneProfile): void {
    if (stars.length === 0 || profile.starAlpha <= 0.01) return;
    const ctx = this.context;
    for (const star of stars) {
      const twinkle = 0.58 + 0.42 * Math.sin(time * star.twinkleSpeed * 2.3 + star.phase);
      const alpha = profile.starAlpha * star.alpha * twinkle;
      if (alpha <= 0.01) continue;
      const x = star.x * this.width;
      const y = star.y * this.height;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = profile.starColor;
      ctx.shadowColor = rgba(profile.starColor, alpha);
      ctx.shadowBlur = star.radius * 7;
      ctx.beginPath();
      ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawAtmosphericDepth(profile: SceneProfile, lightningFlash: number): void {
    if (!this.composition) return;
    const ctx = this.context;
    const glowPasses = Math.max(1, this.composition.budget.horizonGlowPasses);
    const shadowPasses = Math.max(1, this.composition.budget.shadowPasses);

    for (let index = 0; index < glowPasses; index += 1) {
      const depth = index / glowPasses;
      const glow = ctx.createRadialGradient(
        this.width * 0.5,
        this.height * (1.02 + depth * 0.03),
        this.width * 0.06,
        this.width * 0.5,
        this.height * (0.98 + depth * 0.02),
        this.width * (0.38 + depth * 0.24),
      );
      glow.addColorStop(0, rgba(profile.horizonGlow, profile.horizonLift * (0.22 + depth * 0.18) + lightningFlash * 0.08));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, this.height * 0.45, this.width, this.height * 0.6);
    }

    for (let index = 0; index < shadowPasses; index += 1) {
      const depth = index / shadowPasses;
      const ceiling = ctx.createLinearGradient(0, 0, 0, this.height * (0.52 + depth * 0.08));
      ceiling.addColorStop(0, rgba(profile.cloudShadow, 0.18 + profile.overcast * (0.24 + depth * 0.08) + lightningFlash * 0.05));
      ceiling.addColorStop(0.32, rgba(profile.cloudMid, profile.cloudCeiling * (0.16 + depth * 0.06)));
      ceiling.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ceiling;
      ctx.fillRect(0, 0, this.width, this.height * (0.62 + depth * 0.04));
    }

    const horizonMist = ctx.createLinearGradient(0, this.height * 0.5, 0, this.height);
    horizonMist.addColorStop(0, "rgba(0,0,0,0)");
    horizonMist.addColorStop(0.58, profile.terrainMistColor);
    horizonMist.addColorStop(1, rgba(profile.fogLight, 0.1 + profile.haze * 0.12));
    ctx.fillStyle = horizonMist;
    ctx.fillRect(0, this.height * 0.48, this.width, this.height * 0.52);
  }

  private drawAnchorLayers(time: number, anchors: HorizonAnchor[], profile: SceneProfile, lightningFlash: number): void {
    if (!anchors.length) return;
    const ctx = this.context;

    for (const anchor of anchors) {
      const travel = this.width * anchor.parallax;
      const x = anchor.x * this.width + Math.sin(time * 0.02 + anchor.depth) * travel;
      const y = anchor.y * this.height;
      ctx.save();
      ctx.filter = `blur(${anchor.blur}px)`;
      drawSprite(
        ctx,
        anchor.sprite,
        anchor.palette,
        x,
        y,
        anchor.width,
        anchor.height,
        anchor.alpha,
        0,
        this.onAssetReady,
      );
      ctx.restore();

      if (this.composition?.budget.flags.relightAnchors && lightningFlash > 0.01) {
        ctx.save();
        ctx.globalAlpha = lightningFlash * profile.relightAlpha * anchor.relight;
        const relight = ctx.createLinearGradient(0, y, 0, y + anchor.height * 0.6);
        relight.addColorStop(0, profile.anchorRimColor);
        relight.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = relight;
        ctx.fillRect(x, y, anchor.width, anchor.height * 0.56);
        ctx.restore();
      }
    }
  }

  private drawMotes(time: number, motes: MoteParticle[], profile: SceneProfile): void {
    if (motes.length === 0) return;
    const ctx = this.context;
    for (const mote of motes) {
      const x = (mote.x + Math.sin(time * mote.speed + mote.phase) * mote.driftX) * this.width;
      const y = (mote.y + Math.cos(time * mote.speed * 0.7 + mote.phase) * mote.driftY) * this.height;
      ctx.save();
      ctx.globalAlpha = mote.alpha * (0.26 + profile.haze * 0.26);
      ctx.fillStyle = rgba(profile.sunColor, 0.18);
      ctx.beginPath();
      ctx.arc(x, y, mote.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawThermalShimmer(time: number, profile: SceneProfile): void {
    if (!this.composition || profile.thermalShimmerAlpha <= 0.01 || this.composition.budget.distortionPasses <= 0) return;
    const ctx = this.context;
    const passCount = Math.max(1, this.composition.budget.distortionPasses);
    for (let index = 0; index < passCount; index += 1) {
      const alpha = profile.thermalShimmerAlpha * (0.18 + index * 0.06);
      const yBase = this.height * (0.66 + index * 0.03);
      ctx.save();
      ctx.strokeStyle = rgba(profile.sunColor, alpha);
      ctx.lineWidth = 1.1 + index * 0.5;
      ctx.filter = `blur(${1.2 + index * 0.8}px)`;
      ctx.beginPath();
      for (let x = -40; x <= this.width + 40; x += 42) {
        const wave = Math.sin(x * 0.012 + time * (0.7 + index * 0.14) + index * 0.8) * (3 + index * 1.6);
        if (x === -40) {
          ctx.moveTo(x, yBase + wave);
        } else {
          ctx.lineTo(x, yBase + wave);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawSurfaceLayers(time: number, layers: SpriteLayer[], speedScale = 1): void {
    if (layers.length === 0 || !this.composition) return;
    for (const layer of layers) {
      const travel = this.width + layer.width * 0.9;
      const offset = (layer.x * travel + time * layer.speed * speedScale * (0.08 + this.composition.profile.wind * 0.12)) % travel;
      const x = offset - layer.width * 0.35;
      const y = layer.y * this.height + Math.sin(time * 0.1 + layer.phase) * layer.driftY;
      drawSprite(
        this.context,
        layer.sprite,
        layer.palette,
        x,
        y,
        layer.width,
        layer.height,
        layer.alpha,
        layer.rotation + Math.sin(time * 0.06 + layer.phase) * 0.8,
        this.onAssetReady,
      );
    }
  }

  private drawShadowSweeps(time: number, profile: SceneProfile, lightningFlash: number): void {
    if (!this.composition || profile.shadowSweepAlpha <= 0.01 || this.composition.budget.shadowSweepPasses <= 0) return;
    const ctx = this.context;
    const passes = this.composition.budget.shadowSweepPasses;
    for (let index = 0; index < passes; index += 1) {
      const width = this.width * (0.26 + index * 0.08);
      const x = ((time * (18 + index * 6) + index * this.width * 0.22) % (this.width + width * 2)) - width;
      const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.48, rgba(profile.surfaceShadow, profile.shadowSweepAlpha * (0.18 + index * 0.06)));
      gradient.addColorStop(0.52, rgba(profile.surfaceLight, (profile.shadowSweepAlpha * 0.06 + lightningFlash * 0.04) * (0.7 + index * 0.1)));
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = gradient;
      ctx.fillRect(x, this.height * 0.08, width, this.height * 0.86);
      ctx.restore();
    }
  }

  private drawWorldInteraction(
    time: number,
    profile: SceneProfile,
    lightningFlash: number,
    contactBands: SpriteLayer[],
    impactBursts: SpriteLayer[],
    runoffSheets: SpriteLayer[],
    accumulationBands: SpriteLayer[],
    fogCreep: SpriteLayer[],
  ): void {
    const ctx = this.context;

    this.drawShadowSweeps(time, profile, lightningFlash);

    if (profile.contactHazeAlpha > 0.01) {
      const contactHaze = ctx.createLinearGradient(0, this.height * 0.72, 0, this.height);
      contactHaze.addColorStop(0, "rgba(0,0,0,0)");
      contactHaze.addColorStop(0.5, rgba(profile.surfaceLight, profile.contactHazeAlpha * 0.08 + lightningFlash * profile.surfaceRelightAlpha * 0.03));
      contactHaze.addColorStop(1, rgba(profile.surfaceShadow, profile.contactHazeAlpha * 0.16));
      ctx.fillStyle = contactHaze;
      ctx.fillRect(0, this.height * 0.68, this.width, this.height * 0.32);
    }

    this.drawSurfaceLayers(time, fogCreep, 0.7);
    this.drawSurfaceLayers(time, contactBands, 0.84);
    this.drawSurfaceLayers(time, runoffSheets, 1.16);
    this.drawSurfaceLayers(time, accumulationBands, 0.46);
    this.drawSurfaceLayers(time, impactBursts, 1.52);

    if (profile.wetSheenAlpha > 0.01 || lightningFlash > 0.01) {
      const wetGlow = ctx.createRadialGradient(
        this.width * 0.5,
        this.height * 1.02,
        this.width * 0.06,
        this.width * 0.5,
        this.height * 0.99,
        this.width * 0.46,
      );
      wetGlow.addColorStop(0, rgba(profile.surfaceLight, profile.wetSheenAlpha * 0.1 + lightningFlash * profile.surfaceRelightAlpha * 0.08));
      wetGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = wetGlow;
      ctx.fillRect(0, this.height * 0.78, this.width, this.height * 0.22);
    }
  }

  private drawCloudLayers(time: number, layers: SpriteLayer[]): void {
    if (layers.length === 0 || !this.composition) return;
    for (const layer of layers) {
      const travel = this.width + layer.width * 1.6;
      const offset = (layer.x * travel + time * layer.speed * (0.45 + this.composition.profile.wind)) % travel;
      const x = offset - layer.width * 0.8;
      const y = layer.y * this.height + Math.sin(time * 0.14 + layer.phase) * layer.driftY;
      drawSprite(
        this.context,
        layer.sprite,
        layer.palette,
        x,
        y,
        layer.width,
        layer.height,
        layer.alpha,
        layer.rotation + Math.sin(time * 0.05 + layer.phase) * 1.1,
        this.onAssetReady,
      );
    }
  }

  private drawFogWisps(time: number, wisps: SpriteLayer[]): void {
    if (wisps.length === 0 || !this.composition) return;
    for (const wisp of wisps) {
      const travel = this.width + wisp.width * 1.3;
      const offset = (wisp.x * travel + time * wisp.speed * (0.28 + this.composition.profile.wind * 0.5)) % travel;
      const x = offset - wisp.width * 0.6;
      const y = wisp.y * this.height + Math.sin(time * 0.12 + wisp.phase) * wisp.driftY;
      drawSprite(
        this.context,
        wisp.sprite,
        wisp.palette,
        x,
        y,
        wisp.width,
        wisp.height,
        wisp.alpha,
        wisp.rotation,
        this.onAssetReady,
      );
    }
  }

  private drawCurtainTextures(time: number, textures: SpriteLayer[]): void {
    if (textures.length === 0 || !this.composition) return;
    for (const texture of textures) {
      const travel = this.width + texture.width * 0.6;
      const offset = (texture.x * travel + time * texture.speed * (0.16 + this.composition.profile.wind * 0.22)) % travel;
      const x = offset - texture.width * 0.3;
      const y = texture.y * this.height + Math.sin(time * 0.08 + texture.phase) * texture.driftY;
      drawSprite(
        this.context,
        texture.sprite,
        texture.palette,
        x,
        y,
        texture.width,
        texture.height,
        texture.alpha,
        texture.rotation,
        this.onAssetReady,
      );
    }
  }

  private drawCurtains(time: number, curtains: CurtainBand[], profile: SceneProfile): void {
    if (curtains.length === 0) return;
    const ctx = this.context;
    for (const curtain of curtains) {
      const drift = ((curtain.x + time * curtain.speed * 0.005) % 1) * this.width;
      const width = curtain.width * this.width;
      ctx.save();
      ctx.filter = `blur(${curtain.blur}px)`;
      ctx.globalAlpha = curtain.alpha;
      const gradient = ctx.createLinearGradient(drift, this.height * 0.18, drift + width * curtain.slant, this.height);
      if (this.state.condition === "snow") {
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.36, rgba(profile.snowColor, 0.18));
        gradient.addColorStop(1, rgba(profile.snowColor, 0.34));
      } else {
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.24, rgba(profile.rainColor, 0.12));
        gradient.addColorStop(1, rgba(profile.rainColor, 0.32));
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(drift, this.height * 0.12);
      ctx.lineTo(drift + width, this.height * 0.12);
      ctx.lineTo(drift + width + width * curtain.slant, this.height);
      ctx.lineTo(drift + width * curtain.slant, this.height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private getParticleStride(kind: RendererKind, densityBias = 1): number {
    const baselinePixels = 1280 * 720;
    const areaScale = Math.sqrt(baselinePixels / Math.max(1, this.width * this.height));
    const qualityScale =
      this.prefs.qualityMode === "cinematic"
        ? 1
        : this.prefs.qualityMode === "standard"
          ? 0.88
          : this.prefs.qualityMode === "lite"
            ? 0.76
            : 0.64;
    const frontPenalty = kind === "front" ? 0.86 : 1;
    const drawScale = clamp(areaScale * qualityScale * frontPenalty * densityBias, 0.34, 1);
    return Math.max(1, Math.ceil(1 / drawScale));
  }

  private drawRain(time: number, particles: RainParticle[], profile: SceneProfile, kind: RendererKind): void {
    if (particles.length === 0) return;
    const ctx = this.context;
    const stride = this.getParticleStride(kind, 0.94);
    const mainAlpha = (kind === "front" ? 0.38 : 0.24) * clamp(profile.nearPrecipAlpha + profile.distantPrecipAlpha * 0.4, 0.4, 1.05);
    const lengthScale = kind === "front" ? 0.72 : 0.56;
    const slantScale = 0.08 + profile.wind * (kind === "front" ? 0.1 : 0.07);

    ctx.save();
    ctx.strokeStyle = rgba(profile.rainColor, mainAlpha);
    ctx.lineWidth = kind === "front" ? 1.4 : 1;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let index = 0; index < particles.length; index += stride) {
      const particle = particles[index];
      const progress = (time / particle.cycle + particle.offset) % 1;
      const x = (particle.x + progress * particle.drift + Math.sin(time * 2.2 + particle.phase) * particle.sway) * this.width;
      const y = -particle.height + progress * (this.height + particle.height * 1.4);
      const length = particle.height * lengthScale;
      const slant = length * slantScale + particle.width * 0.8;
      ctx.moveTo(x, y);
      ctx.lineTo(x - slant, y - length);
    }
    ctx.stroke();

    const highlightStride = stride * (kind === "front" ? 3 : 5);
    ctx.strokeStyle = rgba("#ffffff", kind === "front" ? mainAlpha * 0.72 : mainAlpha * 0.44);
    ctx.lineWidth = kind === "front" ? 0.8 : 0.55;
    ctx.beginPath();
    for (let index = 0; index < particles.length; index += highlightStride) {
      const particle = particles[index];
      const progress = (time / particle.cycle + particle.offset) % 1;
      const x = (particle.x + progress * particle.drift + Math.sin(time * 2.2 + particle.phase) * particle.sway) * this.width;
      const y = -particle.height + progress * (this.height + particle.height * 1.4);
      const length = particle.height * (lengthScale * 0.42);
      const slant = length * slantScale;
      ctx.moveTo(x, y);
      ctx.lineTo(x - slant, y - length);
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawSnow(time: number, particles: SnowParticle[], profile: SceneProfile, kind: RendererKind): void {
    if (particles.length === 0) return;
    const ctx = this.context;
    const stride = this.getParticleStride(kind, 1.08);
    const baseRadiusScale = kind === "front" ? 0.22 : 0.18;
    ctx.save();
    ctx.fillStyle = rgba(profile.snowColor, kind === "front" ? 0.42 : 0.28);
    ctx.beginPath();
    for (let index = 0; index < particles.length; index += stride) {
      const particle = particles[index];
      const progress = (time / particle.cycle + particle.offset) % 1;
      const x =
        (particle.x + Math.sin(time * particle.sway + particle.phase) * particle.drift + progress * particle.drift * 0.18) * this.width;
      const y = -particle.size + progress * (this.height + particle.size * 1.4);
      const radius = Math.max(1, particle.size * baseRadiusScale);
      ctx.moveTo(x + radius, y);
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fill();

    const highlightStride = stride * (kind === "front" ? 4 : 6);
    ctx.fillStyle = rgba("#ffffff", kind === "front" ? 0.34 : 0.22);
    ctx.beginPath();
    for (let index = 0; index < particles.length; index += highlightStride) {
      const particle = particles[index];
      const progress = (time / particle.cycle + particle.offset) % 1;
      const x =
        (particle.x + Math.sin(time * particle.sway + particle.phase) * particle.drift + progress * particle.drift * 0.18) * this.width;
      const y = -particle.size + progress * (this.height + particle.size * 1.4);
      const radius = Math.max(0.9, particle.size * baseRadiusScale * 0.54);
      ctx.moveTo(x + radius, y);
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  private drawHorizon(profile: SceneProfile, lightningFlash: number): void {
    const ctx = this.context;
    const gradient = ctx.createLinearGradient(0, this.height * 0.44, 0, this.height);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.68, rgba(profile.surfaceLight, profile.horizonGlintAlpha * 0.08 + lightningFlash * 0.03));
    gradient.addColorStop(0.8, rgba(profile.fogLight, 0.08 + lightningFlash * 0.03));
    gradient.addColorStop(1, rgba(profile.fogLight, 0.18 + lightningFlash * 0.06));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, this.height * 0.4, this.width, this.height * 0.6);

    const lowMist = ctx.createRadialGradient(this.width * 0.5, this.height * 1.05, this.width * 0.08, this.width * 0.5, this.height * 1.02, this.width * 0.8);
    lowMist.addColorStop(0, rgba(profile.fogLight, 0.08 + profile.fogDensity * 0.1));
    lowMist.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lowMist;
    ctx.fillRect(0, this.height * 0.56, this.width, this.height * 0.5);

    const terrainFade = ctx.createLinearGradient(0, this.height * 0.58, 0, this.height);
    terrainFade.addColorStop(0, "rgba(0,0,0,0)");
    terrainFade.addColorStop(0.5, rgba(profile.anchorNearColor, 0.08 + profile.anchorAlpha * 0.16));
    terrainFade.addColorStop(1, rgba(profile.anchorNearColor, 0.24 + profile.anchorAlpha * 0.14));
    ctx.fillStyle = terrainFade;
    ctx.fillRect(0, this.height * 0.58, this.width, this.height * 0.42);
  }

  private drawVignette(profile: SceneProfile): void {
    this.context.fillStyle = profile.vignette;
    this.context.fillRect(0, 0, this.width, this.height);
  }

  private drawGlass(
    profile: SceneProfile,
    time: number,
    rivulets: GlassParticle[],
    beads: GlassParticle[],
    condensationBlooms: SpriteLayer[],
    lightningFlash: number,
  ): void {
    if (
      !this.composition?.budget.flags.glassOverlay ||
      this.kind !== "back" ||
      profile.windowOpacity <= 0.02 ||
      (!rivulets.length && !beads.length && condensationBlooms.length === 0 && profile.condensationAlpha <= 0.01)
    ) {
      return;
    }
    const palette = buildGlassPalette(profile);
    const ctx = this.context;

    if (profile.condensationAlpha > 0.01) {
      const edgePool = ctx.createLinearGradient(0, 0, 0, this.height * 0.22);
      edgePool.addColorStop(0, rgba(profile.fogLight, profile.condensationAlpha * 0.12));
      edgePool.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = edgePool;
      ctx.fillRect(0, 0, this.width, this.height * 0.22);

      const leftEdge = ctx.createLinearGradient(0, 0, this.width * 0.08, 0);
      leftEdge.addColorStop(0, rgba(profile.fogLight, profile.condensationAlpha * 0.08));
      leftEdge.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = leftEdge;
      ctx.fillRect(0, 0, this.width * 0.1, this.height);

      const rightEdge = ctx.createLinearGradient(this.width, 0, this.width * 0.92, 0);
      rightEdge.addColorStop(0, rgba(profile.fogLight, profile.condensationAlpha * 0.08));
      rightEdge.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rightEdge;
      ctx.fillRect(this.width * 0.9, 0, this.width * 0.1, this.height);

      const bottomPool = ctx.createRadialGradient(
        this.width * 0.5,
        this.height * 1.04,
        this.width * 0.08,
        this.width * 0.5,
        this.height * 1.02,
        this.width * 0.46,
      );
      bottomPool.addColorStop(0, rgba(profile.fogLight, profile.condensationAlpha * 0.12 + lightningFlash * 0.02));
      bottomPool.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bottomPool;
      ctx.fillRect(0, this.height * 0.78, this.width, this.height * 0.22);
    }

    if (condensationBlooms.length > 0) {
      this.drawSurfaceLayers(time, condensationBlooms, 0.38);
    }

    if (this.composition && this.composition.budget.distortionPasses > 0 && profile.distortionAlpha > 0.01) {
      for (let index = 0; index < this.composition.budget.distortionPasses; index += 1) {
        const x = ((time * (10 + index * 4) + index * this.width * 0.18) % (this.width * 1.4)) - this.width * 0.2;
        const distortion = ctx.createLinearGradient(x, 0, x + this.width * 0.18, 0);
        distortion.addColorStop(0, "rgba(255,255,255,0)");
        distortion.addColorStop(0.5, rgba(profile.fogLight, profile.distortionAlpha * (0.04 + index * 0.02)));
        distortion.addColorStop(1, "rgba(255,255,255,0)");
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = distortion;
        ctx.fillRect(x, 0, this.width * 0.18, this.height);
        ctx.restore();
      }
    }

    for (const rivulet of rivulets) {
      const progress = (time * rivulet.speed + rivulet.phase / (Math.PI * 2)) % 1;
      const x = (rivulet.x + Math.sin(time * 0.28 + rivulet.phase) * rivulet.drift) * this.width;
      const y = -rivulet.height * 0.4 + progress * (this.height + rivulet.height * 0.8);
      drawSprite(
        ctx,
        "glass-rivulet",
        palette,
        x,
        y,
        rivulet.width,
        rivulet.height,
        rivulet.alpha,
        0,
        this.onAssetReady,
      );
    }
    for (const bead of beads) {
      const offset = this.state.condition === "fog" ? Math.sin(time * bead.speed + bead.phase) * 0.01 : time * bead.speed;
      const x = (bead.x + Math.cos(time * 0.2 + bead.phase) * bead.drift) * this.width;
      const y = (bead.y + offset) * this.height;
      drawSprite(
        ctx,
        "glass-drop",
        palette,
        x,
        y,
        bead.width,
        bead.height,
        bead.alpha,
        0,
        this.onAssetReady,
      );
    }
  }

  private resolveLightningState(time: number): { flash: number; bolts: Array<LightningBolt & { alpha: number }> } {
    if (!this.lightningEvents.length) return { flash: 0, bolts: [] };
    const now = time;
    this.lightningEvents = this.lightningEvents.filter((event) => event.start + event.duration > now);
    if (!this.lightningEvents.length) return { flash: 0, bolts: [] };

    let flash = 0;
    const bolts: Array<LightningBolt & { alpha: number }> = [];
    for (const event of this.lightningEvents) {
      if (now < event.start) continue;
      const progress = clamp((now - event.start) / event.duration, 0, 1);
      const strength = Math.sin((1 - progress) * Math.PI) * event.flash;
      flash = Math.max(flash, strength);
      for (const bolt of event.bolts) {
        bolts.push({ ...bolt, alpha: bolt.alpha * (1 - progress) });
      }
    }
    return { flash, bolts };
  }

  private drawLightningState(profile: SceneProfile, lightning: { flash: number; bolts: Array<LightningBolt & { alpha: number }> }): void {
    if (lightning.flash <= 0.001 && lightning.bolts.length === 0) return;
    const palette = buildLightningPalette(profile);
    const ctx = this.context;

    ctx.save();
    ctx.globalAlpha = lightning.flash * (this.kind === "back" ? 0.46 : 0.26);
    ctx.fillStyle = rgba(profile.lightningGlow, 0.72);
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    for (const bolt of lightning.bolts) {
      drawSprite(
        ctx,
        "lightning-fork",
        palette,
        bolt.x * this.width,
        bolt.y * this.height,
        bolt.width,
        bolt.height,
        bolt.alpha,
        bolt.rotation,
        this.onAssetReady,
      );
    }
  }

  private handleFatalError(error: unknown): void {
    if (this.failed) return;
    this.failed = true;
    this.stopLoop();
    this.visible = false;
    this.root.classList.add("weather-hidden");
    this.root.classList.remove("weather-visible");
    this.root.dataset.failed = "true";
    console.error("[weather_hud] renderer disabled after runtime error", error);
  }
}

export interface WeatherRendererHandle {
  root: HTMLDivElement;
  destroy(): void;
  refreshLayout(): void;
  setScene(state: WeatherState, prefs: WeatherPrefs, reducedMotion: boolean): void;
  setVisible(visible: boolean): void;
  triggerLightning(): void;
}

export function createWeatherRenderer(kind: RendererKind): WeatherRendererHandle {
  let renderer: CanvasWeatherRenderer;
  try {
    renderer = new CanvasWeatherRenderer(kind);
  } catch (error) {
    console.error(`[weather_hud] failed to initialize ${kind} renderer`, error);
    const root = document.createElement("div");
    root.className = "weather-fx-root weather-fx-renderer-root weather-hidden";
    root.dataset.kind = kind;
    root.dataset.failed = "true";
    root.setAttribute("aria-hidden", "true");
    return {
      root,
      destroy: () => root.remove(),
      refreshLayout: () => undefined,
      setScene: () => undefined,
      setVisible: () => undefined,
      triggerLightning: () => undefined,
    };
  }
  return {
    root: renderer.root,
    destroy: () => renderer.destroy(),
    refreshLayout: () => renderer.refreshLayout(),
    setScene: (state, prefs, reducedMotion) => renderer.setScene(state, prefs, reducedMotion),
    setVisible: (visible) => renderer.setVisible(visible),
    triggerLightning: () => renderer.triggerLightning(),
  };
}
