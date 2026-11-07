# CHAOS: The Battle of Wizards (WIP)

A family remake of Julian Gollop's 1985 ZX Spectrum game. 2 to 8 wizards, online or on one device, with computer wizards and a private room chat. Opens in landscape.

Play: https://curopethau-commits.github.io/curo-test-zone/chaos/

## Files
- `index.html`: screens and styles (title, lobby, game).
- `game.js`: the rules, board drawing, computer wizards, lobby and chat.
- `sprites.js`: every creature as a 16x16 text grid. **Redraw here.**
- `sfx.js`: Spectrum-style beeper sounds made in the browser.
- `net.js`: room sync through the Firebase database the party apps use.

## How a turn works
1. Pick a spell. Creatures can be cast for real (chance shown) or as an illusion (always works, but Disbelieve makes it vanish).
2. Tap a flashing square to cast it.
3. Move: tap your wizard or a creature. Dots = where it can go, red = attack, pink = shoot.
4. END TURN.

Undead can only be hurt by undead or a wizard with a magic knife/sword. A creature next to an enemy may be stuck (engaged). Killing a wizard makes all their creatures vanish. Last wizard standing wins.

## Redraw the sprites
Either edit the grids in `sprites.js` (`#` = ink, `.` = empty), or drop a PNG into `chaos/sprites/` named after the sprite (`goblin.png`, `gdragon.png`, `wizard.png`…). Transparent background, square. A PNG twice as wide as it is tall is two animation frames. `wizard.png` is tinted to each player's colour.

## Sound samples
Put files in `chaos/sfx/` (e.g. `cast.mp3`, `die.mp3`) and list them in `SFX_FILES` at the top of `sfx.js`. Anything not listed uses the built-in beeps.

## Database (one-off, needed for online rooms)
In Firebase console → Realtime Database → Rules, add next to the existing blocks:

```json
"chaos_rooms": {
  "$room": {
    ".read": true,
    ".write": true
  }
}
```

There is no read rule on `chaos_rooms` itself, so nobody can list the rooms; you need the 5-letter code. Until the rule is added, the title screen says online rooms need setup. "Play on this device" works without it.

## Chat
Only people in the room see it. Messages vanish after 5 minutes and blur when the app is in the background. A web page can't stop screenshots completely.

## Test without the database
Add `?local` to the address: rooms then stay inside this browser (tabs share them), nothing goes online.

## Not done yet
- Mounts (riding horses, pegasus etc.), Magic Fire, Gooey Blob, Magic Wood/Castles, Turmoil.
- Line of sight for ranged attacks and spells.
- Skipping a player who has left an online game.
