import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { buildPresetWeatherState, matchWeatherScenePreset, WEATHER_SCENE_PRESETS } from "./presets";
import { DEFAULT_PREFS, WEATHER_TAG_NAME, clamp, makeDefaultWeatherState } from "./shared";
import type {
  BackendToFrontend,
  FrontendToBackend,
  WeatherCondition,
  WeatherLayerMode,
  WeatherPrefs,
  WeatherState,
} from "./types";
import { createSettingsUI } from "./ui/settings";
import { WEATHER_HUD_CSS } from "./ui/styles";

const GEAR_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98a7.79 7.79 0 000-1.96l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.88 7.88 0 00-1.69-.98l-.36-2.54a.5.5 0 00-.49-.42h-3.84a.5.5 0 00-.49.42l-.36 2.54c-.6.24-1.16.56-1.69.98l-2.39-.96a.5.5 0 00-.6.22L2.43 8.8a.5.5 0 00.12.64l2.03 1.58a7.79 7.79 0 000 1.96L2.55 14.56a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.6.22l2.39-.96c.53.42 1.09.74 1.69.98l.36 2.54a.5.5 0 00.49.42h3.84a.5.5 0 00.49-.42l.36-2.54c.6-.24 1.16-.56 1.69-.98l2.39.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z"/></svg>`;
const CHEVRON_DOWN_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`;
const CHEVRON_UP_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="m7.41 15.41 4.59-4.58 4.59 4.58L18 14l-6-6-6 6z"/></svg>`;

const HUD_COLLAPSED_SIZE = { width: 268, height: 172 };
const HUD_EXPANDED_SIZE = { width: 304, height: 360 };
const DEFAULT_WIDGET_POSITION = { x: 24, y: 96 };

type FloatWidgetHandle = ReturnType<SpindleFrontendContext["ui"]["createFloatWidget"]>;

type FxRoot = {
  root: HTMLDivElement;
  host: HTMLElement | null;
  releaseHost: (() => void) | null;
  kind: "back" | "front";
};

type SceneHostResolution = {
  backHost: HTMLElement | null;
  backBefore: HTMLElement | null;
  frontHost: HTMLElement | null;
  frontBefore: HTMLElement | null;
};

type HudCallbacks = {
  onToggleDrawer(): void;
  onOpenSettings(): void;
  onLockCurrentScene(): void;
  onResumeStory(): void;
  onApplyPreset(presetId: string): void;
  onChangeLayerMode(mode: WeatherPrefs["layerMode"]): void;
  onChangeIntensity(intensity: number): void;
  onTogglePause(): void;
};

type HudElements = {
  widget: FloatWidgetHandle;
  root: HTMLDivElement;
  location: HTMLDivElement;
  date: HTMLDivElement;
  time: HTMLDivElement;
  wind: HTMLDivElement;
  icon: HTMLDivElement;
  temp: HTMLDivElement;
  summary: HTMLDivElement;
  layer: HTMLSpanElement;
  condition: HTMLSpanElement;
  palette: HTMLSpanElement;
  source: HTMLSpanElement;
  drawerToggleLabel: HTMLSpanElement;
  drawerToggleIcon: HTMLSpanElement;
  storyButton?: HTMLButtonElement;
  manualButton?: HTMLButtonElement;
  presetButtons: Map<string, HTMLButtonElement>;
  layerSelect?: HTMLSelectElement;
  intensitySlider?: HTMLInputElement;
  intensityValue?: HTMLSpanElement;
  pauseButton?: HTMLButtonElement;
  resumeButton?: HTMLButtonElement;
};

