let activeUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(
  text: string,
  lang: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    if (onError) onError(new Error("Speech synthesis not supported"));
    return;
  }

  // Stop any active speech first
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  activeUtterance = utterance;

  // Select suitable voice
  let voiceLang = "en-IN";
  if (lang === "hi") {
    voiceLang = "hi-IN";
  } else if (lang === "gu") {
    voiceLang = "gu-IN";
  }

  // Get all voices
  let voices = window.speechSynthesis.getVoices();
  
  const findVoice = () => {
    // 1. Match exact lang (e.g. hi-IN)
    let selected = voices.find(v => v.lang.toLowerCase() === voiceLang.toLowerCase());
    if (selected) return selected;

    // 2. Match base lang prefix (e.g. hi or gu)
    const baseLang = voiceLang.split('-')[0].toLowerCase();
    selected = voices.find(v => v.lang.toLowerCase().startsWith(baseLang));
    if (selected) return selected;

    // 3. Fallback to en-IN or any IN voice
    selected = voices.find(v => v.lang.toLowerCase() === "en-in") || voices.find(v => v.lang.toLowerCase().includes("in"));
    if (selected) return selected;

    // 4. Default to first available
    return voices[0] || null;
  };

  const attemptSpeak = () => {
    voices = window.speechSynthesis.getVoices();
    const voice = findVoice();
    if (voice) {
      utterance.voice = voice;
      // Use matching lang tag if voice is found
      utterance.lang = voice.lang;
    } else {
      utterance.lang = voiceLang;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
      if (onError) onError(e);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Chrome loads voices asynchronously
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      attemptSpeak();
      window.speechSynthesis.onvoiceschanged = null; // single trigger
    };
  } else {
    attemptSpeak();
  }
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}
