# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flow Arts Interactive is a creative coding web application that transforms uploaded images into animated flow art using p5.js. The project generates particle-based visualizations that follow noise fields, with colors and characteristics derived from the source image.

## Running the Application

This is a client-side only application with no build process:

1. Open `index.html` directly in a web browser
2. Upload an image using the "Choose Image" button
3. Control the animation with the provided UI controls

No server, build tools, or package manager required.

## Architecture

### Core Rendering Loop

The application uses p5.js's setup/draw loop pattern:

- **setup()** (script.js:271): Initializes canvas at full window size, calculates pixel scaling factor (`pxl`), and prepares the drawing state
- **draw()** (script.js:295): Main render loop that creates particles, applies noise-based flow fields, handles mouse repulsion, and renders based on selected style

### Two Visualization Modes

1. **Kaleidoscope Mode** (script.js:312-372):
   - Uses `translate()` to center at canvas midpoint
   - Creates symmetrical patterns by rotating and mirroring particles around the center
   - Number of symmetry sides controlled by `sides` parameter
   - Includes animated rotation via `kaleidoscopeRotationOffset`

2. **Normal Mode** (script.js:373-418):
   - No coordinate transformation
   - Particles flow across entire canvas
   - Each particle rendered once at its actual position

### Particle System

Particles are created in `makept()` (script.js:424) with properties derived from the source image:

- **Position**: Random location within canvas bounds
- **Color**: Sampled from corresponding image pixel coordinates (mapped from canvas to image space)
- **Stroke weight**: Based on image brightness at that location
- **Life**: Initial lifetime based on image brightness (brighter areas = longer life)

Particles move through a Perlin noise field (script.js:336-342, 394-398) with velocity damping. Life decreases each frame, and dead particles are removed in `clean()` (script.js:498).

### Interactive Features

- **Mouse Repulsion** (script.js:322-334, 381-390): Particles within `repulsionRadius` are pushed away from cursor based on `repulsionStrength`
- **Parameter Sliders**: All visual parameters (resolution, damping, alpha, particle limit, kaleidoscope sides, repulsion) can be adjusted in real-time via UI controls
- **Keyboard Shortcuts**: Space (play/pause), R (restart), K (toggle style), Ctrl/Cmd+S (save)

### Responsive Scaling

The `pxl` variable (script.js:276) scales parameters based on viewport size. Original constant values (ORIGINAL_STROKE_W, ORIGINAL_LIFE, ORIGINAL_BORDER) are multiplied by `pxl` to maintain visual consistency across different screen sizes.

### State Management

- **isLooping**: Tracks whether animation is running
- **isLoading**: Controls loading overlay during image processing
- **controlsTimeout**: Manages auto-hide behavior for UI controls (fades to 0.1 opacity after 3s of no mouse movement)
- **frameCount**: Used with `limit` parameter to auto-stop animation after specified frame count

## Key Implementation Details

- Particle colors fade based on remaining life (script.js:355-357, 408-411)
- Stroke weight adjusts dynamically based on particle velocity (script.js:345-352, 401-406)
- Image sampling uses constrained mapping to prevent out-of-bounds errors (script.js:446-447)
- ADD blend mode creates luminous, overlapping particle trails (script.js:303)
- Parameters randomized on restart via `resetParameters()` but can be manually controlled via sliders

## File Structure

- `index.html`: UI controls with grouped layout (file/style, playback/save, parameter sliders)
- `script.js`: All p5.js drawing logic, particle system, and event handlers
- `style.css`: Styling for overlay controls with backdrop blur and auto-hide behavior
- External dependency: p5.js v1.4.0 loaded from CDN
