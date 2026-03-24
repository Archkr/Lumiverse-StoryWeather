import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type {
  BackendToFrontend,
  FrontendToBackend,
  WeatherCondition,
  WeatherLayerMode,
  WeatherPrefs,
  WeatherState,
} from "./types";
import { DEFAULT_PREFS, WEATHER_TAG_NAME, clamp, makeDefaultWeatherState } from "./shared";
import { createSettingsUI } from "./ui/settings";
import { WEATHER_HUD_CSS } from "./ui/styles";

const GEAR_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98a7.79 7.79 0 000-1.96l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.88 7.88 0 00-1.69-.98l-.36-2.54a.5.5 0 00-.49-.42h-3.84a.5.5 0 00-.49.42l-.36 2.54c-.6.24-1.16.56-1.69.98l-2.39-.96a.5.5 0 00-.6.22L2.43 8.8a.5.5 0 00.12.64l2.03 1.58a7.79 7.79 0 000 1.96L2.55 14.56a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.6.22l2.39-.96c.53.42 1.09.74 1.69.98l.36 2.54a.5.5 0 00.49.42h3.84a.5.5 0 00.49-.42l.36-2.54c.6-.24 1.16-.56 1.69-.98l2.39.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z"/></svg>`;

type AppMountHandle = ReturnType<SpindleFrontendContext["ui"]["mountApp"]>;
type FloatWidgetHandle = ReturnType<SpindleFrontendContext["ui"]["createFloatWidget"]>;

type FxRoot = {
  mount: AppMountHandle;
  root: HTMLDivElement;
};

type HudElements = {
  widget: FloatWidgetHandle;
  root: HTMLDivElement;
  date: HTMLDivElement;
  time: HTMLDivElement;
  wind: HTMLDivElement;
  icon: HTMLDivElement;
  temp: HTMLDivElement;
  summary: HTMLDivElement;
  layer: HTMLSpanElement;
  condition: HTMLSpanElement;
  palette: HTMLSpanElement;
};

function conditionIcon(condition: WeatherCondition): string {
  switch (condition) {
    case "cloudy":
      return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18a4 4 0 010-8 5.5 5.5 0 0110.68-1.84A4.5 4.5 0 1118.5 18H7z"/></svg>`;
    case "rain":
      return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 17a4.5 4.5 0 010-9 6 6 0 0111.55-1.98A4.5 4.5 0 1118.5 17h-12zm2.1 5l-1.1-2.6h1.6l1.1 2.6H8.6zm5 0l-1.1-2.6h1.6l1.1 2.6h-1.6zm-2.5-3l-1.1-2.6h1.6l1.1 2.6H11.1z"/></svg>`;
    case "storm":
      return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 16.5a4.5 4.5 0 010-9 6 6 0 0111.55-1.98A4.5 4.5 0 1118.5 16.5h-4.01l1.02-4.02-4.52 5.02h2.98L12.96 22 17 16.5H6.5z"/></svg>`;
    case "snow":
      return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 2h2v4.1l2.85-1.64 1 1.73L14 7.83l3.54 2.04-1 1.73L13 9.56V13h4v2h-4v3.44l3.85-2.22 1 1.73L14 20.17l2.85 1.65-1 1.73L13 21.9V26h-2v-4.1l-2.85 1.65-1-1.73L10 20.17l-3.85-2.22 1-1.73L11 18.44V15H7v-2h4V9.56L7.15 11.78l-1-1.73L10 7.83 7.15 6.18l1-1.73L11 6.1V2z" transform="translate(0 -2)"/></svg>`;
    case "fog":
      return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.5A4.5 4.5 0 019.58 5a6 6 0 0111.18 2.44A4 4 0 0119 15H5a3 3 0 010-6h14a4 4 0 010 8H7v-2h12a2 2 0 000-4H5a1 1 0 000 2h11v2H5a3 3 0 010-6h14v2H5a1 1 0 000 2h10v2H5a3 3 0 010-6z"/></svg>`;
    case "clear":
    default:
      return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5a1 1 0 011-1h0a1 1 0 011 1v1.1a1 1 0 01-1 1h0a1 1 0 01-1-1V5zm0 11.8a1 1 0 011 1V19a1 1 0 01-2 0v-1.2a1 1 0 011-1zM5 11a1 1 0 011-1h1.2a1 1 0 010 2H6a1 1 0 01-1-1zm11.8 0a1 1 0 011-1H19a1 1 0 010 2h-1.2a1 1 0 01-1-1zM7.05 7.05a1 1 0 011.41 0l.85.85a1 1 0 11-1.41 1.41l-.85-.85a1 1 0 010-1.41zm7.64 7.64a1 1 0 011.41 0l.85.85a1 1 0 01-1.41 1.41l-.85-.85a1 1 0 010-1.41zm1.41-7.64a1 1 0 010 1.41l-.85.85a1 1 0 01-1.41-1.41l.85-.85a1 1 0 011.41 0zm-7.64 7.64a1 1 0 010 1.41l-.85.85a1 1 0 01-1.41-1.41l.85-.85a1 1 0 011.41 0zM12 8a4 4 0 110 8 4 4 0 010-8z"/></svg>`;
  }
}

