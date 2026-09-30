# VarshaVani – Hyperlocal Monsoon Onset & Break Prediction (SIH PS 26086)

Frontend-only, demo-ready prototype. It gives farmers and extension officers a 1–4 week **probabilistic** outlook for monsoon onset, dry spells (breaks) and heavy rain at block level, and turns it into crop-specific advice in English, हिंदी and मराठी.

> **Prototype: simulated data.** There is no ML model, backend or external API. All forecasts come from a deterministic mock generator. The advisory rules engine is real, working logic.

## Quick start

Requires Node.js 20.9+ (tested on Node 22).

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start   # production build (enables the PWA service worker)
npm run lint
```

Map tiles come from OpenStreetMap (no key). Everything else runs offline.

## Demo credentials

| Role | Email | Password |
| --- | --- | --- |
| Farmer | `farmer@demo.com` | `demo123` |
| Extension officer | `officer@demo.com` | `demo123` |

The login page also has **Continue as Demo Farmer** and **Continue as Demo Officer** buttons. Auth is client-side only (localStorage + a `mm_role` cookie).

## 3-minute demo script

1. **Landing (`/`)**: "Early rain is not always the monsoon." Show the animated false-onset story (without vs. with warning).
2. **Demo Farmer (`/farmer`)**: Latur block, soybean, not sown. The big card says **"Wait, delay sowing"** even though 42 mm fell last week (false onset).
3. **Outlook (`/farmer/outlook`)**: week 1 onset high, weeks 2–3 dry-spell high, weeks 3–4 marked lower confidence. The sowing-window strip points to 3–9 Jul. Then open **Map** and press **Play weeks** to watch the dry spell spread across Marathwada.
4. **Why this advice?** (`/farmer/advisories`): expand it to see MJO phase 6, weak El Niño and neutral IOD, in plain language.
5. Switch the header to **म** and press **Listen** (Marathi voice; falls back to a Hindi voice or a message if unavailable).
6. **WhatsApp (`/gateway`)**: the same advice as a WhatsApp and SMS message. Tap **2 मराठी** or **? Why**.
7. **Officer (`/officer`)**: KPIs, priority blocks (Latur cluster), ranking table, insurance & irrigation flags, CSV export. Then **Campaigns**: "Select priority blocks" → Marathi → WhatsApp → **Send** and watch queued → sent → delivered → read.
8. **Historical replay (`/replay`)**: 2014, Latur: warning 14 days before the dry spell, illustrative crop-loss avoided.
9. **Methodology (`/methodology`)**: architecture, validation plan, honest limitations, prototype status table.

Tip: **More → Reset demo data** restores the default farmer profile.

## Features

- **Farmer app** (mobile-first, bottom tabs): Safe-to-sow card (green / yellow / red), 4-week outlook with plain words + % + confidence, sowing-window optimiser, advisory feed with "Why this advice?", voice (Web Speech API), My crops (crop, stage, sowing date, area; advice adapts), risk map, alerts centre with simulated push notifications, thumbs up/down feedback, Simple SMS view, offline PWA.
- **Risk map**: Leaflet (client-only via `next/dynamic`, `ssr: false`), onset / dry-spell / heavy-rain layers, week selector with play animation, search by block, district or village, legend, details panel with crop advice. A `<select>` offers a keyboard alternative to clicking cells.
- **Officer dashboard**: KPIs, heatmap, priority list, sortable/filterable block ranking, PMFBY-style insurance and irrigation flags, CSV export, analytics charts (advisories by type, feedback trend, language mix), campaign composer with simulated delivery.
- **Climate drivers**: ENSO, IOD and MJO cards with mini charts, MJO phase wheel with trajectory, global → regional → local flow.
- **What-if simulator**: ENSO / IOD / MJO sliders drive a documented formula (`lib/whatIf.ts`); probabilities and advice update live. Labelled "Illustrative simulation".
- **Historical replay**: 2014 and 2009 style hindcasts with rainfall, warning line, dry-spell band, timeline and the engine's advice for the sowing week.
- **SMS / WhatsApp gateway simulator**: phone mockups, interactive reply menu, delivery log.

## Architecture

```
app/                    routes (App Router)
  page.tsx              landing
  login/                mock auth
  farmer/               farmer app (layout = RequireRole + FarmerShell)
  officer/              officer dashboard + campaign composer
  map/ drivers/ simulator/ replay/ gateway/ methodology/   shared pages
  manifest.ts           PWA manifest
components/
  ui/                   design system: Button, Field, Card, Table, Segmented, RiskBadge, ProbabilityBar, StatCard, States…
  layout/               SiteHeader, FarmerShell, OfficerShell, RequireRole, OfflineBanner
  advisory/             SafeToSowCard, AdvisoryCard, WeekTimeline, SowingWindowStrip, ListenButton, FeedbackWidget
  map/                  BlockMap (dynamic), BlockMapLeaflet, RiskMapExplorer, BlockDetailsPanel, MapLegend
  gateway/              PhoneMockup, WhatsAppChat, SmsThread, MessageLogTable
  officer/ drivers/ methodology/ landing/ farmer/
