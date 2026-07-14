// Step detection using accelerometer
// Algorithm: Peak detection on magnitude
// of acceleration vector

export interface StepData {
  steps: number;
  distanceKm: number;
  caloriesBurned: number;
  activeMinutes: number;
  cadence: number;          // steps per minute
  lastUpdated: number;      // timestamp
}

export interface StepCounterConfig {
  weightKg: number;
  heightCm: number;
  gender: string;
  sensitivity: 'low' | 'medium' | 'high';
}

// Stride length estimation
// Male: heightCm × 0.415 / 100 (meters)
// Female: heightCm × 0.413 / 100 (meters)
export function getStrideLength(
  heightCm: number,
  gender: string
): number {
  const factor = gender === 'Female'
    ? 0.413 : 0.415;
  return (heightCm * factor) / 100;
}

// Steps to distance
export function stepsToDistance(
  steps: number,
  strideM: number
): number {
  return Math.round(steps * strideM) / 1000;
  // returns km
}

// Steps to calories
// Formula: Calories = steps × 0.04
//   × weight adjustment factor
// More accurate: MET × weight × time
// Walking MET ≈ 3.5
// Time = steps / cadence (minutes)
export function stepsToCalories(
  steps: number,
  weightKg: number,
  cadence: number = 100
): number {
  if (steps === 0) return 0;
  // Average 0.04 kcal per step per kg/70
  const baseCalPerStep = 0.04;
  const weightFactor = weightKg / 70;
  return Math.round(
    steps * baseCalPerStep * weightFactor
  );
}

// Sensitivity thresholds
// (acceleration magnitude peak threshold)
const THRESHOLDS = {
  low: 12.0,      // fewer false positives
  medium: 10.5,   // balanced
  high: 9.0,      // more sensitive
};

// MAIN STEP DETECTOR CLASS
export class StepDetector {
  private steps = 0;
  private lastPeak = 0;
  private lastAccel = 0;
  private isRising = false;
  private peakValue = 0;
  private minStepInterval = 300; // ms (max 3 steps/sec)
  private lastStepTime = 0;
  private sensitivity: 'low'|'medium'|'high';
  private threshold: number;
  private config: StepCounterConfig;
  private onStep?: (data: StepData) => void;
  private startTime = Date.now();
  private listener?: (e: DeviceMotionEvent)
    => void;

  constructor(
    config: StepCounterConfig,
    onStep?: (data: StepData) => void
  ) {
    this.config = config;
    this.sensitivity = config.sensitivity
      || 'medium';
    this.threshold = THRESHOLDS[
      this.sensitivity
    ];
    this.onStep = onStep;
  }

  // Get current step data
  getData(): StepData {
    const strideM = getStrideLength(
      this.config.heightCm,
      this.config.gender
    );
    const elapsed = (Date.now() - this.startTime)
      / 60000; // minutes
    const cadence = elapsed > 0
      ? Math.round(this.steps / elapsed) : 0;

    return {
      steps: this.steps,
      distanceKm: stepsToDistance(
        this.steps, strideM
      ),
      caloriesBurned: stepsToCalories(
        this.steps,
        this.config.weightKg,
        cadence
      ),
      activeMinutes: Math.round(elapsed),
      cadence,
      lastUpdated: Date.now(),
    };
  }

  // Process one accelerometer reading
  private processAcceleration(
    x: number, y: number, z: number
  ): void {
    // Magnitude of acceleration vector
    const magnitude = Math.sqrt(
      x*x + y*y + z*z
    );

    // Smooth with simple running average
    const smoothed = (magnitude + this.lastAccel)
      / 2;
    this.lastAccel = smoothed;

    // Peak detection
    if (smoothed > this.peakValue) {
      this.peakValue = smoothed;
      this.isRising = true;
    } else if (
      this.isRising &&
      smoothed < this.peakValue - 1.5
    ) {
      // Falling after peak — potential step
      if (
        this.peakValue > this.threshold &&
        Date.now() - this.lastStepTime >
          this.minStepInterval
      ) {
        this.steps++;
        this.lastStepTime = Date.now();
        this.onStep?.(this.getData());
      }
      this.peakValue = smoothed;
      this.isRising = false;
    }
  }

  // Start listening to accelerometer
  async start(): Promise<boolean> {
    // iOS 13+ requires permission
    if (typeof DeviceMotionEvent !== 'undefined'
      && typeof (DeviceMotionEvent as any)
        .requestPermission === 'function') {
      try {
        const permission = await (
          DeviceMotionEvent as any
        ).requestPermission();
        if (permission !== 'granted')
          return false;
      } catch {
        return false;
      }
    }

    if (!window.DeviceMotionEvent)
      return false;

    this.listener = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (a?.x != null && a?.y != null
          && a?.z != null) {
        this.processAcceleration(
          a.x, a.y, a.z
        );
      }
    };

    window.addEventListener(
      'devicemotion', this.listener
    );
    this.startTime = Date.now();
    return true;
  }

  // Stop and clean up
  stop(): void {
    if (this.listener) {
      window.removeEventListener(
        'devicemotion', this.listener
      );
      this.listener = undefined;
    }
  }

  // Reset for new day
  reset(): void {
    this.steps = 0;
    this.startTime = Date.now();
    this.lastAccel = 0;
    this.peakValue = 0;
  }

  // Add steps manually
  // (for testing on desktop)
  addStepsManually(n: number): void {
    this.steps += n;
    this.onStep?.(this.getData());
  }
}
