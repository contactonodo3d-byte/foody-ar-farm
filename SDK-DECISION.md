# Markerless Safari AR integration — reviewable local preparation

Reviewed 15 October 2026 (America/Asuncion).

## Decision and activation status

The gameplay integration targets the 8th Wall Distributed Engine Binary through its public XR8 camera-pipeline API. The owner explicitly accepted the license in this conversation and authorized download and local evaluation. Official package `@8thwall/engine-binary@1.0.0` is now installed, synchronized byte-for-byte to `public/vendor/xr8/`, and activated. No third-party account, payment, hosting or deployment was created.

The official website states that the tools and distributed engine binary are free, with no paid tier or required login. Its world-tracking engine remains closed source under the XR Engine License Agreement, not the MIT license used by other components.

The owner reviewed and accepted the linked license before installation. Its opening says that downloading or using the software constitutes assent. Section 1.2 restricts certain paid products/services whose value derives entirely or substantially from the engine, and competitive products. Section 1.3 requires attribution, notices and the license text or link. A branded game and a future reusable paid activation platform need to be evaluated against their actual business models; this preparation does not declare universal commercial suitability.

Sources:
- https://8thwall.org/
- https://8thwall.org/docs/open-source
- https://github.com/8thwall/engine/blob/main/LICENSE

## Prepared source

- `XR8Types.ts`: minimal public API contracts; no vendor implementation.
- `XR8Loader.ts`: same-origin installation probe and explicit-user-action script loading. No CDN fallback. The manifest must be enabled and declare owner acceptance, and the JavaScript file must exist before activation is allowed.
- `WorldTrackingAdapter.ts`: three consecutive valid NORMAL frames; finite pose, quaternion and projection validation; stale-frame loss; explicit placement; tracking-loss gameplay gate. Owns copies of incoming data.
- `XR8Session.ts`: world-tracking configuration, rear-camera pipeline, estimated-point selection, placement, camera error handling, timeout/cancellation, module/observer cleanup and re-placement on orientation changes.
- `WorldTrackingScene.tsx`: copies the SDK's complete projection matrix and pose into the existing R3F camera. Restores the virtual camera on exit. Game source and UI remain in the browser.
- `useWorldTracking.ts`: mode lifecycle and camera stop on page hiding.
- `App.tsx` and styles: full-screen AR control layout, point indicator, explicit placement button, exit, and a disabled/pending card while the runtime is absent.

The camera feed and R3F content use two layered canvases in this first integration. Both have the same full-screen dimensions and SDK-provided intrinsics. Alignment, performance, thermal behavior, tracking quality and cleanup require validation on a physical iPhone with the actual runtime. Tests use a fake runtime and do not establish those properties.

## Tracking and scale limits

Configuration intentionally uses `scale: 'responsive'`. No reliable metric scale has been established or tested, so `reliablePhysicalTracking` remains false for this adapter. It pauses for tracking loss and missing placement; it never enables physical OUTSIDE boundary pausing. The existing virtual boundary remains a game-space boundary.

A hit test selects an estimated point (including FEATURE_POINT), and the game constructs a horizontal play plane through it. This is not semantic floor detection, persistent AR anchors, room meshing, physical obstacle detection or depth occlusion. Those capabilities are not claimed. The placement screen explicitly states approximate scale and uncalibrated physical boundaries.

A later metric phase must integrate documented absolute-scale readiness and invalidate placement after rescaling/relocalization before the 3 × 3 m physical boundary is used.

API references:
- https://8thwall.org/docs/api/engine/xrcontroller/configure
- https://8thwall.org/docs/api/engine/xrcontroller/pipelinemodule
- https://8thwall.org/docs/api/engine/xrcontroller/hittest
- https://8thwall.org/docs/api/engine/xrcontroller/updatecameraprojectionmatrix
- https://8thwall.org/docs/api/engine/xr8/run

## Installed runtime and reproducibility

The short download link currently leads to the official GitHub repository rather than directly to an archive. Installation therefore uses the official npm package documented by that repository, pinned exactly at version 1.0.0 in package.json/package-lock.json.

`scripts/sync-xr8.mjs` copies all 13 vendor distribution files without modification and records SHA-256 hashes in `public/vendor/xr8/installation.json`. The package LICENSE is also retained. `predev` and `prebuild` run this synchronization automatically. `xr8-installation.json` records the owner's explicit acceptance and approved version; synchronization rejects a different package version. Public manifest flags now reflect actual acceptance and installation.

The loader adds `data-preload-chunks="slam"`, calls the documented `loadChunk('slam')` and waits for WASM initialization before configuring the pipeline. All SDK/chunk resources load from the same origin; there is no SDK CDN fallback. The base engine and SLAM JS files are about 1 MB and 5.3 MB uncompressed; the full distribution is about 30 MB including optional unused features/resources. The vendor files remain separate from the default game bundle and load only on explicit markerless-AR start. Original attribution/license headers remain in place, with an app HTML notice and footer link to the license.

## Verification and next physical-device test

The real vendor runtime and SLAM module initialized successfully in local Chrome with external requests blocked and zero getUserMedia calls. A second real-runtime test blocked camera access and verified safe recovery to the virtual game. Synthetic-SDK tests cover placement, tracking loss/recovery, orientation reset and exit. These checks do not validate actual 6DoF tracking, camera/image alignment or floor placement on an iPhone.

Open the same HTTPS demo on iPhone Safari, choose “Probar AR sin marcador”, allow requested permissions, slowly scan a textured well-lit area, and choose “Colocar granja aquí” when available. Test walking around, feeding, combos/timer, tracking loss/recovery, orientation changes, background/return and repeated exit/restart. Camera and motion may require trusted HTTPS rather than a self-signed exception. No deployment or public tunnel was created.

Responsive scale remains approximate. Calibrated physical 3 × 3 m boundaries, room mapping and obstacle collisions remain unimplemented and are not claimed.
