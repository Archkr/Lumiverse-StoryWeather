// src/shared.ts
var WEATHER_TAG_NAME = "weather-state";
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
var QUALITY_MODES = [
  { value: "performance", label: "Performance" },
  { value: "lite", label: "Lite" },
  { value: "standard", label: "Standard" },
  { value: "cinematic", label: "Cinematic" }
];
function createCodeBlock(text) {
  const code = document.createElement("pre");
  code.className = "weather-settings-code";
  code.textContent = text;
  return code;
}
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
  const promptSection = createSection("Prompt integration", "To make the main model emit the hidden weather tag consistently, add the recommended macro to your system prompt or preset, just like simtracker uses {{sim_tracker}}.");
  const effectsSection = createSection("Effects", "Overall ambience, density, and motion.");
  const placementSection = createSection("Placement", "Control whether the weather stays behind the chat, in front, or both.");
  const motionSection = createSection("Motion", "Fine-tune animation pacing without breaking story sync.");
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
  promptOptional.appendChild(createCodeBlock(`{{weather_state}}
{{weather_format}}`));
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
  storageHint.textContent = "Use clear saved weather if a tagged assistant message was deleted and you want the extension to forget the current scene for this chat.";
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
      status.textContent = state ? `${state.source === "manual" ? "manual" : "story"} / ${state.condition} ${state.temperature}` : "Waiting for story weather";
      preview.textContent = state ? `${state.date} at ${state.time} • ${state.summary} • ${state.wind} • layer ${prefs.layerMode === "auto" ? state.layer : prefs.layerMode}` : "The HUD will wake up as soon as the model emits its first weather-state tag.";
      const effectiveLayer = prefs.layerMode === "auto" ? state?.layer : prefs.layerMode;
      preview.textContent = state ? `${state.location} | ${state.date} at ${state.time} | ${state.summary} | ${state.wind} | layer ${effectiveLayer}` : "Add {{weather_tracker}} to the active prompt, then the HUD will wake up as soon as the model emits its first weather-state tag.";
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

@property --weather-cloud-core {
  syntax: "<color>";
  inherits: true;
  initial-value: rgba(237, 244, 255, 0.34);
}

@property --weather-cloud-edge {
  syntax: "<color>";
  inherits: true;
  initial-value: rgba(255, 255, 255, 0.12);
}

@property --weather-fog-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgba(236, 241, 255, 0.18);
}

@property --weather-mist-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgba(228, 238, 248, 0.24);
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

@property --weather-star-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

@property --weather-front-cloud-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

@property --weather-front-mist-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

@property --weather-rain-sheet-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

@property --weather-canopy-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

@property --weather-window-overlay-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

@property --weather-window-streak-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

.weather-settings-card {
  width: 100%;
  border: 1px solid var(--lumiverse-border);
  border-radius: calc(var(--lumiverse-radius) + 2px);
  background: color-mix(in srgb, var(--lumiverse-fill) 94%, transparent);
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
  padding: 12px;
}

.weather-settings-preview {
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--lumiverse-fill-subtle) 96%, transparent);
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 84%, transparent);
  font-size: 11px;
  line-height: 1.5;
  color: var(--lumiverse-text);
}

.weather-settings-section,
.weather-settings-manual-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 88%, transparent);
  background: color-mix(in srgb, var(--lumiverse-fill-subtle) 96%, transparent);
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
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lumiverse-text-muted);
}

.weather-settings-section-copy,
.weather-settings-manual-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--lumiverse-text-muted);
}

.weather-settings-copy-group {
  display: grid;
  gap: 6px;
}

.weather-settings-copy-title {
  font-size: 11px;
  color: color-mix(in srgb, var(--lumiverse-text) 92%, transparent);
}

.weather-settings-code {
  margin: 0;
  padding: 9px 11px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 90%, transparent);
  background: color-mix(in srgb, var(--lumiverse-fill) 96%, transparent);
  color: color-mix(in srgb, var(--lumiverse-text) 94%, transparent);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
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
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 92%, transparent);
  background: color-mix(in srgb, var(--lumiverse-fill) 92%, transparent);
  color: var(--lumiverse-text);
  font-size: 12px;
}

.weather-settings-button {
  cursor: pointer;
  transition: border-color var(--lumiverse-transition-fast), background var(--lumiverse-transition-fast);
}

.weather-settings-button:hover {
  border-color: var(--lumiverse-border-hover);
  background: color-mix(in srgb, var(--lumiverse-fill-subtle) 90%, transparent);
}

