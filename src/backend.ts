type WeatherSpindleAPI = import("lumiverse-spindle-types").SpindleAPI & {
  variables: {
    local: {
      get(chatId: string, key: string): Promise<string>;
      set(chatId: string, key: string, value: string): Promise<void>;
      delete(chatId: string, key: string): Promise<void>;
    };
  };
  chats: {
    getActive(): Promise<{ id: string } | null>;
  };
};

declare const spindle: WeatherSpindleAPI;

import type { BackendToFrontend, FrontendToBackend, WeatherPrefs, WeatherState } from "./types";
import {
  DEFAULT_PREFS,
  WEATHER_CONDITIONS,
  WEATHER_LAYERS,
  WEATHER_MANUAL_STATE_VAR,
  WEATHER_PALETTES,
  WEATHER_STATE_VAR,
  makeDefaultWeatherState,
  normalizePrefs,
  normalizeWeatherState,
  normalizeWeatherTag,
} from "./shared";

const PREFS_FILE = "weather_prefs.json";
const TRACKER_MACROS = ["weather_tracker", "story_weather_tracker", "story_weather"] as const;
const FORMAT_MACROS = ["weather_format", "story_weather_format"] as const;
const STATE_MACROS = ["weather_state", "story_weather_state"] as const;

let activeUserId: string | null = null;
let lastKnownChatId: string | null = null;

function send(message: BackendToFrontend): void {
  spindle.sendToFrontend(message);
}

function tagExample(): string {
  return '<weather-state location="Tengu City" date="2026-03-24" time="9:42 PM" condition="rain" summary="Cold spring rain" temperature="61F" intensity="0.65" wind="breezy" layer="both" palette="storm"></weather-state>';
}

function summarizeState(state: WeatherState | null): string {
  if (!state) return "No saved weather state yet.";
  return [
    `Location: ${state.location}`,
    `Date: ${state.date}`,
    `Time: ${state.time}`,
    `Condition: ${state.condition}`,
    `Summary: ${state.summary}`,
    `Temperature: ${state.temperature}`,
    `Intensity: ${state.intensity.toFixed(2)}`,
    `Wind: ${state.wind}`,
    `Layer: ${state.layer}`,
    `Palette: ${state.palette}`,
  ].join(" | ");
}

function trackerInstruction(state: WeatherState | null): string {
  return [
    "STORY WEATHER OUTPUT FORMAT:",
    "Write the visible reply first, then append exactly one final XML <weather-state> tag.",
    "Never omit the tag, never wrap it in markdown, never explain it.",
    "Place the tag as the very last text in the assistant message — no prose after it.",
    `Allowed conditions: ${WEATHER_CONDITIONS.join(", ")}`,
    `Allowed layers: ${WEATHER_LAYERS.join(", ")}`,
    `Allowed palettes: ${WEATHER_PALETTES.join(", ")}`,
    "All ten attributes are required: location, date (YYYY-MM-DD), time, condition, summary, temperature, intensity (0-1), wind, layer, palette.",
    "Exact wrapper example:",
    tagExample(),
    `Current scene: ${summarizeState(state)}`,
  ].join("\n");
}

function buildWeatherTagRegex(flags = "ig"): RegExp {
  return new RegExp(String.raw`<weather-state\b[^>]*(?:\/>|>[\s\S]*?<\/weather-state>)`, flags);
}

function stripWeatherStateTags(content: string): string {
  return content.replace(buildWeatherTagRegex(), "").replace(/\n{3,}/g, "\n\n").trim();
}

function pushMacroValues(state: WeatherState | null): void {
  const formatValue = tagExample();
  const trackerValue = trackerInstruction(state);
  const stateValue = summarizeState(state);
  for (const name of FORMAT_MACROS) spindle.updateMacroValue(name, formatValue);
  for (const name of TRACKER_MACROS) spindle.updateMacroValue(name, trackerValue);
  for (const name of STATE_MACROS) spindle.updateMacroValue(name, stateValue);
}

