import { useEffect, useState } from 'react';
import { BrandConfig, gamePublicUrl, studioWhatsAppUrl } from '../config/BrandConfig';

export function StandPoster() {
 const url = gamePublicUrl();
 const [qr, setQr] = useState('');
 useEffect(() => {
  let alive = true;
  void import('qrcode').then(mod => mod.toDataURL(url, { width: 720, margin: 1, color: { dark: '#274e43', light: '#fffdf2' } })).then(data => { if (alive) setQr(data); }).catch(() => { if (alive) setQr(''); });
  return () => { alive = false; };
 }, [url]);
 return <main className="stand">
  <p className="chapter">Expo Vet 2026 · Asunción</p>
  <img className="stand-logo" src={`${import.meta.env.BASE_URL}${BrandConfig.logo}`} alt="" width="72" height="72"/>
  <h1>{BrandConfig.name} AR Farm</h1>
  <p>Escaneá y jugá en tu teléfono. Un minuto, tres alimentos y una granja para compartir.</p>
  {qr ? <img className="stand-qr" src={qr} width="280" height="280" alt={`Código QR para abrir ${url}`}/> : <p>Preparando el código…</p>}
  <p className="stand-url">{url}</p>
  <a className="primary stand-open" href={import.meta.env.BASE_URL}>Abrir el juego en esta pantalla</a>
  <p className="studio-credit">{BrandConfig.studio.credit} <a href={BrandConfig.studio.url}>fabrizzioruiz.com</a> · <a href={studioWhatsAppUrl()}>WhatsApp</a></p>
  <button type="button" onClick={() => window.print()}>Imprimir cartel</button>
 </main>;
}
