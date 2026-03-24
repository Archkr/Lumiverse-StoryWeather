import type { WeatherPrefs, WeatherState } from "../types";

export interface SettingsUI {
  root: HTMLElement;
  sync(prefs: WeatherPrefs, state: WeatherState | null): void;
  destroy(): void;
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
    <option value="system">Follow system setting</option>
    <option value="always">Always reduce motion</option>
    <option value="never">Always animate</option>
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
  body.appendChild(resetButton);

  root.appendChild(header);
  root.appendChild(body);

  return {
    root,
    sync(prefs, state) {
      effectsToggle.checked = prefs.effectsEnabled;
      layerSelect.value = prefs.layerMode;
      intensitySlider.value = String(prefs.intensity.toFixed(2));
      intensityValue.textContent = `${Math.round(prefs.intensity * 100)}%`;
      motionSelect.value = prefs.reducedMotion;
      pauseToggle.checked = prefs.pauseEffects;
      status.textContent = state ? `${state.condition} ${state.temperature}` : "Waiting for story weather";
      preview.textContent = state
        ? `${state.date} at ${state.time} - ${state.summary} (${state.wind})`
        : "The HUD will wake up as soon as the model emits its first weather-state tag.";
    },
    destroy() {
      root.remove();
    },
  };
}
