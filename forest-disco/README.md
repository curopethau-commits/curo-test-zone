# Bethan and Bunny's Super Duper 8th Birthday Forest Disco

Branched from Will's Intergalactic Tarranium (`../WILLS_TERRANIUM`) on 17 Oct 2026. Same setup:

- `index.html`: the big screen. Night forest, mirror ball, sweeping lights, light-up dance floor. Every drawing hops to the beat (120 BPM), and anything sticking out of its body (arms, legs, head, ears, tail) swings in a dance: the page finds the body as an ellipse and rotates each bit of ink around where it leaves it. The QR code ("Invite your friends!") opens the drawing page.
- `draw.html`: the phone page. Pick a name, draw, hold your finger on the drawing, flick it up onto the dance floor.
- `terra.js`: shared settings and the connection to the Firebase Realtime Database.

## The illustration
Save it next to `index.html` as `forest.png` (or `forest.jpg` / `forest.webp`). It's scaled to cover the screen (16:9 landscape, e.g. 3840×2160, is ideal) and darkened slightly so the disco lights show. Keep the top ~15% fairly calm: the title sits there. Until the file exists, a drawn stand-in forest is shown.

## Database (one-off)
Drawings live under `forest_disco` in the same Firebase database as Will's, so the two parties never mix. The current rules only allow `creatures`, so add a matching block in Firebase console → Realtime Database → Rules, next to the existing `creatures` one:

```json
"forest_disco": {
  ".read": true,
  "$id": {
    ".write": "!data.exists() || !newData.exists()"
  }
}
```

(Copy any extra validation from the `creatures` block too.) Until then the display shows "not connected: add the forest_disco rule".

## Edit guest list
Will's GOD MODE, renamed: the EDIT GUEST LIST button, password `BethanRulez` (set in `terra.js`). Clear all, or tap a dancer to remove it. Rude doodles are stopped on the phone and never shown on the big screen.

## Test without the database
Set `TERRA_DB = ''` in `terra.js`: the display and drawing page then talk to each other in the same browser only.
