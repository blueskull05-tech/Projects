/**
 * ASCII STREAM — High-Performance Video to ASCII Art Studio
 * Pure client-side real-time video processing engine.
 */

// Initialize Lucide icons if available
if (window.lucide) {
  window.lucide.createIcons();
}

/* ==========================================================================
   Character Sets & Palettes Configuration
   ========================================================================== */
const CHARACTER_PRESETS = {
  standard: ' .:-=+*#%@',
  detailed: ' .`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  blocks: ' ░▒▓█',
  matrix: ' 0123456789ABCDEF$+-*/=%:.~',
  binary: ' 01',
  braille: ' ⠁⠂⠄⡀⡄⡆⡇⣇⣧⣷⣿',
  minimal: ' .oO@'
};

const PALETTE_COLORS = {
  truecolor: null,
  matrix: '#00ff66',
  amber: '#ffb000',
  cyan: '#00f0ff',
  white: '#ffffff',
  vaporwave: 'vaporwave'
};

/* ==========================================================================
   State Management
   ========================================================================== */
const state = {
  sourceType: 'demo', // 'upload', 'webcam', 'demo'
  isPlaying: true,
  isMuted: true,
  playbackSpeed: 1.0,
  loop: true,

  // Shader & ASCII Settings
  columns: 100,
  fontSize: 10,
  aspectRatio: 0.52, // Height/width character correction for monospace font
  charRamp: CHARACTER_PRESETS.standard,
  invert: false,
  colorMode: 'truecolor',
  scanlines: true,
  glow: true,
  renderMode: 'canvas', // 'canvas' or 'pre'

  // Image Processing Adjustments
  brightness: 0,
  contrast: 1.1,
  gamma: 1.0,
  edgeDetection: false,
  webcamMirror: true,

  // Performance stats
  fps: 0,
  lastFrameTime: performance.now(),
  frameCount: 0,
  lastFpsUpdate: performance.now(),

  // Recording
  isRecording: false,
  mediaRecorder: null,
  recordedChunks: [],
  recStartTime: 0,
  recTimerInterval: null,

  // Current output text buffer (for copying & exporting)
  currentAsciiText: '',
  webcamStream: null
};

/* ==========================================================================
   DOM Elements
   ========================================================================== */