type SceneTokens = {
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  glow: string;
  beamColor: string;
  horizonColor: string;
  skyOpacity: number;
  glowOpacity: number;
  beamOpacity: number;
  cloudOpacity: number;
  horizonOpacity: number;
  mistOpacity: number;
  fogOpacity: number;
  rainOpacity: number;
  snowOpacity: number;
  moteOpacity: number;
  flashOpacity: number;
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

function titleCase(value: string): string {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function protectInteractive(element: HTMLElement): void {
  const stop = (event: Event) => event.stopPropagation();
  element.addEventListener("pointerdown", stop);
  element.addEventListener("mousedown", stop);
  element.addEventListener("touchstart", stop);
}

function createFxMarkup(kind: "back" | "front"): FxRoot {
  const root = document.createElement("div");
  root.className = "weather-fx-root";
  root.dataset.kind = kind;

  const flash = document.createElement("div");
  flash.className = "weather-fx-flash";

  if (kind === "back") {
    const sky = document.createElement("div");
    sky.className = "weather-fx-sky";
    root.appendChild(sky);

    const glow = document.createElement("div");
    glow.className = "weather-fx-glow";
    root.appendChild(glow);

    const beams = document.createElement("div");
    beams.className = "weather-fx-beams";
    root.appendChild(beams);

    const clouds = document.createElement("div");
    clouds.className = "weather-fx-clouds";
    root.appendChild(clouds);

    const horizon = document.createElement("div");
    horizon.className = "weather-fx-horizon";
    root.appendChild(horizon);

    const mist = document.createElement("div");
    mist.className = "weather-fx-mist";
    root.appendChild(mist);

    const fog = document.createElement("div");
    fog.className = "weather-fx-fog";
    root.appendChild(fog);

    const motes = document.createElement("div");
    motes.className = "weather-fx-motes";
    root.appendChild(motes);

    const rain = document.createElement("div");
    rain.className = "weather-fx-rain";
    root.appendChild(rain);

    const snow = document.createElement("div");
    snow.className = "weather-fx-snow";
    root.appendChild(snow);

    for (let index = 0; index < 10; index += 1) {
      clouds.appendChild(
        createSpan("weather-fx-cloud", {
          "--cloud-width": `${180 + Math.round(Math.random() * 260)}px`,
          "--cloud-height": `${46 + Math.round(Math.random() * 70)}px`,
          "--cloud-top": `${4 + index * 8 + Math.round(Math.random() * 5)}%`,
          "--cloud-left": `${-22 + Math.round(Math.random() * 102)}%`,
          "--cloud-duration": `${28 + Math.round(Math.random() * 34)}s`,
          "--cloud-delay": `${Math.round(Math.random() * -30)}s`,
          "--cloud-blur": `${4 + Math.round(Math.random() * 10)}px`,
          "--cloud-opacity-scale": `${(0.55 + Math.random() * 0.65).toFixed(2)}`,
        }),
      );
    }

    for (let index = 0; index < 6; index += 1) {
      fog.appendChild(
        createSpan("weather-fx-fog-band", {
          "--fog-width": `${240 + Math.round(Math.random() * 320)}px`,
          "--fog-height": `${52 + Math.round(Math.random() * 44)}px`,
          "--fog-top": `${14 + index * 12 + Math.round(Math.random() * 5)}%`,
          "--fog-left": `${-14 + Math.round(Math.random() * 90)}%`,
          "--fog-duration": `${18 + Math.round(Math.random() * 16)}s`,
          "--fog-delay": `${Math.round(Math.random() * -18)}s`,
          "--fog-opacity-scale": `${(0.55 + Math.random() * 0.6).toFixed(2)}`,
        }),
      );
    }

    for (let index = 0; index < 5; index += 1) {
      mist.appendChild(
        createSpan("weather-fx-mist-plume", {
          "--mist-width": `${260 + Math.round(Math.random() * 280)}px`,
          "--mist-height": `${80 + Math.round(Math.random() * 42)}px`,
          "--mist-left": `${-12 + Math.round(Math.random() * 88)}%`,
          "--mist-bottom": `${-3 + Math.round(Math.random() * 16)}%`,
          "--mist-duration": `${16 + Math.round(Math.random() * 14)}s`,
          "--mist-delay": `${Math.round(Math.random() * -16)}s`,
          "--mist-opacity-scale": `${(0.6 + Math.random() * 0.55).toFixed(2)}`,
        }),
      );
    }

    for (let index = 0; index < 18; index += 1) {
      motes.appendChild(
        createSpan("weather-fx-mote", {
          "--mote-left": `${Math.round(Math.random() * 100)}%`,
          "--mote-top": `${18 + Math.round(Math.random() * 64)}%`,
          "--mote-size": `${2 + Math.random() * 4}px`,
          "--mote-duration": `${10 + Math.random() * 10}s`,
          "--mote-delay": `${Math.random() * -10}s`,
          "--mote-drift-x": `${(-2 + Math.random() * 4).toFixed(2)}vw`,
          "--mote-drift-y": `${(-1 + Math.random() * 3).toFixed(2)}vh`,
          "--mote-opacity-scale": `${(0.45 + Math.random() * 0.7).toFixed(2)}`,
        }),
      );
    }

    for (let index = 0; index < 64; index += 1) {
      rain.appendChild(
        createSpan("weather-fx-rain-drop", {
          "--drop-left": `${Math.round(Math.random() * 104)}%`,
          "--drop-top": `${(-20 - Math.random() * 28).toFixed(2)}%`,
          "--drop-width": `${1 + Math.round(Math.random())}px`,
          "--drop-length": `${20 + Math.round(Math.random() * 28)}px`,
          "--drop-duration": `${0.9 + Math.random() * 0.85}s`,
          "--drop-delay": `${Math.random() * -2.3}s`,
          "--drop-drift": `${(-4.5 - Math.random() * 5.5).toFixed(2)}vw`,
          "--drop-opacity-scale": `${(0.4 + Math.random() * 0.7).toFixed(2)}`,
        }),
      );
    }

    for (let index = 0; index < 42; index += 1) {
      snow.appendChild(
        createSpan("weather-fx-snow-flake", {
          "--flake-left": `${Math.round(Math.random() * 102)}%`,
          "--flake-top": `${(-18 - Math.random() * 18).toFixed(2)}%`,
          "--flake-size": `${2 + Math.random() * 4}px`,
          "--flake-duration": `${6.4 + Math.random() * 4.6}s`,
          "--flake-delay": `${Math.random() * -6}s`,
          "--flake-drift-mid": `${(-1.8 + Math.random() * 3.6).toFixed(2)}vw`,
          "--flake-drift-end": `${(-4 + Math.random() * 8).toFixed(2)}vw`,
          "--flake-spin-mid": `${Math.round(-18 + Math.random() * 36)}deg`,
          "--flake-spin-end": `${Math.round(-32 + Math.random() * 64)}deg`,
          "--flake-opacity-scale": `${(0.48 + Math.random() * 0.62).toFixed(2)}`,
        }),
      );
    }
  } else {
    const rain = document.createElement("div");
    rain.className = "weather-fx-rain weather-fx-rain-front";
    root.appendChild(rain);

    const snow = document.createElement("div");
    snow.className = "weather-fx-snow weather-fx-snow-front";
    root.appendChild(snow);

    for (let index = 0; index < 92; index += 1) {
      rain.appendChild(
        createSpan("weather-fx-rain-drop weather-fx-rain-drop-front", {
          "--drop-left": `${Math.round(Math.random() * 104)}%`,
          "--drop-top": `${(-24 - Math.random() * 30).toFixed(2)}%`,
          "--drop-width": `${2 + Math.round(Math.random())}px`,
          "--drop-length": `${26 + Math.round(Math.random() * 34)}px`,
          "--drop-duration": `${0.75 + Math.random() * 0.65}s`,
          "--drop-delay": `${Math.random() * -2.1}s`,
          "--drop-drift": `${(-7 - Math.random() * 8).toFixed(2)}vw`,
          "--drop-opacity-scale": `${(0.48 + Math.random() * 0.75).toFixed(2)}`,
        }),
      );
    }

    for (let index = 0; index < 58; index += 1) {
      snow.appendChild(
        createSpan("weather-fx-snow-flake weather-fx-snow-flake-front", {
          "--flake-left": `${Math.round(Math.random() * 102)}%`,
          "--flake-top": `${(-18 - Math.random() * 20).toFixed(2)}%`,
          "--flake-size": `${4 + Math.random() * 6}px`,
          "--flake-duration": `${5.2 + Math.random() * 3.8}s`,
          "--flake-delay": `${Math.random() * -5.4}s`,
          "--flake-drift-mid": `${(-2.6 + Math.random() * 5.2).toFixed(2)}vw`,
          "--flake-drift-end": `${(-6 + Math.random() * 12).toFixed(2)}vw`,
          "--flake-spin-mid": `${Math.round(-28 + Math.random() * 56)}deg`,
          "--flake-spin-end": `${Math.round(-60 + Math.random() * 120)}deg`,
          "--flake-opacity-scale": `${(0.56 + Math.random() * 0.72).toFixed(2)}`,
        }),
      );
    }
  }

  root.appendChild(flash);

  return { root, host: null, releaseHost: null, kind };
}

function asHTMLElement(element: Element | null): HTMLElement | null {
  return element instanceof HTMLElement ? element : null;
}

function closestByClassFragment(start: Element | null, fragment: string): HTMLElement | null {
  if (!(start instanceof Element)) return null;
  return asHTMLElement(start.closest(`[class*="${fragment}"]`));
}

function resolveInitialChatId(): string | null {
  const source = [window.location.pathname, window.location.search, window.location.hash].join(" ");
  const match = source.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i);
  return match?.[0] ?? null;
}

function resolveSceneHosts(): SceneHostResolution {
  const backgroundLayer = asHTMLElement(document.querySelector('[class*="sceneBackgroundLayer"]'));
  const textContextLayer = asHTMLElement(document.querySelector('[class*="sceneTextContextLayer"]'));
  const scrollRegion = asHTMLElement(document.querySelector('[data-chat-scroll="true"]'));
  const chatColumnInner =
    closestByClassFragment(scrollRegion, "chatColumnInner") ??
    (scrollRegion?.parentElement instanceof HTMLElement ? scrollRegion.parentElement : null);
  const chatColumn =
    closestByClassFragment(scrollRegion, "chatColumn") ??
    (chatColumnInner?.parentElement instanceof HTMLElement ? chatColumnInner.parentElement : chatColumnInner);
  const sceneBody =
    closestByClassFragment(scrollRegion, "body") ??
    (chatColumn?.parentElement instanceof HTMLElement ? chatColumn.parentElement : null);
  const sceneContainer =
    closestByClassFragment(backgroundLayer, "container") ??
    closestByClassFragment(sceneBody, "container") ??
    (sceneBody?.parentElement instanceof HTMLElement
      ? sceneBody.parentElement
      : backgroundLayer?.parentElement instanceof HTMLElement
        ? backgroundLayer.parentElement
        : null);
  const backHost = sceneContainer ?? sceneBody ?? backgroundLayer?.parentElement ?? chatColumn ?? chatColumnInner ?? scrollRegion;
  const preferredBackBefore = textContextLayer ?? sceneBody;
  const backBefore = preferredBackBefore?.parentElement === backHost ? preferredBackBefore : null;
  const frontHost = chatColumn ?? chatColumnInner ?? sceneBody ?? scrollRegion ?? backgroundLayer;

  return {
    backHost,
    backBefore,
    frontHost,
    frontBefore: null,
  };
}

function readChatIdFromSettingsUpdate(payload: unknown): string | null | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const key = "key" in payload ? (payload as { key?: unknown }).key : undefined;
  if (key !== "activeChatId") return undefined;

  const value = "value" in payload ? (payload as { value?: unknown }).value : undefined;
  if (typeof value !== "string" || !value.trim()) return null;
  return value;
}

