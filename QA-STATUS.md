# Revision V verification, 26 October 2026

This pass rebuilds the concept mechanism and chapter 04, preserves Revision IV's direct scrolling, and checks the resulting experience. It is not a claim of exact watch mechanics or measured physical-device smoothness. No site was published.

## New in Revision V

- Enclosed barrel and removable lid, thinner brass train wheels with separate pinions, fixed 2.5 Hz balance, small bearing jewels, slotted screws and upper bridges. The auxiliary stopwatch sits on its own mounted upper deck.
- Satin nickel faces and distinct polished sides replace broad striped mechanism faces. Wheel motion follows linked ratios; the escape wheel advances in prescribed half-tooth releases.
- Chapter 04 lifts the train bridge and stopwatch support deck, then moves the barrel cover aside. All three assemblies separate by more than 10 model units. Reversing exactly reseats them.
- Deep dragging now captures the pointer so crossing over the inspector does not interrupt orbiting.
- Wider exterior separation, bracelet and back framing. Sequential concept-to-exterior exit fade prevents the two faces being superimposed.

## Checked in this pass

- Production build and self-contained offline export succeeded. The actual delivered bytes were copied back from `.html.txt` to `.html` and opened with `file://`.
- On that offline file: all 98 registered parts load; Study and Index open/close; keyboard chapter navigation works; the same mixed sequence continues to stopwatch Start, running Reset lockout, Stop and Reset. No runtime exceptions were recorded.
- The mixed sequence's first failed stopwatch test used a button rectangle cached before the chapter toolbar finished relocating. The corrected helper recomputes both the rectangle and the actual hit target each frame. The original mixed sequence then passed, including on the final offline file. No timer patch was needed for that test issue.
- Actual wheel events: large impulse compression, immediate stop and reversal, optional native mode, endpoints, chapter-navigation cancellation, focus and pause. The long combined run stopped before its remaining tests, which were run separately.
- All focus choices, pause, bridge visibility and stopwatch controls; search for Escape wheel, Deep mouse orbit, wheel-page suppression and Escape. 320px touch scrolling, selected-part orbit and restoration of page panning passed.
- 901 finite, reversible timeline states plus balance frequency, prescribed escape stepping and stopwatch state checks passed.
- Actual pixels inspected for the mechanism overview, all focus views, chapter-04 reveal, chapters 1-9, all four surface studies and selected mechanism entry/exit states. Revised chapter 2, bracelet, back and exit states were recaptured and inspected after their fixes. Phone checks include 390px overview/reveal/focus and 320px overview/reveal.

## Inherited and unverified scope

Revision IV's 27 configuration-handler combinations and earlier live clock/calendar checks are inherited, not claimed as rerun in full. Historical results are separated under dated folders; they describe older geometry or test states. The prior delivered source remains separate.

Software rendering is slow. Screenshots and emulated touch do not prove high-frame-rate performance on a physical phone, Safari or the user's laptop. Browser touch momentum may continue after release; the site adds no queued playhead. Wheel feel depends on hardware cadence. Native mode and direct scrub remain available.

The internals are a separate illustrative manual-wind mechanism with auxiliary stopwatch, not recovered Rolex geometry or an identified calibre. It is prescribed kinematics, not torque, tooth-contact, collision, service or manufacturing simulation. The source bracelet remains rigid multi-link sections. All 37 source exterior objects and the original licensed GLB are preserved.
