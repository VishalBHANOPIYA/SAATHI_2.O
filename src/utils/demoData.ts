export interface DemoVitalsEntry {
  date: string;
  heartRate: number;
  systolic: number;
  diastolic: number;
  oxygen: number;
  isDemo?: boolean;
}

export interface DemoRecordItem {
  id: number;
  title: string;
  date: string;
  category: string;
  doctor: string;
  notes: string;
  isDemo?: boolean;
}

export interface DemoMedicine {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  reminderTime: string;
  isDemo?: boolean;
}

export interface DemoPatientRecord {
  title: string;
  date: string;
  type?: string;
  riskBand?: "GREEN" | "YELLOW" | "RED";
  notes?: string;
}

export interface DemoPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  village: string;
  lastScreeningDate?: string;
  lastRiskBand?: "GREEN" | "YELLOW" | "RED";
  records: DemoPatientRecord[];
  isDemo?: boolean;
}

// 8 ASHA Patients across 3 villages
export const demoPatients: DemoPatient[] = [
  {
    id: "demo-p1",
    name: "Ramesh Patel",
    age: 58,
    gender: "Male",
    village: "Kharoi",
    lastScreeningDate: "2026-06-08",
    lastRiskBand: "RED",
    isDemo: true,
    records: [
      {
        title: "rPPG Contactless Vitals Scan",
        date: "2026-06-08",
        type: "Lab Test",
        riskBand: "RED",
        notes: "Heart Rate: 104 bpm | SpO2: 91% | Resp Rate: 24 bpm. Urgent follow-up recommended."
      },
      {
        title: "Hypertension Log",
        date: "2026-05-24",
        type: "Prescription",
        riskBand: "YELLOW",
        notes: "BP: 150/95 mmHg. Patient reporting mild headache."
      }
    ]
  },
  {
    id: "demo-p2",
    name: "Savita Devi",
    age: 62,
    gender: "Female",
    village: "Dhamadka",
    lastScreeningDate: "2026-06-07",
    lastRiskBand: "YELLOW",
    isDemo: true,
    records: [
      {
        title: "Anemia Camera Screening",
        date: "2026-06-07",
        type: "AI Screen",
        riskBand: "YELLOW",
        notes: "Detected moderate paleness in fingernails/lower eyelid. Index score: 38%. Advised iron-rich diet."
      }
    ]
  },
  {
    id: "demo-p3",
    name: "Devendra Vaghela",
    age: 45,
    gender: "Male",
    village: "Bhujodi",
    lastScreeningDate: "2026-06-09",
    lastRiskBand: "GREEN",
    isDemo: true,
    records: [
      {
        title: "rPPG Contactless Vitals Scan",
        date: "2026-06-09",
        type: "Lab Test",
        riskBand: "GREEN",
        notes: "Heart Rate: 72 bpm | SpO2: 98% | Resp Rate: 16 bpm. Stable."
      }
    ]
  },
  {
    id: "demo-p4",
    name: "Gita Ben",
    age: 38,
    gender: "Female",
    village: "Kharoi",
    lastScreeningDate: "2026-06-05",
    lastRiskBand: "GREEN",
    isDemo: true,
    records: [
      {
        title: "Jaundice Camera Screening",
        date: "2026-06-05",
        type: "AI Screen",
        riskBand: "GREEN",
        notes: "Sclera yellowness check. Yellowness index score: 8%. All clear."
      }
    ]
  },
  {
    id: "demo-p5",
    name: "Kamla Parmar",
    age: 70,
    gender: "Female",
    village: "Dhamadka",
    lastScreeningDate: "2026-06-04",
    lastRiskBand: "RED",
    isDemo: true,
    records: [
      {
        title: "Chest Pain Triage Report",
        date: "2026-06-04",
        type: "Emergency Guidance",
        riskBand: "RED",
        notes: "Symptom: Acute squeezing substernal pain radiating to left arm. High risk. Recommended immediate transport to CHC."
      }
    ]
  },
  {
    id: "demo-p6",
    name: "Arjun Solanki",
    age: 29,
    gender: "Male",
    village: "Bhujodi",
    lastScreeningDate: "2026-06-03",
    lastRiskBand: "YELLOW",
    isDemo: true,
    records: [
      {
        title: "Fever and Cough Triage Guidance",
        date: "2026-06-03",
        type: "Triage Guidance",
        riskBand: "YELLOW",
        notes: "Fever: 101.5 °F. Persistent cough. Suggesting hydration, paracetamol, and local clinic visit if fever stays >48 hours."
      }
    ]
  },
  {
    id: "demo-p7",
    name: "Babubhai Rathod",
    age: 65,
    gender: "Male",
    village: "Kharoi",
    lastScreeningDate: "2026-06-02",
    lastRiskBand: "YELLOW",
    isDemo: true,
    records: [
      {
        title: "Breathlessness Triage Guidance",
        date: "2026-06-02",
        type: "Triage Guidance",
        riskBand: "YELLOW",
        notes: "Shortness of breath on exertion, chronic history of asthma. Inhaler access checked. Advised rest."
      }
    ]
  },
  {
    id: "demo-p8",
    name: "Hansa Vankar",
    age: 52,
    gender: "Female",
    village: "Bhujodi",
    lastScreeningDate: "2026-06-01",
    lastRiskBand: "GREEN",
    isDemo: true,
    records: [
      {
        title: "rPPG Contactless Vitals Scan",
        date: "2026-06-01",
        type: "Lab Test",
        riskBand: "GREEN",
        notes: "Heart Rate: 68 bpm | SpO2: 97% | Resp Rate: 17 bpm. Stable."
      }
    ]
  }
];