function resolveSceneTokens(state: WeatherState, intensity: number): SceneTokens {
  const paletteMap: Record<
    WeatherState["palette"],
    {
      start: string;
      mid: string;
      end: string;
      glow: string;
      beam: string;
      horizon: string;
    }
  > = {
    dawn: {
      start: "#20385f",
      mid: "#5a77a9",
      end: "#f0a56e",
      glow: "rgba(255, 203, 145, 0.82)",
      beam: "rgba(255, 218, 165, 0.48)",
      horizon: "rgba(255, 182, 125, 0.44)",
    },
    day: {
      start: "#4d77ad",
      mid: "#7fa8de",
      end: "#d8ebff",
      glow: "rgba(255, 243, 202, 0.78)",
      beam: "rgba(255, 244, 212, 0.44)",
      horizon: "rgba(185, 212, 244, 0.28)",
    },
    dusk: {
      start: "#221f4c",
      mid: "#68487a",
      end: "#f09067",
      glow: "rgba(255, 173, 128, 0.72)",
      beam: "rgba(255, 189, 150, 0.38)",
      horizon: "rgba(224, 149, 114, 0.34)",
    },
    night: {
      start: "#05101d",
      mid: "#10253c",
      end: "#274768",
      glow: "rgba(143, 180, 255, 0.48)",
      beam: "rgba(130, 164, 234, 0.2)",
      horizon: "rgba(74, 104, 154, 0.26)",
    },
    storm: {
      start: "#04101a",
      mid: "#13283a",
      end: "#33475f",
      glow: "rgba(188, 220, 255, 0.26)",
      beam: "rgba(168, 203, 236, 0.16)",
      horizon: "rgba(108, 139, 170, 0.26)",
    },
    mist: {
      start: "#213141",
      mid: "#586c7d",
      end: "#a7bac2",
      glow: "rgba(226, 240, 255, 0.32)",
      beam: "rgba(228, 239, 248, 0.18)",
      horizon: "rgba(206, 220, 228, 0.36)",
    },
    snow: {
      start: "#415b76",
      mid: "#7d93a8",
      end: "#e0e9f1",
      glow: "rgba(255, 252, 244, 0.66)",
      beam: "rgba(242, 245, 255, 0.32)",
      horizon: "rgba(229, 238, 248, 0.4)",
    },
  };

  const palette = paletteMap[state.palette];
  const baseIntensity = clamp(intensity, 0, 1.5);

  const values = {
    skyOpacity: 0.05,
    glowOpacity: 0.1,
    beamOpacity: 0.12,
    cloudOpacity: 0.06,
    horizonOpacity: 0.04,
    mistOpacity: 0.03,
    fogOpacity: 0,
    rainOpacity: 0,
    snowOpacity: 0,
    moteOpacity: 0.06,
    flashOpacity: 0.26,
  };

  switch (state.condition) {
    case "cloudy":
      values.skyOpacity = 0.1;
      values.glowOpacity = 0.08;
      values.beamOpacity = 0.04;
      values.cloudOpacity = 0.36;
      values.horizonOpacity = 0.08;
      values.mistOpacity = 0.05;
      values.moteOpacity = 0.02;
      break;
    case "rain":
      values.skyOpacity = 0.12;
      values.glowOpacity = 0.05;
      values.beamOpacity = 0.01;
      values.cloudOpacity = 0.44;
      values.horizonOpacity = 0.12;
      values.mistOpacity = 0.16;
      values.fogOpacity = 0.08;
      values.rainOpacity = 0.72;
      values.moteOpacity = 0;
      break;
    case "storm":
      values.skyOpacity = 0.15;
      values.glowOpacity = 0.04;
      values.beamOpacity = 0;
      values.cloudOpacity = 0.58;
      values.horizonOpacity = 0.18;
      values.mistOpacity = 0.2;
      values.fogOpacity = 0.12;
      values.rainOpacity = 0.94;
      values.flashOpacity = 0.58;
      values.moteOpacity = 0;
      break;
    case "snow":
      values.skyOpacity = 0.11;
      values.glowOpacity = 0.16;
      values.beamOpacity = 0.08;
      values.cloudOpacity = 0.24;
      values.horizonOpacity = 0.16;
      values.mistOpacity = 0.08;
      values.fogOpacity = 0.05;
      values.snowOpacity = 0.84;
      values.moteOpacity = 0.02;
      break;
    case "fog":
      values.skyOpacity = 0.08;
      values.glowOpacity = 0.08;
      values.beamOpacity = 0.02;
      values.cloudOpacity = 0.14;
      values.horizonOpacity = 0.22;
      values.mistOpacity = 0.32;
      values.fogOpacity = 0.58;
      values.moteOpacity = 0.01;
      break;
    case "clear":
    default:
      if (state.palette === "night") {
        values.skyOpacity = 0.04;
        values.glowOpacity = 0.08;
        values.beamOpacity = 0.03;
        values.cloudOpacity = 0.02;
        values.moteOpacity = 0.02;
      }
      break;
  }

  const detailScale = clamp(0.7 + baseIntensity * 0.26, 0.65, 1.08);
  const atmosphereScale = clamp(0.8 + baseIntensity * 0.22, 0.75, 1.08);

  return {
    bgStart: palette.start,
    bgMid: palette.mid,
    bgEnd: palette.end,
    glow: palette.glow,
    beamColor: palette.beam,
    horizonColor: palette.horizon,
    skyOpacity: values.skyOpacity * atmosphereScale,
    glowOpacity: values.glowOpacity * atmosphereScale,
    beamOpacity: values.beamOpacity * atmosphereScale,
    cloudOpacity: values.cloudOpacity * detailScale,
    horizonOpacity: values.horizonOpacity * atmosphereScale,
    mistOpacity: values.mistOpacity * detailScale,
    fogOpacity: values.fogOpacity * detailScale,
    rainOpacity: values.rainOpacity * detailScale,
    snowOpacity: values.snowOpacity * detailScale,
    moteOpacity: state.condition === "clear" && baseIntensity > 0.48 ? values.moteOpacity * detailScale : values.moteOpacity * 0.4,
    flashOpacity: values.flashOpacity,
  };
}

