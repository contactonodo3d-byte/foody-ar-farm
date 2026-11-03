import type { Species } from '../engine/AnimalAI';

export interface FoodProduct {
  id: string;
  name: string;
  animalLabel: string;
  species: Species;
  color: string;
  accent: string;
  icon: string;
  /** Path under public/. Replace the file, or point this at a sponsor logo. */
  iconSrc: string;
  bagLabel: string;
}

/**
 * One file for the stand. Swap colors, copy, logo and feed art here.
 * `logo` is the only wordmark (public/branding/foody-logo.png). `colors`
 * are copied onto CSS variables by applyBrandTheme.
 * Handles were confirmed by the owner for Expo Vet 2026 — double-check
 * @foody and @Agroalimentos_SA on Instagram before the stand opens.
 */
export const BrandConfig = {
  name: 'Foody',
  title: 'Tu pequeña granja',
  accent: '#5c6c40',
  logo: 'branding/foody-logo.png',
  colors: {
    ink: '#24301a',
    olive: '#5c6c40',
    oliveDeep: '#3e4c2c',
    paper: '#fbf5dc',
    sage: '#eeeac6',
    glow: '#e8c868',
    sky: '#f7f1df',
    field: '#c5d37a',
    muted: '#5d6b48',
    danger: '#8c3d24',
    dangerBg: '#f6d7c8',
    warningBg: '#f3e3a4',
    black: '#000000',
    white: '#ffffff',
    accent: '#5c6c40',
  },
  foods: [
    { id: 'grain', name: 'Maíz', animalLabel: 'Gallinas', species: 'chicken', color: '#f4bd47', accent: '#e07a2f', icon: '🌽', iconSrc: 'branding/feed-maiz.svg', bagLabel: 'Maíz' },
    { id: 'starter', name: 'Mix mini', animalLabel: 'Pollitos', species: 'chick', color: '#efce71', accent: '#e2a63a', icon: '🌾', iconSrc: 'branding/feed-mix.svg', bagLabel: 'Mix mini' },
    { id: 'greens', name: 'Verdecitos', animalLabel: 'Conejos', species: 'rabbit', color: '#75ab5b', accent: '#3f8f4e', icon: '🥬', iconSrc: 'branding/feed-verdes.svg', bagLabel: 'Verdecitos' },
  ] satisfies FoodProduct[],
  social: {
    instagram: '@foody',
    facebook: '@foody',
    tiktok: '@foody',
    parent: '@Agroalimentos_SA',
    hashtags: ['#FoodyARFarm', '#ExpoVet2026'],
    event: 'Expo Vet 2026',
    storyHint: 'Etiquetá a @foody en tu historia',
  },
  studio: {
    name: 'Fabrizzio Ruiz',
    url: 'https://fabrizzioruiz.com',
    email: 'hello@fabrizzioruiz.com',
    whatsapp: '595972780989',
    credit: 'Experiencia AR creada por Fabrizzio Ruiz — ¿Querés una para tu marca?',
    whatsappText: 'Hola Fabrizzio, vi Foody AR Farm en Expo Vet y quiero una experiencia AR para mi marca.',
  },
};

export const PUBLIC_GAME_URL_DEFAULT = 'https://fabrizzioruiz.com/lab/foody-ar-game/';

/** Copies brand tokens onto :root so CSS can use var(--ink) and friends. */
export function applyBrandTheme(target: HTMLElement | null = typeof document === 'undefined' ? null : document.documentElement) {
  if (!target) return;
  for (const [key, value] of Object.entries(BrandConfig.colors)) target.style.setProperty(`--${key}`, value);
}

/** Public play URL for the stand QR. Override at build time with VITE_PUBLIC_URL. */
export function gamePublicUrl() {
  const configured = import.meta.env.VITE_PUBLIC_URL?.trim();
  const url = configured || PUBLIC_GAME_URL_DEFAULT;
  return url.endsWith('/') ? url : `${url}/`;
}

export function shareImageLine() {
  const { instagram, hashtags } = BrandConfig.social;
  return `${instagram} · ${hashtags.join(' · ')}`;
}

export function shareCaption(result: { points: number; fed: number }) {
  const social = BrandConfig.social;
  const meals = `${result.fed} ${result.fed === 1 ? 'comida' : 'comidas'}`;
  return [
    `¡Jugué ${BrandConfig.name} AR Farm en ${social.event}! ${result.points} puntos y ${meals}.`,
    gamePublicUrl(),
    `Etiquetá a ${social.instagram}`,
    social.parent,
    social.hashtags.join(' '),
  ].join('\n');
}

export function studioWhatsAppUrl() {
  return `https://wa.me/${BrandConfig.studio.whatsapp}?text=${encodeURIComponent(BrandConfig.studio.whatsappText)}`;
}

export const FarmConfig = { halfSize: 1.5, wallHeight: 1.5, warningDistance: 0.6, dangerDistance: 0.3, duration: 60 };

// Nominal adult/chick reference heights, not breed-specific measurements. Rabbit includes ears.
export const AnimalDimensions = { chicken: { height: .50, radius: .36 }, chick: { height: .14, radius: .12 }, rabbit: { height: .40, radius: .22 } } satisfies Record<Species, { height: number; radius: number }>;
