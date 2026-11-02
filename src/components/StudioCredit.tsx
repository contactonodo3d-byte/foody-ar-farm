import { BrandConfig, studioWhatsAppUrl } from '../config/BrandConfig';

export function StudioCredit() {
 return <p className="studio-credit">{BrandConfig.studio.credit}{' '}
  <a href={BrandConfig.studio.url}>fabrizzioruiz.com</a>
  {' · '}
  <a href={studioWhatsAppUrl()}>WhatsApp</a>
 </p>;
}