.weather-settings-button-primary {
  border-color: color-mix(in srgb, var(--lumiverse-primary, #82a8ff) 26%, var(--lumiverse-border));
  background: color-mix(in srgb, var(--lumiverse-primary, #82a8ff) 12%, var(--lumiverse-fill));
  color: var(--lumiverse-text);
}

.weather-settings-button-primary:hover {
  background: color-mix(in srgb, var(--lumiverse-primary, #82a8ff) 18%, var(--lumiverse-fill-subtle));
}

.weather-settings-button-danger {
  border-color: color-mix(in srgb, #ff9f83 26%, var(--lumiverse-border));
  background: color-mix(in srgb, #ff9f83 12%, var(--lumiverse-fill));
  color: var(--lumiverse-text);
}

.weather-settings-button-danger:hover {
  background: color-mix(in srgb, #ff9f83 18%, var(--lumiverse-fill-subtle));
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
  color: var(--lumiverse-text-muted);
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 88%, transparent);
  background: color-mix(in srgb, var(--lumiverse-fill) 94%, transparent);
}

.weather-settings-status-pill[data-mode="manual"] {
  color: var(--lumiverse-text);
  border-color: color-mix(in srgb, var(--lumiverse-primary, #82a8ff) 22%, var(--lumiverse-border));
  background: color-mix(in srgb, var(--lumiverse-primary, #82a8ff) 10%, var(--lumiverse-fill));
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
  border: 1px solid color-mix(in srgb, var(--lumiverse-border) 88%, transparent);
  background: color-mix(in srgb, var(--lumiverse-fill) 92%, transparent);
  color: var(--lumiverse-text);
  cursor: pointer;
  transition: border-color var(--lumiverse-transition-fast), background var(--lumiverse-transition-fast);
}

.weather-settings-preset:hover,
.weather-settings-preset-active {
  border-color: color-mix(in srgb, var(--lumiverse-primary, #82a8ff) 24%, var(--lumiverse-border));
  background: color-mix(in srgb, var(--lumiverse-primary, #82a8ff) 10%, var(--lumiverse-fill-subtle));
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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.weather-settings-actions .weather-settings-button {
  width: 100%;
}

.weather-settings-button-wide {
  grid-column: 1 / -1;
}

.weather-settings-storage-hint {
  padding-top: 2px;
  border-top: 1px dashed color-mix(in srgb, var(--lumiverse-border) 70%, transparent);
}

.weather-hud-widget {
  --weather-hud-shell-top: #16273d;
  --weather-hud-shell-mid: #17314f;
  --weather-hud-shell-bottom: #101d31;
  --weather-hud-aura-primary: rgba(255, 218, 162, 0.22);
  --weather-hud-aura-secondary: rgba(116, 164, 255, 0.18);
  --weather-hud-aura-soft: rgba(255, 255, 255, 0.07);
  --weather-hud-line: rgba(255, 255, 255, 0.14);
  --weather-hud-surface: rgba(255, 255, 255, 0.08);
  --weather-hud-surface-strong: rgba(255, 255, 255, 0.12);
  --weather-hud-surface-active: rgba(103, 145, 220, 0.3);
  --weather-hud-shadow: rgba(3, 10, 23, 0.38);
  --weather-hud-text-soft: rgba(234, 241, 255, 0.76);
  --weather-hud-text-muted: rgba(222, 231, 247, 0.62);
  --weather-hud-accent: #9dc0ff;
  --weather-hud-icon-bg: rgba(255, 255, 255, 0.11);
  --weather-hud-icon-color: #fff1c7;
  --weather-hud-scene-intensity: 1;
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 14px 14px 16px;
  box-sizing: border-box;
  border-radius: 26px;
  color: #f5f8ff;
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(140%);
  background:
    radial-gradient(circle at 84% 16%, var(--weather-hud-aura-primary), transparent 30%),
    radial-gradient(circle at 18% 112%, var(--weather-hud-aura-secondary), transparent 44%),
    linear-gradient(162deg, var(--weather-hud-shell-top) 0%, var(--weather-hud-shell-mid) 48%, var(--weather-hud-shell-bottom) 100%);
  border: 1px solid var(--weather-hud-line);
  box-shadow:
    0 22px 46px var(--weather-hud-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.weather-hud-widget::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 34%),
    radial-gradient(circle at 18% 20%, var(--weather-hud-aura-soft), transparent 26%),
    linear-gradient(120deg, transparent 28%, rgba(255, 255, 255, 0.05) 45%, transparent 60%);
  pointer-events: none;
}

.weather-hud-widget::after {
  content: "";
  position: absolute;
  inset: auto -10% -36% 26%;
  height: 66%;
  background: radial-gradient(circle at center, color-mix(in srgb, var(--weather-hud-aura-secondary) 90%, transparent) 0%, transparent 68%);
  opacity: calc(0.9 * var(--weather-hud-scene-intensity));
  filter: blur(30px);
  transform: translate3d(0, 0, 0);
  animation: weather-hud-drift 12s ease-in-out infinite alternate;
  pointer-events: none;
}

.weather-hud-widget[data-time-phase="dawn"] {
  --weather-hud-shell-top: #2d2f4a;
  --weather-hud-shell-mid: #5b4b6a;
  --weather-hud-shell-bottom: #25334a;
  --weather-hud-aura-primary: rgba(255, 196, 139, 0.34);
  --weather-hud-aura-secondary: rgba(121, 187, 255, 0.24);
  --weather-hud-aura-soft: rgba(255, 221, 176, 0.1);
  --weather-hud-accent: #ffcf9d;
}

.weather-hud-widget[data-time-phase="day"] {
  --weather-hud-shell-top: #1d3550;
  --weather-hud-shell-mid: #295075;
  --weather-hud-shell-bottom: #17283f;
  --weather-hud-aura-primary: rgba(255, 228, 162, 0.28);
  --weather-hud-aura-secondary: rgba(120, 193, 255, 0.26);
  --weather-hud-aura-soft: rgba(207, 227, 255, 0.1);
  --weather-hud-accent: #9ed0ff;
}

.weather-hud-widget[data-time-phase="dusk"] {
  --weather-hud-shell-top: #33294a;
  --weather-hud-shell-mid: #5b4165;
  --weather-hud-shell-bottom: #1b223b;
  --weather-hud-aura-primary: rgba(255, 176, 123, 0.28);
  --weather-hud-aura-secondary: rgba(139, 142, 255, 0.22);
  --weather-hud-aura-soft: rgba(255, 207, 161, 0.09);
  --weather-hud-accent: #ffb88d;
}

.weather-hud-widget[data-time-phase="night"] {
  --weather-hud-shell-top: #131d31;
  --weather-hud-shell-mid: #18253f;
  --weather-hud-shell-bottom: #0d1524;
  --weather-hud-aura-primary: rgba(138, 167, 255, 0.16);
  --weather-hud-aura-secondary: rgba(84, 123, 206, 0.18);
  --weather-hud-aura-soft: rgba(192, 214, 255, 0.06);
  --weather-hud-accent: #97b8ff;
}

.weather-hud-widget[data-condition="clear"] {
  --weather-hud-icon-bg: rgba(255, 248, 222, 0.12);
  --weather-hud-icon-color: #fff1b2;
}

.weather-hud-widget[data-condition="cloudy"] {
  --weather-hud-aura-primary: rgba(206, 221, 255, 0.16);
  --weather-hud-aura-secondary: rgba(102, 139, 190, 0.16);
  --weather-hud-icon-bg: rgba(228, 237, 255, 0.11);
  --weather-hud-icon-color: #eef4ff;
}

.weather-hud-widget[data-condition="rain"] {
  --weather-hud-shell-top: #17283d;
  --weather-hud-shell-mid: #20344d;
  --weather-hud-shell-bottom: #0e1624;
  --weather-hud-aura-primary: rgba(118, 155, 220, 0.16);
  --weather-hud-aura-secondary: rgba(88, 126, 174, 0.16);
  --weather-hud-aura-soft: rgba(188, 215, 255, 0.05);
  --weather-hud-accent: #8db9ff;
  --weather-hud-icon-bg: rgba(194, 220, 255, 0.12);
  --weather-hud-icon-color: #dfeeff;
}

.weather-hud-widget[data-condition="storm"] {
  --weather-hud-shell-top: #141b2d;
  --weather-hud-shell-mid: #1b2841;
  --weather-hud-shell-bottom: #0b111c;
  --weather-hud-aura-primary: rgba(123, 146, 255, 0.18);
  --weather-hud-aura-secondary: rgba(82, 108, 182, 0.2);
  --weather-hud-aura-soft: rgba(220, 230, 255, 0.05);
  --weather-hud-accent: #a7b9ff;
  --weather-hud-icon-bg: rgba(205, 215, 255, 0.1);
  --weather-hud-icon-color: #eef2ff;
}

.weather-hud-widget[data-condition="snow"] {
  --weather-hud-shell-top: #233244;
  --weather-hud-shell-mid: #324860;
  --weather-hud-shell-bottom: #182230;
  --weather-hud-aura-primary: rgba(225, 236, 255, 0.22);
  --weather-hud-aura-secondary: rgba(162, 203, 255, 0.18);
  --weather-hud-aura-soft: rgba(240, 246, 255, 0.09);
  --weather-hud-accent: #d9e9ff;
  --weather-hud-icon-bg: rgba(235, 243, 255, 0.14);
  --weather-hud-icon-color: #ffffff;
}

.weather-hud-widget[data-condition="fog"] {
  --weather-hud-shell-top: #23303e;
  --weather-hud-shell-mid: #314153;
  --weather-hud-shell-bottom: #1a2430;
  --weather-hud-aura-primary: rgba(214, 222, 232, 0.18);
  --weather-hud-aura-secondary: rgba(168, 184, 208, 0.15);
  --weather-hud-aura-soft: rgba(244, 246, 250, 0.06);
  --weather-hud-accent: #d5deeb;
  --weather-hud-icon-bg: rgba(232, 238, 245, 0.12);
  --weather-hud-icon-color: #f6f8fb;
}

.weather-hud-widget[data-source="manual"] {
  background:
    radial-gradient(circle at 84% 16%, color-mix(in srgb, var(--weather-hud-aura-primary) 90%, rgba(198, 226, 255, 0.26)) 0%, transparent 30%),
    radial-gradient(circle at 18% 112%, var(--weather-hud-aura-secondary), transparent 44%),
    linear-gradient(162deg, color-mix(in srgb, var(--weather-hud-shell-top) 90%, rgba(24, 49, 87, 0.7)) 0%, var(--weather-hud-shell-mid) 48%, var(--weather-hud-shell-bottom) 100%);
  border-color: color-mix(in srgb, var(--weather-hud-accent) 34%, rgba(255, 255, 255, 0.16));
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
  gap: 12px;
}

.weather-hud-titlewrap {
  display: grid;
  gap: 6px;
}

.weather-hud-eyebrow {
  font-size: 9px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--weather-hud-text-muted);
}

.weather-hud-source {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--weather-hud-line) 82%, transparent);
  background: color-mix(in srgb, var(--weather-hud-surface) 90%, transparent);
  color: rgba(242, 247, 255, 0.92);
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.weather-hud-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weather-hud-control,
.weather-hud-gear,
.weather-hud-chip,
.weather-hud-preset {
  border: 1px solid color-mix(in srgb, var(--weather-hud-line) 84%, transparent);
  background: color-mix(in srgb, var(--weather-hud-surface) 96%, transparent);
  color: inherit;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
}

.weather-hud-control:hover,
.weather-hud-gear:hover,
.weather-hud-chip:hover,
.weather-hud-preset:hover {
  background: color-mix(in srgb, var(--weather-hud-surface-strong) 96%, transparent);
  border-color: color-mix(in srgb, var(--weather-hud-accent) 18%, rgba(255, 255, 255, 0.2));
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
  padding: 7px 11px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.weather-hud-control-ghost {
  background: rgba(255, 255, 255, 0.04);
}

.weather-hud-control-active {
  background: color-mix(in srgb, var(--weather-hud-accent) 24%, rgba(255, 255, 255, 0.06));
  border-color: color-mix(in srgb, var(--weather-hud-accent) 34%, rgba(255, 255, 255, 0.18));
}

.weather-hud-control-danger {
  border-color: color-mix(in srgb, #ffab8f 28%, rgba(255, 255, 255, 0.16));
  background: color-mix(in srgb, #ffab8f 16%, rgba(255, 255, 255, 0.04));
}

.weather-hud-control-danger:hover {
  border-color: color-mix(in srgb, #ffb79c 42%, rgba(255, 255, 255, 0.18));
  background: color-mix(in srgb, #ffb79c 22%, rgba(255, 255, 255, 0.06));
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
  width: 32px;
  height: 32px;
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
  gap: 14px;
  align-items: end;
}

.weather-hud-primary {
  display: grid;
  gap: 4px;
}

.weather-hud-location {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: rgba(245, 248, 255, 0.92);
  max-width: 168px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-wrap: balance;
}

.weather-hud-date {
  font-size: 10px;
  color: var(--weather-hud-text-soft);
}

.weather-hud-time {
  font-size: 35px;
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 0.94;
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.14);
}

.weather-hud-wind {
  font-size: 11px;
  color: var(--weather-hud-text-muted);
}

.weather-hud-weather {
  display: grid;
  justify-items: end;
  gap: 6px;
  text-align: right;
}

.weather-hud-icon {
  width: 42px;
  height: 42px;
  border-radius: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, color-mix(in srgb, var(--weather-hud-icon-bg) 94%, white 6%), color-mix(in srgb, var(--weather-hud-icon-bg) 72%, transparent));
  color: var(--weather-hud-icon-color);
  box-shadow:
    0 10px 24px rgba(3, 10, 23, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.weather-hud-temp {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 0.94;
}

.weather-hud-summary {
  max-width: 132px;
  font-size: 11px;
  line-height: 1.35;
  color: var(--weather-hud-text-soft);
}

.weather-hud-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.weather-hud-badge {
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--weather-hud-line) 78%, transparent);
  background: color-mix(in srgb, var(--weather-hud-surface) 94%, transparent);
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(244, 247, 255, 0.84);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.weather-hud-drawer {
  display: grid;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid color-mix(in srgb, var(--weather-hud-line) 70%, transparent);
}

.weather-hud-drawer-section {
  display: grid;
  gap: 8px;
  padding: 11px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--weather-hud-line) 62%, transparent);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015));
}

.weather-hud-section-label {
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--weather-hud-text-muted);
}

.weather-hud-mode-row,
.weather-hud-action-row {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.weather-hud-action-wide {
  grid-column: 1 / -1;
}

.weather-hud-chip,
.weather-hud-preset {
  min-height: 35px;
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 11px;
}

.weather-hud-chip-active,
.weather-hud-preset-active {
  background: linear-gradient(180deg, color-mix(in srgb, var(--weather-hud-accent) 24%, transparent), color-mix(in srgb, var(--weather-hud-accent) 16%, rgba(255, 255, 255, 0.04)));
  border-color: color-mix(in srgb, var(--weather-hud-accent) 34%, rgba(255, 255, 255, 0.18));
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
  color: var(--weather-hud-text-soft);
}

.weather-hud-field-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.weather-hud-inline-value {
  color: rgba(245, 248, 255, 0.88);
  font-weight: 600;
}

.weather-hud-select {
  font-size: 11px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--weather-hud-line) 72%, transparent);
  background: rgba(7, 16, 28, 0.3);
  color: inherit;
}

.weather-hud-range {
  accent-color: var(--weather-hud-accent);
}

.weather-hud-widget[data-expanded="false"] {
  gap: 10px;
}

.weather-hud-widget[data-expanded="false"] .weather-hud-footer {
  gap: 6px;
}

.weather-hud-widget[data-expanded="false"] .weather-hud-summary {
  max-width: 118px;
}

.weather-hud-widget[data-paused="true"]::after {
  animation-play-state: paused;
  opacity: calc(0.55 * var(--weather-hud-scene-intensity));
}

@keyframes weather-hud-drift {
  0% {
    transform: translate3d(-5%, 0, 0) scale(1);
  }
  100% {
    transform: translate3d(6%, -4%, 0) scale(1.08);
  }
}

.weather-fx-root {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  isolation: isolate;
  contain: layout paint style;
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
    --weather-star-opacity 800ms ease,
    --weather-front-cloud-opacity 800ms ease,
    --weather-front-mist-opacity 800ms ease,
    --weather-rain-sheet-opacity 600ms ease,
    --weather-canopy-opacity 800ms ease,
    --weather-window-overlay-opacity 500ms ease,
    --weather-window-streak-opacity 500ms ease,
    --weather-flash-opacity 300ms ease;
}

.weather-fx-root.weather-visible {
  opacity: 1;
}

.weather-fx-root[data-kind="back"] {
  z-index: 0;
}

.weather-fx-root[data-kind="front"] {
  z-index: 24;
  mask-image: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.78) 12%, #000 34%, #000 100%);
}

.weather-fx-root[data-kind="back"] .weather-fx-window {
  z-index: 14;
}

.weather-fx-root.weather-hidden {
  display: none;
}

.weather-fx-root:not([data-palette="night"]):not([data-palette="dawn"]):not([data-palette="dusk"]) .weather-fx-stars,
.weather-fx-root[data-condition="clear"] .weather-fx-canopy,
.weather-fx-root[data-condition="clear"] .weather-fx-rain,
.weather-fx-root[data-condition="clear"] .weather-fx-rain-sheet,
.weather-fx-root[data-condition="clear"] .weather-fx-snow,
.weather-fx-root[data-condition="clear"] .weather-fx-fog,
.weather-fx-root[data-kind="front"] .weather-fx-window,
.weather-fx-root[data-condition="clear"] .weather-fx-window,
.weather-fx-root[data-condition="cloudy"] .weather-fx-window-streak,
.weather-fx-root[data-condition="cloudy"] .weather-fx-window-bead,
.weather-fx-root[data-condition="cloudy"] .weather-fx-rain,
.weather-fx-root[data-condition="cloudy"] .weather-fx-rain-sheet,
.weather-fx-root[data-condition="cloudy"] .weather-fx-snow,
.weather-fx-root[data-condition="rain"] .weather-fx-snow,
.weather-fx-root[data-condition="rain"] .weather-fx-stars,
.weather-fx-root[data-condition="rain"] .weather-fx-beams,
.weather-fx-root[data-condition="storm"] .weather-fx-snow,
.weather-fx-root[data-condition="storm"] .weather-fx-stars,
.weather-fx-root[data-condition="storm"] .weather-fx-beams,
.weather-fx-root[data-condition="snow"] .weather-fx-rain,
.weather-fx-root[data-condition="snow"] .weather-fx-rain-sheet,
.weather-fx-root[data-condition="fog"] .weather-fx-rain,
.weather-fx-root[data-condition="fog"] .weather-fx-rain-sheet,
.weather-fx-root[data-condition="fog"] .weather-fx-snow,
.weather-fx-root[data-condition="fog"] .weather-fx-stars,
.weather-fx-root[data-condition="fog"] .weather-fx-beams,
.weather-fx-root[data-condition="fog"] .weather-fx-motes,
.weather-fx-root[data-kind="front"][data-condition="clear"] .weather-fx-front-haze,
.weather-fx-root[data-kind="front"][data-condition="clear"] .weather-fx-front-clouds,
.weather-fx-root[data-kind="front"][data-condition="clear"] .weather-fx-front-mist,
.weather-fx-root[data-kind="front"][data-condition="cloudy"] .weather-fx-front-haze,
.weather-fx-root[data-kind="front"][data-condition="cloudy"] .weather-fx-front-mist,
.weather-fx-root[data-quality="lite"] .weather-fx-window-streak,
.weather-fx-root[data-quality="lite"] .weather-fx-window-bead,
.weather-fx-root[data-quality="performance"] .weather-fx-window,
.weather-fx-root[data-quality="performance"] .weather-fx-stars,
.weather-fx-root[data-quality="performance"] .weather-fx-cloud-shadows,
.weather-fx-root[data-quality="performance"] .weather-fx-front-clouds,
.weather-fx-root[data-quality="performance"] .weather-fx-front-mist,
.weather-fx-root[data-quality="performance"] .weather-fx-rain-sheet,
.weather-fx-root[data-quality="performance"] .weather-fx-motes,
.weather-fx-root[data-quality="lite"] .weather-fx-cloud-shadows,
.weather-fx-root[data-kind="front"][data-quality="lite"] .weather-fx-front-clouds {
  display: none;
}

.weather-fx-root.weather-paused *,
.weather-fx-root.weather-paused *::before,
.weather-fx-root.weather-paused *::after {
  animation-play-state: paused !important;
}

.weather-fx-sky,
.weather-fx-stars,
.weather-fx-glow,
.weather-fx-beams,
.weather-fx-canopy,
.weather-fx-cloud-shadows,
.weather-fx-clouds,
.weather-fx-horizon,
.weather-fx-mist,
.weather-fx-fog,
.weather-fx-motes,
.weather-fx-front-haze,
.weather-fx-front-clouds,
.weather-fx-front-mist,
.weather-fx-rain-sheet,
.weather-fx-window,
.weather-fx-rain,
.weather-fx-snow,
.weather-fx-flash {
  position: absolute;
  inset: 0;
  contain: layout paint;
}

.weather-fx-sky {
  background:
    radial-gradient(circle at 50% -12%, color-mix(in srgb, var(--weather-glow) 26%, transparent), transparent 36%),
    linear-gradient(180deg, var(--weather-bg-start) 0%, var(--weather-bg-mid) 42%, var(--weather-bg-end) 100%);
  opacity: var(--weather-sky-opacity);
  mix-blend-mode: normal;
  filter: saturate(1.1) brightness(1.04);
  animation: weather-sky-shift 28s ease-in-out infinite alternate;
}

.weather-fx-sky::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 26%),
    repeating-linear-gradient(112deg, rgba(255, 255, 255, 0.014) 0 2px, transparent 2px 18px);
  opacity: calc(var(--weather-sky-opacity) * 0.48);
  mix-blend-mode: soft-light;
}

.weather-fx-stars {
  mix-blend-mode: screen;
}

.weather-fx-stars::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 18%, rgba(214, 232, 255, 0.2), transparent 26%),
    radial-gradient(circle at 22% 14%, rgba(190, 218, 255, 0.12), transparent 20%);
  opacity: calc(var(--weather-star-opacity) * 0.46);
  filter: blur(28px);
}

.weather-fx-star {
  position: absolute;
  left: var(--star-left);
  top: var(--star-top);
  width: var(--star-size);
  height: var(--star-size);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.98) 0%, rgba(213, 229, 255, 0.64) 44%, transparent 72%);
  box-shadow:
    0 0 10px rgba(202, 224, 255, 0.36),
    0 0 18px rgba(202, 224, 255, 0.16);
  opacity: calc(var(--weather-star-opacity) * var(--star-opacity-scale));
  animation: weather-star-twinkle var(--star-duration) ease-in-out infinite;
  animation-delay: var(--star-delay);
}

.weather-fx-glow {
  background:
    radial-gradient(circle at 18% 18%, var(--weather-glow), transparent 34%),
    radial-gradient(circle at 82% 22%, color-mix(in srgb, var(--weather-glow) 74%, white 14%), transparent 30%),
    radial-gradient(circle at 56% 10%, color-mix(in srgb, var(--weather-glow) 26%, transparent), transparent 28%);
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

.weather-fx-canopy {
  top: -8%;
  left: -10%;
  right: -10%;
  height: 52%;
  opacity: var(--weather-canopy-opacity);
  background:
    radial-gradient(ellipse at 14% 26%, color-mix(in srgb, var(--weather-cloud-edge) 58%, transparent), transparent 24%),
    radial-gradient(ellipse at 52% 18%, color-mix(in srgb, var(--weather-cloud-core) 74%, rgba(6, 12, 22, 0.84)), transparent 48%),
    radial-gradient(ellipse at 84% 24%, color-mix(in srgb, var(--weather-cloud-core) 68%, rgba(7, 12, 22, 0.8)), transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--weather-cloud-core) 82%, rgba(6, 12, 22, 0.9)) 0%, color-mix(in srgb, var(--weather-cloud-core) 56%, rgba(8, 14, 24, 0.78)) 54%, transparent 100%);
  filter: blur(28px) saturate(0.94);
  transform: translateY(-4%);
  mix-blend-mode: multiply;
  animation: weather-canopy-drift 34s ease-in-out infinite alternate;
}

.weather-fx-canopy::before {
  content: "";
  position: absolute;
  inset: 18% 4% auto;
  height: 56%;
  background:
    radial-gradient(ellipse at 18% 42%, rgba(255, 255, 255, 0.09), transparent 26%),
    radial-gradient(ellipse at 64% 36%, rgba(255, 255, 255, 0.07), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 76%);
  opacity: 0.42;
  filter: blur(16px);
  mix-blend-mode: screen;
}

.weather-fx-canopy::after {
  content: "";
  position: absolute;
  inset: auto 0 -24%;
  height: 58%;
  background: linear-gradient(180deg, transparent 0%, rgba(8, 13, 22, 0.5) 72%, transparent 100%);
  filter: blur(22px);
  opacity: 0.72;
}

.weather-fx-cloud-shadows {
  opacity: calc(var(--weather-cloud-opacity) * 0.9);
  mix-blend-mode: multiply;
}

.weather-fx-cloud-shadow-band {
  position: absolute;
  width: var(--shadow-width);
  height: var(--shadow-height);
  top: var(--shadow-top);
  left: var(--shadow-left);
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(8, 13, 22, 0.42) 0%, transparent 72%);
  filter: blur(26px);
  opacity: var(--shadow-opacity-scale);
  animation: weather-shadow-drift var(--shadow-duration) linear infinite;
  animation-delay: var(--shadow-delay);
}

.weather-fx-horizon {
  background:
    linear-gradient(180deg, transparent 0%, transparent 44%, var(--weather-horizon-color) 100%),
    radial-gradient(circle at 50% 118%, color-mix(in srgb, var(--weather-horizon-color) 78%, transparent), transparent 54%);
  opacity: var(--weather-horizon-opacity);
  filter: blur(24px);
  transform: translateY(6%);
}

.weather-fx-cloud,
.weather-fx-fog-band,
.weather-fx-mist-plume,
.weather-fx-mote,
.weather-fx-window-bead,
.weather-fx-window-streak,
.weather-fx-rain-sheet-line,
.weather-fx-rain-drop,
.weather-fx-snow-flake {
  position: absolute;
  will-change: transform, opacity;
}

.weather-fx-clouds::before {
  content: "";
  position: absolute;
  inset: -14% -10% 42%;
  background:
    radial-gradient(circle at 18% 28%, color-mix(in srgb, var(--weather-cloud-edge) 70%, transparent), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, var(--weather-cloud-core) 86%, rgba(8, 14, 24, 0.18)) 0%, transparent 100%);
  opacity: calc(var(--weather-cloud-opacity) * 0.62);
  filter: blur(38px);
  transform: translateY(-10%);
}

.weather-fx-clouds::after {
  content: "";
  position: absolute;
  inset: 20% -8% 18%;
  background:
    linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--weather-cloud-core) 16%, rgba(8, 14, 24, 0.24)) 62%, transparent 100%),
    radial-gradient(circle at 42% 72%, color-mix(in srgb, var(--weather-cloud-core) 18%, rgba(8, 14, 24, 0.22)), transparent 42%);
  opacity: calc(var(--weather-cloud-opacity) * 0.34);
  filter: blur(44px);
}

