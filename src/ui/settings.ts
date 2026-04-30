import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { WEATHER_SCENE_PRESETS, buildPresetWeatherState, matchWeatherScenePreset } from "../presets";
import { WEATHER_CONDITIONS, WEATHER_LAYERS, WEATHER_PALETTES, clamp } from "../shared";
import type {
  ReducedMotionMode,
  WeatherCondition,
  WeatherEffectsQuality,
  WeatherLayerMode,
  WeatherPalette,
  WeatherPrefs,
  WeatherState,
} from "../types";

export interface SettingsCallbacks {
  onSavePrefs(prefs: Partial<WeatherPrefs>): void;
  onSetManualState(state: Partial<WeatherState>): void;
  onApplyPreset(presetId: string): void;
  onClearOverride(): void;
  onClearWeather(): void;
  onResetWidgetPosition(): void;
}

export interface SettingsHandle {
  destroy(): void;
  sync(state: WeatherState | null, prefs: WeatherPrefs): void;
}

const QUALITY_OPTIONS: Array<{ value: WeatherEffectsQuality; label: string }> = [
  { value: "lite", label: "Lite (low draw)" },
  { value: "standard", label: "Standard" },
  { value: "cinematic", label: "Cinematic" },
];

const REDUCED_MOTION_OPTIONS: Array<{ value: ReducedMotionMode; label: string }> = [
  { value: "system", label: "Match OS" },
  { value: "always", label: "Always reduce" },
  { value: "never", label: "Never reduce" },
];

const LAYER_PREF_OPTIONS: Array<{ value: WeatherPrefs["layerMode"]; label: string }> = [
  { value: "auto", label: "Auto (use scene's layer)" },
  { value: "back", label: "Behind chat" },
  { value: "front", label: "In front of chat" },
  { value: "both", label: "Both layers" },
];

