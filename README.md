# Story Weather

Story Weather is a Lumiverse extension that adds a draggable weather HUD and animated scene ambience to chat.

It is built for story-driven use, not live forecast data. The model controls the scene by emitting a hidden `<weather-state>` tag, and the extension turns that into HUD updates, layered effects, and per-chat weather state.

<img width="276" height="222" alt="image" src="https://github.com/user-attachments/assets/8bc8c93a-df39-4b86-9d20-596630c92a4a" />
<img width="280" height="217" alt="image" src="https://github.com/user-attachments/assets/691d98a0-4f1b-4d4c-85ae-9664215d4d65" />


## Features

- Compact draggable HUD with dynamic styling based on story time, palette, and weather
- Animated ambience that can render behind the chat, in front of the chat, or both
- Story sync mode driven by hidden inline weather tags
- Manual lock mode for overriding the current scene per chat
- Per-chat persistence for story state and manual overrides
- Fallback weather-tag generation if the model finishes without emitting one
- Prompt macros for reliable prompt-side weather tag generation

## Prompt Setup

To make the main model emit weather tags consistently, add this to the active character or preset system prompt:

```text
{{weather_tracker}}
```

Optional reference macros:

```text
{{weather_state}}
{{weather_format}}
```

Supported aliases:

- `{{weather_tracker}}`
- `{{story_weather_tracker}}`
- `{{story_weather}}`
- `{{weather_state}}`
- `{{story_weather_state}}`
- `{{weather_format}}`
- `{{story_weather_format}}`

## Hidden Tag Contract

The assistant should keep all visible prose natural, then end the message with exactly one hidden weather tag:

```html
<weather-state location="Tengu City" date="2026-03-24" time="9:42 PM" condition="rain" summary="Cold spring rain" temperature="61F" intensity="0.65" wind="breezy" layer="both" palette="storm"></weather-state>
```

Supported conditions:

- `clear`
- `cloudy`
- `rain`
- `storm`
- `snow`
- `fog`

Supported layers:

- `back`
- `front`
- `both`

Supported palettes:

- `dawn`
- `day`
- `dusk`
- `night`
- `storm`
- `mist`
- `snow`

## How It Works

1. The prompt includes `{{weather_tracker}}`.
2. The model writes its normal reply, then appends one final `<weather-state>` tag.
3. The frontend hides the tag from visible chat.
4. The HUD updates only after the assistant message is complete, so streaming does not mutate the scene mid-reply.
5. The backend stores the normalized weather state per chat.
6. If the model does not emit a weather tag, the backend can generate and append one after generation ends.

## Story Sync vs Manual Lock

### Story Sync

- Uses the AI-provided location, date, time, weather, and scene metadata
- Story time stays fixed to whatever the AI last set
- The scene only changes when the AI sends a new weather tag

### Manual Lock

- Lets you override the current scene for the active chat
- Keeps the override saved until you resume story sync
- The HUD clock can display live real time while manual mode is active

## Installation

1. Copy the repository URL:

```text
https://github.com/Archkr/Lumiverse-StoryWeather
```

2. In Lumiverse:

- Open the `Extensions` tab
- Click `Install`
- Paste the repo URL into the repo URL field
- Click `Install`

3. Enable the extension and grant its requested permissions.

4. Open the extension settings panel and confirm the HUD/settings panel loaded correctly.

## Setup

To use story-driven weather generation:

1. Open the character or preset system prompt you want to use.
2. Add this line somewhere in the prompt:

```text
{{weather_tracker}}
```

3. Save the prompt.
4. Start or continue a chat.
5. The assistant should write its visible reply first, then append the hidden `<weather-state>` tag at the end of the message.

If you do not want the model driving the scene, you can skip prompt setup and use `Manual lock` from the HUD or settings panel instead.

## Project Layout

```text
src/
  backend.ts      Backend state, macros, fallback generation, chat persistence
  frontend.ts     HUD, message interception, FX mounting, scene updates
  shared.ts       Normalization, defaults, parsing helpers
  presets.ts      Quick scene presets
  types.ts        Shared types
  ui/
    settings.ts   Extension settings panel
    styles.ts     HUD, settings, and FX styles

dist/
  backend.js
  frontend.js
```

## Notes

- This extension does not use a live weather API.
- The weather is intentionally narrative/state driven.
- The HUD is meant to stay fairly small and readable over chat.
- The settings page exposes both quick prompt guidance and full manual scene controls.
