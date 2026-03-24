import type { WeatherCondition, WeatherPalette, WeatherPrefs, WeatherState } from "../types";

const CONDITIONS: WeatherCondition[] = ["clear", "cloudy", "rain", "storm", "snow", "fog"];
const PALETTES: WeatherPalette[] = ["dawn", "day", "dusk", "night", "storm", "mist", "snow"];

export interface SettingsUI {
  root: HTMLElement;
  sync(prefs: WeatherPrefs, state: WeatherState | null): void;
  destroy(): void;
}

function createLabeledInput(labelText: string, input: HTMLElement): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "weather-settings-label";
  label.textContent = labelText;
  label.appendChild(input);
  return label;
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
  pauseLabel.textContent = "Pause effects";

  const pauseToggle = document.createElement("input");
  pauseToggle.type = "checkbox";
  pauseToggle.className = "weather-settings-checkbox";
  pauseToggle.addEventListener("change", () => {
    sendToBackend({ type: "save_prefs", prefs: { pauseEffects: pauseToggle.checked } });
  });
  pauseLabel.appendChild(pauseToggle);

  const preview = document.createElement("div");
  preview.className = "weather-settings-preview";

  const manualCard = document.createElement("section");
  manualCard.className = "weather-settings-manual-card";

  const manualHeader = document.createElement("div");
  manualHeader.className = "weather-settings-manual-header";

  const manualTitle = document.createElement("strong");
  manualTitle.textContent = "Manual weather";

  const manualModePill = document.createElement("span");
  manualModePill.className = "weather-settings-status-pill";

  manualHeader.appendChild(manualTitle);
  manualHeader.appendChild(manualModePill);

  const manualHint = document.createElement("p");
  manualHint.className = "weather-settings-manual-hint";
  manualHint.textContent = "Lock the HUD to your chosen scene, or return to story sync whenever you want.";

  const manualToggle = document.createElement("input");
  manualToggle.type = "checkbox";
  manualToggle.className = "weather-settings-checkbox";
  const manualToggleLabel = createLabeledInput("Manual override", manualToggle);

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

  const quickButtons = document.createElement("div");
  quickButtons.className = "weather-settings-chip-grid";

  let currentState: WeatherState | null = null;

  const updateChipSelection = () => {
    for (const chip of quickButtons.querySelectorAll<HTMLButtonElement>(".weather-settings-chip")) {
      chip.classList.toggle("weather-settings-chip-active", chip.dataset.condition === conditionSelect.value);
    }
  };

  const buildManualState = (): Partial<WeatherState> => ({
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

  const applyManualState = () => {
    sendToBackend({ type: "set_manual_state", state: buildManualState() });
  };

  for (const condition of CONDITIONS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "weather-settings-chip";
    chip.dataset.condition = condition;
    chip.textContent = condition;
    chip.addEventListener("click", () => {
      conditionSelect.value = condition;
      updateChipSelection();
      manualToggle.checked = true;
      applyManualState();
    });
    quickButtons.appendChild(chip);
  }

  conditionSelect.addEventListener("change", updateChipSelection);

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

  manualActions.appendChild(applyButton);
  manualActions.appendChild(resumeButton);

  manualCard.appendChild(manualHeader);
  manualCard.appendChild(manualHint);
  manualCard.appendChild(manualToggleLabel);
  manualCard.appendChild(quickButtons);
  manualCard.appendChild(manualGrid);
  manualCard.appendChild(sceneIntensityLabel);
  manualCard.appendChild(manualActions);

  const resetButton = document.createElement("button");
  resetButton.className = "weather-settings-button";
  resetButton.textContent = "Reset HUD position";
  resetButton.addEventListener("click", () => {
    sendToBackend({ type: "reset_widget_position" });
  });

  body.appendChild(effectsLabel);
  body.appendChild(layerLabel);
  body.appendChild(intensityLabel);
  body.appendChild(motionLabel);
  body.appendChild(pauseLabel);
  body.appendChild(preview);
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
      motionSelect.value = prefs.reducedMotion;
      pauseToggle.checked = prefs.pauseEffects;

      status.textContent = state
        ? `${state.source === "manual" ? "manual" : "story"} / ${state.condition} ${state.temperature}`
        : "Waiting for story weather";
      preview.textContent = state
        ? `${state.date} at ${state.time} - ${state.summary} (${state.wind})`
        : "The HUD will wake up as soon as the model emits its first weather-state tag.";

      manualModePill.textContent = state?.source === "manual" ? "Manual lock" : "Story sync";
      manualModePill.dataset.mode = state?.source === "manual" ? "manual" : "story";
      manualToggle.checked = state?.source === "manual";

      if (state) {
        conditionSelect.value = state.condition;
        paletteSelect.value = state.palette;
        dateInput.value = /^\d{4}-\d{2}-\d{2}$/.test(state.date) ? state.date : "";
        timeInput.value = state.time;
        temperatureInput.value = state.temperature;
        windInput.value = state.wind;
        summaryInput.value = state.summary;
        sceneLayerSelect.value = state.layer;
        sceneIntensity.value = String(state.intensity.toFixed(2));
        sceneIntensityValue.textContent = `${Math.round(state.intensity * 100)}%`;
      } else {
        conditionSelect.value = "clear";
        paletteSelect.value = "day";
        dateInput.value = "";
        timeInput.value = "";
        temperatureInput.value = "";
        windInput.value = "";
        summaryInput.value = "";
        sceneLayerSelect.value = "both";
        sceneIntensity.value = "0.30";
        sceneIntensityValue.textContent = "30%";
      }

      updateChipSelection();
    },
    destroy() {
      root.remove();
    },
  };
}