function sendToBackend(ctx: SpindleFrontendContext, payload: FrontendToBackend): void {
  ctx.sendToBackend(payload);
}

function createSpan(className: string, styles: Record<string, string>): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = className;
  for (const [key, value] of Object.entries(styles)) {
    span.style.setProperty(key, value);
  }
  return span;
}

function createFxMarkup(kind: "back" | "front"): FxRoot {
  const root = document.createElement("div");
  root.className = "weather-fx-root";
  root.dataset.kind = kind;

  const sky = document.createElement("div");
  sky.className = "weather-fx-sky";
  root.appendChild(sky);

  const glow = document.createElement("div");
  glow.className = "weather-fx-glow";
  root.appendChild(glow);

  const clouds = document.createElement("div");
  clouds.className = "weather-fx-clouds";
  root.appendChild(clouds);

  const fog = document.createElement("div");
  fog.className = "weather-fx-fog";
  root.appendChild(fog);

  const rain = document.createElement("div");
  rain.className = "weather-fx-rain";
  root.appendChild(rain);

  const snow = document.createElement("div");
  snow.className = "weather-fx-snow";
  root.appendChild(snow);

  const flash = document.createElement("div");
  flash.className = "weather-fx-flash";
  root.appendChild(flash);

  const cloudCount = kind === "back" ? 5 : 3;
  const fogCount = kind === "back" ? 4 : 2;
  const rainCount = kind === "back" ? 28 : 42;
  const snowCount = kind === "back" ? 24 : 30;

  for (let index = 0; index < cloudCount; index += 1) {
    clouds.appendChild(
      createSpan("weather-fx-cloud", {
        "--cloud-width": `${160 + Math.round(Math.random() * 240)}px`,
        "--cloud-height": `${50 + Math.round(Math.random() * 52)}px`,
        "--cloud-top": `${8 + index * 12 + Math.round(Math.random() * 6)}%`,
        "--cloud-left": `${-18 + Math.round(Math.random() * 86)}%`,
        "--cloud-duration": `${34 + Math.round(Math.random() * 20)}s`,
        "--cloud-delay": `${Math.round(Math.random() * -22)}s`,
      }),
    );
  }

  for (let index = 0; index < fogCount; index += 1) {
    fog.appendChild(
      createSpan("weather-fx-fog-band", {
        "--fog-width": `${220 + Math.round(Math.random() * 260)}px`,
        "--fog-height": `${56 + Math.round(Math.random() * 34)}px`,
        "--fog-top": `${18 + index * 16 + Math.round(Math.random() * 4)}%`,
        "--fog-left": `${-16 + Math.round(Math.random() * 86)}%`,
        "--fog-duration": `${18 + Math.round(Math.random() * 10)}s`,
        "--fog-delay": `${Math.round(Math.random() * -18)}s`,
      }),
    );
  }

  for (let index = 0; index < rainCount; index += 1) {
    rain.appendChild(
      createSpan("weather-fx-rain-drop", {
        "--drop-left": `${Math.round(Math.random() * 104)}%`,
        "--drop-width": `${kind === "back" ? 1 : 2}px`,
        "--drop-length": `${24 + Math.round(Math.random() * 28)}px`,
        "--drop-duration": `${0.85 + Math.random() * 0.9}s`,
        "--drop-delay": `${Math.random() * -2.2}s`,
      }),
    );
  }

  for (let index = 0; index < snowCount; index += 1) {
    snow.appendChild(
      createSpan("weather-fx-snow-flake", {
        "--flake-left": `${Math.round(Math.random() * 104)}%`,
        "--flake-size": `${kind === "back" ? 3 + Math.random() * 3 : 4 + Math.random() * 5}px`,
        "--flake-duration": `${5.4 + Math.random() * 4.2}s`,
        "--flake-delay": `${Math.random() * -5}s`,
      }),
    );
  }

  return { mount: null as unknown as AppMountHandle, root };
}

