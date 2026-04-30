import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { WEATHER_SCENE_PRESETS, matchWeatherScenePreset } from "../presets";
import { clamp, parseHourFromTimeString } from "../shared";
import type { WeatherCondition, WeatherEffectsQuality, WeatherPrefs, WeatherSourceMode, WeatherState } from "../types";

const COLLAPSED_HEIGHT = 168;
const EXPANDED_HEIGHT = 524;
const WIDGET_WIDTH = 296;

const QUALITY_OPTIONS: Array<{ value: WeatherEffectsQuality; label: string }> = [
  { value: "lite", label: "Lite" },
  { value: "standard", label: "Standard" },
  { value: "cinematic", label: "Cinematic" },
];

const LAYER_OPTIONS: Array<{ value: WeatherPrefs["layerMode"]; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "back", label: "Behind" },
  { value: "front", label: "In front" },
  { value: "both", label: "Both" },
];

const ICON: Record<WeatherCondition, string> = {
  clear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>`,
  cloudy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 1-7.86A6 6 0 0 0 6.5 9.6 4 4 0 0 0 7 18z"/></svg>`,
  rain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15h10a4 4 0 0 0 1-7.86A6 6 0 0 0 6.5 6.6 4 4 0 0 0 7 15z"/><path d="M9 19l-1 2M13 19l-1 2M17 19l-1 2"/></svg>`,
  storm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 14h10a4 4 0 0 0 1-7.86A6 6 0 0 0 6.5 5.6 4 4 0 0 0 7 14z"/><path d="m12 14-2 4h3l-1.5 4"/></svg>`,
  snow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/></svg>`,
  fog: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 9h16M4 13h16M4 17h12M8 5h12"/></svg>`,
};

const GEAR = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98a7.79 7.79 0 0 0 0-1.96l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.88 7.88 0 0 0-1.69-.98l-.36-2.54a.5.5 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.6.24-1.16.56-1.69.98l-2.39-.96a.5.5 0 0 0-.6.22L2.43 8.8a.5.5 0 0 0 .12.64l2.03 1.58a7.79 7.79 0 0 0 0 1.96L2.55 14.56a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.53.42 1.09.74 1.69.98l.36 2.54a.5.5 0 0 0 .49.42h3.84a.5.5 0 0 0 .49-.42l.36-2.54c.6-.24 1.16-.56 1.69-.98l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"/></svg>`;
const CHEVRON_UP = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="m7.41 15.41 4.59-4.58 4.59 4.58L18 14l-6-6-6 6z"/></svg>`;
const CHEVRON_DOWN = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`;

export interface HudCallbacks {
  onToggleDrawer(): void;
  onOpenSettings(): void;
  onLockCurrentScene(): void;
  onResumeStory(): void;
  onClearScene(): void;
  onApplyPreset(presetId: string): void;
  onChangeLayerMode(mode: WeatherPrefs["layerMode"]): void;
  onChangeIntensity(intensity: number): void;
  onChangeQuality(quality: WeatherEffectsQuality): void;
  onTogglePause(): void;
}

export interface HudHandle {
  setVisible(visible: boolean): void;
  destroy(): void;
  sync(state: WeatherState | null, prefs: WeatherPrefs, expanded: boolean, sourceMode: WeatherSourceMode): void;
}

