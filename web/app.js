const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');
const matrixSizeSelect = document.getElementById('matrixSize');
const colorPicker = document.getElementById('colorPicker');
const bgPicker = document.getElementById('bgColorPicker');
const brushSizeInput = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const modeButtons = document.querySelectorAll('[data-mode]');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const gridBtn = document.getElementById('gridBtn');
const brightnessSlider = document.getElementById('brightness');
const brightnessValue = document.getElementById('brightnessValue');
const connectBtn = document.getElementById('connectBtn');
const hostInput = document.getElementById('hostInput');
const connectionStatus = document.getElementById('connectionStatus');
const savePresetBtn = document.getElementById('savePresetBtn');
const presetList = document.getElementById('presetList');
const presetTemplate = document.getElementById('presetItemTemplate');

let matrixSize = Number(matrixSizeSelect.value);
let brushSize = Number(brushSizeInput.value);
let mode = 'draw';
let showGrid = false;
let isPointerDown = false;
let pixelData = createPixelBuffer(matrixSize, bgPicker.value);
let undoStack = [];

const transport = createTransport();


function createPixelBuffer(size, fillColor) {
  return new Array(size * size).fill(fillColor);
}

function setStatus(label, state = 'idle') {
  const dot = connectionStatus.querySelector('span');
  connectionStatus.classList.remove('text-rose-400', 'text-emerald-300');
  dot.classList.remove('bg-rose-500', 'bg-emerald-400', 'bg-slate-500');
  switch (state) {
    case 'connected':
      connectionStatus.textContent = 'Connected';
      connectionStatus.prepend(dot);
      dot.classList.add('bg-emerald-400');
      connectionStatus.classList.add('text-emerald-300');
      break;
    case 'error':
      connectionStatus.textContent = label;
      connectionStatus.prepend(dot);
      dot.classList.add('bg-rose-500');
      connectionStatus.classList.add('text-rose-400');
      break;
    default:
      connectionStatus.textContent = label;
      connectionStatus.prepend(dot);
      dot.classList.add('bg-slate-500');
  }
}

function coordsToIndex(x, y) {
  return y * matrixSize + x;
}

function pushUndoState() {
  undoStack.push([...pixelData]);
  if (undoStack.length > 30) undoStack.shift();
}

function restoreFromState(state) {
  pixelData = [...state];
  render();
  sendFrame();
}

function render() {
  const cellSize = canvas.width / matrixSize;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pixelData.forEach((color, index) => {
    const x = index % matrixSize;
    const y = Math.floor(index / matrixSize);
    ctx.fillStyle = color;
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  });

  if (showGrid) {
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= matrixSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }
  }
}

function getCellFromEvent(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * matrixSize;
  const y = ((evt.clientY - rect.top) / rect.height) * matrixSize;
  return {
    x: Math.floor(x),
    y: Math.floor(y),
  };
}

function applyBrush(x, y) {
  const half = Math.floor(brushSize / 2);
  for (let row = -half; row < brushSize - half; row++) {
    for (let col = -half; col < brushSize - half; col++) {
      const targetX = x + col;
      const targetY = y + row;
      if (targetX < 0 || targetY < 0 || targetX >= matrixSize || targetY >= matrixSize) continue;
      const idx = coordsToIndex(targetX, targetY);
      pixelData[idx] = mode === 'erase' ? bgPicker.value : colorPicker.value;
    }
  }
  render();
}

function floodFill(startX, startY, newColor) {
  const idx = coordsToIndex(startX, startY);
  const targetColor = pixelData[idx];
  if (targetColor === newColor) return;
  const queue = [[startX, startY]];
  const visited = new Set();
  while (queue.length) {
    const [x, y] = queue.pop();
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    const i = coordsToIndex(x, y);
    if (pixelData[i] !== targetColor) continue;
    pixelData[i] = newColor;
    if (x > 0) queue.push([x - 1, y]);
    if (x < matrixSize - 1) queue.push([x + 1, y]);
    if (y > 0) queue.push([x, y - 1]);
    if (y < matrixSize - 1) queue.push([x, y + 1]);
  }
  render();
}

function sendFrame() {
  transport.sendFrame({
    pixels: pixelData,
    size: matrixSize,
    brightness: Number(brightnessSlider.value),
  });
}

const debouncedSend = debounce(sendFrame, 80);

canvas.addEventListener('pointerdown', evt => {
  isPointerDown = true;
  pushUndoState();
  const { x, y } = getCellFromEvent(evt);
  if (mode === 'fill') {
    floodFill(x, y, colorPicker.value);
    sendFrame();
  } else {
    applyBrush(x, y);
    debouncedSend();
  }
});

canvas.addEventListener('pointermove', evt => {
  if (!isPointerDown || mode === 'fill') return;
  const { x, y } = getCellFromEvent(evt);
  applyBrush(x, y);
  debouncedSend();
});

