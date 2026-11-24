# Wonderpaw Kingdom

A small walkable 3D environment: a fog-bound storybook theme park whose caged
"animals" are people in costume. Built with three.js; every model, texture and
sound is generated in code.

## Run

No build step. Serve the folder and open it:

```bash
python3 -m http.server 5173 --bind 127.0.0.1
```

Then visit http://localhost:5173 and click to enter.

## Controls

- **W A S D** walk, **Shift** hurry
- **Mouse** look (click to capture the pointer), or the **arrow keys**
- **F** flashlight, **Esc** release the pointer
- `?res=600` in the URL raises the internal render height (default 450)

## Layout

- `index.html` page, overlay, import map
- `vendor/three.module.js` three.js 0.170.0
- `src/main.js` scene assembly, loop, the fifth cage
- `src/player.js` first-person controls and collision
- `src/atmosphere.js` fog, torch, drifting ash
- `src/post.js` low-resolution render, grain, dither, vignette
- `src/audio.js` drone, wind, music box, static, tannoy (Web Audio)
- `src/textures.js`, `src/signs.js` painted canvas textures, plaques, murals
- `src/performers.js` jointed human figures, head tracking, watch logic
- `src/world/` ground, entrance, hub, props, cage builder
- `src/exhibits/` lion, flamingo, chimp, penguin

`window.__zoo` in the browser console exposes the player, performers and a
`step(dt)` function for stepping the simulation by hand.
