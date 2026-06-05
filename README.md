# The Ascent

A browser-based text adventure game. You are trapped in an underground bunker 100 floors beneath the surface and must climb to freedom — navigating procedurally generated floors, managing your sanity, and evading an entity that hunts you through the dark.

## Gameplay

Each floor is a 10×10 grid of rooms connected by exits. You start at the top-left and must reach the elevator at the bottom-right. Along the way:

- **Sanity** drains every minute. Reach zero and you black out, losing your progress on the floor.
- **The Entity** appears after you've explored enough of a floor and grows faster and bolder on deeper floors. Keep it at bay with flashlight batteries.
- **Locked rooms** block shortcuts. Find keys or try your luck lockpicking.
- **The breaker room** must be found and activated to power the elevator before you can descend.
- **Items** scattered through rooms help you survive — batteries slow the entity, capsules restore sanity, and rare mythics can stop it entirely.

## Items

| Item | Type | Effect |
|------|------|--------|
| Key | Utility | Unlocks a locked room |
| Regular / Lithium / Ion Battery | Flashlight | Slows the entity (mild → extreme) |
| Low-Dose / Prescription / Experimental Capsule | Medication | Recovers sanity over time |
| Reality Anchor | Mythic | Stops the entity until you're 5 rooms away |
| Portrait of the Mind | Mythic | Immediate large sanity recovery |

## Controls

| Input | Action |
|-------|--------|
| `w` `a` `s` `d` | Move north / west / south / east |
| `e` | Pick up item in room |
| `f` | Use selected inventory item |
| `q` | Inspect selected inventory item |
| `v` | Upgrade elevator (requires Ion Battery) |
| `ArrowUp` / `ArrowDown` | Cycle selected inventory item |
| `hold r` + arrow key | Unlock a room in that direction |
| `hold t` + arrow key | Attempt to lockpick a room |

All movement and actions can also be typed as commands (e.g. `go north`, `take battery`, `use capsule`). Type `commands` in-game for a full list.

## Settings

Accessible from the main menu:

- **Text Speed** — controls how fast text is typed out in the console.
- **Auto Pickup** — automatically picks up all items when entering a room.

## Running

Open `index.html` in a browser. No build step or server required.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Page layout, UI, audio elements |
| `mainmenu.css` / `play.css` | Styling |
| `JavaScript/generation.js` | Procedural floor generation, BFS pathfinding |
| `JavaScript/items.js` | Item definitions, inventory management |
| `JavaScript/play.js` | Game loop, player/monster logic, commands, keybinds |
| `JavaScript/map.js` | Canvas map rendering, UI sign animations |
| `JavaScript/console.js` | Typewriter console, input handling |
| `JavaScript/mainmenu.js` | Menu navigation, settings toggles |
| `Sounds/` | Audio files for ambience and events |
