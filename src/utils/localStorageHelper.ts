export const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key);
    }
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
  }
  return null;
};

export const safeSetItem = (key: string, value: string): void => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
};

export const safeRemoveItem = (key: string): void => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.error(`Error removing ${key} from localStorage:`, e);
  }
};

export const safeClear = (): void => {
  try {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  } catch (e) {
    console.error("Error clearing localStorage:", e);
  }
};