const elements = {
  // Video & Canvases
  sourceVideo: document.getElementById('source-video'),
  hiddenCanvas: document.getElementById('hidden-canvas'),
  hiddenCtx: document.getElementById('hidden-canvas').getContext('2d', { willReadFrequently: true }),
  asciiCanvas: document.getElementById('ascii-canvas'),
  asciiCtx: document.getElementById('ascii-canvas').getContext('2d'),
  asciiPre: document.getElementById('ascii-pre'),
  asciiCode: document.getElementById('ascii-code'),
  crtOverlay: document.getElementById('crt-overlay'),
  viewportWrapper: document.getElementById('viewport-wrapper'),
  displayStage: document.getElementById('display-stage'),

  // HUD & Stats
  fpsCounter: document.getElementById('fps-counter'),
  hudRes: document.getElementById('hud-res'),
  hudMode: document.getElementById('hud-mode'),
  hudChars: document.getElementById('hud-chars'),

  // Sources
  videoUploadInput: document.getElementById('video-upload-input'),
  webcamBtn: document.getElementById('webcam-btn'),
  demoBtn: document.getElementById('demo-btn'),
  dropzoneOverlay: document.getElementById('dropzone-overlay'),

  // Controls
  playPauseBtn: document.getElementById('play-pause-btn'),
  playPauseIcon: document.getElementById('play-pause-icon'),
  timeDisplay: document.getElementById('time-display'),
  seekSlider: document.getElementById('seek-slider'),
  seekFill: document.getElementById('seek-fill'),
  muteBtn: document.getElementById('mute-btn'),
  muteIcon: document.getElementById('mute-icon'),
  volumeSlider: document.getElementById('volume-slider'),
  speedBtn: document.getElementById('speed-btn'),
  loopBtn: document.getElementById('loop-btn'),
  fullscreenBtn: document.getElementById('fullscreen-btn'),

  // Exports
  copyFrameBtn: document.getElementById('copy-frame-btn'),
  downloadTxtBtn: document.getElementById('download-txt-btn'),
  downloadPngBtn: document.getElementById('download-png-btn'),
  recordVideoBtn: document.getElementById('record-video-btn'),
  recordBtnText: document.getElementById('record-btn-text'),
  recordingIndicator: document.getElementById('recording-indicator'),
  recTimer: document.getElementById('rec-timer'),

  // Settings Sliders & Inputs
  columnsSlider: document.getElementById('columns-slider'),
  columnsVal: document.getElementById('columns-val'),
  fontsizeSlider: document.getElementById('fontsize-slider'),
  fontsizeVal: document.getElementById('fontsize-val'),
  aspectSlider: document.getElementById('aspect-slider'),
  aspectVal: document.getElementById('aspect-val'),
  customCharsetInput: document.getElementById('custom-charset-input'),
  invertToggle: document.getElementById('invert-toggle'),
  scanlinesToggle: document.getElementById('scanlines-toggle'),
  glowToggle: document.getElementById('glow-toggle'),
  renderModeToggle: document.getElementById('render-mode-toggle'),
  brightnessSlider: document.getElementById('brightness-slider'),
  brightnessVal: document.getElementById('brightness-val'),
  contrastSlider: document.getElementById('contrast-slider'),
  contrastVal: document.getElementById('contrast-val'),
  gammaSlider: document.getElementById('gamma-slider'),
  gammaVal: document.getElementById('gamma-val'),
  edgeDetectionToggle: document.getElementById('edge-detection-toggle'),
  webcamMirrorToggle: document.getElementById('webcam-mirror-toggle'),
  resetSettingsBtn: document.getElementById('reset-settings-btn'),

  // Containers
  toastContainer: document.getElementById('toast-container')
};

/* ==========================================================================
   Procedural 3D Synthetic Demo Generator
   Runs seamlessly when user has no video file handy.
   ========================================================================== */
class ProceduralDemoGenerator {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 360;
    this.ctx = this.canvas.getContext('2d');
    this.angle = 0;
  }

  renderFrame() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.angle += 0.025;

    // Background gradient with pulsating wave
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    const pulse = (Math.sin(this.angle * 2) + 1) * 0.5;
    bgGrad.addColorStop(0, `rgb(${Math.floor(15 + pulse * 25)}, ${Math.floor(20 + pulse * 15)}, 45)`);
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Dynamic cyber grid floor
    ctx.save();
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 + pulse * 0.15})`;
    ctx.lineWidth = 1;
    const horizon = h * 0.68;
    for (let x = -w; x <= w * 2; x += 40) {
      ctx.beginPath();
      ctx.moveTo(w / 2, horizon);
      ctx.lineTo(x + Math.sin(this.angle) * 30, h);
      ctx.stroke();
    }
    for (let y = horizon; y <= h; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();

    // 3D Rotating Geometric Wireframe Torus / Cube
    ctx.save();
    ctx.translate(w / 2, h * 0.42);

    const numPoints = 64;
    const r1 = 80 + Math.sin(this.angle * 3) * 10;
    const r2 = 34 + Math.cos(this.angle * 2) * 8;

    for (let i = 0; i < numPoints; i++) {
      const u = (i / numPoints) * Math.PI * 2;
      for (let j = 0; j < 16; j++) {
        const v = (j / 16) * Math.PI * 2 + this.angle;
        
        // 3D torus coordinates
        const x3d = (r1 + r2 * Math.cos(v)) * Math.cos(u + this.angle);
        const y3d = (r1 + r2 * Math.cos(v)) * Math.sin(u + this.angle);
        const z3d = r2 * Math.sin(v);

        // Simple perspective projection with rotation
        const cosA = Math.cos(this.angle * 0.7);
        const sinA = Math.sin(this.angle * 0.7);
        const rotY = y3d * cosA - z3d * sinA;
        const rotZ = y3d * sinA + z3d * cosA + 180;

        const fov = 260 / (rotZ + 120);
        const projX = x3d * fov;
        const projY = rotY * fov;

        const size = Math.max(1.5, fov * 4);
        const hue = (i * 8 + this.angle * 50) % 360;
        ctx.fillStyle = `hsl(${hue}, 90%, 65%)`;
        ctx.beginPath();
        ctx.arc(projX, projY, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Glowing Neon Banner Text
    ctx.font = 'bold 24px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 255, 255, ${0.85 + Math.sin(this.angle * 4) * 0.15})`;
    ctx.fillText('ASCII STREAM PRO', 0, 110);

    ctx.font = '12px "Inter", sans-serif';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('DROP VIDEO FILE OR ACTIVATE WEBCAM', 0, 130);
    ctx.restore();

    return this.canvas;
  }
}

