import type {
  ReducedMotionMode,
  WeatherCondition,
  WeatherEffectsQuality,
  WeatherLayerMode,
  WeatherPalette,
  WeatherPrefs,
  WeatherSourceMode,
  WeatherState,
} from "./types";

export const WEATHER_STATE_VAR = "weather_state_json";
export const WEATHER_MANUAL_STATE_VAR = "weather_manual_state_json";
export const WEATHER_TAG_NAME = "weather-state";

export const WEATHER_CONDITIONS: WeatherCondition[] = ["clear", "cloudy", "rain", "storm", "snow", "fog"];
export const WEATHER_LAYERS: WeatherLayerMode[] = ["back", "front", "both"];
export const WEATHER_PALETTES: WeatherPalette[] = ["dawn", "day", "dusk", "night", "storm", "mist", "snow"];
export const REDUCED_MOTION_VALUES: ReducedMotionMode[] = ["system", "always", "never"];
export const WEATHER_EFFECT_QUALITY_VALUES: WeatherEffectsQuality[] = ["performance", "lite", "standard", "cinematic"];

export const DEFAULT_PREFS: WeatherPrefs = {
  effectsEnabled: true,
  layerMode: "auto",
  intensity: 1,
  qualityMode: "standard",
  reducedMotion: "never",
  pauseEffects: false,
  widgetPosition: null,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function normalizeCondition(value: unknown, fallback: WeatherCondition): WeatherCondition {
  return typeof value === "string" && WEATHER_CONDITIONS.includes(value as WeatherCondition)
    ? (value as WeatherCondition)
    : fallback;
}

function normalizeLayer(value: unknown, fallback: WeatherLayerMode): WeatherLayerMode {
  return typeof value === "string" && WEATHER_LAYERS.includes(value as WeatherLayerMode)
    ? (value as WeatherLayerMode)
    : fallback;
}

function normalizePalette(value: unknown, fallback: WeatherPalette): WeatherPalette {
  return typeof value === "string" && WEATHER_PALETTES.includes(value as WeatherPalette)
    ? (value as WeatherPalette)
    : fallback;
}

function normalizeReducedMotion(value: unknown, fallback: ReducedMotionMode): ReducedMotionMode {
  return typeof value === "string" && REDUCED_MOTION_VALUES.includes(value as ReducedMotionMode)
    ? (value as ReducedMotionMode)
    : fallback;
}

function normalizeQualityMode(value: unknown, fallback: WeatherEffectsQuality): WeatherEffectsQuality {
  return typeof value === "string" && WEATHER_EFFECT_QUALITY_VALUES.includes(value as WeatherEffectsQuality)
    ? (value as WeatherEffectsQuality)
    : fallback;
}

function normalizeSource(value: unknown, fallback: WeatherSourceMode): WeatherSourceMode {
  return value === "manual" || value === "story" ? value : fallback;
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatTime(date: Date): string {
  const hours24 = date.getHours();
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${pad2(date.getMinutes())} ${suffix}`;
}

function parseHourFromTimeString(timeValue: string): number | null {
  const time12 = timeValue.match(/^(\d{1,2}):(\d{2})(?:\s*:\s*(\d{2}))?\s*([AP]M)$/i);
  if (time12) {
    let hours = Number.parseInt(time12[1], 10);
    if (hours < 1 || hours > 12) return null;
    const minutes = Number.parseInt(time12[2], 10);
    if (minutes > 59) return null;
    const meridiem = time12[4].toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return hours;
  }

  const time24 = timeValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!time24) return null;
  const hours = Number.parseInt(time24[1], 10);
  const minutes = Number.parseInt(time24[2], 10);
  if (hours > 23 || minutes > 59) return null;
  return hours;
}

export function parseStoryDateTime(dateValue: string, timeValue: string): number | null {
  const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const time12 = timeValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i);
  const time24 = timeValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (time12) {
    hours = Number.parseInt(time12[1], 10);
    minutes = Number.parseInt(time12[2], 10);
    seconds = time12[3] ? Number.parseInt(time12[3], 10) : 0;
    if (hours < 1 || hours > 12 || minutes > 59 || seconds > 59) return null;
    const meridiem = time12[4].toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
  } else if (time24) {
    hours = Number.parseInt(time24[1], 10);
    minutes = Number.parseInt(time24[2], 10);
    seconds = time24[3] ? Number.parseInt(time24[3], 10) : 0;
    if (hours > 23 || minutes > 59 || seconds > 59) return null;
  } else {
    return null;
  }

  const year = Number.parseInt(dateMatch[1], 10);
  const month = Number.parseInt(dateMatch[2], 10);
  const day = Number.parseInt(dateMatch[3], 10);
  const parsed = new Date(year, month - 1, day, hours, minutes, seconds, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export function derivePalette(condition: WeatherCondition, dateValue: string, timeValue: string): WeatherPalette {
  if (condition === "storm") return "storm";
  if (condition === "fog") return "mist";
  if (condition === "snow") return "snow";

  const timestamp = parseStoryDateTime(dateValue, timeValue);
  if (timestamp !== null) {
    const hour = new Date(timestamp).getHours();
    if (hour < 6) return "night";
    if (hour < 10) return "dawn";
    if (hour < 18) return "day";
    if (hour < 21) return "dusk";
    return "night";
  }

  const hour = parseHourFromTimeString(timeValue);
  const resolvedHour = hour ?? new Date().getHours();
  if (resolvedHour < 6) return "night";
  if (resolvedHour < 10) return "dawn";
  if (resolvedHour < 18) return "day";
  if (resolvedHour < 21) return "dusk";
  return "night";
}

export function makeDefaultWeatherState(now = Date.now()): WeatherState {
  const date = new Date(now);
  return {
    location: "Story setting",
    date: formatDate(date),
    time: formatTime(date),
    condition: "clear",
    summary: "Calm skies",
    temperature: "68F",
    intensity: 0.3,
    wind: "still",
    layer: "both",
    palette: "day",
    timestampMs: date.getTime(),
    updatedAt: now,
    source: "story",
  };
}

export function normalizeWeatherState(input: unknown, previous?: WeatherState | null): WeatherState {
  const fallback = previous ?? makeDefaultWeatherState();
  const source = isRecord(input) ? input : {};
  const date = normalizeText(source.date, fallback.date, 24);
  const time = normalizeText(source.time, fallback.time, 16);
  const timestampMs = parseStoryDateTime(date, time);
  const condition = normalizeCondition(source.condition, fallback.condition);
  const palette = normalizePalette(source.palette, derivePalette(condition, date, time));
  const intensity = clamp(parseNumeric(source.intensity) ?? fallback.intensity, 0, 1);
  const updatedAt = parseNumeric(source.updatedAt) ?? Date.now();

  return {
    location: normalizeText(source.location, fallback.location, 72),
    date,
    time,
    condition,
    summary: normalizeText(source.summary, fallback.summary, 72),
    temperature: normalizeText(source.temperature, fallback.temperature, 16),
    intensity,
    wind: normalizeText(source.wind, fallback.wind, 32),
    layer: normalizeLayer(source.layer, fallback.layer),
    palette,
    timestampMs: timestampMs ?? fallback.timestampMs,
    updatedAt,
    source: normalizeSource(source.source, fallback.source),
  };
}

export function normalizeWeatherTag(attrs: Record<string, string>, previous?: WeatherState | null): WeatherState {
  return normalizeWeatherState({ ...attrs, updatedAt: Date.now(), source: "story" }, previous);
}

export function normalizePrefs(input: unknown): WeatherPrefs {
  const source = isRecord(input) ? input : {};
  const position = isRecord(source.widgetPosition)
    ? {
        x: clamp(parseNumeric(source.widgetPosition.x) ?? 24, 0, 5000),
        y: clamp(parseNumeric(source.widgetPosition.y) ?? 96, 0, 5000),
      }
    : null;

  const layerMode = typeof source.layerMode === "string" && ["auto", ...WEATHER_LAYERS].includes(source.layerMode)
    ? (source.layerMode as WeatherPrefs["layerMode"])
    : DEFAULT_PREFS.layerMode;

  return {
    effectsEnabled: typeof source.effectsEnabled === "boolean" ? source.effectsEnabled : DEFAULT_PREFS.effectsEnabled,
    layerMode,
    intensity: clamp(parseNumeric(source.intensity) ?? DEFAULT_PREFS.intensity, 0.25, 1.5),
    qualityMode: normalizeQualityMode(source.qualityMode, DEFAULT_PREFS.qualityMode),
    reducedMotion: normalizeReducedMotion(source.reducedMotion, DEFAULT_PREFS.reducedMotion),
    pauseEffects: typeof source.pauseEffects === "boolean" ? source.pauseEffects : DEFAULT_PREFS.pauseEffects,
    widgetPosition: position,
  };
}
