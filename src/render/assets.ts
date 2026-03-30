export type WeatherSpriteKind =
  | "cloud-wisp"
  | "cloud-bank"
  | "cloud-stratus"
  | "cloud-anvil"
  | "cloud-shelf"
  | "storm-scud"
  | "fog-wisp"
  | "horizon-ridge"
  | "horizon-treeline"
  | "horizon-poles"
  | "precip-curtain"
  | "surface-sheen"
  | "surface-splash"
  | "surface-runoff"
  | "surface-accumulation"
  | "condensation-bloom"
  | "fog-creep"
  | "rain-streak"
  | "snow-crystal"
  | "glass-drop"
  | "glass-rivulet"
  | "lightning-fork";

export interface WeatherSpritePalette {
  primary: string;
  secondary: string;
  shadow: string;
  highlight: string;
  accent: string;
  glow: string;
}

const readySprites = new Map<string, HTMLImageElement>();
const pendingSprites = new Map<string, Promise<HTMLImageElement>>();
const pendingReadyCallbacks = new Map<string, Set<() => void>>();
const spriteSvgCache = new Map<string, string>();

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildSvgDocument(viewBox: string, defs: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none">${defs}${body}</svg>`;
}

function buildCloudWispSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 720 280",
    `<defs>
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
    </defs>`,
    `<g filter="url(#soft)">
      <path d="M34 186C57 131 119 98 196 108c19-46 76-74 140-68 46-47 144-58 215 7 79-20 136 18 135 71 51 15 83 49 83 88H46c-28-1-47-16-46-40 1-28 17-47 34-60Z" fill="url(#cloud)"/>
      <path d="M118 121c32-32 91-46 148-35 38-33 118-44 170-6 66-9 117 18 138 55-25-20-65-28-107-20-44-44-129-52-190-8-61-16-132 0-159 14Z" fill="url(#rim)" opacity="0.7"/>
      <path d="M72 197c81 12 224 20 329 16 95-4 191-16 284-41-39 37-128 61-272 67-182 8-290-11-341-42Z" fill="${colors.shadow}" opacity="0.38"/>
    </g>`,
  );
}

function buildCloudBankSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 720 320",
    `<defs>
      <linearGradient id="bank" x1="0" y1="40" x2="0" y2="280" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="42%" stop-color="${colors.secondary}"/>
        <stop offset="100%" stop-color="${colors.shadow}"/>
      </linearGradient>
      <filter id="bank-blur" x="-18%" y="-18%" width="136%" height="170%">
        <feGaussianBlur stdDeviation="11"/>
      </filter>
    </defs>`,
    `<g filter="url(#bank-blur)">
      <path d="M41 225c12-81 88-126 183-110 25-63 93-104 179-94 31-33 91-56 147-45 47 9 80 34 93 71 47 0 77 29 77 74 0 38-24 66-67 78H83c-33 0-53-14-54-44 0-16 4-25 12-30Z" fill="url(#bank)"/>
      <path d="M132 140c37-36 95-51 150-39 61-56 187-62 258 12-36-20-93-25-152-5-68-33-173-24-256 32Z" fill="${colors.highlight}" opacity="0.42"/>
      <path d="M81 226c118 16 255 16 407 0 76-8 141-22 194-42-44 52-133 87-286 98-159 12-265-4-315-56Z" fill="${colors.shadow}" opacity="0.44"/>
    </g>`,
  );
}

function buildCloudStratusSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 840 280",
    `<defs>
      <linearGradient id="stratus" x1="0" y1="10" x2="0" y2="250" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="35%" stop-color="${colors.primary}"/>
        <stop offset="100%" stop-color="${colors.shadow}"/>
      </linearGradient>
      <filter id="stratus-blur" x="-12%" y="-18%" width="124%" height="160%">
        <feGaussianBlur stdDeviation="9"/>
      </filter>
    </defs>`,
    `<g filter="url(#stratus-blur)">
      <path d="M0 103c88-31 166-40 244-31 93-38 230-46 327-18 70-24 150-24 269 6v116H0V103Z" fill="url(#stratus)"/>
      <path d="M0 143c158-22 292-24 403-5 160-19 305-15 437 19v49H0v-63Z" fill="${colors.secondary}" opacity="0.52"/>
      <path d="M0 192c161 18 316 20 463 3 146-17 272-47 377-89v134H0V192Z" fill="${colors.shadow}" opacity="0.48"/>
    </g>`,
  );
}

function buildCloudAnvilSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 760 420",
    `<defs>
      <linearGradient id="anvil" x1="0" y1="20" x2="0" y2="360" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="36%" stop-color="${colors.primary}"/>
        <stop offset="100%" stop-color="${colors.shadow}"/>
      </linearGradient>
      <filter id="anvil-blur" x="-18%" y="-18%" width="136%" height="160%">
        <feGaussianBlur stdDeviation="12"/>
      </filter>
    </defs>`,
    `<g filter="url(#anvil-blur)">
      <path d="M73 300c-5-56 37-96 103-109 7-108 88-175 188-175 61 0 111 22 146 62 22-7 44-11 67-11 82 0 149 54 165 131 52 12 85 51 85 101 0 67-49 121-109 121H147c-44 0-73-18-74-60 0-21 0-39 0-60Z" fill="url(#anvil)"/>
      <path d="M179 101c24-48 77-79 138-79 52 0 98 21 127 55 47-5 90 8 131 42-31-12-69-14-112-4-38-40-87-58-147-52-56-16-100-6-137 38Z" fill="${colors.highlight}" opacity="0.48"/>
      <path d="M94 312c89 14 190 13 303-2 110-15 209-44 299-89-41 76-141 130-306 149-149 17-244 0-296-58Z" fill="${colors.shadow}" opacity="0.56"/>
    </g>`,
  );
}

function buildCloudShelfSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 840 320",
    `<defs>
      <linearGradient id="shelf" x1="0" y1="36" x2="0" y2="286" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.primary}"/>
        <stop offset="45%" stop-color="${colors.secondary}"/>
        <stop offset="100%" stop-color="${colors.shadow}"/>
      </linearGradient>
      <filter id="shelf-blur" x="-10%" y="-18%" width="120%" height="160%">
        <feGaussianBlur stdDeviation="9"/>
      </filter>
    </defs>`,
    `<g filter="url(#shelf-blur)">
      <path d="M0 90c132-34 289-26 426 21 115-33 253-27 414 18v74c-118 38-254 59-408 60C272 264 128 241 0 195V90Z" fill="url(#shelf)"/>
      <path d="M0 145c139 22 281 33 426 33 147 0 285-13 414-40v61c-121 36-260 55-415 55C279 254 137 236 0 200v-55Z" fill="${colors.shadow}" opacity="0.56"/>
      <path d="M92 108c91-14 190-12 296 8 121-24 243-25 362-4-106-8-221 4-344 37-96-25-200-36-314-41Z" fill="${colors.highlight}" opacity="0.28"/>
    </g>`,
  );
}

function buildStormScudSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 820 240",
    `<defs>
      <linearGradient id="scud" x1="0" y1="18" x2="0" y2="220" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="34%" stop-color="${colors.primary}"/>
        <stop offset="100%" stop-color="${colors.shadow}"/>
      </linearGradient>
      <filter id="scud-blur" x="-14%" y="-28%" width="128%" height="180%">
        <feGaussianBlur stdDeviation="8"/>
      </filter>
    </defs>`,
    `<g filter="url(#scud-blur)">
      <path d="M0 106c67-38 142-45 223-20 78-35 165-38 258-10 64-25 130-21 198 12 56-12 103-6 141 18v61c-77 28-158 42-243 43-142 1-334-22-577-70v-34Z" fill="url(#scud)"/>
      <path d="M51 134c77-13 157-9 240 14 103-28 213-27 330 6-111-16-222-10-334 17-79-23-157-36-236-37Z" fill="${colors.highlight}" opacity="0.2"/>
      <path d="M0 170c124 27 248 42 371 44 130 2 280-16 449-55v75H0v-64Z" fill="${colors.shadow}" opacity="0.54"/>
    </g>`,
  );
}

function buildFogWispSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 900 240",
    `<defs>
      <linearGradient id="fog" x1="0" y1="10" x2="0" y2="200" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.48"/>
        <stop offset="50%" stop-color="${colors.primary}" stop-opacity="0.82"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.18"/>
      </linearGradient>
      <filter id="fog-blur" x="-14%" y="-40%" width="128%" height="220%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>`,
    `<g filter="url(#fog-blur)">
      <path d="M0 133c77-37 166-49 265-33 100-43 225-54 372-32 98-27 186-22 263 16v65c-135 31-253 45-356 44-121-1-303-11-544-28V133Z" fill="url(#fog)"/>
      <path d="M0 155c216 30 430 31 641 1 85-12 171-29 259-52v61c-201 44-392 61-573 52C195 211 86 190 0 162v-7Z" fill="${colors.glow}" opacity="0.34"/>
    </g>`,
  );
}

function buildHorizonRidgeSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 1200 220",
    `<defs>
      <linearGradient id="ridge" x1="0" y1="36" x2="0" y2="212" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.18"/>
        <stop offset="42%" stop-color="${colors.primary}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.96"/>
      </linearGradient>
      <filter id="ridge-soft" x="-8%" y="-10%" width="116%" height="130%">
        <feGaussianBlur stdDeviation="2.2"/>
      </filter>
    </defs>`,
    `<g filter="url(#ridge-soft)">
      <path d="M0 162c92-6 153-34 218-74 47-28 91-33 135-16 43-44 82-53 119-30 58-31 111-30 159 1 70-46 134-42 194 11 38-15 87-6 148 26 56-12 131 6 228 54v86H0v-58Z" fill="url(#ridge)"/>
    </g>`,
  );
}

function buildHorizonTreelineSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 1200 240",
    `<defs>
      <linearGradient id="trees" x1="0" y1="56" x2="0" y2="214" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.18"/>
        <stop offset="30%" stop-color="${colors.primary}" stop-opacity="0.86"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.98"/>
      </linearGradient>
    </defs>`,
    `<path d="M0 176c16-18 33-22 54-12 7-26 21-40 42-42 10-24 28-38 54-41 16-23 30-35 44-35 18 0 35 12 50 37 8-28 24-44 49-48 18-24 35-36 53-36 20 0 39 12 58 37 13-22 28-32 45-32 16 0 29 9 39 28 12-22 29-33 50-33 21 0 41 12 59 36 15-27 33-40 56-40 19 0 38 12 57 35 11-19 28-29 52-29 23 0 45 13 67 38 13-17 27-24 43-24 25 0 47 15 66 46 18-16 34-24 49-24 29 0 49 15 61 45 15-16 31-24 50-24 24 0 44 14 62 43 16-13 34-19 54-19 30 0 56 16 77 49v85H0v-62Z" fill="url(#trees)"/>`,
  );
}

function buildHorizonPolesSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 1200 240",
    `<defs>
      <linearGradient id="pole" x1="0" y1="0" x2="0" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.08"/>
        <stop offset="40%" stop-color="${colors.primary}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.96"/>
      </linearGradient>
    </defs>`,
    `<g stroke="url(#pole)" stroke-linecap="round" stroke-width="7">
      <path d="M126 92v130"/>
      <path d="M128 118h72"/>
      <path d="M386 64v158"/>
      <path d="M388 96h82"/>
      <path d="M702 86v136"/>
      <path d="M704 112h68"/>
      <path d="M986 72v150"/>
      <path d="M988 102h78"/>
      <path d="M122 118c94 13 178 10 258-8 124 18 229 17 321-3 97 15 189 9 287-17" stroke-width="4" stroke-opacity="0.66"/>
    </g>`,
  );
}

function buildPrecipCurtainSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 220 640",
    `<defs>
      <linearGradient id="curtain" x1="34" y1="0" x2="176" y2="640" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="18%" stop-color="${colors.highlight}" stop-opacity="0.18"/>
        <stop offset="56%" stop-color="${colors.primary}" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="curtain-blur" x="-30%" y="-8%" width="160%" height="116%">
        <feGaussianBlur stdDeviation="4.5"/>
      </filter>
    </defs>`,
    `<g filter="url(#curtain-blur)">
      <path d="M14 8c20 28 38 68 54 118 15 49 35 111 58 186 17 55 35 128 54 220-26-65-49-122-69-171-24-59-46-122-66-189C30 117 20 62 14 8Z" fill="url(#curtain)"/>
      <path d="M78 0c14 32 29 76 43 130 13 50 31 115 54 194 17 57 32 132 45 226-20-68-39-128-58-180-22-60-42-123-58-190C92 122 83 62 78 0Z" fill="${colors.glow}" opacity="0.34"/>
    </g>`,
  );
}

function buildSurfaceSheenSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 1200 240",
    `<defs>
      <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="36%" stop-color="${colors.primary}" stop-opacity="0.24"/>
        <stop offset="58%" stop-color="${colors.accent}" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="sheen-blur" x="-8%" y="-50%" width="116%" height="220%">
        <feGaussianBlur stdDeviation="12"/>
      </filter>
    </defs>`,
    `<g filter="url(#sheen-blur)">
      <path d="M0 168c128-24 244-30 347-18 103-26 231-29 384-8 103-14 259-12 469 8v90H0v-72Z" fill="url(#sheen)"/>
      <path d="M96 156c112 13 238 16 378 9 140-6 288-20 444-41 90-12 184-14 282-7-150 30-293 50-431 60-169 12-394 7-673-21Z" fill="${colors.glow}" opacity="0.34"/>
      <path d="M0 198c160 24 352 32 576 24 222-8 430-30 624-67v85H0v-42Z" fill="${colors.shadow}" opacity="0.18"/>
    </g>`,
  );
}

function buildSurfaceSplashSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 220 140",
    `<defs>
      <radialGradient id="splash-core" cx="50%" cy="58%" r="54%">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.88"/>
        <stop offset="54%" stop-color="${colors.primary}" stop-opacity="0.72"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </radialGradient>
      <filter id="splash-blur" x="-24%" y="-24%" width="148%" height="168%">
        <feGaussianBlur stdDeviation="3.6"/>
      </filter>
    </defs>`,
    `<g filter="url(#splash-blur)">
      <ellipse cx="110" cy="104" rx="84" ry="20" fill="url(#splash-core)"/>
      <path d="M38 100c12-9 23-24 31-46 9 17 14 33 14 47 11-17 21-39 28-65 10 17 15 33 16 48 12-15 23-35 31-58 10 15 15 31 14 48 11-13 20-30 28-51 11 15 16 29 15 43 10-8 17-18 21-31 2 15-1 30-10 45H38Z" fill="${colors.accent}" opacity="0.56"/>
      <circle cx="54" cy="54" r="10" fill="${colors.glow}" opacity="0.48"/>
      <circle cx="92" cy="36" r="7" fill="${colors.highlight}" opacity="0.52"/>
      <circle cx="148" cy="28" r="8" fill="${colors.highlight}" opacity="0.46"/>
      <circle cx="186" cy="52" r="9" fill="${colors.glow}" opacity="0.42"/>
    </g>`,
  );
}

function buildSurfaceRunoffSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 180 560",
    `<defs>
      <linearGradient id="runoff" x1="24" y1="0" x2="156" y2="560" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="18%" stop-color="${colors.highlight}" stop-opacity="0.6"/>
        <stop offset="52%" stop-color="${colors.primary}" stop-opacity="0.66"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="runoff-blur" x="-40%" y="-10%" width="180%" height="120%">
        <feGaussianBlur stdDeviation="4.4"/>
      </filter>
    </defs>`,
    `<g filter="url(#runoff-blur)">
      <path d="M32 0c18 42 30 96 36 161 5 54 17 126 36 214 13 60 23 122 28 185-18-53-33-102-43-149-15-67-29-141-42-220C39 112 34 49 32 0Z" fill="url(#runoff)"/>
      <path d="M82 0c15 38 29 86 40 145 11 56 27 132 47 230 12 61 21 123 25 185-15-52-29-99-40-143-18-71-34-147-48-228C97 110 89 48 82 0Z" fill="${colors.glow}" opacity="0.34"/>
      <path d="M118 34c12 24 23 56 32 96 8 39 21 93 38 163-16-39-29-75-39-109-13-46-23-96-31-150Z" fill="${colors.accent}" opacity="0.26"/>
    </g>`,
  );
}

function buildSurfaceAccumulationSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 1200 180",
    `<defs>
      <linearGradient id="accum" x1="0" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.24"/>
        <stop offset="52%" stop-color="${colors.primary}" stop-opacity="0.88"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.3"/>
      </linearGradient>
      <filter id="accum-soft" x="-6%" y="-20%" width="112%" height="160%">
        <feGaussianBlur stdDeviation="2.6"/>
      </filter>
    </defs>`,
    `<g filter="url(#accum-soft)">
      <path d="M0 126c45-18 90-23 133-16 58-23 125-28 199-15 49-14 103-12 160 4 45-17 97-18 156-4 61-18 131-17 209 4 54-14 111-11 171 9 53-10 111-6 172 11v61H0v-54Z" fill="url(#accum)"/>
      <path d="M44 108c53-6 103-1 150 15 63-18 131-17 203 5 69-16 146-15 232 5 58-13 121-11 187 7 79-12 140-8 183 12-82-12-161-16-237-10-76 7-146 4-211-8-76-14-149-16-218-4-67-19-130-26-189-22Z" fill="${colors.glow}" opacity="0.38"/>
    </g>`,
  );
}

function buildCondensationBloomSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 260 220",
    `<defs>
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
    </defs>`,
    `<g filter="url(#condense-blur)">
      <ellipse cx="88" cy="74" rx="74" ry="54" fill="url(#condense-a)"/>
      <ellipse cx="160" cy="132" rx="88" ry="58" fill="url(#condense-b)"/>
      <ellipse cx="176" cy="66" rx="52" ry="34" fill="${colors.accent}" opacity="0.22"/>
      <path d="M52 132c26 12 54 18 84 18 32 0 64-7 96-22-28 21-63 33-104 35-31 1-57-9-76-31Z" fill="${colors.glow}" opacity="0.28"/>
    </g>`,
  );
}

function buildFogCreepSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 1200 260",
    `<defs>
      <linearGradient id="creep" x1="0" y1="0" x2="0" y2="260" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="44%" stop-color="${colors.primary}" stop-opacity="0.66"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="creep-soft" x="-10%" y="-34%" width="120%" height="200%">
        <feGaussianBlur stdDeviation="14"/>
      </filter>
    </defs>`,
    `<g filter="url(#creep-soft)">
      <path d="M0 170c74-30 162-40 263-31 80-26 183-28 308-6 104-26 216-24 335 6 96-14 194-6 294 25v96H0v-90Z" fill="url(#creep)"/>
      <path d="M0 190c151 24 287 32 408 23 145-11 283-31 415-60 144 31 270 62 377 92v15H0v-70Z" fill="${colors.glow}" opacity="0.26"/>
    </g>`,
  );
}

function buildRainStreakSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 32 192",
    `<defs>
      <linearGradient id="rain" x1="16" y1="0" x2="16" y2="192" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="16%" stop-color="${colors.highlight}" stop-opacity="0.85"/>
        <stop offset="62%" stop-color="${colors.primary}" stop-opacity="0.94"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="rain-blur" x="-120%" y="-10%" width="240%" height="120%">
        <feGaussianBlur stdDeviation="1.6"/>
      </filter>
    </defs>`,
    `<g filter="url(#rain-blur)">
      <path d="M14 6C16 2 20 2 22 6c4 15 4 42-3 100-2 18-4 44-4 74-5-20-7-47-8-73C4 48 8 18 14 6Z" fill="url(#rain)"/>
      <path d="M16 16c1-4 5-4 6 0 2 18 0 45-4 83-1 11-2 25-2 38-3-9-5-23-5-38 0-40 1-68 5-83Z" fill="${colors.glow}" opacity="0.28"/>
    </g>`,
  );
}

function buildSnowCrystalSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 96 96",
    `<defs>
      <radialGradient id="snow-core" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="100%" stop-color="${colors.primary}"/>
      </radialGradient>
      <filter id="snow-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="1.4"/>
      </filter>
    </defs>`,
    `<g stroke="${colors.primary}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M48 12v72"/>
      <path d="M16 30l64 36"/>
      <path d="M16 66l64-36"/>
      <path d="M48 12l-7 12m7-12 7 12m-39 6 14 1m-14-1 6 12m43-12-14 1m14-1-6 12m0 36-14-1m14 1-6-12m-43 12 14-1m-14 1 6-12m25 8-7-12m7 12 7-12"/>
    </g>
    <circle cx="48" cy="48" r="12" fill="url(#snow-core)" filter="url(#snow-glow)" opacity="0.92"/>
    <circle cx="48" cy="48" r="6" fill="${colors.glow}" opacity="0.45"/>`,
  );
}

function buildGlassDropSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 96 132",
    `<defs>
      <radialGradient id="drop" cx="36%" cy="28%" r="78%">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0.96"/>
        <stop offset="36%" stop-color="${colors.primary}" stop-opacity="0.94"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0.24"/>
      </radialGradient>
      <filter id="drop-shadow" x="-30%" y="-20%" width="160%" height="170%">
        <feGaussianBlur stdDeviation="2.4"/>
      </filter>
    </defs>`,
    `<g filter="url(#drop-shadow)">
      <path d="M48 8c17 26 30 41 36 58 8 24 0 53-19 65-11 7-25 8-37 3-24-10-35-38-26-66C10 47 27 34 48 8Z" fill="url(#drop)"/>
      <path d="M31 32c7-11 14-17 24-19-8 11-12 21-14 33-11 0-16-5-10-14Z" fill="${colors.glow}" opacity="0.58"/>
      <path d="M62 68c8 14 3 31-10 39-10 6-21 5-31-2 10 4 21 2 29-5 7-6 11-18 12-32Z" fill="${colors.shadow}" opacity="0.26"/>
    </g>`,
  );
}

function buildGlassRivuletSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 72 420",
    `<defs>
      <linearGradient id="rivulet" x1="36" y1="0" x2="36" y2="420" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}" stop-opacity="0"/>
        <stop offset="12%" stop-color="${colors.highlight}" stop-opacity="0.9"/>
        <stop offset="52%" stop-color="${colors.primary}" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="${colors.shadow}" stop-opacity="0"/>
      </linearGradient>
      <filter id="rivulet-blur" x="-80%" y="-10%" width="240%" height="120%">
        <feGaussianBlur stdDeviation="1.9"/>
      </filter>
    </defs>`,
    `<g filter="url(#rivulet-blur)">
      <path d="M35 8c10 23 13 49 7 79-10 52-14 100-10 141 5 46 0 96-13 150 18-41 29-80 31-115 3-48 4-86 13-128 8-37 8-80-2-127-7-8-18-8-26 0Z" fill="url(#rivulet)"/>
      <path d="M33 38c4-8 11-8 13 0 5 28 3 58-4 92-6 31-9 63-8 97-3-16-5-42-4-79 1-44 2-81 3-110Z" fill="${colors.glow}" opacity="0.25"/>
    </g>`,
  );
}

function buildLightningForkSvg(colors: WeatherSpritePalette): string {
  return buildSvgDocument(
    "0 0 220 560",
    `<defs>
      <filter id="lightning-glow" x="-40%" y="-10%" width="180%" height="130%">
        <feGaussianBlur stdDeviation="6"/>
      </filter>
      <linearGradient id="bolt" x1="110" y1="0" x2="110" y2="560" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${colors.highlight}"/>
        <stop offset="50%" stop-color="${colors.accent}"/>
        <stop offset="100%" stop-color="${colors.primary}"/>
      </linearGradient>
    </defs>`,
    `<g filter="url(#lightning-glow)">
      <path d="M106 8 72 160l45-3-54 149 53-9-40 163 92-198-44 8 61-143-49 4 31-123Z" fill="url(#bolt)"/>
      <path d="M86 170 41 252l40-14-18 77 53-108-30 7 22-44-22 0Z" fill="${colors.glow}" opacity="0.56"/>
      <path d="M142 235 108 298l29-12-9 53 43-82-24 6 11-28-16 0Z" fill="${colors.glow}" opacity="0.42"/>
    </g>`,
  );
}

function buildSpriteSvg(kind: WeatherSpriteKind, colors: WeatherSpritePalette): string {
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

function loadSprite(key: string, svg: string): Promise<HTMLImageElement> {
  const existing = pendingSprites.get(key);
  if (existing) return existing;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      readySprites.set(key, image);
      pendingSprites.delete(key);
      const callbacks = pendingReadyCallbacks.get(key);
      pendingReadyCallbacks.delete(key);
      if (callbacks) {
        for (const callback of callbacks) callback();
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

function queueReadyCallback(key: string, onReady: () => void): void {
  const callbacks = pendingReadyCallbacks.get(key);
  if (callbacks) {
    callbacks.add(onReady);
    return;
  }
  pendingReadyCallbacks.set(key, new Set([onReady]));
}

function buildKey(kind: WeatherSpriteKind, colors: WeatherSpritePalette): string {
  return [
    kind,
    colors.primary,
    colors.secondary,
    colors.shadow,
    colors.highlight,
    colors.accent,
    colors.glow,
  ].join("|");
}

export function requestWeatherSprite(
  kind: WeatherSpriteKind,
  colors: WeatherSpritePalette,
  onReady?: () => void,
): HTMLImageElement | null {
  const key = buildKey(kind, colors);
  const ready = readySprites.get(key);
  if (ready) return ready;

  if (onReady) {
    queueReadyCallback(key, onReady);
  }

  if (pendingSprites.has(key)) return null;

  const svg = spriteSvgCache.get(key) ?? buildSpriteSvg(kind, colors);
  spriteSvgCache.set(key, svg);
  loadSprite(key, svg).catch(() => undefined);
  return null;
}