function createFxRoot(ctx: SpindleFrontendContext, kind: "back" | "front"): FxRoot {
  const mount = ctx.ui.mountApp({
    className: `weather-fx-mount weather-fx-mount-${kind}`,
    position: kind === "back" ? "start" : "end",
  });
  const fx = createFxMarkup(kind);
  fx.mount = mount;
  mount.root.appendChild(fx.root);
  return fx;
}

function resolveSceneTokens(state: WeatherState, intensity: number) {
  const paletteMap: Record<WeatherState["palette"], { start: string; mid: string; end: string; glow: string }> = {
    dawn: { start: "#20385f", mid: "#5877a7", end: "#f0a36c", glow: "rgba(255, 201, 145, 0.86)" },
    day: { start: "#537cb0", mid: "#7fa7df", end: "#cfe7ff", glow: "rgba(255, 242, 197, 0.86)" },
    dusk: { start: "#241f4f", mid: "#68467a", end: "#ef8e63", glow: "rgba(255, 171, 122, 0.76)" },
    night: { start: "#06111f", mid: "#10243c", end: "#254566", glow: "rgba(136, 176, 255, 0.58)" },
    storm: { start: "#05111b", mid: "#142a3a", end: "#33485f", glow: "rgba(187, 221, 255, 0.34)" },
    mist: { start: "#263544", mid: "#53697d", end: "#9db1bc", glow: "rgba(226, 239, 255, 0.4)" },
    snow: { start: "#49627f", mid: "#7d93a8", end: "#d8e4ef", glow: "rgba(255, 252, 243, 0.82)" },
  };

  const palette = paletteMap[state.palette];
  const baseIntensity = clamp(intensity, 0, 1.5);

  const values = {
    cloudOpacity: 0.16,
    fogOpacity: 0.06,
    rainOpacity: 0,
    snowOpacity: 0,
    skyOpacity: 0.22,
    glowOpacity: 0.34,
  };

  switch (state.condition) {
    case "cloudy":
      values.cloudOpacity = 0.32;
      values.glowOpacity = 0.2;
      values.skyOpacity = 0.18;
      break;
    case "rain":
      values.cloudOpacity = 0.42;
      values.rainOpacity = 0.62;
      values.fogOpacity = 0.12;
      values.glowOpacity = 0.16;
      values.skyOpacity = 0.2;
      break;
    case "storm":
      values.cloudOpacity = 0.54;
      values.rainOpacity = 0.82;
      values.fogOpacity = 0.18;
      values.glowOpacity = 0.1;
      values.skyOpacity = 0.24;
      break;
    case "snow":
      values.cloudOpacity = 0.22;
      values.snowOpacity = 0.76;
      values.fogOpacity = 0.14;
      values.glowOpacity = 0.28;
      values.skyOpacity = 0.16;
      break;
    case "fog":
      values.cloudOpacity = 0.18;
      values.fogOpacity = 0.44;
      values.glowOpacity = 0.22;
      values.skyOpacity = 0.12;
      break;
    case "clear":
    default:
      break;
  }

  return {
    bgStart: palette.start,
    bgMid: palette.mid,
    bgEnd: palette.end,
    glow: palette.glow,
    cloudOpacity: values.cloudOpacity * clamp(0.8 + baseIntensity * 0.2, 0.7, 1),
    fogOpacity: values.fogOpacity * clamp(0.85 + baseIntensity * 0.25, 0.75, 1),
    rainOpacity: values.rainOpacity * clamp(0.6 + baseIntensity * 0.4, 0, 1.2),
    snowOpacity: values.snowOpacity * clamp(0.6 + baseIntensity * 0.4, 0, 1.2),
    skyOpacity: values.skyOpacity,
    glowOpacity: values.glowOpacity,
  };
}