const demoGenerator = new ProceduralDemoGenerator();

/* ==========================================================================
   Toast Notification System
   ========================================================================== */
function showToast(message, type = 'success', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  const icon = type === 'error' ? 'alert-triangle' : 'check-circle';
  toast.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
  elements.toastContainer.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ==========================================================================
   ASCII Engine: Pixel Processing & Character Mapping
   ========================================================================== */
class AsciiEngine {
  constructor() {
    this.sampleWidth = 100;
    this.sampleHeight = 50;
  }

  processSource(sourceElement) {
    let sourceWidth = 640;
    let sourceHeight = 360;

    if (sourceElement instanceof HTMLVideoElement) {
      sourceWidth = sourceElement.videoWidth || 640;
      sourceHeight = sourceElement.videoHeight || 360;
    } else if (sourceElement instanceof HTMLCanvasElement) {
      sourceWidth = sourceElement.width;
      sourceHeight = sourceElement.height;
    }

    this.sampleWidth = state.columns;
    this.sampleHeight = Math.max(1, Math.round((sourceHeight / sourceWidth) * this.sampleWidth * state.aspectRatio));

    // Resize hidden extraction canvas
    if (elements.hiddenCanvas.width !== this.sampleWidth || elements.hiddenCanvas.height !== this.sampleHeight) {
      elements.hiddenCanvas.width = this.sampleWidth;
      elements.hiddenCanvas.height = this.sampleHeight;
    }

    const ctx = elements.hiddenCtx;

    // Optional horizontal mirror flip for webcam
    ctx.save();
    if (state.sourceType === 'webcam' && state.webcamMirror) {
      ctx.translate(this.sampleWidth, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(sourceElement, 0, 0, this.sampleWidth, this.sampleHeight);
    ctx.restore();

    const imgData = ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
    const pixels = imgData.data;

    return this.generateAsciiGrid(pixels, this.sampleWidth, this.sampleHeight);
  }

  generateAsciiGrid(pixels, width, height) {
    const ramp = state.charRamp;
    const rampLength = ramp.length;
    const contrastFactor = state.contrast;
    const brightness = state.brightness;
    const gamma = state.gamma;
    const invert = state.invert;
    const edgeDetection = state.edgeDetection;

    const grid = [];
    const textLines = [];

    // Precalculate gamma table
    const gammaLookup = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      gammaLookup[i] = Math.min(255, Math.max(0, Math.round(255 * Math.pow(i / 255, 1 / gamma))));
    }

    for (let y = 0; y < height; y++) {
      const rowChars = [];
      let textLine = '';

      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        let r = pixels[offset];
        let g = pixels[offset + 1];
        let b = pixels[offset + 2];

        // 1. Brightness adjustment
        r = Math.min(255, Math.max(0, r + brightness));
        g = Math.min(255, Math.max(0, g + brightness));
        b = Math.min(255, Math.max(0, b + brightness));

        // 2. Contrast adjustment: (channel - 128) * factor + 128
        r = Math.min(255, Math.max(0, (r - 128) * contrastFactor + 128));
        g = Math.min(255, Math.max(0, (g - 128) * contrastFactor + 128));
        b = Math.min(255, Math.max(0, (b - 128) * contrastFactor + 128));

        // 3. Gamma lookup
        r = gammaLookup[Math.floor(r)];
        g = gammaLookup[Math.floor(g)];
        b = gammaLookup[Math.floor(b)];

        // Standard perceived luminance Rec. 709
        let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        // 4. Edge Detection (Sobel/Gradient difference)
        if (edgeDetection && x < width - 1 && y < height - 1) {
          const nextX = (y * width + (x + 1)) * 4;
          const nextY = ((y + 1) * width + x) * 4;
          const lumX = 0.2126 * pixels[nextX] + 0.7152 * pixels[nextX + 1] + 0.0722 * pixels[nextX + 2];
          const lumY = 0.2126 * pixels[nextY] + 0.7152 * pixels[nextY + 1] + 0.0722 * pixels[nextY + 2];
          const diff = Math.sqrt(Math.pow(lum - lumX, 2) + Math.pow(lum - lumY, 2));
          lum = Math.min(255, diff * 2.5);
        }

        if (invert) {
          lum = 255 - lum;
        }

        // Map luminance to character index
        const charIdx = Math.min(rampLength - 1, Math.floor((lum / 256) * rampLength));
        const char = ramp[charIdx] || ' ';

        rowChars.push({ char, r, g, b, lum });
        textLine += char;
      }

      grid.push(rowChars);
      textLines.push(textLine);
    }

    state.currentAsciiText = textLines.join('\n');
    return { grid, width, height, text: state.currentAsciiText };
  }
}

const engine = new AsciiEngine();

/* ==========================================================================
   Render Manager (Canvas & Pre Display Modes)
   ========================================================================== */
class AsciiRenderer {
  render(asciiData) {
    const { grid, width, height, text } = asciiData;

    // Update HUD stats
    elements.hudRes.textContent = `Resolution: ${width} × ${height}`;
    elements.hudMode.textContent = `Color: ${state.colorMode.toUpperCase()}`;
    elements.hudChars.textContent = `Chars: ${(width * height).toLocaleString()}`;

    if (state.renderMode === 'pre') {
      elements.asciiCanvas.style.display = 'none';
      elements.asciiPre.style.display = 'block';
      this.renderPre(text);
    } else {
      elements.asciiPre.style.display = 'none';
      elements.asciiCanvas.style.display = 'block';
      this.renderCanvas(grid, width, height);
    }
  }

  renderPre(text) {
    elements.asciiCode.textContent = text;
    // Apply palette color to the <pre> text
    const color = PALETTE_COLORS[state.colorMode];
    if (color && color !== 'vaporwave') {
      elements.asciiPre.style.color = color;
    } else {
      elements.asciiPre.style.color = '#00ff88';
    }
  }

  renderCanvas(grid, width, height) {
    const canvas = elements.asciiCanvas;
    const ctx = elements.asciiCtx;
    const fontSize = state.fontSize;

    // Character dimensions in monospace
    const charWidth = fontSize * 0.6;
    const charHeight = fontSize;

    const targetWidth = Math.ceil(width * charWidth);
    const targetHeight = Math.ceil(height * charHeight);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    // Clear background
    ctx.fillStyle = '#030508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px "Fira Code", "Courier New", monospace`;
    ctx.textBaseline = 'top';

    const colorMode = state.colorMode;
    const fixedColor = PALETTE_COLORS[colorMode];

    // High performance rendering:
    // If monochrome palette, assemble whole line string and draw once per line!
    if (fixedColor && fixedColor !== 'vaporwave') {
      ctx.fillStyle = fixedColor;
      for (let y = 0; y < height; y++) {
        let lineStr = '';
        for (let x = 0; x < width; x++) {
          lineStr += grid[y][x].char;
        }
        ctx.fillText(lineStr, 0, y * charHeight);
      }
      return;
    }

    // Vaporwave Synthwave Gradient Palette
    if (colorMode === 'vaporwave') {
      for (let y = 0; y < height; y++) {
        const t = y / height;
        // Interpolate between Hot Pink (#ff2a85) and Cyan (#00f0ff)
        const r = Math.round(255 * (1 - t) + 0 * t);
        const g = Math.round(42 * (1 - t) + 240 * t);
        const b = Math.round(133 * (1 - t) + 255 * t);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        let lineStr = '';
        for (let x = 0; x < width; x++) {
          lineStr += grid[y][x].char;
        }
        ctx.fillText(lineStr, 0, y * charHeight);
      }
      return;
    }

    // True Color Mode: draw colored characters
    for (let y = 0; y < height; y++) {
      const posY = y * charHeight;
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];
        if (cell.char === ' ') continue; // Skip blanks for speed
        ctx.fillStyle = `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
        ctx.fillText(cell.char, x * charWidth, posY);
      }
    }
  }
}

const renderer = new AsciiRenderer();

/* ==========================================================================
   Main Animation & Render Loop
   ========================================================================== */
function tick() {
  requestAnimationFrame(tick);

  // Performance FPS tracking
  state.frameCount++;
  const now = performance.now();
  if (now - state.lastFpsUpdate >= 1000) {
    state.fps = Math.round((state.frameCount * 1000) / (now - state.lastFpsUpdate));
    elements.fpsCounter.textContent = `${state.fps} FPS`;
    state.frameCount = 0;
    state.lastFpsUpdate = now;
  }

  // Source selection & processing
  let currentSource = null;

  if (state.sourceType === 'demo') {
    currentSource = demoGenerator.renderFrame();
  } else if (state.sourceType === 'webcam') {
    if (elements.sourceVideo.readyState >= elements.sourceVideo.HAVE_CURRENT_DATA) {
      currentSource = elements.sourceVideo;
    }
  } else if (state.sourceType === 'upload') {
    if (elements.sourceVideo.readyState >= elements.sourceVideo.HAVE_CURRENT_DATA) {
      currentSource = elements.sourceVideo;
      updateVideoPlaybackTimeline();
    }
  }

  if (currentSource) {
    const asciiData = engine.processSource(currentSource);
    renderer.render(asciiData);
  }
}

/* ==========================================================================
   Video Timeline & Playback Controller
   ========================================================================== */
function updateVideoPlaybackTimeline() {
  const video = elements.sourceVideo;
  if (!video.duration || isNaN(video.duration)) return;

  const current = video.currentTime;
  const duration = video.duration;

  // Update slider fill and value (when user is not actively scrubbing)
  if (!elements.seekSlider.matches(':active')) {
    elements.seekSlider.value = (current / duration) * 100;
    elements.seekFill.style.width = `${(current / duration) * 100}%`;
  }

  elements.timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function setPlayState(playing) {
  state.isPlaying = playing;
  if (state.sourceType === 'upload') {
    if (playing) {
      elements.sourceVideo.play().catch(e => console.warn(e));
    } else {
      elements.sourceVideo.pause();
    }
  }
  elements.playPauseIcon.setAttribute('data-lucide', playing ? 'pause' : 'play');
  if (window.lucide) window.lucide.createIcons();
}

/* ==========================================================================
   Source Loaders: File Upload, Live Webcam & Demo
   ========================================================================== */
function loadVideoFile(file) {
  if (!file || !file.type.startsWith('video/')) {
    showToast('Please select a valid video file (.mp4, .webm, .mov)', 'error');
    return;
  }

  stopWebcam();
  state.sourceType = 'upload';
  updateSourceButtons('upload');

  const fileURL = URL.createObjectURL(file);
  const video = elements.sourceVideo;
  video.src = fileURL;
  video.loop = state.loop;
  video.muted = state.isMuted;
  video.playbackRate = state.playbackSpeed;

  video.onloadedmetadata = () => {
    video.play().then(() => {
      setPlayState(true);
      showToast(`Loaded: ${file.name}`);
    }).catch(err => {
      console.warn(err);
      setPlayState(false);
    });
  };
}

async function startWebcam() {
  try {
    stopWebcam();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false
    });

    state.webcamStream = stream;
    elements.sourceVideo.srcObject = stream;
    elements.sourceVideo.play();
    state.sourceType = 'webcam';
    updateSourceButtons('webcam');
    setPlayState(true);
    elements.timeDisplay.textContent = 'LIVE WEBCAM';
    elements.seekFill.style.width = '100%';
    showToast('Webcam stream started!');
  } catch (err) {
    console.error('Webcam access error:', err);
    showToast(`Camera Error: ${err.message || 'Permission denied'}`, 'error');
  }
}

function stopWebcam() {
  if (state.webcamStream) {
    state.webcamStream.getTracks().forEach(track => track.stop());
    state.webcamStream = null;
  }
  elements.sourceVideo.srcObject = null;
}

function startDemo() {
  stopWebcam();
  elements.sourceVideo.pause();
  elements.sourceVideo.src = '';
  state.sourceType = 'demo';
  updateSourceButtons('demo');
  setPlayState(true);
  elements.timeDisplay.textContent = 'SYNTHETIC DEMO';
  elements.seekFill.style.width = '100%';
  showToast('Sample 3D demo loaded');
}

function updateSourceButtons(activeSource) {
  elements.demoBtn.classList.toggle('active', activeSource === 'demo');
  elements.webcamBtn.classList.toggle('active', activeSource === 'webcam');
}

/* ==========================================================================
   Export & Recording Capabilities
   ========================================================================== */
function copyCurrentFrame() {
  if (!state.currentAsciiText) {
    showToast('No ASCII frame available to copy', 'error');
    return;
  }

  navigator.clipboard.writeText(state.currentAsciiText)
    .then(() => showToast('ASCII frame copied to clipboard!'))
    .catch(() => showToast('Failed to copy to clipboard', 'error'));
}

function downloadCurrentFrameTxt() {
  if (!state.currentAsciiText) {
    showToast('No ASCII frame available', 'error');
    return;
  }

  const blob = new Blob([state.currentAsciiText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ascii-frame-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Downloaded ASCII .TXT frame!');
}

function downloadCurrentFramePng() {
  const canvas = elements.asciiCanvas;
  if (!canvas.width || !canvas.height) {
    showToast('No canvas frame available', 'error');
    return;
  }

  const imageURL = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = imageURL;
  a.download = `ascii-snapshot-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Saved ASCII PNG image!');
}

function toggleRecordVideo() {
  if (state.isRecording) {
    stopVideoRecording();
  } else {
    startVideoRecording();
  }
}

function startVideoRecording() {
  const canvas = elements.asciiCanvas;
  const stream = canvas.captureStream(30); // 30 FPS stream

  try {
    state.recordedChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    state.mediaRecorder = new MediaRecorder(stream, { mimeType });

    state.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        state.recordedChunks.push(e.data);
      }
    };

    state.mediaRecorder.onstop = () => {
      const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ascii-clip-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Video clip downloaded!');
    };

    state.mediaRecorder.start();
    state.isRecording = true;
    state.recStartTime = Date.now();

    elements.recordVideoBtn.classList.add('recording');
    elements.recordBtnText.textContent = 'Stop Recording';
    elements.recordingIndicator.style.display = 'flex';

    state.recTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.recStartTime) / 1000);
      const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const s = (elapsed % 60).toString().padStart(2, '0');
      elements.recTimer.textContent = `${m}:${s}`;
    }, 500);

    showToast('Recording ASCII video clip...');
  } catch (err) {
    console.error('Recording error:', err);
    showToast(`Recording failed: ${err.message}`, 'error');
  }
}

