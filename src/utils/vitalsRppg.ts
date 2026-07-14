// rPPG Signal Processing and Vitals Estimation Heuristics

// Cooley-Tukey Radix-2 FFT
export function fft(re: number[], im: number[]): { re: number[]; im: number[] } {
  const n = re.length;
  if (n <= 1) return { re, im };

  const half = n / 2;
  const reEven = new Array(half);
  const imEven = new Array(half);
  const reOdd = new Array(half);
  const imOdd = new Array(half);

  for (let i = 0; i < half; i++) {
    reEven[i] = re[2 * i];
    imEven[i] = im[2 * i];
    reOdd[i] = re[2 * i + 1];
    imOdd[i] = im[2 * i + 1];
  }

  const even = fft(reEven, imEven);
  const odd = fft(reOdd, imOdd);

  const reResult = new Array(n);
  const imResult = new Array(n);

  for (let k = 0; k < half; k++) {
    const angle = (-2 * Math.PI * k) / n;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const tRe = odd.re[k] * cos - odd.im[k] * sin;
    const tIm = odd.re[k] * sin + odd.im[k] * cos;

    reResult[k] = even.re[k] + tRe;
    imResult[k] = even.im[k] + tIm;
    reResult[k + half] = even.re[k] - tRe;
    imResult[k + half] = even.im[k] - tIm;
  }

  return { re: reResult, im: imResult };
}

// Linear regression-based detrending
export function detrend(y: number[]): number[] {
  const n = y.length;
  if (n <= 1) return y;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += y[i];
    sumXY += i * y[i];
    sumXX += i * i;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  const slope = (sumXY - n * meanX * meanY) / (sumXX - n * meanX * meanX);
  const intercept = meanY - slope * meanX;

  return y.map((val, idx) => val - (slope * idx + intercept));
}

// Linear Interpolation for Resampling unevenly spaced signals onto a targetFs grid
export function resampleSignal(times: number[], signal: number[], targetFs: number): number[] {
  if (times.length < 2) return [];
  const t0 = times[0];
  const tLast = times[times.length - 1];
  const totalDurationMs = tLast - t0;
  const dt = 1000 / targetFs; // Step size in milliseconds
  const numPoints = Math.floor(totalDurationMs / dt);
  const resampled: number[] = [];

  let rawIdx = 0;
  for (let j = 0; j < numPoints; j++) {
    const tj = t0 + j * dt;
    while (rawIdx < times.length - 2 && times[rawIdx + 1] < tj) {
      rawIdx++;
    }
    const tA = times[rawIdx];
    const tB = times[rawIdx + 1];
    const vA = signal[rawIdx];
    const vB = signal[rawIdx + 1];

    if (tB === tA) {
      resampled.push(vA);
    } else {
      const factor = (tj - tA) / (tB - tA);
      resampled.push(vA + factor * (vB - vA));
    }
  }
  return resampled;
}

// Apply Hanning Window to reduce spectral leakage
export function applyHanningWindow(signal: number[]): number[] {
  const n = signal.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    out[i] = signal[i] * w;
  }
  return out;
}

// CHROM method on normalized RGB signals
// X = 3R - 2G, Y = 1.5R + G - 1.5B
// S = X - (std(X)/std(Y))*Y
export function computeChromSignal(R: number[], G: number[], B: number[]): number[] {
  const n = R.length;
  if (n === 0) return [];

  const meanR = R.reduce((s, v) => s + v, 0) / n;
  const meanG = G.reduce((s, v) => s + v, 0) / n;
  const meanB = B.reduce((s, v) => s + v, 0) / n;

  const R_norm = R.map(v => (meanR > 0 ? v / meanR : 0));
  const G_norm = G.map(v => (meanG > 0 ? v / meanG : 0));
  const B_norm = B.map(v => (meanB > 0 ? v / meanB : 0));

  const X = new Array(n);
  const Y = new Array(n);

  for (let i = 0; i < n; i++) {
    X[i] = 3 * R_norm[i] - 2 * G_norm[i];
    Y[i] = 1.5 * R_norm[i] + G_norm[i] - 1.5 * B_norm[i];
  }

  const meanX = X.reduce((s, v) => s + v, 0) / n;
  const meanY = Y.reduce((s, v) => s + v, 0) / n;

  const varX = X.reduce((s, v) => s + Math.pow(v - meanX, 2), 0) / n;
  const varY = Y.reduce((s, v) => s + Math.pow(v - meanY, 2), 0) / n;

  const stdX = Math.sqrt(varX);
  const stdY = Math.sqrt(varY);

  const ratio = stdY > 0.0001 ? stdX / stdY : 1.0;
  const S = new Array(n);
  for (let i = 0; i < n; i++) {
    S[i] = X[i] - ratio * Y[i];
  }

  return S;
}