function getEffectiveLayerMode(prefs: WeatherPrefs, state: WeatherState): WeatherLayerMode {
  return prefs.layerMode === "auto" ? state.layer : prefs.layerMode;
}

function createHudWidget(
  ctx: SpindleFrontendContext,
  initialPosition?: { x: number; y: number } | null,
): HudElements {
  const widget = ctx.ui.createFloatWidget({
    width: 236,
    height: 106,
    initialPosition: initialPosition ?? { x: 24, y: 96 },
    snapToEdge: true,
    tooltip: "Story Weather HUD",
    chromeless: true,
  });

  const root = document.createElement("div");
  root.className = "weather-hud-widget";

  const header = document.createElement("div");
  header.className = "weather-hud-header";

  const eyebrow = document.createElement("div");
  eyebrow.className = "weather-hud-eyebrow";
  eyebrow.textContent = "Story Weather";

  const settingsButton = document.createElement("button");
  settingsButton.className = "weather-hud-gear";
  settingsButton.type = "button";
  settingsButton.innerHTML = GEAR_SVG;
  settingsButton.title = "Open extension settings";
  settingsButton.addEventListener("click", (event) => {
    event.stopPropagation();
    ctx.events.emit("open-settings", { view: "extensions" });
  });

  header.appendChild(eyebrow);
  header.appendChild(settingsButton);

  const body = document.createElement("div");
  body.className = "weather-hud-body";

  const left = document.createElement("div");
  const date = document.createElement("div");
  date.className = "weather-hud-date";
  const time = document.createElement("div");
  time.className = "weather-hud-time";
  const wind = document.createElement("div");
  wind.className = "weather-hud-wind";
  left.appendChild(date);
  left.appendChild(time);
  left.appendChild(wind);

  const right = document.createElement("div");
  right.className = "weather-hud-weather";
  const icon = document.createElement("div");
  icon.className = "weather-hud-icon";
  const temp = document.createElement("div");
  temp.className = "weather-hud-temp";
  const summary = document.createElement("div");
  summary.className = "weather-hud-summary";
  right.appendChild(icon);
  right.appendChild(temp);
  right.appendChild(summary);

  body.appendChild(left);
  body.appendChild(right);

  const footer = document.createElement("div");
  footer.className = "weather-hud-footer";
  const layer = document.createElement("span");
  layer.className = "weather-hud-badge";
  const condition = document.createElement("span");
  condition.className = "weather-hud-badge";
  const palette = document.createElement("span");
  palette.className = "weather-hud-badge";
  footer.appendChild(layer);
  footer.appendChild(condition);
  footer.appendChild(palette);

  root.appendChild(header);
  root.appendChild(body);
  root.appendChild(footer);
  widget.root.appendChild(root);

  return {
    widget,
    root,
    date,
    time,
    wind,
    icon,
    temp,
    summary,
    layer,
    condition,
    palette,
  };
}

function getLiveDate(state: WeatherState): Date | null {
  if (state.timestampMs === null) return null;
  const elapsed = Math.max(0, Date.now() - state.updatedAt);
  return new Date(state.timestampMs + elapsed);
}

