import type { WeatherPrefs, WeatherState } from "../types";
import { createRng, hashString } from "../shared";
import { buildSceneProfile, rgba, type RGB, type SceneProfile } from "./scene";

export type RendererKind = "back" | "front";

export interface WeatherRendererHandle {
  setVisible(visible: boolean): void;
  setScene(state: WeatherState, prefs: WeatherPrefs, reducedMotion: boolean): void;
  triggerLightning(): void;
  destroy(): void;
}

interface Star {
  x: number;
  y: number;
  r: number;
  twinkle: number;
  phase: number;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  alpha: number;
  blobs: Array<{ ox: number; oy: number; r: number }>;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
}

interface Lightning {
  phase: number;
  nextAt: number;
  alpha: number;
  auto: boolean;
}

const MAX_DELTA_MS = 64;

function defaultPrefs(): WeatherPrefs {
  return {
    effectsEnabled: true,
    layerMode: "auto",
    intensity: 1,
    qualityMode: "standard",
    reducedMotion: "never",
    pauseEffects: false,
    widgetPosition: null,
  };
}

function fallbackState(): WeatherState {
  return {
    location: "",
    date: "2026-01-01",
    time: "12:00 PM",
    condition: "clear",
    summary: "",
    temperature: "",
    intensity: 0.3,
    wind: "",
    layer: "both",
    palette: "day",
    timestampMs: null,
    updatedAt: 0,
    source: "story",
  };
}

