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
const WEATHER_FORMAT_MACROS = ["story_weather_format", "weather_format"] as const;
const WEATHER_TRACKER_MACROS = ["story_weather_tracker", "weather_tracker", "story_weather"] as const;
const WEATHER_STATE_MACROS = ["story_weather_state", "weather_state"] as const;

let activeUserId: string | null = null;
let lastKnownChatId: string | null = null;
let fallbackGenerationInProgress = false;

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

function messageHasWeatherTag(content: string): boolean {
  return buildWeatherTagRegex().test(content);
}

function sanitizeAttrValue(value: string): string {
  return value
    .replace(/["<>]/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatWeatherTag(state: WeatherState): string {
  const attrs = [
    ["location", state.location],
    ["date", state.date],
    ["time", state.time],
    ["condition", state.condition],
    ["summary", state.summary],
    ["temperature", state.temperature],
    ["intensity", state.intensity.toFixed(2)],
    ["wind", state.wind],
    ["layer", state.layer],
    ["palette", state.palette],
  ].map(([key, value]) => `${key}="${sanitizeAttrValue(String(value))}"`);

  return `<weather-state ${attrs.join(" ")}></weather-state>`;
}

function stripCodeFences(content: string): string {
  return content
    .replace(/^```(?:json|xml|html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  const trimmed = stripCodeFences(content);
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function buildSecondaryWeatherPrompt(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, previous: WeatherState | null): string {
  const conversation = messages
    .filter((message) => message.role !== "system")
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${stripWeatherStateTags(message.content)}`)
    .join("\n\n");

  return [
    "Generate scene metadata for a story weather HUD.",
    "Return ONLY a JSON object and nothing else.",
    'Required keys: "location", "date", "time", "condition", "summary", "temperature", "intensity", "wind", "layer", "palette".',
    `Allowed conditions: ${WEATHER_CONDITIONS.join(", ")}`,
    `Allowed layers: ${WEATHER_LAYERS.join(", ")}`,
    `Allowed palettes: ${WEATHER_PALETTES.join(", ")}`,
    'Use short plain-text values. "intensity" must be a number from 0 to 1.',
    `Previous state: ${summarizeWeatherState(previous)}`,
    "",
    "Conversation:",
    conversation,
  ].join("\n");
}

function readMessageContext(payload: unknown): { chatId: string | null; messageId: string | null; content: string | null } | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const nestedMessage = (value.message && typeof value.message === "object" ? value.message : {}) as Record<string, unknown>;
  const nestedChat = (value.chat && typeof value.chat === "object" ? value.chat : {}) as Record<string, unknown>;

  const chatIdCandidates = [value.chatId, value.chat_id, nestedMessage.chatId, nestedMessage.chat_id, nestedChat.id];
  const messageIdCandidates = [value.messageId, value.message_id, nestedMessage.id, nestedMessage.messageId];
  const content =
    (typeof nestedMessage.content === "string" ? nestedMessage.content : null) ||
    (typeof value.content === "string" ? value.content : null);

  const chatId = chatIdCandidates.find((candidate) => typeof candidate === "string" && candidate.trim()) as string | undefined;
  const messageId = messageIdCandidates.find((candidate) => typeof candidate === "string" && candidate.trim()) as string | undefined;

  return {
    chatId: chatId ?? null,
    messageId: messageId ?? null,
    content,
  };
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

async function clearStoryWeatherState(chatId: string): Promise<void> {
  try {
    await spindle.variables.local.delete(chatId, WEATHER_STATE_VAR);
  } catch {
    // ignore missing story weather state
  }
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
    "IMPORTANT OUTPUT FORMAT:",
    "Write the visible reply first, then append exactly one final XML weather-state tag.",
    "Never omit the weather-state tag, even if the scene only changed slightly.",
    "Do not wrap the tag in markdown fences.",
    "Do not explain the tag or mention it in visible prose.",
    "Never place visible prose after the tag.",
    "Emit the tag as the very last text in the assistant message.",
    `Allowed conditions: ${WEATHER_CONDITIONS.join(", ")}`,
    `Allowed layers: ${WEATHER_LAYERS.join(", ")}`,
    `Allowed palettes: ${WEATHER_PALETTES.join(", ")}`,
    "Use location, date, time, condition, summary, temperature, intensity, wind, layer, and palette.",
    "Exact wrapper example:",
    buildWeatherTagExample(),
    `Current scene: ${summarizeWeatherState(state)}`,
  ].join("\n");
}

function pushMacroValues(state: WeatherState | null): void {
  const formatValue = buildWeatherTagExample();
  const trackerValue = buildTrackerMacro(state);
  const stateValue = summarizeWeatherState(state);

  for (const macroName of WEATHER_FORMAT_MACROS) {
    spindle.updateMacroValue(macroName, formatValue);
  }

  for (const macroName of WEATHER_TRACKER_MACROS) {
    spindle.updateMacroValue(macroName, trackerValue);
  }

  for (const macroName of WEATHER_STATE_MACROS) {
    spindle.updateMacroValue(macroName, stateValue);
  }
}

function buildPromptInstruction(state: WeatherState | null): string {
  return [
    "[Story Weather HUD]",
    "Keep the visible reply natural and in-character.",
    buildTrackerMacro(state),
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

for (const name of WEATHER_FORMAT_MACROS) {
  spindle.registerMacro({
    name,
    category: "extension:story_weather",
    description: "Example weather-state tag format",
    returnType: "string",
    handler: "",
  });
}

for (const name of WEATHER_TRACKER_MACROS) {
  spindle.registerMacro({
    name,
    category: "extension:story_weather",
    description: "Weather HUD scene tracking instructions",
    returnType: "string",
    handler: "",
  });
}

for (const name of WEATHER_STATE_MACROS) {
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

async function appendWeatherTagViaFallback(chatId: string, messageId: string): Promise<void> {
  if (fallbackGenerationInProgress) return;
  fallbackGenerationInProgress = true;

  try {
    const messages = await spindle.chat.getMessages(chatId);
    const targetMessage = messages.find((message) => message.id === messageId && message.role === "assistant");
    if (!targetMessage) return;
    if (messageHasWeatherTag(targetMessage.content)) return;

    const previousStory = await loadStoryWeatherState(chatId);
    const recentMessages = messages
      .filter((message) => message.role !== "system")
      .slice(-6)
      .map((message) => ({
        role: message.role,
        content: stripWeatherStateTags(message.content),
      })) as Array<{ role: "user" | "assistant"; content: string }>;

    if (!recentMessages.length) return;

    const result = await spindle.generate.raw({
      type: "raw",
      messages: [
        {
          role: "user",
          content: buildSecondaryWeatherPrompt(recentMessages, previousStory),
        },
      ],
      parameters: {
        temperature: 0.2,
        max_tokens: 220,
      },
    });

    const resultObj = result as Record<string, unknown>;
    const rawContent = typeof resultObj.content === "string" ? resultObj.content : "";
    const parsed = parseJsonObject(rawContent);
    if (!parsed) {
      spindle.log.warn("Weather HUD fallback generation returned invalid JSON.");
      return;
    }

    const nextState = normalizeWeatherState(
      { ...parsed, updatedAt: Date.now(), source: "story" },
      previousStory ?? makeDefaultWeatherState(),
    );
    const weatherTag = formatWeatherTag(nextState);
    const nextContent = `${targetMessage.content.trimEnd()}\n\n${weatherTag}`;

    await spindle.chat.updateMessage(chatId, targetMessage.id, { content: nextContent });
    await saveStoryWeatherState(chatId, nextState);
    lastKnownChatId = chatId;
    pushMacroValues(nextState);

    const manualOverride = await loadManualWeatherState(chatId);
    if (!manualOverride) {
      send({ type: "weather_state", chatId, state: nextState });
    }
  } catch (error: any) {
    spindle.log.warn(`Weather HUD fallback generation failed: ${error?.message || error}`);
  } finally {
    fallbackGenerationInProgress = false;
  }
}

spindle.on("GENERATION_ENDED", (payload: unknown) => {
  void (async () => {
    const context = readMessageContext(payload);
    if (!context?.chatId || !context.messageId) return;

    if (typeof context.content === "string" && messageHasWeatherTag(context.content)) {
      return;
    }

    await appendWeatherTagViaFallback(context.chatId, context.messageId);
  })();
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

      case "clear_weather_state": {
        const chatId = await resolveChatId(message.chatId);
        if (!chatId) {
          send({ type: "error", message: "Saved weather state could not be cleared because no chat is active." });
          break;
        }

        await clearManualWeatherState(chatId);
        await clearStoryWeatherState(chatId);
        lastKnownChatId = chatId;
        await pushActiveChatState(chatId);
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
