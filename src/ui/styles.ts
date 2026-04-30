export const WEATHER_HUD_CSS = String.raw`
.story-weather-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  contain: strict;
  z-index: 0;
}
.story-weather-overlay--front {
  z-index: 8000;
}

.story-weather-overlay__layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.story-weather-canvas {
  transition: opacity 360ms ease;
}

/* ─── HUD widget (glass) ────────────────────────────────────── */

.sw-hud {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: var(--lumiverse-font-sans, system-ui, sans-serif);
  color: var(--lumiverse-text, #f4f6fb);
  border-radius: 16px;
  overflow: hidden;
  background:
    linear-gradient(160deg,
      color-mix(in srgb, var(--lumiverse-bg, #0c0f17) 78%, transparent),
      color-mix(in srgb, var(--lumiverse-bg, #0c0f17) 92%, transparent)
    );
  border: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.12)) 70%, transparent);
  box-shadow:
    0 18px 40px -22px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  transition: box-shadow 220ms ease, transform 220ms ease;
}

.sw-hud::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0) 30%,
    rgba(0, 0, 0, 0.0) 70%,
    rgba(0, 0, 0, 0.18) 100%
  );
}

.sw-hud:hover {
  box-shadow:
    0 22px 56px -22px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.06) inset;
}

.sw-hud__header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 12px 14px 8px;
  gap: 10px;
  cursor: grab;
  user-select: none;
}

.sw-hud__header:active {
  cursor: grabbing;
}

.sw-hud__location {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 65%, transparent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sw-hud__icon {
  width: 22px;
  height: 22px;
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 88%, transparent);
  display: grid;
  place-items: center;
}

.sw-hud__icon svg {
  width: 100%;
  height: 100%;
}

.sw-hud__body {
  padding: 0 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sw-hud__time {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.sw-hud__date {
  font-size: 11px;
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 60%, transparent);
  font-variant-numeric: tabular-nums;
}

.sw-hud__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 12px;
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 78%, transparent);
}

.sw-hud__row--summary {
  border-top: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.08)) 50%, transparent);
}

.sw-hud__summary {
  flex: 1 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.sw-hud__chip {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.08)) 60%, transparent);
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 86%, transparent);
}

.sw-hud__chip--temp {
  background: color-mix(in srgb, var(--lumiverse-accent, #5b8cff) 22%, transparent);
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 96%, transparent);
}

.sw-hud__chip--source[data-source="manual"] {
  background: color-mix(in srgb, #e0aa3e 26%, transparent);
}

.sw-hud__footer {
  margin-top: auto;
  display: flex;
  border-top: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.08)) 60%, transparent);
}

.sw-hud__footer button {
  flex: 1 1 auto;
  background: transparent;
  border: 0;
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 75%, transparent);
  font: inherit;
  font-size: 11.5px;
  padding: 8px 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 160ms ease, color 160ms ease;
}

.sw-hud__footer button:hover {
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.06)) 70%, transparent);
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 95%, transparent);
}

.sw-hud__footer button + button {
  border-left: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.06)) 60%, transparent);
}

.sw-hud__footer svg {
  width: 14px;
  height: 14px;
}

/* ─── Drawer (expanded) ────────────────────────────────────── */

.sw-hud__drawer {
  display: none;
  flex-direction: column;
  gap: 10px;
  padding: 10px 14px 12px;
  border-top: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.08)) 60%, transparent);
  max-height: 340px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.sw-hud--expanded .sw-hud__drawer {
  display: flex;
}

.sw-hud__section-label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 55%, transparent);
}

.sw-hud__mode {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 3px;
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.04)) 60%, transparent);
  border-radius: 10px;
}

.sw-hud__mode button {
  background: transparent;
  border: 0;
  font: inherit;
  font-size: 11.5px;
  font-weight: 600;
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 70%, transparent);
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}

.sw-hud__mode button[aria-pressed="true"] {
  background: color-mix(in srgb, var(--lumiverse-accent, #5b8cff) 80%, transparent);
  color: #fff;
}

.sw-hud__presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
}

.sw-hud__preset {
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.05)) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.06)) 60%, transparent);
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 80%, transparent);
  font: inherit;
  font-size: 10.5px;
  font-weight: 600;
  padding: 6px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 160ms ease, transform 80ms ease;
}

.sw-hud__preset:hover {
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.08)) 90%, transparent);
}

.sw-hud__preset[aria-pressed="true"] {
  background: color-mix(in srgb, var(--lumiverse-accent, #5b8cff) 70%, transparent);
  border-color: color-mix(in srgb, var(--lumiverse-accent, #5b8cff) 90%, transparent);
  color: #fff;
}

.sw-hud__control {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
}

.sw-hud__control label {
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 70%, transparent);
}

.sw-hud__control input[type="range"] {
  width: 100%;
  accent-color: var(--lumiverse-accent, #5b8cff);
}

.sw-hud__control select {
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.05)) 80%, transparent);
  color: var(--lumiverse-text, #f4f6fb);
  border: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.08)) 70%, transparent);
  border-radius: 6px;
  font: inherit;
  font-size: 11.5px;
  padding: 3px 6px;
}

.sw-hud__control-value {
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 65%, transparent);
  min-width: 28px;
  text-align: right;
}

.sw-hud__action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.sw-hud__action {
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.04)) 60%, transparent);
  border: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.06)) 60%, transparent);
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 78%, transparent);
  font: inherit;
  font-size: 11.5px;
  padding: 7px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 160ms ease;
}

.sw-hud__action:hover {
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.08)) 80%, transparent);
}

.sw-hud__action--danger {
  color: color-mix(in srgb, #ff8b8b 90%, white);
}

/* ─── Settings panel ───────────────────────────────────────── */

.sw-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
  font-size: 13px;
  color: var(--lumiverse-text, #f4f6fb);
}

.sw-settings__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sw-settings__title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 0;
}

.sw-settings__hint {
  font-size: 12px;
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 65%, transparent);
  margin: 0;
}

.sw-settings__macro-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sw-settings__macro {
  font-family: var(--lumiverse-font-mono, ui-monospace, monospace);
  font-size: 12px;
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.05)) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.08)) 70%, transparent);
  padding: 6px 8px;
  border-radius: 6px;
  user-select: all;
  cursor: copy;
}

.sw-settings__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
}

.sw-settings__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.sw-settings__field label {
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 65%, transparent);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-size: 10.5px;
}

.sw-settings__field input,
.sw-settings__field select,
.sw-settings__field textarea {
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.06)) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.08)) 80%, transparent);
  color: var(--lumiverse-text, #f4f6fb);
  font: inherit;
  font-size: 13px;
  padding: 6px 8px;
  border-radius: 6px;
}

.sw-settings__field input[type="range"] {
  padding: 0;
  accent-color: var(--lumiverse-accent, #5b8cff);
}

.sw-settings__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sw-settings__row label {
  flex: 1 1 auto;
}

.sw-settings__presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.sw-settings__preset {
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.05)) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.08)) 60%, transparent);
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 80%, transparent);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 6px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: background 160ms ease, transform 100ms ease;
}

.sw-settings__preset:hover {
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.1)) 80%, transparent);
}

.sw-settings__preset[aria-pressed="true"] {
  background: color-mix(in srgb, var(--lumiverse-accent, #5b8cff) 70%, transparent);
  border-color: color-mix(in srgb, var(--lumiverse-accent, #5b8cff) 90%, transparent);
  color: #fff;
}

.sw-settings__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sw-settings__button {
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.06)) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--lumiverse-border, rgba(255,255,255,0.08)) 80%, transparent);
  color: var(--lumiverse-text, #f4f6fb);
  font: inherit;
  font-size: 12.5px;
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 160ms ease;
}

.sw-settings__button:hover {
  background: color-mix(in srgb, var(--lumiverse-fill, rgba(255,255,255,0.1)) 90%, transparent);
}

.sw-settings__button--primary {
  background: var(--lumiverse-accent, #5b8cff);
  border-color: var(--lumiverse-accent, #5b8cff);
  color: #fff;
}

.sw-settings__button--danger {
  color: color-mix(in srgb, #ff8b8b 90%, white);
}

.sw-settings__status {
  font-size: 12px;
  color: color-mix(in srgb, var(--lumiverse-text, #f4f6fb) 70%, transparent);
}
`;
