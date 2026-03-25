export const WEATHER_HUD_CSS = `
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
