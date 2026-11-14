# LUNARA — Junior Astronaut Mission Trainer

An educational space-mission strategy game for iOS and Android. You command an outpost near the
Moon's south pole: build life support, balance oxygen, water, food, power and fuel, respond to
emergencies, and bring your crew through the mission.

Built with Expo SDK 58, React Native 0.88, TypeScript, Expo Router, NativeWind 4, Reanimated,
React Native SVG, Expo Image, Lucide icons and AsyncStorage. No backend; progress is saved on the device.

## Run it

You need Node.js 22.13+ (or 24.3+) and the Expo Go app for SDK 58 on your phone.

```bash
cd lunara
npm install              # installs Expo SDK 58
npm run setup            # installs every runtime package at the exact SDK 58 versions (via `expo install`)
npm run setup:dev        # optional: TypeScript, Jest and types for `npm run typecheck` / `npm test`
cp .env.example .env     # optional: add your own NASA API key
npx expo start -c        # -c clears the cache so NativeWind styles compile
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

Then check the project: `npx expo-doctor@latest`, `npm run typecheck`, `npm test`.

Package versions are deliberately not hard-coded in `package.json`. `npm run setup` uses
`expo install`, which picks the versions that match SDK 58. NativeWind is pinned to the 4.x line with
Tailwind CSS 3, because NativeWind 5 (Tailwind 4) is still a release candidate.

## How to play

1. Plan the mission: difficulty, crew size (2–6) and length (15, 30 or 45 days).
2. Build the Oxygen Generator and Water Recycler early. The habitat only covers part of the crew's oxygen.
3. Watch the sunlight dial and 7-day outlook. Solar output dims through the lunar cycle; batteries carry you.
4. Tap **End day** to run one day of the simulation.
5. Decide on emergencies. The day cannot end until you do.
6. Finish with the crew alive and objectives complete. The report explains every score point.

## Project layout

```
app/                         Expo Router screens
  index.tsx                  Welcome
  how-to-play.tsx, about.tsx
  mission/select.tsx         Mission planning
  mission/(hub)/             In-mission tabs: dashboard, base, emergencies, objectives
  mission/report.tsx         Mission report
  learning/                  Learning Center and topic pages
src/
  game/                      The engine: pure TypeScript, no React
    gameEngine.ts            Actions: endDay, constructBuilding, resolveEmergency, abortMission…
    resourceManager.ts       Consumption, production, power priority
    buildingManager.ts       Construction rules, effects, repairs
    crewManager.ts           Health, morale, losses
    eventManager.ts          Emergency generation and decisions
    objectiveManager.ts      Objective progress
    scoring.ts, report.ts    Transparent 100-point score and mission report
    missions.ts              Mission definitions (Mars is defined but locked)
    config.ts                Every tunable rule in one place
    __tests__/               Engine tests, including full scripted playthroughs
  data/                      Buildings, emergencies, objectives, crew, learning content
  services/                  NASA API client, parsers, AsyncStorage persistence
  state/                     React context that connects the engine to the UI and saves after each change
  components/                UI components
  constants/                 Design tokens (palette shared with tailwind.config.js)
```

## The simulation

Everything in the game is a **simplified educational simulation**. Units (kg, L, kWh) make it read like
real life-support planning, but the numbers are tuned for gameplay and are not NASA engineering
specifications. The screens say so where numbers appear.

Each day: crew consume oxygen (0.84 kg), water (3.8 L) and food (1.8 kg) per person; solar arrays produce
power according to the sunlight cycle; life support gets power before the greenhouse and lab; buildings
produce at their level and condition; crew health and morale respond to shortages, power, radiation and
medical care; construction advances; cargo landers arrive every 10 days if the link to Earth is up; and
from day 3 an emergency may trigger.

The radiation index is a simulated 0–100 game value. It is never presented as a real dose, and it is not
derived from the real NASA space-weather data shown in the Learning Center.

**Scoring (100 points):** days survived 15, crew survival 15, objectives 25, crew wellbeing 15,
emergency decisions 15, resource efficiency 10, science 5. A failed mission is capped at 49 and an aborted
one at 74. Ratings: 90+ Legendary Commander, 75–89 Excellent Mission, 50–74 Mission Survived, below 50
Mission Failed.

Balance, from the scripted playthroughs in the tests: doing nothing fails on every difficulty (about day
28 on Beginner, 18 on Intermediate, 14 on Expert). A sensible build order scores roughly 90+ on Beginner,
80–92 on Intermediate and 70–85 on Expert. Careful emergency choices score about 17 points more than
reckless ones on the same seeds.

## NASA data

- **DONKI** (solar flares, coronal mass ejections, solar energetic particle events, geomagnetic storms over
  the last 30 days) via `https://api.nasa.gov`.
- **NASA Image and Video Library** via `https://images-api.nasa.gov` (no key needed).

Responses are cached on the device (3 hours for space weather, 24 hours for images). If NASA cannot be
reached, the app shows the last saved copy with its date, or an error with a retry button. The game itself
never needs a connection.

The API key comes from `EXPO_PUBLIC_NASA_API_KEY` in `.env`, falling back to NASA's public `DEMO_KEY`,
which allows only a few requests an hour. Get a free key at https://api.nasa.gov. Note that `EXPO_PUBLIC_`
values are embedded in the app bundle; a NASA open-data key is low-risk, but anything truly secret should be
proxied through a backend.

## Verification status

- **Game engine:** strict TypeScript check passes; 39 tests pass, covering setup, construction rules,
  resource accounting, power priority, emergencies, scoring, persistence and full 15/30/45-day playthroughs
  on all difficulties.
- **NASA parsers:** tested against valid, empty and malformed payloads.
- **UI code:** type-checked against hand-written models of the React Native, Expo Router, Reanimated, SVG and
  Lucide APIs used (including React Native's accessibility-role list). This catches wrong props and
  misspelled fields, but it is not the same as the real library types. Run `npm run typecheck` after setup.
- **Not yet verified:** running on a device or simulator. It was built without network access, so the first
  `npx expo start` is the real test.

## Troubleshooting

- **No styling / plain white text:** stop the server and run `npx expo start -c`.
- **Version warnings:** `npx expo install --fix`, then `npx expo-doctor@latest`.
- **"Rate limit" in the Learning Center:** add your own NASA key to `.env` and restart with `-c`.
- **Expo Go says the project is incompatible:** make sure Expo Go shows SDK 58 and `package.json` has `expo ~58.0.0`.

## Adding Mars later

`src/game/missions.ts` already defines a locked `mars` mission. Give it an illumination model, radiation
baseline and resupply interval, set `available: true`, and add any Mars-specific emergencies in
`src/data/emergencies.ts`. The engine reads these per-mission values, so no screen changes are required.

LUNARA is not affiliated with or endorsed by NASA.
