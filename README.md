# Foody AR Farm

Local mobile-first expo game. Source remains on this Mac. No repository was created, no code pushed, and nothing deployed.

## Preview

```sh
cd "/Users/fabrizzio/Documents/ChatGPT/Fabrizzio Website/foody-ar-farm"
npm run dev
```

Local HTTPS:

```sh
HTTPS=1 npm run dev -- --port 5175 --strictPort
```

- Mac: https://localhost:5175/
- iPhone on the same Wi-Fi: https://192.168.100.2:5175/ (the LAN address can change).
- Allow incoming Node connections in macOS Firewall if prompted.
- Virtual mode needs no camera. Camera opens only from the explicit “Activar cámara” button.

The SSL plugin generates a self-signed development certificate. A Safari exception does not guarantee trusted HTTPS or camera availability. If the camera is blocked by certificate trust, create a trusted local certificate with mkcert and configure `server.https` in Vite with its key/cert. Include localhost and the current LAN IP. Install only `rootCA.pem` on the iPhone and enable its profile under Settings > General > About > Certificate Trust Settings. Never transfer `rootCA-key.pem` or the server private key. Remove development trust after testing. mkcert was not installed here. No public tunnel or deployment was created.

## Play

1. Tap “¡A jugar!” for a 60-second round.
2. Select Maíz for chickens, Mix mini for chicks, or Verdecitos for rabbits. These are placeholder products.
3. Tap inside the field. A matching animal approaches, eats, celebrates and awards points. The “Servir en el explorador” button and arrow controls provide a keyboard/tap alternative.
4. Consecutive meals within five seconds increase the combo. Every three additional meals raises the multiplier, up to ×4. Each meal starts at 100 points.
5. Pause whenever needed. Switching away from the page pauses virtual gameplay time. Camera tracks stop when the page is hidden; reopen the camera explicitly on return.
6. Results generate an original 1080 × 1920 PNG. Use native file sharing when available or save the image. Canceling native sharing does not force a download.

Sound is optional, synthesized locally with Web Audio, and enabled only by a user gesture. Reduced motion disables decorative bobbing and shader motion; animal locomotion remains part of the game. The pause button stops gameplay and its timer.

## Milestones

- **M0/M1:** React/TypeScript/Vite/R3F scene; metric square; ground taps and directional controls; permanent four-side outline; debug sliders/presets. Triggered wall has full intensity; remaining walls use 25% context intensity. Corner walls can both be emphasized.
- **M2:** Seven procedural low-poly animals: two chickens, three chicks, two rabbits. Deterministic state-machine movement, pecking, chick following, hopping, separation and barn/edge avoidance. Original procedural models are provisional, with no remote model requests or model licensing dependency. GLB/GLTF asset replacement remains future production polish.
- **M3:** Three configured feeds, food placement with capacity/cooldown, species matching, approach/eat/happy reactions, score/combo/multipliers, 60-second rounds, pause and replay.
- **M4:** Friendly Spanish UI, onboarding, floating hearts, optional synthesized sound, results, original vertical card and Web Share/download fallback. Foody wordmark/colors are provisional pending official assets.
- **M5:** Camera overlay with permission/secure-context handling, track cleanup and fallback. Experimental WebXR immersive-ar session and hit testing behind actual capability detection; no requirement for virtual or camera mode.

## Experience modes and tracking honesty

**Virtual:** no camera, no physical device tracking. Marker and all boundary positions are virtual. Outside gives feedback without an automatic physical-tracking pause.

**Camera overlay:** video background with the same virtual farm. No detected floor, no 6DoF, no metric physical boundary claims. Requests the rear camera preferentially; never requests audio. Stops tracks on mode exit, page hiding, failed playback or component cleanup.

**Spatial, experimental:** shown only if `navigator.xr.isSessionSupported('immersive-ar')` resolves true. Requests `hit-test` and `dom-overlay` so game controls remain available. Missing features, denied permissions and failed sessions return to the virtual experience. A horizontal hit-test surface must be selected before farm placement. The farm's origin is fixed in the session's local reference space; actual non-emulated viewer poses are converted to farm coordinates. Three consecutive valid poses are required before the game runs. Loss of tracking, session visibility, missing placement or a reliably tracked outside position pauses gameplay. A reference-space reset invalidates placement and requires placing the farm again. XR select places the farm, then serves food along the device's forward ray intersecting the farm's ground plane. Exit closes the XR session and restores the virtual camera.

