/*
 * University of Abra Arena — ESP32 Turnstile Barrier Gate Controller
 * ------------------------------------------------------------------
 * Physical Hardware Interface for Sotero Gate Scanner (Web Serial API)
 *
 * Wiring Instructions:
 * - Servo Motor Signal: Pin 18 (PWM)
 * - Servo VCC: 5V external power supply (common GND with ESP32)
 * - Servo GND: GND
 * - Green LED / Buzzer: Pin 19
 * - Red Status LED: Pin 21
 */

#include <ESP32Servo.h>

Servo barrierServo;

const int SERVO_PIN = 18;
const int LED_GREEN_PIN = 19;
const int LED_RED_PIN = 21;

const int ANGLE_LOCKED = 0;   // Barrier Horizontal (CLOSED)
const int ANGLE_OPEN = 90;    // Barrier Vertical (OPEN)
const unsigned long AUTO_CLOSE_DELAY_MS = 5000; // 5 seconds open time

bool isGateOpen = false;
unsigned long gateOpenTimestamp = 0;

void setup() {
  Serial.begin(115200);
  
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  
  // Attach Servo motor
  ESP32PWM::allocateTimer(0);
  barrierServo.setPeriodHertz(50);
  barrierServo.attach(SERVO_PIN, 500, 2400);

  // Initial state: Gate Locked / Closed
  lockGate();
  Serial.println("ESP32_BARRIER_GATE_READY:115200");
}

void loop() {
  // Read Serial commands from Next.js Admin Scanner via USB
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input == "GATE:OPEN" || input == "OPEN") {
      openGate();
    } else if (input == "GATE:CLOSE" || input == "CLOSE") {
      lockGate();
    }
  }

  // Auto-close gate after 5 seconds timeout
  if (isGateOpen && (millis() - gateOpenTimestamp >= AUTO_CLOSE_DELAY_MS)) {
    lockGate();
  }
}

void openGate() {
  barrierServo.write(ANGLE_OPEN);
  digitalWrite(LED_GREEN_PIN, HIGH);
  digitalWrite(LED_RED_PIN, LOW);
  isGateOpen = true;
  gateOpenTimestamp = millis();
  Serial.println("STATUS:GATE_OPEN");
}

void lockGate() {
  barrierServo.write(ANGLE_LOCKED);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_RED_PIN, HIGH);
  isGateOpen = false;
  Serial.println("STATUS:GATE_LOCKED");
}
