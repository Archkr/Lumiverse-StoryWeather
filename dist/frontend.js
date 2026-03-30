// src/shared.ts
var WEATHER_TAG_NAME = "weather-state";
var DEFAULT_PREFS = {
  effectsEnabled: true,
  layerMode: "auto",
  intensity: 1,
  qualityMode: "lite",
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

// src/render/assets.ts
var readySprites = new Map;
var pendingSprites = new Map;
var pendingReadyCallbacks = new Map;
var spriteSvgCache = new Map;
function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
function buildSvgDocument(viewBox, defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none">${defs}${body}</svg>`;
}
function buildCloudWispSvg(colors) {
  return buildSvgDocument("0 0 720 280", `<defs>
      <linearGradient id="cloud" x1="0" y1="40" x2="0" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="48%" stop-color="${colors.primary}"/>
        <stop offset="100%" stop-color="${colors.shadow}"/>
      </linearGradient>
      <linearGradient id="rim" x1="0" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${colors.highlight}" stop-opacity="0"/>
      </linearGradient>
      <filter id="soft" x="-16%" y="-20%" width="132%" height="160%">
        <feGaussianBlur stdDeviation="10"/>
      </filter>
    </defs>`, `<g filter="url(#soft)">
      <path d="M34 186C57 131 119 98 196 108c19-46 76-74 140-68 46-47 144-58 215 7 79-20 136 18 135 71 51 15 83 49 83 88H46c-28-1-47-16-46-40 1-28 17-47 34-60Z" fill="url(#cloud)"/>
      <path d="M118 121c32-32 91-46 148-35 38-33 118-44 170-6 66-9 117 18 138 55-25-20-65-28-107-20-44-44-129-52-190-8-61-16-132 0-159 14Z" fill="url(#rim)" opacity="0.7"/>
      <path d="M72 197c81 12 224 20 329 16 95-4 191-16 284-41-39 37-128 61-272 67-182 8-290-11-341-42Z" fill="${colors.shadow}" opacity="0.38"/>
    </g>`);
}
function buildCloudBankSvg(colors) {
  return buildSvgDocument("0 0 720 320", `<defs>
      <linearGradient id="bank" x1="0" y1="40" x2="0" y2="280" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="42%" stop-color="${colors.secondary}"/>
        <stop offset="100%" stop-color="${colors.shadow}"/>
      </linearGradient>
      <filter id="bank-blur" x="-18%" y="-18%" width="136%" height="170%">
        <feGaussianBlur stdDeviation="11"/>
      </filter>
    </defs>`, `<g filter="url(#bank-blur)">
      <path d="M41 225c12-81 88-126 183-110 25-63 93-104 179-94 31-33 91-56 147-45 47 9 80 34 93 71 47 0 77 29 77 74 0 38-24 66-67 78H83c-33 0-53-14-54-44 0-16 4-25 12-30Z" fill="url(#bank)"/>
      <path d="M132 140c37-36 95-51 150-39 61-56 187-62 258 12-36-20-93-25-152-5-68-33-173-24-256 32Z" fill="${colors.highlight}" opacity="0.42"/>
      <path d="M81 226c118 16 255 16 407 0 76-8 141-22 194-42-44 52-133 87-286 98-159 12-265-4-315-56Z" fill="${colors.shadow}" opacity="0.44"/>
    </g>`);
}
function buildCloudStratusSvg(colors) {
  return buildSvgDocument("0 0 840 280", `<defs>
      <linearGradient id="stratus" x1="0" y1="10" x2="0" y2="250" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="35%" stop-color="${colors.primary}"/>
        <stop offset="100%" stop-color="${colors.shadow}"/>
      </linearGradient>
      <filter id="stratus-blur" x="-12%" y="-18%" width="124%" height="160%">
        <feGaussianBlur stdDeviation="9"/>
      </filter>
    </defs>`, `<g filter="url(#stratus-blur)">
      <path d="M0 103c88-31 166-40 244-31 93-38 230-46 327-18 70-24 150-24 269 6v116H0V103Z" fill="url(#stratus)"/>
      <path d="M0 143c158-22 292-24 403-5 160-19 305-15 437 19v49H0v-63Z" fill="${colors.secondary}" opacity="0.52"/>
      <path d="M0 192c161 18 316 20 463 3 146-17 272-47 377-89v134H0V192Z" fill="${colors.shadow}" opacity="0.48"/>
    </g>`);
}
function buildCloudAnvilSvg(colors) {
  return buildSvgDocument("0 0 760 420", `<defs>
      <linearGradient id="anvil" x1="0" y1="20" x2="0" y2="360" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="36%" stop-color="${colors.primary}"/>
        <stop offset="100%" stop-color="${colors.shadow}"/>
      </linearGradient>
      <filter id="anvil-blur" x="-18%" y="-18%" width="136%" height="160%">
        <feGaussianBlur stdDeviation="12"/>
      </filter>
    </defs>`, `<g filter="url(#anvil-blur)">
      <path d="M73 300c-5-56 37-96 103-109 7-108 88-175 188-175 61 0 111 22 146 62 22-7 44-11 67-11 82 0 149 54 165 131 52 12 85 51 85 101 0 67-49 121-109 121H147c-44 0-73-18-74-60 0-21 0-39 0-60Z" fill="url(#anvil)"/>
      <path d="M179 101c24-48 77-79 138-79 52 0 98 21 127 55 47-5 90 8 131 42-31-12-69-14-112-4-38-40-87-58-147-52-56-16-100-6-137 38Z" fill="${colors.highlight}" opacity="0.48"/>
      <path d="M94 312c89 14 190 13 303-2 110-15 209-44 299-89-41 76-141 130-306 149-149 17-244 0-296-58Z" fill="${colors.shadow}" opacity="0.56"/>
    </g>`);
}
function buildCloudShelfSvg(colors) {
  return buildSvgDocument("0 0 840 320", `<defs>
      <linearGradient id="shelf" x1="0" y1="36" x2="0" y2="286" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.primary}"/>
        <stop offset="45%" stop-color="${colors.secondary}"/>
        <stop offset="100%" stop-color="${colors.shadow}"/>
      </linearGradient>
      <filter id="shelf-blur" x="-10%" y="-18%" width="120%" height="160%">
        <feGaussianBlur stdDeviation="9"/>
      </filter>
    </defs>`, `<g filter="url(#shelf-blur)">
      <path d="M0 90c132-34 289-26 426 21 115-33 253-27 414 18v74c-118 38-254 59-408 60C272 264 128 241 0 195V90Z" fill="url(#shelf)"/>
      <path d="M0 145c139 22 281 33 426 33 147 0 285-13 414-40v61c-121 36-260 55-415 55C279 254 137 236 0 200v-55Z" fill="${colors.shadow}" opacity="0.56"/>
      <path d="M92 108c91-14 190-12 296 8 121-24 243-25 362-4-106-8-221 4-344 37-96-25-200-36-314-41Z" fill="${colors.highlight}" opacity="0.28"/>
    </g>`);
}
function buildStormScudSvg(colors) {
  return buildSvgDocument("0 0 820 240", `<defs>
      <linearGradient id="scud" x1="0" y1="18" x2="0" y2="220" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="34%" stop-color="${colors.primary}"/>
        <stop offset="100%" stop-color="${colors.shadow}"/>
      </linearGradient>
      <filter id="scud-blur" x="-14%" y="-28%" width="128%" height="180%">
        <feGaussianBlur stdDeviation="8"/>
      </filter>
    </defs>`, `<g filter="url(#scud-blur)">
      <path d="M0 106c67-38 142-45 223-20 78-35 165-38 258-10 64-25 130-21 198 12 56-12 103-6 141 18v61c-77 28-158 42-243 43-142 1-334-22-577-70v-34Z" fill="url(#scud)"/>
      <path d="M51 134c77-13 157-9 240 14 103-28 213-27 330 6-111-16-222-10-334 17-79-23-157-36-236-37Z" fill="${colors.highlight}" opacity="0.2"/>
      <path d="M0 170c124 27 248 42 371 44 130 2 280-16 449-55v75H0v-64Z" fill="${colors.shadow}" opacity="0.54"/>
    </g>`);
}
function buildFogWispSvg(colors) {
  return buildSvgDocument("0 0 900 240", `<defs>
      <linearGradient id="fog" x1="0" y1="10" x2="0" y2="200" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.48"/>
        <stop offset="50%" stop-color="${colors.primary}" stop-opacity="0.82"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.18"/>
      </linearGradient>
      <filter id="fog-blur" x="-14%" y="-40%" width="128%" height="220%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>`, `<g filter="url(#fog-blur)">
      <path d="M0 133c77-37 166-49 265-33 100-43 225-54 372-32 98-27 186-22 263 16v65c-135 31-253 45-356 44-121-1-303-11-544-28V133Z" fill="url(#fog)"/>
      <path d="M0 155c216 30 430 31 641 1 85-12 171-29 259-52v61c-201 44-392 61-573 52C195 211 86 190 0 162v-7Z" fill="${colors.glow}" opacity="0.34"/>
    </g>`);
}
function buildHorizonRidgeSvg(colors) {
  return buildSvgDocument("0 0 1200 220", `<defs>
      <linearGradient id="ridge" x1="0" y1="36" x2="0" y2="212" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.18"/>
        <stop offset="42%" stop-color="${colors.primary}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.96"/>
      </linearGradient>
      <filter id="ridge-soft" x="-8%" y="-10%" width="116%" height="130%">
        <feGaussianBlur stdDeviation="2.2"/>
      </filter>
    </defs>`, `<g filter="url(#ridge-soft)">
      <path d="M0 162c92-6 153-34 218-74 47-28 91-33 135-16 43-44 82-53 119-30 58-31 111-30 159 1 70-46 134-42 194 11 38-15 87-6 148 26 56-12 131 6 228 54v86H0v-58Z" fill="url(#ridge)"/>
    </g>`);
}
function buildHorizonTreelineSvg(colors) {
  return buildSvgDocument("0 0 1200 240", `<defs>
      <linearGradient id="trees" x1="0" y1="56" x2="0" y2="214" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.18"/>
        <stop offset="30%" stop-color="${colors.primary}" stop-opacity="0.86"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.98"/>
      </linearGradient>
    </defs>`, `<path d="M0 176c16-18 33-22 54-12 7-26 21-40 42-42 10-24 28-38 54-41 16-23 30-35 44-35 18 0 35 12 50 37 8-28 24-44 49-48 18-24 35-36 53-36 20 0 39 12 58 37 13-22 28-32 45-32 16 0 29 9 39 28 12-22 29-33 50-33 21 0 41 12 59 36 15-27 33-40 56-40 19 0 38 12 57 35 11-19 28-29 52-29 23 0 45 13 67 38 13-17 27-24 43-24 25 0 47 15 66 46 18-16 34-24 49-24 29 0 49 15 61 45 15-16 31-24 50-24 24 0 44 14 62 43 16-13 34-19 54-19 30 0 56 16 77 49v85H0v-62Z" fill="url(#trees)"/>`);
}
function buildHorizonPolesSvg(colors) {
  return buildSvgDocument("0 0 1200 240", `<defs>
      <linearGradient id="pole" x1="0" y1="0" x2="0" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.08"/>
        <stop offset="40%" stop-color="${colors.primary}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.96"/>
      </linearGradient>
    </defs>`, `<g stroke="url(#pole)" stroke-linecap="round" stroke-width="7">
      <path d="M126 92v130"/>
      <path d="M128 118h72"/>
      <path d="M386 64v158"/>
      <path d="M388 96h82"/>
      <path d="M702 86v136"/>
      <path d="M704 112h68"/>
      <path d="M986 72v150"/>
      <path d="M988 102h78"/>
      <path d="M122 118c94 13 178 10 258-8 124 18 229 17 321-3 97 15 189 9 287-17" stroke-width="4" stroke-opacity="0.66"/>
    </g>`);
}
function buildPrecipCurtainSvg(colors) {
  return buildSvgDocument("0 0 220 640", `<defs>
      <linearGradient id="curtain" x1="34" y1="0" x2="176" y2="640" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="18%" stop-color="${colors.highlight}" stop-opacity="0.18"/>
        <stop offset="56%" stop-color="${colors.primary}" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="curtain-blur" x="-30%" y="-8%" width="160%" height="116%">
        <feGaussianBlur stdDeviation="4.5"/>
      </filter>
    </defs>`, `<g filter="url(#curtain-blur)">
      <path d="M14 8c20 28 38 68 54 118 15 49 35 111 58 186 17 55 35 128 54 220-26-65-49-122-69-171-24-59-46-122-66-189C30 117 20 62 14 8Z" fill="url(#curtain)"/>
      <path d="M78 0c14 32 29 76 43 130 13 50 31 115 54 194 17 57 32 132 45 226-20-68-39-128-58-180-22-60-42-123-58-190C92 122 83 62 78 0Z" fill="${colors.glow}" opacity="0.34"/>
    </g>`);
}
function buildSurfaceSheenSvg(colors) {
  return buildSvgDocument("0 0 1200 240", `<defs>
      <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="36%" stop-color="${colors.primary}" stop-opacity="0.24"/>
        <stop offset="58%" stop-color="${colors.accent}" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="sheen-blur" x="-8%" y="-50%" width="116%" height="220%">
        <feGaussianBlur stdDeviation="12"/>
      </filter>
    </defs>`, `<g filter="url(#sheen-blur)">
      <path d="M0 168c128-24 244-30 347-18 103-26 231-29 384-8 103-14 259-12 469 8v90H0v-72Z" fill="url(#sheen)"/>
      <path d="M96 156c112 13 238 16 378 9 140-6 288-20 444-41 90-12 184-14 282-7-150 30-293 50-431 60-169 12-394 7-673-21Z" fill="${colors.glow}" opacity="0.34"/>
      <path d="M0 198c160 24 352 32 576 24 222-8 430-30 624-67v85H0v-42Z" fill="${colors.shadow}" opacity="0.18"/>
    </g>`);
}
function buildSurfaceSplashSvg(colors) {
  return buildSvgDocument("0 0 220 140", `<defs>
      <radialGradient id="splash-core" cx="50%" cy="58%" r="54%">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.88"/>
        <stop offset="54%" stop-color="${colors.primary}" stop-opacity="0.72"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </radialGradient>
      <filter id="splash-blur" x="-24%" y="-24%" width="148%" height="168%">
        <feGaussianBlur stdDeviation="3.6"/>
      </filter>
    </defs>`, `<g filter="url(#splash-blur)">
      <ellipse cx="110" cy="104" rx="84" ry="20" fill="url(#splash-core)"/>
      <path d="M38 100c12-9 23-24 31-46 9 17 14 33 14 47 11-17 21-39 28-65 10 17 15 33 16 48 12-15 23-35 31-58 10 15 15 31 14 48 11-13 20-30 28-51 11 15 16 29 15 43 10-8 17-18 21-31 2 15-1 30-10 45H38Z" fill="${colors.accent}" opacity="0.56"/>
      <circle cx="54" cy="54" r="10" fill="${colors.glow}" opacity="0.48"/>
      <circle cx="92" cy="36" r="7" fill="${colors.highlight}" opacity="0.52"/>
      <circle cx="148" cy="28" r="8" fill="${colors.highlight}" opacity="0.46"/>
      <circle cx="186" cy="52" r="9" fill="${colors.glow}" opacity="0.42"/>
    </g>`);
}
function buildSurfaceRunoffSvg(colors) {
  return buildSvgDocument("0 0 180 560", `<defs>
      <linearGradient id="runoff" x1="24" y1="0" x2="156" y2="560" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="18%" stop-color="${colors.highlight}" stop-opacity="0.6"/>
        <stop offset="52%" stop-color="${colors.primary}" stop-opacity="0.66"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="runoff-blur" x="-40%" y="-10%" width="180%" height="120%">
        <feGaussianBlur stdDeviation="4.4"/>
      </filter>
    </defs>`, `<g filter="url(#runoff-blur)">
      <path d="M32 0c18 42 30 96 36 161 5 54 17 126 36 214 13 60 23 122 28 185-18-53-33-102-43-149-15-67-29-141-42-220C39 112 34 49 32 0Z" fill="url(#runoff)"/>
      <path d="M82 0c15 38 29 86 40 145 11 56 27 132 47 230 12 61 21 123 25 185-15-52-29-99-40-143-18-71-34-147-48-228C97 110 89 48 82 0Z" fill="${colors.glow}" opacity="0.34"/>
      <path d="M118 34c12 24 23 56 32 96 8 39 21 93 38 163-16-39-29-75-39-109-13-46-23-96-31-150Z" fill="${colors.accent}" opacity="0.26"/>
    </g>`);
}
function buildSurfaceAccumulationSvg(colors) {
  return buildSvgDocument("0 0 1200 180", `<defs>
      <linearGradient id="accum" x1="0" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.24"/>
        <stop offset="52%" stop-color="${colors.primary}" stop-opacity="0.88"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.3"/>
      </linearGradient>
      <filter id="accum-soft" x="-6%" y="-20%" width="112%" height="160%">
        <feGaussianBlur stdDeviation="2.6"/>
      </filter>
    </defs>`, `<g filter="url(#accum-soft)">
      <path d="M0 126c45-18 90-23 133-16 58-23 125-28 199-15 49-14 103-12 160 4 45-17 97-18 156-4 61-18 131-17 209 4 54-14 111-11 171 9 53-10 111-6 172 11v61H0v-54Z" fill="url(#accum)"/>
      <path d="M44 108c53-6 103-1 150 15 63-18 131-17 203 5 69-16 146-15 232 5 58-13 121-11 187 7 79-12 140-8 183 12-82-12-161-16-237-10-76 7-146 4-211-8-76-14-149-16-218-4-67-19-130-26-189-22Z" fill="${colors.glow}" opacity="0.38"/>
    </g>`);
}
function buildCondensationBloomSvg(colors) {
  return buildSvgDocument("0 0 260 220", `<defs>
      <radialGradient id="condense-a" cx="38%" cy="34%" r="48%">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.88"/>
        <stop offset="100%" stop-color="${colors.primary}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="condense-b" cx="68%" cy="58%" r="54%">
        <stop offset="0%" stop-color="${colors.glow}" stop-opacity="0.58"/>
        <stop offset="100%" stop-color="${colors.secondary}" stop-opacity="0"/>
      </radialGradient>
      <filter id="condense-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="10"/>
      </filter>
    </defs>`, `<g filter="url(#condense-blur)">
      <ellipse cx="88" cy="74" rx="74" ry="54" fill="url(#condense-a)"/>
      <ellipse cx="160" cy="132" rx="88" ry="58" fill="url(#condense-b)"/>
      <ellipse cx="176" cy="66" rx="52" ry="34" fill="${colors.accent}" opacity="0.22"/>
      <path d="M52 132c26 12 54 18 84 18 32 0 64-7 96-22-28 21-63 33-104 35-31 1-57-9-76-31Z" fill="${colors.glow}" opacity="0.28"/>
    </g>`);
}
function buildFogCreepSvg(colors) {
  return buildSvgDocument("0 0 1200 260", `<defs>
      <linearGradient id="creep" x1="0" y1="0" x2="0" y2="260" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="44%" stop-color="${colors.primary}" stop-opacity="0.66"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="creep-soft" x="-10%" y="-34%" width="120%" height="200%">
        <feGaussianBlur stdDeviation="14"/>
      </filter>
    </defs>`, `<g filter="url(#creep-soft)">
      <path d="M0 170c74-30 162-40 263-31 80-26 183-28 308-6 104-26 216-24 335 6 96-14 194-6 294 25v96H0v-90Z" fill="url(#creep)"/>
      <path d="M0 190c151 24 287 32 408 23 145-11 283-31 415-60 144 31 270 62 377 92v15H0v-70Z" fill="${colors.glow}" opacity="0.26"/>
    </g>`);
}
function buildRainStreakSvg(colors) {
  return buildSvgDocument("0 0 32 192", `<defs>
      <linearGradient id="rain" x1="16" y1="0" x2="16" y2="192" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="16%" stop-color="${colors.highlight}" stop-opacity="0.85"/>
        <stop offset="62%" stop-color="${colors.primary}" stop-opacity="0.94"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="rain-blur" x="-120%" y="-10%" width="240%" height="120%">
        <feGaussianBlur stdDeviation="1.6"/>
      </filter>
    </defs>`, `<g filter="url(#rain-blur)">
      <path d="M14 6C16 2 20 2 22 6c4 15 4 42-3 100-2 18-4 44-4 74-5-20-7-47-8-73C4 48 8 18 14 6Z" fill="url(#rain)"/>
      <path d="M16 16c1-4 5-4 6 0 2 18 0 45-4 83-1 11-2 25-2 38-3-9-5-23-5-38 0-40 1-68 5-83Z" fill="${colors.glow}" opacity="0.28"/>
    </g>`);
}
function buildSnowCrystalSvg(colors) {
  return buildSvgDocument("0 0 96 96", `<defs>
      <radialGradient id="snow-core" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="100%" stop-color="${colors.primary}"/>
      </radialGradient>
      <filter id="snow-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="1.4"/>
      </filter>
    </defs>`, `<g stroke="${colors.primary}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M48 12v72"/>
      <path d="M16 30l64 36"/>
      <path d="M16 66l64-36"/>
      <path d="M48 12l-7 12m7-12 7 12m-39 6 14 1m-14-1 6 12m43-12-14 1m14-1-6 12m0 36-14-1m14 1-6-12m-43 12 14-1m-14 1 6-12m25 8-7-12m7 12 7-12"/>
    </g>
    <circle cx="48" cy="48" r="12" fill="url(#snow-core)" filter="url(#snow-glow)" opacity="0.92"/>
    <circle cx="48" cy="48" r="6" fill="${colors.glow}" opacity="0.45"/>`);
}
function buildGlassDropSvg(colors) {
  return buildSvgDocument("0 0 96 132", `<defs>
      <radialGradient id="drop" cx="36%" cy="28%" r="78%">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.96"/>
        <stop offset="36%" stop-color="${colors.primary}" stop-opacity="0.94"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.24"/>
      </radialGradient>
      <filter id="drop-shadow" x="-30%" y="-20%" width="160%" height="170%">
        <feGaussianBlur stdDeviation="2.4"/>
      </filter>
    </defs>`, `<g filter="url(#drop-shadow)">
      <path d="M48 8c17 26 30 41 36 58 8 24 0 53-19 65-11 7-25 8-37 3-24-10-35-38-26-66C10 47 27 34 48 8Z" fill="url(#drop)"/>
      <path d="M31 32c7-11 14-17 24-19-8 11-12 21-14 33-11 0-16-5-10-14Z" fill="${colors.glow}" opacity="0.58"/>
      <path d="M62 68c8 14 3 31-10 39-10 6-21 5-31-2 10 4 21 2 29-5 7-6 11-18 12-32Z" fill="${colors.shadow}" opacity="0.26"/>
    </g>`);
}
function buildGlassRivuletSvg(colors) {
  return buildSvgDocument("0 0 72 420", `<defs>
      <linearGradient id="rivulet" x1="36" y1="0" x2="36" y2="420" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="12%" stop-color="${colors.highlight}" stop-opacity="0.9"/>
        <stop offset="52%" stop-color="${colors.primary}" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="rivulet-blur" x="-80%" y="-10%" width="240%" height="120%">
        <feGaussianBlur stdDeviation="1.9"/>
      </filter>
    </defs>`, `<g filter="url(#rivulet-blur)">
      <path d="M35 8c10 23 13 49 7 79-10 52-14 100-10 141 5 46 0 96-13 150 18-41 29-80 31-115 3-48 4-86 13-128 8-37 8-80-2-127-7-8-18-8-26 0Z" fill="url(#rivulet)"/>
      <path d="M33 38c4-8 11-8 13 0 5 28 3 58-4 92-6 31-9 63-8 97-3-16-5-42-4-79 1-44 2-81 3-110Z" fill="${colors.glow}" opacity="0.25"/>
    </g>`);
}
function buildLightningForkSvg(colors) {
  return buildSvgDocument("0 0 220 560", `<defs>
      <filter id="lightning-glow" x="-40%" y="-10%" width="180%" height="130%">
        <feGaussianBlur stdDeviation="6"/>
      </filter>
      <linearGradient id="bolt" x1="110" y1="0" x2="110" y2="560" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="50%" stop-color="${colors.accent}"/>
        <stop offset="100%" stop-color="${colors.primary}"/>
      </linearGradient>
    </defs>`, `<g filter="url(#lightning-glow)">
      <path d="M106 8 72 160l45-3-54 149 53-9-40 163 92-198-44 8 61-143-49 4 31-123Z" fill="url(#bolt)"/>
      <path d="M86 170 41 252l40-14-18 77 53-108-30 7 22-44-22 0Z" fill="${colors.glow}" opacity="0.56"/>
      <path d="M142 235 108 298l29-12-9 53 43-82-24 6 11-28-16 0Z" fill="${colors.glow}" opacity="0.42"/>
    </g>`);
}
function buildSpriteSvg(kind, colors) {
  switch (kind) {
    case "cloud-wisp":
      return buildCloudWispSvg(colors);
    case "cloud-bank":
      return buildCloudBankSvg(colors);
    case "cloud-stratus":
      return buildCloudStratusSvg(colors);
    case "cloud-anvil":
      return buildCloudAnvilSvg(colors);
    case "cloud-shelf":
      return buildCloudShelfSvg(colors);
    case "storm-scud":
      return buildStormScudSvg(colors);
    case "fog-wisp":
      return buildFogWispSvg(colors);
    case "horizon-ridge":
      return buildHorizonRidgeSvg(colors);
    case "horizon-treeline":
      return buildHorizonTreelineSvg(colors);
    case "horizon-poles":
      return buildHorizonPolesSvg(colors);
    case "precip-curtain":
      return buildPrecipCurtainSvg(colors);
    case "surface-sheen":
      return buildSurfaceSheenSvg(colors);
    case "surface-splash":
      return buildSurfaceSplashSvg(colors);
    case "surface-runoff":
      return buildSurfaceRunoffSvg(colors);
    case "surface-accumulation":
      return buildSurfaceAccumulationSvg(colors);
    case "condensation-bloom":
      return buildCondensationBloomSvg(colors);
    case "fog-creep":
      return buildFogCreepSvg(colors);
    case "rain-streak":
      return buildRainStreakSvg(colors);
    case "snow-crystal":
      return buildSnowCrystalSvg(colors);
    case "glass-drop":
      return buildGlassDropSvg(colors);
    case "glass-rivulet":
      return buildGlassRivuletSvg(colors);
    case "lightning-fork":
      return buildLightningForkSvg(colors);
    default:
      return buildCloudWispSvg(colors);
  }
}
function loadSprite(key, svg) {
  const existing = pendingSprites.get(key);
  if (existing)
    return existing;
  const promise = new Promise((resolve, reject) => {
    const image = new Image;
    image.decoding = "async";
    image.onload = () => {
      readySprites.set(key, image);
      pendingSprites.delete(key);
      const callbacks = pendingReadyCallbacks.get(key);
      pendingReadyCallbacks.delete(key);
      if (callbacks) {
        for (const callback of callbacks)
          callback();
      }
      resolve(image);
    };
    image.onerror = () => {
      pendingSprites.delete(key);
      pendingReadyCallbacks.delete(key);
      reject(new Error(`Failed to load weather sprite: ${key}`));
    };
    image.src = svgToDataUri(svg);
  });
  pendingSprites.set(key, promise);
  return promise;
}
function queueReadyCallback(key, onReady) {
  const callbacks = pendingReadyCallbacks.get(key);
  if (callbacks) {
    callbacks.add(onReady);
    return;
  }
  pendingReadyCallbacks.set(key, new Set([onReady]));
}
function buildKey(kind, colors) {
  return [
    kind,
    colors.primary,
    colors.secondary,
    colors.shadow,
    colors.highlight,
    colors.accent,
    colors.glow
  ].join("|");
}
function requestWeatherSprite(kind, colors, onReady) {
  const key = buildKey(kind, colors);
  const ready = readySprites.get(key);
  if (ready)
    return ready;
  if (onReady) {
    queueReadyCallback(key, onReady);
  }
  if (pendingSprites.has(key))
    return null;
  const svg = spriteSvgCache.get(key) ?? buildSpriteSvg(kind, colors);
  spriteSvgCache.set(key, svg);
  loadSprite(key, svg).catch(() => {
    return;
  });
  return null;
}

// src/render/quality.ts
var WEATHER_QUALITY_BUDGETS = {
  performance: {
    resolutionScale: 0.72,
    maxDevicePixelRatio: 1,
    maxPixelCount: 540000,
    frameIntervalMs: 1000 / 24,
    slowPassIntervalMs: 250,
    stars: 10,
    motes: 0,
    cloudLayers: 1,
    cloudSprites: 3,
    frontCloudSprites: 0,
    fogWisps: 1,
    frontMistWisps: 0,
    anchorBands: 1,
    scudLayers: 0,
    shadowPasses: 1,
    horizonGlowPasses: 1,
    rainBack: 24,
    rainFront: 16,
    rainCurtains: 0,
    curtainTextures: 0,
    contactBands: 0,
    impactBursts: 0,
    runoffSheets: 0,
    accumulationBands: 0,
    condensationBlooms: 0,
    fogCreepBands: 0,
    shadowSweepPasses: 0,
    distortionPasses: 0,
    snowBack: 20,
    snowFront: 20,
    snowGusts: 0,
    glassBeads: 0,
    glassRivulets: 0,
    lightningBranches: 1,
    lightningForks: 0,
    lightningGlow: 0.64,
    flags: {
      stars: true,
      motes: false,
      layeredClouds: false,
      frontCloudBank: false,
      deepOvercast: false,
      distantCurtains: false,
      texturedCurtains: false,
      glassOverlay: false,
      glassDroplets: false,
      frostOverlay: false,
      lightningForks: false,
      relightAnchors: false,
      horizonPoles: false,
      multiFlash: false
    }
  },
  lite: {
    resolutionScale: 0.82,
    maxDevicePixelRatio: 1,
    maxPixelCount: 760000,
    frameIntervalMs: 1000 / 30,
    slowPassIntervalMs: 250,
    stars: 16,
    motes: 2,
    cloudLayers: 1,
    cloudSprites: 4,
    frontCloudSprites: 0,
    fogWisps: 2,
    frontMistWisps: 1,
    anchorBands: 2,
    scudLayers: 1,
    shadowPasses: 1,
    horizonGlowPasses: 1,
    rainBack: 36,
    rainFront: 24,
    rainCurtains: 1,
    curtainTextures: 0,
    contactBands: 0,
    impactBursts: 0,
    runoffSheets: 0,
    accumulationBands: 0,
    condensationBlooms: 0,
    fogCreepBands: 0,
    shadowSweepPasses: 0,
    distortionPasses: 0,
    snowBack: 28,
    snowFront: 28,
    snowGusts: 1,
    glassBeads: 0,
    glassRivulets: 0,
    lightningBranches: 1,
    lightningForks: 0,
    lightningGlow: 0.72,
    flags: {
      stars: true,
      motes: true,
      layeredClouds: true,
      frontCloudBank: false,
      deepOvercast: false,
      distantCurtains: true,
      texturedCurtains: false,
      glassOverlay: false,
      glassDroplets: false,
      frostOverlay: false,
      lightningForks: false,
      relightAnchors: false,
      horizonPoles: false,
      multiFlash: false
    }
  },
  standard: {
    resolutionScale: 0.9,
    maxDevicePixelRatio: 1.15,
    maxPixelCount: 980000,
    frameIntervalMs: 1000 / 30,
    slowPassIntervalMs: 180,
    stars: 24,
    motes: 4,
    cloudLayers: 2,
    cloudSprites: 5,
    frontCloudSprites: 0,
    fogWisps: 2,
    frontMistWisps: 1,
    anchorBands: 3,
    scudLayers: 1,
    shadowPasses: 2,
    horizonGlowPasses: 2,
    rainBack: 52,
    rainFront: 32,
    rainCurtains: 1,
    curtainTextures: 0,
    contactBands: 0,
    impactBursts: 0,
    runoffSheets: 0,
    accumulationBands: 0,
    condensationBlooms: 0,
    fogCreepBands: 0,
    shadowSweepPasses: 0,
    distortionPasses: 1,
    snowBack: 40,
    snowFront: 36,
    snowGusts: 1,
    glassBeads: 3,
    glassRivulets: 1,
    lightningBranches: 1,
    lightningForks: 1,
    lightningGlow: 0.9,
    flags: {
      stars: true,
      motes: true,
      layeredClouds: true,
      frontCloudBank: false,
      deepOvercast: true,
      distantCurtains: true,
      texturedCurtains: false,
      glassOverlay: true,
      glassDroplets: true,
      frostOverlay: false,
      lightningForks: true,
      relightAnchors: true,
      horizonPoles: true,
      multiFlash: false
    }
  },
  cinematic: {
    resolutionScale: 1,
    maxDevicePixelRatio: 1.3,
    maxPixelCount: 1280000,
    frameIntervalMs: 1000 / 36,
    slowPassIntervalMs: 120,
    stars: 34,
    motes: 6,
    cloudLayers: 2,
    cloudSprites: 6,
    frontCloudSprites: 0,
    fogWisps: 3,
    frontMistWisps: 2,
    anchorBands: 4,
    scudLayers: 1,
    shadowPasses: 2,
    horizonGlowPasses: 3,
    rainBack: 72,
    rainFront: 40,
    rainCurtains: 2,
    curtainTextures: 1,
    contactBands: 0,
    impactBursts: 0,
    runoffSheets: 0,
    accumulationBands: 0,
    condensationBlooms: 0,
    fogCreepBands: 0,
    shadowSweepPasses: 0,
    distortionPasses: 1,
    snowBack: 56,
    snowFront: 44,
    snowGusts: 2,
    glassBeads: 5,
    glassRivulets: 2,
    lightningBranches: 1,
    lightningForks: 1,
    lightningGlow: 1,
    flags: {
      stars: true,
      motes: true,
      layeredClouds: true,
      frontCloudBank: false,
      deepOvercast: true,
      distantCurtains: true,
      texturedCurtains: true,
      glassOverlay: true,
      glassDroplets: true,
      frostOverlay: false,
      lightningForks: true,
      relightAnchors: true,
      horizonPoles: true,
      multiFlash: false
    }
  }
};
function getQualityBudget(quality) {
  return WEATHER_QUALITY_BUDGETS[quality];
}

// src/render/renderer.ts
var PALETTE_BASES = {
  dawn: {
    skyTop: "#1f3558",
    skyMid: "#566fa0",
    skyBottom: "#efa06a",
    horizon: "#ffd3a7",
    sun: "#ffd8a7",
    moon: "#dce7ff"
  },
  day: {
    skyTop: "#4071a9",
    skyMid: "#7ca7de",
    skyBottom: "#dff0ff",
    horizon: "#f7fbff",
    sun: "#fff0be",
    moon: "#dce7ff"
  },
  dusk: {
    skyTop: "#1d1f4a",
    skyMid: "#6a4a77",
    skyBottom: "#ea875c",
    horizon: "#ffccac",
    sun: "#ffbb8b",
    moon: "#e0e6ff"
  },
  night: {
    skyTop: "#040f1b",
    skyMid: "#10263a",
    skyBottom: "#2b4a69",
    horizon: "#7ba0d8",
    sun: "#ffd9a8",
    moon: "#dce6ff"
  },
  storm: {
    skyTop: "#050f19",
    skyMid: "#13273a",
    skyBottom: "#32485d",
    horizon: "#8ba3b6",
    sun: "#c9ddff",
    moon: "#dbe8ff"
  },
  "storm-night": {
    skyTop: "#020910",
    skyMid: "#0a1826",
    skyBottom: "#1e3449",
    horizon: "#6989aa",
    sun: "#c7dbff",
    moon: "#dbe8ff"
  },
  mist: {
    skyTop: "#20313d",
    skyMid: "#5c6d78",
    skyBottom: "#b5c2c8",
    horizon: "#eef4f7",
    sun: "#f9f8ed",
    moon: "#eef4ff"
  },
  snow: {
    skyTop: "#435c76",
    skyMid: "#8398ac",
    skyBottom: "#e4edf6",
    horizon: "#f9fcff",
    sun: "#fff5e6",
    moon: "#eef4ff"
  }
};
function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((segment) => segment + segment).join("") : value;
  const parsed = Number.parseInt(normalized, 16);
  return {
    r: parsed >> 16 & 255,
    g: parsed >> 8 & 255,
    b: parsed & 255
  };
}
function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
}
function mixHex(a, b, amount) {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  return rgbToHex(left.r + (right.r - left.r) * amount, left.g + (right.g - left.g) * amount, left.b + (right.b - left.b) * amount);
}
function rgba(hex, alpha) {
  const value = hexToRgb(hex);
  return `rgba(${value.r}, ${value.g}, ${value.b}, ${clamp(alpha, 0, 1).toFixed(3)})`;
}
function withLight(hex, amount) {
  return mixHex(hex, "#ffffff", amount);
}
function withShade(hex, amount) {
  return mixHex(hex, "#05070b", amount);
}
function hashString(value) {
  let hash = 2166136261;
  for (let index = 0;index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function createRng(seed) {
  let current = seed >>> 0;
  return () => {
    current += 1831565813;
    let output = current;
    output = Math.imul(output ^ output >>> 15, output | 1);
    output ^= output + Math.imul(output ^ output >>> 7, output | 61);
    return ((output ^ output >>> 14) >>> 0) / 4294967296;
  };
}
function pick(rng, values) {
  return values[Math.floor(rng() * values.length)] ?? values[0];
}
function parseHour(value) {
  const match = value.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match)
    return null;
  let hour = Number.parseInt(match[1], 10);
  if (!Number.isFinite(hour))
    return null;
  const meridiem = (match[3] || "").toUpperCase();
  if (meridiem === "AM" && hour === 12)
    hour = 0;
  if (meridiem === "PM" && hour < 12)
    hour += 12;
  return clamp(hour, 0, 23);
}
function resolvePhase(state) {
  if (state.palette === "dawn" || state.palette === "day" || state.palette === "dusk" || state.palette === "night") {
    return state.palette;
  }
  const hour = parseHour(state.time);
  if (hour === null)
    return state.condition === "storm" ? "night" : "day";
  if (hour < 6)
    return "night";
  if (hour < 9)
    return "dawn";
  if (hour < 18)
    return "day";
  if (hour < 21)
    return "dusk";
  return "night";
}
function resolveEffectiveLayerMode(state, prefs) {
  return prefs.layerMode === "auto" ? state.layer : prefs.layerMode;
}
function trimArray(items, count) {
  if (count <= 0)
    return [];
  if (count >= items.length)
    return items;
  return items.slice(0, count);
}
function buildSceneProfile(state, effectiveIntensity) {
  const phase = resolvePhase(state);
  const intensity = clamp(effectiveIntensity, 0.2, 1.5);
  const isNight = phase === "night";
  const paletteKey = state.condition === "storm" && isNight ? "storm-night" : state.condition === "storm" ? "storm" : state.condition === "fog" ? "mist" : state.condition === "snow" ? "snow" : state.palette;
  const base = PALETTE_BASES[paletteKey];
  let skyTop = base.skyTop;
  let skyMid = base.skyMid;
  let skyBottom = base.skyBottom;
  let horizonGlow = withLight(base.horizon, 0.08);
  let vignette = rgba(withShade(base.skyTop, 0.6), 0.22);
  let cloudLight = withLight(base.skyMid, 0.48);
  let cloudMid = mixHex(base.skyMid, base.skyBottom, 0.34);
  let cloudShadow = withShade(base.skyTop, 0.52);
  let cloudAccent = withLight(base.skyBottom, 0.24);
  let fogLight = withLight(base.skyBottom, 0.56);
  let fogShadow = mixHex(base.skyMid, base.skyTop, 0.62);
  let mistColor = mixHex(base.skyBottom, base.skyMid, 0.28);
  let rainColor = isNight ? "#d4e4ff" : "#bed8ff";
  let snowColor = isNight ? "#e5efff" : "#f8fbff";
  let lightningColor = "#f6fbff";
  let lightningGlow = "#b8dcff";
  let glassTint = rgba(withLight(base.skyMid, 0.3), 0.18);
  let glassGlow = rgba(withLight(base.skyBottom, 0.4), 0.24);
  let anchorFarColor = mixHex(base.skyTop, "#0b1015", 0.56);
  let anchorNearColor = mixHex(base.skyMid, "#0d1218", 0.66);
  let anchorRimColor = rgba(withLight(base.horizon, 0.16), 0.34);
  let terrainMistColor = rgba(withLight(base.skyBottom, 0.12), 0.24);
  let surfaceLight = withLight(base.horizon, 0.18);
  let surfaceMid = mixHex(base.skyBottom, base.horizon, 0.28);
  let surfaceShadow = mixHex(base.skyTop, "#091019", 0.72);
  let celestialAlpha = phase === "day" ? 0.82 : phase === "dawn" || phase === "dusk" ? 0.54 : 0.28;
  let starAlpha = isNight ? 0.82 : phase === "dusk" || phase === "dawn" ? 0.2 : 0;
  let overcast = 0.08;
  let haze = 0.1;
  let fogDensity = 0.04;
  let precipitation = 0;
  let wind = 0.22;
  let turbulence = 0.12;
  let cloudCeiling = 0.18;
  let cloudAlpha = isNight ? 0.2 : 0.28;
  let frontCloudAlpha = 0.06;
  let mistAlpha = 0.08;
  let frontMistAlpha = 0.06;
  let curtainAlpha = 0;
  let distantPrecipAlpha = 0;
  let nearPrecipAlpha = 0;
  let windowOpacity = 0;
  let glassBlur = 0;
  let frostOpacity = 0;
  let horizonLift = 0.14;
  let anchorAlpha = 0.2;
  let relightAlpha = 0.12;
  let occlusionStrength = 0.18;
  let contactHazeAlpha = 0.06;
  let wetSheenAlpha = 0.08;
  let impactAlpha = 0;
  let runoffAlpha = 0;
  let accumulationAlpha = 0;
  let fogCreepAlpha = 0.04;
  let condensationAlpha = 0;
  let distortionAlpha = 0.04;
  let shadowSweepAlpha = 0.04;
  let thermalShimmerAlpha = phase === "day" ? 0.1 : phase === "dawn" || phase === "dusk" ? 0.06 : 0.02;
  let horizonGlintAlpha = phase === "day" ? 0.16 : phase === "dawn" || phase === "dusk" ? 0.24 : 0.04;
  let surfaceRelightAlpha = 0.08;
  switch (state.condition) {
    case "cloudy":
      skyMid = mixHex(base.skyMid, "#8798ab", 0.34);
      skyBottom = mixHex(base.skyBottom, "#a8b8c8", 0.5);
      horizonGlow = withLight(skyBottom, 0.18);
      cloudLight = withLight(skyMid, 0.34);
      cloudMid = mixHex(skyMid, skyBottom, 0.24);
      cloudShadow = withShade(skyTop, 0.42);
      cloudAccent = withLight(skyBottom, 0.14);
      fogLight = withLight(skyBottom, 0.28);
      fogShadow = mixHex(skyMid, skyTop, 0.58);
      celestialAlpha = 0.16;
      starAlpha = isNight ? 0.03 : 0;
      overcast = 0.52;
      haze = 0.16;
      fogDensity = 0.12;
      wind = 0.28;
      turbulence = 0.22;
      cloudCeiling = 0.48;
      cloudAlpha = 0.78;
      frontCloudAlpha = 0.12;
      mistAlpha = 0.14;
      frontMistAlpha = 0.08;
      anchorFarColor = mixHex(skyTop, "#11161c", 0.54);
      anchorNearColor = mixHex(skyMid, "#121820", 0.64);
      anchorRimColor = rgba(withLight(skyBottom, 0.12), 0.22);
      terrainMistColor = rgba(withLight(skyBottom, 0.04), 0.18);
      surfaceLight = mixHex(skyBottom, "#e6edf4", 0.24);
      surfaceMid = mixHex(skyBottom, "#9aa9b8", 0.42);
      surfaceShadow = mixHex(skyTop, "#0e151d", 0.72);
      horizonLift = 0.18;
      anchorAlpha = 0.34;
      relightAlpha = 0.14;
      occlusionStrength = 0.28;
      contactHazeAlpha = 0.05;
      wetSheenAlpha = 0.02;
      fogCreepAlpha = 0.06;
      shadowSweepAlpha = 0.12;
      thermalShimmerAlpha = 0.02;
      horizonGlintAlpha = 0.06;
      surfaceRelightAlpha = 0.1;
      break;
    case "rain":
      skyTop = withShade(base.skyTop, 0.24);
      skyMid = mixHex(base.skyMid, "#44556a", 0.56);
      skyBottom = mixHex(base.skyBottom, "#6d8094", 0.64);
      horizonGlow = withLight(skyBottom, 0.12);
      cloudLight = withLight(skyMid, 0.2);
      cloudMid = mixHex(skyMid, skyBottom, 0.14);
      cloudShadow = withShade(skyTop, 0.24);
      cloudAccent = mixHex(skyBottom, "#b0c3d8", 0.34);
      fogLight = mixHex(skyBottom, "#b6c4d2", 0.4);
      fogShadow = mixHex(skyMid, skyTop, 0.7);
      mistColor = mixHex(skyBottom, "#d9e6f4", 0.24);
      celestialAlpha = 0.08;
      starAlpha = 0;
      overcast = 0.84;
      haze = 0.24;
      fogDensity = 0.22;
      precipitation = 0.76;
      wind = 0.44;
      turbulence = 0.3;
      cloudCeiling = 0.76;
      cloudAlpha = 0.98;
      frontCloudAlpha = 0.38;
      mistAlpha = 0.28;
      frontMistAlpha = 0.24;
      curtainAlpha = 0.44;
      distantPrecipAlpha = 0.36;
      nearPrecipAlpha = 0.86;
      windowOpacity = 0.24;
      glassBlur = 0.8;
      anchorFarColor = mixHex(skyTop, "#0c1116", 0.48);
      anchorNearColor = mixHex(skyMid, "#11161c", 0.72);
      anchorRimColor = rgba(withLight(skyBottom, 0.08), 0.14);
      terrainMistColor = rgba(withLight(skyBottom, 0.06), 0.24);
      surfaceLight = mixHex(skyBottom, "#c8d6e6", 0.26);
      surfaceMid = mixHex(skyBottom, "#6b8094", 0.46);
      surfaceShadow = mixHex(skyTop, "#091018", 0.78);
      horizonLift = 0.22;
      anchorAlpha = 0.28;
      relightAlpha = 0.2;
      occlusionStrength = 0.42;
      contactHazeAlpha = 0.1;
      wetSheenAlpha = 0.18;
      impactAlpha = 0.36;
      runoffAlpha = 0.38;
      fogCreepAlpha = 0.08;
      condensationAlpha = 0.12;
      distortionAlpha = 0.08;
      shadowSweepAlpha = 0.1;
      horizonGlintAlpha = 0.08;
      surfaceRelightAlpha = 0.24;
      break;
    case "storm":
      skyTop = withShade(base.skyTop, 0.12);
      skyMid = mixHex(base.skyMid, "#2e3b4f", 0.56);
      skyBottom = mixHex(base.skyBottom, "#44586e", 0.52);
      horizonGlow = withLight(skyBottom, 0.12);
      cloudLight = mixHex(skyMid, "#8298af", 0.18);
      cloudMid = mixHex(skyMid, skyBottom, 0.08);
      cloudShadow = withShade(skyTop, 0.16);
      cloudAccent = mixHex("#97abc0", skyBottom, 0.5);
      fogLight = mixHex(skyBottom, "#9bb0c1", 0.24);
      fogShadow = mixHex(skyMid, skyTop, 0.78);
      mistColor = mixHex(skyBottom, "#bfd1e0", 0.22);
      rainColor = "#d7e8ff";
      lightningColor = "#fbfeff";
      lightningGlow = "#c4e1ff";
      glassTint = rgba("#87a3bc", 0.22);
      glassGlow = rgba("#dcecff", 0.26);
      celestialAlpha = 0.04;
      starAlpha = 0;
      overcast = 1;
      haze = 0.32;
      fogDensity = 0.32;
      precipitation = 1;
      wind = 0.72;
      turbulence = 0.72;
      cloudCeiling = 0.9;
      cloudAlpha = 1;
      frontCloudAlpha = 0.58;
      mistAlpha = 0.32;
      frontMistAlpha = 0.3;
      curtainAlpha = 0.62;
      distantPrecipAlpha = 0.46;
      nearPrecipAlpha = 0.98;
      windowOpacity = 0.32;
      glassBlur = 1;
      anchorFarColor = mixHex(skyTop, "#06090d", 0.42);
      anchorNearColor = mixHex(skyMid, "#0d1218", 0.78);
      anchorRimColor = rgba(withLight(lightningGlow, 0.16), 0.28);
      terrainMistColor = rgba(withLight(skyBottom, 0.08), 0.2);
      surfaceLight = mixHex(lightningGlow, skyBottom, 0.42);
      surfaceMid = mixHex(skyBottom, "#4e6072", 0.56);
      surfaceShadow = mixHex(skyTop, "#05080c", 0.84);
      horizonLift = 0.16;
      anchorAlpha = 0.4;
      relightAlpha = 0.42;
      occlusionStrength = 0.58;
      contactHazeAlpha = 0.14;
      wetSheenAlpha = 0.24;
      impactAlpha = 0.52;
      runoffAlpha = 0.58;
      fogCreepAlpha = 0.12;
      condensationAlpha = 0.18;
      distortionAlpha = 0.12;
      shadowSweepAlpha = 0.14;
      horizonGlintAlpha = 0.04;
      thermalShimmerAlpha = 0;
      surfaceRelightAlpha = 0.48;
      break;
    case "snow":
      skyTop = mixHex(base.skyTop, "#557190", 0.22);
      skyMid = mixHex(base.skyMid, "#c1d0dd", 0.28);
      skyBottom = mixHex(base.skyBottom, "#f6f9fd", 0.14);
      horizonGlow = withLight(skyBottom, 0.06);
      cloudLight = withLight(skyMid, 0.24);
      cloudMid = mixHex(skyMid, skyBottom, 0.18);
      cloudShadow = mixHex(skyTop, "#455a72", 0.54);
      cloudAccent = withLight(skyBottom, 0.08);
      fogLight = mixHex(skyBottom, "#ffffff", 0.2);
      fogShadow = mixHex(skyMid, skyTop, 0.5);
      mistColor = mixHex(skyBottom, "#f5fbff", 0.1);
      celestialAlpha = isNight ? 0.22 : 0.34;
      starAlpha = 0;
      overcast = 0.62;
      haze = 0.22;
      fogDensity = 0.18;
      precipitation = 0.78;
      wind = 0.36;
      turbulence = 0.24;
      cloudCeiling = 0.66;
      cloudAlpha = 0.58;
      frontCloudAlpha = 0.08;
      mistAlpha = 0.18;
      frontMistAlpha = 0.2;
      curtainAlpha = 0.08;
      distantPrecipAlpha = 0.12;
      nearPrecipAlpha = 0.82;
      windowOpacity = 0.1;
      glassBlur = 0.45;
      frostOpacity = 0.34;
      anchorFarColor = mixHex(skyTop, "#17212b", 0.42);
      anchorNearColor = mixHex(skyMid, "#243341", 0.56);
      anchorRimColor = rgba(withLight(skyBottom, 0.1), 0.2);
      terrainMistColor = rgba(withLight(skyBottom, 0.08), 0.28);
      surfaceLight = mixHex("#ffffff", skyBottom, 0.42);
      surfaceMid = mixHex(skyBottom, "#d7e3ed", 0.34);
      surfaceShadow = mixHex(skyTop, "#24313d", 0.52);
      horizonLift = 0.28;
      anchorAlpha = 0.18;
      relightAlpha = 0.12;
      occlusionStrength = 0.22;
      contactHazeAlpha = 0.08;
      wetSheenAlpha = 0.02;
      accumulationAlpha = 0.24;
      fogCreepAlpha = 0.08;
      condensationAlpha = 0.08;
      distortionAlpha = 0.03;
      shadowSweepAlpha = 0.03;
      horizonGlintAlpha = 0.06;
      surfaceRelightAlpha = 0.12;
      break;
    case "fog":
      skyTop = mixHex(base.skyTop, "#71808b", 0.3);
      skyMid = mixHex(base.skyMid, "#b9c4ca", 0.4);
      skyBottom = mixHex(base.skyBottom, "#edf2f4", 0.24);
      horizonGlow = withLight(skyBottom, 0.08);
      cloudLight = withLight(skyMid, 0.18);
      cloudMid = mixHex(skyMid, skyBottom, 0.12);
      cloudShadow = mixHex(skyTop, "#566771", 0.58);
      cloudAccent = mixHex(skyBottom, "#ffffff", 0.1);
      fogLight = mixHex(skyBottom, "#ffffff", 0.16);
      fogShadow = mixHex(skyMid, skyTop, 0.32);
      mistColor = mixHex(skyBottom, "#f8fcff", 0.08);
      celestialAlpha = 0.12;
      starAlpha = 0;
      overcast = 0.18;
      haze = 0.46;
      fogDensity = 0.92;
      precipitation = 0.08;
      wind = 0.16;
      turbulence = 0.12;
      cloudCeiling = 0.28;
      cloudAlpha = 0.18;
      frontCloudAlpha = 0.02;
      mistAlpha = 0.46;
      frontMistAlpha = 0.68;
      windowOpacity = 0.18;
      glassBlur = 0.7;
      frostOpacity = 0.24;
      anchorFarColor = mixHex(skyTop, "#1b232b", 0.34);
      anchorNearColor = mixHex(skyMid, "#263038", 0.42);
      anchorRimColor = rgba(withLight(skyBottom, 0.04), 0.12);
      terrainMistColor = rgba(withLight(skyBottom, 0.12), 0.36);
      surfaceLight = mixHex("#ffffff", skyBottom, 0.22);
      surfaceMid = mixHex(skyBottom, "#c9d4d8", 0.3);
      surfaceShadow = mixHex(skyTop, "#394953", 0.58);
      horizonLift = 0.38;
      anchorAlpha = 0.12;
      relightAlpha = 0.08;
      occlusionStrength = 0.14;
      contactHazeAlpha = 0.14;
      wetSheenAlpha = 0.04;
      fogCreepAlpha = 0.22;
      condensationAlpha = 0.14;
      distortionAlpha = 0.06;
      shadowSweepAlpha = 0.04;
      thermalShimmerAlpha = 0;
      horizonGlintAlpha = 0.03;
      surfaceRelightAlpha = 0.08;
      break;
    case "clear":
    default:
      if (phase === "day") {
        celestialAlpha = 0.88;
      } else if (phase === "dawn" || phase === "dusk") {
        celestialAlpha = 0.6;
      } else {
        celestialAlpha = 0.34;
      }
      anchorFarColor = mixHex(skyTop, "#10161d", 0.46);
      anchorNearColor = mixHex(skyMid, "#17222d", 0.52);
      anchorRimColor = rgba(withLight(base.horizon, 0.24), 0.34);
      terrainMistColor = rgba(withLight(base.skyBottom, 0.12), 0.2);
      surfaceLight = withLight(base.horizon, phase === "day" ? 0.22 : 0.18);
      surfaceMid = mixHex(base.skyBottom, base.horizon, phase === "night" ? 0.18 : 0.3);
      surfaceShadow = mixHex(base.skyTop, "#0b1118", 0.64);
      horizonLift = phase === "day" ? 0.12 : phase === "dawn" || phase === "dusk" ? 0.2 : 0.1;
      anchorAlpha = phase === "night" ? 0.24 : 0.18;
      relightAlpha = 0.12;
      occlusionStrength = 0.14;
      contactHazeAlpha = phase === "night" ? 0.04 : 0.06;
      wetSheenAlpha = phase === "night" ? 0.04 : 0.12;
      fogCreepAlpha = phase === "night" ? 0.02 : 0.04;
      horizonGlintAlpha = phase === "night" ? 0.05 : phase === "day" ? 0.18 : 0.26;
      thermalShimmerAlpha = phase === "day" ? 0.12 : phase === "dawn" || phase === "dusk" ? 0.08 : 0.02;
      surfaceRelightAlpha = 0.08;
      break;
  }
  const atmosphereScale = clamp(0.78 + intensity * 0.26, 0.72, 1.12);
  const detailScale = clamp(0.84 + intensity * 0.24, 0.8, 1.16);
  return {
    phase,
    isNight,
    skyTop,
    skyMid,
    skyBottom,
    horizonGlow,
    vignette,
    sunColor: base.sun,
    moonColor: base.moon,
    celestialGlow: rgba(withLight(base.sun, isNight ? 0.12 : 0.08), isNight ? 0.32 : 0.52),
    celestialAlpha: celestialAlpha * atmosphereScale,
    starColor: withLight(base.moon, 0.08),
    starAlpha: starAlpha * atmosphereScale,
    cloudLight,
    cloudMid,
    cloudShadow,
    cloudAccent,
    fogLight,
    fogShadow,
    mistColor,
    rainColor,
    snowColor,
    lightningColor,
    lightningGlow,
    glassTint,
    glassGlow,
    anchorFarColor,
    anchorNearColor,
    anchorRimColor,
    terrainMistColor,
    surfaceLight,
    surfaceMid,
    surfaceShadow,
    overcast: clamp(overcast * detailScale, 0, 1),
    haze: clamp(haze * atmosphereScale, 0, 1),
    fogDensity: clamp(fogDensity * detailScale, 0, 1),
    precipitation: clamp(precipitation * detailScale, 0, 1.2),
    wind: clamp(wind * (0.82 + intensity * 0.26), 0.08, 1.2),
    turbulence: clamp(turbulence * detailScale, 0.08, 1.2),
    cloudCeiling: clamp(cloudCeiling, 0.1, 1),
    cloudAlpha: clamp(cloudAlpha * detailScale, 0, 1.2),
    frontCloudAlpha: clamp(frontCloudAlpha * detailScale, 0, 1.1),
    mistAlpha: clamp(mistAlpha * detailScale, 0, 1),
    frontMistAlpha: clamp(frontMistAlpha * detailScale, 0, 1),
    curtainAlpha: clamp(curtainAlpha * detailScale, 0, 1),
    distantPrecipAlpha: clamp(distantPrecipAlpha * detailScale, 0, 1),
    nearPrecipAlpha: clamp(nearPrecipAlpha * detailScale, 0, 1.2),
    windowOpacity: clamp(windowOpacity * detailScale, 0, 1),
    glassBlur,
    frostOpacity: clamp(frostOpacity * detailScale, 0, 1),
    horizonLift: clamp(horizonLift * atmosphereScale, 0.06, 0.44),
    anchorAlpha: clamp(anchorAlpha * detailScale, 0.08, 0.5),
    relightAlpha: clamp(relightAlpha * detailScale, 0.06, 0.6),
    occlusionStrength: clamp(occlusionStrength * detailScale, 0.08, 0.7),
    contactHazeAlpha: clamp(contactHazeAlpha * detailScale, 0, 0.72),
    wetSheenAlpha: clamp(wetSheenAlpha * detailScale, 0, 0.8),
    impactAlpha: clamp(impactAlpha * detailScale, 0, 0.9),
    runoffAlpha: clamp(runoffAlpha * detailScale, 0, 0.9),
    accumulationAlpha: clamp(accumulationAlpha * detailScale, 0, 0.9),
    fogCreepAlpha: clamp(fogCreepAlpha * detailScale, 0, 0.9),
    condensationAlpha: clamp(condensationAlpha * detailScale, 0, 0.9),
    distortionAlpha: clamp(distortionAlpha * detailScale, 0, 0.8),
    shadowSweepAlpha: clamp(shadowSweepAlpha * detailScale, 0, 0.6),
    thermalShimmerAlpha: clamp(thermalShimmerAlpha * atmosphereScale, 0, 0.36),
    horizonGlintAlpha: clamp(horizonGlintAlpha * atmosphereScale, 0, 0.5),
    surfaceRelightAlpha: clamp(surfaceRelightAlpha * detailScale, 0, 0.7)
  };
}
function createSpritePalette(profile, useAccent = false) {
  const overcastMix = clamp(profile.overcast * 0.65 + profile.haze * 0.15, 0, 0.75);
  const primary = mixHex(profile.cloudMid, profile.cloudShadow, overcastMix * 0.16);
  const secondary = mixHex(primary, profile.cloudShadow, 0.25 + overcastMix * 0.16);
  return {
    primary,
    secondary,
    shadow: profile.cloudShadow,
    highlight: mixHex(profile.cloudLight, profile.cloudMid, 0.18 + overcastMix * 0.74),
    accent: mixHex(useAccent ? profile.cloudAccent : profile.cloudLight, profile.cloudMid, 0.22 + overcastMix * 0.58),
    glow: rgba(mixHex(profile.cloudAccent, profile.cloudMid, 0.36 + overcastMix * 0.34), 0.18 - overcastMix * 0.08)
  };
}
function buildCloudPalette(profile, kind) {
  if (kind === "cloud-shelf" || kind === "cloud-anvil") {
    return {
      primary: mixHex(profile.cloudMid, profile.cloudShadow, 0.16),
      secondary: profile.cloudMid,
      shadow: withShade(profile.cloudShadow, 0.06),
      highlight: mixHex(profile.cloudLight, profile.cloudMid, 0.54),
      accent: mixHex(profile.cloudAccent, profile.cloudMid, 0.52),
      glow: rgba(profile.cloudAccent, 0.14)
    };
  }
  if (kind === "fog-wisp") {
    return {
      primary: profile.fogLight,
      secondary: profile.mistColor,
      shadow: profile.fogShadow,
      highlight: withLight(profile.fogLight, 0.12),
      accent: withLight(profile.mistColor, 0.14),
      glow: rgba(profile.fogLight, 0.28)
    };
  }
  return createSpritePalette(profile);
}
function buildGlassPalette(profile) {
  return {
    primary: profile.glassTint,
    secondary: profile.glassTint,
    shadow: rgba(withShade("#55718f", 0.3), 0.12),
    highlight: "#ffffff",
    accent: rgba("#d8e8ff", 0.76),
    glow: profile.glassGlow
  };
}
function buildLightningPalette(profile) {
  return {
    primary: profile.lightningColor,
    secondary: profile.lightningColor,
    shadow: rgba(profile.lightningGlow, 0.12),
    highlight: "#ffffff",
    accent: profile.lightningGlow,
    glow: rgba(profile.lightningGlow, 0.55)
  };
}
function buildAnchorPalette(profile, depth) {
  const primary = mixHex(profile.anchorNearColor, profile.anchorFarColor, depth);
  const secondary = mixHex(primary, profile.anchorFarColor, 0.4);
  return {
    primary,
    secondary,
    shadow: mixHex(primary, "#06090d", 0.5),
    highlight: profile.anchorRimColor,
    accent: mixHex(profile.anchorRimColor, profile.terrainMistColor, 0.35),
    glow: profile.terrainMistColor
  };
}
function buildCurtainPalette(profile, condition) {
  const precipitationBase = condition === "snow" ? profile.snowColor : profile.rainColor;
  return {
    primary: rgba(precipitationBase, condition === "snow" ? 0.24 : 0.18),
    secondary: rgba(precipitationBase, condition === "snow" ? 0.18 : 0.14),
    shadow: rgba(precipitationBase, 0.04),
    highlight: rgba(withLight(precipitationBase, 0.16), 0.22),
    accent: rgba(withLight(precipitationBase, 0.24), 0.18),
    glow: rgba(precipitationBase, condition === "snow" ? 0.18 : 0.14)
  };
}
function buildScudPalette(profile) {
  return {
    primary: mixHex(profile.cloudShadow, profile.cloudMid, 0.18),
    secondary: mixHex(profile.cloudShadow, profile.cloudMid, 0.28),
    shadow: withShade(profile.cloudShadow, 0.08),
    highlight: mixHex(profile.cloudLight, "#dbe8f7", 0.12),
    accent: mixHex(profile.cloudAccent, profile.cloudMid, 0.3),
    glow: rgba(profile.cloudAccent, 0.18)
  };
}
function buildInteractionPalette(profile, variant) {
  switch (variant) {
    case "impact":
      return {
        primary: rgba(profile.rainColor, 0.28),
        secondary: rgba(profile.surfaceLight, 0.16),
        shadow: rgba(profile.surfaceShadow, 0.06),
        highlight: rgba(withLight(profile.rainColor, 0.2), 0.34),
        accent: rgba(withLight(profile.rainColor, 0.34), 0.4),
        glow: rgba(profile.rainColor, 0.3)
      };
    case "runoff":
      return {
        primary: rgba(profile.surfaceMid, 0.26),
        secondary: rgba(profile.rainColor, 0.18),
        shadow: rgba(profile.surfaceShadow, 0.08),
        highlight: rgba(withLight(profile.surfaceLight, 0.14), 0.3),
        accent: rgba(withLight(profile.rainColor, 0.26), 0.3),
        glow: rgba(profile.surfaceLight, 0.26)
      };
    case "accumulation":
      return {
        primary: rgba(profile.snowColor, 0.44),
        secondary: rgba(profile.surfaceMid, 0.3),
        shadow: rgba(profile.surfaceShadow, 0.12),
        highlight: rgba(withLight(profile.snowColor, 0.12), 0.42),
        accent: rgba(withLight(profile.surfaceLight, 0.16), 0.32),
        glow: rgba(profile.snowColor, 0.26)
      };
    case "condensation":
      return {
        primary: profile.glassTint,
        secondary: rgba(profile.mistColor, 0.18),
        shadow: rgba(profile.surfaceShadow, 0.06),
        highlight: rgba(withLight(profile.fogLight, 0.12), 0.34),
        accent: rgba(withLight(profile.surfaceLight, 0.18), 0.26),
        glow: profile.glassGlow
      };
    case "fog-creep":
      return {
        primary: rgba(profile.fogLight, 0.28),
        secondary: rgba(profile.mistColor, 0.2),
        shadow: rgba(profile.surfaceShadow, 0.08),
        highlight: rgba(withLight(profile.fogLight, 0.12), 0.32),
        accent: rgba(withLight(profile.surfaceLight, 0.14), 0.22),
        glow: rgba(profile.fogLight, 0.24)
      };
    case "contact":
    default:
      return {
        primary: rgba(profile.surfaceMid, 0.34),
        secondary: rgba(profile.surfaceMid, 0.24),
        shadow: rgba(profile.surfaceShadow, 0.12),
        highlight: rgba(withLight(profile.surfaceLight, 0.1), 0.32),
        accent: rgba(withLight(profile.surfaceLight, 0.18), 0.28),
        glow: rgba(profile.surfaceLight, 0.22)
      };
  }
}
function buildCelestialPosition(phase, width, height) {
  switch (phase) {
    case "dawn":
      return { x: width * 0.22, y: height * 0.28, radius: Math.min(width, height) * 0.08 };
    case "dusk":
      return { x: width * 0.76, y: height * 0.32, radius: Math.min(width, height) * 0.082 };
    case "night":
      return { x: width * 0.74, y: height * 0.2, radius: Math.min(width, height) * 0.054 };
    case "day":
    default:
      return { x: width * 0.68, y: height * 0.22, radius: Math.min(width, height) * 0.092 };
  }
}
function buildSceneSignature(kind, state, prefs, phase, intensity) {
  return [
    kind,
    state.condition,
    state.palette,
    phase,
    prefs.qualityMode,
    intensity.toFixed(2),
    state.date,
    state.time,
    state.layer
  ].join("|");
}
function conditionCloudSprites(condition) {
  switch (condition) {
    case "cloudy":
      return ["cloud-stratus", "cloud-bank", "cloud-stratus"];
    case "rain":
      return ["cloud-stratus", "cloud-bank", "cloud-stratus", "cloud-stratus"];
    case "storm":
      return ["cloud-anvil", "cloud-shelf", "cloud-bank", "cloud-stratus"];
    case "snow":
      return ["cloud-stratus", "cloud-bank", "cloud-stratus"];
    case "fog":
      return ["fog-wisp", "cloud-stratus", "fog-wisp"];
    case "clear":
    default:
      return ["cloud-wisp", "cloud-bank"];
  }
}
function createStars(rng, profile, budget) {
  if (!budget.flags.stars || profile.starAlpha <= 0.01)
    return [];
  const count = Math.round(budget.stars * (profile.isNight ? 1 : profile.phase === "dusk" || profile.phase === "dawn" ? 0.38 : 0.08));
  return Array.from({ length: count }, () => ({
    x: rng(),
    y: rng() * 0.72,
    radius: 0.7 + rng() * 1.8,
    alpha: 0.3 + rng() * 0.7,
    twinkleSpeed: 0.2 + rng() * 0.9,
    phase: rng() * Math.PI * 2
  }));
}
function createMotes(rng, profile, budget, kind) {
  if (!budget.flags.motes || kind !== "back")
    return [];
  const weight = profile.phase === "day" && profile.overcast < 0.2 ? 1 : profile.phase === "dawn" || profile.phase === "dusk" ? 0.44 : 0.18;
  const count = Math.round(budget.motes * weight);
  return Array.from({ length: count }, () => ({
    x: rng(),
    y: 0.12 + rng() * 0.72,
    radius: 1.6 + rng() * 3.8,
    alpha: 0.18 + rng() * 0.44,
    driftX: (rng() - 0.5) * 0.04,
    driftY: (rng() - 0.5) * 0.05,
    speed: 0.22 + rng() * 0.45,
    phase: rng() * Math.PI * 2
  }));
}
function createCloudLayers(rng, condition, profile, budget, kind) {
  const isFront = kind === "front";
  const total = condition === "clear" && isFront ? budget.frontCloudSprites > 0 && budget.flags.frontCloudBank ? 1 : 0 : isFront ? budget.frontCloudSprites : budget.cloudSprites;
  if (total <= 0)
    return [];
  const layerCount = Math.max(1, isFront ? Math.min(2, budget.cloudLayers) : budget.cloudLayers);
  const sprites = conditionCloudSprites(condition);
  const result = [];
  for (let layerIndex = 0;layerIndex < layerCount; layerIndex += 1) {
    const depth = layerCount === 1 ? 0.5 : layerIndex / (layerCount - 1);
    const perLayer = Math.max(1, Math.round(total / layerCount + depth * (isFront ? 0.5 : 1.2)));
    for (let itemIndex = 0;itemIndex < perLayer; itemIndex += 1) {
      const sprite = pick(rng, sprites);
      const widthScale = sprite === "cloud-anvil" ? 1.9 : sprite === "cloud-shelf" ? 2.1 : sprite === "cloud-stratus" ? 2 : sprite === "cloud-bank" ? 1.45 : 1.18;
      const baseWidth = condition === "storm" ? isFront ? 420 : 360 : condition === "rain" || condition === "snow" || condition === "cloudy" ? isFront ? 390 : 320 : condition === "fog" ? isFront ? 360 : 300 : isFront ? 340 : 260;
      const width = baseWidth * widthScale * (0.8 + rng() * 0.9) * (1 + depth * 0.45);
      const heightRatio = sprite === "cloud-stratus" || sprite === "cloud-shelf" ? 0.34 : sprite === "cloud-anvil" ? 0.62 : 0.42;
      const yBase = condition === "fog" ? 0.24 + depth * 0.2 : condition === "storm" ? 0.01 + depth * 0.14 : condition === "rain" ? 0.02 + depth * 0.12 : condition === "snow" ? 0.03 + depth * 0.12 : condition === "cloudy" ? 0.04 + depth * 0.14 : 0.04 + depth * 0.22;
      result.push({
        sprite,
        palette: buildCloudPalette(profile, sprite),
        x: rng() * 1.6 - 0.3,
        y: yBase + (rng() - 0.5) * (isFront ? 0.05 : 0.08),
        width,
        height: width * heightRatio,
        alpha: (isFront ? profile.frontCloudAlpha : profile.cloudAlpha) * clamp((condition === "rain" || condition === "storm" || condition === "snow" || condition === "cloudy" ? 0.16 : 0.22) + (1 - depth) * 0.14 + rng() * 0.18, 0.08, 0.72),
        speed: (isFront ? 10 : 6) + rng() * 12 + depth * 8,
        driftY: 3 + rng() * 12 + depth * 6,
        phase: rng() * Math.PI * 2,
        rotation: sprite === "cloud-shelf" ? -3 + rng() * 6 : sprite === "cloud-anvil" ? -2 + rng() * 4 : -1.5 + rng() * 3
      });
    }
  }
  if (!budget.flags.deepOvercast && !isFront) {
    return result.slice(0, Math.max(1, Math.round(result.length * 0.65)));
  }
  if (condition === "clear") {
    return result.slice(0, Math.max(1, isFront ? 1 : Math.round(result.length * 0.42)));
  }
  return result;
}
function createFogWisps(rng, profile, budget, kind) {
  const count = kind === "front" ? budget.frontMistWisps : budget.fogWisps;
  const alphaBase = kind === "front" ? profile.frontMistAlpha : profile.mistAlpha;
  if (count <= 0 || alphaBase <= 0.01)
    return [];
  return Array.from({ length: count }, (_, index) => {
    const layer = index / Math.max(count - 1, 1);
    const width = (kind === "front" ? 320 : 420) + rng() * (kind === "front" ? 420 : 560);
    return {
      sprite: "fog-wisp",
      palette: buildCloudPalette(profile, "fog-wisp"),
      x: rng() * 1.4 - 0.2,
      y: kind === "front" ? 0.54 + layer * 0.18 + rng() * 0.1 : 0.46 + layer * 0.13 + rng() * 0.1,
      width,
      height: width * 0.22,
      alpha: alphaBase * clamp(0.28 + rng() * 0.34, 0.12, 0.72),
      speed: 4 + rng() * 8 + layer * 4,
      driftY: 5 + rng() * 10,
      phase: rng() * Math.PI * 2,
      rotation: -2 + rng() * 4
    };
  });
}
function createAnchorLayers(rng, condition, profile, budget) {
  const count = Math.max(1, budget.anchorBands);
  const densityScale = condition === "storm" ? 1.08 : condition === "cloudy" || condition === "rain" ? 1 : condition === "snow" ? 0.84 : condition === "fog" ? 0.72 : 0.68;
  const total = Math.max(1, Math.round(count * densityScale));
  const anchors = [];
  for (let index = 0;index < total; index += 1) {
    const depth = total === 1 ? 0.5 : index / (total - 1);
    let sprite = depth < 0.22 ? "horizon-ridge" : depth < 0.74 ? "horizon-treeline" : "horizon-ridge";
    if (budget.flags.horizonPoles && depth > 0.66 && (condition === "clear" || condition === "cloudy" || condition === "rain")) {
      sprite = index % 2 === 0 ? "horizon-poles" : "horizon-treeline";
    }
    const width = sprite === "horizon-poles" ? 1260 + rng() * 260 : sprite === "horizon-treeline" ? 1180 + rng() * 320 : 1220 + rng() * 280;
    const height = sprite === "horizon-poles" ? 154 + rng() * 44 : sprite === "horizon-treeline" ? 132 + rng() * 44 : 110 + rng() * 38;
    const blurBase = condition === "fog" ? 14 : condition === "snow" ? 10 : condition === "rain" ? 6 : condition === "storm" ? 4 : 3;
    anchors.push({
      sprite,
      palette: buildAnchorPalette(profile, depth),
      x: rng() * 0.18 - 0.08,
      y: 0.67 + depth * 0.12 + (rng() - 0.5) * 0.03,
      width,
      height,
      alpha: profile.anchorAlpha * (condition === "fog" ? 0.42 : condition === "snow" ? 0.58 : condition === "rain" ? 0.84 : condition === "storm" ? 0.92 : 0.76) * (0.42 + depth * 0.36),
      blur: blurBase + depth * (condition === "fog" ? 10 : condition === "snow" ? 6 : 4),
      speed: 0.8 + rng() * 2 + depth * 2.2,
      parallax: 0.015 + depth * 0.03,
      depth,
      relight: 0.18 + depth * 0.36
    });
  }
  return anchors.sort((left, right) => left.depth - right.depth);
}
function createScudLayers(rng, condition, profile, budget) {
  const count = condition === "storm" ? Math.max(1, budget.scudLayers) : condition === "rain" && budget.scudLayers > 0 ? Math.max(1, budget.scudLayers - 1) : 0;
  if (count <= 0)
    return [];
  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const width = 560 + rng() * 480;
    return {
      sprite: "storm-scud",
      palette: buildScudPalette(profile),
      x: rng() * 1.4 - 0.2,
      y: (condition === "storm" ? 0.18 : 0.24) + depth * 0.12 + (rng() - 0.5) * 0.04,
      width,
      height: width * 0.24,
      alpha: (condition === "storm" ? 0.34 : 0.18) + depth * 0.12,
      speed: 8 + rng() * 8 + depth * 4,
      driftY: 4 + rng() * 10,
      phase: rng() * Math.PI * 2,
      rotation: -4 + rng() * 8
    };
  });
}
function createCurtainTextures(rng, condition, profile, budget) {
  if (!budget.flags.texturedCurtains)
    return [];
  if (condition !== "rain" && condition !== "storm" && condition !== "snow")
    return [];
  const count = Math.max(1, budget.curtainTextures);
  const alphaBase = condition === "snow" ? profile.curtainAlpha * 0.72 : profile.curtainAlpha;
  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const width = condition === "snow" ? 90 + rng() * 80 : 80 + rng() * 72;
    const height = condition === "snow" ? 360 + rng() * 240 : 420 + rng() * 260;
    return {
      sprite: "precip-curtain",
      palette: buildCurtainPalette(profile, condition),
      x: rng() * 1.2 - 0.1,
      y: 0.28 + depth * 0.14 + (rng() - 0.5) * 0.06,
      width,
      height,
      alpha: alphaBase * (0.3 + depth * 0.28 + rng() * 0.12),
      speed: condition === "snow" ? 2.6 + rng() * 4 : 4 + rng() * 7,
      driftY: 6 + rng() * 12,
      phase: rng() * Math.PI * 2,
      rotation: condition === "snow" ? -6 + rng() * 12 : 10 + rng() * 10
    };
  });
}
function createRainParticles(rng, state, prefs, profile, budget, kind) {
  if (profile.precipitation <= 0.04)
    return [];
  const effectiveLayer = resolveEffectiveLayerMode(state, prefs);
  let target = kind === "front" ? budget.rainFront : budget.rainBack;
  if (kind === "front") {
    if (effectiveLayer === "both")
      target *= 0.5;
    if (state.condition === "storm") {
      target = Math.min(target, getQualityBudget("lite").rainFront);
    }
  }
  if (target <= 0)
    return [];
  const count = Math.round(target * clamp(profile.precipitation, 0.18, 1.15));
  return Array.from({ length: count }, () => ({
    x: rng(),
    offset: rng(),
    width: kind === "front" ? 3 + rng() * 3.8 : 1.4 + rng() * 1.8,
    height: kind === "front" ? 42 + rng() * 124 : 20 + rng() * 78,
    alpha: (kind === "front" ? profile.nearPrecipAlpha : profile.distantPrecipAlpha) * (0.35 + rng() * 0.65),
    cycle: kind === "front" ? 0.58 + rng() * 0.48 : 0.78 + rng() * 0.68,
    drift: (0.04 + rng() * 0.08) * (kind === "front" ? 1.6 : 1),
    sway: rng() * 0.02,
    phase: rng() * Math.PI * 2
  }));
}
function createSnowParticles(rng, state, prefs, profile, budget, kind) {
  if (profile.precipitation <= 0.04)
    return [];
  const effectiveLayer = resolveEffectiveLayerMode(state, prefs);
  let target = kind === "front" ? budget.snowFront : budget.snowBack;
  if (kind === "front" && effectiveLayer === "both") {
    target *= 0.5;
  }
  if (target <= 0)
    return [];
  const count = Math.round(target * clamp(profile.precipitation, 0.22, 1.1));
  return Array.from({ length: count }, () => ({
    x: rng(),
    offset: rng(),
    size: kind === "front" ? 8 + rng() * 16 : 5 + rng() * 10,
    alpha: (kind === "front" ? profile.nearPrecipAlpha : profile.distantPrecipAlpha) * (0.4 + rng() * 0.6),
    cycle: kind === "front" ? 3.2 + rng() * 2.8 : 4.1 + rng() * 4.2,
    drift: (0.05 + rng() * 0.18) * (kind === "front" ? 1.05 : 0.88),
    sway: 0.02 + rng() * 0.06,
    phase: rng() * Math.PI * 2,
    rotation: rng() * 360
  }));
}
function createCurtains(rng, profile, budget, condition) {
  if (!budget.flags.distantCurtains || profile.curtainAlpha <= 0.02)
    return [];
  const base = condition === "snow" ? budget.snowGusts : budget.rainCurtains;
  if (base <= 0)
    return [];
  const count = Math.max(1, Math.round(base * clamp(profile.precipitation, 0.25, 1)));
  return Array.from({ length: count }, () => ({
    x: rng(),
    width: 0.12 + rng() * 0.2,
    alpha: profile.curtainAlpha * (0.35 + rng() * 0.5),
    slant: condition === "snow" ? -0.03 + rng() * 0.06 : 0.08 + rng() * 0.08,
    speed: 6 + rng() * 12,
    phase: rng() * Math.PI * 2,
    blur: condition === "snow" ? 28 + rng() * 24 : 18 + rng() * 18
  }));
}
function createContactBands(rng, condition, profile, budget) {
  const base = budget.contactBands;
  const alphaBase = Math.max(profile.wetSheenAlpha, profile.horizonGlintAlpha * 0.88);
  if (base <= 0 || alphaBase <= 0.01)
    return [];
  const conditionScale = condition === "storm" ? 1.16 : condition === "rain" ? 1 : condition === "fog" ? 0.92 : condition === "cloudy" ? 0.8 : condition === "snow" ? 0.66 : 0.52;
  const count = Math.max(1, Math.round(base * conditionScale));
  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const yBase = condition === "storm" ? 0.72 : condition === "rain" ? 0.74 : condition === "snow" ? 0.78 : condition === "fog" ? 0.7 : condition === "cloudy" ? 0.76 : 0.8;
    const width = 620 + rng() * 780;
    const alphaScale = condition === "clear" ? profile.horizonGlintAlpha : condition === "cloudy" ? profile.wetSheenAlpha * 0.9 : profile.wetSheenAlpha;
    return {
      sprite: "surface-sheen",
      palette: buildInteractionPalette(profile, "contact"),
      x: rng() * 0.22 - 0.08,
      y: yBase + depth * 0.08 + (rng() - 0.5) * 0.03,
      width,
      height: 48 + rng() * 92 + depth * 18,
      alpha: alphaScale * (0.28 + depth * 0.3 + rng() * 0.14),
      speed: 1.2 + rng() * 3.2 + depth * 1.2,
      driftY: 1.5 + rng() * 5.5,
      phase: rng() * Math.PI * 2,
      rotation: -2 + rng() * 4
    };
  });
}
function createImpactBursts(rng, profile, budget, condition) {
  if (condition !== "rain" && condition !== "storm" || profile.impactAlpha <= 0.01 || budget.impactBursts <= 0)
    return [];
  const count = Math.max(1, Math.round(budget.impactBursts * clamp(profile.precipitation, 0.2, 1.2) * (condition === "storm" ? 1.22 : 1)));
  return Array.from({ length: count }, () => {
    const width = 56 + rng() * 124;
    return {
      sprite: "surface-splash",
      palette: buildInteractionPalette(profile, "impact"),
      x: rng() * 1.15 - 0.08,
      y: 0.66 + rng() * 0.28,
      width,
      height: width * (0.44 + rng() * 0.22),
      alpha: profile.impactAlpha * (0.28 + rng() * 0.34),
      speed: 3.2 + rng() * 8,
      driftY: 2 + rng() * 10,
      phase: rng() * Math.PI * 2,
      rotation: -12 + rng() * 24
    };
  });
}
function createRunoffSheets(rng, profile, budget, condition) {
  if (condition !== "rain" && condition !== "storm" || profile.runoffAlpha <= 0.01 || budget.runoffSheets <= 0)
    return [];
  const count = Math.max(1, Math.round(budget.runoffSheets * clamp(profile.precipitation, 0.3, 1.2)));
  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const width = 72 + rng() * 112;
    return {
      sprite: "surface-runoff",
      palette: buildInteractionPalette(profile, "runoff"),
      x: rng() * 1.1 - 0.06,
      y: 0.46 + depth * 0.16 + rng() * 0.08,
      width,
      height: 220 + rng() * 320,
      alpha: profile.runoffAlpha * (0.26 + depth * 0.26 + rng() * 0.1),
      speed: 2.2 + rng() * 5.6 + depth * 1.8,
      driftY: 6 + rng() * 14,
      phase: rng() * Math.PI * 2,
      rotation: condition === "storm" ? 14 + rng() * 18 : 8 + rng() * 12
    };
  });
}
function createAccumulationBands(rng, profile, budget, condition) {
  if (condition !== "snow" || profile.accumulationAlpha <= 0.01 || budget.accumulationBands <= 0)
    return [];
  const count = Math.max(1, budget.accumulationBands);
  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const width = 980 + rng() * 420;
    return {
      sprite: "surface-accumulation",
      palette: buildInteractionPalette(profile, "accumulation"),
      x: rng() * 0.14 - 0.08,
      y: 0.78 + depth * 0.07 + rng() * 0.02,
      width,
      height: 64 + rng() * 76,
      alpha: profile.accumulationAlpha * (0.34 + depth * 0.28 + rng() * 0.12),
      speed: 0.8 + rng() * 1.8,
      driftY: 1 + rng() * 4,
      phase: rng() * Math.PI * 2,
      rotation: -1.4 + rng() * 2.8
    };
  });
}
function createFogCreepLayers(rng, condition, profile, budget) {
  if (profile.fogCreepAlpha <= 0.01 || budget.fogCreepBands <= 0)
    return [];
  const conditionScale = condition === "fog" ? 1.1 : condition === "snow" ? 0.86 : condition === "rain" || condition === "storm" ? 0.72 : condition === "cloudy" ? 0.62 : 0.42;
  const count = Math.max(1, Math.round(budget.fogCreepBands * conditionScale));
  return Array.from({ length: count }, (_, index) => {
    const depth = count === 1 ? 0.5 : index / (count - 1);
    const width = 900 + rng() * 520;
    return {
      sprite: "fog-creep",
      palette: buildInteractionPalette(profile, "fog-creep"),
      x: rng() * 0.2 - 0.08,
      y: 0.7 + depth * 0.1 + rng() * 0.04,
      width,
      height: 88 + rng() * 140,
      alpha: profile.fogCreepAlpha * (0.24 + depth * 0.3 + rng() * 0.16),
      speed: 0.8 + rng() * 2.4 + depth,
      driftY: 2 + rng() * 8,
      phase: rng() * Math.PI * 2,
      rotation: -2 + rng() * 4
    };
  });
}
function createCondensationBlooms(rng, profile, budget, condition) {
  if (!budget.flags.glassOverlay || condition !== "rain" && condition !== "storm" || profile.condensationAlpha <= 0.01 || budget.condensationBlooms <= 0) {
    return [];
  }
  const count = Math.max(1, Math.round(budget.condensationBlooms * clamp(profile.windowOpacity, 0.3, 1)));
  return Array.from({ length: count }, () => {
    const edgeWeightedX = rng() > 0.55 ? rng() * 0.22 : 0.68 + rng() * 0.28;
    const width = 72 + rng() * 210;
    return {
      sprite: "condensation-bloom",
      palette: buildInteractionPalette(profile, "condensation"),
      x: rng() > 0.28 ? edgeWeightedX : 0.18 + rng() * 0.5,
      y: rng() * 0.86,
      width,
      height: width * (0.72 + rng() * 0.28),
      alpha: profile.condensationAlpha * (0.24 + rng() * 0.34),
      speed: 0.3 + rng() * 1.6,
      driftY: 1.5 + rng() * 7,
      phase: rng() * Math.PI * 2,
      rotation: -20 + rng() * 40
    };
  });
}
function createGlassParticles(rng, profile, budget, condition) {
  if (!budget.flags.glassOverlay || profile.windowOpacity <= 0.02 || condition !== "rain" && condition !== "storm") {
    return { beads: [], rivulets: [] };
  }
  const conditionScale = condition === "storm" ? 1.16 : 1;
  const moistureScale = clamp(profile.windowOpacity + profile.condensationAlpha * 0.5, 0.2, 1.2);
  const beadCount = budget.flags.glassDroplets ? Math.round(budget.glassBeads * moistureScale * conditionScale) : 0;
  const rivuletCount = budget.flags.glassDroplets ? Math.round(budget.glassRivulets * moistureScale * conditionScale) : 0;
  const condensationScale = 1;
  return {
    beads: Array.from({ length: beadCount }, () => ({
      x: rng(),
      y: rng(),
      width: 10 + rng() * 24,
      height: 12 + rng() * 28,
      alpha: profile.windowOpacity * condensationScale * (0.36 + rng() * 0.54),
      speed: 0.06 + rng() * 0.12,
      drift: (rng() - 0.5) * 0.015,
      phase: rng() * Math.PI * 2
    })),
    rivulets: Array.from({ length: rivuletCount }, () => ({
      x: rng(),
      y: rng() * 0.35,
      width: 8 + rng() * 10,
      height: 120 + rng() * 260,
      alpha: profile.windowOpacity * (0.3 + rng() * 0.5),
      speed: 0.08 + rng() * 0.1,
      drift: (rng() - 0.5) * 0.02,
      phase: rng() * Math.PI * 2
    }))
  };
}
function buildComposition(kind, state, prefs) {
  const effectiveIntensity = clamp(state.intensity * prefs.intensity, 0.2, 1.5);
  const profile = buildSceneProfile(state, effectiveIntensity);
  const budget = getQualityBudget(prefs.qualityMode);
  const effectiveLayer = resolveEffectiveLayerMode(state, prefs);
  const signature = buildSceneSignature(kind, state, prefs, profile.phase, effectiveIntensity);
  const rng = createRng(hashString(signature));
  const anchors = kind === "back" ? createAnchorLayers(rng, state.condition, profile, budget) : [];
  const clouds = kind === "back" ? createCloudLayers(rng, state.condition, profile, budget, "back") : [];
  const scud = kind === "back" ? createScudLayers(rng, state.condition, profile, budget) : [];
  const frontClouds = [];
  const fogWisps = kind === "back" ? createFogWisps(rng, profile, budget, "back") : [];
  const rawFrontMist = kind === "front" ? createFogWisps(rng, profile, budget, "front") : [];
  const frontMist = kind === "front" ? trimArray(rawFrontMist, effectiveLayer === "both" ? Math.ceil(rawFrontMist.length * 0.5) : rawFrontMist.length) : [];
  const rain = state.condition === "rain" || state.condition === "storm" ? createRainParticles(rng, state, prefs, profile, budget, kind) : [];
  const snow = state.condition === "snow" ? createSnowParticles(rng, state, prefs, profile, budget, kind) : [];
  const curtains = kind === "back" ? createCurtains(rng, profile, budget, state.condition) : [];
  const curtainTextures = kind === "back" ? createCurtainTextures(rng, state.condition, profile, budget) : [];
  const contactBands = kind === "back" ? createContactBands(rng, state.condition, profile, budget) : [];
  const impactBursts = kind === "back" ? createImpactBursts(rng, profile, budget, state.condition) : [];
  const runoffSheets = kind === "back" ? createRunoffSheets(rng, profile, budget, state.condition) : [];
  const accumulationBands = kind === "back" ? createAccumulationBands(rng, profile, budget, state.condition) : [];
  const fogCreep = kind === "back" ? createFogCreepLayers(rng, state.condition, profile, budget) : [];
  const condensationBlooms = kind === "back" ? createCondensationBlooms(rng, profile, budget, state.condition) : [];
  const glass = kind === "back" ? createGlassParticles(rng, profile, budget, state.condition) : { beads: [], rivulets: [] };
  return {
    signature,
    budget,
    profile,
    stars: kind === "back" ? createStars(rng, profile, budget) : [],
    motes: createMotes(rng, profile, budget, kind),
    anchors,
    clouds,
    scud,
    frontClouds,
    fogWisps,
    frontMist,
    rain,
    snow,
    curtains,
    curtainTextures,
    contactBands,
    impactBursts,
    runoffSheets,
    accumulationBands,
    fogCreep,
    condensationBlooms,
    glassBeads: glass.beads,
    glassRivulets: glass.rivulets
  };
}
function drawSprite(ctx, sprite, palette, x, y, width, height, alpha, rotation, onReady) {
  const image = requestWeatherSprite(sprite, palette, onReady);
  if (!image)
    return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}

