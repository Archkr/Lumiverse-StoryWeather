export type WeatherCondition = "clear" | "cloudy" | "rain" | "storm" | "snow" | "fog";
export type WeatherLayerMode = "back" | "front" | "both";
export type WeatherLayerPreference = "auto" | WeatherLayerMode;
export type WeatherPalette = "dawn" | "day" | "dusk" | "night" | "storm" | "mist" | "snow";
export type ReducedMotionMode = "system" | "always" | "never";
export type WeatherSourceMode = "story" | "manual";

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WeatherState {
  location: string;
  date: string;
  time: string;
  condition: WeatherCondition;
  summary: string;
  temperature: string;
  intensity: number;
  wind: string;
  layer: WeatherLayerMode;
  palette: WeatherPalette;
  timestampMs: number | null;
  updatedAt: number;
  source: WeatherSourceMode;
}

export interface WeatherPrefs {
  effectsEnabled: boolean;
  layerMode: WeatherLayerPreference;
  intensity: number;
  reducedMotion: ReducedMotionMode;
  pauseEffects: boolean;
  widgetPosition: WidgetPosition | null;
}

export type FrontendToBackend =
  | { type: "frontend_ready" }
  | { type: "chat_changed"; chatId: string | null }
  | {
      type: "weather_tag_intercepted";
      chatId: string | null;
      messageId?: string | null;
      attrs: Record<string, string>;
      isStreaming?: boolean;
    }
  | { type: "set_manual_state"; chatId?: string | null; state: Partial<WeatherState> }
  | { type: "clear_manual_override"; chatId?: string | null }
  | { type: "save_prefs"; prefs: Partial<WeatherPrefs> }
  | { type: "reset_widget_position" };

export type BackendToFrontend =
  | { type: "prefs"; prefs: WeatherPrefs }
  | { type: "active_chat_state"; chatId: string | null; state: WeatherState | null }
  | { type: "weather_state"; chatId: string | null; state: WeatherState }
  | { type: "error"; message: string };
