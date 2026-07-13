export type Nuskha = {
  id: number;
  symptoms: string[];      // keywords to match
  condition: string;       // display name
  remedy: string;          // the remedy instruction
  ingredients: string[];   // key ingredients
  emoji: string;           // visual icon
  warning?: string;        // optional caution note
  language: {
    hi: string;            // Hindi remedy text
    en: string;            // English remedy text
    gu: string;            // Gujarati remedy text
  }
};

export const nuskheList: Nuskha[] = [
  {
    id: 1,
    symptoms: ["pet dard", "stomach pain", "abdomen", "stomach ache", "पेट दर्द"],
    condition: "Stomach Pain / Pet Dard",
    remedy: "Chew ajwain with a pinch of salt and drink warm water.",
    ingredients: ["ajwain", "warm water"],
    emoji: "🍵",
    language: {
      hi: "अजवाइन को एक चुटकी नमक के साथ चबाएं और गुनगुना पानी पिएं।",
      en: "Chew carom seeds (ajwain) with a pinch of salt and drink warm water.",
      gu: "અજમો એક ચપટી મીઠા સાથે ચાવીને ગરમ પાણી પીઓ."
    }
  },
  {
    id: 2,
    symptoms: ["gas", "bloating", "pet me gas", "acidity gas", "गैस"],
    condition: "Gas & Bloating",
    remedy: "Take ajwain with black salt (kala namak) and warm water.",
    ingredients: ["ajwain", "kala namak", "warm water"],
    emoji: "🥛",
    language: {
      hi: "अजवाइन और काला नमक मिलाकर गुनगुने पानी के साथ लें।",
      en: "Mix carom seeds (ajwain) and black salt with warm water.",
      gu: "અજમો અને સંચળ મિક્સ કરીને નવશેકા પાણી સાથે લો."
    }
  },
  {
    id: 3,
    symptoms: ["pet me chale", "mouth ulcers", "stomach sores", "mouth ulcer", "छाले"],
    condition: "Mouth Ulcers / Stomach Sores",
    remedy: "Drink fennel (saunf) and rock sugar (mishri) soaked water overnight.",
    ingredients: ["saunf", "mishri"],
    emoji: "🍶",
    language: {
      hi: "सौंफ और मिश्री को रात भर पानी में भिगोकर सुबह वह पानी पिएं।",
      en: "Drink water in which fennel and rock sugar were soaked overnight.",
      gu: "વરિયાળી અને સાકર રાત્રે પાણીમાં પલાળી સવારે તે પાણી પીઓ."
    }
  },
  {
    id: 4,
    symptoms: ["mild fever", "halka bukhar", "low grade fever", "fever", "बुखार"],
    condition: "Mild Fever / Halka Bukhar",
    remedy: "Apply cold wet cloth on forehead and take plenty of rest.",
    ingredients: ["cold water", "wet cloth"],
    emoji: "🌡️",
    language: {
      hi: "माथे पर ठंडे पानी की पट्टियां रखें और पर्याप्त आराम करें।",
      en: "Place a cold wet cloth on the forehead and rest.",
      gu: "કપાળ પર ઠંડા પાણીના પટા મૂકો અને આરામ કરો."
    }
  },
  {
    id: 5,
    symptoms: ["rain soaked", "bheeg gaye", "wet in rain", "drenched"],
    condition: "Rain Soaked / Drenched",
    remedy: "Drink warm milk with turmeric (haldi वाला doodh).",
    ingredients: ["turmeric", "milk"],
    emoji: "🥛",
    language: {
      hi: "गुनगुने दूध में हल्दी मिलाकर पिएं।",
      en: "Drink warm milk mixed with turmeric powder.",
      gu: "ગરમ દૂધમાં હળદર ઉમેરીને પીઓ."
    }
  },
  {
    id: 6,
    symptoms: ["sore throat", "gala kharab", "throat pain", "gala kharash", "गला खराब"],
    condition: "Sore Throat / Gala Kharab",
    remedy: "Gargle with warm salt water 2-3 times a day.",
    ingredients: ["warm water", "salt"],
    emoji: "🥛",
    language: {
      hi: "गुनगुने पानी में नमक डालकर गरारे करें।",
      en: "Gargle with warm salt water.",
      gu: "નવશેકા પાણીમાં મીઠું નાખીને કોગળા કરો."
    }
  },
  {
    id: 7,
    symptoms: ["dry cough", "sukhi khansi", "cough", "dry cough", "खांसी"],
    condition: "Dry Cough / Sukhi Khansi",
    remedy: "Mix honey and ginger juice and lick slowly.",
    ingredients: ["honey", "ginger"],
    emoji: "🍯",
    language: {
      hi: "शहद और अदरक का रस मिला कर चाटें।",
      en: "Mix honey and ginger juice and lick slowly.",
      gu: "મધ અને આદુનો રસ મિક્સ કરીને ચાટો."
    }
  },
  {
    id: 8,
    symptoms: ["wet cough", "balgam", "phlegm", "balgam wali khansi", "कफ"],
    condition: "Wet Cough / Balgam Wali Khansi",
    remedy: "Drink warm decoction (kadha) of tulsi and black pepper.",
    ingredients: ["tulsi", "black pepper"],
    emoji: "🌿",
    language: {
      hi: "तुलसी और काली मिर्च का काढ़ा पिएं।",
      en: "Drink a decoction of tulsi and black pepper.",
      gu: "તુલસી અને કાળા મરીનો કાઢો પીઓ."
    }
  },
  {
    id: 9,
    symptoms: ["blocked nose", "naak band", "congestion", "nasal block", "नाक बंद"],
    condition: "Blocked Nose / Naak Band",
    remedy: "Inhale steam with mint (pudina) or carom (ajwain) seeds.",
    ingredients: ["steam", "mint", "ajwain"],
    emoji: "💨",
    language: {
      hi: "पुदीने की पत्तियों या अजवाइन के साथ गर्म पानी की भाप लें।",
      en: "Inhale steam from hot water infused with mint leaves or carom seeds.",
      gu: "ફુદીનો અથવા અજમો નાખીને ગરમ પાણીની વરાળ લો."
    }
  },
  {
    id: 10,
    symptoms: ["headache", "sir dard", "head pain", "सिर दर्द"],
    condition: "Headache / Sir Dard",
    remedy: "Drink warm ginger tea (adrak chai) and take rest in a quiet room.",
    ingredients: ["ginger", "tea", "rest"],
    emoji: "☕",
    language: {
      hi: "अदरक वाली गर्म चाय पिएं और शांत कमरे में आराम करें।",
      en: "Drink hot ginger tea and rest in a quiet room.",
      gu: "આદુવાળી ગરમ ચા પીઓ અને શાંત રૂમમાં આરાम કરો."
    }
  },
  {
    id: 11,
    symptoms: ["body pain", "badan dard", "body ache", "badan me dard", "शरीर दर्द"],
    condition: "Body Pain / Badan Dard",
    remedy: "Drink warm turmeric milk before sleeping and rest.",
    ingredients: ["milk", "turmeric"],
    emoji: "🥛",
    language: {
      hi: "सोने से पहले हल्दी वाला गर्म दूध पिएं और भरपूर नींद लें।",
      en: "Drink warm turmeric milk before bedtime and get good sleep.",
      gu: "સુતા પહેલા હળદરવાળું ગરમ દૂધ પીઓ અને આરામ કરો."
    }
  },
  {
    id: 12,
    symptoms: ["constipation", "kabz", "hard stool", "कब्ज"],
    condition: "Constipation / Kabz",
    remedy: "Drink warm milk with one spoon of organic ghee at night.",
    ingredients: ["warm milk", "ghee"],
    emoji: "🥛",
    language: {
      hi: "रात को सोने से पहले गुनगुने दूध में एक चम्मच घी मिलाकर पिएं।",
      en: "Drink a cup of warm milk with a teaspoon of ghee at night.",
      gu: "રાત્રે સૂતી વખતે ગરમ દૂધમાં એક ચમચી ઘી મેળવીને પીઓ."
    }
  },
  {
    id: 13,
    symptoms: ["acidity", "acidity ho rahi", "heartburn", "acid reflux", "एसिडिटी"],
    condition: "Acidity / Seene me Jalan",
    remedy: "Chew raw fennel seeds (saunf) slowly or drink cold water.",
    ingredients: ["saunf", "cold water"],
    emoji: "🌿",
    language: {
      hi: "भोजन के बाद सौंफ चबाएं या ठंडे पानी के घूंट लें।",
      en: "Chew raw fennel seeds slowly or sip cold water.",
      gu: "જમ્યા પછી વરિયાળી ચાવો અથવા ઠંડું પાણી પીઓ."
    }
  },
  {
    id: 14,
    symptoms: ["nausea", "ulti jaisi feeling", "nauseous", "queasy", "जी मिचलाना"],
    condition: "Nausea / Ulti Jaisi Feeling",
    remedy: "Keep a small piece of fresh ginger in your mouth and suck it.",
    ingredients: ["ginger"],
    emoji: "🫚",
    language: {
      hi: "अदरक का एक छोटा टुकड़ा मुंह में रखकर धीरे-धीरे चूसें।",
      en: "Keep a small piece of fresh ginger in the mouth and suck it.",
      gu: "આદુનો એક નાનો ટુકડો મોંમાં રાખીને ધીમે ધીમે ચૂસો."
    }
  },
  {
    id: 15,
    symptoms: ["bad breath", "muh se badbu", "smelly mouth", "halitosis"],
    condition: "Bad Breath / Muh ki Badbu",
    remedy: "Chew 1-2 cloves (laung) or cardamom (elaichi) after meals.",
    ingredients: ["cloves", "laung", "cardamom"],
    emoji: "🌱",
    language: {
      hi: "भोजन के बाद १-२ लौंग या इलायची चबाएं।",
      en: "Chew 1 or 2 cloves or cardamom seeds after meals.",
      gu: "જમ્યા પછી ૧-૨ લવિંગ અથવા એલચી ચાવો."
    }
  },
  {
    id: 16,
    symptoms: ["mouth ulcers", "muh me chhale", "ulcers in mouth", "chhale"],
    condition: "Mouth Ulcers / Muh me Chhale",
    remedy: "Apply raw honey directly on the ulcers 2-3 times a day.",
    ingredients: ["honey"],
    emoji: "🍯",
    language: {
      hi: "छालों पर सीधे शहद लगाएं और थोड़ी देर रहने दें।",
      en: "Apply raw honey directly on the ulcers.",
      gu: "ચાંદા પર સીધું મધ લગાવો."
    }
  },
  {
    id: 17,
    symptoms: ["hiccups", "hichki", "frequent hiccups", "हिचकी"],
    condition: "Hiccups / Hichki",
    remedy: "Drink slow, continuous sips of cold water.",
    ingredients: ["water"],
    emoji: "💧",
    language: {
      hi: "ठंडे पानी के छोटे-छोटे घूंट धीरे-धीरे पिएं।",
      en: "Take slow, continuous sips of cold water.",
      gu: "ઠંડા પાણીના ધીમે ધીમે ઘૂંટડા પીઓ."
    }
  },
  {
    id: 18,
    symptoms: ["dry throat", "gala sukh raha", "throat dry", "गला सूखना"],
    condition: "Dry Throat / Gala Sukhna",
    remedy: "Sip warm water continuously or suck a small candy/honey.",
    ingredients: ["warm water", "honey"],
    emoji: "🍯",
    language: {
      hi: "गुनगुना पानी लगातार पीते रहें या थोड़ा शहद लें।",
      en: "Sip warm water continuously or take a small spoonful of honey.",
      gu: "નવશેકું પાણી પીતા રહો અથવા મધ ચાટો."
    }
  },
  {
    id: 19,
    symptoms: ["eye irritation", "aankhon me jalan", "eyes burning", "itching eyes", "आंखों में जलन"],
    condition: "Eye Irritation",
    remedy: "Wash eyes with clean, cold water splashes.",
    ingredients: ["cold water"],
    emoji: "👁️",
    language: {
      hi: "आंखों को साफ और ठंडे पानी के छींटों से धोएं।",
      en: "Wash your eyes by splashing clean, cold water.",
      gu: "આંખોને સાફ અને ઠંડા પાણીથી સાફ કરો."
    }
  },
  {
    id: 20,
    symptoms: ["tired eyes", "aankhen thak gayi", "eyestrain", "eye fatigue"],
    condition: "Tired Eyes",
    remedy: "Place fresh cucumber slices on closed eyelids for 10 minutes.",
    ingredients: ["cucumber slices"],
    emoji: "🥒",
    language: {
      hi: "आंखें बंद करके उन पर खीरे के टुकड़े १० मिनट के लिए रखें।",
      en: "Place cucumber slices over closed eyes for 10 minutes.",
      gu: "બંધ આંખો પર કાકડીના ટુકડા ૧૦ મિનિટ માટે રાખો."
    }
  },
  {
    id: 21,
    symptoms: ["small cut", "choti si chot", "minor cut", "scratch", "कट"],
    condition: "Minor Cut / Choti Chot",
    remedy: "Wash with clean water, apply antiseptic cream, and cover if needed.",
    ingredients: ["water", "antiseptic"],
    emoji: "🩹",
    language: {
      hi: "घाव को साफ पानी से धोएं, एंटीसेप्टिक क्रीम लगाएं और साफ पट्टी बांधें।",
      en: "Wash the cut with clean water, apply antiseptic, and bandage if needed.",
      gu: "ઘાને સાફ પાણીથી ધોઈ, એન્ટિસેપ્ટિક ક્રીમ લગાવો."
    }
  },
  {
    id: 22,
    symptoms: ["minor burn", "choti si jalan", "small burn", "जलना"],
    condition: "Minor Burn",
    remedy: "Keep under cold running water for 10 minutes. Do not apply ice.",
    ingredients: ["cold running water"],
    emoji: "💧",
    language: {
      hi: "प्रभावित हिस्से को बहते ठंडे पानी के नीचे १० मिनट रखें। बर्फ न लगाएं।",
      en: "Keep under cool running tap water for 10 minutes. Do not apply ice.",
      gu: "બળેલા ભાગને ૧૦ મિનિટ વહેતા ઠંડા પાણી નીચે રાખો. બરફ ન લગાવો."
    }
  },
  {
    id: 23,
    symptoms: ["mosquito bite", "machhar ne kaat liya", "bug bite", "itchy bite", "मच्छर काटना"],
    condition: "Mosquito Bite / Machhar Kaatna",
    remedy: "Apply fresh aloe vera gel on the bite to soothe itching.",
    ingredients: ["aloe vera gel"],
    emoji: "🌱",
    language: {
      hi: "खुजली शांत करने के लिए प्रभावित जगह पर एलोवेरा जेल लगाएं।",
      en: "Apply fresh aloe vera gel on the bite to reduce itching.",
      gu: "ખંજવાળ ઓછી કરવા માટે એલોવેરા જેલ લગાવો."
    }
  },
  {
    id: 24,
    symptoms: ["ankle sprain", "moch", "sprain", "joint sprain", "मोच"],
    condition: "Ankle Sprain / Moch",
    remedy: "Apply ice pack for 15 minutes, keep the ankle elevated and rest.",
    ingredients: ["ice pack", "rest"],
    emoji: "🧊",
    language: {
      hi: "१५ मिनट के लिए बर्फ से सिकाई करें, पैर को ऊंचाई पर रखें और आराम दें।",
      en: "Apply an ice pack for 15 minutes, keep the ankle elevated, and rest.",
      gu: "૧૫ મિનિટ બરફનો શેક કરો, પગ ઊંચો રાખો અને આરામ કરો."
    }
  },
  {
    id: 25,
    symptoms: ["cold hands feet", "haath pair thande", "cold extremities", "chilly hands"],
    condition: "Cold Hands & Feet",
    remedy: "Drink hot ginger tea and wear warm socks.",
    ingredients: ["ginger tea", "socks"],
    emoji: "🧦",
    language: {
      hi: "अदरक की गर्म चाय पिएं और पैरों में ऊनी मोजे पहनें।",
      en: "Sip hot ginger tea and keep warm by wearing socks.",
      gu: "આદુની ગરમ ચા પીઓ અને ગરમ મોજા પહેરો."
    }
  },
  {
    id: 26,
    symptoms: ["no appetite", "bhook nahi", "low appetite", "poor appetite", "भूख न लगना"],
    condition: "Low Appetite / Bhookh Kami",
    remedy: "Eat ginger juliennes with a drop of lemon juice and black salt.",
    ingredients: ["ginger", "lemon juice", "black salt"],
    emoji: "🍋",
    language: {
      hi: "भोजन से पहले अदरक के लच्छों पर नींबू और काला नमक लगाकर खाएं।",
      en: "Chew fresh ginger slices with lemon juice and black salt before meals.",
      gu: "જમતા પહેલા આદુની કતરણ પર લીંબુ અને સંચળ નાખીને ચાવો."
    }
  },
  {
    id: 27,
    symptoms: ["bloated stomach", "pet phool gaya", "bloated", "full stomach", "पेट फूलना"],
    condition: "Bloated Stomach / Jeera Pani",
    remedy: "Drink jeera (cumin) water. Boil 1 tsp cumin seeds in water.",
    ingredients: ["jeera", "water"],
    emoji: "🍵",
    language: {
      hi: "जीरे का पानी पिएं। एक गिलास पानी में एक चम्मच जीरा उबालकर छान लें।",
      en: "Drink warm cumin (jeera) water by boiling seeds in water.",
      gu: "જીરાનું પાણી પીઓ. એક ચમચી જીરું પાણીમાં ઉકાળીને પીઓ."
    }
  },
  {
    id: 28,
    symptoms: ["poor digestion", "digestion kharab", "weak digestion", "indigestion", "अपच"],
    condition: "Poor Digestion",
    remedy: "Drink water boiled with cumin (jeera) and fennel (saunf) seeds.",
    ingredients: ["jeera", "saunf"],
    emoji: "🍵",
    language: {
      hi: "जीरा और सौंफ को पानी में उबालकर गुनगुना पिएं।",
      en: "Sip warm water boiled with cumin and fennel seeds.",
      gu: "જીરું અને વરિયાળી પાણીમાં ઉકાળીને નવશેકું પીઓ."
    }
  },
  {
    id: 29,
    symptoms: ["lost voice", "gala baith gaya", "hoarse voice", "hoarseness", "गला बैठना"],
    condition: "Lost Voice / Gala Baithna",
    remedy: "Chew a small piece of mulethi (licorice root) or drink mulethi tea.",
    ingredients: ["mulethi", "licorice"],
    emoji: "🪵",
    language: {
      hi: "मुलेठी का एक छोटा टुकड़ा चूसें या मुलेठी की चाय पिएं।",
      en: "Suck on a small piece of mulethi (licorice root) or drink mulethi tea.",
      gu: "જેઠીમધનો નાનો ટુકડો મોંમાં રાખી ચૂસો."
    }
  },
  {
    id: 30,
    symptoms: ["heavy voice", "awaaz bhaari", "thick voice", "throat congestion"],
    condition: "Heavy Voice / Awaaz Bhaari",
    remedy: "Drink warm tulsi tea with honey twice a day.",
    ingredients: ["tulsi", "honey"],
    emoji: "🌿",
    language: {
      hi: "दिन में दो बार शहद मिलाकर गुनगुनी तुलसी की चाय पिएं।",
      en: "Drink warm basil (tulsi) tea with honey twice daily.",
      gu: "દિવસમાં બે વાર મધ સાથે તુલસીની ગરમ ચા પીઓ."
    }
  },
  {
    id: 31,
    symptoms: ["cold", "sardi", "common cold", "cough and cold", "सर्दी"],
    condition: "Common Cold / Sardi",
    remedy: "Drink ginger, tulsi, and black pepper kadha warm.",
    ingredients: ["ginger", "tulsi", "black pepper"],
    emoji: "🌿",
    language: {
      hi: "अदरक, तुलसी और काली मिर्च का गर्म काढ़ा बनाकर पिएं।",
      en: "Prepare a warm herbal decoction of ginger, tulsi, and black pepper.",
      gu: "આદુ, તુલસી અને કાળા મરીનો ગરમ કાઢો પીઓ."
    }
  },
  {
    id: 32,
    symptoms: ["runny nose", "zukam", "running nose", "cold sneezing", "जुकाम"],
    condition: "Runny Nose / Zukam",
    remedy: "Inhale warm steam and drink warm water throughout the day.",
    ingredients: ["steam", "warm water"],
    emoji: "💨",
    language: {
      hi: "गर्म पानी की भाप लें और दिन भर गुनगुना पानी पिएं।",
      en: "Inhale warm steam and keep yourself hydrated with warm water.",
      gu: "ગરમ વરાળ લો અને આખો દિવસ નવશેકું પાણી પીતા રહो."
    }
  },
  {
    id: 33,
    symptoms: ["weakness", "kamzori", "general weakness", "low energy", "कमजोरी"],
    condition: "Weakness / Kamzori",
    remedy: "Eat 2-3 dates boiled in milk daily.",
    ingredients: ["dates", "khajoor", "milk"],
    emoji: "🥛",
    language: {
      hi: "रोजाना दूध में २-३ खजूर उबालकर खाएं और वह दूध पिएं।",
      en: "Boil 2 or 3 dates in a glass of milk and consume daily.",
      gu: "રોજ દૂધમાં ૨-૩ ખજૂર ઉકાળીને ખાઓ."
    }
  },
  {
    id: 34,
    symptoms: ["fatigue", "thakan", "tiredness", "exhausted", "थकान"],
    condition: "Fatigue / Thakan",
    remedy: "Drink fresh coconut water to restore minerals and energy.",
    ingredients: ["coconut water"],
    emoji: "🥥",
    language: {
      hi: "खनिज और ऊर्जा बहाल करने के लिए ताजा नारियल पानी पिएं।",
      en: "Drink fresh coconut water to replenish minerals and regain energy.",
      gu: "તાજું નાળિયેર પાણી પીઓ જેથી એનર્જી મળે."
    }
  },
  {
    id: 35,
    symptoms: ["dehydration", "extreme thirst", "dry lips dehydration", "निर्जलीकरण"],
    condition: "Dehydration Support",
    remedy: "Drink ORS solution or homemade fresh lemonade (nimbu pani) with salt.",
    ingredients: ["ORS", "lemonade", "nimbu pani"],
    emoji: "🍋",
    language: {
      hi: "ओआरएस का घोल लें या नमक मिलाकर ताजा नींबू पानी पिएं।",
      en: "Drink WHO-ORS solution or fresh homemade lemonade with salt and sugar.",
      gu: "ઓઆરએસ પાણી અથવા મીઠા સાથે લીંબુ શરબત પીઓ."
    }
  },
  {
    id: 36,
    symptoms: ["loose motion", "diarrhea", "loose stools", "pet kharab", "दस्त"],
    condition: "Loose Motion / Diarrhea",
    remedy: "Eat ripe banana with fresh curd (dahi) or thin buttermilk (chach) with cumin.",
    ingredients: ["banana", "curd", "dahi"],
    emoji: "🥣",
    language: {
      hi: "दही के साथ पका हुआ केला खाएं या जीरे वाली छाछ पिएं।",
      en: "Eat a ripe banana with yogurt, or drink buttermilk with cumin powder.",
      gu: "દહીં સાથે પાકેલું કેળું ખાઓ અથવા જીરાવાળી છાશ પીઓ."
    }
  },
  {
    id: 37,
    symptoms: ["stomach cramps", "pet me marod", "cramps in abdomen", "मरोड़"],
    condition: "Stomach Cramps / Marod",
    remedy: "Apply warm paste of hing (asafoetida) and water around the navel.",
    ingredients: ["hing", "warm water"],
    emoji: "🧼",
    language: {
      hi: "हींग में थोड़ा गुनगुना पानी मिलाकर नाभि के आसपास लेप लगाएं।",
      en: "Mix asafoetida (hing) with warm water to make a paste and apply around navel.",
      gu: "હિંગમાં થોડું પાણી મેળવી નાભિની આસપાસ લેપ કરો."
    }
  },
  {
    id: 38,
    symptoms: ["bitter taste", "muh kadwa", "bad mouth taste", "metallic taste"],
    condition: "Bitter Taste / Muh Kadwa",
    remedy: "Drink fresh lemonade (nimbu pani) with a pinch of rock salt.",
    ingredients: ["lemon", "rock salt"],
    emoji: "🍋",
    language: {
      hi: "सेंधा नमक मिलाकर ताजा नींबू पानी पिएं।",
      en: "Drink fresh lemonade prepared with a pinch of rock salt.",
      gu: "સંચળ નાખીને લીંબુ પાણી પીઓ."
    }
  },
  {
    id: 39,
    symptoms: ["hand burn", "haath jal gaya", "burn on hand"],
    condition: "Hand Burn Care",
    remedy: "Immediately hold the hand under cool running water. Do not apply grease.",
    ingredients: ["cool water"],
    emoji: "💧",
    language: {
      hi: "हाथ को तुरंत नल के ठंडे पानी के नीचे रखें। तेल या घी न लगाएं।",
      en: "Hold the burned area under cool running tap water immediately.",
      gu: "બળેલા હાથને તાત્કાલિક વહેતા ઠંડા પાણી નીચે રાખો."
    }
  },
  {
    id: 40,
    symptoms: ["foot pain", "pair dard", "legs ache", "foot tiredness", "पैर दर्द"],
    condition: "Foot Pain / Pair Dard",
    remedy: "Soak your feet in warm water mixed with rock salt (sindhav namak) for 15 mins.",
    ingredients: ["warm water", "rock salt"],
    emoji: "🧼",
    language: {
      hi: "सेंधा नमक मिले गुनगुने पानी में १५ मिनट के लिए पैर डुबोकर रखें।",
      en: "Soak feet in warm water mixed with rock salt (Epsom/rock salt) for 15 minutes.",
      gu: "નવશેકા પાણીમાં સિંધાલૂણ મીઠું નાખી ૧૫ મિનિટ પગ પલાળી રાખો."
    }
  },
  {
    id: 41,
    symptoms: ["insomnia", "neend nahi", "sleeplessness", "sleep disorder", "नींद न आना"],
    condition: "Sleeplessness / Insomnia",
    remedy: "Drink a cup of warm milk with turmeric or nutmeg before sleeping.",
    ingredients: ["warm milk", "nutmeg", "turmeric"],
    emoji: "🥛",
    language: {
      hi: "सोने से पहले एक कप हल्दी या जायफल वाला गर्म दूध पिएं।",
      en: "Drink a warm cup of milk with turmeric or nutmeg powder before bed.",
      gu: "રાત્રે સૂતા પહેલા જાયફળ વાળું ગરમ દૂધ પીઓ."
    }
  },
  {
    id: 42,
    symptoms: ["stress", "tension", "anxiety mild", "nervousness", "तनाव"],
    condition: "Stress Relief / Tension",
    remedy: "Drink warm chamomile tea or holy basil (tulsi) tea and practice breathing.",
    ingredients: ["chamomile tea", "tulsi chai"],
    emoji: "☕",
    language: {
      hi: "गर्म तुलसी या कैमोमाइल चाय पिएं और गहरी सांस लेने का अभ्यास करें।",
      en: "Drink warm chamomile or tulsi tea and practice deep breathing.",
      gu: "તુલસીની ગરમ ચા પીઓ અને ઊંડા શ્વાસ લો."
    }
  },
  {
    id: 43,
    symptoms: ["dizziness", "chakkar", "feeling dizzy", "lightheadedness", "चक्कर"],
    condition: "Dizziness / Chakkar",
    remedy: "Slowly drink a glass of water and sit down immediately.",
    ingredients: ["water", "rest"],
    emoji: "🪑",
    language: {
      hi: "तुरंत बैठ जाएं और एक गिलास पानी धीरे-धीरे घूंट लेकर पिएं।",
      en: "Sit down immediately and slowly drink a glass of water.",
      gu: "તરત જ બેસી જાઓ અને ધીમે ધીમે પાણી પીઓ."
    }
  },
  {
    id: 44,
    symptoms: ["anemia signs", "khoon ki kami", "low hemoglobin", "pale skin anemia", "खून की कमी"],
    condition: "Anemia / Khoon ki Kami",
    remedy: "Drink fresh beetroot and pomegranate (anar) juice daily.",
    ingredients: ["beetroot", "pomegranate juice"],
    emoji: "🥤",
    language: {
      hi: "रोजाना ताजे चुकंदर और अनार का जूस पिएं।",
      en: "Drink fresh beetroot and pomegranate juice daily.",
      gu: "રોજ બીટ અને દાડમનો જ્યુસ પીઓ."
    }
  },
  {
    id: 45,
    symptoms: ["low immunity", "frequent infection", "weak immunity"],
    condition: "Immunity Boost",
    remedy: "Eat one fresh Indian gooseberry (amla) daily or take amla juice.",
    ingredients: ["amla", "gooseberry"],
    emoji: "🟢",
    language: {
      hi: "रोजाना एक आंवला खाएं या आंवले का रस गुनगुने पानी के साथ लें।",
      en: "Eat one fresh Indian gooseberry (amla) daily or drink amla juice.",
      gu: "રોજ એક આમળું ખાઓ અથવા આમળાનો રસ લો."
    }
  },
  {
    id: 46,
    symptoms: ["throat irritation", "gala me kharash", "tickly throat", "cough scratchy", "गले में खराश"],
    condition: "Throat Irritation",
    remedy: "Take one spoon honey mixed with a pinch of freshly ground black pepper.",
    ingredients: ["honey", "black pepper"],
    emoji: "🍯",
    language: {
      hi: "एक चम्मच शहद में पिसी हुई काली मिर्च मिलाकर धीरे-धीरे लें।",
      en: "Consume one spoon of honey mixed with a pinch of ground black pepper.",
      gu: "એક ચમચી મધમાં કાળા મરીનો પાવડર મેળવી ચાટો."
    }
  },
  {
    id: 47,
    symptoms: ["stomach worms", "pet me keede", "mild worms suspicion"],
    condition: "Worms Alert",
    remedy: "Home remedies are not sufficient for worms; consult a physician.",
    ingredients: ["doctor consultation"],
    emoji: "👨‍⚕️",
    warning: "Consult a doctor for appropriate deworming medications.",
    language: {
      hi: "कृमि संक्रमण के लिए घरेलू उपचार काफी नहीं हैं; डॉक्टर से संपर्क करें।",
      en: "Home remedies are not curative for worm infections; consult a doctor.",
      gu: "કૃમિના ઉપચાર માટે ડૉક્ટરનો સંપર્ક કરવો જરૂરી છે."
    }
  },
  {
    id: 48,
    symptoms: ["breathing difficulty", "breathlessness", "shortness of breath", "chest tightness", "सांस फूलना"],
    condition: "Breathing Difficulty",
    remedy: "Do NOT use home remedies. Seek emergency medical care immediately.",
    ingredients: ["emergency care"],
    emoji: "🚨",
    warning: "RED ALERT: Worsening breathlessness requires urgent emergency support.",
    language: {
      hi: "घरेलू नुस्खे न आजमाएं। तुरंत आपातकालीन चिकित्सा सहायता लें।",
      en: "Do NOT rely on home remedies. Seek emergency medical attention immediately.",
      gu: "ઘરેલું નુસ્ખા ન વાપરો. તાત્કાલિક તબીબી સારવાર મેળવો."
    }
  },
  {
    id: 49,
    symptoms: ["high fever", "high fever >102F", "severe fever", "तेज बुखार"],
    condition: "High Fever (>102°F)",
    remedy: "Do NOT wait. Sponge with normal water and consult a doctor immediately.",
    ingredients: ["medical consult", "sponging"],
    emoji: "🏥",
    warning: "RED ALERT: High fever requires urgent evaluation by a healthcare provider.",
    language: {
      hi: "देरी न करें। सामान्य पानी से बदन पोंछें और तुरंत डॉक्टर से मिलें।",
      en: "Do NOT delay. Sponge with normal tap water and consult a doctor immediately.",
      gu: "મોડું ન કરો. શરીર પર સામાન્ય પાણીના પોતા મૂકો અને તુરંત જ ડૉક્ટરને બતાવો."
    }
  },
  {
    id: 50,
    symptoms: ["persistent fever 3 days", "fever not going", "long fever"],
    condition: "Persistent Fever (3+ Days)",
    remedy: "This requires pathological tests. Consult a doctor for diagnostic advice.",
    ingredients: ["diagnostic tests"],
    emoji: "🏥",
    warning: "YELLOW ALERT: Fever lasting >3 days could indicate malaria, dengue, etc. Consult doctor.",
    language: {
      hi: "रक्त जांच की आवश्यकता हो सकती है। डॉक्टर से मिलकर बुखार का कारण पता करें।",
      en: "Pathological investigations may be needed. Consult a doctor immediately.",
      gu: "લોહીની તપાસની જરૂર પડી શકે છે. ડૉક્ટરની સલાહ લો."
    }
  },
  {
    id: 51,
    symptoms: ["stomach burning", "pet me jalan", "burning sensation stomach", "अम्लता"],
    condition: "Stomach Burning / Pet me Jalan",
    remedy: "Drink a cup of cold milk or drink cold saunf (fennel) seed water.",
    ingredients: ["cold milk", "saunf water"],
    emoji: "🥛",
    language: {
      hi: "एक कप ठंडा दूध पिएं या सौंफ का ठंडा पानी पिएं।",
      en: "Drink a cup of cold milk or cold fennel seed infused water.",
      gu: "ઠંડું દૂધ અથવા વરિયાળીનું પાણી પીઓ."
    }
  },
  {
    id: 52,
    symptoms: ["indigestion", "khana hazam nahi", "acid indigestion", "बदहजमी"],
    condition: "Indigestion",
    remedy: "Chew half a teaspoon of fennel seeds (saunf) after your meals.",
    ingredients: ["saunf"],
    emoji: "🌿",
    language: {
      hi: "भोजन करने के तुरंत बाद आधा चम्मच सौंफ चबाएं।",
      en: "Chew half a teaspoon of fennel seeds (saunf) after eating.",
      gu: "જમ્યા પછી અડધી ચમચી વરિયાળી ચાવો."
    }
  },
  {
    id: 53,
    symptoms: ["heavy stomach", "pet bhaari", "stomach heaviness", "bloated stomach"],
    condition: "Stomach Heaviness / Pet Bhaari",
    remedy: "Drink water boiled with half tsp cumin (jeera) and half tsp carom (ajwain).",
    ingredients: ["jeera", "ajwain"],
    emoji: "🍵",
    language: {
      hi: "आधा चम्मच जीरा और आधा चम्मच अजवाइन पानी में उबालकर छानकर पिएं।",
      en: "Drink warm water boiled with cumin and carom seeds.",
      gu: "જીરું અને અજમો ઉકાળીને ગરમ પાણી પીઓ."
    }
  },
  {
    id: 54,
    symptoms: ["vomiting", "ulti", "throwing up", "vomit", "उल्टी"],
    condition: "Vomiting / Ulti",
    remedy: "Sip lemon juice mixed with black salt and cold water.",
    ingredients: ["lemon", "black salt", "water"],
    emoji: "🍋",
    language: {
      hi: "नींबू के रस में काला नमक मिलाकर ठंडे पानी के छोटे-छोटे घूंट लें।",
      en: "Sip lemon juice mixed with a pinch of black salt and water.",
      gu: "લીંબુ પાણીમાં સંચળ મેળવી ધીમે ધીમે પીઓ."
    }
  },
  {
    id: 55,
    symptoms: ["throat pain", "gala me dard", "painful swallow", "गले में दर्द"],
    condition: "Throat Pain / Gala me Dard",
    remedy: "Suck a small piece of mulethi (licorice) root or gargle with warm water.",
    ingredients: ["mulethi"],
    emoji: "🪵",
    language: {
      hi: "मुलेठी का एक छोटा टुकड़ा मुंह में रखकर चूसें।",
      en: "Suck on a small piece of mulethi (licorice root) to soothe pain.",
      gu: "જેઠીમધનો ટુકડો ચુસવો."
    }
  },
  {
    id: 56,
    symptoms: ["throat swelling", "gala me sujan", "swollen tonsils", "throat inflammation"],
    condition: "Throat Swelling",
    remedy: "Gargle with warm water mixed with turmeric and rock salt.",
    ingredients: ["turmeric", "rock salt", "warm water"],
    emoji: "🥛",
    language: {
      hi: "हल्दी और सेंधा नमक मिले गुनगुने पानी से गरारे करें।",
      en: "Gargle with warm water mixed with turmeric and rock salt.",
      gu: "હળદર અને સિંધાલૂણ મીઠાવાળા પાણીના કોગળા કરો."
    }
  },
  {
    id: 57,
    symptoms: ["night cough worse", "coughing at night", "night cough"],
    condition: "Night Cough Support",
    remedy: "Consume one teaspoon of honey before going to sleep.",
    ingredients: ["honey"],
    emoji: "🍯",
    language: {
      hi: "सोने से पहले एक चम्मच शहद का सेवन करें।",
      en: "Consume a teaspoon of raw honey right before bed.",
      gu: "રાત્રે સૂતા પહેલા એક ચમચી મધ ચાટો."
    }
  },
  {
    id: 58,
    symptoms: ["runny nose cold", "common cold runny nose"],
    condition: "Runny Nose & Cold",
    remedy: "Drink freshly brewed warm ginger tea two times a day.",
    ingredients: ["ginger tea"],
    emoji: "☕",
    language: {
      hi: "दिन में दो बार ताजा बनी अदरक की गर्म चाय पिएं।",
      en: "Drink freshly prepared warm ginger tea twice daily.",
      gu: "દિવસમાં બે વાર આદુની ગરમ ચા પીઓ."
    }
  },
  {
    id: 59,
    symptoms: ["frequent sneezing", "sneezing", " छींक"],
    condition: "Frequent Sneezing",
    remedy: "Keep drinking sips of warm water continuously throughout the day.",
    ingredients: ["warm water"],
    emoji: "💧",
    language: {
      hi: "पूरे दिन गुनगुना पानी थोड़ी-थोड़ी देर में पीते रहें।",
      en: "Keep drinking sips of warm water at regular intervals.",
      gu: "આખો દિવસ નવશેકું પાણી ઘૂંટડે-ઘૂંટડે પીતા રહો."
    }
  },
  {
    id: 60,
    symptoms: ["headache from fatigue", "stress headache", "tired head"],
    condition: "Tiredness Headache",
    remedy: "Apply cold damp cloth on forehead, close your eyes and rest.",
    ingredients: ["cold damp cloth", "rest"],
    emoji: "🛌",
    language: {
      hi: "माथे पर ठंडी गीली पट्टी रखें, आंखें बंद करें और विश्राम करें।",
      en: "Place a cold damp cloth on the forehead, close your eyes and rest.",
      gu: "કપાળ પર ઠંડો રૂમાલ મૂકી આંખો બંધ કરી સૂઈ જાઓ."
    }
  },
  {
    id: 61,
    symptoms: ["under-eye puffiness", "puffy eyes", "eye bags"],
    condition: "Puffy Eyes / Under-Eye Bags",
    remedy: "Place cold used tea bags over closed eyelids for 10 minutes.",
    ingredients: ["used tea bags"],
    emoji: "☕",
    language: {
      hi: "इस्तेमाल की गई ठंडी चाय की थैलियों (टी बैग्स) को आंखों पर १० मिनट रखें।",
      en: "Place chilled, used tea bags over closed eyes for 10 minutes.",
      gu: "વપરાયેલી ઠંડી ચાની બેગ્સ આંખો પર ૧૦ મિનિટ રાખો."
    }
  },
  {
    id: 62,
    symptoms: ["dust in eyes", "dust eye irritation", "foreign body eye"],
    condition: "Dust in Eyes",
    remedy: "Rinse eyes gently with plenty of clean normal water. Do not rub.",
    ingredients: ["clean water"],
    emoji: "👁️",
    language: {
      hi: "आंखों को साफ पानी से धीरे-धीरे धोएं। आंखों को रगड़ें नहीं।",
      en: "Rinse eyes gently with clean water. Strictly avoid rubbing.",
      gu: "આંખોને સાફ પાણીથી ધોઈ નાખો. ઘસવું નહીં."
    }
  },
  {
    id: 63,
    symptoms: ["chapped lips", "hoth phat gaye", "dry lips", "होंठ फटना"],
    condition: "Chapped Lips / Dry Lips",
    remedy: "Apply a thin layer of pure desi ghee or coconut oil on lips.",
    ingredients: ["desi ghee", "coconut oil"],
    emoji: "🥥",
    language: {
      hi: "होठों पर शुद्ध देसी घी या नारियल का तेल लगाएं।",
      en: "Apply pure clarified butter (ghee) or coconut oil on your lips.",
      gu: "હોઠ પર દેશી ઘી અથવા કોકોનટ ઓઇલ લગાવો."
    }
  },
  {
    id: 64,
    symptoms: ["dry skin", "twacha dry", "dry body skin", "रूखी त्वचा"],
    condition: "Dry Skin Care",
    remedy: "Massage dry areas with virgin coconut oil after taking a bath.",
    ingredients: ["coconut oil"],
    emoji: "🥥",
    language: {
      hi: "नहाने के बाद सूखी त्वचा पर नारियल तेल से मालिश करें।",
      en: "Massage dry skin areas with pure coconut oil after bathing.",
      gu: "નાહ્યા પછી સૂકી ત્વચા પર કોકોનટ ઓઇલથી માલિશ કરો."
    }
  },
  {
    id: 65,
    symptoms: ["lip sores", "honton par chhale", "lip ulcer"],
    condition: "Lip Sores / Honton ke Chhale",
    remedy: "Apply raw organic honey on the sores 3-4 times a day.",
    ingredients: ["honey"],
    emoji: "🍯",
    language: {
      hi: "होठों के छालों पर दिन में ३-४ बार शुद्ध शहद लगाएं।",
      en: "Dab raw honey on the lip sores several times a day.",
      gu: "હોઠ પરના ચાંદા પર દિવસમાં ૩-૪ વાર મધ લગાવો."
    }
  },
  {
    id: 66,
    symptoms: ["rough hands", "dry hands", "hands skin rough"],
    condition: "Rough Hands Care",
    remedy: "Apply mixture of glycerin and rose water (gulab jal) before sleep.",
    ingredients: ["glycerin", "rose water"],
    emoji: "🌹",
    language: {
      hi: "रात को सोने से पहले ग्लिसरीन और गुलाब जल का मिश्रण हाथों पर लगाएं।",
      en: "Apply a mixture of glycerin and rose water on your hands before sleep.",
      gu: "રાત્રે સૂતા પહેલા ગ્લિસરીન અને ગુલાબજળ લગાવો."
    }
  },
  {
    id: 67,
    symptoms: ["cracked heels", "ediyan phat gayi", "dry heels", "एड़ी फटना"],
    condition: "Cracked Heels / Ediyan Phatna",
    remedy: "Massage heels with warm mustard oil and wear cotton socks overnight.",
    ingredients: ["mustard oil", "socks"],
    emoji: "🧦",
    language: {
      hi: "गुनगुने सरसों तेल से मालिश करें और रात भर सूती मोजे पहनें।",
      en: "Massage heels with warm mustard oil and wear socks overnight.",
      gu: "રાત્રે ગરમ રાઈના તેલની માલિશ કરી સુતરાઉ મોજા પહેરી રાખો."
    }
  },
  {
    id: 68,
    symptoms: ["burning feet", "pairon me jalan", "feet burning", "sole burning", "तलवों में जलन"],
    condition: "Burning Feet / Pairon me Jalan",
    remedy: "Soak your feet in cold water for 10-15 minutes or apply aloe vera.",
    ingredients: ["cold water", "aloe vera"],
    emoji: "💧",
    language: {
      hi: "पैर के तलवों को ठंडे पानी में १०-१५ मिनट रखें या एलोवेरा लगाएं।",
      en: "Soak feet in cool water for 15 minutes or apply fresh aloe vera gel.",
      gu: "પગના તળિયાને ઠંડા પાણીમાં ૧૦-૧૫ મિનિટ પલાળો."
    }
  },
  {
    id: 69,
    symptoms: ["too much sun", "dhoop me zyada ghoomna", "sun exposure", "sunburn mild"],
    condition: "Sun Exposure Care",
    remedy: "Drink plenty of water, ORS or fresh salted lemonade.",
    ingredients: ["water", "nimbu pani"],
    emoji: "🍋",
    language: {
      hi: "खूब पानी पिएं, ओआरएस का घोल या शिकंजी का सेवन करें।",
      en: "Rehydrate by drinking water, ORS, or salted lemonade.",
      gu: "પુષ્કળ પાણી પીઓ, ઓઆરએસ અથવા લીંબુ શરબત લો."
    }
  },
  {
    id: 70,
    symptoms: ["heat stroke", "loo", "loo lag gayi", "sunstroke", "लू लगना"],
    condition: "Heat Stroke / Loo Support",
    remedy: "Drink raw mango juice (aam panna) and drink fresh onion juice.",
    ingredients: ["raw mango panna", "onion juice"],
    emoji: "🥭",
    language: {
      hi: "कच्चे आम का पन्ना पिएं और प्याज का रस तलवों पर मलें।",
      en: "Drink raw mango juice (aam panna) and keep body cool.",
      gu: "કાચી કેરીનો બાફલો (આમ પન્ના) પીઓ."
    }
  },
  {
    id: 71,
    symptoms: ["heat discomfort", "garmi me ghabrahat", "sweat discomfort"],
    condition: "Heat Discomfort Support",
    remedy: "Drink fresh coconut water or barley (jau) water to cool down.",
    ingredients: ["coconut water", "jau water"],
    emoji: "🥥",
    language: {
      hi: "शरीर को ठंडा करने के लिए नारियल पानी या जौ का पानी पिएं।",
      en: "Drink coconut water or barley water to lower internal body heat.",
      gu: "શરીર ઠંડુ રાખવા નાળિયેર પાણી અથવા જવનું પાણી પીઓ."
    }
  },
  {
    id: 72,
    symptoms: ["excessive sweating", "too much sweat", "sweating heavily"],
    condition: "Excessive Sweating Support",
    remedy: "Drink water mixed with a pinch of salt and sugar (ORS) to refill salts.",
    ingredients: ["salt sugar water", "ORS"],
    emoji: "🥤",
    language: {
      hi: "नमक-चीनी का पानी या ओआरएस पिएं ताकि शरीर में लवण बने रहें।",
      en: "Drink water mixed with salt and sugar or ORS to replace lost electrolytes.",
      gu: "મીઠા-ખાંડવાળું પાણી અથવા ઓઆરએસ પીઓ."
    }
  },
  {
    id: 73,
    symptoms: ["hand foot pain", "limb pain", "body ache mild"],
    condition: "Hand & Foot Pain Relief",
    remedy: "Massage limbs with warm sesame (til) or mustard (sarso) oil.",
    ingredients: ["warm oil", "sesame oil"],
    emoji: "🧴",
    language: {
      hi: "गुनगुने तिल या सरसों के तेल से हाथ-पैरों की मालिश करें।",
      en: "Massage the painful limbs with warm mustard or sesame oil.",
      gu: "હળવા ગરમ તલ કે રાઈના તેલથી માલિश કરો."
    }
  },
  {
    id: 74,
    symptoms: ["stiff neck", "gardan akad gayi", "neck stiffness", "neck pain mild", "गर्दन अकड़ना"],
    condition: "Stiff Neck / Gardan Akadna",
    remedy: "Apply a warm compress or heat pack for 10-15 minutes.",
    ingredients: ["warm compress", "heating pad"],
    emoji: "🧣",
    language: {
      hi: "प्रभावित गर्दन के हिस्से पर १०-१५ मिनट गर्म कपड़े या हीटिंग पैड से सिकाई करें।",
      en: "Apply a warm compress or dry heating pad for 15 minutes.",
      gu: "ગળાના ભાગે ૧૦-૧૫ મિનિટ ગરમ પાણીનો શેક કરો."
    }
  },
  {
    id: 75,
    symptoms: ["mild back pain", "halka kamar dard", "back ache", "कठिन पीठ"],
    condition: "Mild Back Pain Relief",
    remedy: "Use a warm water bag compress and rest on a flat firm mattress.",
    ingredients: ["warm water bag", "rest"],
    emoji: "🛌",
    language: {
      hi: "गर्म पानी की थैली से पीठ की सिकाई करें और समतल बिस्तर पर आराम करें।",
      en: "Apply warm water bottle compress and rest on a firm bed.",
      gu: "ગરમ પાણીની કોથળીનો શેક કરો અને આરામ કરો."
    }
  },
  {
    id: 76,
    symptoms: ["shoulder pain", "kandhe me dard", "shoulder ache"],
    condition: "Shoulder Pain Support",
    remedy: "Gently massage the shoulder with warm mustard oil or apply warm pack.",
    ingredients: ["warm mustard oil", "warm pack"],
    emoji: "🧴",
    language: {
      hi: "गुनगुने सरसों तेल से कंधे पर हल्की मालिश करें या गर्म सिकाई करें।",
      en: "Massage gently with warm mustard oil or use a warm compress.",
      gu: "કભા પર ગરમ તેલની માલિશ અથવા શેક કરો."
    }
  },
  {
    id: 77,
    symptoms: ["knee pain", "ghutnon me dard", "joints pain knee", "घुटनों का दर्द"],
    condition: "Knee Pain / Ghutno me Dard",
    remedy: "Drink warm turmeric milk daily and avoid sitting on the floor.",
    ingredients: ["turmeric", "milk"],
    emoji: "🥛",
    language: {
      hi: "रोजाना हल्दी वाला गर्म दूध पिएं और जमीन पर बैठने से बचें।",
      en: "Consume warm turmeric milk daily and avoid squatting on the floor.",
      gu: "રોજ હળદર વાળું ગરમ દૂધ પીઓ અને આરામ કરો."
    }
  },
  {
    id: 78,
    symptoms: ["foot swelling", "pair me sujan", "swollen feet", "swollen ankle"],
    condition: "Swollen Feet Care",
    remedy: "Elevate your feet on pillows while resting and reduce salt intake.",
    ingredients: ["foot elevation", "rest"],
    emoji: "🛌",
    language: {
      hi: "आराम करते समय पैरों के नीचे तकिए रखकर उन्हें ऊंचाई पर रखें।",
      en: "Elevate your feet on pillows while lying down and rest.",
      gu: "પગની નીચે તકિયા મૂકી તેને ઊંચા રાખો અને આરામ કરો."
    }
  },
  {
    id: 79,
    symptoms: ["foot blister", "pair me chhala", "blister", "friction blister"],
    condition: "Foot Blister Care",
    remedy: "Clean with mild soap, do not pop it, and protect with a soft bandage.",
    ingredients: ["bandage", "clean water"],
    emoji: "🩹",
    language: {
      hi: "साफ पानी से धोएं, छाले को फोड़ें नहीं और मुलायम पट्टी से ढकें।",
      en: "Clean gently, do not pop the blister, and cover with a clean bandage.",
      gu: "પગના ફોલ્લાને ફોડવો નહીં, સાફ કરી પાટો લગાવો."
    }
  },
  {
    id: 80,
    symptoms: ["mosquito infestation", "mosquitoes", "machhar bhagana"],
    condition: "Mosquito Repellent",
    remedy: "Burn dry neem leaves or use neem oil lamp in the room.",
    ingredients: ["neem leaves", "neem oil"],
    emoji: "🌿",
    language: {
      hi: "कमरे में सूखी नीम की पत्तियों का धुआं करें या नीम तेल का दीपक जलाएं।",
      en: "Burn dry neem leaves or burn a lamp with neem oil to repel insects.",
      gu: "રૂમમાં સૂકા કડવા લીમડાના પાનનો ધુમાડો કરો."
    }
  },
  {
    id: 81,
    symptoms: ["insect bite", "keede ne kata", "ant bite", "कीड़ा काटना"],
    condition: "Insect Bite Care",
    remedy: "Apply aloe vera gel or baking soda paste on the affected spot.",
    ingredients: ["aloe vera gel", "baking soda"],
    emoji: "🌱",
    language: {
      hi: "काटे गए स्थान पर एलोवेरा जेल या बेकिंग सोडा का पेस्ट लगाएं।",
      en: "Apply fresh aloe vera gel or baking soda paste to the bite.",
      gu: "કરડેલી જગ્યા પર એલોવેરા જેલ અથવા ખાવાના સોડાનો લેપ કરો."
    }
  },
  {
    id: 82,
    symptoms: ["mild toothache", "dant me halka dard", "tooth ache", "दांत का दर्द"],
    condition: "Mild Toothache / Dant Dard",
    remedy: "Apply 1-2 drops of clove oil (laung ka tel) on cotton and press on the tooth.",
    ingredients: ["clove oil", "cotton"],
    emoji: "🦷",
    language: {
      hi: "रूई के फाहें पर १-२ बूंद लौंग का तेल लगाकर दर्द वाले दांत पर दबाएं।",
      en: "Apply 1-2 drops of clove oil on a cotton swab and place on the tooth.",
      gu: "રૂ પર લવિંગનું તેલ લગાવી દુખાવા વાળા દાંત પર દબાવો."
    }
  },
  {
    id: 83,
    symptoms: ["bleeding gums", "masoodon se khoon", "gum bleed", "मसूड़ों से खून"],
    condition: "Bleeding Gums Care",
    remedy: "Rinse your mouth with warm salt water after brushing.",
    ingredients: ["warm water", "salt"],
    emoji: "🥛",
    language: {
      hi: "ब्रश करने के बाद गुनगुने नमक के पानी से मुंह धोएं/कुल्ला करें।",
      en: "Rinse your mouth with warm saline water gently after brushing.",
      gu: "બ્રશ કર્યા પછી નવશેકા મીઠાવાળા પાણીથી કોગળા કરો."
    }
  },
  {
    id: 84,
    symptoms: ["dry mouth", "muh sukh raha", "thirst dry mouth"],
    condition: "Dry Mouth Support",
    remedy: "Sip water regularly throughout the day and chew small saunf seeds.",
    ingredients: ["water", "saunf"],
    emoji: "💧",
    language: {
      hi: "दिन भर नियमित रूप से पानी पीते रहें और थोड़ी सौंफ चबाएं।",
      en: "Sip water regularly throughout the day and chew fennel seeds.",
      gu: "નિયમિત પાણી પીતા રહો અને વરિયાળી ચાવો."
    }
  },
  {
    id: 85,
    symptoms: ["mild stomach cramps", "stomach pain minor"],
    condition: "Mild Stomach Cramps",
    remedy: "Take hing (asafoetida) powder mixed with warm water.",
    ingredients: ["hing", "warm water"],
    emoji: "🍵",
    language: {
      hi: "एक चुटकी हींग को गुनगुने पानी में मिलाकर पिएं।",
      en: "Drink warm water mixed with a pinch of asafoetida (hing).",
      gu: "એક ચપટી હિંગ ગરમ પાણી સાથે લો."
    }
  },
  {
    id: 86,
    symptoms: ["chronic constipation", "kabz chronic", "constipation daily"],
    condition: "Chronic Constipation Support",
    remedy: "Drink 2 glasses of warm water every morning on an empty stomach.",
    ingredients: ["warm water"],
    emoji: "🥛",
    language: {
      hi: "हर सुबह खाली पेट २ गिलास गुनगुना पानी पीने की आदत डालें।",
      en: "Drink 2 glasses of warm water empty stomach every single morning.",
      gu: "રોજ સવારે ખાલી પેટે ૨ ગ્લાસ ગરમ પાણી પીવો."
    }
  },
  {
    id: 87,
    symptoms: ["morning digestion issues", "morning stomach", "digestive health morning"],
    condition: "Morning Digestion Support",
    remedy: "Eat 5-10 black raisins soaked overnight in water.",
    ingredients: ["soaked raisins", "kishmish"],
    emoji: "🍇",
    language: {
      hi: "रात में भिगोई हुई ५-१० काली किशमिश सुबह खाली पेट खाएं।",
      en: "Eat 5-10 black raisins that were soaked in water overnight.",
      gu: "રાત્રે પલાળેલી ૫-૧૦ કાળી દ્રાક્ષ સવારે ભૂખ્યા પેટે ખાઓ."
    }
  },
  {
    id: 88,
    symptoms: ["low appetite", "bhook kam", "appetite loss"],
    condition: "Appetite Booster",
    remedy: "Chew ginger juliennes with rock salt 30 mins before meals.",
    ingredients: ["ginger", "rock salt"],
    emoji: "🫚",
    language: {
      hi: "भोजन से आधा घंटा पहले अदरक की कतरन पर सेंधा नमक लगाकर चबाएं।",
      en: "Chew fresh ginger slices with rock salt 30 minutes before meals.",
      gu: "જમવાના અડધા કલાક પહેલા આદુની કતરણ સિંધાલૂણ સાથે ચાવો."
    }
  },
  {
    id: 89,
    symptoms: ["general weakness", "kamzori bodily", "low energy daily"],
    condition: "General Weakness / Gud Chana",
    remedy: "Eat a handful of roasted chana (chickpeas) with jaggery (gud) daily.",
    ingredients: ["jaggery", "gud", "roasted chana"],
    emoji: "🥣",
    language: {
      hi: "रोजाना मुट्ठी भर भुने चने के साथ थोड़ा गुड़ खाएं।",
      en: "Eat a handful of roasted chickpeas (chana) with jaggery (gud) daily.",
      gu: "રોજ એક મુઠ્ઠી શેકેલા ચણા સાથે ગોળ ખાઓ."
    }
  },
  {
    id: 90,
    symptoms: ["low hemoglobin", "anemia", "pale look", "blood count low"],
    condition: "Hemoglobin Boost",
    remedy: "Include fresh spinach (palak) and beetroot in your daily diet.",
    ingredients: ["spinach", "beetroot"],
    emoji: "🥗",
    language: {
      hi: "अपने दैनिक आहार में पालक और चुकंदर को शामिल करें।",
      en: "Include fresh spinach and beetroot in your daily meals.",
      gu: "દૈનિક આહારમાં પાલક અને બીટનો સમાવેશ કરો."
    }
  },
  {
    id: 91,
    symptoms: ["low immunity", "immune boost daily"],
    condition: "Daily Immunity Support",
    remedy: "Chew 4-5 fresh holy basil (tulsi) leaves daily in the morning.",
    ingredients: ["tulsi leaves"],
    emoji: "🌿",
    language: {
      hi: "सुबह खाली पेट रोजाना ४-५ तुलसी के पत्ते चबाएं या पानी के साथ निगलें।",
      en: "Chew 4 to 5 fresh basil (tulsi) leaves daily in the morning.",
      gu: "સવારે ખાલી પેટે ૪-૫ તુલસીના પાન ચાવો."
    }
  },
  {
    id: 92,
    symptoms: ["frequent colds", "always catch cold", "chronic cold"],
    condition: "Cold Prevention Support",
    remedy: "Make drinking warm water a daily habit throughout the cold seasons.",
    ingredients: ["warm water habit"],
    emoji: "🥛",
    language: {
      hi: "ठंड के मौसम में रोजाना केवल गुनगुना पानी पीने की आदत बनाएं।",
      en: "Develop a habit of drinking warm water daily to prevent colds.",
      gu: "રોજ નવશેકું પાણી પીવાની આદત કેળવો."
    }
  },
  {
    id: 93,
    symptoms: ["rain soaked", "wet clothes after rain"],
    condition: "Drenched Care",
    remedy: "Change to dry clothes immediately and drink a hot cup of ginger tea.",
    ingredients: ["dry clothes", "ginger tea"],
    emoji: "☕",
    language: {
      hi: "भीगे कपड़े तुरंत बदलें और एक कप अदरक की गरमा-गरम चाय पिएं।",
      en: "Change into dry clothes immediately and sip a hot cup of ginger tea.",
      gu: "ભીના કપડા બદલી આદુ વાળી ગરમ ચા પી લો."
    }
  },
  {
    id: 94,
    symptoms: ["wet feet", "cold feet rain"],
    condition: "Wet Feet Recovery",
    remedy: "Dry your feet thoroughly and wear dry warm socks.",
    ingredients: ["dry towel", "warm socks"],
    emoji: "🧦",
    language: {
      hi: "पैरों को तौलिए से अच्छी तरह सुखाएं और गर्म मोजे पहनें।",
      en: "Dry your feet thoroughly with a towel and wear clean warm socks.",
      gu: "પગ કોરા કરી ગરમ મોજા પહેરી લો."
    }
  },
  {
    id: 95,
    symptoms: ["night cough", "dry throat night cough"],
    condition: "Night Cough Relief",
    remedy: "Take steam inhalation or use a humidifier in the room before bed.",
    ingredients: ["steam", "humidifier"],
    emoji: "💨",
    language: {
      hi: "सोने से पहले भाप लें या कमरे में ह्यूमिडिफायर का प्रयोग करें।",
      en: "Take steam inhalation or run a humidifier in your bedroom before sleep.",
      gu: "સૂતા પહેલા નાસ (વરાળ) લો."
    }
  },
  {
    id: 96,
    symptoms: ["recovering from fever", "post fever weakness", "convalescence"],
    condition: "Post-Fever Nutritious Care",
    remedy: "Eat light nutritious meals like moong dal khichdi or vegetable soup.",
    ingredients: ["khichdi", "vegetable soup"],
    emoji: "🥣",
    language: {
      hi: "बुखार के बाद हल्का सुपाच्य भोजन लें जैसे मूंग दाल खिचड़ी या सूप।",
      en: "Eat light and nutritious food like split green gram khichdi or hot soup.",
      gu: "હળવો ખોરાક જેમ કે મગની ખીચડી કે વેજિટેબલ સૂપ લો."
    }
  },
  {
    id: 97,
    symptoms: ["stomach infection", "pet me infection suspicion"],
    condition: "Stomach Infection Alert",
    remedy: "Eat simple khichdi, drink warm water, and consult a doctor.",
    ingredients: ["khichdi", "doctor consult"],
    emoji: "👨‍⚕️",
    warning: "Consult a doctor if you experience fever, blood in stool, or constant vomiting.",
    language: {
      hi: "सादी खिचड़ी खाएं, गुनगुना पानी पिएं और डॉक्टर से परामर्श लें।",
      en: "Eat simple khichdi, stay hydrated, and consult a doctor.",
      gu: "સાદી ખીચડી ખાઓ અને ડૉક્ટરની સલાહ લો."
    }
  },
  {
    id: 98,
    symptoms: ["severe stomach pain", "unbearable stomach pain", "appendicitis suspicion", "stomach emergency"],
    condition: "Severe Stomach Pain",
    remedy: "Do NOT use home remedies. Go to a hospital or see a doctor immediately.",
    ingredients: ["emergency medical care"],
    emoji: "🚨",
    warning: "RED ALERT: Severe abdominal pain requires immediate emergency clinical evaluation.",
    language: {
      hi: "घरेलू उपचार न करें। तुरंत अस्पताल जाएं या डॉक्टर से मिलें।",
      en: "Do NOT rely on home remedies. Consult a doctor or visit emergency immediately.",
      gu: "ઘરેલું ઉપચાર ન કરો. તુરંત જ ડૉક્ટર પાસે જાઓ."
    }
  },
  {
    id: 99,
    symptoms: ["worsening breathlessness", "severe asthma", "cannot breathe", "choking"],
    condition: "Severe Breathlessness",
    remedy: "Do NOT wait. Go to the nearest hospital emergency room immediately.",
    ingredients: ["oxygen support", "emergency"],
    emoji: "🚨",
    warning: "RED ALERT: Life-threatening breathing difficulty. Call emergency services immediately.",
    language: {
      hi: "देरी बिल्कुल न करें। तुरंत नजदीकी अस्पताल के आपातकालीन विभाग में जाएं।",
      en: "Do NOT wait. Visit the nearest hospital emergency room immediately.",
      gu: "રાહ ન જુઓ. નજીકની હોસ્પિટલના ઇમરજન્સી રૂમમાં તુરંત જ જાઓ."
    }
  },
  {
    id: 100,
    symptoms: ["symptoms persist 2-3 days", "no improvement", "worsening symptoms"],
    condition: "Persistent Symptoms Advice",
    remedy: "If symptoms do not improve in 2-3 days, consult a qualified medical doctor.",
    ingredients: ["medical consult"],
    emoji: "👨‍⚕️",
    warning: "Do not self-medicate or delay professional medical advice.",
    language: {
      hi: "यदि लक्षण २-३ दिनों में ठीक न हों, तो तुरंत डॉक्टर से परामर्श लें।",
      en: "If symptoms persist beyond 2-3 days, please consult a qualified doctor.",
      gu: "જો લક્ષણો ૨-૩ દિવસમાં મટે નહીં, તો ડૉક્ટરની સલાહ લો."
    }
  },
  {
    id: 101,
    symptoms: ["overweight", "obese", "obese_1", "obese_2", "fat", "weight loss", "motapa"],
    condition: "Weight Management / Vajan Niyantran",
    remedy: "Drink warm water with lemon and a teaspoon of honey every morning. Engaged in light exercises.",
    ingredients: ["warm water", "lemon", "honey"],
    emoji: "🍋",
    language: {
      hi: "हर सुबह गुनगुने पानी में नींबू और एक चम्मच शहद मिलाकर पिएं। हल्का व्यायाम करें।",
      en: "Drink warm water with lemon and a teaspoon of honey every morning. Engaged in light exercises.",
      gu: "દરરોજ સવારે નવશેકા પાણીમાં લીંબુ અને મધ મેળવીને પીઓ. હળવી કસરત કરો."
    }
  },
  {
    id: 102,
    symptoms: ["underweight", "severely_underweight", "low weight", "malnutrition", "kam vajan"],
    condition: "Nutritional Support / Poshan",
    remedy: "Consume ripe bananas with milk, and include cow ghee, nuts, and raisins in your daily diet.",
    ingredients: ["banana", "milk", "ghee", "nuts"],
    emoji: "🥣",
    language: {
      hi: "दूध के साथ केले खाएं, और अपने आहार में गाय का घी, सूखे मेवे और किशमिश शामिल करें।",
      en: "Consume ripe bananas with milk, and include cow ghee, nuts, and raisins in your daily diet.",
      gu: "દૂધ સાથે કેળા ખાઓ, અને તમારા ખોરાકમાં ગાયનું ઘી અને સૂકો મેવો સામેલ કરો."
    }
  }
];

