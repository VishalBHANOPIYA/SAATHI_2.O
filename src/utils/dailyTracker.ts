const STORAGE_KEY = 'saathi_daily_tracker';

export interface DailyTrackerData {
  date: string;           // 'YYYY-MM-DD'
  steps: number;
  stepGoal: number;       // from health plan
  caloriesBurned: number; // from steps
  caloriesConsumed: number; // manual entry
  calorieGoal: number;    // from health plan
  waterGlasses: number;   // glasses drunk
  waterGoalGlasses: number; // from BMI calc
  waterGoalLiters: number;
  activeMinutes: number;
  activeMinuteGoal: number; // from exercise plan
  distanceKm: number;
  sleepHours: number;     // manual entry
  sleepGoal: number;      // from health plan
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function loadTodayTracker(
  defaults: Partial<DailyTrackerData>
): DailyTrackerData {
  try {
    const stored = localStorage.getItem(
      STORAGE_KEY
    );
    const parsed = stored
      ? JSON.parse(stored) : null;

    // Reset if different day
    if (parsed?.date !== getTodayKey()) {
      return {
        date: getTodayKey(),
        steps: 0,
        stepGoal: defaults.stepGoal || 8000,
        caloriesBurned: 0,
        caloriesConsumed: 0,
        calorieGoal: defaults.calorieGoal
          || 2000,
        waterGlasses: 0,
        waterGoalGlasses:
          defaults.waterGoalGlasses || 8,
        waterGoalLiters:
          defaults.waterGoalLiters || 2,
        activeMinutes: 0,
        activeMinuteGoal:
          defaults.activeMinuteGoal || 30,
        distanceKm: 0,
        sleepHours: 0,
        sleepGoal: defaults.sleepGoal || 7,
      };
    }
    // Merge with defaults for new fields
    return { 
      ...defaults,
      ...parsed, 
      date: parsed.date,
      steps: parsed.steps,
      waterGlasses: parsed.waterGlasses 
    };
  } catch {
    return {
      date: getTodayKey(),
      steps: 0,
      stepGoal: defaults.stepGoal || 8000,
      caloriesBurned: 0,
      caloriesConsumed: 0,
      calorieGoal: defaults.calorieGoal || 2000,
      waterGlasses: 0,
      waterGoalGlasses:
        defaults.waterGoalGlasses || 8,
      waterGoalLiters:
        defaults.waterGoalLiters || 2,
      activeMinutes: 0,
      activeMinuteGoal: 30,
      distanceKm: 0,
      sleepHours: 0,
      sleepGoal: 7,
    };
  }
}

export function saveTodayTracker(
  data: DailyTrackerData
): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch {}
}

// Step goal based on BMI
export function getStepGoalFromBMI(
  bmiCategory: string
): number {
  switch (bmiCategory) {
    case 'severely_underweight':
    case 'underweight':
      return 6000; // light activity
    case 'normal':
      return 8000; // WHO recommended
    case 'overweight':
      return 10000; // classic 10k goal
    case 'obese_1':
      return 7000;  // joint-safe start
    case 'obese_2':
      return 5000;  // start very gentle
    default:
      return 8000;
  }
}
