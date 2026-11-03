/**
 * Public path the built game is served from.
 * Unset → the portfolio lab URL. Empty or "/" → domain root (Vercel/local).
 * Keep the trailing slash Vite requires.
 */
export function foodyBasePath(env = process.env.FOODY_BASE_PATH) {
  if (env === undefined) return '/lab/foody-ar-game/';
  const trimmed = env.trim();
  if (trimmed === '' || trimmed === '/') return '/';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}
