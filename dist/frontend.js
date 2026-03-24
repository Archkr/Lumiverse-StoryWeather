// src/shared.ts
var WEATHER_TAG_NAME = "weather-state";
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
function makeDefaultWeatherState(now = Date.now()) {
  const date = new Date(now);
  return {
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

// src/ui/settings.ts
var CONDITIONS = ["clear", "cloudy", "rain", "storm", "snow", "fog"];
var PALETTES = ["dawn", "day", "dusk", "night", "storm", "mist", "snow"];
function createLabeledInput(labelText, input) {
  const label = document.createElement("label");
  label.className = "weather-settings-label";
  label.textContent = labelText;
  label.appendChild(input);
  return label;
}
function createSettingsUI(sendToBackend) {
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
  let currentState = null;
  const updateChipSelection = () => {
    for (const chip of quickButtons.querySelectorAll(".weather-settings-chip")) {
      chip.classList.toggle("weather-settings-chip-active", chip.dataset.condition === conditionSelect.value);
    }
  };
  const buildManualState = () => ({
    date: dateInput.value || currentState?.date,
    time: timeInput.value.trim() || currentState?.time,
    condition: conditionSelect.value,
    summary: summaryInput.value.trim() || currentState?.summary,
    temperature: temperatureInput.value.trim() || currentState?.temperature,
    wind: windInput.value.trim() || currentState?.wind,
    layer: sceneLayerSelect.value,
    palette: paletteSelect.value,
    intensity: Number.parseFloat(sceneIntensity.value),
    source: "manual"
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
      status.textContent = state ? `${state.source === "manual" ? "manual" : "story"} / ${state.condition} ${state.temperature}` : "Waiting for story weather";
      preview.textContent = state ? `${state.date} at ${state.time} - ${state.summary} (${state.wind})` : "The HUD will wake up as soon as the model emits its first weather-state tag.";
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
    }
  };
}

// src/ui/styles.ts
var WEATHER_HUD_CSS = `
.weather-settings-card {
  width: 100%;
  border: 1px solid var(--lumiverse-border);
  border-radius: calc(var(--lumiverse-radius) + 4px);
  background:
    radial-gradient(circle at top right, rgba(255, 198, 126, 0.18), transparent 32%),
    linear-gradient(180deg, color-mix(in srgb, var(--lumiverse-fill) 88%, #0f2038 12%) 0%, var(--lumiverse-fill-subtle) 100%);
  color: var(--lumiverse-text);
  overflow: hidden;
}

.weather-settings-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--lumiverse-border);
}

.weather-settings-card-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.weather-settings-status {
  font-size: 11px;
  color: var(--lumiverse-text-muted);
  text-transform: capitalize;
}

.weather-settings-card-body {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.weather-settings-label {
  display: grid;
  gap: 6px;
  font-size: 11px;
  color: var(--lumiverse-text-muted);
}

.weather-settings-select,
.weather-settings-input,
.weather-settings-button {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--lumiverse-border);
  background: var(--lumiverse-fill-subtle);
  color: var(--lumiverse-text);
  font-size: 12px;
}

.weather-settings-input {
  appearance: none;
}

.weather-settings-button {
  cursor: pointer;
  transition: border-color var(--lumiverse-transition-fast), background var(--lumiverse-transition-fast);
}

.weather-settings-button-primary {
  border-color: color-mix(in srgb, var(--lumiverse-primary, #82a8ff) 45%, var(--lumiverse-border));
  background: linear-gradient(135deg, rgba(83, 126, 201, 0.92), rgba(43, 85, 157, 0.92));
  color: #f7fbff;
}

.weather-settings-button-primary:hover {
  background: linear-gradient(135deg, rgba(99, 142, 219, 0.96), rgba(52, 95, 171, 0.96));
}

.weather-settings-button:hover {
  border-color: var(--lumiverse-border-hover);
  background: color-mix(in srgb, var(--lumiverse-fill-subtle) 75%, white 6%);
}

.weather-settings-checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
}

.weather-settings-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weather-settings-range {
  width: 100%;
}

.weather-settings-value {
  min-width: 44px;
  text-align: right;
  font-size: 11px;
  color: var(--lumiverse-text);
}

.weather-settings-preview {
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--lumiverse-fill-subtle) 85%, transparent);
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 70%, transparent);
  font-size: 11px;
  line-height: 1.45;
  color: var(--lumiverse-text);
}

.weather-settings-manual-card {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background:
    radial-gradient(circle at top right, rgba(142, 188, 255, 0.14), transparent 32%),
    linear-gradient(180deg, color-mix(in srgb, var(--lumiverse-fill-subtle) 90%, #0f1d30 10%), color-mix(in srgb, var(--lumiverse-fill-subtle) 96%, transparent));
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 82%, transparent);
}

.weather-settings-manual-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.weather-settings-status-pill {
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(241, 246, 255, 0.92);
  background: rgba(70, 96, 132, 0.52);
}

.weather-settings-status-pill[data-mode="manual"] {
  background: linear-gradient(135deg, rgba(86, 122, 189, 0.88), rgba(46, 86, 151, 0.92));
}

.weather-settings-manual-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--lumiverse-text-muted);
}

.weather-settings-manual-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.weather-settings-chip-grid {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.weather-settings-chip {
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 72%, transparent);
  background: color-mix(in srgb, var(--lumiverse-fill-subtle) 82%, transparent);
  color: var(--lumiverse-text);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 11px;
  line-height: 1;
  text-transform: capitalize;
  cursor: pointer;
}

.weather-settings-chip:hover,
.weather-settings-chip-active {
  border-color: rgba(130, 168, 255, 0.54);
  background: rgba(86, 122, 189, 0.2);
}

.weather-settings-actions {
  display: flex;
  gap: 8px;
}

.weather-settings-actions .weather-settings-button {
  flex: 1 1 0;
}

.weather-hud-widget {
  position: relative;
  width: 236px;
  min-height: 106px;
  padding: 12px;
  border-radius: 22px;
  box-sizing: border-box;
  color: #f5f8ff;
  overflow: hidden;
  backdrop-filter: blur(18px) saturate(135%);
  background:
    radial-gradient(circle at top right, rgba(255, 215, 148, 0.34), transparent 28%),
    linear-gradient(145deg, rgba(10, 22, 39, 0.92), rgba(24, 44, 74, 0.82));
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 18px 36px rgba(3, 10, 23, 0.34);
}

.weather-hud-widget::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 38%);
  pointer-events: none;
}

.weather-hud-header,
.weather-hud-body,
.weather-hud-footer {
  position: relative;
  z-index: 1;
}

.weather-hud-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.weather-hud-eyebrow {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(234, 240, 255, 0.72);
}

.weather-hud-gear {
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  cursor: pointer;
}

.weather-hud-gear:hover {
  background: rgba(255, 255, 255, 0.16);
}

.weather-hud-gear svg,
.weather-hud-icon svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

.weather-hud-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.weather-hud-date {
  font-size: 11px;
  color: rgba(232, 238, 255, 0.76);
}

.weather-hud-time {
  margin-top: 3px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}

.weather-hud-wind {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(232, 238, 255, 0.7);
}

.weather-hud-weather {
  display: grid;
  justify-items: end;
  gap: 4px;
  text-align: right;
}

.weather-hud-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.12);
  color: #fff5db;
}

.weather-hud-temp {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.weather-hud-summary {
  max-width: 104px;
  font-size: 11px;
  line-height: 1.3;
  color: rgba(240, 244, 255, 0.78);
}

.weather-hud-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.weather-hud-badge {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 10px;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: rgba(244, 247, 255, 0.82);
}

.weather-fx-root {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity 260ms ease;
}

.weather-fx-root.weather-visible {
  opacity: 1;
}

.weather-fx-root[data-kind="back"] {
  z-index: 1;
}

.weather-fx-root[data-kind="front"] {
  z-index: 4;
}

.weather-fx-root.weather-hidden {
  display: none;
}

.weather-fx-sky,
.weather-fx-glow,
.weather-fx-clouds,
.weather-fx-fog,
.weather-fx-rain,
.weather-fx-snow,
.weather-fx-flash {
  position: absolute;
  inset: 0;
}

.weather-fx-sky {
  background:
    linear-gradient(180deg, var(--weather-bg-start) 0%, var(--weather-bg-mid) 46%, var(--weather-bg-end) 100%);
  opacity: var(--weather-sky-opacity, 0.3);
  animation: weather-sky-shift 22s ease-in-out infinite alternate;
}

.weather-fx-glow {
  background:
    radial-gradient(circle at 18% 20%, var(--weather-glow), transparent 34%),
    radial-gradient(circle at 80% 24%, color-mix(in srgb, var(--weather-glow) 72%, white 20%), transparent 26%);
  opacity: var(--weather-glow-opacity, 0.3);
  mix-blend-mode: screen;
  animation: weather-glow-drift 16s ease-in-out infinite alternate;
}

.weather-fx-cloud,
.weather-fx-fog-band,
.weather-fx-rain-drop,
.weather-fx-snow-flake {
  position: absolute;
}

.weather-fx-cloud {
  width: var(--cloud-width);
  height: var(--cloud-height);
  top: var(--cloud-top);
  left: var(--cloud-left);
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 36%, rgba(255, 255, 255, 0.32), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04));
  filter: blur(4px);
  opacity: var(--weather-cloud-opacity, 0.2);
  animation: weather-cloud-drift var(--cloud-duration) linear infinite;
  animation-delay: var(--cloud-delay);
}

.weather-fx-fog-band {
  width: var(--fog-width);
  height: var(--fog-height);
  top: var(--fog-top);
  left: var(--fog-left);
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(236, 241, 255, 0.18), transparent);
  filter: blur(18px);
  opacity: var(--weather-fog-opacity, 0.12);
  animation: weather-fog-drift var(--fog-duration) ease-in-out infinite;
  animation-delay: var(--fog-delay);
}

.weather-fx-rain-drop {
  top: -18%;
  left: var(--drop-left);
  width: var(--drop-width);
  height: var(--drop-length);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), var(--weather-rain-color));
  border-radius: 999px;
  opacity: var(--weather-rain-opacity, 0);
  transform: rotate(11deg);
  animation: weather-rain-fall var(--drop-duration) linear infinite;
  animation-delay: var(--drop-delay);
}

.weather-fx-snow-flake {
  top: -12%;
  left: var(--flake-left);
  width: var(--flake-size);
  height: var(--flake-size);
  border-radius: 50%;
  background: var(--weather-snow-color);
  opacity: var(--weather-snow-opacity, 0);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.35);
  animation: weather-snow-fall var(--flake-duration) linear infinite;
  animation-delay: var(--flake-delay);
}

.weather-fx-flash {
  background: rgba(219, 231, 255, 0.74);
  opacity: 0;
}

.weather-fx-root.weather-storm-flash .weather-fx-flash {
  animation: weather-flash 180ms ease-out;
}

.weather-fx-root.weather-reduced-motion .weather-fx-cloud,
.weather-fx-root.weather-reduced-motion .weather-fx-fog-band,
.weather-fx-root.weather-reduced-motion .weather-fx-rain-drop,
.weather-fx-root.weather-reduced-motion .weather-fx-snow-flake {
  animation-duration: 0.001ms;
  animation-iteration-count: 1;
}

.weather-fx-root.weather-reduced-motion .weather-fx-sky,
.weather-fx-root.weather-reduced-motion .weather-fx-glow {
  animation: none;
}

.weather-fx-root.weather-reduced-motion .weather-fx-rain-drop,
.weather-fx-root.weather-reduced-motion .weather-fx-snow-flake {
  opacity: var(--weather-particle-opacity-static, 0.08);
}

@keyframes weather-sky-shift {
  0% { transform: scale(1) translate3d(0, 0, 0); }
  100% { transform: scale(1.04) translate3d(0, -1.6vh, 0); }
}

@keyframes weather-glow-drift {
  0% { transform: translate3d(-1vw, 0, 0) scale(1); }
  100% { transform: translate3d(1vw, -1vh, 0) scale(1.08); }
}

@keyframes weather-cloud-drift {
  0% { transform: translateX(-10vw); }
  100% { transform: translateX(14vw); }
}

@keyframes weather-fog-drift {
  0%, 100% { transform: translate3d(-2vw, 0, 0); }
  50% { transform: translate3d(2vw, -1vh, 0); }
}

@keyframes weather-rain-fall {
  0% { transform: translate3d(0, 0, 0) rotate(11deg); }
  100% { transform: translate3d(-5vw, 118vh, 0) rotate(11deg); }
}

@keyframes weather-snow-fall {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(3vw, 116vh, 0); }
}

@keyframes weather-flash {
  0% { opacity: 0.78; }
  100% { opacity: 0; }
}

@media (max-width: 768px) {
  .weather-hud-widget {
    width: 220px;
    min-height: 98px;
  }

  .weather-settings-manual-grid {
    grid-template-columns: 1fr;
  }

  .weather-settings-actions {
    flex-direction: column;
  }

  .weather-hud-time {
    font-size: 23px;
  }
}
`;

// src/frontend.ts
var GEAR_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98a7.79 7.79 0 000-1.96l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.88 7.88 0 00-1.69-.98l-.36-2.54a.5.5 0 00-.49-.42h-3.84a.5.5 0 00-.49.42l-.36 2.54c-.6.24-1.16.56-1.69.98l-2.39-.96a.5.5 0 00-.6.22L2.43 8.8a.5.5 0 00.12.64l2.03 1.58a7.79 7.79 0 000 1.96L2.55 14.56a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.6.22l2.39-.96c.53.42 1.09.74 1.69.98l.36 2.54a.5.5 0 00.49.42h3.84a.5.5 0 00.49-.42l.36-2.54c.6-.24 1.16-.56 1.69-.98l2.39.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z"/></svg>`;
function conditionIcon(condition) {
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
function sendToBackend(ctx, payload) {
  ctx.sendToBackend(payload);
}
function createSpan(className, styles) {
  const span = document.createElement("span");
  span.className = className;
  for (const [key, value] of Object.entries(styles)) {
    span.style.setProperty(key, value);
  }
  return span;
}
function createFxMarkup(kind) {
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
  for (let index = 0;index < cloudCount; index += 1) {
    clouds.appendChild(createSpan("weather-fx-cloud", {
      "--cloud-width": `${160 + Math.round(Math.random() * 240)}px`,
      "--cloud-height": `${50 + Math.round(Math.random() * 52)}px`,
      "--cloud-top": `${8 + index * 12 + Math.round(Math.random() * 6)}%`,
      "--cloud-left": `${-18 + Math.round(Math.random() * 86)}%`,
      "--cloud-duration": `${34 + Math.round(Math.random() * 20)}s`,
      "--cloud-delay": `${Math.round(Math.random() * -22)}s`
    }));
  }
  for (let index = 0;index < fogCount; index += 1) {
    fog.appendChild(createSpan("weather-fx-fog-band", {
      "--fog-width": `${220 + Math.round(Math.random() * 260)}px`,
      "--fog-height": `${56 + Math.round(Math.random() * 34)}px`,
      "--fog-top": `${18 + index * 16 + Math.round(Math.random() * 4)}%`,
      "--fog-left": `${-16 + Math.round(Math.random() * 86)}%`,
      "--fog-duration": `${18 + Math.round(Math.random() * 10)}s`,
      "--fog-delay": `${Math.round(Math.random() * -18)}s`
    }));
  }
  for (let index = 0;index < rainCount; index += 1) {
    rain.appendChild(createSpan("weather-fx-rain-drop", {
      "--drop-left": `${Math.round(Math.random() * 104)}%`,
      "--drop-width": `${kind === "back" ? 1 : 2}px`,
      "--drop-length": `${24 + Math.round(Math.random() * 28)}px`,
      "--drop-duration": `${0.85 + Math.random() * 0.9}s`,
      "--drop-delay": `${Math.random() * -2.2}s`
    }));
  }
  for (let index = 0;index < snowCount; index += 1) {
    snow.appendChild(createSpan("weather-fx-snow-flake", {
      "--flake-left": `${Math.round(Math.random() * 104)}%`,
      "--flake-size": `${kind === "back" ? 3 + Math.random() * 3 : 4 + Math.random() * 5}px`,
      "--flake-duration": `${5.4 + Math.random() * 4.2}s`,
      "--flake-delay": `${Math.random() * -5}s`
    }));
  }
  return { root };
}
function resolveSceneHost() {
  const sceneLayer = document.querySelector('[class*="sceneBackgroundLayer"]');
  if (!(sceneLayer instanceof HTMLDivElement))
    return null;
  return sceneLayer.parentElement instanceof HTMLDivElement ? sceneLayer.parentElement : null;
}
function resolveSceneTokens(state, intensity) {
  const paletteMap = {
    dawn: { start: "#20385f", mid: "#5877a7", end: "#f0a36c", glow: "rgba(255, 201, 145, 0.86)" },
    day: { start: "#537cb0", mid: "#7fa7df", end: "#cfe7ff", glow: "rgba(255, 242, 197, 0.86)" },
    dusk: { start: "#241f4f", mid: "#68467a", end: "#ef8e63", glow: "rgba(255, 171, 122, 0.76)" },
    night: { start: "#06111f", mid: "#10243c", end: "#254566", glow: "rgba(136, 176, 255, 0.58)" },
    storm: { start: "#05111b", mid: "#142a3a", end: "#33485f", glow: "rgba(187, 221, 255, 0.34)" },
    mist: { start: "#263544", mid: "#53697d", end: "#9db1bc", glow: "rgba(226, 239, 255, 0.4)" },
    snow: { start: "#49627f", mid: "#7d93a8", end: "#d8e4ef", glow: "rgba(255, 252, 243, 0.82)" }
  };
  const palette = paletteMap[state.palette];
  const baseIntensity = clamp(intensity, 0, 1.5);
  const values = {
    cloudOpacity: 0.08,
    fogOpacity: 0.02,
    rainOpacity: 0,
    snowOpacity: 0,
    skyOpacity: 0.08,
    glowOpacity: 0.16
  };
  switch (state.condition) {
    case "cloudy":
      values.cloudOpacity = 0.3;
      values.glowOpacity = 0.14;
      values.skyOpacity = 0.14;
      break;
    case "rain":
      values.cloudOpacity = 0.36;
      values.rainOpacity = 0.62;
      values.fogOpacity = 0.1;
      values.glowOpacity = 0.08;
      values.skyOpacity = 0.16;
      break;
    case "storm":
      values.cloudOpacity = 0.46;
      values.rainOpacity = 0.82;
      values.fogOpacity = 0.14;
      values.glowOpacity = 0.06;
      values.skyOpacity = 0.18;
      break;
    case "snow":
      values.cloudOpacity = 0.18;
      values.snowOpacity = 0.76;
      values.fogOpacity = 0.08;
      values.glowOpacity = 0.18;
      values.skyOpacity = 0.12;
      break;
    case "fog":
      values.cloudOpacity = 0.14;
      values.fogOpacity = 0.36;
      values.glowOpacity = 0.12;
      values.skyOpacity = 0.1;
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
    glowOpacity: values.glowOpacity
  };
}
function getEffectiveLayerMode(prefs, state) {
  return prefs.layerMode === "auto" ? state.layer : prefs.layerMode;
}
function createHudWidget(ctx, initialPosition) {
  const widget = ctx.ui.createFloatWidget({
    width: 236,
    height: 106,
    initialPosition: initialPosition ?? { x: 24, y: 96 },
    snapToEdge: true,
    tooltip: "Story Weather HUD",
    chromeless: true
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
    palette
  };
}
function getLiveDate(state) {
  if (state.timestampMs === null)
    return null;
  const elapsed = Math.max(0, Date.now() - state.updatedAt);
  return new Date(state.timestampMs + elapsed);
}
function applyHudState(hud, prefs, state) {
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
      year: "numeric"
    });
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
    hud.date.textContent = dateFormatter.format(liveDate);
    hud.time.textContent = timeFormatter.format(liveDate);
  } else {
    hud.date.textContent = state.date;
    hud.time.textContent = state.time;
  }
}
function setFxVisibility(root, visible) {
  root.root.classList.toggle("weather-hidden", !visible);
  root.root.classList.toggle("weather-visible", visible);
}
function applySceneState(root, state, prefs, reducedMotion) {
  const effectiveIntensity = clamp(state.intensity * prefs.intensity, 0, 1.5);
  const tokens = resolveSceneTokens(state, effectiveIntensity);
  const isFront = root.root.dataset.kind === "front";
  root.root.classList.toggle("weather-reduced-motion", reducedMotion);
  root.root.style.setProperty("--weather-bg-start", tokens.bgStart);
  root.root.style.setProperty("--weather-bg-mid", tokens.bgMid);
  root.root.style.setProperty("--weather-bg-end", tokens.bgEnd);
  root.root.style.setProperty("--weather-glow", tokens.glow);
  root.root.style.setProperty("--weather-cloud-opacity", String(isFront ? 0 : tokens.cloudOpacity));
  root.root.style.setProperty("--weather-fog-opacity", String(tokens.fogOpacity * (isFront ? state.condition === "fog" ? 0.32 : 0.1 : 0.88)));
  root.root.style.setProperty("--weather-rain-opacity", String(tokens.rainOpacity * (isFront ? 1 : 0.34)));
  root.root.style.setProperty("--weather-snow-opacity", String(tokens.snowOpacity * (isFront ? 1 : 0.36)));
  root.root.style.setProperty("--weather-sky-opacity", String(isFront ? 0 : tokens.skyOpacity));
  root.root.style.setProperty("--weather-glow-opacity", String(isFront ? 0 : tokens.glowOpacity));
  root.root.style.setProperty("--weather-rain-color", state.condition === "storm" ? "rgba(201, 224, 255, 0.95)" : "rgba(193, 222, 255, 0.82)");
  root.root.style.setProperty("--weather-snow-color", "rgba(248, 251, 255, 0.92)");
  root.root.style.setProperty("--weather-particle-opacity-static", state.condition === "snow" ? String(tokens.snowOpacity * 0.18) : String(tokens.rainOpacity * 0.12));
}
function setup(ctx) {
  console.info("[weather_hud] frontend build 2026-03-24.4");
  const cleanups = [];
  const removeStyle = ctx.dom.addStyle(WEATHER_HUD_CSS);
  cleanups.push(removeStyle);
  let currentPrefs = DEFAULT_PREFS;
  let currentState = makeDefaultWeatherState();
  let activeChatId = null;
  const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  const getReducedMotion = () => currentPrefs.reducedMotion === "always" || currentPrefs.reducedMotion === "system" && motionMedia.matches;
  const settingsMount = ctx.ui.mount("settings_extensions");
  const settingsUI = createSettingsUI((payload) => sendToBackend(ctx, payload));
  settingsMount.appendChild(settingsUI.root);
  cleanups.push(() => settingsUI.destroy());
  const backFx = createFxMarkup("back");
  const frontFx = createFxMarkup("front");
  let sceneHost = null;
  let hostSyncFrame = null;
  const attachFxRoots = () => {
    hostSyncFrame = null;
    const nextHost = resolveSceneHost();
    if (!nextHost) {
      const hadHost = !!sceneHost || backFx.root.isConnected || frontFx.root.isConnected;
      sceneHost = null;
      backFx.root.remove();
      frontFx.root.remove();
      return hadHost;
    }
    if (sceneHost !== nextHost || backFx.root.parentElement !== nextHost || frontFx.root.parentElement !== nextHost) {
      sceneHost = nextHost;
      nextHost.appendChild(backFx.root);
      nextHost.appendChild(frontFx.root);
      return true;
    }
    return false;
  };
  const queueFxRootAttach = () => {
    if (hostSyncFrame !== null)
      return;
    hostSyncFrame = window.requestAnimationFrame(() => {
      if (attachFxRoots()) {
        updateScene();
      }
    });
  };
  const hostObserver = new MutationObserver(() => {
    if (sceneHost?.isConnected && backFx.root.parentElement === sceneHost && frontFx.root.parentElement === sceneHost) {
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
    backFx.root.remove();
    frontFx.root.remove();
  });
  let hud = createHudWidget(ctx, currentPrefs.widgetPosition);
  cleanups.push(() => hud.widget.destroy());
  let flashTimer = null;
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
    const showEffects = currentPrefs.effectsEnabled && !currentPrefs.pauseEffects && !!sceneHost;
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
  const tagUnsub = ctx.messages.registerTagInterceptor({ tagName: WEATHER_TAG_NAME, removeFromMessage: true }, (payload) => {
    if (payload.isStreaming)
      return;
    sendToBackend(ctx, {
      type: "weather_tag_intercepted",
      chatId: payload.chatId ?? activeChatId,
      messageId: payload.messageId ?? null,
      attrs: payload.attrs,
      isStreaming: !!payload.isStreaming
    });
  });
  cleanups.push(tagUnsub);
  const msgUnsub = ctx.onBackendMessage((raw) => {
    const message = raw;
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
  const chatChangedUnsub = ctx.events.on("CHAT_CHANGED", (payload) => {
    const chatId = payload && typeof payload === "object" && "chatId" in payload ? payload.chatId ?? null : null;
    activeChatId = chatId;
    queueFxRootAttach();
    sendToBackend(ctx, { type: "chat_changed", chatId });
  });
  cleanups.push(chatChangedUnsub);
  sendToBackend(ctx, { type: "frontend_ready" });
  queueFxRootAttach();
  updateScene();
  return () => {
    resetFlashTimer();
    for (const cleanup of cleanups.reverse())
      cleanup();
  };
}
export {
  setup
};
