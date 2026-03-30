import { buildPresetWeatherState, matchWeatherScenePreset, WEATHER_SCENE_PRESETS } from "../presets";
import type { WeatherCondition, WeatherEffectsQuality, WeatherPalette, WeatherPrefs, WeatherState } from "../types";

const CONDITIONS: WeatherCondition[] = ["clear", "cloudy", "rain", "storm", "snow", "fog"];
const PALETTES: WeatherPalette[] = ["dawn", "day", "dusk", "night", "storm", "mist", "snow"];
const QUALITY_MODES: Array<{ value: WeatherEffectsQuality; label: string }> = [
  { value: "performance", label: "Performance" },
  { value: "lite", label: "Lite" },
  { value: "standard", label: "Standard" },
  { value: "cinematic", label: "Cinematic (Heavy)" },
];

export interface SettingsUI {
  root: HTMLElement;
  sync(prefs: WeatherPrefs, state: WeatherState | null): void;
  destroy(): void;
}

function createCodeBlock(text: string): HTMLPreElement {
  const code = document.createElement("pre");
  code.className = "weather-settings-code";
  code.textContent = text;
  return code;
}

function createLabeledInput(labelText: string, input: HTMLElement): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "weather-settings-label";
  label.textContent = labelText;
  label.appendChild(input);
  return label;
}

function createSection(titleText: string, copyText?: string) {
  const section = document.createElement("section");
  section.className = "weather-settings-section";

  const header = document.createElement("div");
  header.className = "weather-settings-section-header";

  const title = document.createElement("strong");
  title.className = "weather-settings-section-title";
  title.textContent = titleText;
  header.appendChild(title);

  if (copyText) {
    const copy = document.createElement("p");
    copy.className = "weather-settings-section-copy";
    copy.textContent = copyText;
    header.appendChild(copy);
  }

  const body = document.createElement("div");
  body.className = "weather-settings-section-body";

  section.appendChild(header);
  section.appendChild(body);

  return { section, body };
}

function applyStateToInputs(
  state: Partial<WeatherState>,
  fields: {
    conditionSelect: HTMLSelectElement;
    paletteSelect: HTMLSelectElement;
    locationInput: HTMLInputElement;
    dateInput: HTMLInputElement;
    timeInput: HTMLInputElement;
    temperatureInput: HTMLInputElement;
    windInput: HTMLInputElement;
    summaryInput: HTMLInputElement;
    sceneLayerSelect: HTMLSelectElement;
    sceneIntensity: HTMLInputElement;
    sceneIntensityValue: HTMLSpanElement;
  },
): void {
  if (state.condition) fields.conditionSelect.value = state.condition;
  if (state.palette) fields.paletteSelect.value = state.palette;
  if (state.location) fields.locationInput.value = state.location;
  if (state.date && /^\d{4}-\d{2}-\d{2}$/.test(state.date)) fields.dateInput.value = state.date;
  if (state.time) fields.timeInput.value = state.time;
  if (state.temperature) fields.temperatureInput.value = state.temperature;
  if (state.wind) fields.windInput.value = state.wind;
  if (state.summary) fields.summaryInput.value = state.summary;
  if (state.layer) fields.sceneLayerSelect.value = state.layer;
  if (typeof state.intensity === "number" && Number.isFinite(state.intensity)) {
    fields.sceneIntensity.value = state.intensity.toFixed(2);
    fields.sceneIntensityValue.textContent = `${Math.round(state.intensity * 100)}%`;
  }
}