function applyHudState(hud: HudElements, prefs: WeatherPrefs, state: WeatherState): void {
  const liveDate = getLiveDate(state);
  hud.icon.innerHTML = conditionIcon(state.condition);
  hud.temp.textContent = state.temperature;
  hud.summary.textContent = state.summary;
  hud.wind.textContent = `Wind: ${state.wind}`;
  hud.condition.textContent = state.condition;
  hud.palette.textContent = state.palette;
  hud.layer.textContent = getEffectiveLayerMode(prefs, state);

  if (liveDate) {
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    hud.date.textContent = dateFormatter.format(liveDate);
    hud.time.textContent = timeFormatter.format(liveDate);
  } else {
    hud.date.textContent = state.date;
    hud.time.textContent = state.time;
  }
}

function setFxVisibility(root: FxRoot, visible: boolean): void {
  root.root.classList.toggle("weather-hidden", !visible);
  root.root.classList.toggle("weather-visible", visible);
}

function applySceneState(root: FxRoot, state: WeatherState, prefs: WeatherPrefs, reducedMotion: boolean): void {
  const effectiveIntensity = clamp(state.intensity * prefs.intensity, 0, 1.5);
  const tokens = resolveSceneTokens(state, effectiveIntensity);

  root.root.classList.toggle("weather-reduced-motion", reducedMotion);
  root.root.style.setProperty("--weather-bg-start", tokens.bgStart);
  root.root.style.setProperty("--weather-bg-mid", tokens.bgMid);
  root.root.style.setProperty("--weather-bg-end", tokens.bgEnd);
  root.root.style.setProperty("--weather-glow", tokens.glow);
  root.root.style.setProperty("--weather-cloud-opacity", String(tokens.cloudOpacity * (root.root.dataset.kind === "back" ? 1 : 0.65)));
  root.root.style.setProperty("--weather-fog-opacity", String(tokens.fogOpacity * (root.root.dataset.kind === "back" ? 1 : 0.6)));
  root.root.style.setProperty("--weather-rain-opacity", String(tokens.rainOpacity * (root.root.dataset.kind === "front" ? 1 : 0.45)));
  root.root.style.setProperty("--weather-snow-opacity", String(tokens.snowOpacity * (root.root.dataset.kind === "front" ? 1 : 0.5)));
  root.root.style.setProperty("--weather-sky-opacity", String(tokens.skyOpacity));
  root.root.style.setProperty("--weather-glow-opacity", String(tokens.glowOpacity));
  root.root.style.setProperty("--weather-rain-color", state.condition === "storm" ? "rgba(201, 224, 255, 0.95)" : "rgba(193, 222, 255, 0.82)");
  root.root.style.setProperty("--weather-snow-color", "rgba(248, 251, 255, 0.92)");
  root.root.style.setProperty(
    "--weather-particle-opacity-static",
    state.condition === "snow" ? String(tokens.snowOpacity * 0.18) : String(tokens.rainOpacity * 0.12),
  );
}