lib/
  forecastService.ts    ONLY data access point (async). "Replace with real model API"
  advisoryEngine.ts     pure rules engine: getAdvisory(), sowingWindows(), explainDrivers()
  whatIf.ts             transparent driver-sensitivity formula
  priority.ts           officer priority score + insurance / irrigation flags
  messageFormat.ts      SMS / WhatsApp text builders
  riskColors.ts         single risk colour system
  ui.ts                 shared class tokens (surfaces, type scale, controls, tables)
  chartTheme.ts         shared Recharts palette, axis, grid and tooltip config
  i18n/                 en.ts (source keys), hi.ts, mr.ts (type-checked complete), helpers
  store.ts              Zustand (persisted): auth, language, block, crops, feedback, messages
  mockAuth.ts seededRandom.ts alerts.ts csv.ts ids.ts
data/                   blocks, forecasts (generator), drivers, crops, history, community
hooks/                  useT, useAsync, useFarmerData, useSpeech, useOnlineStatus, useCommunityData
types/                  shared domain types (the API contract)
public/sw.js            service worker (app shell + offline)
```

### Swapping in the real model

UI components never import `data/` forecasts directly for display; they call `lib/forecastService.ts` (`getForecast`, `getAllForecasts`, `getDrivers`, `getReplay`, `sendCampaign`, …). Replace those function bodies with `fetch()` calls that return the shapes in `types/index.ts`. No UI change is needed.

## Mock data schema (summary)

- **Block**: `id, name, district, zone (Konkan | Western Maharashtra | Marathwada | Vidarbha), lat, lng, geometry (approx. hexagon ring [lng,lat][]), villages[], irrigatedPct, farmers, kharifAreaHa, majorCrops[]`. 40 talukas.
- **BlockForecast**: `blockId, issuedOn, recentRainMm, falseOnsetRisk, weeks[4]` with `WeekForecast { week, startDate, endDate, onset, breakProb, heavyRain (0–100), expectedRainMm, confidence, confidenceLevel }`.
  - Generated by inverse-distance blending of 8 sub-regional anchor profiles + a smooth seeded noise field, so neighbours are similar and Konkan onsets earlier than Marathwada. Confidence declines with lead (≈82 → 40). Seeded with FNV-1a + Mulberry32, never `Math.random`.
  - Hero storyline: the south-Marathwada cluster (Latur, Nilanga, Udgir, Dharashiv, Ambajogai…) has onset ~75–80% in week 1, then dry-spell ~75–80% in weeks 2–3.
- **ClimateDrivers**: ENSO (+0.7, weak El Niño, 12-month series), IOD (+0.25, neutral), MJO (phase 6, amplitude ~1.4, 30-day trajectory + 10-day outlook in RMM space).
- **Crop**: duration, drought tolerance, break threshold, sowing rain (mm), alternatives. Stages: not sown → sowing → germination → vegetative → flowering → grain filling.
- **HistoryReplay**: daily rain (61 days), hindcast weekly break probabilities, events, lead days, loss-avoided estimate.
- **Community**: demo farmer profiles, message log, 84 feedback entries.

## Advisory engine rules (lib/advisoryEngine.ts)

`getAdvisory(crop, stage, forecast, week, opts?) → { action, severity, decision?, reasons[], drivers[], alternatives[], irrigationTip, alsoDo[], confidence }`

| Rule | Condition | Advice |
| --- | --- | --- |
| SOW-01-DELAY | not sown / sowing and dry-spell chance (this or next week) > crop threshold (≈60%) | Delay sowing 7–10 days (10–14 if ≥ 75%); drought-tolerant alternatives in Marathwada |
| SOW-02-SAFE | not sown, onset > 70% and dry spell < 30% | Safe to sow (after ~75–100 mm cumulative rain) |
| SOW-03-CAUTION | otherwise before sowing | Sow with caution, staggered sowing |
| GRO-01-DRY | germination / vegetative and dry spell > threshold | Conserve moisture, life-saving irrigation |
| CRT-01-IRRIGATE | flowering / grain filling and dry spell > 50% | Protective irrigation, foliar spray |
| HVY-01-HEAVY | heavy rain > 60% | Drainage, delay fertiliser / spraying, harvest protection |
| HVY-02-WATCH | heavy rain 40–60% | Keep drains open (informational) |
| RTN-01 | no risk rule fires | Stage-specific routine care |

The highest-severity match is the primary action; other matches appear under "Also do". All text is i18n keys + params, rendered in the chosen language.

## What is mocked

| Area | Prototype | Later |
| --- | --- | --- |
| Forecasts, drivers, history | Deterministic mock generators | Hybrid model API, NOAA/BoM/IMD ingest |
| Block boundaries | Approximate hexagons | Official block/panchayat GeoJSON |
| Auth | Client-side demo accounts | OTP / server sessions |
| SMS / WhatsApp / push | Simulated gateway and statuses | DLT SMS gateway, WhatsApp Business API, web push |
| Voice | Browser speechSynthesis | IVR / recorded audio |
| Feedback, analytics | localStorage + seed data | Backend DB |

## Accessibility & i18n notes

- Risk is always shown with colour **and** icon **and** text; probabilities are shown as words (Low / Medium / High) plus %.
- Semantic landmarks, skip link, labelled controls, keyboard-operable segmented controls and table sort buttons, visible focus rings, `prefers-reduced-motion` respected.
- Farmer-facing screens and all advisory text are fully translated (en / hi / mr). Officer, simulator, replay, gateway and methodology pages are English-first, while the advisories they show follow the selected language.
- Full WCAG conformance needs manual testing with assistive technologies; this prototype has not been audited.

## Security notes

The mock auth and route guards are client-side only and must not be used in production. There are no network endpoints. CSV export neutralises spreadsheet formula injection.
