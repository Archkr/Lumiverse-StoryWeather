// @bun
// src/shared.ts
var WEATHER_STATE_VAR = "weather_state_json";
var WEATHER_MANUAL_STATE_VAR = "weather_manual_state_json";
var WEATHER_CONDITIONS = ["clear", "cloudy", "rain", "storm", "snow", "fog"];
var WEATHER_LAYERS = ["back", "front", "both"];
var WEATHER_PALETTES = ["dawn", "day", "dusk", "night", "storm", "mist", "snow"];
var REDUCED_MOTION_VALUES = ["system", "always", "never"];
var DEFAULT_PREFS = {
  effectsEnabled: true,
  layerMode: "auto",
  intensity: 1,
  reducedMotion: "never",
  pauseEffects: false,
  widgetPosition: null
};
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function normalizeText(value, fallback, maxLength) {
  if (typeof value !== "string")
    return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}
function normalizeCondition(value, fallback) {
  return typeof value === "string" && WEATHER_CONDITIONS.includes(value) ? value : fallback;
}
function normalizeLayer(value, fallback) {
  return typeof value === "string" && WEATHER_LAYERS.includes(value) ? value : fallback;
}
function normalizePalette(value, fallback) {
  return typeof value === "string" && WEATHER_PALETTES.includes(value) ? value : fallback;
}
function normalizeReducedMotion(value, fallback) {
  return typeof value === "string" && REDUCED_MOTION_VALUES.includes(value) ? value : fallback;
}
function normalizeSource(value, fallback) {
  return value === "manual" || value === "story" ? value : fallback;
}
function parseNumeric(value) {
  if (typeof value === "number" && Number.isFinite(value))
    return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed))
      return parsed;
  }
  return null;
}
function pad2(value) {
  return String(value).padStart(2, "0");
}
function formatDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
function formatTime(date) {
  const hours24 = date.getHours();
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${pad2(date.getMinutes())} ${suffix}`;
}
function parseHourFromTimeString(timeValue) {
  const time12 = timeValue.match(/^(\d{1,2}):(\d{2})(?:\s*:\s*(\d{2}))?\s*([AP]M)$/i);
  if (time12) {
    let hours2 = Number.parseInt(time12[1], 10);
    if (hours2 < 1 || hours2 > 12)
      return null;
    const minutes2 = Number.parseInt(time12[2], 10);
    if (minutes2 > 59)
      return null;
    const meridiem = time12[4].toUpperCase();
    if (meridiem === "PM" && hours2 < 12)
      hours2 += 12;
    if (meridiem === "AM" && hours2 === 12)
      hours2 = 0;
    return hours2;
  }
  const time24 = timeValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!time24)
    return null;
  const hours = Number.parseInt(time24[1], 10);
  const minutes = Number.parseInt(time24[2], 10);
  if (hours > 23 || minutes > 59)
    return null;
  return hours;
}
function parseStoryDateTime(dateValue, timeValue) {
  const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch)
    return null;
  const time12 = timeValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i);
  const time24 = timeValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  if (time12) {
    hours = Number.parseInt(time12[1], 10);
    minutes = Number.parseInt(time12[2], 10);
    seconds = time12[3] ? Number.parseInt(time12[3], 10) : 0;
    if (hours < 1 || hours > 12 || minutes > 59 || seconds > 59)
      return null;
    const meridiem = time12[4].toUpperCase();
    if (meridiem === "PM" && hours < 12)
      hours += 12;
    if (meridiem === "AM" && hours === 12)
      hours = 0;
  } else if (time24) {
    hours = Number.parseInt(time24[1], 10);
    minutes = Number.parseInt(time24[2], 10);
    seconds = time24[3] ? Number.parseInt(time24[3], 10) : 0;
    if (hours > 23 || minutes > 59 || seconds > 59)
      return null;
  } else {
    return null;
  }
  const year = Number.parseInt(dateMatch[1], 10);
  const month = Number.parseInt(dateMatch[2], 10);
  const day = Number.parseInt(dateMatch[3], 10);
  const parsed = new Date(year, month - 1, day, hours, minutes, seconds, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}
function derivePalette(condition, dateValue, timeValue) {
  if (condition === "storm")
    return "storm";
  if (condition === "fog")
    return "mist";
  if (condition === "snow")
    return "snow";
  const timestamp = parseStoryDateTime(dateValue, timeValue);
  if (timestamp !== null) {
    const hour2 = new Date(timestamp).getHours();
    if (hour2 < 6)
      return "night";
    if (hour2 < 10)
      return "dawn";
    if (hour2 < 18)
      return "day";
    if (hour2 < 21)
      return "dusk";
    return "night";
  }
  const hour = parseHourFromTimeString(timeValue);
  if (hour === null)
    return condition === "cloudy" || condition === "rain" ? "dusk" : "day";
  if (hour < 6)
    return "night";
  if (hour < 10)
    return "dawn";
  if (hour < 18)
    return "day";
  if (hour < 21)
    return "dusk";
  return "night";
}
function makeDefaultWeatherState(now = Date.now()) {
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
    source: "story"
  };
}
function normalizeWeatherState(input, previous) {
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
    source: normalizeSource(source.source, fallback.source)
  };
}
function normalizeWeatherTag(attrs, previous) {
  return normalizeWeatherState({ ...attrs, updatedAt: Date.now(), source: "story" }, previous);
}
function normalizePrefs(input) {
  const source = isRecord(input) ? input : {};
  const position = isRecord(source.widgetPosition) ? {
    x: clamp(parseNumeric(source.widgetPosition.x) ?? 24, 0, 5000),
    y: clamp(parseNumeric(source.widgetPosition.y) ?? 96, 0, 5000)
  } : null;
  const layerMode = typeof source.layerMode === "string" && ["auto", ...WEATHER_LAYERS].includes(source.layerMode) ? source.layerMode : DEFAULT_PREFS.layerMode;
  return {
    effectsEnabled: typeof source.effectsEnabled === "boolean" ? source.effectsEnabled : DEFAULT_PREFS.effectsEnabled,
    layerMode,
    intensity: clamp(parseNumeric(source.intensity) ?? DEFAULT_PREFS.intensity, 0.25, 1.5),
    reducedMotion: normalizeReducedMotion(source.reducedMotion, DEFAULT_PREFS.reducedMotion),
    pauseEffects: typeof source.pauseEffects === "boolean" ? source.pauseEffects : DEFAULT_PREFS.pauseEffects,
    widgetPosition: position
  };
}

// src/backend.ts
var PREFS_FILE = "weather_prefs.json";
var WEATHER_FORMAT_MACRO = "story_weather_format";
var WEATHER_TRACKER_MACRO = "story_weather_tracker";
var WEATHER_STATE_MACRO = "story_weather_state";
var activeUserId = null;
var lastKnownChatId = null;
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function buildWeatherTagRegex(flags = "ig") {
  const safeTag = escapeRegex("weather-state");
  return new RegExp(String.raw`<${safeTag}\b[^>]*(?:\/>|>[\s\S]*?<\/${safeTag}>)`, flags);
}
function stripWeatherStateTags(content) {
  return content.replace(buildWeatherTagRegex(), "").replace(/\n{3,}/g, `

`).trim();
}
function send(message) {
  spindle.sendToFrontend(message);
}
async function handleUserChange(userId) {
  if (activeUserId === userId)
    return;
  activeUserId = userId;
}
async function loadPrefs(userId) {
  try {
    const stored = await spindle.userStorage.getJson(PREFS_FILE, {
      userId,
      fallback: DEFAULT_PREFS
    });
    return normalizePrefs(stored);
  } catch {
    return DEFAULT_PREFS;
  }
}
async function savePrefs(userId, prefs) {
  await spindle.userStorage.setJson(PREFS_FILE, prefs, { userId });
}
async function loadStoryWeatherState(chatId) {
  try {
    const raw = await spindle.variables.local.get(chatId, WEATHER_STATE_VAR);
    if (!raw)
      return null;
    return normalizeWeatherState(JSON.parse(raw));
  } catch {
    return null;
  }
}
async function saveStoryWeatherState(chatId, state) {
  await spindle.variables.local.set(chatId, WEATHER_STATE_VAR, JSON.stringify(state));
}
async function loadManualWeatherState(chatId) {
  try {
    const raw = await spindle.variables.local.get(chatId, WEATHER_MANUAL_STATE_VAR);
    if (!raw)
      return null;
    return normalizeWeatherState(JSON.parse(raw));
  } catch {
    return null;
  }
}
async function saveManualWeatherState(chatId, state) {
  await spindle.variables.local.set(chatId, WEATHER_MANUAL_STATE_VAR, JSON.stringify(state));
}
async function clearManualWeatherState(chatId) {
  try {
    await spindle.variables.local.delete(chatId, WEATHER_MANUAL_STATE_VAR);
  } catch {}
}
async function loadEffectiveWeatherState(chatId) {
  const manual = await loadManualWeatherState(chatId);
  if (manual)
    return manual;
  return loadStoryWeatherState(chatId);
}
async function resolveChatId(candidate) {
  if (candidate)
    return candidate;
  if (lastKnownChatId)
    return lastKnownChatId;
  try {
    const active = await spindle.chats.getActive();
    return active?.id ?? null;
  } catch {
    return null;
  }
}
async function pushPrefs(userId) {
  send({ type: "prefs", prefs: await loadPrefs(userId) });
}
async function pushActiveChatState(chatId) {
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
function buildWeatherTagExample() {
  return '<weather-state location="Tengu City" date="2026-03-24" time="9:42 PM" condition="rain" summary="Cold spring rain" temperature="61F" intensity="0.65" wind="breezy" layer="both" palette="storm"></weather-state>';
}
function summarizeWeatherState(state) {
  if (!state)
    return "No saved weather state yet.";
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
    `Palette: ${state.palette}`
  ].join(" | ");
}
function buildTrackerMacro(state) {
  return [
    "Append one final machine-only weather-state tag after the visible reply.",
    "Keep all visible prose outside the tag.",
    `Allowed conditions: ${WEATHER_CONDITIONS.join(", ")}`,
    `Allowed layers: ${WEATHER_LAYERS.join(", ")}`,
    `Allowed palettes: ${WEATHER_PALETTES.join(", ")}`,
    "Use location, date, time, condition, summary, temperature, intensity, wind, layer, and palette.",
    `Current scene: ${summarizeWeatherState(state)}`,
    "Example:",
    buildWeatherTagExample()
  ].join(`
`);
}
function pushMacroValues(state) {
  spindle.updateMacroValue(WEATHER_FORMAT_MACRO, buildWeatherTagExample());
  spindle.updateMacroValue(WEATHER_TRACKER_MACRO, buildTrackerMacro(state));
  spindle.updateMacroValue(WEATHER_STATE_MACRO, summarizeWeatherState(state));
}
function buildPromptInstruction(state) {
  return [
    "[Story Weather HUD]",
    "Keep the visible reply natural and in-character.",
    "After the visible reply, append exactly one final-line weather-state control tag.",
    "Never place the tag before visible prose, and never continue visible prose after the tag.",
    "Do not mention or explain the tag in visible prose.",
    `Continue scene metadata from: ${summarizeWeatherState(state)}`,
    `Format: ${buildWeatherTagExample()}`
  ].join(`
`);
}
function extractChatId(payload) {
  if (!payload || typeof payload !== "object")
    return null;
  const maybeChatId = payload.chatId;
  return typeof maybeChatId === "string" && maybeChatId.trim() ? maybeChatId : null;
}
function extractActiveChatSetting(payload) {
  if (!payload || typeof payload !== "object")
    return;
  const key = payload.key;
  if (key !== "activeChatId")
    return;
  const value = payload.value;
  return typeof value === "string" && value.trim() ? value : null;
}
spindle.registerMacro({
  name: WEATHER_FORMAT_MACRO,
  category: "extension:story_weather",
  description: "Example weather-state tag format",
  returnType: "string",
  handler: ""
});
spindle.registerMacro({
  name: WEATHER_TRACKER_MACRO,
  category: "extension:story_weather",
  description: "Weather HUD scene tracking instructions",
  returnType: "string",
  handler: ""
});
spindle.registerMacro({
  name: WEATHER_STATE_MACRO,
  category: "extension:story_weather",
  description: "Current story weather state summary",
  returnType: "string",
  handler: ""
});
pushMacroValues(null);
spindle.registerInterceptor(async (messages, context) => {
  const chatId = extractChatId(context);
  const state = chatId ? await loadEffectiveWeatherState(chatId) : null;
  pushMacroValues(state);
  const cleanedMessages = messages.map((message) => {
    if (!message || typeof message.content !== "string")
      return message;
    return {
      ...message,
      content: stripWeatherStateTags(message.content)
    };
  });
  return [
    {
      role: "system",
      content: buildPromptInstruction(state)
    },
    ...cleanedMessages
  ];
}, 90);
spindle.on("CHAT_CHANGED", (payload) => {
  const chatId = extractChatId(payload);
  if (!chatId)
    return;
  pushActiveChatState(chatId);
});
spindle.on("SETTINGS_UPDATED", (payload) => {
  const chatId = extractActiveChatSetting(payload);
  if (typeof chatId === "undefined")
    return;
  pushActiveChatState(chatId);
});
spindle.onFrontendMessage(async (raw, userId) => {
  await handleUserChange(userId);
  const message = raw;
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
        if (message.isStreaming)
          break;
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
        const previous = await loadManualWeatherState(chatId) ?? await loadEffectiveWeatherState(chatId) ?? makeDefaultWeatherState();
        const nextState = normalizeWeatherState({ ...previous, ...message.state, updatedAt: Date.now(), source: "manual" }, previous);
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
        const restored = await loadStoryWeatherState(chatId) ?? makeDefaultWeatherState();
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
  } catch (error) {
    spindle.log.error(`Weather HUD error: ${error?.message || error}`);
    send({ type: "error", message: error?.message || "Unknown Weather HUD error." });
  }
});
