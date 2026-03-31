// @bun
// src/shared.ts
var WEATHER_STATE_VAR = "weather_state_json";
var WEATHER_MANUAL_STATE_VAR = "weather_manual_state_json";
var WEATHER_CONDITIONS = ["clear", "cloudy", "rain", "storm", "snow", "fog"];
var WEATHER_LAYERS = ["back", "front", "both"];
var WEATHER_PALETTES = ["dawn", "day", "dusk", "night", "storm", "mist", "snow"];
var REDUCED_MOTION_VALUES = ["system", "always", "never"];
var WEATHER_EFFECT_QUALITY_VALUES = ["performance", "lite", "standard", "cinematic"];
var DEFAULT_PREFS = {
  effectsEnabled: true,
  layerMode: "auto",
  intensity: 1,
  qualityMode: "standard",
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
function normalizeQualityMode(value, fallback) {
  return typeof value === "string" && WEATHER_EFFECT_QUALITY_VALUES.includes(value) ? value : fallback;
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
  const resolvedHour = hour ?? new Date().getHours();
  if (resolvedHour < 6)
    return "night";
  if (resolvedHour < 10)
    return "dawn";
  if (resolvedHour < 18)
    return "day";
  if (resolvedHour < 21)
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
    qualityMode: normalizeQualityMode(source.qualityMode, DEFAULT_PREFS.qualityMode),
    reducedMotion: normalizeReducedMotion(source.reducedMotion, DEFAULT_PREFS.reducedMotion),
    pauseEffects: typeof source.pauseEffects === "boolean" ? source.pauseEffects : DEFAULT_PREFS.pauseEffects,
    widgetPosition: position
  };
}

