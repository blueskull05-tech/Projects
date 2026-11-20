# ASCII Stream — Real-Time Video to ASCII Art Studio

A high-performance, purely client-side web application that transforms videos and live camera feeds into interactive ASCII art at 60 FPS.

## ✨ Features

- **Multiple Input Sources:**
  - 📁 **Video File Upload & Drag-and-Drop:** Supports MP4, WebM, MOV, and MKV.
  - 📹 **Live Webcam Stream:** Real-time conversion with horizontal mirror toggle.
  - 🎬 **Procedural 3D Demo:** Built-in animated 3D wireframe demo that runs out of the box with zero setup.
- **Rendering & Visual Shader Modes:**
  - **Ultra-Fast Canvas Mode:** Smooth 60 FPS rendering with phosphor glow and bloom.
  - **Selectable Text Mode:** Renders into a `<pre><code>` element so you can highlight, copy, or inspect the characters directly.
  - **CRT Scanlines Effect:** Retro cathode-ray tube aesthetic overlay.
- **Rich Color Palettes:**
  - **True Color:** Character colors match the exact RGB values of the video pixels.
  - **Matrix Green:** Iconic phosphor green `#00ff66` terminal look.
  - **Amber CRT:** Classic retro computing amber glow.
  - **Cyber Cyan:** Ice neon cyberpunk aesthetic.
  - **Monochrome:** Crisp white on deep obsidian.
  - **Synthwave:** Gradient sunset interpolation.
- **Character Ramp Customization:**
  - **Presets:** Standard, Detailed (70 glyphs), Blocks (`█▓▒░`), Matrix Code, Binary (`01`), Braille (`⣿`), and Minimal.
  - **Custom Ramp:** Define your own dark-to-bright character string.
  - **Invert Ramp:** Flip light and dark values.
- **Image Processing & Edge Detection:**
  - Brightness, contrast, and gamma correction sliders.
  - **Edge Detection (Outline Mode):** Highlights edges with ASCII characters.
- **Export & Recording:**
  - 📋 **Copy Frame:** Copy current ASCII frame to clipboard.
  - 💾 **Save .TXT:** Download current frame as a text file.
  - 🖼️ **Save .PNG:** Export high-resolution snapshot of the ASCII canvas.
  - 🎥 **Record Clip:** Record and download a WebM video clip of the ASCII art in real-time.
- **Keyboard Shortcuts:**
  - `Space`: Play / Pause
  - `M`: Mute / Unmute
  - `F`: Toggle Fullscreen
  - `C`: Copy current frame
  - `R`: Start / Stop recording

## 🚀 How to Run

Because **ASCII Stream** is completely client-side and has zero external server dependencies, you can run it in multiple ways:

### Option 1: Direct File Open
Simply double-click or open `index.html` in your favorite web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server (Recommended)
You can serve the directory using Python or Node:

```bash
# Using Python
cd "C:\Users\rithv\.gemini\antigravity\scratch\video-to-ascii"
python -m http.server 8080

# Or using npx
npx serve
```
Then open `http://localhost:8080` in your browser.
