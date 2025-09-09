# Technologies and Setup: Car Parking Game

## Technologies Used
- **Frontend:** HTML5 for structure, CSS3 for styling (including flexbox, gradients, media queries for responsiveness, and glassmorphism effects).
- **JavaScript:** ES6+ (classes, arrow functions, async image loading) for all logic; no transpilation needed.
- **Rendering:** HTML5 Canvas 2D context for game rendering, transformations (translate, rotate), and drawing (rects, strokes, images).
- **Assets:** SVG (Scalable Vector Graphics) for visual elements (car, road, obstacles, parking spot, exit) to ensure scalability and crisp rendering.
- **Audio:** Web Audio API for procedural sound generation (oscillators, gain nodes for beeps, crashes, success tones) - no external audio files.
- **Input Handling:** DOM events (keydown/keyup for keyboard, touchstart/touchend for mobile, mousedown/mouseup for testing).

## Development Setup
- **Environment:** Standard web development setup - open `index.html` directly in a modern browser (Chrome, Firefox, Safari, Edge) for instant play; no server required.
- **Editor:** VS Code recommended, with extensions for HTML/CSS/JS linting and live server for development.
- **Build Process:** None - vanilla code, no bundlers (e.g., Webpack), transpilers, or package managers. Scripts loaded via <script> tags in specific order to resolve dependencies.
- **Testing:** Manual testing across devices (desktop/mobile) and browsers; use browser dev tools for console logging, performance profiling, and canvas debugging.
- **Deployment:** Static hosting (e.g., GitHub Pages, Netlify) - upload all files (index.html, css/, js/, assets/) to a web server or CDN.

## Technical Constraints
- **Client-Side Only:** No backend or server-side logic; everything runs in the browser, limiting features like multiplayer or persistent storage (localStorage could be added).
- **Browser Compatibility:** Relies on modern APIs (Canvas, Web Audio, touch events); may need polyfills for older browsers (e.g., IE11 not supported).
- **Performance:** Designed for 60fps on mid-range devices; canvas size fixed at 800x600 but responsive via CSS; collision checks optimized to boundaries only.
- **File Size:** Lightweight - no large assets or libraries; SVGs keep visuals scalable without raster images.
- **Mobile Limitations:** Touch controls simulated via buttons; no gesture support (e.g., swipe for steering) to keep it simple.

## Dependencies
- **External:** None - fully self-contained, no npm packages, CDNs, or third-party libraries to ensure easy setup and portability.
- **Internal:** JS modules loaded sequentially (game.js depends on physics.js, etc.); no import/export as it's vanilla script tags.
- **Browser APIs:** Relies on standard web APIs (DOM, Canvas, AudioContext, requestAnimationFrame, navigator.userAgent for device detection).

## Tool Usage Patterns
- **Game Loop:** `requestAnimationFrame` for smooth animation, with delta-time calculations for frame-rate independence.
- **Event Handling:** Direct DOM event listeners for inputs and UI (e.g., level select change, restart button click); preventDefault on touch/keyboard to avoid scrolling/zoom.
- **Image Loading:** Asynchronous `new Image()` with `src` assignment; check `complete` before drawing, fallback to canvas primitives.
- **Physics Updates:** Fixed timestep fallback (1/60s) if deltaTime invalid; exponential decay for friction. SAT (Separating Axis Theorem) implementation for collision detection: project() for shape projections, getAxes() for obstacle axes, axesOverlap() for overlap checks, checkSATCollision() for full detection using car corners from Car.getCorners(). Collision response sets velocity=0 without MTV-based pushAway.
- **State Management:** String-based FSM in `ParkingGame` for transitions; timeouts for delays (e.g., parked to exiting).
- **Debugging:** Console.log for success events; no formal logging framework.
- **Extension Points:** Add new levels by extending `Level` class switch cases; new features via composition in `ParkingGame` (e.g., add Timer class).
- **Script Loading Dependency Order:** Scripts loaded in specific order via <script> tags in index.html: game.js first (core orchestrator), then physics.js (depends on game), controls.js, levels.js to ensure dependencies resolve without timing issues.

## Development Workflow Notes
- **User Testing:** User already has the game open in browser and just needs to refresh to see changes. Do not run the game for them.

This setup ensures the game is quick to develop, test, and deploy while maintaining high performance and broad compatibility.