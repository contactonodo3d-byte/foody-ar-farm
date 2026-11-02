import type {ExperienceAdapter} from './ExperienceAdapter';
export class MarkerAdapter implements ExperienceAdapter {
 readonly mode='marker';readonly reliablePhysicalTracking=false;
 visible=false;private consecutive=0;lastSeen=-Infinity;
 update(found:boolean,now:number){
  if(!found){this.consecutive=0;this.visible=false;return;}
  this.lastSeen=now;this.consecutive++;this.visible=this.consecutive>=3;
 }
 expire(now:number){if(now-this.lastSeen>250)this.update(false,now);}
 getPosition(){return {x:0,z:0};}
 getPauseReason(){return this.visible?null:'Apuntá al marcador Foody completo para continuar.';}
 dispose(){this.update(false,0);}
}
