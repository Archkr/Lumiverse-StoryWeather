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
const WEATHER_FORMAT_MACRO = "story_weather_format";
const WEATHER_TRACKER_MACRO = "story_weather_tracker";
const WEATHER_STATE_MACRO = "story_weather_state";

let activeUserId: string | null = null;
let lastKnownChatId: string | null = null;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildWeatherTagRegex(flags = "ig"): RegExp {
  const safeTag = escapeRegex("weather-state");
  return new RegExp(String.raw`<${safeTag}\b[^>]*(?:\/>|>[\s\S]*?<\/${safeTag}>)`, flags);
}

function stripWeatherStateTags(content: string): string {
  return content.replace(buildWeatherTagRegex(), "").replace(/\n{3,}/g, "\n\n").trim();
}

function send(message: BackendToFrontend): void {
  spindle.sendToFrontend(message);
}

async function handleUserChange(userId: string): Promise<void> {
  if (activeUserId === userId) return;
  activeUserId = userId;
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

async function loadStoryWeatherState(chatId: string): Promise<WeatherState | null> {
  try {
    const raw = await spindle.variables.local.get(chatId, WEATHER_STATE_VAR);
    if (!raw) return null;
    return normalizeWeatherState(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function saveStoryWeatherState(chatId: string, state: WeatherState): Promise<void> {
  await spindle.variables.local.set(chatId, WEATHER_STATE_VAR, JSON.stringify(state));
}

async function loadManualWeatherState(chatId: string): Promise<WeatherState | null> {
  try {
    const raw = await spindle.variables.local.get(chatId, WEATHER_MANUAL_STATE_VAR);
    if (!raw) return null;
    return normalizeWeatherState(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function saveManualWeatherState(chatId: string, state: WeatherState): Promise<void> {
  await spindle.variables.local.set(chatId, WEATHER_MANUAL_STATE_VAR, JSON.stringify(state));
}

async function clearManualWeatherState(chatId: string): Promise<void> {
  try {
    await spindle.variables.local.delete(chatId, WEATHER_MANUAL_STATE_VAR);
  } catch {
    // ignore missing override state
  }
}

async function loadEffectiveWeatherState(chatId: string): Promise<WeatherState | null> {
  const manual = await loadManualWeatherState(chatId);
  if (manual) return manual;
  return loadStoryWeatherState(chatId);
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
  const resolvedChatId = await resolveChatId(chatId);
  lastKnownChatId = resolvedChatId;

  if (!resolvedChatId) {
    pushMacroValues(null);
    send({ type: "active_chat_state", chatId: null, state: null });
    return;
  }

  const state = await loadEffectiveWeatherState(resolvedChatId);
  pushMacroValues(state);
  send({ type: "active_chat_state", chatId: resolvedChatId, state });
}

function buildWeatherTagExample(): string {
  return '<weather-state location="Tengu City" date="2026-03-24" time="9:42 PM" condition="rain" summary="Cold spring rain" temperature="61F" intensity="0.65" wind="breezy" layer="both" palette="storm"></weather-state>';
}

function summarizeWeatherState(state: WeatherState | null): string {
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

function buildTrackerMacro(state: WeatherState | null): string {
  return [
    "Append one final machine-only weather-state tag after the visible reply.",
    "Keep all visible prose outside the tag.",
    `Allowed conditions: ${WEATHER_CONDITIONS.join(", ")}`,
    `Allowed layers: ${WEATHER_LAYERS.join(", ")}`,
    `Allowed palettes: ${WEATHER_PALETTES.join(", ")}`,
    "Use location, date, time, condition, summary, temperature, intensity, wind, layer, and palette.",
    `Current scene: ${summarizeWeatherState(state)}`,
    "Example:",
    buildWeatherTagExample(),
  ].join("\n");
}

function pushMacroValues(state: WeatherState | null): void {
  spindle.updateMacroValue(WEATHER_FORMAT_MACRO, buildWeatherTagExample());
  spindle.updateMacroValue(WEATHER_TRACKER_MACRO, buildTrackerMacro(state));
  spindle.updateMacroValue(WEATHER_STATE_MACRO, summarizeWeatherState(state));
}

function buildPromptInstruction(state: WeatherState | null): string {
  return [
    "[Story Weather HUD]",
    "Keep the visible reply natural and in-character.",
    "After the visible reply, append exactly one final-line weather-state control tag.",
    "Never place the tag before visible prose, and never continue visible prose after the tag.",
    "Do not mention or explain the tag in visible prose.",
    `Continue scene metadata from: ${summarizeWeatherState(state)}`,
    `Format: ${buildWeatherTagExample()}`,
  ].join("\n");
}

function extractChatId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const maybeChatId = (payload as { chatId?: unknown }).chatId;
  return typeof maybeChatId === "string" && maybeChatId.trim() ? maybeChatId : null;
}

function extractActiveChatSetting(payload: unknown): string | null | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const key = (payload as { key?: unknown }).key;
  if (key !== "activeChatId") return undefined;

  const value = (payload as { value?: unknown }).value;
  return typeof value === "string" && value.trim() ? value : null;
}

spindle.registerMacro({
  name: WEATHER_FORMAT_MACRO,
  category: "extension:story_weather",
  description: "Example weather-state tag format",
  returnType: "string",
  handler: "",
});

spindle.registerMacro({
  name: WEATHER_TRACKER_MACRO,
  category: "extension:story_weather",
  description: "Weather HUD scene tracking instructions",
  returnType: "string",
  handler: "",
});

spindle.registerMacro({
  name: WEATHER_STATE_MACRO,
  category: "extension:story_weather",
  description: "Current story weather state summary",
  returnType: "string",
  handler: "",
});

pushMacroValues(null);

spindle.registerInterceptor(async (messages, context) => {
  const chatId = extractChatId(context);
  const state = chatId ? await loadEffectiveWeatherState(chatId) : null;
  pushMacroValues(state);
  const cleanedMessages = messages.map((message) => {
    if (!message || typeof message.content !== "string") return message;
    return {
      ...message,
      content: stripWeatherStateTags(message.content),
    };
  });

  return [
    {
      role: "system" as const,
      content: buildPromptInstruction(state),
    },
    ...cleanedMessages,
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
  await handleUserChange(userId);
  const message = raw as FrontendToBackend;

  try {
    switch (message.type) {
      case "frontend_ready":
        await pushPrefs(userId);
        await pushActiveChatState();
        break;

      case "chat_changed":
        await pushActiveChatState(message.chatId);
        break;

      case "weather_tag_intercepted": {
        if (message.isStreaming) break;

        const chatId = await resolveChatId(message.chatId);
        if (!chatId) {
          send({ type: "error", message: "Weather tag ignored because no active chat could be resolved." });
          break;
        }

        const previousStory = await loadStoryWeatherState(chatId);
        const nextState = normalizeWeatherTag(message.attrs, previousStory);
        await saveStoryWeatherState(chatId, nextState);
        lastKnownChatId = chatId;
        pushMacroValues(nextState);
        const manualOverride = await loadManualWeatherState(chatId);
        if (!manualOverride) {
          send({ type: "weather_state", chatId, state: nextState });
        }
        break;
      }

      case "set_manual_state": {
        const chatId = await resolveChatId(message.chatId);
        if (!chatId) {
          send({ type: "error", message: "Manual weather override could not resolve an active chat." });
          break;
        }

        const previous =
          (await loadManualWeatherState(chatId)) ??
          (await loadEffectiveWeatherState(chatId)) ??
          makeDefaultWeatherState();
        const nextState = normalizeWeatherState(
          { ...previous, ...message.state, updatedAt: Date.now(), source: "manual" },
          previous,
        );
        await saveManualWeatherState(chatId, nextState);
        lastKnownChatId = chatId;
        pushMacroValues(nextState);
        send({ type: "weather_state", chatId, state: nextState });
        break;
      }

      case "clear_manual_override": {
        const chatId = await resolveChatId(message.chatId);
        if (!chatId) {
          send({ type: "error", message: "Manual weather override could not be cleared because no chat is active." });
          break;
        }

        await clearManualWeatherState(chatId);
        lastKnownChatId = chatId;
        const restored = (await loadStoryWeatherState(chatId)) ?? makeDefaultWeatherState();
        pushMacroValues(restored);
        send({ type: "weather_state", chatId, state: restored });
        break;
      }

      case "save_prefs": {
        const currentPrefs = await loadPrefs(userId);
        const nextPrefs = normalizePrefs({ ...currentPrefs, ...message.prefs });
        await savePrefs(userId, nextPrefs);
        send({ type: "prefs", prefs: nextPrefs });
        break;
      }

      case "reset_widget_position": {
        const currentPrefs = await loadPrefs(userId);
        const nextPrefs = normalizePrefs({ ...currentPrefs, widgetPosition: null });
        await savePrefs(userId, nextPrefs);
        send({ type: "prefs", prefs: nextPrefs });
        break;
      }
    }
  } catch (error: any) {
    spindle.log.error(`Weather HUD error: ${error?.message || error}`);
    send({ type: "error", message: error?.message || "Unknown Weather HUD error." });
  }
});
