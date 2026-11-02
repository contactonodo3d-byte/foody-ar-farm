import {describe,it,expect} from 'vitest';
import {capabilityReport} from '../ar/Capabilities';
describe('tracking honesty report',()=>{
 it('does not equate camera access with physical tracking',()=>{const text=capabilityReport({secureContext:true,cameraAvailable:true,spatialStatus:'unavailable',checkedAt:'2026-10-15'});expect(text).toContain('permiso y captura no comprobados');expect(text).toContain('no detecta superficies');expect(text).toContain('Sesión immersive-ar: no disponible');});
 it('does not equate session support with hit testing',()=>{expect(capabilityReport({secureContext:true,cameraAvailable:true,spatialStatus:'available',checkedAt:'2026-10-15'})).toContain('hit-test y controles pendientes');});
});