function getEffectiveLayerMode(prefs: WeatherPrefs, state: WeatherState): WeatherLayerMode {
  return prefs.layerMode === "auto" ? state.layer : prefs.layerMode;
}

function createHudWidget(
  ctx: SpindleFrontendContext,
  initialPosition: { x: number; y: number },
  expanded: boolean,
  callbacks: HudCallbacks,
): HudElements {
  const size = expanded ? HUD_EXPANDED_SIZE : HUD_COLLAPSED_SIZE;
  const widget = ctx.ui.createFloatWidget({
    width: size.width,
    height: size.height,
    initialPosition,
    snapToEdge: true,
    tooltip: "Story Weather HUD",
    chromeless: true,
  });

  const root = document.createElement("div");
  root.className = "weather-hud-widget";
  root.dataset.expanded = expanded ? "true" : "false";

  const header = document.createElement("div");
  header.className = "weather-hud-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "weather-hud-titlewrap";
  const eyebrow = document.createElement("div");
  eyebrow.className = "weather-hud-eyebrow";
  eyebrow.textContent = "Story Weather";
  const source = document.createElement("span");
  source.className = "weather-hud-source";
  titleWrap.appendChild(eyebrow);
  titleWrap.appendChild(source);

  const headerActions = document.createElement("div");
  headerActions.className = "weather-hud-actions";

  const drawerToggle = document.createElement("button");
  drawerToggle.type = "button";
  drawerToggle.className = "weather-hud-control weather-hud-control-ghost";
  protectInteractive(drawerToggle);
  const drawerToggleLabel = document.createElement("span");
  drawerToggleLabel.textContent = expanded ? "Hide controls" : "Quick controls";
  const drawerToggleIcon = document.createElement("span");
  drawerToggleIcon.className = "weather-hud-control-icon";
  drawerToggleIcon.innerHTML = expanded ? CHEVRON_UP_SVG : CHEVRON_DOWN_SVG;
  drawerToggle.appendChild(drawerToggleLabel);
  drawerToggle.appendChild(drawerToggleIcon);
  drawerToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    callbacks.onToggleDrawer();
  });

  const settingsButton = document.createElement("button");
  settingsButton.className = "weather-hud-gear";
  settingsButton.type = "button";
  settingsButton.innerHTML = GEAR_SVG;
  settingsButton.title = "Open extension settings";
  protectInteractive(settingsButton);
  settingsButton.addEventListener("click", (event) => {
    event.stopPropagation();
    callbacks.onOpenSettings();
  });

  headerActions.appendChild(drawerToggle);
  headerActions.appendChild(settingsButton);
  header.appendChild(titleWrap);
  header.appendChild(headerActions);

  const body = document.createElement("div");
  body.className = "weather-hud-body";

  const left = document.createElement("div");
  left.className = "weather-hud-primary";
  const location = document.createElement("div");
  location.className = "weather-hud-location";
  const date = document.createElement("div");
  date.className = "weather-hud-date";
  const time = document.createElement("div");
  time.className = "weather-hud-time";
  const wind = document.createElement("div");
  wind.className = "weather-hud-wind";
  left.appendChild(location);
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

  const presetButtons = new Map<string, HTMLButtonElement>();
  let storyButton: HTMLButtonElement | undefined;
  let manualButton: HTMLButtonElement | undefined;
  let layerSelect: HTMLSelectElement | undefined;
  let intensitySlider: HTMLInputElement | undefined;
  let intensityValue: HTMLSpanElement | undefined;
  let pauseButton: HTMLButtonElement | undefined;
  let resumeButton: HTMLButtonElement | undefined;

  if (expanded) {
    const drawer = document.createElement("div");
    drawer.className = "weather-hud-drawer";

    const modeSection = document.createElement("div");
    modeSection.className = "weather-hud-drawer-section";
    const modeLabel = document.createElement("span");
    modeLabel.className = "weather-hud-section-label";
    modeLabel.textContent = "Mode";
    const modeRow = document.createElement("div");
    modeRow.className = "weather-hud-mode-row";

    storyButton = document.createElement("button");
    storyButton.type = "button";
    storyButton.className = "weather-hud-chip";
    storyButton.textContent = "Story sync";
    protectInteractive(storyButton);
    storyButton.addEventListener("click", (event) => {
      event.stopPropagation();
      callbacks.onResumeStory();
    });

    manualButton = document.createElement("button");
    manualButton.type = "button";
    manualButton.className = "weather-hud-chip";
    manualButton.textContent = "Manual lock";
    protectInteractive(manualButton);
    manualButton.addEventListener("click", (event) => {
      event.stopPropagation();
      callbacks.onLockCurrentScene();
    });

    modeRow.appendChild(storyButton);
    modeRow.appendChild(manualButton);
    modeSection.appendChild(modeLabel);
    modeSection.appendChild(modeRow);

    const presetsSection = document.createElement("div");
    presetsSection.className = "weather-hud-drawer-section";
    const presetsLabel = document.createElement("span");
    presetsLabel.className = "weather-hud-section-label";
    presetsLabel.textContent = "Quick scene";
    const presetGrid = document.createElement("div");
    presetGrid.className = "weather-hud-preset-grid";

    for (const preset of WEATHER_SCENE_PRESETS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "weather-hud-preset";
      button.textContent = preset.shortLabel;
      button.title = preset.description;
      protectInteractive(button);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        callbacks.onApplyPreset(preset.id);
      });
      presetButtons.set(preset.id, button);
      presetGrid.appendChild(button);
    }

    presetsSection.appendChild(presetsLabel);
    presetsSection.appendChild(presetGrid);

    const controlsSection = document.createElement("div");
    controlsSection.className = "weather-hud-drawer-section";
    const controlsLabel = document.createElement("span");
    controlsLabel.className = "weather-hud-section-label";
    controlsLabel.textContent = "Placement & motion";

    const controlGrid = document.createElement("div");
    controlGrid.className = "weather-hud-control-grid";

    const layerWrap = document.createElement("label");
    layerWrap.className = "weather-hud-field";
    const layerText = document.createElement("span");
    layerText.textContent = "Placement";
    layerSelect = document.createElement("select");
    layerSelect.className = "weather-hud-select";
    layerSelect.innerHTML = `
      <option value="auto">Auto</option>
      <option value="back">Back</option>
      <option value="front">Front</option>
      <option value="both">Both</option>
    `;
    protectInteractive(layerSelect);
    layerSelect.addEventListener("change", (event) => {
      event.stopPropagation();
      callbacks.onChangeLayerMode(layerSelect!.value as WeatherPrefs["layerMode"]);
    });
    layerWrap.appendChild(layerText);
    layerWrap.appendChild(layerSelect);

    const intensityWrap = document.createElement("label");
    intensityWrap.className = "weather-hud-field";
    const intensityHeader = document.createElement("div");
    intensityHeader.className = "weather-hud-field-row";
    const intensityText = document.createElement("span");
    intensityText.textContent = "Density";
    intensityValue = document.createElement("span");
    intensityValue.className = "weather-hud-inline-value";
    intensityHeader.appendChild(intensityText);
    intensityHeader.appendChild(intensityValue);

    intensitySlider = document.createElement("input");
    intensitySlider.type = "range";
    intensitySlider.className = "weather-hud-range";
    intensitySlider.min = "0.25";
    intensitySlider.max = "1.50";
    intensitySlider.step = "0.05";
    protectInteractive(intensitySlider);
    intensitySlider.addEventListener("input", (event) => {
      event.stopPropagation();
      callbacks.onChangeIntensity(Number.parseFloat(intensitySlider!.value));
    });
    intensityWrap.appendChild(intensityHeader);
    intensityWrap.appendChild(intensitySlider);

    controlGrid.appendChild(layerWrap);
    controlGrid.appendChild(intensityWrap);

    controlsSection.appendChild(controlsLabel);
    controlsSection.appendChild(controlGrid);

    const actionsSection = document.createElement("div");
    actionsSection.className = "weather-hud-drawer-section";
    const actionRow = document.createElement("div");
    actionRow.className = "weather-hud-action-row";

    pauseButton = document.createElement("button");
    pauseButton.type = "button";
    pauseButton.className = "weather-hud-control";
    protectInteractive(pauseButton);
    pauseButton.addEventListener("click", (event) => {
      event.stopPropagation();
      callbacks.onTogglePause();
    });

    resumeButton = document.createElement("button");
    resumeButton.type = "button";
    resumeButton.className = "weather-hud-control weather-hud-control-ghost";
    resumeButton.textContent = "Resume story";
    protectInteractive(resumeButton);
    resumeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      callbacks.onResumeStory();
    });

    actionRow.appendChild(pauseButton);
    actionRow.appendChild(resumeButton);
    actionsSection.appendChild(actionRow);

    drawer.appendChild(modeSection);
    drawer.appendChild(presetsSection);
    drawer.appendChild(controlsSection);
    drawer.appendChild(actionsSection);

    root.appendChild(drawer);
  }

  widget.root.appendChild(root);

  return {
    widget,
    root,
    location,
    date,
    time,
    wind,
    icon,
    temp,
    summary,
    layer,
    condition,
    palette,
    source,
    drawerToggleLabel,
    drawerToggleIcon,
    storyButton,
    manualButton,
    presetButtons,
    layerSelect,
    intensitySlider,
    intensityValue,
    pauseButton,
    resumeButton,
  };
}