class CanvasWeatherRenderer {
  root;
  kind;
  canvas;
  context;
  staticCanvas;
  staticContext;
  slowCanvas;
  slowContext;
  glassOverlay;
  resizeObserver;
  onAssetReady = () => this.handleAssetReady();
  onWindowResize = () => {
    if (this.resizeCanvas()) {
      this.drawOnce();
    }
  };
  onVisibilityChange = () => {
    if (document.visibilityState === "visible" && this.visible) {
      this.drawOnce();
    }
    this.refreshLoop();
  };
  composition = null;
  prefs = DEFAULT_PREFS;
  state = makeDefaultWeatherState();
  reducedMotion = false;
  visible = false;
  rafId = null;
  assetRefreshId = null;
  animationTime = 0;
  lastFrameAt = null;
  lastRenderAt = null;
  lastSlowPassAt = Number.NEGATIVE_INFINITY;
  width = 1;
  height = 1;
  dpr = 1;
  lightningEvents = [];
  failed = false;
  staticCacheDirty = true;
  slowCacheDirty = true;
  constructor(kind) {
    this.kind = kind;
    this.root = document.createElement("div");
    this.root.className = "weather-fx-root weather-fx-renderer-root";
    this.root.dataset.kind = kind;
    this.root.dataset.glass = "none";
    this.root.setAttribute("aria-hidden", "true");
    this.canvas = document.createElement("canvas");
    this.canvas.className = "weather-fx-canvas";
    this.root.appendChild(this.canvas);
    const context = this.canvas.getContext("2d", { alpha: true }) ?? this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Weather renderer could not acquire a 2D canvas context.");
    }
    this.context = context;
    if (kind === "back") {
      this.staticCanvas = document.createElement("canvas");
      this.slowCanvas = document.createElement("canvas");
      const staticContext = this.staticCanvas.getContext("2d", { alpha: true }) ?? this.staticCanvas.getContext("2d");
      const slowContext = this.slowCanvas.getContext("2d", { alpha: true }) ?? this.slowCanvas.getContext("2d");
      if (!staticContext || !slowContext) {
        throw new Error("Weather renderer could not acquire cache canvas contexts.");
      }
      this.staticContext = staticContext;
      this.slowContext = slowContext;
    } else {
      this.staticCanvas = null;
      this.slowCanvas = null;
      this.staticContext = null;
      this.slowContext = null;
    }
    if (kind === "back") {
      this.glassOverlay = document.createElement("div");
      this.glassOverlay.className = "weather-fx-glass";
      this.root.appendChild(this.glassOverlay);
    } else {
      this.glassOverlay = null;
    }
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        if (this.resizeCanvas()) {
          this.drawOnce();
        }
      });
      observer.observe(this.root);
      this.resizeObserver = observer;
    } else {
      this.resizeObserver = null;
      window.addEventListener("resize", this.onWindowResize);
    }
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }
  setScene(state, prefs, reducedMotion) {
    if (this.failed)
      return;
    this.state = state;
    this.prefs = prefs;
    this.reducedMotion = reducedMotion;
    const nextComposition = buildComposition(this.kind, state, prefs);
    this.composition = nextComposition;
    this.lightningEvents = [];
    this.root.dataset.condition = state.condition;
    this.root.dataset.palette = state.palette;
    this.root.dataset.quality = prefs.qualityMode;
    this.root.classList.toggle("weather-paused", prefs.pauseEffects);
    this.root.classList.toggle("weather-reduced-motion", reducedMotion);
    this.syncGlassOverlay();
    this.staticCacheDirty = true;
    this.slowCacheDirty = true;
    this.lastSlowPassAt = Number.NEGATIVE_INFINITY;
    if (this.visible && this.root.isConnected && document.visibilityState === "visible") {
      this.drawOnce();
    }
    this.refreshLoop();
  }
  setVisible(visible) {
    if (this.failed) {
      this.root.classList.add("weather-hidden");
      this.root.classList.remove("weather-visible");
      return;
    }
    this.visible = visible;
    this.root.classList.toggle("weather-hidden", !visible);
    this.root.classList.toggle("weather-visible", visible);
    if (visible && this.root.isConnected && document.visibilityState === "visible") {
      this.drawOnce();
    }
    this.refreshLoop();
  }
  refreshLayout() {
    if (this.failed)
      return;
    if (this.resizeCanvas()) {
      if (this.visible && document.visibilityState === "visible") {
        this.drawOnce();
      }
    }
  }
  triggerLightning() {
    if (this.failed)
      return;
    if (!this.visible || this.state.condition !== "storm" || this.reducedMotion || this.prefs.pauseEffects || !this.composition) {
      return;
    }
    const budget = this.composition.budget;
    const flashCount = budget.flags.multiFlash ? 2 + (Math.random() > 0.65 ? 1 : 0) : 1;
    for (let flashIndex = 0;flashIndex < flashCount; flashIndex += 1) {
      const bolts = [];
      const boltCount = budget.flags.lightningForks ? Math.max(1, budget.lightningForks - flashIndex) : 0;
      for (let index = 0;index < boltCount; index += 1) {
        bolts.push({
          x: 0.12 + Math.random() * 0.72,
          y: 0.04 + Math.random() * 0.18,
          width: this.kind === "front" ? 90 + Math.random() * 120 : 70 + Math.random() * 90,
          height: this.kind === "front" ? 200 + Math.random() * 210 : 140 + Math.random() * 180,
          alpha: 0.68 + Math.random() * 0.3,
          rotation: -16 + Math.random() * 32
        });
      }
      this.lightningEvents.push({
        start: this.animationTime + flashIndex * (0.08 + Math.random() * 0.08),
        duration: 0.18 + Math.random() * 0.08,
        flash: (0.58 + Math.random() * 0.34) * budget.lightningGlow,
        bolts
      });
    }
    this.refreshLoop();
  }
  destroy() {
    this.stopLoop();
    if (this.assetRefreshId !== null) {
      window.cancelAnimationFrame(this.assetRefreshId);
      this.assetRefreshId = null;
    }
    this.resizeObserver?.disconnect();
    if (!this.resizeObserver) {
      window.removeEventListener("resize", this.onWindowResize);
    }
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.root.remove();
  }
  syncGlassOverlay() {
    if (!this.glassOverlay || !this.composition)
      return;
    const variant = !this.composition.budget.flags.glassOverlay ? "none" : this.state.condition === "rain" || this.state.condition === "storm" ? this.composition.glassBeads.length || this.composition.glassRivulets.length || this.composition.condensationBlooms.length ? this.state.condition : "none" : "none";
    this.root.dataset.glass = variant;
    this.root.style.setProperty("--weather-glass-opacity", this.composition.profile.windowOpacity.toFixed(3));
    this.root.style.setProperty("--weather-glass-blur", this.composition.profile.glassBlur.toFixed(2));
    this.root.style.setProperty("--weather-glass-tint", this.composition.profile.glassTint);
    this.root.style.setProperty("--weather-glass-glow", this.composition.profile.glassGlow);
    this.root.style.setProperty("--weather-frost-opacity", this.composition.profile.frostOpacity.toFixed(3));
    this.root.style.setProperty("--weather-glass-condensation", this.composition.profile.condensationAlpha.toFixed(3));
    this.root.style.setProperty("--weather-glass-distortion", this.composition.profile.distortionAlpha.toFixed(3));
    this.root.style.setProperty("--weather-glass-edge-opacity", clamp(this.composition.profile.condensationAlpha * 0.74 + this.composition.profile.windowOpacity * 0.22, 0, 1).toFixed(3));
  }
  resizeCanvas() {
    if (!this.root.isConnected)
      return false;
    const rect = this.root.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    const budget = getQualityBudget(this.prefs.qualityMode);
    const viewportPixels = Math.max(1, nextWidth * nextHeight);
    const desiredDpr = Math.max(0.65, window.devicePixelRatio * budget.resolutionScale);
    const maxPixelDpr = Math.max(0.65, Math.sqrt(budget.maxPixelCount / viewportPixels));
    const nextDpr = Math.min(desiredDpr, budget.maxDevicePixelRatio, maxPixelDpr);
    const pixelWidth = Math.max(1, Math.round(nextWidth * nextDpr));
    const pixelHeight = Math.max(1, Math.round(nextHeight * nextDpr));
    if (this.width === nextWidth && this.height === nextHeight && this.dpr === nextDpr)
      return false;
    this.width = nextWidth;
    this.height = nextHeight;
    this.dpr = nextDpr;
    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    this.canvas.style.width = `${nextWidth}px`;
    this.canvas.style.height = `${nextHeight}px`;
    if (this.staticCanvas && this.slowCanvas) {
      this.staticCanvas.width = pixelWidth;
      this.staticCanvas.height = pixelHeight;
      this.slowCanvas.width = pixelWidth;
      this.slowCanvas.height = pixelHeight;
      this.staticCacheDirty = true;
      this.slowCacheDirty = true;
      this.lastSlowPassAt = Number.NEGATIVE_INFINITY;
    }
    return true;
  }
  refreshLoop() {
    if (this.failed) {
      this.stopLoop();
      return;
    }
    const shouldRun = this.visible && this.root.isConnected && document.visibilityState === "visible" && !this.reducedMotion && !this.prefs.pauseEffects && !!this.composition;
    if (shouldRun) {
      if (this.rafId === null) {
        this.lastFrameAt = null;
        this.rafId = window.requestAnimationFrame(this.step);
      }
      return;
    }
    this.stopLoop();
  }
  stopLoop() {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastFrameAt = null;
    this.lastRenderAt = null;
  }
  step = (now) => {
    this.rafId = null;
    if (!this.composition || !this.visible || !this.root.isConnected || document.visibilityState !== "visible" || this.reducedMotion || this.prefs.pauseEffects) {
      this.stopLoop();
      return;
    }
    if (this.lastFrameAt === null) {
      this.lastFrameAt = now;
    }
    const delta = Math.min(0.06, Math.max(0, (now - this.lastFrameAt) / 1000));
    this.lastFrameAt = now;
    this.animationTime += delta;
    const shouldRender = this.lastRenderAt === null || this.staticCacheDirty || this.slowCacheDirty || this.lightningEvents.length > 0 || now - this.lastRenderAt >= this.composition.budget.frameIntervalMs;
    if (!shouldRender) {
      this.refreshLoop();
      return;
    }
    try {
      this.render(this.animationTime);
      this.lastRenderAt = now;
    } catch (error) {
      this.handleFatalError(error);
      return;
    }
    this.refreshLoop();
  };
  drawOnce() {
    if (this.failed || !this.composition || !this.root.isConnected)
      return;
    try {
      this.resizeCanvas();
      this.render(this.animationTime);
    } catch (error) {
      this.handleFatalError(error);
    }
  }
  clearCanvas() {
    this.clearTarget(this.context);
  }
  clearTarget(ctx) {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
  }
  handleAssetReady() {
    if (this.kind === "back") {
      this.staticCacheDirty = true;
      this.slowCacheDirty = true;
      this.lastSlowPassAt = Number.NEGATIVE_INFINITY;
    }
    if (this.failed || !this.visible || this.rafId !== null || document.visibilityState !== "visible")
      return;
    if (this.assetRefreshId !== null)
      return;
    this.assetRefreshId = window.requestAnimationFrame(() => {
      this.assetRefreshId = null;
      this.drawOnce();
    });
  }
  render(time) {
    if (!this.composition || this.width <= 0 || this.height <= 0)
      return;
    this.clearCanvas();
    if (this.kind === "back") {
      this.drawBack(time);
    } else {
      this.drawFront(time);
    }
  }
  drawBack(time) {
    if (!this.composition)
      return;
    const { profile, anchors, condensationBlooms, rain, snow, glassBeads, glassRivulets } = this.composition;
    const lightning = this.resolveLightningState(time);
    this.renderBackStaticCache();
    this.renderBackSlowCache(time);
    if (this.staticCanvas) {
      this.context.drawImage(this.staticCanvas, 0, 0, this.width, this.height);
    }
    if (this.slowCanvas) {
      this.context.drawImage(this.slowCanvas, 0, 0, this.width, this.height);
    }
    if (lightning.flash > 0.01) {
      this.drawAnchorLayers(time, anchors, profile, lightning.flash, this.context, true);
    }
    this.drawRain(time, rain, profile, "back");
    this.drawSnow(time, snow, profile, "back");
    this.drawGlass(profile, time, glassRivulets, glassBeads, condensationBlooms, lightning.flash);
    this.drawVignette(profile);
    this.drawLightningState(profile, lightning);
  }
  drawFront(time) {
    if (!this.composition)
      return;
    const { profile, frontMist, rain, snow } = this.composition;
    const lightning = this.resolveLightningState(time);
    this.drawFrontAtmosphere(profile);
    this.drawFogWisps(time, frontMist);
    this.drawRain(time, rain, profile, "front");
    this.drawSnow(time, snow, profile, "front");
    this.drawLightningState(profile, lightning);
  }
  renderBackStaticCache() {
    if (!this.composition || !this.staticCanvas || !this.staticContext || !this.staticCacheDirty)
      return;
    const { profile, anchors } = this.composition;
    this.clearTarget(this.staticContext);
    this.drawSkyBackdrop(profile, this.staticContext);
    this.drawCelestialOrb(profile, this.staticContext);
    this.drawAtmosphericDepth(profile, 0, this.staticContext);
    this.drawAnchorLayers(0, anchors, profile, 0, this.staticContext);
    this.drawHorizon(profile, 0, this.staticContext);
    this.staticCacheDirty = false;
  }
  renderBackSlowCache(time) {
    if (!this.composition || !this.slowCanvas || !this.slowContext)
      return;
    const needsRefresh = this.slowCacheDirty || this.lastSlowPassAt === Number.NEGATIVE_INFINITY || time - this.lastSlowPassAt >= this.composition.budget.slowPassIntervalMs / 1000;
    if (!needsRefresh)
      return;
    const { profile, stars, clouds, scud, curtainTextures, curtains, fogWisps, motes } = this.composition;
    this.clearTarget(this.slowContext);
    this.drawStars(time, stars, profile, this.slowContext);
    this.drawCloudLayers(time, clouds, this.slowContext);
    this.drawCloudLayers(time, scud, this.slowContext);
    this.drawCurtainTextures(time, curtainTextures, this.slowContext);
    this.drawCurtains(time, curtains, profile, this.slowContext);
    this.drawFogWisps(time, fogWisps, this.slowContext);
    this.drawMotes(time, motes, profile, this.slowContext);
    this.lastSlowPassAt = time;
    this.slowCacheDirty = false;
  }
  drawSkyBackdrop(profile, ctx = this.context) {
    const sky = ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, profile.skyTop);
    sky.addColorStop(0.52, profile.skyMid);
    sky.addColorStop(1, profile.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, this.height);
    const skyGlow = ctx.createRadialGradient(this.width * 0.5, this.height * 0.08, 0, this.width * 0.5, this.height * 0.08, this.width);
    skyGlow.addColorStop(0, rgba(profile.cloudAccent, 0.08 + profile.haze * 0.18));
    skyGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = skyGlow;
    ctx.fillRect(0, 0, this.width, this.height);
  }
  drawFrontAtmosphere(profile) {
    const ctx = this.context;
    const canopy = ctx.createLinearGradient(0, 0, 0, this.height * 0.54);
    canopy.addColorStop(0, rgba(profile.cloudShadow, 0.08 + profile.haze * 0.14));
    canopy.addColorStop(0.32, rgba(profile.cloudMid, 0.05 + profile.frontMistAlpha * 0.12));
    canopy.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = canopy;
    ctx.fillRect(0, 0, this.width, this.height * 0.56);
  }
  drawCelestialOrb(profile, ctx = this.context) {
    if (profile.celestialAlpha <= 0.02)
      return;
    const celestial = buildCelestialPosition(profile.phase, this.width, this.height);
    const coreColor = profile.isNight ? profile.moonColor : profile.sunColor;
    const glow = ctx.createRadialGradient(celestial.x, celestial.y, celestial.radius * 0.24, celestial.x, celestial.y, celestial.radius * 4.4);
    glow.addColorStop(0, rgba(coreColor, profile.celestialAlpha * 0.95));
    glow.addColorStop(0.4, profile.celestialGlow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(celestial.x, celestial.y, celestial.radius * 4.4, 0, Math.PI * 2);
    ctx.fill();
    const core = ctx.createRadialGradient(celestial.x, celestial.y, celestial.radius * 0.12, celestial.x, celestial.y, celestial.radius);
    core.addColorStop(0, rgba("#ffffff", profile.isNight ? 0.94 : 0.98));
    core.addColorStop(0.4, rgba(coreColor, profile.celestialAlpha * 0.9));
    core.addColorStop(1, rgba(coreColor, profile.celestialAlpha * 0.1));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(celestial.x, celestial.y, celestial.radius, 0, Math.PI * 2);
    ctx.fill();
    if (profile.horizonGlintAlpha > 0.02) {
      const flare = ctx.createLinearGradient(celestial.x - this.width * 0.22, 0, celestial.x + this.width * 0.22, 0);
      flare.addColorStop(0, "rgba(255,255,255,0)");
      flare.addColorStop(0.5, rgba(coreColor, profile.horizonGlintAlpha * 0.22));
      flare.addColorStop(1, "rgba(255,255,255,0)");
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = flare;
      ctx.fillRect(celestial.x - this.width * 0.22, celestial.y - 2, this.width * 0.44, 4);
      ctx.restore();
    }
  }
  drawStars(time, stars, profile, ctx = this.context) {
    if (stars.length === 0 || profile.starAlpha <= 0.01)
      return;
    for (const star of stars) {
      const twinkle = 0.58 + 0.42 * Math.sin(time * star.twinkleSpeed * 2.3 + star.phase);
      const alpha = profile.starAlpha * star.alpha * twinkle;
      if (alpha <= 0.01)
        continue;
      const x = star.x * this.width;
      const y = star.y * this.height;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = profile.starColor;
      ctx.shadowColor = rgba(profile.starColor, alpha);
      ctx.shadowBlur = star.radius * 7;
      ctx.beginPath();
      ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  drawAtmosphericDepth(profile, lightningFlash, ctx = this.context) {
    if (!this.composition)
      return;
    const glowPasses = Math.max(1, this.composition.budget.horizonGlowPasses);
    const shadowPasses = Math.max(1, this.composition.budget.shadowPasses);
    for (let index = 0;index < glowPasses; index += 1) {
      const depth = index / glowPasses;
      const glow = ctx.createRadialGradient(this.width * 0.5, this.height * (1.02 + depth * 0.03), this.width * 0.06, this.width * 0.5, this.height * (0.98 + depth * 0.02), this.width * (0.38 + depth * 0.24));
      glow.addColorStop(0, rgba(profile.horizonGlow, profile.horizonLift * (0.22 + depth * 0.18) + lightningFlash * 0.08));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, this.height * 0.45, this.width, this.height * 0.6);
    }
    for (let index = 0;index < shadowPasses; index += 1) {
      const depth = index / shadowPasses;
      const ceiling = ctx.createLinearGradient(0, 0, 0, this.height * (0.52 + depth * 0.08));
      ceiling.addColorStop(0, rgba(profile.cloudShadow, 0.18 + profile.overcast * (0.24 + depth * 0.08) + lightningFlash * 0.05));
      ceiling.addColorStop(0.32, rgba(profile.cloudMid, profile.cloudCeiling * (0.16 + depth * 0.06)));
      ceiling.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ceiling;
      ctx.fillRect(0, 0, this.width, this.height * (0.62 + depth * 0.04));
    }
    const horizonMist = ctx.createLinearGradient(0, this.height * 0.5, 0, this.height);
    horizonMist.addColorStop(0, "rgba(0,0,0,0)");
    horizonMist.addColorStop(0.58, profile.terrainMistColor);
    horizonMist.addColorStop(1, rgba(profile.fogLight, 0.1 + profile.haze * 0.12));
    ctx.fillStyle = horizonMist;
    ctx.fillRect(0, this.height * 0.48, this.width, this.height * 0.52);
  }
  drawAnchorLayers(time, anchors, profile, lightningFlash, ctx = this.context, relightOnly = false) {
    if (!anchors.length)
      return;
    for (const anchor of anchors) {
      const travel = this.width * anchor.parallax;
      const x = anchor.x * this.width + Math.sin(time * 0.02 + anchor.depth) * travel;
      const y = anchor.y * this.height;
      if (!relightOnly) {
        ctx.save();
        ctx.filter = `blur(${anchor.blur}px)`;
        drawSprite(ctx, anchor.sprite, anchor.palette, x, y, anchor.width, anchor.height, anchor.alpha, 0, this.onAssetReady);
        ctx.restore();
      }
      if (this.composition?.budget.flags.relightAnchors && lightningFlash > 0.01) {
        ctx.save();
        ctx.globalAlpha = lightningFlash * profile.relightAlpha * anchor.relight;
        const relight = ctx.createLinearGradient(0, y, 0, y + anchor.height * 0.6);
        relight.addColorStop(0, profile.anchorRimColor);
        relight.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = relight;
        ctx.fillRect(x, y, anchor.width, anchor.height * 0.56);
        ctx.restore();
      }
    }
  }
  drawMotes(time, motes, profile, ctx = this.context) {
    if (motes.length === 0)
      return;
    for (const mote of motes) {
      const x = (mote.x + Math.sin(time * mote.speed + mote.phase) * mote.driftX) * this.width;
      const y = (mote.y + Math.cos(time * mote.speed * 0.7 + mote.phase) * mote.driftY) * this.height;
      ctx.save();
      ctx.globalAlpha = mote.alpha * (0.26 + profile.haze * 0.26);
      ctx.fillStyle = rgba(profile.sunColor, 0.18);
      ctx.beginPath();
      ctx.arc(x, y, mote.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  drawThermalShimmer(time, profile) {
    if (!this.composition || profile.thermalShimmerAlpha <= 0.01 || this.composition.budget.distortionPasses <= 0)
      return;
    const ctx = this.context;
    const passCount = Math.max(1, this.composition.budget.distortionPasses);
    for (let index = 0;index < passCount; index += 1) {
      const alpha = profile.thermalShimmerAlpha * (0.18 + index * 0.06);
      const yBase = this.height * (0.66 + index * 0.03);
      ctx.save();
      ctx.strokeStyle = rgba(profile.sunColor, alpha);
      ctx.lineWidth = 1.1 + index * 0.5;
      ctx.filter = `blur(${1.2 + index * 0.8}px)`;
      ctx.beginPath();
      for (let x = -40;x <= this.width + 40; x += 42) {
        const wave = Math.sin(x * 0.012 + time * (0.7 + index * 0.14) + index * 0.8) * (3 + index * 1.6);
        if (x === -40) {
          ctx.moveTo(x, yBase + wave);
        } else {
          ctx.lineTo(x, yBase + wave);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
  }
  drawSurfaceLayers(time, layers, speedScale = 1) {
    if (layers.length === 0 || !this.composition)
      return;
    for (const layer of layers) {
      const travel = this.width + layer.width * 0.9;
      const offset = (layer.x * travel + time * layer.speed * speedScale * (0.08 + this.composition.profile.wind * 0.12)) % travel;
      const x = offset - layer.width * 0.35;
      const y = layer.y * this.height + Math.sin(time * 0.1 + layer.phase) * layer.driftY;
      drawSprite(this.context, layer.sprite, layer.palette, x, y, layer.width, layer.height, layer.alpha, layer.rotation + Math.sin(time * 0.06 + layer.phase) * 0.8, this.onAssetReady);
    }
  }
  drawShadowSweeps(time, profile, lightningFlash) {
    if (!this.composition || profile.shadowSweepAlpha <= 0.01 || this.composition.budget.shadowSweepPasses <= 0)
      return;
    const ctx = this.context;
    const passes = this.composition.budget.shadowSweepPasses;
    for (let index = 0;index < passes; index += 1) {
      const width = this.width * (0.26 + index * 0.08);
      const x = (time * (18 + index * 6) + index * this.width * 0.22) % (this.width + width * 2) - width;
      const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.48, rgba(profile.surfaceShadow, profile.shadowSweepAlpha * (0.18 + index * 0.06)));
      gradient.addColorStop(0.52, rgba(profile.surfaceLight, (profile.shadowSweepAlpha * 0.06 + lightningFlash * 0.04) * (0.7 + index * 0.1)));
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = gradient;
      ctx.fillRect(x, this.height * 0.08, width, this.height * 0.86);
      ctx.restore();
    }
  }
  drawWorldInteraction(time, profile, lightningFlash, contactBands, impactBursts, runoffSheets, accumulationBands, fogCreep) {
    const ctx = this.context;
    this.drawShadowSweeps(time, profile, lightningFlash);
    if (profile.contactHazeAlpha > 0.01) {
      const contactHaze = ctx.createLinearGradient(0, this.height * 0.72, 0, this.height);
      contactHaze.addColorStop(0, "rgba(0,0,0,0)");
      contactHaze.addColorStop(0.5, rgba(profile.surfaceLight, profile.contactHazeAlpha * 0.08 + lightningFlash * profile.surfaceRelightAlpha * 0.03));
      contactHaze.addColorStop(1, rgba(profile.surfaceShadow, profile.contactHazeAlpha * 0.16));
      ctx.fillStyle = contactHaze;
      ctx.fillRect(0, this.height * 0.68, this.width, this.height * 0.32);
    }
    this.drawSurfaceLayers(time, fogCreep, 0.7);
    this.drawSurfaceLayers(time, contactBands, 0.84);
    this.drawSurfaceLayers(time, runoffSheets, 1.16);
    this.drawSurfaceLayers(time, accumulationBands, 0.46);
    this.drawSurfaceLayers(time, impactBursts, 1.52);
    if (profile.wetSheenAlpha > 0.01 || lightningFlash > 0.01) {
      const wetGlow = ctx.createRadialGradient(this.width * 0.5, this.height * 1.02, this.width * 0.06, this.width * 0.5, this.height * 0.99, this.width * 0.46);
      wetGlow.addColorStop(0, rgba(profile.surfaceLight, profile.wetSheenAlpha * 0.1 + lightningFlash * profile.surfaceRelightAlpha * 0.08));
      wetGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = wetGlow;
      ctx.fillRect(0, this.height * 0.78, this.width, this.height * 0.22);
    }
  }
  drawCloudLayers(time, layers, ctx = this.context) {
    if (layers.length === 0 || !this.composition)
      return;
    for (const layer of layers) {
      const travel = this.width + layer.width * 1.6;
      const offset = (layer.x * travel + time * layer.speed * (0.45 + this.composition.profile.wind)) % travel;
      const x = offset - layer.width * 0.8;
      const y = layer.y * this.height + Math.sin(time * 0.14 + layer.phase) * layer.driftY;
      drawSprite(ctx, layer.sprite, layer.palette, x, y, layer.width, layer.height, layer.alpha, layer.rotation + Math.sin(time * 0.05 + layer.phase) * 1.1, this.onAssetReady);
    }
  }
  drawFogWisps(time, wisps, ctx = this.context) {
    if (wisps.length === 0 || !this.composition)
      return;
    for (const wisp of wisps) {
      const travel = this.width + wisp.width * 1.3;
      const offset = (wisp.x * travel + time * wisp.speed * (0.28 + this.composition.profile.wind * 0.5)) % travel;
      const x = offset - wisp.width * 0.6;
      const y = wisp.y * this.height + Math.sin(time * 0.12 + wisp.phase) * wisp.driftY;
      drawSprite(ctx, wisp.sprite, wisp.palette, x, y, wisp.width, wisp.height, wisp.alpha, wisp.rotation, this.onAssetReady);
    }
  }
  drawCurtainTextures(time, textures, ctx = this.context) {
    if (textures.length === 0 || !this.composition)
      return;
    for (const texture of textures) {
      const travel = this.width + texture.width * 0.6;
      const offset = (texture.x * travel + time * texture.speed * (0.16 + this.composition.profile.wind * 0.22)) % travel;
      const x = offset - texture.width * 0.3;
      const y = texture.y * this.height + Math.sin(time * 0.08 + texture.phase) * texture.driftY;
      drawSprite(ctx, texture.sprite, texture.palette, x, y, texture.width, texture.height, texture.alpha, texture.rotation, this.onAssetReady);
    }
  }
  drawCurtains(time, curtains, profile, ctx = this.context) {
    if (curtains.length === 0)
      return;
    for (const curtain of curtains) {
      const drift = (curtain.x + time * curtain.speed * 0.005) % 1 * this.width;
      const width = curtain.width * this.width;
      ctx.save();
      ctx.filter = `blur(${curtain.blur}px)`;
      ctx.globalAlpha = curtain.alpha;
      const gradient = ctx.createLinearGradient(drift, this.height * 0.18, drift + width * curtain.slant, this.height);
      if (this.state.condition === "snow") {
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.36, rgba(profile.snowColor, 0.18));
        gradient.addColorStop(1, rgba(profile.snowColor, 0.34));
      } else {
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.24, rgba(profile.rainColor, 0.12));
        gradient.addColorStop(1, rgba(profile.rainColor, 0.32));
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(drift, this.height * 0.12);
      ctx.lineTo(drift + width, this.height * 0.12);
      ctx.lineTo(drift + width + width * curtain.slant, this.height);
      ctx.lineTo(drift + width * curtain.slant, this.height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  getParticleStride(kind, densityBias = 1) {
    const baselinePixels = 1280 * 720;
    const areaScale = Math.sqrt(baselinePixels / Math.max(1, this.width * this.height));
    const qualityScale = this.prefs.qualityMode === "cinematic" ? 0.9 : this.prefs.qualityMode === "standard" ? 0.78 : this.prefs.qualityMode === "lite" ? 0.68 : 0.58;
    const frontPenalty = kind === "front" ? 0.68 : 1;
    const drawScale = clamp(areaScale * qualityScale * frontPenalty * densityBias, 0.26, 1);
    return Math.max(1, Math.ceil(1 / drawScale));
  }
  getParticleDrawLimit(total, kind, densityBias = 1) {
    const baselinePixels = 1280 * 720;
    const areaScale = Math.sqrt(baselinePixels / Math.max(1, this.width * this.height));
    const qualityScale = this.prefs.qualityMode === "cinematic" ? 0.92 : this.prefs.qualityMode === "standard" ? 0.82 : this.prefs.qualityMode === "lite" ? 0.7 : 0.58;
    const frontPenalty = kind === "front" ? 0.64 : 1;
    const scale = clamp(areaScale * qualityScale * frontPenalty * densityBias, 0.2, 1);
    return Math.max(1, Math.min(total, Math.round(total * scale)));
  }
  drawRain(time, particles, profile, kind) {
    if (particles.length === 0)
      return;
    const ctx = this.context;
    const stride = this.getParticleStride(kind, 0.94);
    const activeCount = this.getParticleDrawLimit(particles.length, kind, 0.9);
    const mainAlpha = (kind === "front" ? 0.34 : 0.22) * clamp(profile.nearPrecipAlpha + profile.distantPrecipAlpha * 0.4, 0.4, 1.05);
    const lengthScale = kind === "front" ? 0.86 : 0.6;
    const slantScale = 0.08 + profile.wind * (kind === "front" ? 0.1 : 0.07);
    ctx.save();
    ctx.strokeStyle = rgba(profile.rainColor, mainAlpha);
    ctx.lineWidth = kind === "front" ? 1.4 : 1;
    ctx.lineCap = "round";
    ctx.beginPath();
    let drawn = 0;
    for (let index = 0;index < particles.length && drawn < activeCount; index += stride, drawn += 1) {
      const particle = particles[index];
      const progress = (time / particle.cycle + particle.offset) % 1;
      const x = (particle.x + progress * particle.drift + Math.sin(time * 2.2 + particle.phase) * particle.sway) * this.width;
      const y = -particle.height + progress * (this.height + particle.height * 1.4);
      const length = particle.height * lengthScale;
      const slant = length * slantScale + particle.width * 0.8;
      ctx.moveTo(x, y);
      ctx.lineTo(x - slant, y - length);
    }
    ctx.stroke();
    const highlightStride = stride * (kind === "front" ? 3 : 5);
    ctx.strokeStyle = rgba("#ffffff", kind === "front" ? mainAlpha * 0.72 : mainAlpha * 0.44);
    ctx.lineWidth = kind === "front" ? 0.8 : 0.55;
    ctx.beginPath();
    const highlightCount = Math.max(1, Math.round(activeCount / (kind === "front" ? 3 : 5)));
    drawn = 0;
    for (let index = 0;index < particles.length && drawn < highlightCount; index += highlightStride, drawn += 1) {
      const particle = particles[index];
      const progress = (time / particle.cycle + particle.offset) % 1;
      const x = (particle.x + progress * particle.drift + Math.sin(time * 2.2 + particle.phase) * particle.sway) * this.width;
      const y = -particle.height + progress * (this.height + particle.height * 1.4);
      const length = particle.height * (lengthScale * 0.42);
      const slant = length * slantScale;
      ctx.moveTo(x, y);
      ctx.lineTo(x - slant, y - length);
    }
    ctx.stroke();
    ctx.restore();
  }
  drawSnow(time, particles, profile, kind) {
    if (particles.length === 0)
      return;
    const ctx = this.context;
    const stride = this.getParticleStride(kind, 1.08);
    const activeCount = this.getParticleDrawLimit(particles.length, kind, 1.02);
    const baseRadiusScale = kind === "front" ? 0.26 : 0.2;
    ctx.save();
    ctx.fillStyle = rgba(profile.snowColor, kind === "front" ? 0.38 : 0.26);
    ctx.beginPath();
    let drawn = 0;
    for (let index = 0;index < particles.length && drawn < activeCount; index += stride, drawn += 1) {
      const particle = particles[index];
      const progress = (time / particle.cycle + particle.offset) % 1;
      const x = (particle.x + Math.sin(time * particle.sway + particle.phase) * particle.drift + progress * particle.drift * 0.18) * this.width;
      const y = -particle.size + progress * (this.height + particle.size * 1.4);
      const radius = Math.max(1, particle.size * baseRadiusScale);
      ctx.moveTo(x + radius, y);
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fill();
    const highlightStride = stride * (kind === "front" ? 4 : 6);
    ctx.fillStyle = rgba("#ffffff", kind === "front" ? 0.3 : 0.18);
    ctx.beginPath();
    const highlightCount = Math.max(1, Math.round(activeCount / (kind === "front" ? 4 : 6)));
    drawn = 0;
    for (let index = 0;index < particles.length && drawn < highlightCount; index += highlightStride, drawn += 1) {
      const particle = particles[index];
      const progress = (time / particle.cycle + particle.offset) % 1;
      const x = (particle.x + Math.sin(time * particle.sway + particle.phase) * particle.drift + progress * particle.drift * 0.18) * this.width;
      const y = -particle.size + progress * (this.height + particle.size * 1.4);
      const radius = Math.max(0.9, particle.size * baseRadiusScale * 0.54);
      ctx.moveTo(x + radius, y);
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
  drawHorizon(profile, lightningFlash, ctx = this.context) {
    const gradient = ctx.createLinearGradient(0, this.height * 0.44, 0, this.height);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.68, rgba(profile.surfaceLight, profile.horizonGlintAlpha * 0.08 + lightningFlash * 0.03));
    gradient.addColorStop(0.8, rgba(profile.fogLight, 0.08 + lightningFlash * 0.03));
    gradient.addColorStop(1, rgba(profile.fogLight, 0.18 + lightningFlash * 0.06));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, this.height * 0.4, this.width, this.height * 0.6);
    const lowMist = ctx.createRadialGradient(this.width * 0.5, this.height * 1.05, this.width * 0.08, this.width * 0.5, this.height * 1.02, this.width * 0.8);
    lowMist.addColorStop(0, rgba(profile.fogLight, 0.08 + profile.fogDensity * 0.1));
    lowMist.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lowMist;
    ctx.fillRect(0, this.height * 0.56, this.width, this.height * 0.5);
    const terrainFade = ctx.createLinearGradient(0, this.height * 0.58, 0, this.height);
    terrainFade.addColorStop(0, "rgba(0,0,0,0)");
    terrainFade.addColorStop(0.5, rgba(profile.anchorNearColor, 0.08 + profile.anchorAlpha * 0.16));
    terrainFade.addColorStop(1, rgba(profile.anchorNearColor, 0.24 + profile.anchorAlpha * 0.14));
    ctx.fillStyle = terrainFade;
    ctx.fillRect(0, this.height * 0.58, this.width, this.height * 0.42);
  }
  drawVignette(profile) {
    this.context.fillStyle = profile.vignette;
    this.context.fillRect(0, 0, this.width, this.height);
  }
  drawGlass(profile, time, rivulets, beads, condensationBlooms, lightningFlash) {
    if (!this.composition?.budget.flags.glassOverlay || this.kind !== "back" || this.state.condition !== "rain" && this.state.condition !== "storm" || profile.windowOpacity <= 0.02 || !rivulets.length && !beads.length && condensationBlooms.length === 0 && profile.condensationAlpha <= 0.01) {
      return;
    }
    const palette = buildGlassPalette(profile);
    const ctx = this.context;
    if (profile.condensationAlpha > 0.01) {
      const edgePool = ctx.createLinearGradient(0, 0, 0, this.height * 0.22);
      edgePool.addColorStop(0, rgba(profile.fogLight, profile.condensationAlpha * 0.12));
      edgePool.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = edgePool;
      ctx.fillRect(0, 0, this.width, this.height * 0.22);
      const leftEdge = ctx.createLinearGradient(0, 0, this.width * 0.08, 0);
      leftEdge.addColorStop(0, rgba(profile.fogLight, profile.condensationAlpha * 0.08));
      leftEdge.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = leftEdge;
      ctx.fillRect(0, 0, this.width * 0.1, this.height);
      const rightEdge = ctx.createLinearGradient(this.width, 0, this.width * 0.92, 0);
      rightEdge.addColorStop(0, rgba(profile.fogLight, profile.condensationAlpha * 0.08));
      rightEdge.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rightEdge;
      ctx.fillRect(this.width * 0.9, 0, this.width * 0.1, this.height);
      const bottomPool = ctx.createRadialGradient(this.width * 0.5, this.height * 1.04, this.width * 0.08, this.width * 0.5, this.height * 1.02, this.width * 0.46);
      bottomPool.addColorStop(0, rgba(profile.fogLight, profile.condensationAlpha * 0.12 + lightningFlash * 0.02));
      bottomPool.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bottomPool;
      ctx.fillRect(0, this.height * 0.78, this.width, this.height * 0.22);
    }
    if (condensationBlooms.length > 0) {
      this.drawSurfaceLayers(time, condensationBlooms, 0.38);
    }
    if (this.composition && this.composition.budget.distortionPasses > 0 && profile.distortionAlpha > 0.01) {
      for (let index = 0;index < this.composition.budget.distortionPasses; index += 1) {
        const x = (time * (10 + index * 4) + index * this.width * 0.18) % (this.width * 1.4) - this.width * 0.2;
        const distortion = ctx.createLinearGradient(x, 0, x + this.width * 0.18, 0);
        distortion.addColorStop(0, "rgba(255,255,255,0)");
        distortion.addColorStop(0.5, rgba(profile.fogLight, profile.distortionAlpha * (0.04 + index * 0.02)));
        distortion.addColorStop(1, "rgba(255,255,255,0)");
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = distortion;
        ctx.fillRect(x, 0, this.width * 0.18, this.height);
        ctx.restore();
      }
    }
    for (const rivulet of rivulets) {
      const progress = (time * rivulet.speed + rivulet.phase / (Math.PI * 2)) % 1;
      const x = (rivulet.x + Math.sin(time * 0.28 + rivulet.phase) * rivulet.drift) * this.width;
      const y = -rivulet.height * 0.4 + progress * (this.height + rivulet.height * 0.8);
      drawSprite(ctx, "glass-rivulet", palette, x, y, rivulet.width, rivulet.height, rivulet.alpha, 0, this.onAssetReady);
    }
    for (const bead of beads) {
      const offset = time * bead.speed;
      const x = (bead.x + Math.cos(time * 0.2 + bead.phase) * bead.drift) * this.width;
      const y = (bead.y + offset) * this.height;
      drawSprite(ctx, "glass-drop", palette, x, y, bead.width, bead.height, bead.alpha, 0, this.onAssetReady);
    }
  }
  resolveLightningState(time) {
    if (!this.lightningEvents.length)
      return { flash: 0, bolts: [] };
    const now = time;
    this.lightningEvents = this.lightningEvents.filter((event) => event.start + event.duration > now);
    if (!this.lightningEvents.length)
      return { flash: 0, bolts: [] };
    let flash = 0;
    const bolts = [];
    for (const event of this.lightningEvents) {
      if (now < event.start)
        continue;
      const progress = clamp((now - event.start) / event.duration, 0, 1);
      const strength = Math.sin((1 - progress) * Math.PI) * event.flash;
      flash = Math.max(flash, strength);
      for (const bolt of event.bolts) {
        bolts.push({ ...bolt, alpha: bolt.alpha * (1 - progress) });
      }
    }
    return { flash, bolts };
  }
  drawLightningState(profile, lightning) {
    if (lightning.flash <= 0.001 && lightning.bolts.length === 0)
      return;
    const palette = buildLightningPalette(profile);
    const ctx = this.context;
    ctx.save();
    ctx.globalAlpha = lightning.flash * (this.kind === "back" ? 0.46 : 0.26);
    ctx.fillStyle = rgba(profile.lightningGlow, 0.72);
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
    for (const bolt of lightning.bolts) {
      drawSprite(ctx, "lightning-fork", palette, bolt.x * this.width, bolt.y * this.height, bolt.width, bolt.height, bolt.alpha, bolt.rotation, this.onAssetReady);
    }
  }
  handleFatalError(error) {
    if (this.failed)
      return;
    this.failed = true;
    this.stopLoop();
    this.visible = false;
    this.root.classList.add("weather-hidden");
    this.root.classList.remove("weather-visible");
    this.root.dataset.failed = "true";
    console.error("[weather_hud] renderer disabled after runtime error", error);
  }
}
function createWeatherRenderer(kind) {
  let renderer;
  try {
    renderer = new CanvasWeatherRenderer(kind);
  } catch (error) {
    console.error(`[weather_hud] failed to initialize ${kind} renderer`, error);
    const root = document.createElement("div");
    root.className = "weather-fx-root weather-fx-renderer-root weather-hidden";
    root.dataset.kind = kind;
    root.dataset.failed = "true";
    root.setAttribute("aria-hidden", "true");
    return {
      root,
      destroy: () => root.remove(),
      refreshLayout: () => {
        return;
      },
      setScene: () => {
        return;
      },
      setVisible: () => {
        return;
      },
      triggerLightning: () => {
        return;
      }
    };
  }
  return {
    root: renderer.root,
    destroy: () => renderer.destroy(),
    refreshLayout: () => renderer.refreshLayout(),
    setScene: (state, prefs, reducedMotion) => renderer.setScene(state, prefs, reducedMotion),
    setVisible: (visible) => renderer.setVisible(visible),
    triggerLightning: () => renderer.triggerLightning()
  };
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
  const motionSection = createSection("Motion", "Fine-tune motion budgets and pacing. Higher quality increases scene depth, atmospheric layering, and back-glass detail.");
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
  const qualityHint = document.createElement("p");
  qualityHint.className = "weather-settings-section-copy";
  qualityHint.textContent = "Lite is the recommended default for smooth everyday use. Performance trims the renderer hardest, Standard adds fuller depth, and Cinematic stays the richest tier while still using capped frame and pixel budgets.";
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
  motionSection.body.appendChild(qualityHint);
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

.weather-fx-renderer-root {
  overflow: hidden;
}

.weather-fx-renderer-root .weather-fx-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.weather-fx-renderer-root[data-kind="front"] .weather-fx-canvas {
  mix-blend-mode: screen;
  opacity: 0.98;
}

.weather-fx-renderer-root[data-kind="front"][data-condition="snow"] .weather-fx-canvas,
.weather-fx-renderer-root[data-kind="front"][data-condition="fog"] .weather-fx-canvas {
  mix-blend-mode: normal;
  opacity: 0.88;
}

.weather-fx-glass {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  opacity: var(--weather-glass-opacity, 0);
  transition: opacity 280ms ease;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, calc(0.004 + var(--weather-glass-condensation, 0) * 0.02)), transparent 12%, transparent 84%, rgba(255, 255, 255, calc(0.01 + var(--weather-glass-edge-opacity, 0) * 0.03)) 100%),
    linear-gradient(90deg, rgba(255, 255, 255, calc(var(--weather-glass-edge-opacity, 0) * 0.035)), transparent 8%, transparent 92%, rgba(255, 255, 255, calc(var(--weather-glass-edge-opacity, 0) * 0.035)));
  backdrop-filter:
    blur(calc(var(--weather-glass-blur, 0) * 0.32px + var(--weather-glass-distortion, 0) * 0.28px))
    saturate(calc(101% + var(--weather-glass-distortion, 0) * 3%));
  mix-blend-mode: normal;
}

.weather-fx-glass::before,
.weather-fx-glass::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.weather-fx-glass::before {
  opacity: calc(var(--weather-frost-opacity, 0) * 0.4 + var(--weather-glass-condensation, 0) * 0.04);
  background:
    radial-gradient(circle at 12% 10%, rgba(255, 255, 255, calc(0.016 + var(--weather-glass-condensation, 0) * 0.04)), transparent 18%),
    radial-gradient(circle at 82% 16%, rgba(255, 255, 255, calc(0.014 + var(--weather-glass-condensation, 0) * 0.03)), transparent 16%),
    linear-gradient(180deg, rgba(255, 255, 255, calc(0.01 + var(--weather-frost-opacity, 0) * 0.02)), transparent 14%, transparent 78%, rgba(255, 255, 255, calc(0.015 + var(--weather-glass-edge-opacity, 0) * 0.03)) 100%);
}

.weather-fx-glass::after {
  background:
    radial-gradient(circle at 50% 108%, rgba(255, 255, 255, calc(0.014 + var(--weather-glass-edge-opacity, 0) * 0.04)), transparent 36%),
    linear-gradient(180deg, transparent 76%, rgba(255, 255, 255, calc(var(--weather-glass-edge-opacity, 0) * 0.035)) 100%);
  opacity: calc(0.08 + var(--weather-glass-edge-opacity, 0) * 0.08);
}

.weather-fx-renderer-root[data-glass="none"] .weather-fx-glass {
  opacity: 0;
  backdrop-filter: none;
}

.weather-fx-renderer-root[data-glass="rain"] .weather-fx-glass,
.weather-fx-renderer-root[data-glass="storm"] .weather-fx-glass {
  opacity: calc(var(--weather-glass-opacity, 0) * 0.44);
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
function protectInteractive(element) {
  const stop = (event) => event.stopPropagation();
  element.addEventListener("pointerdown", stop);
  element.addEventListener("mousedown", stop);
  element.addEventListener("touchstart", stop);
}
function createRendererFxRoot(kind) {
  const renderer = createWeatherRenderer(kind);
  return {
    root: renderer.root,
    renderer,
    host: null,
    releaseHost: null,
    kind
  };
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
    qualitySelect.title = "Lite is the recommended default for smooth everyday use. Performance trims the renderer hardest, Standard adds fuller depth, and Cinematic stays the richest tier while still using capped frame and pixel budgets.";
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
  root.renderer.setVisible(visible);
}
function applySceneState(root, state, prefs, reducedMotion) {
  root.renderer.setScene(state, prefs, reducedMotion);
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
  const motionMedia = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const getReducedMotion = () => currentPrefs.reducedMotion === "always" || currentPrefs.reducedMotion === "system" && !!motionMedia?.matches;
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
  const backFx = createRendererFxRoot("back");
  const frontFx = createRendererFxRoot("front");
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
    fxRoot.renderer.setVisible(false);
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
    fxRoot.renderer.refreshLayout();
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
  let hostObserver = null;
  if (typeof MutationObserver !== "undefined") {
    hostObserver = new MutationObserver(() => {
      if (backFx.host?.isConnected && frontFx.host?.isConnected && backFx.root.parentElement === backFx.host && frontFx.root.parentElement === frontFx.host) {
        return;
      }
      queueFxRootAttach();
    });
    const observerTarget = document.body ?? document.documentElement;
    if (observerTarget) {
      hostObserver.observe(observerTarget, { childList: true, subtree: true });
    }
  }
  cleanups.push(() => {
    if (hostSyncFrame !== null) {
      window.cancelAnimationFrame(hostSyncFrame);
      hostSyncFrame = null;
    }
    hostObserver?.disconnect();
    detachFxRoot(backFx);
    detachFxRoot(frontFx);
    backFx.renderer.destroy();
    frontFx.renderer.destroy();
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
      return;
    }
    const trigger = () => {
      backFx.renderer.triggerLightning();
      frontFx.renderer.triggerLightning();
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
  if (motionMedia) {
    if (typeof motionMedia.addEventListener === "function") {
      motionMedia.addEventListener("change", onMotionChange);
      cleanups.push(() => motionMedia.removeEventListener("change", onMotionChange));
    } else if (typeof motionMedia.addListener === "function") {
      motionMedia.addListener(onMotionChange);
      cleanups.push(() => motionMedia.removeListener(onMotionChange));
    }
  }
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