.weather-fx-cloud {
  width: var(--cloud-width);
  height: var(--cloud-height);
  top: var(--cloud-top);
  left: var(--cloud-left);
  filter: blur(var(--cloud-blur));
  opacity: calc(var(--weather-cloud-opacity) * var(--cloud-opacity-scale));
  animation: weather-cloud-drift var(--cloud-duration) linear infinite;
  animation-delay: var(--cloud-delay);
  transform: translateZ(0);
}

.weather-fx-cloud-front {
  opacity: calc(var(--weather-front-cloud-opacity) * var(--cloud-opacity-scale));
  mix-blend-mode: screen;
}

.weather-fx-cloud-core,
.weather-fx-cloud-shadow,
.weather-fx-cloud-highlight,
.weather-fx-cloud-lobe {
  position: absolute;
}

.weather-fx-cloud-shadow {
  inset: 40% 6% 0;
  border-radius: 48% 52% 50% 50% / 58% 58% 42% 42%;
  background: linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--weather-cloud-core) 16%, rgba(8, 14, 24, 0.78)) 72%);
  opacity: 0.84;
  filter: blur(16px);
}

.weather-fx-cloud-core {
  inset: 24% 8% 12%;
  border-radius: 46% 54% 40% 60% / 50% 44% 56% 50%;
  background:
    radial-gradient(circle at 30% 26%, color-mix(in srgb, var(--weather-cloud-edge) 84%, white 8%), transparent 42%),
    linear-gradient(180deg, color-mix(in srgb, var(--weather-cloud-edge) 22%, transparent) 0%, color-mix(in srgb, var(--weather-cloud-core) 94%, rgba(8, 14, 24, 0.24)) 76%, transparent 100%);
  opacity: 0.9;
}

