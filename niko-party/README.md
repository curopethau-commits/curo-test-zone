# Niko's Birthday Forest Disco (WIP)

A copy of Bethan's Forest Disco (itself branched from Will's Intergalactic Tarranium) for Niko's grown-up birthday, made 17 Oct 2026. Same forest, mirror ball, dance floor and Happy Birthday remix.

- `index.html`: the big screen (landscape). Guests scan the QR and draw a dancer.
- `draw.html`: the phone page.
- `terra.js`: settings and the Firebase connection.
- `music.js`: the soundtrack.

## Differences from Bethan's
- **Aubergines are back**: a rude doodle still reaches the dance floor, but as an aubergine (name tag stays). In EDIT GUEST LIST you can also tap any dancer and choose "🍆 Make it an aubergine" or "Restore drawing".
- EDIT GUEST LIST password: `NikoRulez` (in `terra.js`).
- Its own list in the database, `niko_forest_disco`, so it never mixes with Will's or Bethan's.

## Database (one-off)
In Firebase console → Realtime Database → Rules, add next to the `forest_disco` block:

```json
"niko_forest_disco": {
  ".read": true,
  "$id": {
    ".write": "!data.exists() || !newData.exists()"
  }
}
```

(Copy the name-length validation from the `creatures` block too.) Until then the big screen shows "not connected".

## Illustration
Drop `forest.png` next to `index.html` (same as Bethan's); until then the drawn stand-in forest shows.
