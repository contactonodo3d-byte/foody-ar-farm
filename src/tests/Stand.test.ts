import { describe, expect, it } from 'vitest';
import { PUBLIC_GAME_URL_DEFAULT, shareCaption, shareImageLine } from '../config/BrandConfig';
import { readToday, recordToday } from '../engine/Leaderboard';

describe('stand copy', () => {
 it('tags Foody and the parent company from config', () => {
  expect(shareImageLine()).toBe('@foody · #FoodyARFarm · #ExpoVet2026');
  const caption = shareCaption({ points: 400, fed: 3 });
  expect(caption).toContain('@foody');
  expect(caption).toContain('@Agroalimentos_SA');
  expect(caption).toContain('#FoodyARFarm');
  expect(caption).toContain('#ExpoVet2026');
  expect(caption).toContain('https://fabrizzioruiz.com/lab/foody-ar-game/');
  expect(PUBLIC_GAME_URL_DEFAULT).toBe('https://fabrizzioruiz.com/lab/foody-ar-game/');
 });
 it('keeps only today on the local leaderboard', () => {
  const memory = new Map<string, string>();
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } };
  const today = new Date('2026-11-03T15:00:00-03:00');
  const scores = recordToday({ points: 200, fed: 2, combo: 2, at: 1 }, storage, today);
  recordToday({ points: 500, fed: 4, combo: 4, at: 2 }, storage, today);
  expect(readToday(storage, today).map(entry => entry.points)).toEqual([500, 200]);
  expect(scores[0].points).toBe(200);
  expect(readToday(storage, new Date('2026-11-04T10:00:00-03:00'))).toEqual([]);
 });
});