Horizontal hit tests cannot semantically distinguish a floor from a table or prove that a 3 × 3 m space is unobstructed. No persistent anchors, depth occlusion or environmental obstacle scanning are implemented. There is no physical-device accuracy/performance claim. Full immersive WebXR placement/rendering still requires testing on compatible hardware; local automated tests verify capability fallback and the pure tracking gate, not real sensor tracking.

Reference APIs: [Three.js WebXRManager](https://threejs.org/docs/pages/WebXRManager.html), [WebXR hit test](https://immersive-web.github.io/hit-test/), [DOM overlays](https://immersive-web.github.io/dom-overlays/).

## Architecture

- `src/app/App.tsx`: screen orchestration, game controls and mode selection.
- `src/components/FarmScene.tsx`: ground, barn, outline and per-edge gradient shaders.
- `src/components/Animals.tsx`: original procedural animal meshes and state-driven animation; shared sphere geometry.
- `src/components/FoodEffects.tsx`: pooled food and heart meshes.
- `src/components/ShareCard.tsx`: PNG rendering, preview, native share and download.
- `src/engine/GameEngine.ts`: round lifecycle, clock, scoring integration and tracking safety gates.
- `src/engine/AnimalAI.ts`: deterministic animal state machines and movement independent of React/Three.js.
- `src/engine/FeedingSystem.ts`, `ScoreSystem.ts`, `BoundarySystem.ts`: gameplay systems.
- `src/ar/`: interchangeable adapter contract, VirtualAdapter, CameraOverlayAdapter, SpatialAdapter and XR renderer bridge.
- `src/config/BrandConfig.ts`: brand, placeholder products and metric configuration.
- `src/hooks/`: game loop, sound, camera lifecycle and motion preferences.
- `src/styles/main.css`: responsive layout, safe areas, focus states, reduced motion and spatial overlay layout.
- `public/models/`, `public/audio/`, `public/branding/`: locations reserved for production assets.

X/Z bounds: −1.5…+1.5 m, ground Y=0. SAFE >0.6 m; WARNING 0.3…0.6 m; DANGER 0…<0.3 m; OUTSIDE beyond the edge. Warning threshold tolerance is 1e−9. Animal body radii are included in containment.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright uses the Mac's installed Google Chrome at 390 × 844 with touch. Tests include five simulated minutes of animal containment and barn avoidance, deterministic behavior, matching food, single consumption rewards, combo expiry/cap, exact 60-second completion, replay, pause, all boundary sides, PNG dimensions/download, mocked native sharing/cancellation, simulated camera permissions/stream cleanup, unsupported/rejected XR and the pure reliable-tracking pause gate.

Camera stream and native share tests are simulated. No physical iPhone, physical camera or immersive XR hardware test was performed by Codex. The user confirmed an earlier virtual milestone on their iPhone; the new features need another device check.

Mobile accessibility review: named controls, focus rings, keyboard alternatives, pause, status messages, safe-area spacing, reduced-motion behavior and transparent tracking labels. Reference: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

Production build remains dominated by Three.js (about 321 KB gzip for JS). Test real-device frame rate, load time and heat before expo use. Official Foody assets/catalog, optimized GLBs and device validation remain production work.

## Optional local tracking experiment and diagnostics

The camera section now includes a capability report computed on the current device: secure context, camera API and actual `immersive-ar` support query. It requests no media and sends no report anywhere. Copying is an explicit user action. Camera API availability does not mean permission was granted, and an advertised immersive session does not prove hit-test/DOM overlay support.

An optional marker experiment lives under “Prueba técnica opcional con marcador”. Open `/marker.html` on another screen or print its visual marker. Enable camera and choose “Probar AR con marcador”. Original ArUco MIP marker 7 is decoded from camera pixels using js-aruco2 (MIT). POSIT estimates its pose. Three valid detections reveal a miniature; losing the marker hides the miniature and pauses gameplay until reacquired. It uses marker-relative coordinates and approximate camera intrinsics, and never claims calibrated metric boundaries or floor detection. Processing is capped near 12 Hz with a 640-pixel-wide canvas. Camera and detector resources are released on exit. Libraries are loaded lazily only when this experiment starts.

This experiment is **not** the recommended single-QR expo visitor flow: it requires a visible marker. The intended production flow remains QR link → camera permission → markerless surface placement → game. The markerless SDK path now uses the locally installed 8th Wall Distributed Engine Binary after explicit owner license acceptance. No external SDK account, paid service or hosting was activated. The SDK is activated for a physical-device trial; actual markerless tracking quality on Safari remains unverified.

Sources: https://8thwall.org/docs/open-source and https://docs.onirix.com/onirix-sdk/web-ar

New tests cover diagnostic truthfulness and marker loss gates; browser tests feed actual detector code with a synthetic marker video. Physical iPhone/camera tracking remains unverified.

## Markerless Safari SDK installed for device testing

The existing game now has a reviewable XR8 adapter, camera projection bridge, placement controls, tracking-loss pause and lifecycle cleanup. The owner accepted the license and authorized installation. Official `@8thwall/engine-binary@1.0.0` is pinned and copied unmodified to `public/vendor/xr8/`, including all resources/notices. The manifest is enabled. “Probar AR sin marcador” loads the local SDK/SLAM module only on user action. `predev` and `prebuild` synchronize the approved files and write a checksum inventory.

The prepared SDK mode uses responsive/approximate scale. It does not enforce or claim calibrated 3 × 3 m physical boundaries, room scanning or semantic floor detection. Tests include a real local SDK/SLAM initialization with external connections blocked, a real SDK failure with camera blocked, and simulated tracking lifecycle tests. None of these establishes physical iPhone tracking quality. See [SDK-DECISION.md](SDK-DECISION.md) for source changes, license considerations, public API references, remaining device checks and activation steps.

## Colocación manual y publicación

En AR sin marcador, después de colocar la granja, arrastrá con un dedo para trasladar sobre el suelo; pellizcá para escalar y girá dos dedos para rotar. Antes de jugar los gestos están habilitados. Durante una partida, **Ajustar** pausa el juego y habilita la colocación; **Listo** devuelve los toques al alimento. No hay sliders. El menú **Más opciones de colocación**, cerrado por defecto, ofrece controles de teclado/tap alternativos, altura, restablecer y **Volver a colocar**. Los ajustes son por sesión; no establecen escala métrica ni se conservan tras salir.

La cámara ocupa todo el viewport y la selección de comida se reduce a una bandeja inferior. Avisos normales y texto de ayuda permanente se ocultan durante juego con seguimiento estable. El suelo AR tiene opacidad 0.10 y no muestra cuadrícula. La demo virtual conserva los controles de prueba.

Proporciones nominales en coordenadas del juego: área 3 × 3, pared 1.50 de altura, gallina 0.50, pollito 0.14 y conejo 0.40 incluyendo orejas. Los modelos procedurales se normalizan por sus límites geométricos locales y apoyan sus pies en el suelo; no se distorsionan según la escala/giro de su padre AR. Estos tamaños aproximados no representan una raza específica. El tamaño físico absoluto requiere calibración; la escala manual conserva todas las proporciones.

La subpágina de GitHub Pages se compila con `FOODY_BASE_PATH=/lab/foody-ar-game/ npm run build`. El workflow del portfolio ensambla ese resultado en `dist/lab/foody-ar-game/`. SDK, WASM, marcador y enlaces se sirven bajo la misma subruta. Los binarios del SDK se reconstruyen desde la versión fijada de npm y conservan sus avisos y licencia. No se guardan dependencias ni resultados de pruebas en Git.

La calibración física futura deberá tomar al menos dos puntos del suelo separados por una distancia conocida, calcular unidades de seguimiento por metro y verificar repetibilidad y deriva. Cambiar el tamaño a ojo no constituye calibración. No habilitar pausa por límites métricos hasta validar ese recorrido en dispositivos reales.

Un motor de seguimiento independiente es un proyecto separado. No reutilizar el binario ni documentación restringida del proveedor para desarrollar un producto competidor. Evaluar fuentes de investigación públicas y componentes con licencias compatibles; no presentar los controles de colocación como un nuevo SLAM.