export function setup(ctx: SpindleFrontendContext) {
  const cleanups: Array<() => void> = [];
  const removeStyle = ctx.dom.addStyle(WEATHER_HUD_CSS);
  cleanups.push(removeStyle);

  let currentPrefs: WeatherPrefs = DEFAULT_PREFS;
  let currentState: WeatherState = makeDefaultWeatherState();
  let activeChatId: string | null = null;

  const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  const getReducedMotion = () =>
    currentPrefs.reducedMotion === "always" ||
    (currentPrefs.reducedMotion === "system" && motionMedia.matches);

  const settingsMount = ctx.ui.mount("settings_extensions");
  const settingsUI = createSettingsUI((payload) => sendToBackend(ctx, payload as FrontendToBackend));
  settingsMount.appendChild(settingsUI.root);
  cleanups.push(() => settingsUI.destroy());

  const backFx = createFxRoot(ctx, "back");
  const frontFx = createFxRoot(ctx, "front");
  cleanups.push(() => backFx.mount.destroy(), () => frontFx.mount.destroy());

  let hud = createHudWidget(ctx, currentPrefs.widgetPosition);
  cleanups.push(() => hud.widget.destroy());

  let flashTimer: number | null = null;

  const resetFlashTimer = () => {
    if (flashTimer !== null) {
      window.clearTimeout(flashTimer);
      flashTimer = null;
    }
  };

  const scheduleStormFlash = () => {
    resetFlashTimer();
    if (currentState.condition !== "storm" || getReducedMotion() || currentPrefs.pauseEffects || !currentPrefs.effectsEnabled) {
      backFx.root.classList.remove("weather-storm-flash");
      frontFx.root.classList.remove("weather-storm-flash");
      return;
    }

    const trigger = () => {
      backFx.root.classList.add("weather-storm-flash");
      frontFx.root.classList.add("weather-storm-flash");
      window.setTimeout(() => {
        backFx.root.classList.remove("weather-storm-flash");
        frontFx.root.classList.remove("weather-storm-flash");
      }, 180);
      flashTimer = window.setTimeout(trigger, 4200 + Math.random() * 5200);
    };

    flashTimer = window.setTimeout(trigger, 2200 + Math.random() * 2400);
  };

  const updateScene = () => {
    const reducedMotion = getReducedMotion();
    const layerMode = getEffectiveLayerMode(currentPrefs, currentState);
    const showEffects = currentPrefs.effectsEnabled && !currentPrefs.pauseEffects;

    applyHudState(hud, currentPrefs, currentState);
    settingsUI.sync(currentPrefs, currentState);
    applySceneState(backFx, currentState, currentPrefs, reducedMotion);
    applySceneState(frontFx, currentState, currentPrefs, reducedMotion);
    setFxVisibility(backFx, showEffects && (layerMode === "back" || layerMode === "both"));
    setFxVisibility(frontFx, showEffects && (layerMode === "front" || layerMode === "both"));
    scheduleStormFlash();
  };

  const clockTimer = window.setInterval(() => {
    applyHudState(hud, currentPrefs, currentState);
  }, 1000);
  cleanups.push(() => window.clearInterval(clockTimer));

  const onMotionChange = () => updateScene();
  motionMedia.addEventListener("change", onMotionChange);
  cleanups.push(() => motionMedia.removeEventListener("change", onMotionChange));

  hud.widget.onDragEnd((position) => {
    sendToBackend(ctx, { type: "save_prefs", prefs: { widgetPosition: position } });
  });

  const tagUnsub = ctx.messages.registerTagInterceptor(
    { tagName: WEATHER_TAG_NAME, removeFromMessage: true },
    (payload) => {
      if (payload.isStreaming) return;
      sendToBackend(ctx, {
        type: "weather_tag_intercepted",
        chatId: payload.chatId ?? activeChatId,
        messageId: payload.messageId ?? null,
        attrs: payload.attrs,
        isStreaming: !!payload.isStreaming,
      });
    },
  );
  cleanups.push(tagUnsub);

  const msgUnsub = ctx.onBackendMessage((raw) => {
    const message = raw as BackendToFrontend;

    switch (message.type) {
      case "prefs":
        currentPrefs = message.prefs;
        if (currentPrefs.widgetPosition) {
          hud.widget.moveTo(currentPrefs.widgetPosition.x, currentPrefs.widgetPosition.y);
        } else {
          hud.widget.moveTo(24, 96);
        }
        updateScene();
        break;

      case "active_chat_state":
        activeChatId = message.chatId;
        currentState = message.state ?? makeDefaultWeatherState();
        updateScene();
        break;

      case "weather_state":
        activeChatId = message.chatId ?? activeChatId;
        currentState = message.state;
        updateScene();
        break;

      case "error":
        console.warn(`[weather_hud] ${message.message}`);
        break;
    }
  });
  cleanups.push(msgUnsub);

  const chatChangedUnsub = ctx.events.on("CHAT_CHANGED", (payload: unknown) => {
    const chatId =
      payload && typeof payload === "object" && "chatId" in payload
        ? (payload as { chatId?: string }).chatId ?? null
        : null;
    activeChatId = chatId;
    sendToBackend(ctx, { type: "chat_changed", chatId });
  });
  cleanups.push(chatChangedUnsub);

  sendToBackend(ctx, { type: "frontend_ready" });
  updateScene();

  return () => {
    resetFlashTimer();
    for (const cleanup of cleanups.reverse()) cleanup();
  };
}
