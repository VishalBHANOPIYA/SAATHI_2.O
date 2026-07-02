# Saathi — AI Health Companion

Saathi (meaning *Companion* in Hindi) is a comprehensive, PWA-compatible, multilingual AI healthcare assistant designed to empower rural and underserved communities. By combining advanced camera heuristics, on-device algorithms, and state-of-the-art LLMs, Saathi provides non-invasive health screening, vital signs estimation, voice symptoms triage, and medication compliance management.

---

## 🚀 Live App & QR Code

- **Live URL**: [https://saathi-health.vercel.app](https://saathi-health.vercel.app)
- **Scan to Open on Mobile**: 

![Saathi QR Code](public/saathi-qr.png)

---

## 🌟 10 Core Features of Saathi

1. **First-Launch Onboarding & Health Profiling**
   An elegant onboarding experience detecting first-launch. Collects user profile metadata (age, gender, blood group, allergies, chronic conditions, and emergency contacts) in the user's preferred language.

2. **Multilingual Language System**
   Fully integrated across Hindi (हिंदी), Gujarati (ગુજરાતી), and English (en) with context-based translations for all screens, dialogs, buttons, and alerts.

3. **Camera-Based Non-Invasive AI Screening**
   Analyzes fingernail, eye, or skin photos utilizing advanced colorimetric analysis (L\*a\*b\* color space heuristics) and AI classification to screen for risk levels of Anemia and Jaundice without blood draws.

4. **rPPG Contactless Vital Signs**
   Measures Heart Rate (BPM), Blood Oxygen (SpO2), and estimates Blood Pressure (Systolic/Diastolic) using front/rear camera streams powered by a client-side CHROM (Chrominance) rPPG estimation framework.

5. **Voice-Powered AI Symptom Triage**
   Transcribes symptoms in English, Hindi, or Gujarati using OpenAI Whisper API. Analyzes symptom input with Llama-3.3-70b to evaluate clinical severity, ask follow-up questions, and assign a triage color tier (Red, Yellow, Green).

6. **Offline Client-Side Triage Fallback**
   If internet connection is lost, Saathi utilizes an on-device multilingual regex rule engine to parse red-flag keywords (e.g., chest pain, shortness of breath) and determine risk tiers entirely offline.

7. **Voice Output (Speech Synthesis / TTS)**
   Automatically speaks results and instructions aloud using browser Web Speech API with regional accent optimizations (`en-IN`, `hi-IN`, `gu-IN`), allowing low-literacy users to hear vital health warnings.

8. **Prescription Parsing & Medication Management**
   Supports snapping or uploading a prescription image. Extracts dosage, frequencies, and timings using a vision model, generates medicine reminder cards, and checks for potential drug-drug interactions.

9. **ASHA Worker Mode & Community Analytics**
   Provides a community mode for Accredited Social Health Activists (ASHA). Features multi-patient profiles, risk dashboard tracking across villages, ABHA Card linkage status, and community health statistics charts.

10. **System-wide Demo Mode & PDF Exporter**
    - **Demo Mode**: One-tap seeding of realistic patient records, medicine histories, and metrics for demonstration.
    - **Health Card Exporter**: One-click download of a professional, print-ready, branded A4 Health Card PDF summarizing user vitals, medications, and diagnoses.

11. **Nani-Dadi Ke Nuskhe (Traditional Home Remedies)**
    Integrates a culturally rich repository of traditional Indian home remedies (Nuskhe) triggered dynamically based on triage symptom matching for Low and Medium-risk conditions. Supports full localization (English, Hindi, and Gujarati) and displays key ingredients (like Tulsi, Ginger, Turmeric) alongside safety warnings.

---

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router), React, TypeScript
- **Styling**: TailwindCSS & Vanilla CSS
- **AI Core (via Groq API)**:
  - Triage/Prescription Parsing: `llama-3.3-70b-specdec` / `llama-4-scout` (vision)
  - Audio Transcription: `whisper-large-v3-turbo`
- **Vitals Processing**: HTML5 Canvas, MediaDevices API, CHROM rPPG chrominance algorithm
- **Diagnostic Heuristics**: CIELAB (L\*a\*b\*) Color Space Calibration
- **PDF Generation**: `jspdf`
- **Speech Synthesis**: Web Speech API (`SpeechSynthesis`)
- **PWA Capabilities**: Service Worker caching, offline compatibility, installable manifest

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

---

## 💻 Local Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/Saathi_2.O.git
   cd Saathi_2.O
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure env variables**:
   Create a `.env.local` file and paste your `GROQ_API_KEY`.

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build and test production locally**:
   ```bash
   npm run build
   ```

---

## 👥 Team E Mitra Members

- **Vishal Bhanopiya** — Lead AI Engineer & Developer
- **Team Name**: E Mitra

---

## ⚠️ Medical Disclaimer

**IMPORTANT**: Saathi is an AI-powered prototype designed for health screening, educational, and demonstration purposes only. It **does NOT** provide professional clinical diagnosis, treatment, or medical advice. The vital sign estimations and diagnostic heuristics do not replace clinical examinations. If you are experiencing a severe medical emergency, please seek immediate help from qualified healthcare professionals.
