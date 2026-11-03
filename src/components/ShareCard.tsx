import { useEffect, useMemo, useState } from 'react';
import { BrandConfig, shareCaption, shareImageLine } from '../config/BrandConfig';

export interface ResultData { points: number; fed: number; bestCombo: number }
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
async function loadLogo() {
 try {
  const image = new Image();
  image.src = `${import.meta.env.BASE_URL}${BrandConfig.logo}`;
  await image.decode();
  return image;
 } catch { return null; }
}
export async function createResultCard(result: ResultData): Promise<Blob> {
 const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
 const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('No se pudo crear la imagen.');
 const colors = BrandConfig.colors;
 const line = shareImageLine();
 const logo = await loadLogo();
 ctx.fillStyle = colors.paper; ctx.fillRect(0, 0, 1080, 1920);
 circle(ctx, 160, 1680, 420, colors.sage); circle(ctx, 940, 1760, 480, colors.glow);
 ctx.fillStyle = colors.olive; ctx.fillRect(0, 0, 1080, 18);
 ctx.textAlign = 'center';
 if (logo) {
  const width = 760; const height = width * (logo.height / logo.width);
  ctx.drawImage(logo, (1080 - width) / 2, 90, width, height);
 } else {
  ctx.fillStyle = colors.black; ctx.fillRect(150, 110, 780, 220);
  ctx.fillStyle = colors.white; ctx.font = '700 92px "Times New Roman", serif'; ctx.fillText(BrandConfig.name.toUpperCase(), 540, 250);
 }
 const titleY = logo ? 90 + 760 * (logo.height / logo.width) + 70 : 420;
 ctx.fillStyle = colors.ink; ctx.font = '700 32px "Avenir Next", sans-serif'; ctx.fillText(`AR Farm · ${BrandConfig.social.event}`, 540, titleY);
 ctx.fillStyle = colors.sage; ctx.beginPath(); ctx.roundRect(84, titleY + 40, 912, 860, 64); ctx.fill();
 ctx.fillStyle = colors.olive; ctx.font = '800 54px "Avenir Next", sans-serif'; ctx.fillText('¡Una granja llena', 540, titleY + 150); ctx.fillText('de felicidad!', 540, titleY + 220);
 ctx.fillStyle = colors.ink; ctx.font = '900 188px "Avenir Next", sans-serif'; ctx.fillText(String(result.points), 540, titleY + 460);
 ctx.font = '700 34px "Avenir Next", sans-serif'; ctx.fillText('puntos', 540, titleY + 520);
 ctx.font = '500 32px "Avenir Next", sans-serif'; ctx.fillText(`${result.fed} ${result.fed === 1 ? 'comida servida' : 'comidas servidas'}`, 540, titleY + 620); ctx.fillText(`Mejor combo: ${result.bestCombo}`, 540, titleY + 674);
 BrandConfig.foods.forEach((food, index) => { circle(ctx, 390 + index * 150, titleY + 760, 34, food.color); ctx.fillStyle = colors.ink; ctx.font = '700 22px "Avenir Next", sans-serif'; ctx.fillText(food.bagLabel, 390 + index * 150, titleY + 820); });
 ctx.fillStyle = colors.black; ctx.fillRect(120, 1688, 840, 112);
 ctx.fillStyle = colors.paper; ctx.font = '800 36px "Avenir Next", sans-serif'; ctx.fillText(line, 540, 1756);
 ctx.fillStyle = colors.ink; ctx.font = '700 30px "Avenir Next", sans-serif'; ctx.fillText('Yo ya cuidé mi granja.', 540, 1860);
 return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo generar el PNG.')), 'image/png'));
}
export function ShareCard({ result }: { result: ResultData }) {
 const caption = useMemo(() => shareCaption(result), [result.points, result.fed, result.bestCombo]);
 const [asset, setAsset] = useState<{ blob: Blob; url: string; native: boolean } | null>(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
 useEffect(() => {
  let active = true, url = ''; setAsset(null); setMessage('');
  void createResultCard(result).then(blob => {
   if (!active) return; url = URL.createObjectURL(blob); const file = new File([blob], 'mi-granja-foody.png', { type: 'image/png' });
   let native = false; try { native = !!navigator.canShare?.({ files: [file] }); } catch { /* Download remains available. */ }
   setAsset({ blob, url, native });
  }).catch(() => { if (active) setMessage('No se pudo crear la tarjeta. Volvé a intentarlo al terminar otra partida.'); });
  return () => { active = false; if (url) URL.revokeObjectURL(url); };
 }, [result.points, result.fed, result.bestCombo]);
 const share = async () => {
  if (!asset) return; setBusy(true); setMessage('');
  const file = new File([asset.blob], 'mi-granja-foody.png', { type: 'image/png' });
  const data: ShareData = { title: 'Mi granja Foody', text: caption, files: [file] };
  try {
   let payload = data;
   try { if (navigator.canShare && !navigator.canShare(data)) payload = { title: data.title, files: [file] }; } catch { payload = { title: data.title, files: [file] }; }
   await navigator.share(payload);
   setMessage(`Tarjeta compartida. ${BrandConfig.social.storyHint}`);
  } catch (error) {
   if (!(error instanceof Error && error.name === 'AbortError')) setMessage('No se pudo compartir. Usá “Guardar imagen” o “Copiar texto”.');
  } finally { setBusy(false); }
 };
 const copy = async () => {
  try { await navigator.clipboard.writeText(caption); setMessage('Texto copiado. Pegalo en tu historia.'); }
  catch { setMessage('Seleccioná el texto de abajo y copialo.'); }
 };
 return <div className="share-card">
  <p className="story-hint">{BrandConfig.social.storyHint}</p>
  {asset ? <><img src={asset.url} width="1080" height="1920" alt={`Tarjeta Foody con ${result.points} puntos, ${result.fed} comidas, mejor combo de ${result.bestCombo} y ${shareImageLine()}.`}/>
  {asset.native && <button className="primary" disabled={busy} onClick={() => void share()}>{busy ? 'Abriendo opciones…' : 'Compartir resultado'}</button>}
  <button type="button" onClick={() => void copy()}>Copiar texto</button>
  <a className="download" href={asset.url} download="mi-granja-foody.png">Guardar imagen</a>
  <textarea className="caption-fallback" readOnly value={caption} aria-label="Texto para la historia" onFocus={event => event.currentTarget.select()}/>
  <small>Formato Stories · 9:16 · {shareImageLine()}</small></> : <p>Preparando tu tarjeta…</p>}
  {message && <p role="status">{message}</p>}
 </div>;
}