function stopVideoRecording() {
  if (state.mediaRecorder && state.isRecording) {
    state.mediaRecorder.stop();
  }
  state.isRecording = false;
  clearInterval(state.recTimerInterval);

  elements.recordVideoBtn.classList.remove('recording');
  elements.recordBtnText.textContent = 'Record Clip';
  elements.recordingIndicator.style.display = 'none';
}

/* ==========================================================================
   Event Listeners & UI Binding
   ========================================================================== */
function setupEventListeners() {
  // 1. Source Selectors
  elements.videoUploadInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      loadVideoFile(e.target.files[0]);
    }
  });

  elements.webcamBtn.addEventListener('click', startWebcam);
  elements.demoBtn.addEventListener('click', startDemo);

  // Drag and Drop files onto workspace
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropzoneOverlay.classList.add('drag-over');
  });

  window.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null) {
      elements.dropzoneOverlay.classList.remove('drag-over');
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropzoneOverlay.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadVideoFile(e.dataTransfer.files[0]);
    }
  });

  // 2. Playback Controls
  elements.playPauseBtn.addEventListener('click', () => {
    setPlayState(!state.isPlaying);
  });

  elements.seekSlider.addEventListener('input', (e) => {
    const video = elements.sourceVideo;
    if (video.duration) {
      const targetTime = (e.target.value / 100) * video.duration;
      video.currentTime = targetTime;
      elements.seekFill.style.width = `${e.target.value}%`;
    }
  });

  elements.muteBtn.addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    elements.sourceVideo.muted = state.isMuted;
    elements.muteBtn.classList.toggle('active', !state.isMuted);
    elements.muteIcon.setAttribute('data-lucide', state.isMuted ? 'volume-x' : 'volume-2');
    if (window.lucide) window.lucide.createIcons();
  });

  elements.volumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    elements.sourceVideo.volume = vol;
    state.isMuted = vol === 0;
    elements.sourceVideo.muted = state.isMuted;
    elements.muteIcon.setAttribute('data-lucide', state.isMuted ? 'volume-x' : 'volume-2');
    if (window.lucide) window.lucide.createIcons();
  });

  const speeds = [0.5, 1.0, 1.5, 2.0];
  let speedIdx = 1;
  elements.speedBtn.addEventListener('click', () => {
    speedIdx = (speedIdx + 1) % speeds.length;
    state.playbackSpeed = speeds[speedIdx];
    elements.sourceVideo.playbackRate = state.playbackSpeed;
    elements.speedBtn.textContent = `${state.playbackSpeed}x`;
  });

  elements.loopBtn.addEventListener('click', () => {
    state.loop = !state.loop;
    elements.sourceVideo.loop = state.loop;
    elements.loopBtn.classList.toggle('active', state.loop);
  });

  elements.fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      elements.displayStage.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen();
    }
  });

  // 3. Export Buttons
  elements.copyFrameBtn.addEventListener('click', copyCurrentFrame);
  elements.downloadTxtBtn.addEventListener('click', downloadCurrentFrameTxt);
  elements.downloadPngBtn.addEventListener('click', downloadCurrentFramePng);
  elements.recordVideoBtn.addEventListener('click', toggleRecordVideo);

  // 4. Sliders & Customization
  elements.columnsSlider.addEventListener('input', (e) => {
    state.columns = parseInt(e.target.value);
    elements.columnsVal.textContent = `${state.columns} cols`;
  });

  elements.fontsizeSlider.addEventListener('input', (e) => {
    state.fontSize = parseInt(e.target.value);
    elements.fontsizeVal.textContent = `${state.fontSize} px`;
  });

  elements.aspectSlider.addEventListener('input', (e) => {
    state.aspectRatio = parseFloat(e.target.value);
    elements.aspectVal.textContent = state.aspectRatio.toFixed(2);
  });

  // Character Set Preset buttons
  document.querySelectorAll('.preset-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-pills .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const presetKey = btn.getAttribute('data-charset');
      state.charRamp = CHARACTER_PRESETS[presetKey] || CHARACTER_PRESETS.standard;
      elements.customCharsetInput.value = state.charRamp;
    });
  });

  elements.customCharsetInput.addEventListener('input', (e) => {
    if (e.target.value.length > 0) {
      state.charRamp = e.target.value;
      document.querySelectorAll('.preset-pills .pill-btn').forEach(b => b.classList.remove('active'));
    }
  });

  elements.invertToggle.addEventListener('change', (e) => {
    state.invert = e.target.checked;
  });

  // Palette buttons
  document.querySelectorAll('.palette-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      state.colorMode = swatch.getAttribute('data-color');

      // Update glow color CSS variable
      const glowColors = {
        matrix: 'rgba(0, 255, 102, 0.45)',
        amber: 'rgba(255, 176, 0, 0.45)',
        cyan: 'rgba(0, 240, 255, 0.45)',
        white: 'rgba(255, 255, 255, 0.3)',
        vaporwave: 'rgba(255, 42, 133, 0.45)',
        truecolor: 'rgba(0, 255, 136, 0.35)'
      };
      document.documentElement.style.setProperty('--glow-color', glowColors[state.colorMode] || glowColors.truecolor);
    });
  });

  elements.scanlinesToggle.addEventListener('change', (e) => {
    state.scanlines = e.target.checked;
    elements.crtOverlay.classList.toggle('disabled', !state.scanlines);
  });

  elements.glowToggle.addEventListener('change', (e) => {
    state.glow = e.target.checked;
    elements.displayStage.classList.toggle('glow-active', state.glow);
  });

  elements.renderModeToggle.addEventListener('change', (e) => {
    state.renderMode = e.target.checked ? 'pre' : 'canvas';
  });

  elements.brightnessSlider.addEventListener('input', (e) => {
    state.brightness = parseInt(e.target.value);
    elements.brightnessVal.textContent = state.brightness;
  });

  elements.contrastSlider.addEventListener('input', (e) => {
    state.contrast = parseFloat(e.target.value);
    elements.contrastVal.textContent = `${state.contrast.toFixed(1)}x`;
  });

  elements.gammaSlider.addEventListener('input', (e) => {
    state.gamma = parseFloat(e.target.value);
    elements.gammaVal.textContent = state.gamma.toFixed(1);
  });

  elements.edgeDetectionToggle.addEventListener('change', (e) => {
    state.edgeDetection = e.target.checked;
  });

  elements.webcamMirrorToggle.addEventListener('change', (e) => {
    state.webcamMirror = e.target.checked;
  });

  // Reset settings
  elements.resetSettingsBtn.addEventListener('click', resetDefaults);

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return; // Don't intercept typing in inputs

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        setPlayState(!state.isPlaying);
        break;
      case 'KeyM':
        elements.muteBtn.click();
        break;
      case 'KeyF':
        elements.fullscreenBtn.click();
        break;
      case 'KeyC':
        copyCurrentFrame();
        break;
      case 'KeyR':
        toggleRecordVideo();
        break;
    }
  });

  // Default glow active
  elements.displayStage.classList.add('glow-active');
}

