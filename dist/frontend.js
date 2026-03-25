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

// src/presets.ts
var WEATHER_SCENE_PRESETS = [
  {
    id: "clear-day",
    label: "Clear day",
    shortLabel: "Day",
    description: "Bright open skies with a soft daylight bloom.",
    state: {
      time: "1:18 PM",
      condition: "clear",
      summary: "Bright open skies",
      temperature: "72F",
      wind: "light breeze",
      layer: "back",
      palette: "day",
      intensity: 0.34
    }
  },
  {
    id: "overcast",
    label: "Overcast",
    shortLabel: "Overcast",
    description: "Muted daylight under a heavy cloud ceiling.",
    state: {
      time: "11:26 AM",
      condition: "cloudy",
      summary: "Heavy overcast",
      temperature: "63F",
      wind: "cool drift",
      layer: "back",
      palette: "day",
      intensity: 0.58
    }
  },
  {
    id: "rain",
    label: "Rain",
    shortLabel: "Rain",
    description: "Steady angled rain with a low mist at the base of the scene.",
    state: {
      time: "5:42 PM",
      condition: "rain",
      summary: "Rain sweeping through",
      temperature: "61F",
      wind: "steady rainwind",
      layer: "both",
      palette: "dusk",
      intensity: 0.74
    }
  },
  {
    id: "storm",
    label: "Storm",
    shortLabel: "Storm",
    description: "Dark thunderheads, hard rain, and intermittent flashes.",
    state: {
      time: "8:18 PM",
      condition: "storm",
      summary: "Thunderheads building",
      temperature: "58F",
      wind: "hard gusts",
      layer: "both",
      palette: "storm",
      intensity: 0.94
    }
  },
  {
    id: "snow",
    label: "Snow",
    shortLabel: "Snow",
    description: "Layered snowfall with a cold, luminous atmosphere.",
    state: {
      time: "6:48 AM",
      condition: "snow",
      summary: "Quiet snowfall",
      temperature: "29F",
      wind: "hushed air",
      layer: "both",
      palette: "snow",
      intensity: 0.68
    }
  },
  {
    id: "fog",
    label: "Fog",
    shortLabel: "Fog",
    description: "Low fog pooling through the lower scene.",
    state: {
      time: "6:12 AM",
      condition: "fog",
      summary: "Fog pooling low",
      temperature: "54F",
      wind: "still",
      layer: "back",
      palette: "mist",
      intensity: 0.64
    }
  },
  {
    id: "clear-night",
    label: "Clear night",
    shortLabel: "Night",
    description: "Clean night air with a cool moonlit palette.",
    state: {
      time: "10:18 PM",
      condition: "clear",
      summary: "Clear night air",
      temperature: "57F",
      wind: "light night wind",
      layer: "back",
      palette: "night",
      intensity: 0.24
    }
  }
];
function getWeatherScenePreset(presetId) {
  return WEATHER_SCENE_PRESETS.find((preset) => preset.id === presetId) ?? null;
}
function buildPresetWeatherState(presetId, currentState) {
  const preset = getWeatherScenePreset(presetId);
  if (!preset)
    return null;
  const baseState = currentState ?? makeDefaultWeatherState();
  const fallbackDate = /^\d{4}-\d{2}-\d{2}$/.test(baseState.date) ? baseState.date : formatDate(new Date);
  return {
    location: baseState.location,
    date: fallbackDate,
    ...preset.state,
    source: "manual"
  };
}
function matchWeatherScenePreset(state) {
  if (!state)
    return null;
  const match = WEATHER_SCENE_PRESETS.find((preset) => preset.state.condition === state.condition && preset.state.palette === state.palette && preset.state.layer === state.layer && preset.state.time === state.time && preset.state.summary === state.summary && preset.state.temperature === state.temperature && preset.state.wind === state.wind && Math.abs(preset.state.intensity - state.intensity) < 0.001);
  return match?.id ?? null;
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
function createSection(titleText, copyText) {
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
function applyStateToInputs(state, fields) {
  if (state.condition)
    fields.conditionSelect.value = state.condition;
  if (state.palette)
    fields.paletteSelect.value = state.palette;
  if (state.location)
    fields.locationInput.value = state.location;
  if (state.date && /^\d{4}-\d{2}-\d{2}$/.test(state.date))
    fields.dateInput.value = state.date;
  if (state.time)
    fields.timeInput.value = state.time;
  if (state.temperature)
    fields.temperatureInput.value = state.temperature;
  if (state.wind)
    fields.windInput.value = state.wind;
  if (state.summary)
    fields.summaryInput.value = state.summary;
  if (state.layer)
    fields.sceneLayerSelect.value = state.layer;
  if (typeof state.intensity === "number" && Number.isFinite(state.intensity)) {
    fields.sceneIntensity.value = state.intensity.toFixed(2);
    fields.sceneIntensityValue.textContent = `${Math.round(state.intensity * 100)}%`;
  }
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
  const preview = document.createElement("div");
  preview.className = "weather-settings-preview";
  const effectsSection = createSection("Effects", "Overall ambience, density, and motion.");
  const placementSection = createSection("Placement", "Control whether the weather stays behind the chat, in front, or both.");
  const motionSection = createSection("Motion", "Fine-tune animation pacing without breaking story sync.");
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
  const presetButtons = new Map;
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
    sceneIntensityValue
  };
  let currentState = null;
  const buildManualState = () => ({
    location: locationInput.value.trim() || currentState?.location,
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
  const updatePresetSelection = (state) => {
    const activePresetId = matchWeatherScenePreset(state);
    for (const [presetId, button] of presetButtons) {
      button.classList.toggle("weather-settings-preset-active", presetId === activePresetId);
    }
  };
  const applyManualState = (state) => {
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
      if (!nextState)
        return;
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
  manualActions.appendChild(applyButton);
  manualActions.appendChild(resumeButton);
  manualCard.appendChild(manualHeader);
  manualCard.appendChild(manualHint);
  manualCard.appendChild(manualToggleLabel);
  manualCard.appendChild(presetGrid);
  manualCard.appendChild(manualGrid);
  manualCard.appendChild(sceneIntensityLabel);
  manualCard.appendChild(manualActions);
  const resetButton = document.createElement("button");
  resetButton.className = "weather-settings-button";
  resetButton.textContent = "Reset HUD position";
  resetButton.addEventListener("click", () => {
    sendToBackend({ type: "reset_widget_position" });
  });
  body.appendChild(preview);
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
      motionSelect.value = prefs.reducedMotion;
      pauseToggle.checked = prefs.pauseEffects;
      status.textContent = state ? `${state.source === "manual" ? "manual" : "story"} / ${state.condition} ${state.temperature}` : "Waiting for story weather";
      preview.textContent = state ? `${state.date} at ${state.time} • ${state.summary} • ${state.wind} • layer ${prefs.layerMode === "auto" ? state.layer : prefs.layerMode}` : "The HUD will wake up as soon as the model emits its first weather-state tag.";
      const effectiveLayer = prefs.layerMode === "auto" ? state?.layer : prefs.layerMode;
      preview.textContent = state ? `${state.location} | ${state.date} at ${state.time} | ${state.summary} | ${state.wind} | layer ${effectiveLayer}` : "The HUD will wake up as soon as the model emits its first weather-state tag.";
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
    }
  };
}

// src/ui/styles.ts
var WEATHER_HUD_CSS = `
@property --weather-bg-start {
  syntax: "<color>";
  inherits: true;
  initial-value: #4d77ad;
}

@property --weather-bg-mid {
  syntax: "<color>";
  inherits: true;
  initial-value: #7fa8de;
}

@property --weather-bg-end {
  syntax: "<color>";
  inherits: true;
  initial-value: #d8ebff;
}

@property --weather-glow {
  syntax: "<color>";
  inherits: true;
  initial-value: rgba(255, 243, 202, 0.78);
}

@property --weather-beam-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgba(255, 244, 212, 0.44);
}

@property --weather-horizon-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgba(185, 212, 244, 0.28);
}

@property --weather-sky-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0.05;
}

@property --weather-glow-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0.1;
}

@property --weather-beam-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0.12;
}

@property --weather-cloud-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0.06;
}

@property --weather-horizon-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0.04;
}

@property --weather-mist-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0.03;
}

@property --weather-fog-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

@property --weather-rain-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

@property --weather-snow-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

@property --weather-mote-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0.04;
}

@property --weather-flash-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0.26;
}

.weather-settings-card {
  width: 100%;
  border: 1px solid var(--lumiverse-border);
  border-radius: calc(var(--lumiverse-radius) + 6px);
  background:
    radial-gradient(circle at top right, rgba(255, 197, 124, 0.16), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, var(--lumiverse-fill) 87%, #0f2137 13%) 0%, var(--lumiverse-fill-subtle) 100%);
  color: var(--lumiverse-text);
  overflow: hidden;
}

.weather-settings-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
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
  gap: 14px;
  padding: 14px;
}

.weather-settings-preview {
  padding: 11px 13px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--lumiverse-fill-subtle) 85%, transparent);
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 72%, transparent);
  font-size: 11px;
  line-height: 1.5;
  color: var(--lumiverse-text);
}

.weather-settings-section,
.weather-settings-manual-card {
  display: grid;
  gap: 12px;
  padding: 13px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 80%, transparent);
  background:
    radial-gradient(circle at top right, rgba(141, 188, 255, 0.1), transparent 32%),
    linear-gradient(180deg, color-mix(in srgb, var(--lumiverse-fill-subtle) 92%, #102033 8%), color-mix(in srgb, var(--lumiverse-fill-subtle) 96%, transparent));
}

.weather-settings-section-header {
  display: grid;
  gap: 6px;
}

.weather-settings-section-body {
  display: grid;
  gap: 10px;
}

.weather-settings-section-title {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(228, 236, 255, 0.68);
}

.weather-settings-section-copy,
.weather-settings-manual-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--lumiverse-text-muted);
}

.weather-settings-label {
  display: grid;
  gap: 6px;
  font-size: 11px;
  color: var(--lumiverse-text-muted);
}

.weather-settings-select,
.weather-settings-input,
.weather-settings-button,
.weather-hud-select {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 11px;
  border: 1px solid var(--lumiverse-border);
  background: color-mix(in srgb, var(--lumiverse-fill-subtle) 88%, rgba(255, 255, 255, 0.03));
  color: var(--lumiverse-text);
  font-size: 12px;
}

.weather-settings-button {
  cursor: pointer;
  transition: border-color var(--lumiverse-transition-fast), background var(--lumiverse-transition-fast), transform var(--lumiverse-transition-fast);
}

.weather-settings-button:hover {
  border-color: var(--lumiverse-border-hover);
  background: color-mix(in srgb, var(--lumiverse-fill-subtle) 74%, white 6%);
  transform: translateY(-1px);
}

.weather-settings-button-primary {
  border-color: color-mix(in srgb, var(--lumiverse-primary, #82a8ff) 42%, var(--lumiverse-border));
  background: linear-gradient(135deg, rgba(80, 125, 198, 0.94), rgba(45, 89, 160, 0.94));
  color: #f7fbff;
}

.weather-settings-button-primary:hover {
  background: linear-gradient(135deg, rgba(97, 141, 217, 0.98), rgba(53, 98, 174, 0.98));
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

.weather-settings-range,
.weather-hud-range {
  width: 100%;
}

.weather-settings-value {
  min-width: 44px;
  text-align: right;
  font-size: 11px;
  color: var(--lumiverse-text);
}

.weather-settings-manual-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 10px;
}

.weather-settings-manual-titlewrap {
  display: grid;
  gap: 4px;
}

.weather-settings-manual-titlewrap strong {
  font-size: 13px;
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
  background: linear-gradient(135deg, rgba(88, 123, 189, 0.88), rgba(48, 86, 151, 0.92));
}

.weather-settings-preset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.weather-settings-preset {
  display: grid;
  gap: 4px;
  text-align: left;
  padding: 9px 10px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 72%, transparent);
  background: color-mix(in srgb, var(--lumiverse-fill-subtle) 84%, transparent);
  color: var(--lumiverse-text);
  cursor: pointer;
  transition: border-color var(--lumiverse-transition-fast), background var(--lumiverse-transition-fast), transform var(--lumiverse-transition-fast);
}

.weather-settings-preset:hover,
.weather-settings-preset-active {
  border-color: rgba(130, 168, 255, 0.58);
  background: rgba(86, 122, 189, 0.2);
  transform: translateY(-1px);
}

.weather-settings-preset-label {
  font-size: 11px;
  font-weight: 600;
}

.weather-settings-preset-copy {
  font-size: 10px;
  line-height: 1.35;
  color: var(--lumiverse-text-muted);
}

.weather-settings-manual-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  width: 100%;
  height: 100%;
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 14px;
  box-sizing: border-box;
  border-radius: 24px;
  color: #f5f8ff;
  overflow: hidden;
  backdrop-filter: blur(18px) saturate(138%);
  background:
    radial-gradient(circle at top right, rgba(255, 214, 146, 0.24), transparent 26%),
    linear-gradient(145deg, rgba(8, 20, 37, 0.95), rgba(20, 40, 69, 0.84));
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 18px 36px rgba(3, 10, 23, 0.34);
}

.weather-hud-widget::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.07), transparent 34%),
    radial-gradient(circle at bottom left, rgba(129, 172, 255, 0.1), transparent 34%);
  pointer-events: none;
}

.weather-hud-widget[data-source="manual"] {
  background:
    radial-gradient(circle at top right, rgba(165, 205, 255, 0.28), transparent 26%),
    linear-gradient(145deg, rgba(7, 22, 44, 0.96), rgba(24, 52, 92, 0.84));
}

.weather-hud-header,
.weather-hud-body,
.weather-hud-footer,
.weather-hud-drawer {
  position: relative;
  z-index: 1;
}

.weather-hud-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.weather-hud-titlewrap {
  display: grid;
  gap: 5px;
}

.weather-hud-eyebrow {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(234, 240, 255, 0.72);
}

.weather-hud-source {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(242, 247, 255, 0.92);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.weather-hud-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.weather-hud-control,
.weather-hud-gear,
.weather-hud-chip,
.weather-hud-preset {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.weather-hud-control:hover,
.weather-hud-gear:hover,
.weather-hud-chip:hover,
.weather-hud-preset:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.weather-hud-control,
.weather-hud-gear {
  border-radius: 999px;
}

.weather-hud-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.weather-hud-control-ghost {
  background: rgba(255, 255, 255, 0.05);
}

.weather-hud-control-active {
  background: rgba(98, 135, 208, 0.34);
  border-color: rgba(144, 182, 255, 0.38);
}

.weather-hud-control-icon,
.weather-hud-gear svg,
.weather-hud-icon svg {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.weather-hud-gear {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.weather-hud-gear svg,
.weather-hud-icon svg,
.weather-hud-control-icon svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.weather-hud-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.weather-hud-primary {
  display: grid;
  gap: 3px;
}

.weather-hud-location {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  color: rgba(245, 248, 255, 0.92);
  max-width: 156px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.weather-hud-date {
  font-size: 10px;
  color: rgba(232, 238, 255, 0.76);
}

.weather-hud-time {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
}

.weather-hud-wind {
  font-size: 11px;
  color: rgba(232, 238, 255, 0.72);
}

.weather-hud-weather {
  display: grid;
  justify-items: end;
  gap: 4px;
  text-align: right;
}

.weather-hud-icon {
  width: 36px;
  height: 36px;
  border-radius: 13px;
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
  max-width: 122px;
  font-size: 11px;
  line-height: 1.35;
  color: rgba(240, 244, 255, 0.8);
}

.weather-hud-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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

.weather-hud-drawer {
  display: grid;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.weather-hud-drawer-section {
  display: grid;
  gap: 8px;
}

.weather-hud-section-label {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(225, 234, 252, 0.64);
}

.weather-hud-mode-row,
.weather-hud-action-row {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.weather-hud-chip,
.weather-hud-preset {
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 11px;
}

.weather-hud-chip-active,
.weather-hud-preset-active {
  background: rgba(95, 132, 208, 0.34);
  border-color: rgba(144, 182, 255, 0.38);
}

.weather-hud-preset-grid {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.weather-hud-control-grid {
  display: grid;
  gap: 10px;
}

.weather-hud-field {
  display: grid;
  gap: 6px;
  font-size: 11px;
  color: rgba(232, 238, 255, 0.72);
}

.weather-hud-field-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.weather-hud-inline-value {
  color: rgba(245, 248, 255, 0.88);
}

.weather-hud-select {
  font-size: 11px;
  padding: 7px 10px;
  background: rgba(10, 22, 39, 0.32);
}

.weather-fx-root {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  isolation: isolate;
  transition:
    opacity 320ms ease,
    --weather-bg-start 1200ms ease,
    --weather-bg-mid 1200ms ease,
    --weather-bg-end 1200ms ease,
    --weather-glow 900ms ease,
    --weather-beam-color 900ms ease,
    --weather-horizon-color 900ms ease,
    --weather-sky-opacity 800ms ease,
    --weather-glow-opacity 800ms ease,
    --weather-beam-opacity 800ms ease,
    --weather-cloud-opacity 800ms ease,
    --weather-horizon-opacity 800ms ease,
    --weather-mist-opacity 800ms ease,
    --weather-fog-opacity 800ms ease,
    --weather-rain-opacity 600ms ease,
    --weather-snow-opacity 600ms ease,
    --weather-mote-opacity 600ms ease,
    --weather-flash-opacity 300ms ease;
}

.weather-fx-root.weather-visible {
  opacity: 1;
}

.weather-fx-root[data-kind="back"] {
  z-index: 1;
}

.weather-fx-root[data-kind="front"] {
  z-index: 24;
  mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.55) 46%, #000 78%);
}

.weather-fx-root.weather-hidden {
  display: none;
}

.weather-fx-root.weather-paused *,
.weather-fx-root.weather-paused *::before,
.weather-fx-root.weather-paused *::after {
  animation-play-state: paused !important;
}

.weather-fx-sky,
.weather-fx-glow,
.weather-fx-beams,
.weather-fx-clouds,
.weather-fx-horizon,
.weather-fx-mist,
.weather-fx-fog,
.weather-fx-motes,
.weather-fx-rain,
.weather-fx-snow,
.weather-fx-flash {
  position: absolute;
  inset: 0;
}

.weather-fx-sky {
  background: linear-gradient(180deg, var(--weather-bg-start) 0%, var(--weather-bg-mid) 46%, var(--weather-bg-end) 100%);
  opacity: var(--weather-sky-opacity);
  mix-blend-mode: soft-light;
  animation: weather-sky-shift 24s ease-in-out infinite alternate;
}

.weather-fx-glow {
  background:
    radial-gradient(circle at 18% 18%, var(--weather-glow), transparent 34%),
    radial-gradient(circle at 82% 22%, color-mix(in srgb, var(--weather-glow) 74%, white 14%), transparent 30%);
  opacity: var(--weather-glow-opacity);
  mix-blend-mode: screen;
  animation: weather-glow-drift 18s ease-in-out infinite alternate;
}

.weather-fx-beams {
  background:
    radial-gradient(circle at 20% 16%, var(--weather-beam-color), transparent 26%),
    linear-gradient(120deg, transparent 30%, color-mix(in srgb, var(--weather-beam-color) 58%, transparent) 48%, transparent 62%);
  opacity: var(--weather-beam-opacity);
  mix-blend-mode: screen;
  animation: weather-beam-sway 14s ease-in-out infinite alternate;
}

.weather-fx-horizon {
  background: linear-gradient(180deg, transparent 0%, transparent 48%, var(--weather-horizon-color) 100%);
  opacity: var(--weather-horizon-opacity);
  filter: blur(20px);
  transform: translateY(6%);
}

.weather-fx-cloud,
.weather-fx-fog-band,
.weather-fx-mist-plume,
.weather-fx-mote,
.weather-fx-rain-drop,
.weather-fx-snow-flake {
  position: absolute;
  will-change: transform, opacity;
}

.weather-fx-cloud {
  width: var(--cloud-width);
  height: var(--cloud-height);
  top: var(--cloud-top);
  left: var(--cloud-left);
  border-radius: 999px;
  background:
    radial-gradient(circle at 28% 35%, rgba(255, 255, 255, 0.34), transparent 44%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.03));
  filter: blur(var(--cloud-blur));
  opacity: calc(var(--weather-cloud-opacity) * var(--cloud-opacity-scale));
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
  filter: blur(20px);
  opacity: calc(var(--weather-fog-opacity) * var(--fog-opacity-scale));
  animation: weather-fog-drift var(--fog-duration) ease-in-out infinite;
  animation-delay: var(--fog-delay);
}

.weather-fx-mist-plume {
  width: var(--mist-width);
  height: var(--mist-height);
  left: var(--mist-left);
  bottom: var(--mist-bottom);
  border-radius: 999px;
  background: radial-gradient(circle at center, rgba(228, 238, 248, 0.24), transparent 68%);
  filter: blur(22px);
  opacity: calc(var(--weather-mist-opacity) * var(--mist-opacity-scale));
  animation: weather-mist-roll var(--mist-duration) ease-in-out infinite;
  animation-delay: var(--mist-delay);
}

.weather-fx-mote {
  left: var(--mote-left);
  top: var(--mote-top);
  width: var(--mote-size);
  height: var(--mote-size);
  border-radius: 50%;
  background: rgba(255, 247, 224, 0.95);
  box-shadow: 0 0 10px rgba(255, 245, 214, 0.4);
  opacity: calc(var(--weather-mote-opacity) * var(--mote-opacity-scale));
  animation: weather-mote-drift var(--mote-duration) ease-in-out infinite;
  animation-delay: var(--mote-delay);
}

.weather-fx-rain-drop {
  top: var(--drop-top);
  left: var(--drop-left);
  width: var(--drop-width);
  height: var(--drop-length);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), var(--weather-rain-color));
  border-radius: 999px;
  opacity: calc(var(--weather-rain-opacity) * var(--drop-opacity-scale));
  transform: rotate(11deg);
  filter: drop-shadow(0 0 6px rgba(191, 221, 255, 0.26));
  animation: weather-rain-fall var(--drop-duration) linear infinite;
  animation-delay: var(--drop-delay);
}

.weather-fx-rain-drop-front {
  filter: drop-shadow(0 0 8px rgba(209, 229, 255, 0.34));
}

.weather-fx-snow-flake {
  top: var(--flake-top);
  left: var(--flake-left);
  width: var(--flake-size);
  height: var(--flake-size);
  border-radius: 50%;
  background: var(--weather-snow-color);
  opacity: calc(var(--weather-snow-opacity) * var(--flake-opacity-scale));
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.35);
  animation: weather-snow-fall var(--flake-duration) linear infinite;
  animation-delay: var(--flake-delay);
}

.weather-fx-snow-flake-front {
  box-shadow: 0 0 14px rgba(255, 255, 255, 0.5);
}

.weather-fx-flash {
  background:
    radial-gradient(circle at 34% 22%, rgba(232, 241, 255, 0.9), transparent 32%),
    rgba(219, 231, 255, 0.48);
  opacity: 0;
  mix-blend-mode: screen;
}

.weather-fx-root.weather-storm-flash .weather-fx-flash {
  animation: weather-flash 220ms ease-out;
}

.weather-fx-root.weather-reduced-motion .weather-fx-cloud,
.weather-fx-root.weather-reduced-motion .weather-fx-fog-band,
.weather-fx-root.weather-reduced-motion .weather-fx-mist-plume,
.weather-fx-root.weather-reduced-motion .weather-fx-mote,
.weather-fx-root.weather-reduced-motion .weather-fx-rain-drop,
.weather-fx-root.weather-reduced-motion .weather-fx-snow-flake {
  animation-duration: 0.001ms;
  animation-iteration-count: 1;
}

.weather-fx-root.weather-reduced-motion .weather-fx-sky,
.weather-fx-root.weather-reduced-motion .weather-fx-glow,
.weather-fx-root.weather-reduced-motion .weather-fx-beams {
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

@keyframes weather-beam-sway {
  0% { transform: translate3d(-1vw, 0, 0) rotate(-1deg); }
  100% { transform: translate3d(1vw, -0.6vh, 0) rotate(1deg); }
}

@keyframes weather-cloud-drift {
  0% { transform: translateX(-12vw); }
  100% { transform: translateX(18vw); }
}

@keyframes weather-fog-drift {
  0%, 100% { transform: translate3d(-2vw, 0, 0); }
  50% { transform: translate3d(2vw, -1vh, 0); }
}

@keyframes weather-mist-roll {
  0%, 100% { transform: translate3d(-2vw, 1vh, 0); }
  50% { transform: translate3d(2vw, -1vh, 0); }
}

@keyframes weather-mote-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(0.95); }
  50% { transform: translate3d(var(--mote-drift-x), var(--mote-drift-y), 0) scale(1.12); }
}

@keyframes weather-rain-fall {
  0% { transform: translate3d(0, 0, 0) rotate(11deg); opacity: 0; }
  12% { opacity: calc(var(--weather-rain-opacity) * var(--drop-opacity-scale)); }
  100% { transform: translate3d(var(--drop-drift), 118vh, 0) rotate(11deg); opacity: 0; }
}

@keyframes weather-snow-fall {
  0% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(var(--flake-drift-mid), 56vh, 0) rotate(var(--flake-spin-mid)); }
  100% { transform: translate3d(var(--flake-drift-end), 116vh, 0) rotate(var(--flake-spin-end)); }
}

@keyframes weather-flash {
  0% { opacity: var(--weather-flash-opacity); }
  100% { opacity: 0; }
}

@media (max-width: 768px) {
  .weather-settings-manual-grid,
  .weather-settings-preset-grid {
    grid-template-columns: 1fr;
  }

  .weather-settings-actions,
  .weather-hud-mode-row,
  .weather-hud-action-row {
    grid-template-columns: 1fr;
  }

  .weather-hud-preset-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .weather-hud-time {
    font-size: 24px;
  }
}
`;

// src/frontend.ts
var GEAR_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98a7.79 7.79 0 000-1.96l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.88 7.88 0 00-1.69-.98l-.36-2.54a.5.5 0 00-.49-.42h-3.84a.5.5 0 00-.49.42l-.36 2.54c-.6.24-1.16.56-1.69.98l-2.39-.96a.5.5 0 00-.6.22L2.43 8.8a.5.5 0 00.12.64l2.03 1.58a7.79 7.79 0 000 1.96L2.55 14.56a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.6.22l2.39-.96c.53.42 1.09.74 1.69.98l.36 2.54a.5.5 0 00.49.42h3.84a.5.5 0 00.49-.42l.36-2.54c.6-.24 1.16-.56 1.69-.98l2.39.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z"/></svg>`;
var CHEVRON_DOWN_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`;
var CHEVRON_UP_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="m7.41 15.41 4.59-4.58 4.59 4.58L18 14l-6-6-6 6z"/></svg>`;
var HUD_COLLAPSED_SIZE = { width: 268, height: 172 };
var HUD_EXPANDED_SIZE = { width: 304, height: 360 };
var DEFAULT_WIDGET_POSITION = { x: 24, y: 96 };
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
function titleCase(value) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
function protectInteractive(element) {
  const stop = (event) => event.stopPropagation();
  element.addEventListener("pointerdown", stop);
  element.addEventListener("mousedown", stop);
  element.addEventListener("touchstart", stop);
}
function createFxMarkup(kind) {
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
    for (let index = 0;index < 10; index += 1) {
      clouds.appendChild(createSpan("weather-fx-cloud", {
        "--cloud-width": `${180 + Math.round(Math.random() * 260)}px`,
        "--cloud-height": `${46 + Math.round(Math.random() * 70)}px`,
        "--cloud-top": `${4 + index * 8 + Math.round(Math.random() * 5)}%`,
        "--cloud-left": `${-22 + Math.round(Math.random() * 102)}%`,
        "--cloud-duration": `${28 + Math.round(Math.random() * 34)}s`,
        "--cloud-delay": `${Math.round(Math.random() * -30)}s`,
        "--cloud-blur": `${4 + Math.round(Math.random() * 10)}px`,
        "--cloud-opacity-scale": `${(0.55 + Math.random() * 0.65).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 6; index += 1) {
      fog.appendChild(createSpan("weather-fx-fog-band", {
        "--fog-width": `${240 + Math.round(Math.random() * 320)}px`,
        "--fog-height": `${52 + Math.round(Math.random() * 44)}px`,
        "--fog-top": `${14 + index * 12 + Math.round(Math.random() * 5)}%`,
        "--fog-left": `${-14 + Math.round(Math.random() * 90)}%`,
        "--fog-duration": `${18 + Math.round(Math.random() * 16)}s`,
        "--fog-delay": `${Math.round(Math.random() * -18)}s`,
        "--fog-opacity-scale": `${(0.55 + Math.random() * 0.6).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 5; index += 1) {
      mist.appendChild(createSpan("weather-fx-mist-plume", {
        "--mist-width": `${260 + Math.round(Math.random() * 280)}px`,
        "--mist-height": `${80 + Math.round(Math.random() * 42)}px`,
        "--mist-left": `${-12 + Math.round(Math.random() * 88)}%`,
        "--mist-bottom": `${-3 + Math.round(Math.random() * 16)}%`,
        "--mist-duration": `${16 + Math.round(Math.random() * 14)}s`,
        "--mist-delay": `${Math.round(Math.random() * -16)}s`,
        "--mist-opacity-scale": `${(0.6 + Math.random() * 0.55).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 18; index += 1) {
      motes.appendChild(createSpan("weather-fx-mote", {
        "--mote-left": `${Math.round(Math.random() * 100)}%`,
        "--mote-top": `${18 + Math.round(Math.random() * 64)}%`,
        "--mote-size": `${2 + Math.random() * 4}px`,
        "--mote-duration": `${10 + Math.random() * 10}s`,
        "--mote-delay": `${Math.random() * -10}s`,
        "--mote-drift-x": `${(-2 + Math.random() * 4).toFixed(2)}vw`,
        "--mote-drift-y": `${(-1 + Math.random() * 3).toFixed(2)}vh`,
        "--mote-opacity-scale": `${(0.45 + Math.random() * 0.7).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 64; index += 1) {
      rain.appendChild(createSpan("weather-fx-rain-drop", {
        "--drop-left": `${Math.round(Math.random() * 104)}%`,
        "--drop-top": `${(-20 - Math.random() * 28).toFixed(2)}%`,
        "--drop-width": `${1 + Math.round(Math.random())}px`,
        "--drop-length": `${20 + Math.round(Math.random() * 28)}px`,
        "--drop-duration": `${0.9 + Math.random() * 0.85}s`,
        "--drop-delay": `${Math.random() * -2.3}s`,
        "--drop-drift": `${(-4.5 - Math.random() * 5.5).toFixed(2)}vw`,
        "--drop-opacity-scale": `${(0.4 + Math.random() * 0.7).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 42; index += 1) {
      snow.appendChild(createSpan("weather-fx-snow-flake", {
        "--flake-left": `${Math.round(Math.random() * 102)}%`,
        "--flake-top": `${(-18 - Math.random() * 18).toFixed(2)}%`,
        "--flake-size": `${2 + Math.random() * 4}px`,
        "--flake-duration": `${6.4 + Math.random() * 4.6}s`,
        "--flake-delay": `${Math.random() * -6}s`,
        "--flake-drift-mid": `${(-1.8 + Math.random() * 3.6).toFixed(2)}vw`,
        "--flake-drift-end": `${(-4 + Math.random() * 8).toFixed(2)}vw`,
        "--flake-spin-mid": `${Math.round(-18 + Math.random() * 36)}deg`,
        "--flake-spin-end": `${Math.round(-32 + Math.random() * 64)}deg`,
        "--flake-opacity-scale": `${(0.48 + Math.random() * 0.62).toFixed(2)}`
      }));
    }
  } else {
    const rain = document.createElement("div");
    rain.className = "weather-fx-rain weather-fx-rain-front";
    root.appendChild(rain);
    const snow = document.createElement("div");
    snow.className = "weather-fx-snow weather-fx-snow-front";
    root.appendChild(snow);
    for (let index = 0;index < 92; index += 1) {
      rain.appendChild(createSpan("weather-fx-rain-drop weather-fx-rain-drop-front", {
        "--drop-left": `${Math.round(Math.random() * 104)}%`,
        "--drop-top": `${(-24 - Math.random() * 30).toFixed(2)}%`,
        "--drop-width": `${2 + Math.round(Math.random())}px`,
        "--drop-length": `${26 + Math.round(Math.random() * 34)}px`,
        "--drop-duration": `${0.75 + Math.random() * 0.65}s`,
        "--drop-delay": `${Math.random() * -2.1}s`,
        "--drop-drift": `${(-7 - Math.random() * 8).toFixed(2)}vw`,
        "--drop-opacity-scale": `${(0.48 + Math.random() * 0.75).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 58; index += 1) {
      snow.appendChild(createSpan("weather-fx-snow-flake weather-fx-snow-flake-front", {
        "--flake-left": `${Math.round(Math.random() * 102)}%`,
        "--flake-top": `${(-18 - Math.random() * 20).toFixed(2)}%`,
        "--flake-size": `${4 + Math.random() * 6}px`,
        "--flake-duration": `${5.2 + Math.random() * 3.8}s`,
        "--flake-delay": `${Math.random() * -5.4}s`,
        "--flake-drift-mid": `${(-2.6 + Math.random() * 5.2).toFixed(2)}vw`,
        "--flake-drift-end": `${(-6 + Math.random() * 12).toFixed(2)}vw`,
        "--flake-spin-mid": `${Math.round(-28 + Math.random() * 56)}deg`,
        "--flake-spin-end": `${Math.round(-60 + Math.random() * 120)}deg`,
        "--flake-opacity-scale": `${(0.56 + Math.random() * 0.72).toFixed(2)}`
      }));
    }
  }
  root.appendChild(flash);
  return { root, host: null, releaseHost: null, kind };
}
function asHTMLElement(element) {
  return element instanceof HTMLElement ? element : null;
}
function closestByClassFragment(start, fragment) {
  if (!(start instanceof Element))
    return null;
  return asHTMLElement(start.closest(`[class*="${fragment}"]`));
}
function resolveInitialChatId() {
  const source = [window.location.pathname, window.location.search, window.location.hash].join(" ");
  const match = source.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i);
  return match?.[0] ?? null;
}
function resolveSceneHosts() {
  const backgroundLayer = asHTMLElement(document.querySelector('[class*="sceneBackgroundLayer"]'));
  const textContextLayer = asHTMLElement(document.querySelector('[class*="sceneTextContextLayer"]'));
  const scrollRegion = asHTMLElement(document.querySelector('[data-chat-scroll="true"]'));
  const chatColumnInner = closestByClassFragment(scrollRegion, "chatColumnInner") ?? (scrollRegion?.parentElement instanceof HTMLElement ? scrollRegion.parentElement : null);
  const chatColumn = closestByClassFragment(scrollRegion, "chatColumn") ?? (chatColumnInner?.parentElement instanceof HTMLElement ? chatColumnInner.parentElement : chatColumnInner);
  const sceneBody = closestByClassFragment(scrollRegion, "body") ?? (chatColumn?.parentElement instanceof HTMLElement ? chatColumn.parentElement : null);
  const sceneContainer = closestByClassFragment(backgroundLayer, "container") ?? closestByClassFragment(sceneBody, "container") ?? (sceneBody?.parentElement instanceof HTMLElement ? sceneBody.parentElement : backgroundLayer?.parentElement instanceof HTMLElement ? backgroundLayer.parentElement : null);
  const backHost = sceneContainer ?? sceneBody ?? backgroundLayer?.parentElement ?? chatColumn ?? chatColumnInner ?? scrollRegion;
  const preferredBackBefore = textContextLayer ?? sceneBody;
  const backBefore = preferredBackBefore?.parentElement === backHost ? preferredBackBefore : null;
  const frontHost = chatColumn ?? chatColumnInner ?? sceneBody ?? scrollRegion ?? backgroundLayer;
  return {
    backHost,
    backBefore,
    frontHost,
    frontBefore: null
  };
}
function readChatIdFromSettingsUpdate(payload) {
  if (!payload || typeof payload !== "object")
    return;
  const key = "key" in payload ? payload.key : undefined;
  if (key !== "activeChatId")
    return;
  const value = "value" in payload ? payload.value : undefined;
  if (typeof value !== "string" || !value.trim())
    return null;
  return value;
}
function resolveSceneTokens(state, intensity) {
  const paletteMap = {
    dawn: {
      start: "#20385f",
      mid: "#5a77a9",
      end: "#f0a56e",
      glow: "rgba(255, 203, 145, 0.82)",
      beam: "rgba(255, 218, 165, 0.48)",
      horizon: "rgba(255, 182, 125, 0.44)"
    },
    day: {
      start: "#4d77ad",
      mid: "#7fa8de",
      end: "#d8ebff",
      glow: "rgba(255, 243, 202, 0.78)",
      beam: "rgba(255, 244, 212, 0.44)",
      horizon: "rgba(185, 212, 244, 0.28)"
    },
    dusk: {
      start: "#221f4c",
      mid: "#68487a",
      end: "#f09067",
      glow: "rgba(255, 173, 128, 0.72)",
      beam: "rgba(255, 189, 150, 0.38)",
      horizon: "rgba(224, 149, 114, 0.34)"
    },
    night: {
      start: "#05101d",
      mid: "#10253c",
      end: "#274768",
      glow: "rgba(143, 180, 255, 0.48)",
      beam: "rgba(130, 164, 234, 0.2)",
      horizon: "rgba(74, 104, 154, 0.26)"
    },
    storm: {
      start: "#04101a",
      mid: "#13283a",
      end: "#33475f",
      glow: "rgba(188, 220, 255, 0.26)",
      beam: "rgba(168, 203, 236, 0.16)",
      horizon: "rgba(108, 139, 170, 0.26)"
    },
    mist: {
      start: "#213141",
      mid: "#586c7d",
      end: "#a7bac2",
      glow: "rgba(226, 240, 255, 0.32)",
      beam: "rgba(228, 239, 248, 0.18)",
      horizon: "rgba(206, 220, 228, 0.36)"
    },
    snow: {
      start: "#415b76",
      mid: "#7d93a8",
      end: "#e0e9f1",
      glow: "rgba(255, 252, 244, 0.66)",
      beam: "rgba(242, 245, 255, 0.32)",
      horizon: "rgba(229, 238, 248, 0.4)"
    }
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
    flashOpacity: 0.26
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
    flashOpacity: values.flashOpacity
  };
}
function getEffectiveLayerMode(prefs, state) {
  return prefs.layerMode === "auto" ? state.layer : prefs.layerMode;
}
function createHudWidget(ctx, initialPosition, expanded, callbacks) {
  const size = expanded ? HUD_EXPANDED_SIZE : HUD_COLLAPSED_SIZE;
  const widget = ctx.ui.createFloatWidget({
    width: size.width,
    height: size.height,
    initialPosition,
    snapToEdge: true,
    tooltip: "Story Weather HUD",
    chromeless: true
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
  const presetButtons = new Map;
  let storyButton;
  let manualButton;
  let layerSelect;
  let intensitySlider;
  let intensityValue;
  let pauseButton;
  let resumeButton;
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
      callbacks.onChangeLayerMode(layerSelect.value);
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
      callbacks.onChangeIntensity(Number.parseFloat(intensitySlider.value));
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
    resumeButton
  };
}
function getLiveDate(state) {
  if (state.timestampMs === null)
    return null;
  const elapsed = Math.max(0, Date.now() - state.updatedAt);
  return new Date(state.timestampMs + elapsed);
}
function syncHudState(hud, prefs, state, expanded) {
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
      year: "numeric"
    }).format(liveDate);
    hud.time.textContent = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit"
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
function setFxVisibility(root, visible) {
  root.root.classList.toggle("weather-hidden", !visible);
  root.root.classList.toggle("weather-visible", visible);
}
function applySceneState(root, state, prefs, reducedMotion) {
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
  root.root.style.setProperty("--weather-rain-color", state.condition === "storm" ? "rgba(212, 231, 255, 0.96)" : "rgba(190, 220, 255, 0.84)");
  root.root.style.setProperty("--weather-snow-color", state.palette === "night" ? "rgba(219, 232, 255, 0.92)" : "rgba(247, 250, 255, 0.95)");
  root.root.style.setProperty("--weather-particle-opacity-static", state.condition === "snow" ? String(clamp(tokens.snowOpacity * 0.2, 0.04, 0.22)) : String(clamp(tokens.rainOpacity * 0.12, 0.03, 0.18)));
}
function setup(ctx) {
  console.info("[weather_hud] frontend build 2026-03-24.7");
  const cleanups = [];
  const removeStyle = ctx.dom.addStyle(WEATHER_HUD_CSS);
  cleanups.push(removeStyle);
  let currentPrefs = DEFAULT_PREFS;
  let currentState = makeDefaultWeatherState();
  let activeChatId = resolveInitialChatId();
  let hudExpanded = false;
  const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  const getReducedMotion = () => currentPrefs.reducedMotion === "always" || currentPrefs.reducedMotion === "system" && motionMedia.matches;
  const sendManualState = (state) => {
    sendToBackend(ctx, { type: "set_manual_state", chatId: activeChatId, state });
  };
  const resumeStorySync = () => {
    sendToBackend(ctx, { type: "clear_manual_override", chatId: activeChatId });
  };
  const applyPreset = (presetId) => {
    const nextState = buildPresetWeatherState(presetId, currentState);
    if (!nextState)
      return;
    sendManualState(nextState);
  };
  const lockCurrentScene = () => {
    sendManualState({
      ...currentState,
      source: "manual"
    });
  };
  const settingsMount = ctx.ui.mount("settings_extensions");
  const settingsUI = createSettingsUI((payload) => {
    const message = payload;
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
  let hostSyncFrame = null;
  const managedHosts = new Map;
  const prepareHostStyles = (host) => {
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
  const retainHost = (host) => {
    const existing = managedHosts.get(host);
    if (existing) {
      existing.count += 1;
      return () => {
        const current = managedHosts.get(host);
        if (!current)
          return;
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
      if (!current)
        return;
      current.count -= 1;
      if (current.count <= 0) {
        current.restore();
        managedHosts.delete(host);
      }
    };
  };
  const detachFxRoot = (fxRoot) => {
    fxRoot.root.remove();
    fxRoot.host = null;
    if (fxRoot.releaseHost) {
      fxRoot.releaseHost();
      fxRoot.releaseHost = null;
    }
  };
  const attachFxRoot = (fxRoot, nextHost, before) => {
    if (!nextHost) {
      const hadHost = !!fxRoot.host || fxRoot.root.isConnected;
      detachFxRoot(fxRoot);
      return hadHost;
    }
    if (fxRoot.host === nextHost && fxRoot.root.parentElement === nextHost && (!before || fxRoot.root.nextElementSibling === before)) {
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
  const attachFxRoots = () => {
    hostSyncFrame = null;
    const nextHosts = resolveSceneHosts();
    const backChanged = attachFxRoot(backFx, nextHosts.backHost, nextHosts.backBefore);
    const frontChanged = attachFxRoot(frontFx, nextHosts.frontHost, nextHosts.frontBefore);
    return backChanged || frontChanged;
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
    if (backFx.host?.isConnected && frontFx.host?.isConnected && backFx.root.parentElement === backFx.host && frontFx.root.parentElement === frontFx.host) {
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
  let hud = null;
  let removeHudDragListener = null;
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
  const buildHud = (position) => {
    const nextPosition = position ?? hud?.widget.getPosition() ?? currentPrefs.widgetPosition ?? DEFAULT_WIDGET_POSITION;
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
      }
    });
    removeHudDragListener = hud.widget.onDragEnd((nextPositionFromDrag) => {
      sendToBackend(ctx, { type: "save_prefs", prefs: { widgetPosition: nextPositionFromDrag } });
    });
    syncHudState(hud, currentPrefs, currentState, hudExpanded);
  };
  buildHud(currentPrefs.widgetPosition);
  cleanups.push(() => destroyHud());
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
  const chatChangedUnsub = ctx.events.on("CHAT_CHANGED", (payload) => {
    const chatId = payload && typeof payload === "object" && "chatId" in payload ? payload.chatId ?? null : null;
    activeChatId = chatId;
    queueFxRootAttach();
    sendToBackend(ctx, { type: "chat_changed", chatId });
  });
  cleanups.push(chatChangedUnsub);
  const settingsChangedUnsub = ctx.events.on("SETTINGS_UPDATED", (payload) => {
    const nextChatId = readChatIdFromSettingsUpdate(payload);
    if (typeof nextChatId === "undefined")
      return;
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
    for (const cleanup of cleanups.reverse())
      cleanup();
  };
}
export {
  setup
};
