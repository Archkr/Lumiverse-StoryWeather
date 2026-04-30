import type { SpindleFrontendContext, SpindleFrontendModule } from "lumiverse-spindle-types";
import { buildPresetWeatherState } from "./presets";
import { createWeatherRenderer, type WeatherRendererHandle } from "./render/renderer";
import { DEFAULT_PREFS, makeDefaultWeatherState, normalizePrefs } from "./shared";
import type {
  BackendToFrontend,
  FrontendToBackend,
  WeatherEffectsQuality,
  WeatherLayerMode,
  WeatherPrefs,
  WeatherSourceMode,
  WeatherState,
} from "./types";
import { createHud, type HudHandle } from "./ui/hud";
import { createSettingsUI, type SettingsHandle } from "./ui/settings";
import { WEATHER_HUD_CSS } from "./ui/styles";

interface State {
  prefs: WeatherPrefs;
  weather: WeatherState | null;
  chatId: string | null;
  hudExpanded: boolean;
  reducedMotion: boolean;
  drawerTabActivated: boolean;
}

const module: SpindleFrontendModule = {
  setup(ctx: SpindleFrontendContext) {
    const removeStyle = ctx.dom.addStyle(WEATHER_HUD_CSS);
    const seenTagSignatures = new Set<string>();

    const overlay = ctx.ui.mountApp({ className: "story-weather-overlay" });
    overlay.root.classList.add("story-weather-overlay");
    overlay.root.style.cssText = "position:fixed;inset:0;pointer-events:none;contain:strict;";

    const backLayer = document.createElement("div");
    backLayer.className = "story-weather-overlay__layer story-weather-overlay__layer--back";
    backLayer.style.cssText = "position:absolute;inset:0;z-index:-1;pointer-events:none;";
    const frontLayer = document.createElement("div");
    frontLayer.className = "story-weather-overlay__layer story-weather-overlay__layer--front";
    frontLayer.style.cssText = "position:fixed;inset:0;z-index:8000;pointer-events:none;";
    overlay.root.append(backLayer, frontLayer);

    let backRenderer: WeatherRendererHandle | null = createWeatherRenderer(backLayer, "back");
    let frontRenderer: WeatherRendererHandle | null = createWeatherRenderer(frontLayer, "front");

    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const state: State = {
      prefs: DEFAULT_PREFS,
      weather: null,
      chatId: null,
      hudExpanded: false,
      reducedMotion: motionMedia.matches,
      drawerTabActivated: false,
    };

    const send = (payload: FrontendToBackend) => ctx.sendToBackend(payload);

    // ─── HUD ────────────────────────────────────────────────────
    const hud: HudHandle = createHud(ctx, state.prefs, {
      onToggleDrawer: () => {
        state.hudExpanded = !state.hudExpanded;
        applyState();
      },
      onOpenSettings: () => {
        if (drawerTab) {
          drawerTab.activate();
          state.drawerTabActivated = true;
        }
      },
      onLockCurrentScene: () => {
        const base = state.weather ?? makeDefaultWeatherState();
        send({ type: "set_manual_state", chatId: state.chatId, state: { ...base, source: "manual" } });
      },
      onResumeStory: () => send({ type: "clear_manual_override", chatId: state.chatId }),
      onClearScene: () => send({ type: "clear_weather_state", chatId: state.chatId }),
      onApplyPreset: (presetId) => {
        const next = buildPresetWeatherState(presetId, state.weather);
        if (next) send({ type: "set_manual_state", chatId: state.chatId, state: next });
      },
      onChangeLayerMode: (mode) => {
        state.prefs = { ...state.prefs, layerMode: mode };
        applyState();
        send({ type: "save_prefs", prefs: { layerMode: mode } });
      },
      onChangeIntensity: (intensity) => {
        state.prefs = { ...state.prefs, intensity };
        applyState();
        send({ type: "save_prefs", prefs: { intensity } });
      },
      onChangeQuality: (quality) => {
        state.prefs = { ...state.prefs, qualityMode: quality };
        applyState();
        send({ type: "save_prefs", prefs: { qualityMode: quality } });
      },
      onTogglePause: () => {
        const next = !state.prefs.pauseEffects;
        state.prefs = { ...state.prefs, pauseEffects: next };
        applyState();
        send({ type: "save_prefs", prefs: { pauseEffects: next } });
      },
    });

    // ─── Settings panel (in extensions tab) ─────────────────────
    const settings: SettingsHandle = createSettingsUI(ctx, {
      onSavePrefs: (patch) => {
        state.prefs = normalizePrefs({ ...state.prefs, ...patch });
        applyState();
        send({ type: "save_prefs", prefs: patch });
      },
      onSetManualState: (next) => send({ type: "set_manual_state", chatId: state.chatId, state: next }),
      onApplyPreset: (presetId) => {
        const next = buildPresetWeatherState(presetId, state.weather);
        if (next) send({ type: "set_manual_state", chatId: state.chatId, state: next });
      },
      onClearOverride: () => send({ type: "clear_manual_override", chatId: state.chatId }),
      onClearWeather: () => send({ type: "clear_weather_state", chatId: state.chatId }),
      onResetWidgetPosition: () => send({ type: "reset_widget_position" }),
    });

    // ─── Drawer tab (entry into settings) ───────────────────────
    const drawerTab = ctx.ui.registerDrawerTab({
      id: "story-weather",
      title: "Story Weather",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 1-7.86A6 6 0 0 0 6.5 9.6 4 4 0 0 0 7 18z"/></svg>',
    });
    const tabRoot = drawerTab.root;
    const settingsHost = document.createElement("div");
    settingsHost.style.padding = "12px 14px";
    tabRoot.appendChild(settingsHost);
    // Move the settings panel from the extensions mount into the drawer tab.
    // The settings UI was mounted to settings_extensions; we leave that as the
    // canonical place. The drawer tab serves as a quick-access shortcut.
    const drawerHint = document.createElement("p");
    drawerHint.className = "sw-settings__hint";
    drawerHint.textContent = "Open the Extensions settings tab for the full Story Weather panel.";
    settingsHost.appendChild(drawerHint);

    // ─── Tag interceptor ────────────────────────────────────────
    const unsubTag = ctx.messages.registerTagInterceptor(
      { tagName: "weather-state", removeFromMessage: true },
      (payload) => {
        if (payload.isStreaming) return;
        const sig = `${payload.chatId ?? ""}|${payload.messageId ?? ""}|${payload.fullMatch}`;
        if (seenTagSignatures.has(sig)) return;
        seenTagSignatures.add(sig);
        if (seenTagSignatures.size > 200) {
          // Trim memory.
          const first = seenTagSignatures.values().next().value;
          if (first) seenTagSignatures.delete(first);
        }
        send({
          type: "weather_tag_intercepted",
          chatId: payload.chatId ?? state.chatId,
          messageId: payload.messageId ?? null,
          attrs: payload.attrs,
        });
      },
    );

    // ─── Chat events ────────────────────────────────────────────
    const unsubChatChanged = ctx.events.on("CHAT_CHANGED", (payload: unknown) => {
      const chatId = extractChatId(payload);
      if (!chatId) return;
      state.chatId = chatId;
      send({ type: "chat_changed", chatId });
    });

    // ─── Backend messages ───────────────────────────────────────
    const unsubBackend = ctx.onBackendMessage((raw) => {
      const message = raw as BackendToFrontend;
      switch (message.type) {
        case "prefs":
          state.prefs = normalizePrefs(message.prefs);
          applyState();
          break;
        case "active_chat_state":
          state.chatId = message.chatId;
          state.weather = message.state;
          applyState();
          break;
        case "weather_state":
          state.chatId = message.chatId;
          state.weather = message.state;
          applyState();
          break;
        case "error":
          ctx.events.emit("toast", { kind: "error", message: message.message });
          break;
      }
    });

    // Reduced motion media query updates
    const onMotionChange = (e: MediaQueryListEvent) => {
      state.reducedMotion = e.matches;
      applyState();
    };
    motionMedia.addEventListener?.("change", onMotionChange);

    function resolveLayerMode(): WeatherLayerMode | "off" {
      if (!state.prefs.effectsEnabled) return "off";
      const pref = state.prefs.layerMode;
      if (pref === "auto") return state.weather?.layer ?? "back";
      return pref;
    }

    function resolveReducedMotion(): boolean {
      if (state.prefs.reducedMotion === "always") return true;
      if (state.prefs.reducedMotion === "never") return false;
      return state.reducedMotion;
    }

    function applyState() {
      const reducedMotion = resolveReducedMotion();
      const layerMode = resolveLayerMode();
      const sourceMode: WeatherSourceMode = state.weather?.source === "manual" ? "manual" : "story";

      const showBack = layerMode === "back" || layerMode === "both";
      const showFront = layerMode === "front" || layerMode === "both";

      backLayer.style.display = showBack ? "block" : "none";
      frontLayer.style.display = showFront ? "block" : "none";

      const renderState = state.weather ?? makeDefaultWeatherState();
      const renderPrefs: WeatherPrefs = {
        ...state.prefs,
        intensity: state.prefs.intensity,
      };

      backRenderer?.setScene(renderState, renderPrefs, reducedMotion);
      frontRenderer?.setScene(renderState, renderPrefs, reducedMotion);
      backRenderer?.setVisible(showBack && !!state.weather);
      frontRenderer?.setVisible(showFront && !!state.weather);

      hud.sync(state.weather, state.prefs, state.hudExpanded, sourceMode);
      settings.sync(state.weather, state.prefs);
    }

    // Boot
    send({ type: "frontend_ready" });
    applyState();

    return () => {
      removeStyle();
      unsubTag();
      unsubChatChanged();
      unsubBackend();
      motionMedia.removeEventListener?.("change", onMotionChange);
      hud.destroy();
      settings.destroy();
      backRenderer?.destroy();
      frontRenderer?.destroy();
      backRenderer = null;
      frontRenderer = null;
      drawerTab.destroy();
      overlay.destroy();
    };
  },
};

export default module;

function extractChatId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const id = (payload as { chatId?: unknown }).chatId;
  return typeof id === "string" && id.trim() ? id : null;
}

// Suppress unused-export warnings for cross-module symbols.
export { type WeatherEffectsQuality };