window.addEventListener('pointerup', () => {
  isPointerDown = false;
});

matrixSizeSelect.addEventListener('change', () => {
  matrixSize = Number(matrixSizeSelect.value);
  pushUndoState();
  pixelData = createPixelBuffer(matrixSize, bgPicker.value);
  render();
  sendFrame();
});

colorPicker.addEventListener('input', () => {
  if (mode === 'fill') return;
});

bgPicker.addEventListener('input', () => {
  pixelData = pixelData.map(() => bgPicker.value);
  render();
  sendFrame();
});

brushSizeInput.addEventListener('input', () => {
  brushSize = Number(brushSizeInput.value);
  brushSizeValue.textContent = `${brushSize} px`;
});

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    modeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
  });
});

undoBtn.addEventListener('click', () => {
  if (!undoStack.length) return;
  const prev = undoStack.pop();
  restoreFromState(prev);
});

clearBtn.addEventListener('click', () => {
  pushUndoState();
  pixelData = createPixelBuffer(matrixSize, bgPicker.value);
  render();
  sendFrame();
});

gridBtn.addEventListener('click', () => {
  showGrid = !showGrid;
  gridBtn.classList.toggle('active', showGrid);
  render();
});

brightnessSlider.addEventListener('input', () => {
  const pct = Math.round((brightnessSlider.value / 255) * 100);
  brightnessValue.textContent = `${pct}%`;
  debouncedSend();
});

connectBtn.addEventListener('click', async () => {
  const host = hostInput.value.trim();
  if (!host) return setStatus('Enter host', 'error');
  setStatus('Connecting…');
  try {
    await transport.connect(host);
    setStatus('Connected', 'connected');
    sendFrame();
  } catch (err) {
    console.error(err);
    setStatus('Failed to connect', 'error');
  }
});

const PRESET_KEY = 'lumi-canva-presets';

function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESET_KEY)) ?? [];
  } catch {
    return [];
  }
}

function savePresets(presets) {
  localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
}

function renderPresets() {
  const presets = loadPresets();
  presetList.innerHTML = '';
  if (!presets.length) {
    const empty = document.createElement('p');
    empty.className = 'text-slate-500';
    empty.textContent = 'No presets yet';
    presetList.appendChild(empty);
    return;
  }
  presets.forEach(({ id, name, data }) => {
    const node = presetTemplate.content.cloneNode(true);
    const loadBtn = node.querySelector('.preset__load');
    const deleteBtn = node.querySelector('.preset__delete');
    loadBtn.textContent = name;
    loadBtn.addEventListener('click', () => {
      matrixSize = data.size;
      matrixSizeSelect.value = String(data.size);
      pixelData = [...data.pixels];
      render();
      sendFrame();
    });
    deleteBtn.addEventListener('click', () => {
      const updated = loadPresets().filter(p => p.id !== id);
      savePresets(updated);
      renderPresets();
    });
    presetList.append(node);
  });
}

savePresetBtn.addEventListener('click', () => {
  const name = prompt('Preset name?');
  if (!name) return;
  const presets = loadPresets();
  presets.unshift({
    id: crypto.randomUUID(),
    name,
    data: {
      size: matrixSize,
      pixels: [...pixelData],
    },
  });
  savePresets(presets.slice(0, 20));
  renderPresets();
});

renderPresets();
render();

function createTransport() {
  const state = {
    host: '',
    ws: null,
    connected: false,
    queue: [],
  };

  const sendQueue = () => {
    if (!state.connected || !state.ws) return;
    while (state.queue.length) {
      state.ws.send(JSON.stringify(state.queue.shift()));
    }
  };

  const connect = host => {
    return new Promise((resolve, reject) => {
      const protocol = host.startsWith('http') ? host : `http://${host}`;
      state.host = protocol.replace(/\/?$/, '');
      const wsUrl = state.host.replace(/^http/, 'ws');
      const ws = new WebSocket(`${wsUrl}/ws`);
      ws.onopen = () => {
        state.ws = ws;
        state.connected = true;
        sendQueue();
        resolve();
      };
      ws.onmessage = event => {
        if (event.data === 'pong') return;
        console.log('[device]', event.data);
      };
      ws.onerror = () => {
        state.connected = false;
        state.ws = null;
        reject(new Error('WebSocket error'));
      };
      ws.onclose = () => {
        state.connected = false;
        state.ws = null;
      };
    });
  };

  const sendFrame = payload => {
    const body = JSON.stringify({
      type: 'frame',
      ...payload,
    });

    if (state.connected && state.ws?.readyState === WebSocket.OPEN) {
      state.ws.send(body);
      return;
    }

    state.queue.push({ type: 'frame', ...payload });
    fetch(`${state.host}/frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(err => console.warn('HTTP fallback failed', err));
  };

  return { connect, sendFrame };
}

function debounce(fn, delay = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
