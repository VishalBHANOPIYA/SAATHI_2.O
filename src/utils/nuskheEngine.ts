import { Nuskha, nuskheList } from "../data/nuskhe";

export function findNuskhe(
  symptoms: string[],        // selected symptom chips
  transcript: string,        // voice transcript if any
  triageLevel: "GREEN" | "YELLOW" | "RED",
  language: string,          // 'en' | 'hi' | 'gu' | other
  bmiCategory?: string       // optional patient BMI category
): Nuskha[] {
  // 1. ONLY show nuskhe for GREEN or YELLOW triage (RED is empty)
  if (triageLevel === "RED") {
    return [];
  }

  const lowercaseText = (symptoms.join(" ") + " " + transcript).toLowerCase();

  // For YELLOW: if symptom keywords include serious indicators → skip nuskhe entirely
  if (triageLevel === "YELLOW") {
    const yellowSkipKeywords = [
      "chest",
      "breathing",
      "severe",
      "blood",
      "heart",
      "breathless",
      "chok",
      "bleed",
      "unbearable",
      "emergency",
      "hospital",
      "गंभीर",
      "छाती",
      "सांस",
      "खून",
      "दर्द"
    ];
    if (yellowSkipKeywords.some(kw => lowercaseText.includes(kw))) {
      return [];
    }
  }

  // Exclude serious alarm nuskhe, persistent advice, and BMI-specific ones from standard keyword matching
  const excludedIds = [48, 49, 98, 99, 100, 101, 102];

  const matched: { nuskha: Nuskha; score: number }[] = [];

  for (const n of nuskheList) {
    if (excludedIds.includes(n.id)) continue;

    let score = 0;
    for (const kw of n.symptoms) {
      const lowerKw = kw.toLowerCase();
      if (lowercaseText.includes(lowerKw)) {
        // Higher weight for exact keyword matching
        score += 1;
      }
    }

    if (score > 0) {
      matched.push({ nuskha: n, score });
    }
  }

  // Sort by match score descending
  matched.sort((a, b) => b.score - a.score);

  let results = matched.map(m => m.nuskha);

  // If no match found but we are in GREEN, let's suggest some general wellness ones (e.g. warm water, ginger tea, immunity)
  if (results.length === 0 && triageLevel === "GREEN") {
    // 91 (Immunity), 10 (Headache/Tea), 18 (Dry throat/Warm water)
    const generalIds = [91, 10, 18];
    results = nuskheList.filter(n => generalIds.includes(n.id));
  }

  // Limit based on triage
  if (triageLevel === "YELLOW") {
    results = results.slice(0, 2);
  } else {
    // GREEN: return top 3-5 (we take top 4)
    results = results.slice(0, 4);
  }

  // Prepend BMI-specific nuskhe if category matches
  if (bmiCategory) {
    const category = bmiCategory.toLowerCase();
    if (category === "overweight" || category === "obese_1" || category === "obese_2") {
      const weightNuskha = nuskheList.find(n => n.id === 101);
      if (weightNuskha && !results.some(r => r.id === 101)) {
        results.unshift(weightNuskha);
      }
    } else if (category === "underweight" || category === "severely_underweight") {
      const nutritionNuskha = nuskheList.find(n => n.id === 102);
      if (nutritionNuskha && !results.some(r => r.id === 102)) {
        results.unshift(nutritionNuskha);
      }
    }
  }

  // Always append nuskha #100 at the end
  const nuskha100 = nuskheList.find(n => n.id === 100);
  if (nuskha100) {
    // Deduplicate if already present (should not be since it was excluded)
    if (!results.some(r => r.id === 100)) {
      results.push(nuskha100);
    }
  }

  return results;
}

