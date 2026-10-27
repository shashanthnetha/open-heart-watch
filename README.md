# Watch atelier, Revision V

Independent exterior and mechanism study. Not an official Rolex experience or a reconstruction of a Rolex calibre.

## Open and run

The separate `watch-revision-v-offline.html` (rename the delivered `.html.txt` to `.html`) is a self-contained convenience version. Download it and open it in a current WebGL-capable browser. Mobile chat attachment previews may not execute HTML; download and open the file in a browser instead.

For the source project, use Node 22.12+ (Node 24 for test scripts):

```
npm ci
npm run dev
npm run build
npm run preview
```

The production output is `build/`. Serve it over HTTP. `npm run offline` creates `dist/index.html`, embedding the model and runtime without a CDN. The original model remains unchanged in `assets/datejust-original.glb`.

## Experience

Scroll forward or backward through nine chapters. The scene follows the current page position, without a delayed animation queue. Default Precise mode compresses large mouse-wheel impulses as they arrive. A hard wheel event moves a limited amount immediately; it does not create motion to be played after you stop. Small input remains responsive. Native mode removes wheel compression. Touch keeps browser scrolling, including the device's normal momentum.

Use the bottom scrub bar for direct positioning. Index and arrow keys move to useful chapter poses with a short, interruptible transition. Wheel or touch input cancels it. Home/End reach the endpoints. Play is a separate optional automatic tour; scrolling cancels it.

The mechanism now has a stable fully framed overview instead of automatic zooming into a crop. Energy train, Balance and Chronograph are deliberate focus choices. The back view temporarily removes the obstructing bracelet; returning to the front restores it. Closeups, mobile framing and the return rotation have been revised.

The exterior's three hands show device-local wall time, with fractional seconds, minutes and hours. Day/date replace the supplied fixed meshes. They update after midnight and when returning to the tab. This is a continuous visual sweep, not a claim of a particular mechanical calibre's exact beat pattern.

Chapter 04 visibly lifts the upper bridges and mounted stopwatch deck, then moves the barrel cover aside. Reverse scrolling reseats them. Chapter 03 is the internal study: Overview, Energy train, Balance and Chronograph views, layer spacing, hide upper bridges, pause/resume, and quarter/normal/four-times viewing speed. The separate stopwatch starts, stops and resets only while stopped. Pausing the study does not pause wall-clock time.

Select, Isolate and Deep work on individual registered objects. Deep enables drag orbit and wheel zoom; Escape returns to the page. Parts provides search. Configuration has three dial, hardware and bracelet colours, either paired or independent.

## Geometry and limits

The uploaded exterior is Yevhen Artamonov's "Rolex Datejust", used under CC BY 4.0. The supplied dial reads Day-Date despite the file's Datejust title. It contains 37 exterior objects and a closed back, not movement geometry. The 61 additional objects are an independently built manual-wind concept train, fixed balance and auxiliary chronograph. All 98 are searchable. Exploded and part-field presentations combine these two sources with explicit labelling; this does not establish mechanical fit.

The source bracelet groups several links into rigid sections. Separation is supported; individual-link articulation is not claimed. Colour variants are artistic, not purchasable manufacturer configurations. The movement is kinematic, not a torque, collision or service simulation.

## Source map

- `js/main.js`: scene, camera, input, chapter navigation and UI
- `js/datejust.js`: source-model adaptation and live calendar
- `js/watch.js`: assembly, reversible explosion, field layout and materials
- `js/clock.js`: device-local time and fractional-hand functions
- `js/motion.js`: direct scroll mapping reference (the old capped controller is removed)
- `js/timeline.js`: chapter states and camera interpolation
- `js/movement.js`, `js/chrono.js`, `js/gears.js`: conceptual internals
- `js/layout.js`: shared geometry anchors, independent of animation modules
- `js/materials.js`: finishes and studio environment
- `css/style.css`: desktop/phone interface
- `tools/`: build, capture and QA scripts
- `qa/`: dated regression results
- `previews/`: inspected renders

`concept-watch.js`, `shell.js`, `dial.js` and `bracelet.js` retain procedural foundations from the previous concept. They are not the current imported exterior. The previous delivered revision is preserved separately, not overwritten.

See SOURCES.md and QA-STATUS.md for attribution and tested scope. No site has been published and no account or paid asset was created for this delivery.
