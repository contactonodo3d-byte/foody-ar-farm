import { useEffect, useMemo, useState } from 'react';
import { BrandConfig, shareCaption, shareImageLine } from '../config/BrandConfig';

export interface ResultData { points: number; fed: number; bestCombo: number }
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
export async function createResultCard(result: ResultData): Promise<Blob> {
 const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
 const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('No se pudo crear la imagen.');
 const line = shareImageLine();
 ctx.fillStyle = BrandConfig.colors.sky; ctx.fillRect(0, 0, 1080, 1920);
 circle(ctx, 120, 1760, 520, '#b7d878'); circle(ctx, 980, 1860, 560, '#91be6c');
 ctx.fillStyle = BrandConfig.accent; ctx.fillRect(0, 0, 1080, 28);
 ctx.textAlign = 'center'; ctx.fillStyle = BrandConfig.accent; ctx.font = '900 132px "Avenir Next", sans-serif'; ctx.fillText(BrandConfig.name, 540, 230);
 ctx.fillStyle = BrandConfig.colors.ink; ctx.font = '700 34px "Avenir Next", sans-serif'; ctx.fillText(`AR Farm · ${BrandConfig.social.event}`, 540, 290);
 ctx.fillStyle = BrandConfig.colors.paper; ctx.beginPath(); ctx.roundRect(84, 390, 912, 900, 64); ctx.fill();
 ctx.fillStyle = BrandConfig.colors.ink; ctx.font = '800 56px "Avenir Next", sans-serif'; ctx.fillText('¡Una granja llena', 540, 510); ctx.fillText('de felicidad!', 540, 580);
 ctx.font = '900 200px "Avenir Next", sans-serif'; ctx.fillText(String(result.points), 540, 830);
 ctx.font = '700 36px "Avenir Next", sans-serif'; ctx.fillText('puntos de pura alegría', 540, 900);
 ctx.font = '500 34px "Avenir Next", sans-serif'; ctx.fillText(`${result.fed} ${result.fed === 1 ? 'comida servida' : 'comidas servidas'}`, 540, 1040); ctx.fillText(`Mejor combo: ${result.bestCombo}`, 540, 1095);
 BrandConfig.foods.forEach((food, index) => { circle(ctx, 390 + index * 150, 1185, 36, food.color); ctx.fillStyle = BrandConfig.colors.ink; ctx.font = '700 22px "Avenir Next", sans-serif'; ctx.fillText(food.bagLabel, 390 + index * 150, 1248); });
 circle(ctx, 380, 1545, 100, '#fff5df'); circle(ctx, 390, 1430, 68, '#fff5df'); circle(ctx, 368, 1368, 20, '#e45e4d');
 circle(ctx, 414, 1418, 9, '#274e43'); ctx.fillStyle = '#eaa23d'; ctx.beginPath(); ctx.moveTo(448, 1430); ctx.lineTo(492, 1448); ctx.lineTo(448, 1464); ctx.fill();
 circle(ctx, 580, 1605, 58, '#ffe078'); circle(ctx, 592, 1546, 40, '#ffe078'); circle(ctx, 606, 1538, 6, '#274e43');
 circle(ctx, 760, 1545, 90, '#e1c9ac'); circle(ctx, 760, 1450, 60, '#e1c9ac');
 ctx.fillStyle = '#e1c9ac'; ctx.beginPath(); ctx.ellipse(730, 1345, 20, 90, -.15, 0, Math.PI * 2); ctx.ellipse(790, 1345, 20, 90, .15, 0, Math.PI * 2); ctx.fill();
 circle(ctx, 740, 1446, 7, '#274e43'); circle(ctx, 782, 1446, 7, '#274e43'); circle(ctx, 761, 1470, 9, '#d6938b');
 ctx.fillStyle = BrandConfig.accent; ctx.fillRect(120, 1688, 840, 112);
 ctx.fillStyle = '#fffdf2'; ctx.font = '800 40px "Avenir Next", sans-serif'; ctx.fillText(line, 540, 1758);
 ctx.fillStyle = BrandConfig.colors.ink; ctx.font = '700 32px "Avenir Next", sans-serif'; ctx.fillText('Yo ya cuidé mi granja.', 540, 1860);
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