function resetDefaults() {
  state.columns = 100;
  state.fontSize = 10;
  state.aspectRatio = 0.52;
  state.charRamp = CHARACTER_PRESETS.standard;
  state.invert = false;
  state.colorMode = 'truecolor';
  state.brightness = 0;
  state.contrast = 1.1;
  state.gamma = 1.0;
  state.edgeDetection = false;

  elements.columnsSlider.value = 100;
  elements.columnsVal.textContent = '100 cols';
  elements.fontsizeSlider.value = 10;
  elements.fontsizeVal.textContent = '10 px';
  elements.aspectSlider.value = 0.52;
  elements.aspectVal.textContent = '0.52';
  elements.customCharsetInput.value = CHARACTER_PRESETS.standard;
  elements.invertToggle.checked = false;
  elements.brightnessSlider.value = 0;
  elements.brightnessVal.textContent = '0';
  elements.contrastSlider.value = 1.1;
  elements.contrastVal.textContent = '1.1x';
  elements.gammaSlider.value = 1.0;
  elements.gammaVal.textContent = '1.0';
  elements.edgeDetectionToggle.checked = false;

  document.querySelectorAll('.preset-pills .pill-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-charset') === 'standard');
  });

  document.querySelectorAll('.palette-swatch').forEach(s => {
    s.classList.toggle('active', s.getAttribute('data-color') === 'truecolor');
  });

  showToast('Settings reset to defaults');
}

/* ==========================================================================
   Application Initialization
   ========================================================================== */
function init() {
  setupEventListeners();
  // Start the render loop
  requestAnimationFrame(tick);
  showToast('ASCII Stream Studio Ready! Press Space to Play/Pause.');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
