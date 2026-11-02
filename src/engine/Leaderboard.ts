export interface ScoreEntry { points: number; fed: number; combo: number; at: number }

const KEY = 'foody-ar-farm-today';

function dayStamp(now = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

interface Store { getItem(key: string): string | null; setItem(key: string, value: string): void }

export function readToday(storage: Store = localStorage, now = new Date()): ScoreEntry[] {
  try {
    const raw = JSON.parse(storage.getItem(KEY) || '{}') as { day?: string; scores?: ScoreEntry[] };
    if (raw.day !== dayStamp(now) || !Array.isArray(raw.scores)) return [];
    return raw.scores.filter(entry => Number.isFinite(entry.points)).slice(0, 5);
  } catch {
    return [];
  }
}

export function recordToday(entry: ScoreEntry, storage: Store = localStorage, now = new Date()) {
  const scores = [...readToday(storage, now), entry].sort((a, b) => b.points - a.points || b.combo - a.combo).slice(0, 5);
  try { storage.setItem(KEY, JSON.stringify({ day: dayStamp(now), scores })); } catch { /* Private mode can reject storage. The round still ends. */ }
  return scores;
}