export function createWeatherRenderer(host: HTMLElement, kind: RendererKind): WeatherRendererHandle {
  const canvas = document.createElement("canvas");
  canvas.className = `story-weather-canvas story-weather-canvas--${kind}`;
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;contain:strict;";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return { setVisible() {}, setScene() {}, triggerLightning() {}, destroy() { canvas.remove(); } };
  }

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let logicalW = host.clientWidth || 1;
  let logicalH = host.clientHeight || 1;
  let scene: SceneProfile = buildSceneProfile(fallbackState(), defaultPrefs(), false);
  let lastFrame = 0;
  let frameInterval = 1000 / scene.fps;
  let raf = 0;
  let running = true;
  let visible = true;
  let docVisible = !document.hidden;
  let fieldsSig = "";

  let stars: Star[] = [];
  let clouds: Cloud[] = [];
  let precip: Particle[] = [];
  let dust: Particle[] = [];
  let lightning: Lightning | null = null;

  function resize() {
    const rect = host.getBoundingClientRect();
    logicalW = Math.max(1, Math.round(rect.width));
    logicalH = Math.max(1, Math.round(rect.height));
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
    canvas.style.width = `${logicalW}px`;
    canvas.style.height = `${logicalH}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedFields(true);
  }

  function makeCloud(rng: () => number): Cloud {
    const blobCount = 4 + Math.floor(rng() * 4);
    const scl = (kind === "back" ? 0.9 : 1.4) + rng() * 0.8;
    const blobs = Array.from({ length: blobCount }, () => ({
      ox: (rng() - 0.5) * 80 * scl,
      oy: (rng() - 0.5) * 16 * scl,
      r: (24 + rng() * 38) * scl,
    }));
    return {
      x: rng() * logicalW,
      y: rng() * logicalH * (kind === "back" ? 0.55 : 0.4),
      scale: scl,
      speed: (4 + rng() * 10) * (kind === "back" ? 1 : 1.6),
      alpha: 0.7 + rng() * 0.3,
      blobs,
    };
  }

  function makePrecip(rng: () => number): Particle {
    const isSnow = scene.precipKind === "snow";
    const size = isSnow
      ? (kind === "front" ? 1.4 + rng() * 2.2 : 0.8 + rng() * 1.4)
      : (kind === "front" ? 0.9 + rng() * 0.7 : 0.5 + rng() * 0.5);
    const speedMul = kind === "front" ? 1.4 : 1.0;
    return {
      x: rng() * logicalW,
      y: rng() * logicalH,
      vx: scene.precipAngle * scene.precipSpeed * speedMul + (isSnow ? (rng() - 0.5) * 30 : 0),
      vy: scene.precipSpeed * speedMul * (isSnow ? 0.18 + rng() * 0.16 : 0.9 + rng() * 0.2),
      size,
      phase: rng() * Math.PI * 2,
    };
  }

  function seedFields(force: boolean) {
    const sig = `${scene.signature}|${kind}|${logicalW}x${logicalH}`;
    if (!force && fieldsSig === sig && stars.length) return;
    fieldsSig = sig;
    const rng = createRng(hashString(sig));

    const starCount = kind === "back"
      ? Math.round(scene.starDensity * 90 * scene.qualityScale)
      : 0;
    stars = Array.from({ length: starCount }, () => ({
      x: rng() * logicalW,
      y: rng() * logicalH * 0.6,
      r: 0.4 + rng() * 1.2,
      twinkle: 0.4 + rng() * 0.6,
      phase: rng() * Math.PI * 2,
    }));

    const cloudBase = kind === "back" ? scene.cloudCount : Math.round(scene.cloudCount * 0.35);
    clouds = Array.from({ length: cloudBase }, () => makeCloud(rng));

    const precipBase = kind === "back"
      ? Math.round(scene.precipCount * 0.55)
      : Math.round(scene.precipCount * 0.65);
    precip = Array.from({ length: precipBase }, () => makePrecip(rng));

    const dustCount = kind === "back" ? Math.round(40 * scene.qualityScale) : 0;
    dust = Array.from({ length: dustCount }, () => ({
      x: rng() * logicalW,
      y: rng() * logicalH,
      vx: (rng() - 0.4) * 6,
      vy: (rng() - 0.5) * 2,
      size: 0.6 + rng() * 1.4,
      phase: rng() * Math.PI * 2,
    }));
  }

  function advanceFields(dt: number) {
    if (scene.paused || scene.reducedMotion) return;

    for (const c of clouds) {
      c.x += c.speed * dt * (1 + scene.cloudSpeed * 8);
      if (c.x > logicalW + 240) c.x = -240;
      if (c.x < -240) c.x = logicalW + 240;
    }

    for (const p of precip) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (scene.precipKind === "snow") {
        p.phase += dt * 2;
        p.x += Math.sin(p.phase * 1.2) * 8 * dt;
      }
      if (p.y > logicalH + 16 || p.x > logicalW + 30 || p.x < -30) {
        p.x = Math.random() * logicalW;
        p.y = -10;
      }
    }

    for (const d of dust) {
      d.x += d.vx * dt;
      d.y += d.vy * dt + Math.sin((d.phase += dt) * 0.8) * 0.4;
      if (d.x > logicalW + 8) d.x = -8;
      if (d.x < -8) d.x = logicalW + 8;
      if (d.y > logicalH + 8) d.y = -8;
      if (d.y < -8) d.y = logicalH + 8;
    }
  }

  function advanceLightning(deltaMs: number) {
    if (!scene.lightningEnabled) {
      lightning = null;
      return;
    }
    if (!lightning) {
      lightning = { phase: 0, nextAt: 5000 + Math.random() * 12000, alpha: 0, auto: true };
      return;
    }
    lightning.phase += deltaMs;
    if (lightning.alpha > 0) {
      lightning.alpha = Math.max(0, lightning.alpha - deltaMs / 600);
    } else if (lightning.auto && lightning.phase > lightning.nextAt) {
      lightning.alpha = 0.7 + Math.random() * 0.3;
      lightning.phase = 0;
      lightning.nextAt = 4500 + Math.random() * 14000;
    } else if (!lightning.auto && lightning.phase > 700) {
      lightning = null;
    }
  }

  // ── layer renderers ──

  function renderSky() {
    if (kind !== "back") return;
    const grad = ctx!.createLinearGradient(0, 0, 0, logicalH);
    grad.addColorStop(0, rgba(scene.skyTop, 0.95));
    grad.addColorStop(0.55, rgba(scene.skyMid, 0.92));
    grad.addColorStop(1, rgba(scene.skyBottom, 0.9));
    ctx!.fillStyle = grad;
    ctx!.fillRect(0, 0, logicalW, logicalH);

    if (scene.ambientGlowOpacity > 0.01) {
      const horizonY = logicalH * (scene.showSun ? scene.sunY : 0.78);
      const radial = ctx!.createRadialGradient(
        logicalW * 0.5,
        horizonY,
        0,
        logicalW * 0.5,
        horizonY,
        Math.max(logicalW, logicalH) * 0.55,
      );
      radial.addColorStop(0, rgba(scene.ambientGlow, scene.ambientGlowOpacity));
      radial.addColorStop(1, rgba(scene.ambientGlow, 0));
      ctx!.fillStyle = radial;
      ctx!.fillRect(0, 0, logicalW, logicalH);
    }
  }

  function renderStars(time: number) {
    if (kind !== "back" || !scene.showStars || scene.starDensity < 0.05) return;
    for (const s of stars) {
      const a = (Math.sin(time * s.twinkle * 1.4 + s.phase) * 0.5 + 0.5) * 0.8 + 0.2;
      ctx!.fillStyle = rgba(scene.starColor, a * scene.starDensity);
      ctx!.beginPath();
      ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function renderCelestial() {
    if (kind !== "back") return;
    if (scene.showSun) drawCelestial(ctx!, logicalW, logicalH, scene.sunY, scene.sunRadius, scene.sunColor, scene.bloomStrength);
    else if (scene.showMoon) drawCelestial(ctx!, logicalW, logicalH, scene.moonY, scene.moonRadius, scene.moonColor, 0.4);
  }

  function renderClouds() {
    if (clouds.length === 0) return;
    for (const c of clouds) {
      const baseAlpha = c.alpha * scene.cloudOpacity * (kind === "front" ? 0.55 : 1);
      for (const blob of c.blobs) {
        const x = c.x + blob.ox;
        const y = c.y + blob.oy;
        const r = blob.r;
        const grad = ctx!.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
        grad.addColorStop(0, rgba(scene.cloudColor, baseAlpha));
        grad.addColorStop(0.6, rgba(scene.cloudColor, baseAlpha * 0.6));
        grad.addColorStop(1, rgba(scene.cloudShade, 0));
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(x, y, r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
  }

  function renderFog(time: number) {
    if (scene.fogOpacity < 0.02) return;
    const bandHeight = logicalH / Math.max(1, scene.fogBands);
    const baseAlpha = scene.fogOpacity * (kind === "front" ? 0.55 : 1);
    for (let i = 0; i < scene.fogBands; i += 1) {
      const phase = time * (0.04 + i * 0.012);
      const y = logicalH - bandHeight * (i + 1) + Math.sin(phase + i) * 8;
      const grad = ctx!.createLinearGradient(0, y, 0, y + bandHeight);
      const a = baseAlpha * (1 - i * 0.18);
      grad.addColorStop(0, rgba(scene.fogColor, 0));
      grad.addColorStop(0.5, rgba(scene.fogColor, a));
      grad.addColorStop(1, rgba(scene.fogColor, 0));
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, y, logicalW, bandHeight);
    }
  }

  function renderPrecip() {
    if (scene.precipKind === "none" || precip.length === 0) return;
    if (scene.precipKind === "rain") {
      ctx!.strokeStyle = rgba(scene.precipColor, scene.precipOpacity * (kind === "front" ? 0.95 : 0.75));
      ctx!.lineCap = "round";
      for (const p of precip) {
        ctx!.lineWidth = p.size;
        ctx!.beginPath();
        ctx!.moveTo(p.x, p.y);
        ctx!.lineTo(p.x - p.vx * 0.014, p.y - p.vy * 0.014);
        ctx!.stroke();
      }
    } else {
      ctx!.fillStyle = rgba(scene.precipColor, scene.precipOpacity * (kind === "front" ? 0.95 : 0.85));
      for (const p of precip) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
  }

  function renderDust(time: number) {
    if (kind !== "back" || scene.dustOpacity < 0.04) return;
    for (const d of dust) {
      const a = (Math.sin(time * 0.8 + d.phase) * 0.5 + 0.5) * scene.dustOpacity;
      ctx!.fillStyle = rgba(scene.dustColor, a);
      ctx!.beginPath();
      ctx!.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function renderLightning() {
    if (!scene.lightningEnabled || !lightning || lightning.alpha <= 0) return;
    const grad = ctx!.createRadialGradient(
      logicalW * 0.5,
      logicalH * 0.32,
      0,
      logicalW * 0.5,
      logicalH * 0.32,
      Math.max(logicalW, logicalH),
    );
    grad.addColorStop(0, rgba(scene.lightningColor, lightning.alpha));
    grad.addColorStop(0.4, rgba(scene.lightningColor, lightning.alpha * 0.4));
    grad.addColorStop(1, rgba(scene.lightningColor, 0));
    ctx!.fillStyle = grad;
    ctx!.fillRect(0, 0, logicalW, logicalH);
  }

  function renderVignette() {
    if (kind !== "back" || scene.vignetteOpacity < 0.04) return;
    const grad = ctx!.createRadialGradient(
      logicalW * 0.5,
      logicalH * 0.5,
      Math.min(logicalW, logicalH) * 0.35,
      logicalW * 0.5,
      logicalH * 0.5,
      Math.max(logicalW, logicalH) * 0.7,
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${scene.vignetteOpacity})`);
    ctx!.fillStyle = grad;
    ctx!.fillRect(0, 0, logicalW, logicalH);
  }

  function clearAndRender(now: number, deltaMs: number) {
    ctx!.clearRect(0, 0, logicalW, logicalH);
    advanceLightning(deltaMs);
    advanceFields(deltaMs / 1000);
    const time = now / 1000;
    renderSky();
    renderStars(time);
    renderCelestial();
    renderClouds();
    renderFog(time);
    renderPrecip();
    renderDust(time);
    renderLightning();
    renderVignette();
  }

  function tick(now: number) {
    raf = window.requestAnimationFrame(tick);
    if (!running || !visible || !docVisible) return;
    if (scene.paused || scene.reducedMotion) {
      if (lastFrame === 0) {
        clearAndRender(now, 0);
        lastFrame = now;
      }
      return;
    }
    if (lastFrame === 0) {
      lastFrame = now;
      return;
    }
    const elapsed = now - lastFrame;
    if (elapsed < frameInterval) return;
    const delta = Math.min(MAX_DELTA_MS, elapsed);
    lastFrame = now - (elapsed % frameInterval);
    clearAndRender(now, delta);
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(host);

  const onVis = () => {
    docVisible = !document.hidden;
    if (docVisible) lastFrame = 0;
  };
  document.addEventListener("visibilitychange", onVis);

  resize();
  raf = window.requestAnimationFrame(tick);

  return {
    setVisible(v: boolean) {
      visible = v;
      canvas.style.opacity = v ? "1" : "0";
    },
    setScene(weatherState: WeatherState, prefs: WeatherPrefs, reducedMotion: boolean) {
      scene = buildSceneProfile(weatherState, prefs, reducedMotion);
      frameInterval = 1000 / scene.fps;
      seedFields(false);
    },
    triggerLightning() {
      if (!scene.lightningEnabled) return;
      lightning = { phase: 0, nextAt: 0, alpha: 0.85, auto: false };
    },
    destroy() {
      running = false;
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.remove();
    },
  };
}

function drawCelestial(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  yFrac: number,
  radius: number,
  color: RGB,
  bloom: number,
): void {
  const cx = w * 0.62;
  const cy = h * yFrac;

  if (bloom > 0.05) {
    const halo = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 4.5);
    halo.addColorStop(0, rgba(color, 0.55 * bloom));
    halo.addColorStop(0.3, rgba(color, 0.25 * bloom));
    halo.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
  }

  const disc = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  disc.addColorStop(0, rgba(color, 1));
  disc.addColorStop(0.7, rgba(color, 0.85));
  disc.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}