function getLiveDate(state: WeatherState): Date | null {
  if (state.timestampMs === null) return null;
  const elapsed = Math.max(0, Date.now() - state.updatedAt);
  return new Date(state.timestampMs + elapsed);
}

function syncHudState(hud: HudElements, prefs: WeatherPrefs, state: WeatherState, expanded: boolean): void {
  const liveDate = getLiveDate(state);
  hud.root.dataset.expanded = expanded ? "true" : "false";
  hud.root.dataset.source = state.source;
  hud.root.dataset.condition = state.condition;

  hud.icon.innerHTML = conditionIcon(state.condition);
  hud.temp.textContent = state.temperature;
  hud.summary.textContent = state.summary;
  hud.wind.textContent = `Wind • ${state.wind}`;
  hud.location.textContent = state.location;
  hud.wind.textContent = `Wind: ${state.wind}`;
  hud.condition.textContent = titleCase(state.condition);
  hud.palette.textContent = titleCase(state.palette);
  hud.layer.textContent = titleCase(getEffectiveLayerMode(prefs, state));
  hud.source.textContent = state.source === "manual" ? "Manual lock" : "Story sync";
  hud.drawerToggleLabel.textContent = expanded ? "Hide controls" : "Quick controls";
  hud.drawerToggleIcon.innerHTML = expanded ? CHEVRON_UP_SVG : CHEVRON_DOWN_SVG;

  if (liveDate) {
    hud.date.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(liveDate);
    hud.time.textContent = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(liveDate);
  } else {
    hud.date.textContent = state.date;
    hud.time.textContent = state.time;
  }

  if (hud.storyButton && hud.manualButton) {
    hud.storyButton.classList.toggle("weather-hud-chip-active", state.source === "story");
    hud.manualButton.classList.toggle("weather-hud-chip-active", state.source === "manual");
  }

  const activePresetId = matchWeatherScenePreset(state);
  for (const [presetId, button] of hud.presetButtons) {
    button.classList.toggle("weather-hud-preset-active", presetId === activePresetId);
  }

  if (hud.layerSelect) {
    hud.layerSelect.value = prefs.layerMode;
  }

  if (hud.intensitySlider && hud.intensityValue) {
    hud.intensitySlider.value = prefs.intensity.toFixed(2);
    hud.intensityValue.textContent = `${Math.round(prefs.intensity * 100)}%`;
  }

  if (hud.pauseButton) {
    hud.pauseButton.textContent = prefs.pauseEffects ? "Resume motion" : "Pause motion";
    hud.pauseButton.classList.toggle("weather-hud-control-active", prefs.pauseEffects);
  }

  if (hud.resumeButton) {
    hud.resumeButton.disabled = state.source === "story";
  }
}