.weather-fx-cloud-highlight {
  inset: 12% 16% auto 12%;
  height: 42%;
  background: radial-gradient(ellipse at 30% 50%, rgba(255, 255, 255, 0.52) 0%, transparent 66%);
  opacity: 0.72;
  filter: blur(8px);
  mix-blend-mode: screen;
}

.weather-fx-cloud-lobe {
  width: var(--cloud-lobe-width);
  height: var(--cloud-lobe-height);
  left: var(--cloud-lobe-left);
  top: var(--cloud-lobe-top);
  border-radius: 47% 53% 46% 54% / 54% 48% 52% 46%;
  background:
    radial-gradient(circle at 32% 26%, color-mix(in srgb, var(--weather-cloud-edge) 82%, white 4%), transparent 54%),
    linear-gradient(180deg, color-mix(in srgb, var(--weather-cloud-edge) 58%, transparent) 0%, color-mix(in srgb, var(--weather-cloud-core) 100%, transparent) 72%, color-mix(in srgb, var(--weather-cloud-core) 22%, rgba(10, 16, 28, 0.28)) 100%);
  opacity: var(--cloud-lobe-opacity);
  box-shadow:
    inset 0 -12px 20px rgba(0, 0, 0, 0.08),
    inset 0 8px 16px rgba(255, 255, 255, 0.04);
  transform: rotate(var(--cloud-lobe-rotate));
}

.weather-fx-front-clouds::before {
  content: "";
  position: absolute;
  inset: -8% -18% 36%;
  background:
    radial-gradient(circle at 22% 24%, color-mix(in srgb, var(--weather-cloud-edge) 54%, transparent), transparent 26%),
    radial-gradient(circle at 76% 12%, color-mix(in srgb, var(--weather-cloud-core) 34%, transparent), transparent 28%);
  opacity: calc(var(--weather-front-cloud-opacity) * 0.48);
  filter: blur(34px);
}

.weather-fx-front-clouds::after {
  content: "";
  position: absolute;
  inset: -4% -10% 42%;
  background: linear-gradient(180deg, color-mix(in srgb, var(--weather-cloud-core) 34%, rgba(8, 14, 24, 0.3)) 0%, transparent 100%);
  opacity: calc(var(--weather-front-cloud-opacity) * 0.54);
  filter: blur(28px);
}

.weather-fx-fog-band {
  width: var(--fog-width);
  height: var(--fog-height);
  top: var(--fog-top);
  left: var(--fog-left);
  border-radius: 999px;
  background:
    linear-gradient(90deg, transparent, var(--weather-fog-color), transparent),
    radial-gradient(circle at 40% 50%, color-mix(in srgb, var(--weather-fog-color) 88%, white 4%), transparent 62%);
  filter: blur(24px);
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
  background:
    radial-gradient(circle at 28% 42%, color-mix(in srgb, var(--weather-mist-color) 92%, white 8%), transparent 58%),
    radial-gradient(circle at center, var(--weather-mist-color), transparent 70%);
  filter: blur(26px);
  opacity: calc(var(--weather-mist-opacity) * var(--mist-opacity-scale));
  animation: weather-mist-roll var(--mist-duration) ease-in-out infinite;
  animation-delay: var(--mist-delay);
}

.weather-fx-front-haze {
  background:
    linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--weather-mist-color) 12%, transparent) 54%, color-mix(in srgb, var(--weather-mist-color) 34%, transparent) 100%),
    radial-gradient(circle at 50% 118%, color-mix(in srgb, var(--weather-mist-color) 54%, transparent), transparent 48%);
  opacity: calc(var(--weather-front-mist-opacity) * 0.64);
  filter: blur(12px);
  mix-blend-mode: screen;
  animation: weather-front-haze-drift 16s ease-in-out infinite alternate;
}

.weather-fx-mist-plume-front {
  opacity: calc(var(--weather-front-mist-opacity) * var(--mist-opacity-scale));
  mix-blend-mode: screen;
  filter: blur(24px);
}

.weather-fx-window {
  opacity: var(--weather-window-overlay-opacity);
  mix-blend-mode: screen;
  backdrop-filter: blur(2px) saturate(118%);
}

.weather-fx-window::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 10%, rgba(255, 255, 255, 0.05) 42%, rgba(255, 255, 255, 0.12) 72%, rgba(255, 255, 255, 0.18) 100%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.12), transparent 18%, transparent 82%, rgba(255, 255, 255, 0.12)),
    radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.16), transparent 18%),
    radial-gradient(circle at 82% 16%, rgba(255, 255, 255, 0.13), transparent 18%);
  opacity: 0.7;
}

.weather-fx-window::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 112%, color-mix(in srgb, var(--weather-mist-color) 38%, transparent), transparent 38%),
    radial-gradient(circle at 22% 102%, rgba(255, 255, 255, 0.09), transparent 26%),
    radial-gradient(circle at 78% 100%, rgba(255, 255, 255, 0.08), transparent 24%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent 16%, transparent 84%, rgba(255, 255, 255, 0.08)),
    repeating-linear-gradient(94deg, rgba(255, 255, 255, 0.03) 0 2px, transparent 2px 22px);
  opacity: 0.6;
  filter: blur(10px);
}

.weather-fx-window-streak {
  left: var(--window-left);
  top: var(--window-top);
  width: var(--window-width);
  height: var(--window-length);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.72) 18%, rgba(196, 222, 255, 0.4) 42%, rgba(255, 255, 255, 0) 100%);
  opacity: calc(var(--weather-window-streak-opacity) * var(--window-opacity-scale));
  filter: blur(1px) drop-shadow(0 0 6px rgba(214, 232, 255, 0.22));
  animation: weather-window-drip var(--window-duration) linear infinite;
  animation-delay: var(--window-delay);
}

.weather-fx-window-streak::before {
  content: "";
  position: absolute;
  inset: -10px -2px auto;
  height: 10px;
  border-radius: 999px;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.75) 0%, rgba(204, 226, 255, 0.24) 64%, transparent 100%);
  opacity: 0.86;
}

.weather-fx-window-streak::after {
  content: "";
  position: absolute;
  inset: 20% -1px auto;
  height: calc(100% - 18%);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
  opacity: 0.46;
}

.weather-fx-window-streak-deep {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(246, 250, 255, 0.84) 10%, rgba(204, 227, 255, 0.58) 34%, rgba(153, 190, 236, 0.18) 68%, rgba(255, 255, 255, 0) 100%);
  filter: blur(1.1px) drop-shadow(0 0 8px rgba(196, 220, 255, 0.28));
}

.weather-fx-window-bead {
  left: var(--bead-left);
  top: var(--bead-top);
  width: var(--bead-size);
  height: calc(var(--bead-size) * var(--bead-stretch));
  border-radius: 46% 54% 52% 48% / 38% 42% 58% 62%;
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.96) 0%, rgba(244, 249, 255, 0.74) 18%, rgba(174, 207, 245, 0.34) 52%, rgba(255, 255, 255, 0) 74%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(181, 213, 246, 0.2));
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.7),
    inset 0 -1px 2px rgba(117, 150, 188, 0.26),
    0 0 8px rgba(208, 228, 252, 0.2);
  opacity: calc(var(--weather-window-streak-opacity) * 0.7 * var(--bead-opacity-scale));
  filter: blur(0.4px);
  animation: weather-window-bead-drift var(--bead-duration) ease-in-out infinite;
  animation-delay: var(--bead-delay);
}

.weather-fx-window-bead::before {
  content: "";
  position: absolute;
  inset: 58% 36% -32% 36%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
  opacity: 0.44;
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

.weather-fx-rain-sheet-line {
  top: var(--sheet-top);
  left: var(--sheet-left);
  width: var(--sheet-width);
  height: var(--sheet-length);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), color-mix(in srgb, var(--weather-rain-color) 92%, white 8%) 26%, rgba(255, 255, 255, 0));
  opacity: calc(var(--weather-rain-sheet-opacity) * var(--sheet-opacity-scale));
  filter: blur(1px) drop-shadow(0 0 6px rgba(206, 228, 255, 0.14));
  transform: rotate(13deg);
  animation: weather-rain-sheet-fall var(--sheet-duration) linear infinite;
  animation-delay: var(--sheet-delay);
}

.weather-fx-rain-drop {
  top: var(--drop-top);
  left: var(--drop-left);
  width: var(--drop-width);
  height: var(--drop-length);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), color-mix(in srgb, var(--weather-rain-color) 96%, white 6%) 24%, color-mix(in srgb, var(--weather-rain-color) 18%, transparent) 100%);
  border-radius: 999px;
  opacity: calc(var(--weather-rain-opacity) * var(--drop-opacity-scale));
  transform: rotate(11deg);
  filter: drop-shadow(0 0 4px rgba(191, 221, 255, 0.22));
  animation: weather-rain-fall var(--drop-duration) linear infinite;
  animation-delay: var(--drop-delay);
}

.weather-fx-rain-drop::after {
  content: "";
  position: absolute;
  inset: 16% auto 10% 28%;
  width: 1px;
  background: rgba(255, 255, 255, 0.42);
  border-radius: 999px;
  opacity: 0.7;
}

.weather-fx-rain-drop-front {
  filter: drop-shadow(0 0 5px rgba(209, 229, 255, 0.28));
}

.weather-fx-snow-flake {
  top: var(--flake-top);
  left: var(--flake-left);
  width: var(--flake-size);
  height: var(--flake-size);
  border-radius: 50%;
  background: var(--weather-snow-color);
  opacity: calc(var(--weather-snow-opacity) * var(--flake-opacity-scale));
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.26);
  animation: weather-snow-fall var(--flake-duration) linear infinite;
  animation-delay: var(--flake-delay);
}

.weather-fx-snow-flake::before,
.weather-fx-snow-flake::after {
  content: "";
  position: absolute;
  inset: 45% -36%;
  border-radius: 999px;
  background: color-mix(in srgb, var(--weather-snow-color) 82%, white 18%);
  opacity: 0.34;
}

.weather-fx-snow-flake::after {
  transform: rotate(90deg);
}

.weather-fx-snow-flake-front {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.32);
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

.weather-fx-root[data-condition="clear"] .weather-fx-glow {
  opacity: calc(var(--weather-glow-opacity) * 1.08);
}

.weather-fx-root[data-condition="clear"] .weather-fx-beams {
  opacity: calc(var(--weather-beam-opacity) * 1.08);
}

.weather-fx-root[data-condition="cloudy"] .weather-fx-canopy {
  mix-blend-mode: normal;
  filter: blur(24px);
}

.weather-fx-root[data-condition="cloudy"] .weather-fx-cloud-front {
  mix-blend-mode: normal;
}

.weather-fx-root[data-condition="rain"] .weather-fx-clouds::before,
.weather-fx-root[data-condition="storm"] .weather-fx-clouds::before {
  inset: -14% -8% 44%;
  opacity: calc(var(--weather-cloud-opacity) * 0.86);
  filter: blur(42px);
}

.weather-fx-root[data-condition="rain"] .weather-fx-canopy,
.weather-fx-root[data-condition="storm"] .weather-fx-canopy {
  top: -10%;
  height: 60%;
  mix-blend-mode: multiply;
}