export function createSettingsUI(ctx: SpindleFrontendContext, callbacks: SettingsCallbacks): SettingsHandle {
  const mount = ctx.ui.mount("settings_extensions") as HTMLElement;
  const root = document.createElement("div");
  root.className = "sw-settings";
  mount.appendChild(root);

  // ─── Section: Prompt setup
  const promptSection = section("Prompt integration");
  const promptHint = document.createElement("p");
  promptHint.className = "sw-settings__hint";
  promptHint.textContent =
    "Add the macro below to your character or preset system prompt. The model will append a hidden weather tag at the end of each reply.";
  const macroBox = document.createElement("code");
  macroBox.className = "sw-settings__macro";
  macroBox.textContent = "{{weather_tracker}}";
  const aliasHint = document.createElement("p");
  aliasHint.className = "sw-settings__hint";
  aliasHint.textContent =
    "Aliases also accepted: {{story_weather_tracker}}, {{story_weather}}. Reference macros: {{weather_format}}, {{weather_state}}.";
  promptSection.append(promptHint, macroBox, aliasHint);

  // ─── Section: Display preferences
  const prefsSection = section("Display preferences");
  const effectsToggleRow = toggleRow("Effects enabled", (next) => callbacks.onSavePrefs({ effectsEnabled: next }));
  const layerRow = selectRow("Placement", LAYER_PREF_OPTIONS, (value) =>
    callbacks.onSavePrefs({ layerMode: value as WeatherPrefs["layerMode"] }),
  );
  const qualityRow = selectRow("Quality", QUALITY_OPTIONS, (value) =>
    callbacks.onSavePrefs({ qualityMode: value as WeatherEffectsQuality }),
  );
  const motionRow = selectRow("Reduced motion", REDUCED_MOTION_OPTIONS, (value) =>
    callbacks.onSavePrefs({ reducedMotion: value as ReducedMotionMode }),
  );
  const intensityRow = sliderRow("Density", 0.25, 1.5, 0.05, 1, (value) => callbacks.onSavePrefs({ intensity: value }));
  const pauseRow = toggleRow("Pause animation", (next) => callbacks.onSavePrefs({ pauseEffects: next }));
  prefsSection.append(
    effectsToggleRow.row,
    layerRow.row,
    qualityRow.row,
    intensityRow.row,
    motionRow.row,
    pauseRow.row,
  );

  const resetWidget = document.createElement("button");
  resetWidget.type = "button";
  resetWidget.className = "sw-settings__button";
  resetWidget.textContent = "Reset HUD position";
  resetWidget.addEventListener("click", () => callbacks.onResetWidgetPosition());
  const resetWrap = document.createElement("div");
  resetWrap.className = "sw-settings__actions";
  resetWrap.appendChild(resetWidget);
  prefsSection.appendChild(resetWrap);

  // ─── Section: Quick presets
  const presetSection = section("Quick presets");
  const presetGrid = document.createElement("div");
  presetGrid.className = "sw-settings__presets";
  const presetButtons = new Map<string, HTMLButtonElement>();
  for (const preset of WEATHER_SCENE_PRESETS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sw-settings__preset";
    btn.textContent = preset.label;
    btn.title = preset.description;
    btn.addEventListener("click", () => callbacks.onApplyPreset(preset.id));
    presetGrid.appendChild(btn);
    presetButtons.set(preset.id, btn);
  }
  presetSection.appendChild(presetGrid);

  // ─── Section: Manual scene editor
  const manualSection = section("Manual scene editor");
  const grid = document.createElement("div");
  grid.className = "sw-settings__grid";

  const conditionField = selectField(
    "Condition",
    WEATHER_CONDITIONS.map((c) => ({ value: c, label: capitalize(c) })),
  );
  const paletteField = selectField(
    "Palette",
    WEATHER_PALETTES.map((p) => ({ value: p, label: capitalize(p) })),
  );
  const layerField = selectField(
    "Layer",
    WEATHER_LAYERS.map((l) => ({ value: l, label: capitalize(l) })),
  );
  const dateField = textField("Date", "2026-03-24");
  const timeField = textField("Time", "9:42 PM");
  const tempField = textField("Temperature", "61F");
  const windField = textField("Wind", "breezy");
  const summaryField = textField("Summary", "Cold spring rain");
  const intensityField = numberField("Intensity (0–1)", "0.65", 0, 1, 0.05);
  const locationField = textField("Location", "Tengu City");

  grid.append(
    conditionField.field,
    paletteField.field,
    layerField.field,
    dateField.field,
    timeField.field,
    tempField.field,
    windField.field,
    summaryField.field,
    intensityField.field,
    locationField.field,
  );
  manualSection.appendChild(grid);

  const manualActions = document.createElement("div");
  manualActions.className = "sw-settings__actions";
  const applyManual = document.createElement("button");
  applyManual.type = "button";
  applyManual.className = "sw-settings__button sw-settings__button--primary";
  applyManual.textContent = "Apply manual lock";
  applyManual.addEventListener("click", () => {
    const intensity = clamp(parseFloat(intensityField.input.value) || 0, 0, 1);
    callbacks.onSetManualState({
      location: locationField.input.value,
      date: dateField.input.value,
      time: timeField.input.value,
      condition: conditionField.input.value as WeatherCondition,
      palette: paletteField.input.value as WeatherPalette,
      layer: layerField.input.value as WeatherLayerMode,
      summary: summaryField.input.value,
      temperature: tempField.input.value,
      wind: windField.input.value,
      intensity,
    });
  });
  const clearOverride = document.createElement("button");
  clearOverride.type = "button";
  clearOverride.className = "sw-settings__button";
  clearOverride.textContent = "Resume story sync";
  clearOverride.addEventListener("click", () => callbacks.onClearOverride());
  const clearAll = document.createElement("button");
  clearAll.type = "button";
  clearAll.className = "sw-settings__button sw-settings__button--danger";
  clearAll.textContent = "Clear saved scene";
  clearAll.addEventListener("click", () => callbacks.onClearWeather());
  manualActions.append(applyManual, clearOverride, clearAll);
  manualSection.appendChild(manualActions);

  const status = document.createElement("div");
  status.className = "sw-settings__status";
  status.textContent = "No saved scene yet.";
  manualSection.appendChild(status);

  root.append(promptSection, prefsSection, presetSection, manualSection);

  function sync(state: WeatherState | null, prefs: WeatherPrefs): void {
    effectsToggleRow.input.checked = prefs.effectsEnabled;
    layerRow.input.value = prefs.layerMode;
    qualityRow.input.value = prefs.qualityMode;
    motionRow.input.value = prefs.reducedMotion;
    intensityRow.input.value = String(prefs.intensity);
    intensityRow.value.textContent = prefs.intensity.toFixed(2);
    pauseRow.input.checked = prefs.pauseEffects;

    if (state) {
      conditionField.input.value = state.condition;
      paletteField.input.value = state.palette;
      layerField.input.value = state.layer;
      dateField.input.value = state.date;
      timeField.input.value = state.time;
      tempField.input.value = state.temperature;
      windField.input.value = state.wind;
      summaryField.input.value = state.summary;
      intensityField.input.value = state.intensity.toFixed(2);
      locationField.input.value = state.location;

      status.textContent = `Active: ${state.condition} · ${state.palette} · ${state.summary} (${state.source === "manual" ? "manual lock" : "story sync"})`;
    } else {
      status.textContent = "No saved scene yet.";
    }

    const matched = matchWeatherScenePreset(state);
    for (const [id, btn] of presetButtons) {
      btn.setAttribute("aria-pressed", id === matched ? "true" : "false");
    }
  }

  return {
    destroy() {
      root.remove();
    },
    sync,
  };

  // ─── helpers ───
  function section(title: string): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = "sw-settings__section";
    const h = document.createElement("h3");
    h.className = "sw-settings__title";
    h.textContent = title;
    wrap.appendChild(h);
    return wrap;
  }

  function toggleRow(label: string, onChange: (next: boolean) => void) {
    const row = document.createElement("label");
    row.className = "sw-settings__row";
    const span = document.createElement("span");
    span.textContent = label;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.addEventListener("change", () => onChange(input.checked));
    row.append(span, input);
    return { row, input };
  }

  function selectRow<T extends string>(
    label: string,
    options: Array<{ value: T; label: string }>,
    onChange: (value: T) => void,
  ) {
    const row = document.createElement("div");
    row.className = "sw-settings__row";
    const span = document.createElement("label");
    span.textContent = label;
    const input = document.createElement("select");
    for (const opt of options) {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      input.appendChild(o);
    }
    input.addEventListener("change", () => onChange(input.value as T));
    row.append(span, input);
    return { row, input };
  }

  function sliderRow(
    label: string,
    min: number,
    max: number,
    step: number,
    initial: number,
    onChange: (value: number) => void,
  ) {
    const row = document.createElement("div");
    row.className = "sw-settings__row";
    const span = document.createElement("label");
    span.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initial);
    const value = document.createElement("span");
    value.style.minWidth = "32px";
    value.style.textAlign = "right";
    value.textContent = initial.toFixed(2);
    input.addEventListener("input", () => {
      const v = parseFloat(input.value);
      value.textContent = v.toFixed(2);
      onChange(v);
    });
    row.append(span, input, value);
    return { row, input, value };
  }

  function textField(label: string, placeholder = "") {
    const field = document.createElement("div");
    field.className = "sw-settings__field";
    const lbl = document.createElement("label");
    lbl.textContent = label;
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    field.append(lbl, input);
    return { field, input };
  }

  function numberField(label: string, defaultValue: string, min: number, max: number, step: number) {
    const field = document.createElement("div");
    field.className = "sw-settings__field";
    const lbl = document.createElement("label");
    lbl.textContent = label;
    const input = document.createElement("input");
    input.type = "number";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = defaultValue;
    field.append(lbl, input);
    return { field, input };
  }

  function selectField<T extends string>(label: string, options: Array<{ value: T; label: string }>) {
    const field = document.createElement("div");
    field.className = "sw-settings__field";
    const lbl = document.createElement("label");
    lbl.textContent = label;
    const input = document.createElement("select");
    for (const opt of options) {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      input.appendChild(o);
    }
    field.append(lbl, input);
    return { field, input };
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Re-export to satisfy backward consumers.
export { buildPresetWeatherState };
