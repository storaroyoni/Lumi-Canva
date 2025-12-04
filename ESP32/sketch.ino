/*
  Lumi Canva – ESP32 Backend Firmware
  Provides:
    - WS2812B LED matrix control
    - Wi-Fi setup (AP or STA mode)
    - WebSocket server for pixel updates, brightness, save/load/clear
*/

#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <Adafruit_NeoPixel.h>

#define MATRIX_WIDTH  16
#define MATRIX_HEIGHT 16
#define NUM_LEDS      (MATRIX_WIDTH * MATRIX_HEIGHT)
#define DATA_PIN      5       

#define WIFI_SSID     "LumiCanva"
#define WIFI_PASS     ""       
#define USE_AP_MODE   true   

// ================== LED ==================
Adafruit_NeoPixel strip(NUM_LEDS, DATA_PIN, NEO_GRB + NEO_KHZ800);

struct RGB { uint8_t r, g, b; };
RGB buffer[MATRIX_WIDTH][MATRIX_HEIGHT];
RGB preset[MATRIX_WIDTH][MATRIX_HEIGHT];
uint8_t brightness = 64; // 0-255

// ================== SERVER ==================
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// ================== UTIL ==================
uint16_t xyToIndex(uint16_t x, uint16_t y) {
  // Serpentine layout (adjust if yours is straight)
  if (y % 2 == 0) return y * MATRIX_WIDTH + x;
  else            return y * MATRIX_WIDTH + (MATRIX_WIDTH - 1 - x);
}

void render() {
  for (uint16_t y = 0; y < MATRIX_HEIGHT; y++) {
    for (uint16_t x = 0; x < MATRIX_WIDTH; x++) {
      uint16_t idx = xyToIndex(x, y);
      strip.setPixelColor(idx, strip.Color(buffer[x][y].r, buffer[x][y].g, buffer[x][y].b));
    }
  }
  strip.setBrightness(brightness);
  strip.show();
}

void clearCanvas() {
  for (uint16_t y = 0; y < MATRIX_HEIGHT; y++) {
    for (uint16_t x = 0; x < MATRIX_WIDTH; x++) {
      buffer[x][y] = {0, 0, 0};
    }
  }
  render();
}

void copyBuffer(RGB src[MATRIX_WIDTH][MATRIX_HEIGHT], RGB dst[MATRIX_WIDTH][MATRIX_HEIGHT]) {
  for (uint16_t y = 0; y < MATRIX_HEIGHT; y++)
    for (uint16_t x = 0; x < MATRIX_WIDTH; x++)
      dst[x][y] = src[x][y];
}

// ================== WEBSOCKET ==================
void broadcastJSON(const String& msg) {
  ws.textAll(msg);
}

void handleWSMessage(void* arg, uint8_t* data, size_t len) {
  AwsFrameInfo* info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    String msg = String((char*)data).substring(0, len);


    if (msg.startsWith("draw:")) {
      int p1 = msg.indexOf(':') + 1;
      int p2 = msg.indexOf(',', p1);
      int p3 = msg.indexOf(',', p2 + 1);
      int p4 = msg.indexOf(',', p3 + 1);
      int p5 = msg.indexOf(',', p4 + 1);

      int x = msg.substring(p1, p2).toInt();
      int y = msg.substring(p2 + 1, p3).toInt();
      int r = msg.substring(p3 + 1, p4).toInt();
      int g = msg.substring(p4 + 1, p5).toInt();
      int b = msg.substring(p5 + 1).toInt();

      if (x >= 0 && x < MATRIX_WIDTH && y >= 0 && y < MATRIX_HEIGHT) {
        buffer[x][y] = {(uint8_t)r, (uint8_t)g, (uint8_t)b};
        render();
        broadcastJSON(msg);
      }
    } else if (msg.startsWith("bright:")) {
      int val = msg.substring(msg.indexOf(':') + 1).toInt();
      brightness = constrain(val, 0, 255);
      render();
      broadcastJSON("bright:" + String(brightness));
    } else if (msg == "clear") {
      clearCanvas();
      broadcastJSON("clear");
    } else if (msg == "save") {
      copyBuffer(buffer, preset);
      broadcastJSON("saved");
    } else if (msg == "load") {
      copyBuffer(preset, buffer);
      render();
      broadcastJSON("loaded");
    }
  }
}

// ================== SETUP ==================
void setup() {
  Serial.begin(115200);
  delay(100);

  strip.begin();
  strip.setBrightness(brightness);
  clearCanvas();

  if (USE_AP_MODE) {
    WiFi.mode(WIFI_AP);
    WiFi.softAP(WIFI_SSID, WIFI_PASS);
    Serial.println("AP Mode SSID: " + String(WIFI_SSID));
    Serial.println("IP: " + WiFi.softAPIP().toString());
  } else {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
    Serial.println();
    Serial.print("IP: "); Serial.println(WiFi.localIP());
  }

  ws.onEvent([](AsyncWebSocket* server, AsyncWebSocketClient* client, AwsEventType type,
                void* arg, uint8_t* data, size_t len) {
    if (type == WS_EVT_CONNECT) {
      Serial.printf("WS connect: %u\n", client->id());
    } else if (type == WS_EVT_DISCONNECT) {
      Serial.printf("WS disconnect: %u\n", client->id());
    } else if (type == WS_EVT_DATA) {
      handleWSMessage(arg, data, len);
    }
  });
  server.addHandler(&ws);

  server.begin();
  Serial.println("Server started");
}

// ================== LOOP ==================
void loop() {
  // Async server handles everything
}