export function createHud(ctx: SpindleFrontendContext, prefs: WeatherPrefs, callbacks: HudCallbacks): HudHandle {
  const widget = ctx.ui.createFloatWidget({
    width: WIDGET_WIDTH,
    height: COLLAPSED_HEIGHT,
    initialPosition: prefs.widgetPosition ?? { x: 24, y: 96 },
    chromeless: true,
    snapToEdge: false,
    tooltip: "Story Weather",
  });

  const root = document.createElement("div");
  root.className = "sw-hud";
  widget.root.appendChild(root);

  // Header
  const header = document.createElement("div");
  header.className = "sw-hud__header";
  const headerLeft = document.createElement("div");
  const location = document.createElement("div");
  location.className = "sw-hud__location";
  location.textContent = "Story setting";
  headerLeft.appendChild(location);
  const icon = document.createElement("div");
  icon.className = "sw-hud__icon";
  icon.innerHTML = ICON.clear;
  header.append(headerLeft, icon);
  root.appendChild(header);

  // Body
  const body = document.createElement("div");
  body.className = "sw-hud__body";
  const time = document.createElement("div");
  time.className = "sw-hud__time";
  time.textContent = "12:00 PM";
  const date = document.createElement("div");
  date.className = "sw-hud__date";
  date.textContent = "—";
  body.append(time, date);
  root.appendChild(body);

  // Summary row (chips + summary)
  const summaryRow = document.createElement("div");
  summaryRow.className = "sw-hud__row sw-hud__row--summary";
  const summary = document.createElement("div");
  summary.className = "sw-hud__summary";
  summary.textContent = "Calm skies";
  const tempChip = document.createElement("span");
  tempChip.className = "sw-hud__chip sw-hud__chip--temp";
  tempChip.textContent = "—";
  const sourceChip = document.createElement("span");
  sourceChip.className = "sw-hud__chip sw-hud__chip--source";
  sourceChip.dataset.source = "story";
  sourceChip.textContent = "Story";
  summaryRow.append(summary, tempChip, sourceChip);
  root.appendChild(summaryRow);

  // Footer
  const footer = document.createElement("div");
  footer.className = "sw-hud__footer";
  const drawerBtn = document.createElement("button");
  drawerBtn.type = "button";
  drawerBtn.title = "Toggle controls";
  const drawerIcon = document.createElement("span");
  drawerIcon.innerHTML = CHEVRON_UP;
  const drawerLabel = document.createElement("span");
  drawerLabel.textContent = "Controls";
  drawerBtn.append(drawerLabel, drawerIcon);
  drawerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    callbacks.onToggleDrawer();
  });
  const settingsBtn = document.createElement("button");
  settingsBtn.type = "button";
  settingsBtn.title = "Open settings";
  settingsBtn.innerHTML = GEAR + "<span>Settings</span>";
  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    callbacks.onOpenSettings();
  });
  footer.append(drawerBtn, settingsBtn);
  root.appendChild(footer);

  // Drawer (expanded controls)
  const drawer = document.createElement("div");
  drawer.className = "sw-hud__drawer";

  // Mode toggle
  const modeLabel = document.createElement("div");
  modeLabel.className = "sw-hud__section-label";
  modeLabel.textContent = "Mode";
  const modeToggle = document.createElement("div");
  modeToggle.className = "sw-hud__mode";
  const storyBtn = document.createElement("button");
  storyBtn.type = "button";
  storyBtn.textContent = "Story sync";
  storyBtn.dataset.mode = "story";
  storyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    callbacks.onResumeStory();
  });
  const manualBtn = document.createElement("button");
  manualBtn.type = "button";
  manualBtn.textContent = "Manual lock";
  manualBtn.dataset.mode = "manual";
  manualBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    callbacks.onLockCurrentScene();
  });
  modeToggle.append(storyBtn, manualBtn);

  // Presets
  const presetsLabel = document.createElement("div");
  presetsLabel.className = "sw-hud__section-label";
  presetsLabel.textContent = "Quick presets";
  const presetGrid = document.createElement("div");
  presetGrid.className = "sw-hud__presets";
  const presetButtons = new Map<string, HTMLButtonElement>();
  for (const preset of WEATHER_SCENE_PRESETS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sw-hud__preset";
    btn.textContent = preset.shortLabel;
    btn.title = preset.description;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      callbacks.onApplyPreset(preset.id);
    });
    presetGrid.appendChild(btn);
    presetButtons.set(preset.id, btn);
  }

  // Controls
  const controlsLabel = document.createElement("div");
  controlsLabel.className = "sw-hud__section-label";
  controlsLabel.textContent = "Scene";
  const layerControl = document.createElement("div");
  layerControl.className = "sw-hud__control";
  const layerLabel = document.createElement("label");
  layerLabel.textContent = "Layer";
  const layerSelect = document.createElement("select");
  for (const opt of LAYER_OPTIONS) {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    layerSelect.appendChild(o);
  }
  layerSelect.addEventListener("change", (e) => {
    e.stopPropagation();
    callbacks.onChangeLayerMode(layerSelect.value as WeatherPrefs["layerMode"]);
  });
  const layerSpacer = document.createElement("span");
  layerControl.append(layerLabel, layerSelect, layerSpacer);

  const intensityControl = document.createElement("div");
  intensityControl.className = "sw-hud__control";
  const intensityLabel = document.createElement("label");
  intensityLabel.textContent = "Density";
  const intensitySlider = document.createElement("input");
  intensitySlider.type = "range";
  intensitySlider.min = "0.25";
  intensitySlider.max = "1.5";
  intensitySlider.step = "0.05";
  intensitySlider.value = "1";
  const intensityValue = document.createElement("span");
  intensityValue.className = "sw-hud__control-value";
  intensityValue.textContent = "1.00";
  intensitySlider.addEventListener("input", (e) => {
    e.stopPropagation();
    const v = clamp(Number.parseFloat(intensitySlider.value), 0.25, 1.5);
    intensityValue.textContent = v.toFixed(2);
    callbacks.onChangeIntensity(v);
  });
  intensityControl.append(intensityLabel, intensitySlider, intensityValue);

  const qualityControl = document.createElement("div");
  qualityControl.className = "sw-hud__control";
  const qualityLabel = document.createElement("label");
  qualityLabel.textContent = "Quality";
  const qualitySelect = document.createElement("select");
  for (const opt of QUALITY_OPTIONS) {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    qualitySelect.appendChild(o);
  }
  qualitySelect.addEventListener("change", (e) => {
    e.stopPropagation();
    callbacks.onChangeQuality(qualitySelect.value as WeatherEffectsQuality);
  });
  const qualitySpacer = document.createElement("span");
  qualityControl.append(qualityLabel, qualitySelect, qualitySpacer);

  // Action row
  const actions = document.createElement("div");
  actions.className = "sw-hud__action-row";
  const pauseBtn = document.createElement("button");
  pauseBtn.type = "button";
  pauseBtn.className = "sw-hud__action";
  pauseBtn.textContent = "Pause";
  pauseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    callbacks.onTogglePause();
  });
  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "sw-hud__action sw-hud__action--danger";
  clearBtn.textContent = "Clear scene";
  clearBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    callbacks.onClearScene();
  });
  actions.append(pauseBtn, clearBtn);

  drawer.append(modeLabel, modeToggle, presetsLabel, presetGrid, controlsLabel, layerControl, intensityControl, qualityControl, actions);
  root.appendChild(drawer);

  // Block child clicks from causing drag start (header itself is the drag handle).
  for (const region of [body, summaryRow, footer, drawer]) {
    region.addEventListener("pointerdown", (e) => e.stopPropagation());
  }

  let liveClockTimer: number | null = null;
  let liveDateTracked: Date | null = null;

  function startLiveClock(state: WeatherState) {
    stopLiveClock();
    liveDateTracked = new Date();
    const update = () => {
      const now = new Date();
      const hours = now.getHours();
      const mins = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      time.textContent = `${h12}:${String(mins).padStart(2, "0")} ${ampm}`;
      date.textContent = state.date;
      liveDateTracked = now;
    };
    update();
    liveClockTimer = window.setInterval(update, 30000);
  }

  function stopLiveClock() {
    if (liveClockTimer !== null) {
      window.clearInterval(liveClockTimer);
      liveClockTimer = null;
    }
    liveDateTracked = null;
  }

  function sync(state: WeatherState | null, prefsIn: WeatherPrefs, expanded: boolean, sourceMode: WeatherSourceMode): void {
    if (expanded) root.classList.add("sw-hud--expanded");
    else root.classList.remove("sw-hud--expanded");
    drawerIcon.innerHTML = expanded ? CHEVRON_DOWN : CHEVRON_UP;

    const targetH = expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
    if (widget.root.offsetHeight !== targetH) {
      widget.root.style.height = `${targetH}px`;
    }

    if (!state) {
      stopLiveClock();
      location.textContent = "Story setting";
      time.textContent = "—";
      date.textContent = "—";
      summary.textContent = "Waiting for scene…";
      tempChip.textContent = "—";
      icon.innerHTML = ICON.clear;
      sourceChip.textContent = "—";
      sourceChip.dataset.source = "story";
    } else {
      location.textContent = state.location || "Story setting";
      summary.textContent = state.summary || "—";
      tempChip.textContent = state.temperature || "—";
      icon.innerHTML = ICON[state.condition] ?? ICON.clear;
      sourceChip.textContent = state.source === "manual" ? "Manual" : "Story";
      sourceChip.dataset.source = state.source;
      if (sourceMode === "manual") {
        startLiveClock(state);
      } else {
        stopLiveClock();
        time.textContent = state.time || "—";
        date.textContent = state.date || "—";
      }
    }

    storyBtn.setAttribute("aria-pressed", sourceMode === "story" ? "true" : "false");
    manualBtn.setAttribute("aria-pressed", sourceMode === "manual" ? "true" : "false");

    layerSelect.value = prefsIn.layerMode;
    intensitySlider.value = String(prefsIn.intensity);
    intensityValue.textContent = prefsIn.intensity.toFixed(2);
    qualitySelect.value = prefsIn.qualityMode;
    pauseBtn.textContent = prefsIn.pauseEffects ? "Resume" : "Pause";

    const matchedPresetId = matchWeatherScenePreset(state);
    for (const [presetId, btn] of presetButtons) {
      btn.setAttribute("aria-pressed", matchedPresetId === presetId ? "true" : "false");
    }
  }

  widget.onDragEnd((pos) => {
    callbacks.onChangeIntensity; // suppress unused
    void pos;
  });

  return {
    setVisible(visible: boolean) {
      widget.setVisible(visible);
    },
    destroy() {
      stopLiveClock();
      widget.destroy();
    },
    sync,
  };
}

// Suppress unused warnings for re-exports we may need later.
export { parseHourFromTimeString };