export function createSettingsUI(sendToBackend: (payload: unknown) => void): SettingsUI {
  const root = document.createElement("section");
  root.className = "weather-settings-card";

  const header = document.createElement("header");
  header.className = "weather-settings-card-header";

  const title = document.createElement("h3");
  title.textContent = "Story Weather HUD";

  const status = document.createElement("span");
  status.className = "weather-settings-status";

  header.appendChild(title);
  header.appendChild(status);

  const body = document.createElement("div");
  body.className = "weather-settings-card-body";

  const preview = document.createElement("div");
  preview.className = "weather-settings-preview";

  const promptSection = createSection(
    "Prompt integration",
    "To make the main model emit the hidden weather tag consistently, add the recommended macro to your system prompt or preset, just like simtracker uses {{sim_tracker}}.",
  );
  const effectsSection = createSection("Effects", "Overall ambience, density, and motion.");
  const placementSection = createSection("Placement", "Control whether the weather stays behind the chat, in front, or both.");
  const motionSection = createSection(
    "Motion",
  "Fine-tune motion budgets and pacing. Cinematic intentionally pushes the heaviest cloud, contact, precipitation, and glass interaction layers.",
  );

  const promptRecommended = document.createElement("div");
  promptRecommended.className = "weather-settings-copy-group";

  const promptRecommendedLabel = document.createElement("strong");
  promptRecommendedLabel.className = "weather-settings-copy-title";
  promptRecommendedLabel.textContent = "Recommended prompt snippet";

  const promptRecommendedCopy = document.createElement("p");
  promptRecommendedCopy.className = "weather-settings-section-copy";
  promptRecommendedCopy.textContent = "Place this directly in the active character or preset system prompt so the main model sees the weather instruction during generation.";

  promptRecommended.appendChild(promptRecommendedLabel);
  promptRecommended.appendChild(promptRecommendedCopy);
  promptRecommended.appendChild(createCodeBlock("{{weather_tracker}}"));

  const promptOptional = document.createElement("div");
  promptOptional.className = "weather-settings-copy-group";

  const promptOptionalLabel = document.createElement("strong");
  promptOptionalLabel.className = "weather-settings-copy-title";
  promptOptionalLabel.textContent = "Optional reference macros";

  const promptOptionalCopy = document.createElement("p");
  promptOptionalCopy.className = "weather-settings-section-copy";
  promptOptionalCopy.textContent = "Use these only if you want to expose the current scene summary or the raw tag example elsewhere in the prompt.";

  promptOptional.appendChild(promptOptionalLabel);
  promptOptional.appendChild(promptOptionalCopy);
  promptOptional.appendChild(createCodeBlock("{{weather_state}}\n{{weather_format}}"));

  promptSection.body.appendChild(promptRecommended);
  promptSection.body.appendChild(promptOptional);

  const effectsLabel = document.createElement("label");
  effectsLabel.className = "weather-settings-label";
  effectsLabel.textContent = "Animated effects";

  const effectsToggle = document.createElement("input");
  effectsToggle.type = "checkbox";
  effectsToggle.className = "weather-settings-checkbox";
  effectsToggle.addEventListener("change", () => {
    sendToBackend({ type: "save_prefs", prefs: { effectsEnabled: effectsToggle.checked } });
  });
  effectsLabel.appendChild(effectsToggle);

  const layerLabel = document.createElement("label");
  layerLabel.className = "weather-settings-label";
  layerLabel.textContent = "Effect placement";

  const layerSelect = document.createElement("select");
  layerSelect.className = "weather-settings-select";
  layerSelect.innerHTML = `
    <option value="auto">Follow story layer</option>
    <option value="back">Back only</option>
    <option value="front">Front only</option>
    <option value="both">Front and back</option>
  `;
  layerSelect.addEventListener("change", () => {
    sendToBackend({ type: "save_prefs", prefs: { layerMode: layerSelect.value } });
  });
  layerLabel.appendChild(layerSelect);

  const intensityLabel = document.createElement("label");
  intensityLabel.className = "weather-settings-label";
  intensityLabel.textContent = "Animation intensity";

  const intensityRow = document.createElement("div");
  intensityRow.className = "weather-settings-row";

  const intensitySlider = document.createElement("input");
  intensitySlider.type = "range";
  intensitySlider.className = "weather-settings-range";
  intensitySlider.min = "0.25";
  intensitySlider.max = "1.50";
  intensitySlider.step = "0.05";

  const intensityValue = document.createElement("span");
  intensityValue.className = "weather-settings-value";

  intensitySlider.addEventListener("input", () => {
    intensityValue.textContent = `${Math.round(Number.parseFloat(intensitySlider.value) * 100)}%`;
    sendToBackend({ type: "save_prefs", prefs: { intensity: Number.parseFloat(intensitySlider.value) } });
  });

  intensityRow.appendChild(intensitySlider);
  intensityRow.appendChild(intensityValue);
  intensityLabel.appendChild(intensityRow);

  const qualityLabel = document.createElement("label");
  qualityLabel.className = "weather-settings-label";
  qualityLabel.textContent = "Effects quality";

  const qualitySelect = document.createElement("select");
  qualitySelect.className = "weather-settings-select";
  qualitySelect.innerHTML = QUALITY_MODES.map((mode) => `<option value="${mode.value}">${mode.label}</option>`).join("");
  qualitySelect.addEventListener("change", () => {
    sendToBackend({ type: "save_prefs", prefs: { qualityMode: qualitySelect.value } });
  });
  qualityLabel.appendChild(qualitySelect);

  const qualityHint = document.createElement("p");
  qualityHint.className = "weather-settings-section-copy";
  qualityHint.textContent =
    "Performance and Lite cut scene depth, world-contact passes, and particle counts. Cinematic unlocks the richest framing, environmental interaction, pane moisture, and full weather budget for stronger devices.";

  const motionLabel = document.createElement("label");
  motionLabel.className = "weather-settings-label";
  motionLabel.textContent = "Reduced motion";

  const motionSelect = document.createElement("select");
  motionSelect.className = "weather-settings-select";
  motionSelect.innerHTML = `
    <option value="never">Always animate</option>
    <option value="system">Follow system setting</option>
    <option value="always">Always reduce motion</option>
  `;
  motionSelect.addEventListener("change", () => {
    sendToBackend({ type: "save_prefs", prefs: { reducedMotion: motionSelect.value } });
  });
  motionLabel.appendChild(motionSelect);

  const pauseLabel = document.createElement("label");
  pauseLabel.className = "weather-settings-label";
  pauseLabel.textContent = "Pause motion";

  const pauseToggle = document.createElement("input");
  pauseToggle.type = "checkbox";
  pauseToggle.className = "weather-settings-checkbox";
  pauseToggle.addEventListener("change", () => {
    sendToBackend({ type: "save_prefs", prefs: { pauseEffects: pauseToggle.checked } });
  });
  pauseLabel.appendChild(pauseToggle);

  effectsSection.body.appendChild(effectsLabel);
  placementSection.body.appendChild(layerLabel);
  motionSection.body.appendChild(intensityLabel);
  motionSection.body.appendChild(qualityLabel);
  motionSection.body.appendChild(qualityHint);
  motionSection.body.appendChild(motionLabel);
  motionSection.body.appendChild(pauseLabel);

  const manualCard = document.createElement("section");
  manualCard.className = "weather-settings-manual-card";

  const manualHeader = document.createElement("div");
  manualHeader.className = "weather-settings-manual-header";

  const manualTitleWrap = document.createElement("div");
  manualTitleWrap.className = "weather-settings-manual-titlewrap";

  const manualEyebrow = document.createElement("span");
  manualEyebrow.className = "weather-settings-section-title";
  manualEyebrow.textContent = "Manual scene";

  const manualTitle = document.createElement("strong");
  manualTitle.textContent = "Lock the current chat to a custom weather scene";

  manualTitleWrap.appendChild(manualEyebrow);
  manualTitleWrap.appendChild(manualTitle);

  const manualModePill = document.createElement("span");
  manualModePill.className = "weather-settings-status-pill";

  manualHeader.appendChild(manualTitleWrap);
  manualHeader.appendChild(manualModePill);

  const manualHint = document.createElement("p");
  manualHint.className = "weather-settings-manual-hint";
  manualHint.textContent = "Quick presets apply immediately. The full editor below lets you refine the current scene and keep it locked until you resume story sync.";

  const manualToggle = document.createElement("input");
  manualToggle.type = "checkbox";
  manualToggle.className = "weather-settings-checkbox";
  const manualToggleLabel = createLabeledInput("Manual override", manualToggle);

  const presetGrid = document.createElement("div");
  presetGrid.className = "weather-settings-preset-grid";
  const presetButtons = new Map<string, HTMLButtonElement>();

  const conditionSelect = document.createElement("select");
  conditionSelect.className = "weather-settings-select";
  conditionSelect.innerHTML = CONDITIONS.map((condition) => `<option value="${condition}">${condition}</option>`).join("");

  const paletteSelect = document.createElement("select");
  paletteSelect.className = "weather-settings-select";
  paletteSelect.innerHTML = PALETTES.map((palette) => `<option value="${palette}">${palette}</option>`).join("");

  const sceneLayerSelect = document.createElement("select");
  sceneLayerSelect.className = "weather-settings-select";
  sceneLayerSelect.innerHTML = `
    <option value="back">Back</option>
    <option value="front">Front</option>
    <option value="both">Both</option>
  `;

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "weather-settings-input";

  const locationInput = document.createElement("input");
  locationInput.type = "text";
  locationInput.className = "weather-settings-input";
  locationInput.placeholder = "Tengu City";

  const timeInput = document.createElement("input");
  timeInput.type = "text";
  timeInput.className = "weather-settings-input";
  timeInput.placeholder = "9:42 PM";

  const temperatureInput = document.createElement("input");
  temperatureInput.type = "text";
  temperatureInput.className = "weather-settings-input";
  temperatureInput.placeholder = "61F";

  const windInput = document.createElement("input");
  windInput.type = "text";
  windInput.className = "weather-settings-input";
  windInput.placeholder = "breezy";

  const summaryInput = document.createElement("input");
  summaryInput.type = "text";
  summaryInput.className = "weather-settings-input";
  summaryInput.placeholder = "Cold spring rain";

  const sceneIntensityRow = document.createElement("div");
  sceneIntensityRow.className = "weather-settings-row";
  const sceneIntensity = document.createElement("input");
  sceneIntensity.type = "range";
  sceneIntensity.className = "weather-settings-range";
  sceneIntensity.min = "0.00";
  sceneIntensity.max = "1.00";
  sceneIntensity.step = "0.05";
  const sceneIntensityValue = document.createElement("span");
  sceneIntensityValue.className = "weather-settings-value";
  sceneIntensity.addEventListener("input", () => {
    sceneIntensityValue.textContent = `${Math.round(Number.parseFloat(sceneIntensity.value) * 100)}%`;
  });
  sceneIntensityRow.appendChild(sceneIntensity);
  sceneIntensityRow.appendChild(sceneIntensityValue);

  const fields = {
    conditionSelect,
    paletteSelect,
    locationInput,
    dateInput,
    timeInput,
    temperatureInput,
    windInput,
    summaryInput,
    sceneLayerSelect,
    sceneIntensity,
    sceneIntensityValue,
  };

  let currentState: WeatherState | null = null;

  const buildManualState = (): Partial<WeatherState> => ({
    location: locationInput.value.trim() || currentState?.location,
    date: dateInput.value || currentState?.date,
    time: timeInput.value.trim() || currentState?.time,
    condition: conditionSelect.value as WeatherCondition,
    summary: summaryInput.value.trim() || currentState?.summary,
    temperature: temperatureInput.value.trim() || currentState?.temperature,
    wind: windInput.value.trim() || currentState?.wind,
    layer: sceneLayerSelect.value as WeatherState["layer"],
    palette: paletteSelect.value as WeatherPalette,
    intensity: Number.parseFloat(sceneIntensity.value),
    source: "manual",
  });

  const updatePresetSelection = (state: WeatherState | null) => {
    const activePresetId = matchWeatherScenePreset(state);
    for (const [presetId, button] of presetButtons) {
      button.classList.toggle("weather-settings-preset-active", presetId === activePresetId);
    }
  };

  const applyManualState = (state?: Partial<WeatherState>) => {
    sendToBackend({ type: "set_manual_state", state: state ?? buildManualState() });
  };

  for (const preset of WEATHER_SCENE_PRESETS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "weather-settings-preset";
    button.innerHTML = `
      <span class="weather-settings-preset-label">${preset.label}</span>
      <span class="weather-settings-preset-copy">${preset.description}</span>
    `;
    button.addEventListener("click", () => {
      const nextState = buildPresetWeatherState(preset.id, currentState);
      if (!nextState) return;
      manualToggle.checked = true;
      applyStateToInputs(nextState, fields);
      applyManualState(nextState);
    });
    presetButtons.set(preset.id, button);
    presetGrid.appendChild(button);
  }

  manualToggle.addEventListener("change", () => {
    if (manualToggle.checked) {
      applyManualState();
    } else {
      sendToBackend({ type: "clear_manual_override" });
    }
  });

  const manualGrid = document.createElement("div");
  manualGrid.className = "weather-settings-manual-grid";
  manualGrid.appendChild(createLabeledInput("Condition", conditionSelect));
  manualGrid.appendChild(createLabeledInput("Palette", paletteSelect));
  manualGrid.appendChild(createLabeledInput("Location", locationInput));
  manualGrid.appendChild(createLabeledInput("Story date", dateInput));
  manualGrid.appendChild(createLabeledInput("Story time", timeInput));
  manualGrid.appendChild(createLabeledInput("Temperature", temperatureInput));
  manualGrid.appendChild(createLabeledInput("Wind", windInput));
  manualGrid.appendChild(createLabeledInput("Scene layer", sceneLayerSelect));
  manualGrid.appendChild(createLabeledInput("Summary", summaryInput));

  const sceneIntensityLabel = createLabeledInput("Scene intensity", sceneIntensityRow);

  const manualActions = document.createElement("div");
  manualActions.className = "weather-settings-actions";

  const applyButton = document.createElement("button");
  applyButton.className = "weather-settings-button weather-settings-button-primary";
  applyButton.textContent = "Apply manual weather";
  applyButton.addEventListener("click", () => {
    manualToggle.checked = true;
    applyManualState();
  });

  const resumeButton = document.createElement("button");
  resumeButton.className = "weather-settings-button";
  resumeButton.textContent = "Resume story sync";
  resumeButton.addEventListener("click", () => {
    manualToggle.checked = false;
    sendToBackend({ type: "clear_manual_override" });
  });

  const clearSceneButton = document.createElement("button");
  clearSceneButton.className = "weather-settings-button weather-settings-button-danger weather-settings-button-wide";
  clearSceneButton.textContent = "Clear saved weather";
  clearSceneButton.addEventListener("click", () => {
    if (!window.confirm("Clear the saved weather state for this chat? This removes both story sync data and any manual lock.")) {
      return;
    }
    manualToggle.checked = false;
    sendToBackend({ type: "clear_weather_state" });
  });

  manualActions.appendChild(applyButton);
  manualActions.appendChild(resumeButton);
  manualActions.appendChild(clearSceneButton);

  const storageHint = document.createElement("p");
  storageHint.className = "weather-settings-manual-hint weather-settings-storage-hint";
  storageHint.textContent =
    "Use clear saved weather if a tagged assistant message was deleted and you want the extension to forget the current scene for this chat.";

  manualCard.appendChild(manualHeader);
  manualCard.appendChild(manualHint);
  manualCard.appendChild(manualToggleLabel);
  manualCard.appendChild(presetGrid);
  manualCard.appendChild(manualGrid);
  manualCard.appendChild(sceneIntensityLabel);
  manualCard.appendChild(manualActions);
  manualCard.appendChild(storageHint);

  const resetButton = document.createElement("button");
  resetButton.className = "weather-settings-button";
  resetButton.textContent = "Reset HUD position";
  resetButton.addEventListener("click", () => {
    sendToBackend({ type: "reset_widget_position" });
  });

  body.appendChild(preview);
  body.appendChild(promptSection.section);
  body.appendChild(effectsSection.section);
  body.appendChild(placementSection.section);
  body.appendChild(motionSection.section);
  body.appendChild(manualCard);
  body.appendChild(resetButton);

  root.appendChild(header);
  root.appendChild(body);

  return {
    root,
    sync(prefs, state) {
      currentState = state;
      effectsToggle.checked = prefs.effectsEnabled;
      layerSelect.value = prefs.layerMode;
      intensitySlider.value = String(prefs.intensity.toFixed(2));
      intensityValue.textContent = `${Math.round(prefs.intensity * 100)}%`;
      qualitySelect.value = prefs.qualityMode;
      motionSelect.value = prefs.reducedMotion;
      pauseToggle.checked = prefs.pauseEffects;

      status.textContent = state
        ? `${state.source === "manual" ? "manual" : "story"} / ${state.condition} ${state.temperature}`
        : "Waiting for story weather";

      preview.textContent = state
        ? `${state.date} at ${state.time} • ${state.summary} • ${state.wind} • layer ${prefs.layerMode === "auto" ? state.layer : prefs.layerMode}`
        : "The HUD will wake up as soon as the model emits its first weather-state tag.";

      const effectiveLayer = prefs.layerMode === "auto" ? state?.layer : prefs.layerMode;
      preview.textContent = state
        ? `${state.location} | ${state.date} at ${state.time} | ${state.summary} | ${state.wind} | layer ${effectiveLayer}`
        : "Add {{weather_tracker}} to the active prompt, then the HUD will wake up as soon as the model emits its first weather-state tag.";

      manualModePill.textContent = state?.source === "manual" ? "Manual lock" : "Story sync";
      manualModePill.dataset.mode = state?.source === "manual" ? "manual" : "story";
      manualToggle.checked = state?.source === "manual";

      if (state) {
        applyStateToInputs(state, fields);
      } else {
        conditionSelect.value = "clear";
        paletteSelect.value = "day";
        locationInput.value = "";
        dateInput.value = "";
        timeInput.value = "";
        temperatureInput.value = "";
        windInput.value = "";
        summaryInput.value = "";
        sceneLayerSelect.value = "both";
        sceneIntensity.value = "0.30";
        sceneIntensityValue.textContent = "30%";
      }

      updatePresetSelection(state);
    },
    destroy() {
      root.remove();
    },
  };
}