.weather-fx-root[data-condition="rain"] .weather-fx-cloud-front,
.weather-fx-root[data-condition="storm"] .weather-fx-cloud-front {
  mix-blend-mode: normal;
}

.weather-fx-root[data-condition="rain"] .weather-fx-window::after,
.weather-fx-root[data-condition="storm"] .weather-fx-window::after {
  background:
    radial-gradient(circle at 50% 112%, color-mix(in srgb, var(--weather-mist-color) 48%, transparent), transparent 38%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent 18%, transparent 82%, rgba(255, 255, 255, 0.08)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent 16%, rgba(255, 255, 255, 0.04) 78%, rgba(255, 255, 255, 0.1) 100%);
}

.weather-fx-root[data-condition="storm"] .weather-fx-canopy::after {
  opacity: 0.94;
  filter: blur(26px);
}

.weather-fx-root[data-condition="storm"] .weather-fx-horizon {
  opacity: calc(var(--weather-horizon-opacity) * 1.1);
}

.weather-fx-root[data-condition="snow"] .weather-fx-window::before,
.weather-fx-root[data-condition="fog"] .weather-fx-window::before {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), transparent 16%, rgba(255, 255, 255, 0.08) 62%, rgba(255, 255, 255, 0.16) 100%),
    radial-gradient(circle at 20% 14%, rgba(255, 255, 255, 0.14), transparent 20%),
    radial-gradient(circle at 80% 18%, rgba(255, 255, 255, 0.12), transparent 20%);
  opacity: 0.74;
}

.weather-fx-root[data-condition="snow"] .weather-fx-window::after,
.weather-fx-root[data-condition="fog"] .weather-fx-window::after {
  background:
    radial-gradient(circle at 50% 112%, color-mix(in srgb, var(--weather-mist-color) 64%, transparent), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 18%, rgba(255, 255, 255, 0.1) 100%);
  opacity: 0.62;
}

.weather-fx-root[data-condition="fog"] .weather-fx-front-haze,
.weather-fx-root[data-condition="snow"] .weather-fx-front-haze {
  opacity: calc(var(--weather-front-mist-opacity) * 0.9);
}

.weather-fx-root[data-condition="fog"] .weather-fx-window,
.weather-fx-root[data-condition="snow"] .weather-fx-window {
  mix-blend-mode: screen;
}

.weather-fx-root[data-kind="front"] .weather-fx-rain,
.weather-fx-root[data-kind="front"] .weather-fx-snow,
.weather-fx-root[data-kind="front"] .weather-fx-rain-sheet {
  mix-blend-mode: screen;
}

.weather-fx-root[data-quality="lite"] .weather-fx-canopy {
  filter: blur(20px);
}

.weather-fx-root[data-quality="lite"] .weather-fx-window {
  opacity: calc(var(--weather-window-overlay-opacity) * 0.72);
}

.weather-fx-root[data-quality="performance"] .weather-fx-canopy {
  filter: blur(18px);
}

.weather-fx-root[data-quality="cinematic"] .weather-fx-window {
  opacity: calc(var(--weather-window-overlay-opacity) * 1.08);
}

.weather-fx-root[data-quality="cinematic"] .weather-fx-window-bead {
  opacity: calc(var(--weather-window-streak-opacity) * 0.82 * var(--bead-opacity-scale));
}

.weather-fx-root[data-quality="cinematic"] .weather-fx-canopy::before {
  opacity: 0.58;
}

.weather-fx-root.weather-reduced-motion .weather-fx-cloud,
.weather-fx-root.weather-reduced-motion .weather-fx-canopy,
.weather-fx-root.weather-reduced-motion .weather-fx-cloud-shadow-band,
.weather-fx-root.weather-reduced-motion .weather-fx-fog-band,
.weather-fx-root.weather-reduced-motion .weather-fx-mist-plume,
.weather-fx-root.weather-reduced-motion .weather-fx-mote,
.weather-fx-root.weather-reduced-motion .weather-fx-star,
.weather-fx-root.weather-reduced-motion .weather-fx-window-bead,
.weather-fx-root.weather-reduced-motion .weather-fx-window-streak,
.weather-fx-root.weather-reduced-motion .weather-fx-rain-sheet-line,
.weather-fx-root.weather-reduced-motion .weather-fx-rain-drop,
.weather-fx-root.weather-reduced-motion .weather-fx-snow-flake {
  animation-duration: 0.001ms;
  animation-iteration-count: 1;
}

.weather-fx-root.weather-reduced-motion .weather-fx-sky,
.weather-fx-root.weather-reduced-motion .weather-fx-glow,
.weather-fx-root.weather-reduced-motion .weather-fx-beams,
.weather-fx-root.weather-reduced-motion .weather-fx-front-haze {
  animation: none;
}

.weather-fx-root.weather-reduced-motion .weather-fx-rain-drop,
.weather-fx-root.weather-reduced-motion .weather-fx-rain-sheet-line,
.weather-fx-root.weather-reduced-motion .weather-fx-snow-flake {
  opacity: var(--weather-particle-opacity-static, 0.08);
}

@keyframes weather-sky-shift {
  0% { transform: scale(1) translate3d(0, 0, 0); }
  100% { transform: scale(1.04) translate3d(0, -1.6vh, 0); }
}

@keyframes weather-star-twinkle {
  0%, 100% { transform: scale(0.92); opacity: calc(var(--weather-star-opacity) * var(--star-opacity-scale)); }
  50% { transform: scale(1.16); opacity: calc(var(--weather-star-opacity) * var(--star-opacity-scale)); }
}

@keyframes weather-glow-drift {
  0% { transform: translate3d(-1vw, 0, 0) scale(1); }
  100% { transform: translate3d(1vw, -1vh, 0) scale(1.08); }
}

@keyframes weather-beam-sway {
  0% { transform: translate3d(-1vw, 0, 0) rotate(-1deg); }
  100% { transform: translate3d(1vw, -0.6vh, 0) rotate(1deg); }
}

@keyframes weather-canopy-drift {
  0% { transform: translate3d(-2vw, -3%, 0) scale(1); }
  100% { transform: translate3d(2vw, -1%, 0) scale(1.04); }
}

@keyframes weather-shadow-drift {
  0% { transform: translate3d(-12vw, 0, 0); }
  100% { transform: translate3d(14vw, -1.4vh, 0); }
}

@keyframes weather-cloud-drift {
  0% { transform: translate3d(-18vw, 0, 0) scale(var(--cloud-depth, 1)); }
  100% { transform: translate3d(18vw, var(--cloud-rise, 0), 0) scale(var(--cloud-depth, 1)); }
}

@keyframes weather-fog-drift {
  0%, 100% { transform: translate3d(-2vw, 0, 0); }
  50% { transform: translate3d(2vw, -1vh, 0); }
}

@keyframes weather-mist-roll {
  0%, 100% { transform: translate3d(-2vw, 1vh, 0); }
  50% { transform: translate3d(2vw, -1vh, 0); }
}

@keyframes weather-front-haze-drift {
  0% { transform: translate3d(-2vw, 0.6vh, 0) scale(1); }
  100% { transform: translate3d(2vw, -0.8vh, 0) scale(1.04); }
}

@keyframes weather-window-drip {
  0% { transform: translate3d(0, 0, 0) scaleY(0.92); opacity: 0; }
  8% { opacity: calc(var(--weather-window-streak-opacity) * var(--window-opacity-scale)); }
  100% { transform: translate3d(var(--window-drift), 110vh, 0) scaleY(1.06); opacity: 0; }
}

@keyframes weather-window-bead-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(0.98); }
  35% { transform: translate3d(calc(var(--bead-drift) * 0.35), calc(var(--bead-drop) * 0.2), 0) scale(1.02); }
  100% { transform: translate3d(var(--bead-drift), var(--bead-drop), 0) scale(0.96); }
}

@keyframes weather-mote-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(0.95); }
  50% { transform: translate3d(var(--mote-drift-x), var(--mote-drift-y), 0) scale(1.12); }
}

