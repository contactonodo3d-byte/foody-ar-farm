export const SPREAD_BONUS = 200;

export class ScoreSystem {
 points = 0;
 fed = 0;
 combo = 0;
 bestCombo = 0;
 multiplier = 1;
 rings = 0;
 bonus = 0;
 spreadAwarded = false;
 fedByAnimal: Record<string, number> = {};
 private lastFeed = -Infinity;

 reset() {
  this.points = 0;
  this.fed = 0;
  this.combo = 0;
  this.bestCombo = 0;
  this.multiplier = 1;
  this.rings = 0;
  this.bonus = 0;
  this.spreadAwarded = false;
  this.fedByAnimal = {};
  this.lastFeed = -Infinity;
 }

 update(time: number) {
  if (time - this.lastFeed > 5) {
   this.combo = 0;
   this.multiplier = 1;
  }
 }

 award(time: number, animalId?: string) {
  this.combo = time - this.lastFeed <= 5 ? this.combo + 1 : 1;
  this.multiplier = Math.min(4, 1 + Math.floor((this.combo - 1) / 3));
  const points = 100 * this.multiplier;
  this.points += points;
  this.fed++;
  this.bestCombo = Math.max(this.bestCombo, this.combo);
  this.lastFeed = time;
  if (animalId) this.fedByAnimal[animalId] = (this.fedByAnimal[animalId] ?? 0) + 1;
  return points;
 }

 /** Points from a diana. Feeding score is unchanged. */
 grant(points: number) {
  const amount = Math.round(points);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  this.points += amount;
  this.rings += amount;
  return amount;
 }

 /** One bonus after every animal has eaten at least once this round. */
 collectBonus(animalIds: string[], amount = SPREAD_BONUS) {
  if (this.spreadAwarded || amount <= 0) return 0;
  if (!animalIds.length || animalIds.some(id => (this.fedByAnimal[id] ?? 0) < 1)) return 0;
  this.spreadAwarded = true;
  this.bonus += amount;
  this.points += amount;
  return amount;
 }
}
