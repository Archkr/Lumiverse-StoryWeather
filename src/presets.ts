import { formatDate, makeDefaultWeatherState } from "./shared";
import type { WeatherState } from "./types";

export interface WeatherScenePreset {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  state: Pick<
    WeatherState,
    "time" | "condition" | "summary" | "temperature" | "wind" | "layer" | "palette" | "intensity"
  >;
}

export const WEATHER_SCENE_PRESETS: WeatherScenePreset[] = [
  {
    id: "clear-day",
    label: "Clear day",
    shortLabel: "Day",
    description: "Open skies, soft daylight, faint sun haze.",
    state: {
      time: "1:18 PM",
      condition: "clear",
      summary: "Bright open skies",
      temperature: "72F",
      wind: "light breeze",
      layer: "back",
      palette: "day",
      intensity: 0.34,
    },
  },
  {
    id: "golden-hour",
    label: "Golden hour",
    shortLabel: "Golden",
    description: "Low warm sun, long shadows, dust motes in the air.",
    state: {
      time: "6:42 PM",
      condition: "clear",
      summary: "Golden hour glow",
      temperature: "65F",
      wind: "calm",
      layer: "back",
      palette: "dusk",
      intensity: 0.42,
    },
  },
  {
    id: "overcast",
    label: "Overcast",
    shortLabel: "Overcast",
    description: "Heavy ceiling, muted daylight, slow drift.",
    state: {
      time: "11:26 AM",
      condition: "cloudy",
      summary: "Heavy overcast",
      temperature: "63F",
      wind: "cool drift",
      layer: "back",
      palette: "day",
      intensity: 0.58,
    },
  },
  {
    id: "rain",
    label: "Steady rain",
    shortLabel: "Rain",
    description: "Angled rain with a low base mist.",
    state: {
      time: "2:42 PM",
      condition: "rain",
      summary: "Rain sweeping through",
      temperature: "61F",
      wind: "steady rainwind",
      layer: "both",
      palette: "day",
      intensity: 0.74,
    },
  },
  {
    id: "storm",
    label: "Thunderstorm",
    shortLabel: "Storm",
    description: "Dark thunderheads, hard rain, lightning flashes.",
    state: {
      time: "8:18 PM",
      condition: "storm",
      summary: "Thunderheads building",
      temperature: "58F",
      wind: "hard gusts",
      layer: "both",
      palette: "storm",
      intensity: 0.94,
    },
  },
  {
    id: "snow",
    label: "Snowfall",
    shortLabel: "Snow",
    description: "Layered drifting snow, cold luminous air.",
    state: {
      time: "6:48 AM",
      condition: "snow",
      summary: "Quiet snowfall",
      temperature: "29F",
      wind: "hushed air",
      layer: "both",
      palette: "snow",
      intensity: 0.68,
    },
  },
  {
    id: "fog",
    label: "Low fog",
    shortLabel: "Fog",
    description: "Slow fog banks pooling along the lower scene.",
    state: {
      time: "6:12 AM",
      condition: "fog",
      summary: "Fog pooling low",
      temperature: "54F",
      wind: "still",
      layer: "back",
      palette: "mist",
      intensity: 0.64,
    },
  },
  {
    id: "clear-night",
    label: "Starlit night",
    shortLabel: "Night",
    description: "Cool moonlit air with quiet starlight.",
    state: {
      time: "10:18 PM",
      condition: "clear",
      summary: "Clear night sky",
      temperature: "57F",
      wind: "light night wind",
      layer: "back",
      palette: "night",
      intensity: 0.24,
    },
  },
];

export function getWeatherScenePreset(presetId: string): WeatherScenePreset | null {
  return WEATHER_SCENE_PRESETS.find((preset) => preset.id === presetId) ?? null;
}

export function buildPresetWeatherState(
  presetId: string,
  currentState?: WeatherState | null,
): Partial<WeatherState> | null {
  const preset = getWeatherScenePreset(presetId);
  if (!preset) return null;

  const baseState = currentState ?? makeDefaultWeatherState();
  const fallbackDate = /^\d{4}-\d{2}-\d{2}$/.test(baseState.date) ? baseState.date : formatDate(new Date());

  return {
    location: baseState.location,
    date: fallbackDate,
    ...preset.state,
    source: "manual",
  };
}

export function matchWeatherScenePreset(state?: WeatherState | null): string | null {
  if (!state) return null;
  const match = WEATHER_SCENE_PRESETS.find(
    (preset) =>
      preset.state.condition === state.condition &&
      preset.state.palette === state.palette &&
      preset.state.layer === state.layer &&
      preset.state.summary === state.summary &&
      Math.abs(preset.state.intensity - state.intensity) < 0.05,
  );
  return match?.id ?? null;
}
