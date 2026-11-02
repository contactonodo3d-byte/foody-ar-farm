export class ScoreSystem {
 points=0; fed=0; combo=0; bestCombo=0; multiplier=1;
 private lastFeed=-Infinity;
 reset(){this.points=0;this.fed=0;this.combo=0;this.bestCombo=0;this.multiplier=1;this.lastFeed=-Infinity;}
 update(time:number){if(time-this.lastFeed>5){this.combo=0;this.multiplier=1;}}
 award(time:number){
  this.combo=time-this.lastFeed<=5?this.combo+1:1;
  this.multiplier=Math.min(4,1+Math.floor((this.combo-1)/3));
  const points=100*this.multiplier;this.points+=points;this.fed++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.lastFeed=time;
  return points;
 }
}