function setFxVisibility(root: FxRoot, visible: boolean): void {
  root.root.classList.toggle("weather-hidden", !visible);
  root.root.classList.toggle("weather-visible", visible);
}

function applySceneState(root: FxRoot, state: WeatherState, prefs: WeatherPrefs, reducedMotion: boolean): void {
  const effectiveIntensity = clamp(state.intensity * prefs.intensity, 0, 1.5);
  const tokens = resolveSceneTokens(state, effectiveIntensity);
  const isFront = root.kind === "front";

  root.root.dataset.condition = state.condition;
  root.root.dataset.palette = state.palette;
  root.root.classList.toggle("weather-reduced-motion", reducedMotion);
  root.root.classList.toggle("weather-paused", prefs.pauseEffects);

  root.root.style.setProperty("--weather-bg-start", tokens.bgStart);
  root.root.style.setProperty("--weather-bg-mid", tokens.bgMid);
  root.root.style.setProperty("--weather-bg-end", tokens.bgEnd);
  root.root.style.setProperty("--weather-glow", tokens.glow);
  root.root.style.setProperty("--weather-beam-color", tokens.beamColor);
  root.root.style.setProperty("--weather-horizon-color", tokens.horizonColor);
  root.root.style.setProperty("--weather-sky-opacity", String(isFront ? 0 : tokens.skyOpacity));
  root.root.style.setProperty("--weather-glow-opacity", String(isFront ? 0 : tokens.glowOpacity));
  root.root.style.setProperty("--weather-beam-opacity", String(isFront ? 0 : tokens.beamOpacity));
  root.root.style.setProperty("--weather-cloud-opacity", String(isFront ? 0 : tokens.cloudOpacity));
  root.root.style.setProperty("--weather-horizon-opacity", String(isFront ? 0 : tokens.horizonOpacity));
  root.root.style.setProperty("--weather-mist-opacity", String(isFront ? 0 : tokens.mistOpacity));
  root.root.style.setProperty("--weather-fog-opacity", String(isFront ? 0 : tokens.fogOpacity));
  root.root.style.setProperty("--weather-rain-opacity", String(tokens.rainOpacity * (isFront ? 0.95 : 0.42)));
  root.root.style.setProperty("--weather-snow-opacity", String(tokens.snowOpacity * (isFront ? 0.98 : 0.38)));
  root.root.style.setProperty("--weather-mote-opacity", String(isFront ? 0 : tokens.moteOpacity));
  root.root.style.setProperty("--weather-flash-opacity", String(tokens.flashOpacity));
  root.root.style.setProperty(
    "--weather-rain-color",
    state.condition === "storm" ? "rgba(212, 231, 255, 0.96)" : "rgba(190, 220, 255, 0.84)",
  );
  root.root.style.setProperty(
    "--weather-snow-color",
    state.palette === "night" ? "rgba(219, 232, 255, 0.92)" : "rgba(247, 250, 255, 0.95)",
  );
  root.root.style.setProperty(
    "--weather-particle-opacity-static",
    state.condition === "snow"
      ? String(clamp(tokens.snowOpacity * 0.2, 0.04, 0.22))
      : String(clamp(tokens.rainOpacity * 0.12, 0.03, 0.18)),
  );
}

