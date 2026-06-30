# Analysis Engine Layer

A set of **pure, dependency-free** TypeScript modules that power Tummy Trust's
intelligence. They know nothing about React, so they run equally well inside a
component, a hook, a web worker, or an overnight batch job on the Linux box.

Import everything from one place:

```ts
import {
  analyzeTriggers,
  analyzeTrends,
  recommendMeals,
  summarizeInsights,
  buildDoctorReport,
  computeNudges,
  checkFood,
  shareReport,
} from '@/lib/engines';
```

## Modules

| Module | What it does | Key exports |
|---|---|---|
| `triggerAnalysis` | Correlates foods with symptom severity; finds triggers, safe foods, portion & time-of-day patterns | `analyzeTriggers`, `symptomScore` |
| `symptomTrends` | Time-series of discomfort: daily series, 7-day rolling avg, streaks, week-over-week | `analyzeTrends` |
| `mealRecommender` | Ranks what's safe to eat now (personal tolerance beats generic), drops triggers | `recommendMeals`, `safePicks` |
| `insightSummary` | Turns the trigger report into short EN/Urdu advice cards | `summarizeInsights`, `digestLine` |
| `reportExport` | Doctor-ready Markdown summary + raw CSV | `buildDoctorReport`, `buildMealCsv` |
| `reminderEngine` | Decides when to nudge: post-meal check-ins, daily log reminders, streaks | `computeNudges`, `loggingStreak` |
| `aiFoodCheck` | Classifies any food (safe/caution/avoid) via local Ollama, static fallback | `checkFood`, `checkFoods` |
| `exportActions` | Browser download / native share / clipboard for reports | `downloadCsv`, `shareReport` |

## How they fit together

```
        meal_logs + symptom_logs
                 |
     +-----------+-----------+------------------+
     v           v           v                  v
triggerAnalysis  symptomTrends  reminderEngine   (aiFoodCheck: any food)
     |           |                                  |
     v           v                                  v
insightSummary   |                            FoodChecker UI
     |           |
     +-----+-----+
           v
     reportExport  --(markdown/csv)-->  exportActions  --> download / share
           ^
           |
     mealRecommender (what to eat now)
```

## Wiring into the UI (suggested)

- **FoodChecker page** - when a typed food isn't in the DB, call the
  `useAiFoodCheck()` hook (`src/hooks/use-ai-food-check.ts`) to show a live
  verdict instead of "not in database".
- **Insights page** - feed meals into `analyzeTriggers()` + `analyzeTrends()`,
  render `summarizeInsights()` cards and a recharts line of
  `trends.series[].rolling7`.
- **Dashboard** - show `safePicks()` as "safe to eat now", and surface the top
  `computeNudges()` item.
- **Profile / Settings** - a "Share report with doctor" button that calls
  `buildDoctorReport()` then `shareReport()`.

## Configuration

The only module with config is `aiFoodCheck` (see `.env.example`):

```
VITE_AI_ENDPOINT="http://127.0.0.1:11434/api/chat"  # local Ollama
VITE_AI_MODEL="qwen2.5:32b"
VITE_AI_DRY_RUN="false"                              # true = static fallback only
```

## Testing

A zero-dependency smoke harness validates every engine against synthetic data:

```bash
npx tsx src/lib/__tests__/engines.smoke.ts
```

It exits non-zero on failure, so it can gate CI.