@keyframes weather-rain-sheet-fall {
  0% { transform: translate3d(0, 0, 0) rotate(13deg); opacity: 0; }
  14% { opacity: calc(var(--weather-rain-sheet-opacity) * var(--sheet-opacity-scale)); }
  100% { transform: translate3d(var(--sheet-drift), 118vh, 0) rotate(13deg); opacity: 0; }
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
var HUD_COLLAPSED_SIZE = { width: 272, height: 176 };
var HUD_EXPANDED_SIZE = { width: 320, height: 474 };
var DEFAULT_WIDGET_POSITION = { x: 24, y: 96 };
var WEATHER_QUALITY_OPTIONS = [
  { value: "performance", label: "Performance" },
  { value: "lite", label: "Lite" },
  { value: "standard", label: "Standard" },
  { value: "cinematic", label: "Cinematic" }
];
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
function parseHourFromTimeLabel(value) {
  const match = value.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match)
    return null;
  let hour = Number.parseInt(match[1], 10);
  if (!Number.isFinite(hour))
    return null;
  const meridiem = (match[3] || "").toUpperCase();
  if (meridiem === "AM") {
    if (hour === 12)
      hour = 0;
  } else if (meridiem === "PM") {
    if (hour < 12)
      hour += 12;
  }
  return clamp(hour, 0, 23);
}
function resolveHudTimePhase(state, liveDate) {
  if (state.palette === "dawn" || state.palette === "day" || state.palette === "dusk" || state.palette === "night") {
    return state.palette;
  }
  const hour = liveDate?.getHours() ?? parseHourFromTimeLabel(state.time);
  if (hour === null)
    return "day";
  if (hour >= 5 && hour < 8)
    return "dawn";
  if (hour >= 8 && hour < 18)
    return "day";
  if (hour >= 18 && hour < 21)
    return "dusk";
  return "night";
}
function formatHudPaletteLabel(state, phase) {
  if (state.palette === "storm" || state.palette === "mist" || state.palette === "snow") {
    return titleCase(state.palette);
  }
  return titleCase(phase);
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
function createDiv(className) {
  const element = document.createElement("div");
  element.className = className;
  return element;
}
function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
function createCloudCluster(className, styles, lobeCount) {
  const cloud = createSpan(className, styles);
  cloud.appendChild(createSpan("weather-fx-cloud-shadow", {}));
  cloud.appendChild(createSpan("weather-fx-cloud-core", {}));
  for (let index = 0;index < lobeCount; index += 1) {
    cloud.appendChild(createSpan("weather-fx-cloud-lobe", {
      "--cloud-lobe-width": `${randomBetween(18, 38).toFixed(2)}%`,
      "--cloud-lobe-height": `${randomBetween(42, 82).toFixed(2)}%`,
      "--cloud-lobe-left": `${randomBetween(-6, 76).toFixed(2)}%`,
      "--cloud-lobe-top": `${randomBetween(2, 44).toFixed(2)}%`,
      "--cloud-lobe-rotate": `${Math.round(randomBetween(-16, 16))}deg`,
      "--cloud-lobe-opacity": `${randomBetween(0.76, 1.18).toFixed(2)}`
    }));
  }
  cloud.appendChild(createSpan("weather-fx-cloud-highlight", {}));
  return cloud;
}
function createFxMarkup(kind) {
  const root = document.createElement("div");
  root.className = "weather-fx-root";
  root.dataset.kind = kind;
  const flash = document.createElement("div");
  flash.className = "weather-fx-flash";
  if (kind === "back") {
    const sky = createDiv("weather-fx-sky");
    root.appendChild(sky);
    const stars = createDiv("weather-fx-stars");
    root.appendChild(stars);
    const glow = createDiv("weather-fx-glow");
    root.appendChild(glow);
    const beams = createDiv("weather-fx-beams");
    root.appendChild(beams);
    const canopy = createDiv("weather-fx-canopy");
    root.appendChild(canopy);
    const cloudShadows = createDiv("weather-fx-cloud-shadows");
    root.appendChild(cloudShadows);
    const clouds = createDiv("weather-fx-clouds");
    root.appendChild(clouds);
    const horizon = createDiv("weather-fx-horizon");
    root.appendChild(horizon);
    const mist = createDiv("weather-fx-mist");
    root.appendChild(mist);
    const fog = createDiv("weather-fx-fog");
    root.appendChild(fog);
    const motes = createDiv("weather-fx-motes");
    root.appendChild(motes);
    const rain = createDiv("weather-fx-rain");
    root.appendChild(rain);
    const snow = createDiv("weather-fx-snow");
    root.appendChild(snow);
    const windowLayer = createDiv("weather-fx-window");
    root.appendChild(windowLayer);
    for (let index = 0;index < 18; index += 1) {
      stars.appendChild(createSpan("weather-fx-star", {
        "--star-left": `${randomBetween(0, 100).toFixed(2)}%`,
        "--star-top": `${randomBetween(4, 72).toFixed(2)}%`,
        "--star-size": `${randomBetween(1, 3.4).toFixed(2)}px`,
        "--star-duration": `${randomBetween(3.8, 8.2).toFixed(2)}s`,
        "--star-delay": `${randomBetween(-7, 0).toFixed(2)}s`,
        "--star-opacity-scale": `${randomBetween(0.42, 1).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 3; index += 1) {
      cloudShadows.appendChild(createSpan("weather-fx-cloud-shadow-band", {
        "--shadow-width": `${randomBetween(280, 620).toFixed(2)}px`,
        "--shadow-height": `${randomBetween(80, 170).toFixed(2)}px`,
        "--shadow-top": `${randomBetween(10, 54).toFixed(2)}%`,
        "--shadow-left": `${randomBetween(-16, 76).toFixed(2)}%`,
        "--shadow-duration": `${randomBetween(34, 60).toFixed(2)}s`,
        "--shadow-delay": `${randomBetween(-28, 0).toFixed(2)}s`,
        "--shadow-opacity-scale": `${randomBetween(0.5, 0.94).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 5; index += 1) {
      clouds.appendChild(createCloudCluster("weather-fx-cloud", {
        "--cloud-width": `${randomBetween(240, 520).toFixed(2)}px`,
        "--cloud-height": `${randomBetween(90, 188).toFixed(2)}px`,
        "--cloud-top": `${(4 + index * 7 + randomBetween(-2, 4)).toFixed(2)}%`,
        "--cloud-left": `${randomBetween(-24, 82).toFixed(2)}%`,
        "--cloud-duration": `${randomBetween(32, 62).toFixed(2)}s`,
        "--cloud-delay": `${randomBetween(-32, 0).toFixed(2)}s`,
        "--cloud-blur": `${randomBetween(2, 8).toFixed(2)}px`,
        "--cloud-opacity-scale": `${randomBetween(0.56, 1.1).toFixed(2)}`,
        "--cloud-depth": `${randomBetween(0.88, 1.08).toFixed(2)}`,
        "--cloud-rise": `${randomBetween(-1.4, 2).toFixed(2)}vh`
      }, 3 + Math.floor(Math.random() * 2)));
    }
    for (let index = 0;index < 4; index += 1) {
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
    for (let index = 0;index < 3; index += 1) {
      mist.appendChild(createSpan("weather-fx-mist-plume", {
        "--mist-width": `${randomBetween(260, 560).toFixed(2)}px`,
        "--mist-height": `${randomBetween(78, 138).toFixed(2)}px`,
        "--mist-left": `${randomBetween(-14, 82).toFixed(2)}%`,
        "--mist-bottom": `${randomBetween(-6, 16).toFixed(2)}%`,
        "--mist-duration": `${randomBetween(16, 30).toFixed(2)}s`,
        "--mist-delay": `${randomBetween(-16, 0).toFixed(2)}s`,
        "--mist-opacity-scale": `${randomBetween(0.64, 1.12).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 10; index += 1) {
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
    for (let index = 0;index < 40; index += 1) {
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
    for (let index = 0;index < 26; index += 1) {
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
    for (let index = 0;index < 14; index += 1) {
      windowLayer.appendChild(createSpan("weather-fx-window-streak weather-fx-window-streak-deep", {
        "--window-left": `${randomBetween(-4, 102).toFixed(2)}%`,
        "--window-top": `${randomBetween(-18, 24).toFixed(2)}%`,
        "--window-width": `${randomBetween(2.2, 5.6).toFixed(2)}px`,
        "--window-length": `${randomBetween(110, 240).toFixed(2)}px`,
        "--window-duration": `${randomBetween(5.8, 11.8).toFixed(2)}s`,
        "--window-delay": `${randomBetween(-10, 0).toFixed(2)}s`,
        "--window-drift": `${randomBetween(-0.9, 1.1).toFixed(2)}vw`,
        "--window-opacity-scale": `${randomBetween(0.42, 0.96).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 20; index += 1) {
      windowLayer.appendChild(createSpan("weather-fx-window-bead", {
        "--bead-left": `${randomBetween(0, 100).toFixed(2)}%`,
        "--bead-top": `${randomBetween(4, 88).toFixed(2)}%`,
        "--bead-size": `${randomBetween(5, 15).toFixed(2)}px`,
        "--bead-stretch": `${randomBetween(1, 1.9).toFixed(2)}`,
        "--bead-duration": `${randomBetween(7.5, 16).toFixed(2)}s`,
        "--bead-delay": `${randomBetween(-12, 0).toFixed(2)}s`,
        "--bead-drift": `${randomBetween(-0.55, 0.65).toFixed(2)}vw`,
        "--bead-drop": `${randomBetween(4, 20).toFixed(2)}vh`,
        "--bead-opacity-scale": `${randomBetween(0.34, 0.94).toFixed(2)}`
      }));
    }
  } else {
    const frontHaze = createDiv("weather-fx-front-haze");
    root.appendChild(frontHaze);
    const frontClouds = createDiv("weather-fx-front-clouds");
    root.appendChild(frontClouds);
    const frontMist = createDiv("weather-fx-front-mist");
    root.appendChild(frontMist);
    const rainSheet = createDiv("weather-fx-rain-sheet");
    root.appendChild(rainSheet);
    const rain = createDiv("weather-fx-rain weather-fx-rain-front");
    root.appendChild(rain);
    const snow = createDiv("weather-fx-snow weather-fx-snow-front");
    root.appendChild(snow);
    for (let index = 0;index < 3; index += 1) {
      frontClouds.appendChild(createCloudCluster("weather-fx-cloud weather-fx-cloud-front", {
        "--cloud-width": `${randomBetween(320, 680).toFixed(2)}px`,
        "--cloud-height": `${randomBetween(120, 240).toFixed(2)}px`,
        "--cloud-top": `${randomBetween(-8, 40).toFixed(2)}%`,
        "--cloud-left": `${randomBetween(-26, 78).toFixed(2)}%`,
        "--cloud-duration": `${randomBetween(28, 54).toFixed(2)}s`,
        "--cloud-delay": `${randomBetween(-26, 0).toFixed(2)}s`,
        "--cloud-blur": `${randomBetween(8, 20).toFixed(2)}px`,
        "--cloud-opacity-scale": `${randomBetween(0.48, 0.86).toFixed(2)}`,
        "--cloud-depth": `${randomBetween(1.02, 1.2).toFixed(2)}`,
        "--cloud-rise": `${randomBetween(-1.2, 1.6).toFixed(2)}vh`
      }, 3 + Math.floor(Math.random() * 2)));
    }
    for (let index = 0;index < 2; index += 1) {
      frontMist.appendChild(createSpan("weather-fx-mist-plume weather-fx-mist-plume-front", {
        "--mist-width": `${randomBetween(320, 640).toFixed(2)}px`,
        "--mist-height": `${randomBetween(110, 220).toFixed(2)}px`,
        "--mist-left": `${randomBetween(-18, 70).toFixed(2)}%`,
        "--mist-bottom": `${randomBetween(-8, 18).toFixed(2)}%`,
        "--mist-duration": `${randomBetween(12, 22).toFixed(2)}s`,
        "--mist-delay": `${randomBetween(-12, 0).toFixed(2)}s`,
        "--mist-opacity-scale": `${randomBetween(0.68, 1.08).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 10; index += 1) {
      rainSheet.appendChild(createSpan("weather-fx-rain-sheet-line", {
        "--sheet-left": `${randomBetween(-8, 108).toFixed(2)}%`,
        "--sheet-top": `${randomBetween(-24, 18).toFixed(2)}%`,
        "--sheet-width": `${randomBetween(3, 7).toFixed(2)}px`,
        "--sheet-length": `${randomBetween(100, 220).toFixed(2)}px`,
        "--sheet-duration": `${randomBetween(0.8, 1.35).toFixed(2)}s`,
        "--sheet-delay": `${randomBetween(-1.8, 0).toFixed(2)}s`,
        "--sheet-drift": `${randomBetween(-10, -5.6).toFixed(2)}vw`,
        "--sheet-opacity-scale": `${randomBetween(0.3, 0.84).toFixed(2)}`
      }));
    }
    for (let index = 0;index < 56; index += 1) {
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
    for (let index = 0;index < 34; index += 1) {
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
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function parseTagAttributes(raw) {
  const out = {};
  const attrRe = /([a-zA-Z_:][a-zA-Z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match;
  while ((match = attrRe.exec(raw)) !== null) {
    const key = match[1] || "";
    if (!key)
      continue;
    out[key] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return out;
}
function extractWeatherTagFromContent(content) {
  const tagName = escapeRegex(WEATHER_TAG_NAME);
  const tagRe = new RegExp(String.raw`<${tagName}\b([^>]*?)(?:\/>|>[\s\S]*?<\/${tagName}>)`, "ig");
  let match;
  let lastMatch = null;
  while ((match = tagRe.exec(content)) !== null) {
    lastMatch = {
      attrs: parseTagAttributes(match[1] || ""),
      fullMatch: match[0] || ""
    };
  }
  return lastMatch;
}
function closestByClassFragment(start, fragment) {
  if (!(start instanceof Element))
    return null;
  return asHTMLElement(start.closest(`[class*="${fragment}"]`));
}
function listUsableAncestors(start) {
  const nodes = [];
  let current = start;
  while (current && current !== document.body && current !== document.documentElement) {
    nodes.push(current);
    current = current.parentElement instanceof HTMLElement ? current.parentElement : null;
  }
  return nodes;
}
function lowestCommonAncestor(...nodes) {
  const filtered = nodes.filter((node) => node instanceof HTMLElement);
  if (filtered.length === 0)
    return null;
  if (filtered.length === 1)
    return filtered[0];
  const chains = filtered.map((node) => listUsableAncestors(node));
  for (const candidate of chains[0]) {
    if (chains.every((chain) => chain.includes(candidate))) {
      return candidate;
    }
  }
  return null;
}
function scoreSceneHost(host) {
  if (!(host instanceof HTMLElement))
    return -1;
  const rect = host.getBoundingClientRect();
  const width = Math.max(0, rect.width || host.clientWidth);
  const height = Math.max(0, rect.height || host.clientHeight);
  if (width < 120 || height < 120)
    return -1;
  const viewportWidth = Math.max(window.innerWidth, 1);
  const viewportHeight = Math.max(window.innerHeight, 1);
  const widthRatio = Math.min(1.25, width / viewportWidth);
  const heightRatio = Math.min(1.25, height / viewportHeight);
  const centeredness = 1 - Math.min(1, Math.abs(rect.left + rect.width / 2 - viewportWidth / 2) / viewportWidth);
  return widthRatio * 4 + heightRatio * 2 + centeredness;
}
function pickBestSceneHost(candidates) {
  let best = null;
  let bestScore = -1;
  const seen = new Set;
  for (const candidate of candidates) {
    if (!(candidate instanceof HTMLElement) || seen.has(candidate))
      continue;
    seen.add(candidate);
    const score = scoreSceneHost(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
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
  const sceneCommonAncestor = lowestCommonAncestor(backgroundLayer, sceneBody, chatColumn, chatColumnInner, scrollRegion);
  const backHost = pickBestSceneHost([
    sceneCommonAncestor,
    sceneContainer,
    backgroundLayer?.parentElement instanceof HTMLElement ? backgroundLayer.parentElement : null,
    textContextLayer?.parentElement instanceof HTMLElement ? textContextLayer.parentElement : null,
    sceneBody,
    ...listUsableAncestors(sceneCommonAncestor).slice(0, 4)
  ]) ?? sceneContainer ?? sceneBody ?? backgroundLayer?.parentElement ?? chatColumn ?? chatColumnInner ?? scrollRegion;
  const preferredBackBefore = textContextLayer ?? sceneBody;
  const backBefore = preferredBackBefore?.parentElement === backHost ? preferredBackBefore : null;
  const frontHost = chatColumn ?? chatColumnInner ?? scrollRegion ?? textContextLayer ?? sceneBody ?? backgroundLayer;
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
function readMessageContext(payload) {
  if (!payload || typeof payload !== "object")
    return null;
  const value = payload;
  const nestedMessage = value.message && typeof value.message === "object" ? value.message : {};
  const nestedChat = value.chat && typeof value.chat === "object" ? value.chat : {};
  const chatIdCandidates = [value.chatId, value.chat_id, nestedMessage.chatId, nestedMessage.chat_id, nestedChat.id, value.id];
  const messageIdCandidates = [value.messageId, value.message_id, nestedMessage.id, nestedMessage.messageId, value.id];
  const content = (typeof nestedMessage.content === "string" ? nestedMessage.content : null) || (typeof value.content === "string" ? value.content : null);
  const chatId = chatIdCandidates.find((candidate) => typeof candidate === "string" && candidate.trim());
  const messageId = messageIdCandidates.find((candidate) => typeof candidate === "string" && candidate.trim());
  const isUser = typeof nestedMessage.is_user === "boolean" ? nestedMessage.is_user : typeof value.is_user === "boolean" ? value.is_user : null;
  return {
    chatId: chatId ?? null,
    content,
    messageId: messageId ?? null,
    isUser
  };
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
  const basePalette = paletteMap[state.palette];
  const palette = state.condition === "storm" ? paletteMap.storm : state.condition === "rain" ? {
    start: state.palette === "night" ? "#07131f" : "#102032",
    mid: state.palette === "night" ? "#1d3148" : "#324b67",
    end: state.palette === "night" ? "#41566e" : "#61748b",
    glow: "rgba(176, 206, 240, 0.22)",
    beam: "rgba(135, 165, 198, 0.1)",
    horizon: "rgba(120, 147, 174, 0.24)"
  } : state.condition === "cloudy" && (state.palette === "dawn" || state.palette === "dusk") ? {
    ...basePalette,
    end: state.palette === "dawn" ? "#9baec3" : "#7f90a6",
    glow: "rgba(214, 224, 238, 0.24)",
    beam: "rgba(176, 191, 209, 0.12)",
    horizon: "rgba(154, 169, 187, 0.24)"
  } : basePalette;
  const baseIntensity = clamp(intensity, 0, 1.5);
  let cloudCore = "rgba(237, 244, 255, 0.34)";
  let cloudEdge = "rgba(255, 255, 255, 0.12)";
  let fogColor = "rgba(236, 241, 255, 0.18)";
  let mistColor = "rgba(228, 238, 248, 0.24)";
  const values = {
    skyOpacity: 0.08,
    glowOpacity: 0.13,
    beamOpacity: 0.14,
    cloudOpacity: 0.1,
    horizonOpacity: 0.06,
    mistOpacity: 0.03,
    fogOpacity: 0,
    rainOpacity: 0,
    snowOpacity: 0,
    moteOpacity: 0.06,
    flashOpacity: 0.26,
    starOpacity: state.palette === "night" ? 0.46 : state.palette === "dusk" ? 0.1 : state.palette === "dawn" ? 0.06 : 0.02,
    frontCloudOpacity: 0.04,
    frontMistOpacity: 0.03,
    rainSheetOpacity: 0,
    canopyOpacity: 0.04,
    windowOverlayOpacity: 0,
    windowStreakOpacity: 0
  };
  switch (state.condition) {
    case "cloudy":
      values.skyOpacity = 0.17;
      values.glowOpacity = 0.04;
      values.beamOpacity = 0;
      values.cloudOpacity = 0.6;
      values.horizonOpacity = 0.12;
      values.mistOpacity = 0.08;
      values.moteOpacity = 0.02;
      values.starOpacity = state.palette === "night" ? 0.08 : 0;
      values.frontCloudOpacity = 0.12;
      values.frontMistOpacity = 0.05;
      values.canopyOpacity = 0.44;
      cloudCore = "rgba(174, 189, 208, 0.44)";
      cloudEdge = "rgba(224, 232, 242, 0.11)";
      fogColor = "rgba(196, 210, 228, 0.2)";
      mistColor = "rgba(204, 216, 229, 0.18)";
      break;
    case "rain":
      values.skyOpacity = 0.24;
      values.glowOpacity = 0.02;
      values.beamOpacity = 0;
      values.cloudOpacity = 0.82;
      values.horizonOpacity = 0.22;
      values.mistOpacity = 0.26;
      values.fogOpacity = 0.16;
      values.rainOpacity = 0.88;
      values.moteOpacity = 0;
      values.starOpacity = 0;
      values.frontCloudOpacity = 0.16;
      values.frontMistOpacity = 0.2;
      values.rainSheetOpacity = 0.4;
      values.canopyOpacity = 0.72;
      values.windowOverlayOpacity = 0.22;
      values.windowStreakOpacity = 0.54;
      cloudCore = "rgba(70, 86, 105, 0.58)";
      cloudEdge = "rgba(136, 154, 177, 0.1)";
      fogColor = "rgba(145, 162, 182, 0.22)";
      mistColor = "rgba(154, 169, 186, 0.24)";
      break;
    case "storm":
      values.skyOpacity = 0.28;
      values.glowOpacity = 0.015;
      values.beamOpacity = 0;
      values.cloudOpacity = 0.96;
      values.horizonOpacity = 0.28;
      values.mistOpacity = 0.32;
      values.fogOpacity = 0.22;
      values.rainOpacity = 1.08;
      values.flashOpacity = 0.64;
      values.moteOpacity = 0;
      values.starOpacity = 0;
      values.frontCloudOpacity = 0.22;
      values.frontMistOpacity = 0.24;
      values.rainSheetOpacity = 0.66;
      values.canopyOpacity = 0.92;
      values.windowOverlayOpacity = 0.3;
      values.windowStreakOpacity = 0.72;
      cloudCore = "rgba(42, 55, 74, 0.72)";
      cloudEdge = "rgba(102, 121, 148, 0.1)";
      fogColor = "rgba(116, 134, 154, 0.24)";
      mistColor = "rgba(135, 150, 170, 0.26)";
      break;
    case "snow":
      values.skyOpacity = 0.17;
      values.glowOpacity = 0.18;
      values.beamOpacity = 0.03;
      values.cloudOpacity = 0.42;
      values.horizonOpacity = 0.24;
      values.mistOpacity = 0.16;
      values.fogOpacity = 0.12;
      values.snowOpacity = 0.84;
      values.moteOpacity = 0.02;
      values.starOpacity = state.palette === "night" ? 0.12 : 0.02;
      values.frontCloudOpacity = 0.1;
      values.frontMistOpacity = 0.16;
      values.canopyOpacity = 0.32;
      values.windowOverlayOpacity = 0.18;
      values.windowStreakOpacity = 0.12;
      cloudCore = "rgba(222, 230, 242, 0.38)";
      cloudEdge = "rgba(255, 255, 255, 0.18)";
      fogColor = "rgba(222, 231, 241, 0.24)";
      mistColor = "rgba(228, 236, 245, 0.24)";
      break;
    case "fog":
      values.skyOpacity = 0.1;
      values.glowOpacity = 0.03;
      values.beamOpacity = 0.02;
      values.cloudOpacity = 0.12;
      values.horizonOpacity = 0.26;
      values.mistOpacity = 0.44;
      values.fogOpacity = 0.78;
      values.moteOpacity = 0.01;
      values.starOpacity = 0;
      values.frontCloudOpacity = 0.06;
      values.frontMistOpacity = 0.62;
      values.canopyOpacity = 0.12;
      values.windowOverlayOpacity = 0.38;
      values.windowStreakOpacity = 0.08;
      cloudCore = "rgba(180, 192, 204, 0.24)";
      cloudEdge = "rgba(226, 233, 239, 0.08)";
      fogColor = "rgba(219, 227, 234, 0.28)";
      mistColor = "rgba(213, 221, 229, 0.32)";
      break;
    case "clear":
    default:
      if (state.palette === "night") {
        values.skyOpacity = 0.05;
        values.glowOpacity = 0.06;
        values.beamOpacity = 0.03;
        values.cloudOpacity = 0.02;
        values.moteOpacity = 0.02;
        values.starOpacity = 0.62;
        values.frontCloudOpacity = 0.03;
        values.frontMistOpacity = 0.02;
      } else if (state.palette === "dusk" || state.palette === "dawn") {
        values.starOpacity = 0.08;
        values.frontCloudOpacity = 0.04;
        values.frontMistOpacity = 0.03;
        values.glowOpacity = 0.16;
        values.beamOpacity = 0.1;
      } else {
        values.glowOpacity = 0.18;
        values.beamOpacity = 0.16;
        values.cloudOpacity = 0.03;
      }
      break;
  }
  const detailScale = clamp(0.82 + baseIntensity * 0.28, 0.75, 1.18);
  const atmosphereScale = clamp(0.92 + baseIntensity * 0.24, 0.84, 1.2);
  return {
    bgStart: palette.start,
    bgMid: palette.mid,
    bgEnd: palette.end,
    glow: palette.glow,
    beamColor: palette.beam,
    horizonColor: palette.horizon,
    cloudCore,
    cloudEdge,
    fogColor,
    mistColor,
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
    starOpacity: values.starOpacity * atmosphereScale,
    frontCloudOpacity: values.frontCloudOpacity * detailScale,
    frontMistOpacity: values.frontMistOpacity * detailScale,
    rainSheetOpacity: values.rainSheetOpacity * detailScale,
    canopyOpacity: values.canopyOpacity * detailScale,
    windowOverlayOpacity: values.windowOverlayOpacity * detailScale,
    windowStreakOpacity: values.windowStreakOpacity * detailScale
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
  drawerToggleLabel.textContent = expanded ? "Hide" : "Controls";
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
  let qualitySelect;
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
    storyButton.textContent = "Follow story";
    protectInteractive(storyButton);
    storyButton.addEventListener("click", (event) => {
      event.stopPropagation();
      callbacks.onResumeStory();
    });
    manualButton = document.createElement("button");
    manualButton.type = "button";
    manualButton.className = "weather-hud-chip";
    manualButton.textContent = "Lock scene";
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
    presetsLabel.textContent = "Scene";
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
    controlsLabel.textContent = "Scene mix";
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
    const qualityWrap = document.createElement("label");
    qualityWrap.className = "weather-hud-field";
    const qualityText = document.createElement("span");
    qualityText.textContent = "Quality";
    qualitySelect = document.createElement("select");
    qualitySelect.className = "weather-hud-select";
    qualitySelect.innerHTML = WEATHER_QUALITY_OPTIONS.map((option) => `<option value="${option.value}">${option.label}</option>`).join("");
    protectInteractive(qualitySelect);
    qualitySelect.addEventListener("change", (event) => {
      event.stopPropagation();
      callbacks.onChangeQuality(qualitySelect.value);
    });
    qualityWrap.appendChild(qualityText);
    qualityWrap.appendChild(qualitySelect);
    controlGrid.appendChild(layerWrap);
    controlGrid.appendChild(intensityWrap);
    controlGrid.appendChild(qualityWrap);
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
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "weather-hud-control weather-hud-control-danger weather-hud-action-wide";
    clearButton.textContent = "Clear scene";
    protectInteractive(clearButton);
    clearButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!window.confirm("Clear the saved weather state for this chat? This removes both story sync data and any manual lock.")) {
        return;
      }
      callbacks.onClearScene();
    });
    actionRow.appendChild(pauseButton);
    actionRow.appendChild(resumeButton);
    actionRow.appendChild(clearButton);
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
    qualitySelect,
    pauseButton,
    resumeButton
  };
}
function getLiveDate(state) {
  if (state.source !== "manual")
    return null;
  return new Date;
}
function syncHudState(hud, prefs, state, expanded) {
  const liveDate = getLiveDate(state);
  const phase = resolveHudTimePhase(state, liveDate);
  const effectiveLayer = getEffectiveLayerMode(prefs, state);
  const sceneIntensity = clamp(state.intensity * prefs.intensity, 0.25, 1.5);
  hud.root.dataset.expanded = expanded ? "true" : "false";
  hud.root.dataset.source = state.source;
  hud.root.dataset.condition = state.condition;
  hud.root.dataset.palette = state.palette;
  hud.root.dataset.timePhase = phase;
  hud.root.dataset.layer = effectiveLayer;
  hud.root.dataset.quality = prefs.qualityMode;
  hud.root.dataset.paused = prefs.pauseEffects ? "true" : "false";
  hud.root.style.setProperty("--weather-hud-scene-intensity", sceneIntensity.toFixed(2));
  hud.icon.innerHTML = conditionIcon(state.condition);
  hud.temp.textContent = state.temperature;
  hud.summary.textContent = state.summary;
  hud.location.textContent = state.location;
  hud.wind.textContent = `Wind ${state.wind}`;
  hud.condition.textContent = titleCase(state.condition);
  hud.palette.textContent = formatHudPaletteLabel(state, phase);
  hud.layer.textContent = titleCase(effectiveLayer);
  hud.source.textContent = state.source === "manual" ? "Scene lock" : "Story sync";
  hud.drawerToggleLabel.textContent = expanded ? "Hide" : "Controls";
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
  if (hud.qualitySelect) {
    hud.qualitySelect.value = prefs.qualityMode;
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
  root.root.dataset.quality = prefs.qualityMode;
  root.root.classList.toggle("weather-reduced-motion", reducedMotion);
  root.root.classList.toggle("weather-paused", prefs.pauseEffects);
  root.root.style.setProperty("--weather-bg-start", tokens.bgStart);
  root.root.style.setProperty("--weather-bg-mid", tokens.bgMid);
  root.root.style.setProperty("--weather-bg-end", tokens.bgEnd);
  root.root.style.setProperty("--weather-glow", tokens.glow);
  root.root.style.setProperty("--weather-beam-color", tokens.beamColor);
  root.root.style.setProperty("--weather-horizon-color", tokens.horizonColor);
  root.root.style.setProperty("--weather-cloud-core", tokens.cloudCore);
  root.root.style.setProperty("--weather-cloud-edge", tokens.cloudEdge);
  root.root.style.setProperty("--weather-fog-color", tokens.fogColor);
  root.root.style.setProperty("--weather-mist-color", tokens.mistColor);
  root.root.style.setProperty("--weather-sky-opacity", String(isFront ? 0 : tokens.skyOpacity));
  root.root.style.setProperty("--weather-glow-opacity", String(isFront ? 0 : tokens.glowOpacity));
  root.root.style.setProperty("--weather-beam-opacity", String(isFront ? 0 : tokens.beamOpacity));
  root.root.style.setProperty("--weather-cloud-opacity", String(isFront ? 0 : tokens.cloudOpacity));
  root.root.style.setProperty("--weather-horizon-opacity", String(isFront ? 0 : tokens.horizonOpacity));
  root.root.style.setProperty("--weather-mist-opacity", String(isFront ? 0 : tokens.mistOpacity));
  root.root.style.setProperty("--weather-fog-opacity", String(isFront ? 0 : tokens.fogOpacity));
  root.root.style.setProperty("--weather-rain-opacity", String(tokens.rainOpacity * (isFront ? 0.96 : 0.58)));
  root.root.style.setProperty("--weather-snow-opacity", String(tokens.snowOpacity * (isFront ? 0.98 : 0.54)));
  root.root.style.setProperty("--weather-mote-opacity", String(isFront ? 0 : tokens.moteOpacity));
  root.root.style.setProperty("--weather-flash-opacity", String(tokens.flashOpacity));
  root.root.style.setProperty("--weather-star-opacity", String(isFront ? 0 : tokens.starOpacity));
  root.root.style.setProperty("--weather-front-cloud-opacity", String(tokens.frontCloudOpacity));
  root.root.style.setProperty("--weather-front-mist-opacity", String(tokens.frontMistOpacity));
  root.root.style.setProperty("--weather-rain-sheet-opacity", String(tokens.rainSheetOpacity));
  root.root.style.setProperty("--weather-canopy-opacity", String(isFront ? 0 : tokens.canopyOpacity));
  root.root.style.setProperty("--weather-window-overlay-opacity", String(isFront ? 0 : tokens.windowOverlayOpacity));
  root.root.style.setProperty("--weather-window-streak-opacity", String(isFront ? 0 : tokens.windowStreakOpacity));
  root.root.style.setProperty("--weather-rain-color", state.condition === "storm" ? "rgba(212, 231, 255, 0.96)" : "rgba(190, 220, 255, 0.84)");
  root.root.style.setProperty("--weather-snow-color", state.palette === "night" ? "rgba(219, 232, 255, 0.92)" : "rgba(247, 250, 255, 0.95)");
  root.root.style.setProperty("--weather-particle-opacity-static", state.condition === "snow" ? String(clamp(tokens.snowOpacity * 0.2, 0.04, 0.22)) : String(clamp(tokens.rainOpacity * 0.12, 0.03, 0.18)));
}
function setup(ctx) {
  console.info("[weather_hud] frontend build 2026-03-29.0");
  const cleanups = [];
  const removeStyle = ctx.dom.addStyle(WEATHER_HUD_CSS);
  cleanups.push(removeStyle);
  let currentPrefs = DEFAULT_PREFS;
  let currentState = makeDefaultWeatherState();
  let activeChatId = resolveInitialChatId();
  let hudExpanded = false;
  const processedWeatherTags = new Map;
  const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  const getReducedMotion = () => currentPrefs.reducedMotion === "always" || currentPrefs.reducedMotion === "system" && motionMedia.matches;
  const sendManualState = (state) => {
    sendToBackend(ctx, { type: "set_manual_state", chatId: activeChatId, state });
  };
  const resumeStorySync = () => {
    sendToBackend(ctx, { type: "clear_manual_override", chatId: activeChatId });
  };
  const clearSavedWeatherState = () => {
    processedWeatherTags.clear();
    sendToBackend(ctx, { type: "clear_weather_state", chatId: activeChatId });
  };
  const handleCompletedAssistantContent = (payload) => {
    const context = readMessageContext(payload);
    if (!context || context.isUser === true || typeof context.content !== "string" || !context.content.trim())
      return;
    const extracted = extractWeatherTagFromContent(context.content);
    if (!extracted)
      return;
    const dedupeKey = context.messageId ?? `${context.chatId ?? "no-chat"}:${extracted.fullMatch}`;
    if (processedWeatherTags.get(dedupeKey) === extracted.fullMatch)
      return;
    processedWeatherTags.set(dedupeKey, extracted.fullMatch);
    sendToBackend(ctx, {
      type: "weather_tag_intercepted",
      chatId: context.chatId ?? activeChatId,
      messageId: context.messageId,
      attrs: extracted.attrs,
      isStreaming: false
    });
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
    if (message.type === "set_manual_state" || message.type === "clear_manual_override" || message.type === "clear_weather_state") {
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
      onClearScene: () => {
        clearSavedWeatherState();
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
      onChangeQuality: (qualityMode) => {
        sendToBackend(ctx, { type: "save_prefs", prefs: { qualityMode } });
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
  const onResize = () => queueFxRootAttach();
  window.addEventListener("resize", onResize);
  cleanups.push(() => window.removeEventListener("resize", onResize));
  const tagUnsub = ctx.messages.registerTagInterceptor({ tagName: WEATHER_TAG_NAME, removeFromMessage: true }, () => {});
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
  const generationEndedUnsub = ctx.events.on("GENERATION_ENDED", handleCompletedAssistantContent);
  const messageSentUnsub = ctx.events.on("MESSAGE_SENT", handleCompletedAssistantContent);
  const messageEditedUnsub = ctx.events.on("MESSAGE_EDITED", handleCompletedAssistantContent);
  const messageSwipedUnsub = ctx.events.on("MESSAGE_SWIPED", handleCompletedAssistantContent);
  const generationStoppedUnsub = ctx.events.on("GENERATION_STOPPED", handleCompletedAssistantContent);
  cleanups.push(generationEndedUnsub);
  cleanups.push(messageSentUnsub);
  cleanups.push(messageEditedUnsub);
  cleanups.push(messageSwipedUnsub);
  cleanups.push(generationStoppedUnsub);
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
