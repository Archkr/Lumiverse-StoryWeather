export const WEATHER_HUD_CSS = `
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
