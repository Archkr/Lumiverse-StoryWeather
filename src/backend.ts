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

let activeUserId: string | null = null;
let lastKnownChatId: string | null = null;

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
    send({ type: "active_chat_state", chatId: null, state: null });
    return;
  }

  const state = await loadEffectiveWeatherState(resolvedChatId);
  send({ type: "active_chat_state", chatId: resolvedChatId, state });
}

function buildPromptInstruction(state: WeatherState | null): string {
  const current = state
    ? [
        `- Date: ${state.date}`,
        `- Time: ${state.time}`,
        `- Condition: ${state.condition}`,
        `- Summary: ${state.summary}`,
        `- Temperature: ${state.temperature}`,
        `- Wind: ${state.wind}`,
        `- Layer: ${state.layer}`,
        `- Palette: ${state.palette}`,
      ].join("\n")
    : "- No saved weather yet. Establish the scene with a fresh weather-state tag.";

  return [
    "[Story Weather HUD]",
    "Keep the visible reply natural and in-character.",
    "Append exactly one machine-only tag at the end of every assistant reply so the HUD can stay in sync.",
    `Allowed conditions: ${WEATHER_CONDITIONS.join(", ")}`,
    `Allowed layers: ${WEATHER_LAYERS.join(", ")}`,
    `Allowed palettes: ${WEATHER_PALETTES.join(", ")}`,
    "Use a full state tag every reply with date, time, condition, summary, temperature, intensity, wind, layer, and palette.",
    "Do not explain the tag or mention it in visible prose.",
    "",
    "Current weather state:",
    current,
    "",
    "Required tag format:",
    '<weather-state date="2026-03-24" time="9:42 PM" condition="rain" summary="Cold spring rain" temperature="61F" intensity="0.65" wind="breezy" layer="both" palette="storm"></weather-state>',
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

spindle.registerInterceptor(async (messages, context) => {
  const chatId = extractChatId(context);
  const state = chatId ? await loadEffectiveWeatherState(chatId) : null;

  return [
    {
      role: "system" as const,
      content: buildPromptInstruction(state),
    },
    ...messages,
  ];
}, 60);

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
