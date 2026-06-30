/**
 * AI Food Checker
 * --------------------------------------------------------------------------
 * Classifies any food as safe / caution / avoid for an IBS user, with a short
 * FODMAP note. Routes through a local LLM by default (self-hosted Ollama), so
 * inference is free, private and works offline. Falls back gracefully to the
 * static food_reference list when the model is unreachable or DRY_RUN is on.
 *
 * Configure via Vite env vars (all optional, sane defaults):
 *   VITE_AI_ENDPOINT   default "http://127.0.0.1:11434/api/chat"  (Ollama)
 *   VITE_AI_MODEL      default "qwen2.5:32b"
 *   VITE_AI_DRY_RUN    "true" to skip the model and use the fallback only
 */
import type { FoodStatus } from '@/types';

export interface FoodVerdict {
  food: string;
  status: FoodStatus;
  fodmap_note: string;
  confidence: number; // 0..1
  source: 'ai' | 'reference' | 'heuristic';
}

const ENDPOINT =
  (import.meta as any).env?.VITE_AI_ENDPOINT ?? 'http://127.0.0.1:11434/api/chat';
const MODEL = (import.meta as any).env?.VITE_AI_MODEL ?? 'qwen2.5:32b';
const DRY_RUN = String((import.meta as any).env?.VITE_AI_DRY_RUN ?? '') === 'true';

/** Minimal offline knowledge so the app is useful even with no model/network. */
const KNOWN: Record<string, { status: FoodStatus; note: string }> = {
  rice: { status: 'safe', note: 'Low FODMAP, easy to digest' },
  chicken: { status: 'safe', note: 'Plain grilled chicken is well-tolerated' },
  egg: { status: 'safe', note: 'Excellent protein, generally safe' },
  banana: { status: 'safe', note: 'Ripe bananas are low FODMAP' },
  oats: { status: 'safe', note: 'Gentle on the stomach when plain' },
  potato: { status: 'safe', note: 'Plain potatoes are well-tolerated' },
  carrot: { status: 'safe', note: 'Cooked carrots are easily digested' },
  avocado: { status: 'caution', note: 'Small portions (1/8) are low FODMAP' },
  apple: { status: 'caution', note: 'High in fructose and sorbitol' },
  milk: { status: 'caution', note: 'Contains lactose, try lactose-free' },
  honey: { status: 'caution', note: 'High in fructose, use sparingly' },
  beans: { status: 'caution', note: 'High in GOS, soak before cooking' },
  garlic: { status: 'avoid', note: 'High in fructans, common trigger' },
  onion: { status: 'avoid', note: 'High in fructans, may cause symptoms' },
  wheat: { status: 'avoid', note: 'Contains fructans, try gluten-free' },
};

function fallback(food: string): FoodVerdict {
  const key = food.trim().toLowerCase();
  // exact, then substring match against the known map
  const hit =
    KNOWN[key] ??
    Object.entries(KNOWN).find(([k]) => key.includes(k) || k.includes(key))?.[1];
  if (hit) {
    return { food, status: hit.status, fodmap_note: hit.note, confidence: 0.55, source: 'reference' };
  }
  return {
    food,
    status: 'caution',
    fodmap_note: 'Unknown food. Log a small portion first and watch your symptoms.',
    confidence: 0.2,
    source: 'heuristic',
  };
}

const SYSTEM_PROMPT =
  'You are a registered dietitian specialising in IBS and the low-FODMAP diet. ' +
  'For the given food, decide if it is generally "safe", "caution", or "avoid" for ' +
  'someone with IBS, and give one short FODMAP-focused note (max 15 words). ' +
  'Respond with STRICT JSON only: {"status":"safe|caution|avoid","fodmap_note":"...","confidence":0..1}. ' +
  'No prose, no markdown.';

function parseVerdict(food: string, raw: string): FoodVerdict | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const j = JSON.parse(match[0]);
    const status = String(j.status).toLowerCase();
    if (!['safe', 'caution', 'avoid'].includes(status)) return null;
    return {
      food,
      status: status as FoodStatus,
      fodmap_note: String(j.fodmap_note ?? '').slice(0, 140),
      confidence: Math.max(0, Math.min(1, Number(j.confidence) || 0.7)),
      source: 'ai',
    };
  } catch {
    return null;
  }
}

/**
 * Check a single food. Never throws: on any failure it returns a safe fallback
 * verdict so the UI always has something to render.
 */
export async function checkFood(food: string, signal?: AbortSignal): Promise<FoodVerdict> {
  const name = food.trim();
  if (!name) return fallback('');
  if (DRY_RUN) return fallback(name);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        format: 'json',
        options: { temperature: 0.2 },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Food: ${name}` },
        ],
      }),
    });
    if (!res.ok) return fallback(name);
    const data = await res.json();
    // Ollama /api/chat -> { message: { content } }; OpenAI-style -> choices[0].message.content
    const content: string =
      data?.message?.content ?? data?.choices?.[0]?.message?.content ?? '';
    return parseVerdict(name, content) ?? fallback(name);
  } catch {
    return fallback(name);
  }
}

/** Batch helper (sequential to stay light on a single local GPU box). */
export async function checkFoods(foods: string[]): Promise<FoodVerdict[]> {
  const out: FoodVerdict[] = [];
  for (const f of foods) out.push(await checkFood(f));
  return out;
}
