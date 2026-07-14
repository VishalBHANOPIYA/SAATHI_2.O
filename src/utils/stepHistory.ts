import { getTodayKey } from './dailyTracker';

const HISTORY_KEY = 'saathi_step_history';

export interface DaySteps {
  date: string;     // YYYY-MM-DD
  steps: number;
  calories: number;
  distanceKm: number;
  goal: number;
  achieved: boolean;
}

export function saveStepHistory(
  data: DaySteps
): void {
  try {
    const history: DaySteps[] = JSON.parse(
      localStorage.getItem(HISTORY_KEY)
      || '[]'
    );
    // Remove old entry for same date
    const filtered = history.filter(
      h => h.date !== data.date
    );
    // Keep last 30 days only
    const updated = [data, ...filtered]
      .slice(0, 30);
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(updated)
    );
  } catch {}
}

export function getLast7DaysSteps():
  DaySteps[] {
  try {
    const history: DaySteps[] = JSON.parse(
      localStorage.getItem(HISTORY_KEY)
      || '[]'
    );
    const last7: DaySteps[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString()
        .split('T')[0];
      const found = history.find(
        h => h.date === dateStr
      );
      last7.push(found || {
        date: dateStr,
        steps: 0, calories: 0,
        distanceKm: 0, goal: 8000,
        achieved: false,
      });
    }
    return last7;
  } catch { return []; }
}

// Auto-save every midnight:
// Save today's steps to history,
// then reset for new day
export function midnightReset(
  currentSteps: number,
  currentCalories: number,
  distanceKm: number,
  goal: number
): void {
  saveStepHistory({
    date: getTodayKey(),
    steps: currentSteps,
    calories: currentCalories,
    distanceKm,
    goal,
    achieved: currentSteps >= goal,
  });
}