export interface WindowResult {
  hr: number;
  br: number;
  snr: number;
  isValid: boolean;
}

// Compute HR, BR, and SNR over a specific resampled window
export function estimateVitalsForWindow(
  R: number[],
  G: number[],
  B: number[],
  fs: number
): WindowResult {
  const n = R.length;
  if (n < 32) {
    return { hr: 0, br: 0, snr: 0, isValid: false };
  }

  // Calculate CHROM
  const S = computeChromSignal(R, G, B);
  const detrended = detrend(S);
  const windowed = applyHanningWindow(detrended);

  // Pad to next power of 2 (min 64 points for FFT resolution)
  const fftLen = Math.max(64, Math.pow(2, Math.ceil(Math.log2(n))));
  const re = new Array(fftLen).fill(0);
  const im = new Array(fftLen).fill(0);
  for (let i = 0; i < n; i++) {
    re[i] = windowed[i];
  }

  const fftResult = fft(re, im);

  // Compute Magnitudes
  const halfLen = fftLen / 2;
  const magnitudes = new Array(halfLen);
  for (let i = 0; i < halfLen; i++) {
    magnitudes[i] = Math.sqrt(
      fftResult.re[i] * fftResult.re[i] + fftResult.im[i] * fftResult.im[i]
    );
  }

  // Search for Heart Rate Peak in 0.7 - 4.0 Hz band (42 - 240 BPM)
  let maxMagHR = -1;
  let peakBinHR = -1;
  for (let k = 1; k < halfLen; k++) {
    const freq = (k * fs) / fftLen;
    if (freq >= 0.7 && freq <= 4.0) {
      if (magnitudes[k] > maxMagHR) {
        maxMagHR = magnitudes[k];
        peakBinHR = k;
      }
    }
  }

  const hrFreq = peakBinHR !== -1 ? (peakBinHR * fs) / fftLen : 1.2; // default 72 bpm
  const hr = hrFreq * 60;

  // Compute SNR for HR peak
  // SNR = Power in peak band (peakFreq +- 0.2Hz) / Power in rest of [0.7, 4.0] Hz
  let peakPower = 0;
  let noisePower = 0;
  for (let k = 1; k < halfLen; k++) {
    const freq = (k * fs) / fftLen;
    if (freq >= 0.7 && freq <= 4.0) {
      const power = magnitudes[k] * magnitudes[k];
      if (Math.abs(freq - hrFreq) <= 0.20) {
        peakPower += power;
      } else {
        noisePower += power;
      }
    }
  }

  const snr = noisePower > 0 ? peakPower / noisePower : 100;

  // Search for Breathing Rate Peak in 0.1 - 0.5 Hz band (6 - 30 BPM)
  let maxMagBR = -1;
  let peakBinBR = -1;
  for (let k = 1; k < halfLen; k++) {
    const freq = (k * fs) / fftLen;
    if (freq >= 0.1 && freq <= 0.5) {
      if (magnitudes[k] > maxMagBR) {
        maxMagBR = magnitudes[k];
        peakBinBR = k;
      }
    }
  }

  const brFreq = peakBinBR !== -1 ? (peakBinBR * fs) / fftLen : 0.267; // default 16 bpm
  const br = brFreq * 60;

  // physiologically impossible bounds clamp checks done at aggregator level
  return { hr, br, snr, isValid: true };
}
