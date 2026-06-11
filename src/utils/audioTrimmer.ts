function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function bufferToWav(buffer: AudioBuffer, startIndex: number, endIndex: number): Blob {
  const numOfChan = 1; // mono WAV
  const sampleRate = buffer.sampleRate;
  const format = 1; // raw PCM 16-bit
  const bitDepth = 16;
  
  const sampleLength = Math.max(0, endIndex - startIndex);
  const result = new Int16Array(sampleLength);
  
  // Extract mono channel data
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < sampleLength; i++) {
    const s = Math.max(-1, Math.min(1, channelData[startIndex + i]));
    result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const bufferLength = 44 + sampleLength * 2;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);
  
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleLength * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, sampleLength * 2, true);
  
  const offset = 44;
  for (let i = 0; i < sampleLength; i++) {
    view.setInt16(offset + i * 2, result[i], true);
  }
  
  return new Blob([view], { type: "audio/wav" });
}

export async function trimSilence(audioBlob: Blob, threshold = 0.012, paddingSec = 0.2): Promise<Blob> {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("AudioContext not supported, skipping silence trimming");
      return audioBlob;
    }
    
    const ctx = new AudioContextClass();
    let decodedBuffer: AudioBuffer;
    try {
      decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch (decodeErr) {
      console.warn("AudioContext decodeAudioData failed, returning original blob:", decodeErr);
      ctx.close();
      return audioBlob;
    }

    const channelData = decodedBuffer.getChannelData(0);
    const sampleRate = decodedBuffer.sampleRate;
    const length = channelData.length;
    
    // Find startIndex (first voice activity)
    let startIndex = 0;
    for (let i = 0; i < length; i++) {
      if (Math.abs(channelData[i]) > threshold) {
        startIndex = i;
        break;
      }
    }
    
    // Find endIndex (last voice activity)
    let endIndex = length - 1;
    for (let i = length - 1; i >= 0; i--) {
      if (Math.abs(channelData[i]) > threshold) {
        endIndex = i;
        break;
      }
    }
    
    // Fallback if silent or invalid bounds
    if (startIndex >= endIndex) {
      console.log("No speech activity detected above threshold. Keeping full audio.");
      ctx.close();
      return audioBlob;
    }
    
    // Apply padding to avoid clipping initial/final word parts
    const paddingSamples = Math.floor(paddingSec * sampleRate);
    startIndex = Math.max(0, startIndex - paddingSamples);
    endIndex = Math.min(length - 1, endIndex + paddingSamples);
    
    console.log(`Silence trimmed: original length = ${(length / sampleRate).toFixed(2)}s, trimmed length = ${((endIndex - startIndex) / sampleRate).toFixed(2)}s`);
    
    const wavBlob = bufferToWav(decodedBuffer, startIndex, endIndex);
    ctx.close();
    return wavBlob;
  } catch (err) {
    console.error("Silence trim failed:", err);
    return audioBlob;
  }
}
