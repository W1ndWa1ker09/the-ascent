# The Ascent

A C++ dungeon crawler built around procedurally generated rooms and an item system.

## Overview

The Ascent generates a grid-based dungeon where each room can contain items, exits in cardinal directions, and various state flags (visited, locked, path, breaker). Items carry effects that modify player or world attributes, each with a rarity, spawn chance, and duration.

## Structure

| Class | Purpose |
|-------|---------|
| `Effect` | A single stat modification (target, attribute, value, operator) |
| `Item` | Named collectible with a list of effects, rarity, and spawn chance |
| `Exit` | A directional connection between rooms at grid coordinates |
| `Room` | A grid cell with exits, items, and traversal flags |

The `generateGrid` function builds the dungeon as a 2D vector of `Room` objects, with configurable size, item population, density, and connection rate.

## Building

Requires a C++17-compatible compiler.

```bash
g++ -std=c++17 -o the-ascent "The Ascent.cpp"
```

## Status

Early development — core data structures in place, game loop not yet implemented.