export function setup(ctx: SpindleFrontendContext) {
  console.info("[weather_hud] frontend build 2026-03-24.7");

  const cleanups: Array<() => void> = [];
  const removeStyle = ctx.dom.addStyle(WEATHER_HUD_CSS);
  cleanups.push(removeStyle);

  let currentPrefs: WeatherPrefs = DEFAULT_PREFS;
  let currentState: WeatherState = makeDefaultWeatherState();
  let activeChatId: string | null = resolveInitialChatId();
  let hudExpanded = false;

  const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  const getReducedMotion = () =>
    currentPrefs.reducedMotion === "always" ||
    (currentPrefs.reducedMotion === "system" && motionMedia.matches);

  const sendManualState = (state: Partial<WeatherState>) => {
    sendToBackend(ctx, { type: "set_manual_state", chatId: activeChatId, state });
  };

  const resumeStorySync = () => {
    sendToBackend(ctx, { type: "clear_manual_override", chatId: activeChatId });
  };

  const applyPreset = (presetId: string) => {
    const nextState = buildPresetWeatherState(presetId, currentState);
    if (!nextState) return;
    sendManualState(nextState);
  };

  const lockCurrentScene = () => {
    sendManualState({
      ...currentState,
      source: "manual",
    });
  };

  const settingsMount = ctx.ui.mount("settings_extensions");
  const settingsUI = createSettingsUI((payload) => {
    const message = payload as FrontendToBackend;
    if (message.type === "set_manual_state" || message.type === "clear_manual_override") {
      sendToBackend(ctx, { ...message, chatId: activeChatId });
      return;
    }
    sendToBackend(ctx, message);
  });
  settingsMount.appendChild(settingsUI.root);
  cleanups.push(() => settingsUI.destroy());

  const backFx = createFxMarkup("back");
  const frontFx = createFxMarkup("front");
  let hostSyncFrame: number | null = null;
  const managedHosts = new Map<HTMLElement, { count: number; restore: () => void }>();

  const prepareHostStyles = (host: HTMLElement): (() => void) => {
    const previousPosition = host.style.position;
    const previousOverflow = host.style.overflow;
    const previousIsolation = host.style.isolation;

    if (window.getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }
    if (window.getComputedStyle(host).overflow === "visible") {
      host.style.overflow = "hidden";
    }
    if (!host.style.isolation) {
      host.style.isolation = "isolate";
    }

    return () => {
      host.style.position = previousPosition;
      host.style.overflow = previousOverflow;
      host.style.isolation = previousIsolation;
    };
  };

  const retainHost = (host: HTMLElement): (() => void) => {
    const existing = managedHosts.get(host);
    if (existing) {
      existing.count += 1;
      return () => {
        const current = managedHosts.get(host);
        if (!current) return;
        current.count -= 1;
        if (current.count <= 0) {
          current.restore();
          managedHosts.delete(host);
        }
      };
    }

    const restore = prepareHostStyles(host);
    managedHosts.set(host, { count: 1, restore });
    return () => {
      const current = managedHosts.get(host);
      if (!current) return;
      current.count -= 1;
      if (current.count <= 0) {
        current.restore();
        managedHosts.delete(host);
      }
    };
  };

  const detachFxRoot = (fxRoot: FxRoot) => {
    fxRoot.root.remove();
    fxRoot.host = null;
    if (fxRoot.releaseHost) {
      fxRoot.releaseHost();
      fxRoot.releaseHost = null;
    }
  };

  const attachFxRoot = (fxRoot: FxRoot, nextHost: HTMLElement | null, before: HTMLElement | null): boolean => {
    if (!nextHost) {
      const hadHost = !!fxRoot.host || fxRoot.root.isConnected;
      detachFxRoot(fxRoot);
      return hadHost;
    }

    if (
      fxRoot.host === nextHost &&
      fxRoot.root.parentElement === nextHost &&
      (!before || fxRoot.root.nextElementSibling === before)
    ) {
      return false;
    }

    detachFxRoot(fxRoot);
    fxRoot.host = nextHost;
    fxRoot.releaseHost = retainHost(nextHost);
    if (before && before.parentElement === nextHost) {
      nextHost.insertBefore(fxRoot.root, before);
    } else {
      nextHost.appendChild(fxRoot.root);
    }
    return true;
  };

  const attachFxRoots = (): boolean => {
    hostSyncFrame = null;
    const nextHosts = resolveSceneHosts();
    const backChanged = attachFxRoot(backFx, nextHosts.backHost, nextHosts.backBefore);
    const frontChanged = attachFxRoot(frontFx, nextHosts.frontHost, nextHosts.frontBefore);
    return backChanged || frontChanged;
  };

  const queueFxRootAttach = () => {
    if (hostSyncFrame !== null) return;
    hostSyncFrame = window.requestAnimationFrame(() => {
      if (attachFxRoots()) {
        updateScene();
      }
    });
  };

  const hostObserver = new MutationObserver(() => {
    if (
      backFx.host?.isConnected &&
      frontFx.host?.isConnected &&
      backFx.root.parentElement === backFx.host &&
      frontFx.root.parentElement === frontFx.host
    ) {
      return;
    }
    queueFxRootAttach();
  });
  hostObserver.observe(document.body, { childList: true, subtree: true });
  cleanups.push(() => {
    if (hostSyncFrame !== null) {
      window.cancelAnimationFrame(hostSyncFrame);
      hostSyncFrame = null;
    }
    hostObserver.disconnect();
    detachFxRoot(backFx);
    detachFxRoot(frontFx);
  });

  let hud: HudElements | null = null;
  let removeHudDragListener: (() => void) | null = null;

  const destroyHud = () => {
    if (removeHudDragListener) {
      removeHudDragListener();
      removeHudDragListener = null;
    }
    if (hud) {
      hud.widget.destroy();
      hud = null;
    }
  };

  const buildHud = (position?: { x: number; y: number } | null) => {
    const nextPosition =
      position ??
      hud?.widget.getPosition() ??
      currentPrefs.widgetPosition ??
      DEFAULT_WIDGET_POSITION;

    destroyHud();
    hud = createHudWidget(ctx, nextPosition, hudExpanded, {
      onToggleDrawer: () => {
        const currentPosition = hud?.widget.getPosition() ?? currentPrefs.widgetPosition ?? DEFAULT_WIDGET_POSITION;
        hudExpanded = !hudExpanded;
        buildHud(currentPosition);
        updateScene();
      },
      onOpenSettings: () => {
        ctx.events.emit("open-settings", { view: "extensions" });
      },
      onLockCurrentScene: () => {
        lockCurrentScene();
      },
      onResumeStory: () => {
        resumeStorySync();
      },
      onApplyPreset: (presetId) => {
        applyPreset(presetId);
      },
      onChangeLayerMode: (mode) => {
        sendToBackend(ctx, { type: "save_prefs", prefs: { layerMode: mode } });
      },
      onChangeIntensity: (intensity) => {
        sendToBackend(ctx, { type: "save_prefs", prefs: { intensity } });
      },
      onTogglePause: () => {
        sendToBackend(ctx, { type: "save_prefs", prefs: { pauseEffects: !currentPrefs.pauseEffects } });
      },
    });
    removeHudDragListener = hud.widget.onDragEnd((nextPositionFromDrag) => {
      sendToBackend(ctx, { type: "save_prefs", prefs: { widgetPosition: nextPositionFromDrag } });
    });
    syncHudState(hud, currentPrefs, currentState, hudExpanded);
  };

  buildHud(currentPrefs.widgetPosition);
  cleanups.push(() => destroyHud());

  let flashTimer: number | null = null;

  const resetFlashTimer = () => {
    if (flashTimer !== null) {
      window.clearTimeout(flashTimer);
      flashTimer = null;
    }
  };

  const scheduleStormFlash = () => {
    resetFlashTimer();
    if (
      currentState.condition !== "storm" ||
      getReducedMotion() ||
      currentPrefs.pauseEffects ||
      !currentPrefs.effectsEnabled
    ) {
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
      }, 220);
      flashTimer = window.setTimeout(trigger, 3600 + Math.random() * 4600);
    };

    flashTimer = window.setTimeout(trigger, 1800 + Math.random() * 2400);
  };

  const updateScene = () => {
    const reducedMotion = getReducedMotion();
    const layerMode = getEffectiveLayerMode(currentPrefs, currentState);
    const showEffects = currentPrefs.effectsEnabled;

    if (hud) {
      syncHudState(hud, currentPrefs, currentState, hudExpanded);
    }
    settingsUI.sync(currentPrefs, currentState);
    applySceneState(backFx, currentState, currentPrefs, reducedMotion);
    applySceneState(frontFx, currentState, currentPrefs, reducedMotion);
    setFxVisibility(backFx, showEffects && !!backFx.host && (layerMode === "back" || layerMode === "both"));
    setFxVisibility(frontFx, showEffects && !!frontFx.host && (layerMode === "front" || layerMode === "both"));
    scheduleStormFlash();
  };

  const clockTimer = window.setInterval(() => {
    if (hud) {
      syncHudState(hud, currentPrefs, currentState, hudExpanded);
    }
  }, 1000);
  cleanups.push(() => window.clearInterval(clockTimer));

  const onMotionChange = () => updateScene();
  motionMedia.addEventListener("change", onMotionChange);
  cleanups.push(() => motionMedia.removeEventListener("change", onMotionChange));

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
        if (hud && currentPrefs.widgetPosition) {
          hud.widget.moveTo(currentPrefs.widgetPosition.x, currentPrefs.widgetPosition.y);
        } else if (hud && !currentPrefs.widgetPosition) {
          hud.widget.moveTo(DEFAULT_WIDGET_POSITION.x, DEFAULT_WIDGET_POSITION.y);
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
    queueFxRootAttach();
    sendToBackend(ctx, { type: "chat_changed", chatId });
  });
  cleanups.push(chatChangedUnsub);

  const settingsChangedUnsub = ctx.events.on("SETTINGS_UPDATED", (payload: unknown) => {
    const nextChatId = readChatIdFromSettingsUpdate(payload);
    if (typeof nextChatId === "undefined") return;
    activeChatId = nextChatId;
    queueFxRootAttach();
    sendToBackend(ctx, { type: "chat_changed", chatId: nextChatId });
  });
  cleanups.push(settingsChangedUnsub);

  sendToBackend(ctx, { type: "frontend_ready" });
  if (activeChatId) {
    sendToBackend(ctx, { type: "chat_changed", chatId: activeChatId });
  }
  queueFxRootAttach();
  updateScene();

  return () => {
    resetFlashTimer();
    for (const cleanup of cleanups.reverse()) cleanup();
  };
}