// 4 Medicines
export const demoMedicines: DemoMedicine[] = [
  {
    id: "demo-m1",
    name: "Metoprolol Succinate",
    dose: "25 mg",
    frequency: "Once daily (1-0-0)",
    duration: "Ongoing",
    reminderTime: "08:00",
    isDemo: true
  },
  {
    id: "demo-m2",
    name: "Aspirin",
    dose: "75 mg",
    frequency: "Once daily (0-0-1)",
    duration: "Ongoing",
    reminderTime: "21:00",
    isDemo: true
  },
  {
    id: "demo-m3",
    name: "Amlodipine",
    dose: "5 mg",
    frequency: "Once daily (1-0-0)",
    duration: "Ongoing",
    reminderTime: "08:00",
    isDemo: true
  },
  {
    id: "demo-m4",
    name: "Paracetamol",
    dose: "500 mg",
    frequency: "As needed (Max 3/day)",
    duration: "5 days",
    reminderTime: "13:00",
    isDemo: true
  }
];

// 6-8 Screening/Vitals/Triage records for primary user profile
export const demoVitalsHistory: DemoVitalsEntry[] = [
  { date: "05-18", heartRate: 72, systolic: 120, diastolic: 80, oxygen: 98, isDemo: true },
  { date: "05-22", heartRate: 75, systolic: 121, diastolic: 81, oxygen: 99, isDemo: true },
  { date: "05-26", heartRate: 70, systolic: 119, diastolic: 79, oxygen: 97, isDemo: true },
  { date: "05-30", heartRate: 71, systolic: 120, diastolic: 80, oxygen: 98, isDemo: true },
  { date: "06-02", heartRate: 95, systolic: 135, diastolic: 88, oxygen: 94, isDemo: true }, // YELLOW readings
  { date: "06-04", heartRate: 73, systolic: 122, diastolic: 80, oxygen: 98, isDemo: true },
];

export const demoRecords: DemoRecordItem[] = [
  {
    id: 10001,
    title: "Anemia Camera Screening",
    date: "2026-05-18",
    category: "AI Screen",
    doctor: "Saathi Camera AI Scanner",
    notes: "Nail bed paleness check. Index score: 12%. Status: Low Risk. Advised regular healthy nutrition.",
    isDemo: true
  },
  {
    id: 10002,
    title: "Jaundice Camera Screening",
    date: "2026-05-20",
    category: "AI Screen",
    doctor: "Saathi Camera AI Scanner",
    notes: "Sclera yellow tone pixel calibration. Index score: 8%. Status: Low Risk.",
    isDemo: true
  },
  {
    id: 10003,
    title: "Triage Guidance: Fever & Persistent Cough",
    date: "2026-05-22",
    category: "Triage Guidance",
    doctor: "Saathi Offline AI Engine",
    notes: "Reported symptoms: high fever, coughing. Urgency: YELLOW (Consult doctor soon). Advised hydration.",
    isDemo: true
  },
  {
    id: 10004,
    title: "Cardiologist Consultation Prescription",
    date: "2026-05-26",
    category: "Prescription",
    doctor: "Dr. Ritu Patel (CHC)",
    notes: "Rx: Tab Metoprolol 25mg, Tab Aspirin 75mg. Advised regular blood pressure monitoring.",
    isDemo: true
  },
  {
    id: 10005,
    title: "rPPG Contactless Vitals Scan",
    date: "2026-06-02",
    category: "Lab Test",
    doctor: "Saathi Camera AI Scanner",
    notes: "Heart Rate: 95 bpm | SpO2: 94% | Resp Rate: 22 bpm. Risk Band: YELLOW.",
    isDemo: true
  },
  {
    id: 10006,
    title: "Triage Guidance: Squeezing Chest Pain",
    date: "2026-06-03",
    category: "Emergency Guidance",
    doctor: "Saathi Offline AI Engine",
    notes: "Reported symptoms: chest pain radiating to left arm. Urgency: RED (Emergency care needed). Instructed immediate transport.",
    isDemo: true
  }
];