async function loadPrefs(userId: string): Promise<WeatherPrefs> {
  try {
    const stored = await spindle.userStorage.getJson<WeatherPrefs>(PREFS_FILE, {
      userId,
      fallback: DEFAULT_PREFS,
    });
    return normalizePrefs(stored);
  } catch {
    return DEFAULT_PREFS;
  }
}

async function savePrefs(userId: string, prefs: WeatherPrefs): Promise<void> {
  await spindle.userStorage.setJson(PREFS_FILE, prefs, { userId });
}

async function loadStoryState(chatId: string): Promise<WeatherState | null> {
  try {
    const raw = await spindle.variables.local.get(chatId, WEATHER_STATE_VAR);
    return raw ? normalizeWeatherState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

async function saveStoryState(chatId: string, state: WeatherState): Promise<void> {
  await spindle.variables.local.set(chatId, WEATHER_STATE_VAR, JSON.stringify(state));
}

async function clearStoryState(chatId: string): Promise<void> {
  try {
    await spindle.variables.local.delete(chatId, WEATHER_STATE_VAR);
  } catch {
    /* ignore */
  }
}

async function loadManualState(chatId: string): Promise<WeatherState | null> {
  try {
    const raw = await spindle.variables.local.get(chatId, WEATHER_MANUAL_STATE_VAR);
    return raw ? normalizeWeatherState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

async function saveManualState(chatId: string, state: WeatherState): Promise<void> {
  await spindle.variables.local.set(chatId, WEATHER_MANUAL_STATE_VAR, JSON.stringify(state));
}

async function clearManualState(chatId: string): Promise<void> {
  try {
    await spindle.variables.local.delete(chatId, WEATHER_MANUAL_STATE_VAR);
  } catch {
    /* ignore */
  }
}

async function loadEffectiveState(chatId: string): Promise<WeatherState | null> {
  return (await loadManualState(chatId)) ?? (await loadStoryState(chatId));
}

async function resolveChatId(candidate?: string | null): Promise<string | null> {
  if (candidate) return candidate;
  if (lastKnownChatId) return lastKnownChatId;
  try {
    const active = await spindle.chats.getActive();
    return active?.id ?? null;
  } catch {
    return null;
  }
}

async function pushPrefs(userId: string): Promise<void> {
  send({ type: "prefs", prefs: await loadPrefs(userId) });
}

async function pushActiveChatState(chatId?: string | null): Promise<void> {
  const resolved = await resolveChatId(chatId);
  lastKnownChatId = resolved;
  if (!resolved) {
    pushMacroValues(null);
    send({ type: "active_chat_state", chatId: null, state: null });
    return;
  }
  const state = await loadEffectiveState(resolved);
  pushMacroValues(state);
  send({ type: "active_chat_state", chatId: resolved, state });
}

function extractChatId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const id = (payload as { chatId?: unknown }).chatId;
  return typeof id === "string" && id.trim() ? id : null;
}

function extractActiveChatSetting(payload: unknown): string | null | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const key = (payload as { key?: unknown }).key;
  if (key !== "activeChatId") return undefined;
  const value = (payload as { value?: unknown }).value;
  return typeof value === "string" && value.trim() ? value : null;
}

for (const name of FORMAT_MACROS) {
  spindle.registerMacro({
    name,
    category: "extension:story_weather",
    description: "Example weather-state tag format",
    returnType: "string",
    handler: "",
  });
}
for (const name of TRACKER_MACROS) {
  spindle.registerMacro({
    name,
    category: "extension:story_weather",
    description: "Story Weather tracking instructions for the model",
    returnType: "string",
    handler: "",
  });
}
for (const name of STATE_MACROS) {
  spindle.registerMacro({
    name,
    category: "extension:story_weather",
    description: "Current story weather state summary",
    returnType: "string",
    handler: "",
  });
}

pushMacroValues(null);

spindle.registerInterceptor(async (messages, context) => {
  const chatId = extractChatId(context);
  const state = chatId ? await loadEffectiveState(chatId) : null;
  pushMacroValues(state);
  const cleaned = messages.map((message) => {
    if (!message || typeof message.content !== "string") return message;
    return { ...message, content: stripWeatherStateTags(message.content) };
  });
  return [
    { role: "system" as const, content: `[Story Weather]\n${trackerInstruction(state)}` },
    ...cleaned,
  ];
}, 90);

spindle.on("CHAT_CHANGED", (payload: unknown) => {
  const chatId = extractChatId(payload);
  if (!chatId) return;
  void pushActiveChatState(chatId);
});

spindle.on("SETTINGS_UPDATED", (payload: unknown) => {
  const chatId = extractActiveChatSetting(payload);
  if (typeof chatId === "undefined") return;
  void pushActiveChatState(chatId);
});

spindle.onFrontendMessage(async (raw, userId) => {
  if (activeUserId !== userId) activeUserId = userId;
  const message = raw as FrontendToBackend;

  try {
    switch (message.type) {
      case "frontend_ready": {
        await pushPrefs(userId);
        await pushActiveChatState();
        break;
      }

      case "chat_changed": {
        await pushActiveChatState(message.chatId);
        break;
      }

      case "weather_tag_intercepted": {
        if (message.isStreaming) break;
        const chatId = await resolveChatId(message.chatId);
        if (!chatId) {
          send({ type: "error", message: "Weather tag ignored: no active chat." });
          break;
        }
        const previous = await loadStoryState(chatId);
        const next = normalizeWeatherTag(message.attrs, previous);
        await saveStoryState(chatId, next);
        lastKnownChatId = chatId;
        pushMacroValues(next);
        const manual = await loadManualState(chatId);
        if (!manual) send({ type: "weather_state", chatId, state: next });
        break;
      }

      case "set_manual_state": {
        const chatId = await resolveChatId(message.chatId);
        if (!chatId) {
          send({ type: "error", message: "Manual override needs an active chat." });
          break;
        }
        const previous =
          (await loadManualState(chatId)) ?? (await loadEffectiveState(chatId)) ?? makeDefaultWeatherState();
        const next = normalizeWeatherState(
          { ...previous, ...message.state, updatedAt: Date.now(), source: "manual" },
          previous,
        );
        await saveManualState(chatId, next);
        lastKnownChatId = chatId;
        pushMacroValues(next);
        send({ type: "weather_state", chatId, state: next });
        break;
      }

      case "clear_manual_override": {
        const chatId = await resolveChatId(message.chatId);
        if (!chatId) {
          send({ type: "error", message: "Cannot clear override: no active chat." });
          break;
        }
        await clearManualState(chatId);
        lastKnownChatId = chatId;
        const restored = (await loadStoryState(chatId)) ?? makeDefaultWeatherState();
        pushMacroValues(restored);
        send({ type: "weather_state", chatId, state: restored });
        break;
      }

      case "clear_weather_state": {
        const chatId = await resolveChatId(message.chatId);
        if (!chatId) {
          send({ type: "error", message: "Cannot clear weather: no active chat." });
          break;
        }
        await clearManualState(chatId);
        await clearStoryState(chatId);
        lastKnownChatId = chatId;
        await pushActiveChatState(chatId);
        break;
      }

      case "save_prefs": {
        const current = await loadPrefs(userId);
        const next = normalizePrefs({ ...current, ...message.prefs });
        await savePrefs(userId, next);
        send({ type: "prefs", prefs: next });
        break;
      }

      case "reset_widget_position": {
        const current = await loadPrefs(userId);
        const next = normalizePrefs({ ...current, widgetPosition: null });
        await savePrefs(userId, next);
        send({ type: "prefs", prefs: next });
        break;
      }
    }
  } catch (error: any) {
    spindle.log.error(`Story Weather backend error: ${error?.message || error}`);
    send({ type: "error", message: error?.message || "Unknown Story Weather error." });
  }
});