// src/backend.ts
var PREFS_FILE = "weather_prefs.json";
var WEATHER_FORMAT_MACROS = ["story_weather_format", "weather_format"];
var WEATHER_TRACKER_MACROS = ["story_weather_tracker", "weather_tracker", "story_weather"];
var WEATHER_STATE_MACROS = ["story_weather_state", "weather_state"];
var activeUserId = null;
var lastKnownChatId = null;
var fallbackGenerationInProgress = false;
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
function messageHasWeatherTag(content) {
  return buildWeatherTagRegex().test(content);
}
function sanitizeAttrValue(value) {
  return value.replace(/["<>]/g, "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}
function formatWeatherTag(state) {
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
    ["palette", state.palette]
  ].map(([key, value]) => `${key}="${sanitizeAttrValue(String(value))}"`);
  return `<weather-state ${attrs.join(" ")}></weather-state>`;
}
function stripCodeFences(content) {
  return content.replace(/^```(?:json|xml|html)?\s*/i, "").replace(/\s*```$/i, "").trim();
}
function parseJsonObject(content) {
  const trimmed = stripCodeFences(content);
  if (!trimmed)
    return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match)
      return null;
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }
  }
  return null;
}
function buildSecondaryWeatherPrompt(messages, previous) {
  const conversation = messages.filter((message) => message.role !== "system").map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${stripWeatherStateTags(message.content)}`).join(`

`);
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
    conversation
  ].join(`
`);
}
function readMessageContext(payload) {
  if (!payload || typeof payload !== "object")
    return null;
  const value = payload;
  const nestedMessage = value.message && typeof value.message === "object" ? value.message : {};
  const nestedChat = value.chat && typeof value.chat === "object" ? value.chat : {};
  const chatIdCandidates = [value.chatId, value.chat_id, nestedMessage.chatId, nestedMessage.chat_id, nestedChat.id];
  const messageIdCandidates = [value.messageId, value.message_id, nestedMessage.id, nestedMessage.messageId];
  const content = (typeof nestedMessage.content === "string" ? nestedMessage.content : null) || (typeof value.content === "string" ? value.content : null);
  const chatId = chatIdCandidates.find((candidate) => typeof candidate === "string" && candidate.trim());
  const messageId = messageIdCandidates.find((candidate) => typeof candidate === "string" && candidate.trim());
  return {
    chatId: chatId ?? null,
    messageId: messageId ?? null,
    content
  };
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
async function clearStoryWeatherState(chatId) {
  try {
    await spindle.variables.local.delete(chatId, WEATHER_STATE_VAR);
  } catch {}
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
    `Current scene: ${summarizeWeatherState(state)}`
  ].join(`
`);
}
function pushMacroValues(state) {
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
function buildPromptInstruction(state) {
  return [
    "[Story Weather HUD]",
    "Keep the visible reply natural and in-character.",
    buildTrackerMacro(state)
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
for (const name of WEATHER_FORMAT_MACROS) {
  spindle.registerMacro({
    name,
    category: "extension:story_weather",
    description: "Example weather-state tag format",
    returnType: "string",
    handler: ""
  });
}
for (const name of WEATHER_TRACKER_MACROS) {
  spindle.registerMacro({
    name,
    category: "extension:story_weather",
    description: "Weather HUD scene tracking instructions",
    returnType: "string",
    handler: ""
  });
}
for (const name of WEATHER_STATE_MACROS) {
  spindle.registerMacro({
    name,
    category: "extension:story_weather",
    description: "Current story weather state summary",
    returnType: "string",
    handler: ""
  });
}
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
async function appendWeatherTagViaFallback(chatId, messageId) {
  if (fallbackGenerationInProgress)
    return;
  fallbackGenerationInProgress = true;
  try {
    const messages = await spindle.chat.getMessages(chatId);
    const targetMessage = messages.find((message) => message.id === messageId && message.role === "assistant");
    if (!targetMessage)
      return;
    if (messageHasWeatherTag(targetMessage.content))
      return;
    const previousStory = await loadStoryWeatherState(chatId);
    const recentMessages = messages.filter((message) => message.role !== "system").slice(-6).map((message) => ({
      role: message.role,
      content: stripWeatherStateTags(message.content)
    }));
    if (!recentMessages.length)
      return;
    const result = await spindle.generate.raw({
      type: "raw",
      messages: [
        {
          role: "user",
          content: buildSecondaryWeatherPrompt(recentMessages, previousStory)
        }
      ],
      parameters: {
        temperature: 0.2,
        max_tokens: 220
      }
    });
    const resultObj = result;
    const rawContent = typeof resultObj.content === "string" ? resultObj.content : "";
    const parsed = parseJsonObject(rawContent);
    if (!parsed) {
      spindle.log.warn("Weather HUD fallback generation returned invalid JSON.");
      return;
    }
    const nextState = normalizeWeatherState({ ...parsed, updatedAt: Date.now(), source: "story" }, previousStory ?? makeDefaultWeatherState());
    const weatherTag = formatWeatherTag(nextState);
    const nextContent = `${targetMessage.content.trimEnd()}

${weatherTag}`;
    await spindle.chat.updateMessage(chatId, targetMessage.id, { content: nextContent });
    await saveStoryWeatherState(chatId, nextState);
    lastKnownChatId = chatId;
    pushMacroValues(nextState);
    const manualOverride = await loadManualWeatherState(chatId);
    if (!manualOverride) {
      send({ type: "weather_state", chatId, state: nextState });
    }
  } catch (error) {
    spindle.log.warn(`Weather HUD fallback generation failed: ${error?.message || error}`);
  } finally {
    fallbackGenerationInProgress = false;
  }
}
spindle.on("GENERATION_ENDED", (payload) => {
  (async () => {
    const context = readMessageContext(payload);
    if (!context?.chatId || !context.messageId)
      return;
    if (typeof context.content === "string" && messageHasWeatherTag(context.content)) {
      return;
    }
    await appendWeatherTagViaFallback(context.chatId, context.messageId);
  })();
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
  } catch (error) {
    spindle.log.error(`Weather HUD error: ${error?.message || error}`);
    send({ type: "error", message: error?.message || "Unknown Weather HUD error." });
  }
});
