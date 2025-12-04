# Lumi Canva

Lumi Canva is an interactive LED pixel-art canvas powered by ESP32 and WS2812B LEDs. Users can draw pixel art in real time via a web or mobile interface, save and load presets, adjust brightness, and optionally collaborate in multiplayer mode.

---

## Features

- Real-time pixel drawing on a 16×32 LED matrix  
- Web-based and mobile-friendly interface  
- Save, load, and clear artwork presets  
- Adjustable brightness control  
- Optional multiplayer drawing via WebSocket  
- Demo mode for educational visualization of pixel buffer and power usage

---

## Hardware Requirements

- ESP32 Dev Board  
- WS2812B LED matrix (recommended: 16×16)  
- 5V 5–10A power supply  
- 1000µF capacitor across power rails  
- 330Ω resistor on data line  
- Optional: enclosure for mounting and protection

---

## Software Requirements

- Arduino IDE or PlatformIO  
- FastLED or Adafruit NeoPixel library  
- ESPAsyncWebServer and WebSocket libraries  
- Web browser (Chrome, Firefox, Safari)  
- Optional: Flutter or React Native for mobile app

---

## Implementation Plan

1. **Hardware Assembly**  
   - Wire ESP32 to WS2812B LED matrix  
   - Add capacitor and resistor for stability  
   - Test power supply and LED initialization  

2. **Firmware Development**  
   - Initialize LED matrix and pixel buffer  
   - Implement web server and WebSocket communication  

3. **UI Design**  
   - Build grid-based drawing interface  
   - Add color palette, save/load/clear buttons  
   - Implement responsive layout for mobile and desktop  

4. **Testing & Debugging**  
   - Verify real-time rendering  
   - Test preset save/load functionality  

---

## Web App (Tailwind + Vanilla JS)

The `web` directory contains a lightweight Tailwind-powered frontend that can be flashed onto the ESP32 SPIFFS/LittleFS partition or hosted from any static server.

```
web/
├── index.html  # Tailwind UI scaffold loaded via CDN
├── style.css   # Small helper styles for custom chips
└── app.js      # Canvas drawing logic, presets, networking
```

### Running locally

1. Open `web/index.html` directly in a modern browser **or** serve the folder with any static server (e.g. `python -m http.server 8080`).
2. Enter the ESP32 host/IP (default `http://192.168.4.1`) and press **Connect**. The UI attempts a WebSocket connection at `/ws` and falls back to `POST /frame` for frame pushes.
3. Draw on the canvas, tweak brightness, and store presets (saved in `localStorage` for the current browser).

> Because Tailwind is loaded via the CDN Play build, no additional tooling or compilation is required.

