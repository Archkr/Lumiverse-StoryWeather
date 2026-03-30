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
