# Lumi Canva

Lumi Canva is an interactive LED pixel-art canvas powered by ESP32 and WS2812B LEDs. Users can draw pixel art in real time via a web or mobile interface, save and load presets, adjust brightness, and optionally collaborate in multiplayer mode.

---

## Features

- Real-time pixel drawing on a 16×16 LED matrix  
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

