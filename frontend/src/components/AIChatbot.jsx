import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { askGemini } from "../services/geminiService";
import { GEMINI_API_KEY } from "../config/gemini";

// ── Quick suggestion chips ────────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  { label:"🍛 Chicken Biryani recipe",  query:"recipe for chicken biryani"       },
  { label:"💪 High protein breakfast",  query:"high protein breakfast ideas"      },
  { label:"🔥 Fat loss tips",           query:"tips to lose fat faster"           },
  { label:"😴 Sleep & weight",          query:"how does sleep affect weight loss" },
  { label:"💧 Water intake",            query:"how much water should I drink"     },
  { label:"📋 Weekly meal plan",        query:"weekly meal plan for fat loss"     },
];

// ── Recipe database — sorted longest key first to prevent partial matches ────
const RECIPES = [
  {
    keys:["chicken biryani","biryani rice","biryani"],
    name:"Chicken Biryani",
    steps:[
      "Wash and soak 1.5 cups basmati rice for 30 min, then drain",
      "Marinate 300g chicken: 4 tbsp yogurt + 1 tsp each red chilli, cumin, coriander, garam masala + 1 tsp ginger-garlic paste + salt — rest 1 hour in fridge",
      "Heat 2 tbsp oil in a heavy pot. Fry 2 sliced onions until deep golden (12–15 min on medium) — don't rush this",
      "Add marinated chicken. Cook on high heat 5 min (seals juices), then medium 10 min until oil separates from masala",
      "Boil rice in salted water + 2 bay leaves + 2 cloves until 70% done (~7 min). Drain immediately",
      "Layer: spread chicken in pot → half the rice → saffron water + fried onions + fresh mint + coriander → remaining rice on top",
      "Seal pot with foil then lid (or dough). Cook on lowest flame 20 min. Place a hot tawa underneath if possible",
      "Rest 5 min. Gently mix from sides. Serve hot with raita and salan",
    ],
    cal:400, pro:20, tip:"For fat loss: use ½ the rice and add more chicken. Keeps the flavour while reducing carbs by 40%.",
  },
  {
    keys:["mutton biryani"],
    name:"Mutton Biryani",
    steps:[
      "Marinate 300g mutton: yogurt + red chilli + garam masala + ginger-garlic paste + salt — minimum 2 hours",
      "Pressure cook mutton with ½ cup water: 5–6 whistles until completely tender. Reserve the stock",
      "Soak and parboil 1.5 cups basmati rice to 70% cooked, drain",
      "Fry 2 onions until dark golden. Add cooked mutton + masala, cook 5 min on high heat",
      "Layer rice over mutton. Add saffron milk + mint leaves + fried onions + reserved stock (½ cup)",
      "Seal with foil and dum cook on lowest flame 25 min",
      "Rest 5 min before opening. Serve with raita",
    ],
    cal:420, pro:22, tip:"Trim visible fat before marinating — saves ~80 kcal and makes gravy less greasy.",
  },
  {
    keys:["veg biryani","vegetable biryani"],
    name:"Vegetable Biryani",
    steps:[
      "Soak 1.5 cups basmati rice for 30 min",
      "Heat 2 tbsp ghee/oil. Fry 1 sliced onion until golden",
      "Add 1 tsp ginger-garlic paste + whole spices (bay leaf, cloves, cardamom, cinnamon)",
      "Add mixed vegetables: carrot, beans, peas, potato — sauté 5 min",
      "Add yogurt + biryani masala + salt. Cook 3 min",
      "Add drained rice + 2.5 cups warm water + saffron water + mint",
      "Cover and cook on medium 10 min, then low 15 min until rice is done",
      "Garnish with fried onions, raisins, cashews. Serve with raita",
    ],
    cal:300, pro:8, tip:"Add paneer or boiled eggs for extra protein without changing the biryani flavour.",
  },
  {
    keys:["dal tadka","dal fry","toor dal","arhar dal"],
    name:"Dal Tadka",
    steps:[
      "Rinse ½ cup toor/arhar dal 3 times. Pressure cook with 1.5 cups water + pinch of turmeric: 3 whistles",
      "Mash dal slightly. Add salt, let simmer 5 min on low heat",
      "Tadka: heat 1 tsp ghee in small pan. Add 1 tsp cumin — let crackle 20 sec",
      "Add 2 dry red chillies + 1 chopped onion — sauté 4 min until golden",
      "Add 1 tsp ginger-garlic paste + 1 chopped tomato + ¼ tsp red chilli powder. Cook until tomato is mushy",
      "Pour tadka over dal. Stir gently and simmer 3 min",
      "Squeeze lemon juice. Garnish with coriander. Serve with roti or rice",
    ],
    cal:180, pro:9, tip:"A squeeze of lemon before eating doubles the iron absorption from the dal. Never skip it.",
  },
  {
    keys:["palak dal","spinach dal"],
    name:"Palak Dal",
    steps:[
      "Pressure cook ½ cup moong/masoor dal: 2 whistles",
      "Blanch 2 cups spinach: dip in boiling water 30 sec, then cold water. Blend smooth",
      "Heat 1 tsp oil. Add cumin + garlic — sauté 1 min",
      "Add tomato + turmeric + salt + pinch of garam masala — cook 4 min",
      "Add cooked dal + blended spinach. Simmer 8 min",
      "Add lemon juice and serve",
    ],
    cal:160, pro:9, tip:"Iron-rich, high-protein, low-calorie. Perfect fat-loss dinner with 1 roti.",
  },
  {
    keys:["paneer tikka"],
    name:"Paneer Tikka",
    steps:[
      "Cut 200g paneer into 1.5 inch cubes. Don't go smaller — they'll crumble during cooking",
      "Marinate: 4 tbsp thick yogurt + 1 tsp each red chilli, cumin, coriander, garam masala + ½ tsp turmeric + 1 tbsp lemon + salt — 1 hour minimum in fridge",
      "Cut onion and bell pepper into 1.5 inch squares",
      "Skewer: paneer → onion → paneer → capsicum — alternating pieces",
      "Oven: 200°C for 15 min, then grill mode 3 min for char marks",
      "Tawa: brush with oil, cook on all 4 sides, 2 min each on medium-high",
      "Sprinkle chaat masala + squeeze lemon before serving",
    ],
    cal:250, pro:14, tip:"Use low-fat paneer to cut to ~180 kcal. Paneer has 18g protein per 100g — one of the best vegetarian sources.",
  },
  {
    keys:["idli"],
    name:"Soft Idli",
    steps:[
      "Soak urad dal (4 hrs) and idli rice separately (6 hrs)",
      "Grind urad dal with cold water into very fluffy, airy batter — 8 min in wet grinder",
      "Grind rice to slightly coarse paste. Mix both batters, add salt",
      "Ferment at room temperature 8–12 hours (should double in volume, smell slightly tangy)",
      "Grease idli moulds, fill ¾ full",
      "Steam 12 min on high heat. Test with toothpick — clean = done",
      "Rest 2 min. Remove with wet spoon. Serve with sambar and coconut chutney",
    ],
    cal:140, pro:4, tip:"Zero oil, fermented = probiotic benefit. Best low-calorie gut-friendly Indian breakfast.",
  },
  {
    keys:["masala dosa"],
    name:"Masala Dosa",
    steps:[
      "Make potato filling: boil 2 potatoes, peel, mash roughly",
      "Heat 1 tsp oil: mustard seeds + curry leaves + green chilli → onion 3 min → turmeric + salt + mashed potato. Cook 3 min",
      "Heat tawa high until smoking. Sprinkle water — evaporate instantly. Wipe with onion",
      "Pour dosa batter, spread in wide circular motion quickly",
      "Drizzle ½ tsp oil around edges. Cook 2–3 min until golden and edges lift",
      "Place potato filling on one side. Fold over. Serve immediately",
    ],
    cal:250, pro:6, tip:"Use sweet potato filling instead of regular potato — lower glycemic index, more vitamins.",
  },
  {
    keys:["plain dosa","dosa"],
    name:"Crispy Plain Dosa",
    steps:[
      "Use fermented dosa batter, thin it with water to lassi consistency",
      "Heat cast iron tawa on high until smoking. Reduce to medium",
      "Wipe surface with half-onion dipped in oil",
      "Pour 1 ladle, spread immediately in large circular motion",
      "Drizzle oil at edges. Cook 2–3 min until edges turn golden and lift",
      "Fold, serve immediately with sambar + chutneys",
    ],
    cal:160, pro:4, tip:"No oil version = only 120 kcal. Perfect for fat loss when combined with sambar for protein.",
  },
  {
    keys:["oats porridge","oats","oatmeal","overnight oats"],
    name:"Power Oats Porridge",
    steps:[
      "Bring 1 cup milk (or almond milk) to gentle boil",
      "Add ½ cup rolled oats (NOT instant oats — less processed)",
      "Stir on low heat 5 min until creamy. Remove from heat — thickens as it sits",
      "Add: pinch of cinnamon + ½ banana sliced + 1 tsp honey",
      "Optional protein boost: stir in 1 scoop unflavoured whey after removing from heat",
      "Top with 1 tbsp chia seeds for omega-3 and extra fibre",
    ],
    cal:150, pro:5, tip:"Adding whey protein turns this into a 30g protein breakfast — single highest-impact change for body composition.",
  },
  {
    keys:["khichdi","khichadi"],
    name:"Veggie Khichdi",
    steps:[
      "Wash ½ cup rice + ¼ cup yellow moong dal together",
      "Heat 1 tsp ghee in pressure cooker. Add cumin seeds — crackle",
      "Add 1 onion + 1 tsp ginger-garlic paste. Sauté 3 min",
      "Add 1 tomato + turmeric + salt + red chilli. Cook 3 min",
      "Add rice+dal + 2.5 cups water + chopped vegetables (carrot, beans, peas)",
      "Pressure cook 3 whistles. Open after pressure releases naturally",
      "Serve with pickle, papad, and a small spoon of ghee on top",
    ],
    cal:240, pro:8, tip:"Most digestible Indian meal. Perfect after illness, heavy workouts, or when gut needs a break.",
  },
  {
    keys:["grilled chicken","chicken breast","chicken salad"],
    name:"Grilled Chicken Breast",
    steps:[
      "Pound 150g chicken breast to even thickness — prevents dry outer + raw inside",
      "Marinate: 2 tbsp yogurt + 1 tsp each cumin, coriander, paprika + lemon + salt — 30 min minimum",
      "Bring chicken to room temperature 15 min before cooking",
      "Heat cast iron pan on HIGH until very hot. No oil needed with marinade",
      "Place chicken — do NOT press or move. Cook 6–7 min undisturbed",
      "Flip ONCE. Cook 5–6 min. Cut at thickest part — no pink visible",
      "REST 5 min before cutting. Slice against the grain",
    ],
    cal:200, pro:38, tip:"Resting after cooking is NOT optional — cutting early loses 30% of moisture. That's why restaurant chicken tastes better.",
  },
  {
    keys:["egg omelette","omelette","egg white omelette"],
    name:"Protein Egg White Omelette",
    steps:[
      "Separate 3 egg whites (or 2 whites + 1 whole egg for richer taste)",
      "Whisk vigorously with salt + pepper + pinch of turmeric until frothy",
      "Heat non-stick pan medium. Add ½ tsp oil",
      "Sauté mushrooms → spinach → capsicum 2 min first",
      "Pour egg whites over vegetables. Don't stir — let edges set (2 min)",
      "When 80% set, fold in half. Cook 30 sec more",
      "Slide onto plate. Serve with 1 slice whole wheat toast",
    ],
    cal:100, pro:20, tip:"Add 1 whole egg + 2 whites instead of all whites — richer flavour, +50 kcal, +5g protein, all essential vitamins.",
  },
  {
    keys:["protein smoothie","smoothie","shake"],
    name:"High Protein Smoothie",
    steps:[
      "Add to blender: 1 frozen banana + 200ml milk or almond milk",
      "Add 1 scoop vanilla whey protein",
      "Add large handful of spinach — completely tasteless in a smoothie",
      "Add 1 tbsp peanut butter for healthy fat",
      "Add 4–5 ice cubes",
      "Blend 30–40 sec until smooth. Drink immediately",
    ],
    cal:280, pro:28, tip:"Post-workout: drink within 30 min of training. This is when your muscles absorb protein most efficiently.",
  },
  {
    keys:["chicken wrap","wrap"],
    name:"Tandoori Chicken Wrap",
    steps:[
      "Marinate 120g chicken strips: yogurt + tandoori masala + lemon + salt — 30 min",
      "Cook on high tawa 3–4 min per side until slightly charred",
      "Warm a whole wheat chapati or multigrain tortilla 20 sec on tawa",
      "Spread 1 tbsp hung curd or hummus",
      "Layer: lettuce → chicken → thin-sliced onion → cucumber → bell pepper",
      "Drizzle mint chutney or hot sauce",
      "Roll tightly, cut diagonally. Wrap in parchment",
    ],
    cal:350, pro:28, tip:"Use chapati instead of maida tortilla — more fibre, fewer refined carbs, keeps you full longer.",
  },
  {
    keys:["rajma","kidney beans","rajma masala","rajma chawal"],
    name:"Rajma Masala",
    steps:[
      "Soak 1 cup rajma overnight. Pressure cook with fresh water: 5–6 whistles",
      "Heat 1 tbsp oil. Add cumin seeds. Add 1 onion — cook until deep brown (10 min on medium)",
      "Add 1 tsp ginger-garlic paste. Cook 2 min",
      "Add 2 tomatoes + red chilli + coriander + garam masala + salt. Cook until oil separates",
      "Add cooked rajma + 1 cup water. Mash a few beans with the back of a spoon — thickens gravy",
      "Simmer 15 min on low. Garnish with coriander",
      "Serve with steamed rice or roti",
    ],
    cal:200, pro:8, tip:"One of the best plant protein sources. Add a squeeze of lemon to boost iron absorption from the beans.",
  },
  {
    keys:["poha"],
    name:"Poha",
    steps:[
      "Rinse 1 cup thick poha under water 2–3 times. Let sit in sieve 5 min — should be soft but not mushy",
      "Heat 1 tsp oil. Add mustard seeds + curry leaves + green chilli — crackle",
      "Add 1 sliced onion, cook 3 min. Add ½ tsp turmeric",
      "Add soaked poha. Mix gently so it doesn't break",
      "Add salt + lemon juice + sugar (pinch). Mix and cook on low 2 min",
      "Garnish with coriander + grated coconut + sev on top",
    ],
    cal:180, pro:4, tip:"Add 2 tbsp roasted peanuts for 5g extra protein and healthy fats. Makes it much more filling.",
  },
];

// ── Topic keywords — food/health ONLY ────────────────────────────────────────
const FOOD_HEALTH_WORDS = [
  "eat","eating","food","meal","diet","nutrition","calorie","kcal","protein","carb","fat",
  "weight","lose","gain","muscle","bulk","slim","thin","obese","bmi","body",
  "breakfast","lunch","dinner","snack","drink","water","hydration","juice",
  "sleep","rest","insomnia","stress","anxiety","cortisol","hormone",
  "workout","exercise","gym","training","run","walk","cardio","strength",
  "vitamin","supplement","mineral","iron","calcium","b12","d3","omega",
  "sugar","sweet","junk","craving","fast","fasting","intermittent",
  "fiber","fibre","gut","digestion","bloat","probiotic",
  "rice","roti","dal","paneer","chicken","egg","fish","meat","vegetarian","vegan",
  "fruit","mango","banana","apple","orange","vegetable","sabzi","curry",
  "healthy","unhealthy","disease","diabetes","cholesterol","blood pressure","bp",
  "oats","wheat","bread","pasta","noodle","soup","salad","sandwich","wrap","bowl",
  "metabolism","tdee","bmr","deficit","surplus","macro","micro","nutrient","energy",
  "plan","routine","schedule","habit","lifestyle","wellness","fitness","health",
  "cook","recipe","prepare","make","boil","fry","grill","steam",
];

function isHealthTopic(q) {
  const lower = q.toLowerCase();
  return FOOD_HEALTH_WORDS.some(w => lower.includes(w));
}

// ── Response generator ────────────────────────────────────────────────────────
function generateResponse(msg, user) {
  const q      = msg.toLowerCase().trim();
  const goal   = user?.goal   || "maintain";
  const name   = user?.name?.split(" ")[0] || "there";
  const target = user?.target || 2000;
  const weight = user?.weight || 70;
  const height = user?.height || 170;
  const age    = user?.age    || 25;
  const gender = user?.gender || "male";

  // ── 1. RECIPE ──────────────────────────────────────────────────────────────
  const recipeKW = ["recipe","how to make","how to cook","how to prepare","steps to make","prepare","cook"];
  const isRecipe = recipeKW.some(k => q.includes(k));

  if (isRecipe) {
    // Sort: longest key first (prevents "chicken" matching "chicken biryani")
    const sorted = [...RECIPES].sort((a,b) => b.keys[0].length - a.keys[0].length);
    for (const item of sorted) {
      if (item.keys.some(k => q.includes(k))) {
        return { type:"recipe", ...item };
      }
    }
    // Recipe keyword present but food not found
    return { type:"text", text:`I can give you detailed step-by-step recipes for:\n\n🍛 **Chicken Biryani** · **Mutton Biryani** · **Veg Biryani**\n🫘 **Dal Tadka** · **Palak Dal** · **Rajma Masala**\n🥘 **Paneer Tikka** · **Grilled Chicken** · **Khichdi**\n🥣 **Idli** · **Dosa** · **Masala Dosa** · **Poha** · **Oats**\n🥗 **Protein Smoothie** · **Chicken Wrap** · **Egg Omelette**\n\nJust ask: *"Recipe for chicken biryani"* or *"How to make paneer tikka?"*` };
  }

  // ── 2. "WHAT SHOULD I EAT" / MEAL SUGGESTION ──────────────────────────────
  if (q.includes("what should i eat") || q.includes("what to eat") || q.includes("suggest") ||
      q.includes("meal plan") || q.includes("weekly plan") || q.includes("diet plan") ||
      q.includes("what can i eat")) {
    const bmr = gender==="female" ? 10*weight+6.25*height-5*age-161 : 10*weight+6.25*height-5*age+5;
    const mults = {sedentary:1.2,light:1.375,moderate:1.55,active:1.725};
    const tdee = Math.round(bmr * (mults[user?.activity||"light"]));
    return { type:"text", text:`📋 **${goal==="fat_loss"?"Fat Loss":goal==="muscle_gain"?"Muscle Gain":"Balanced"} Meal Plan for ${name}**\n\n**Daily Target: ${target.toLocaleString()} kcal**\n\n**Breakfast (${Math.round(target*0.25)} kcal):**\n${goal==="fat_loss"
      ? "• Egg white omelette (2 whites + 1 whole) + 1 toast → 155 kcal, 18g protein\n• OR: Moong dal chilla × 2 + curd → 200 kcal, 12g protein"
      : goal==="muscle_gain"
      ? "• Oats + whey + banana + milk → 420 kcal, 35g protein\n• OR: 3 eggs + 2 rotis + 1 glass milk → 520 kcal, 38g protein"
      : "• Poha + chai → 230 kcal\n• OR: Idli × 2 + sambar → 240 kcal"}\n\n**Lunch (${Math.round(target*0.35)} kcal):**\n${goal==="fat_loss"
      ? "• Grilled chicken 100g + brown rice ½ cup + sabzi → 380 kcal\n• OR: Dal + 1 roti + cucumber salad → 320 kcal"
      : goal==="muscle_gain"
      ? "• Chicken curry 150g + 1 cup rice + dal → 620 kcal, 45g protein\n• OR: Paneer 150g + 2 rotis + rajma → 580 kcal"
      : "• Dal + 2 rotis + sabzi + curd → 500 kcal\n• OR: Rice + rajma + salad → 480 kcal"}\n\n**Dinner (${Math.round(target*0.30)} kcal):**\n${goal==="fat_loss"
      ? "• Grilled fish/chicken + steamed veggies → 280 kcal\n• OR: Veggie khichdi + raita → 300 kcal"
      : goal==="muscle_gain"
      ? "• Fish/chicken 150g + 1 cup rice + sabzi → 500 kcal\n• OR: Paneer tikka + 1 cup rice + dal → 520 kcal"
      : "• Dal + sabzi + 2 rotis → 420 kcal\n• OR: Khichdi + papad + pickle → 350 kcal"}\n\n**Snack (${Math.round(target*0.10)} kcal):**\n• Roasted makhana 20g · Handful almonds · Greek yogurt · Banana` };
  }

  // ── 3. SPECIFIC FOOD QUESTION (rice, mango, etc.) ─────────────────────────
  const foodItems = {
    "rice":    `🍚 **Is Rice Good for You?**\n\nRice is not "bad" — it's about portion and timing.\n\n**For ${goal==="fat_loss"?"fat loss":"your goal"}:**\n${goal==="fat_loss"
      ? "• Limit to ½–¾ cup cooked (80–120g)\n• Prefer brown rice — 3x more fibre, lower glycemic index\n• Time it: eat rice at lunch, not dinner\n• Always eat sabzi/dal before rice to slow glucose spike"
      : "• Rice is your best carb source for energy\n• 1–1.5 cups per meal is fine\n• Eat before and after workouts for peak performance"}\n\n**Smarter rice habits:**\n• Let cooked rice cool 12h in fridge → resistant starch increases → 30% fewer usable calories\n• 1 cup cooked white rice = 200 kcal, 45g carbs, 4g protein`,
    "mango":   `🥭 **Mango & Your Diet**\n\nMango is nutritious but calorie-dense for a fruit.\n\n**Nutrition per 100g:** 60 kcal · 15g sugar · 1g protein · Vitamin C 46mg · Vitamin A (high)\n\n**For ${goal==="fat_loss"?"fat loss":"your goal"}:**\n${goal==="fat_loss"
      ? "• Yes, you can eat mango — 1 small mango (150g) = 90 kcal\n• Best time: morning or pre-workout when carbs are used as fuel\n• Avoid after 6PM during fat loss phase\n• Don't pair with other high-carb foods (no mango + rice meal)"
      : "• Excellent for muscle gain — quick carbs + vitamins\n• Great pre-workout fruit (30 min before gym)\n• 1–2 mangoes per day is fine"}\n\n💡 Mango lassi or aamras = very high sugar. Have plain mango instead.`,
    "banana":  `🍌 **Banana in Your Diet**\n\nBananas are excellent fuel, especially for active people.\n\n**Per medium banana:** 90 kcal · 23g carbs · 12g sugar · 3g fibre · Potassium 422mg\n\n**Best times to eat:**\n• Pre-workout (30 min before) — perfect quick energy\n• Post-workout with protein shake\n• Morning for breakfast\n\n**For ${goal==="fat_loss"?"fat loss":"muscle gain"}:**\n${goal==="fat_loss"
      ? "• 1 banana/day is fine — don't avoid it\n• Prefer slightly unripe bananas — more resistant starch, lower sugar"
      : "• 2–3 bananas/day great for muscle gain\n• Banana + peanut butter = excellent bulking snack (290 kcal)"}\n\n❌ Myth: "Bananas make you fat." One banana has fewer calories than 2 biscuits.`,
    "egg":     `🥚 **Eggs — The Complete Protein**\n\n**Nutrition (1 whole egg):** 80 kcal · 6g protein · 5g fat · All 9 essential amino acids\n**Egg white only:** 17 kcal · 3.6g protein · 0g fat\n\n**How many per day?**\n${goal==="fat_loss"
      ? "• 2 whole eggs + 2 whites = 200 kcal, 22g protein → ideal fat loss breakfast\n• Yolk contains Vitamin D, B12, choline — don't avoid entirely"
      : "• 3–4 whole eggs/day is safe and beneficial for muscle gain\n• Eggs are the cheapest complete protein source in India"}\n\n**Myth busted:** Eggs don't significantly raise blood cholesterol in most people.\n\n**Best Indian egg preparations (healthy):**\n• Boiled · Poached · Scrambled with minimal oil · Egg white omelette\n\n**Avoid:** Double egg omelette with butter cooked in extra oil at restaurants`,
  };

  for (const [key, resp] of Object.entries(foodItems)) {
    if (q.includes(key)) return { type:"text", text:resp };
  }

  // ── 4. BMI ─────────────────────────────────────────────────────────────────
  if (q.includes("bmi") || q.includes("body mass index")) {
    const bmi = weight && height ? (weight / ((height/100)**2)).toFixed(1) : null;
    return { type:"text", text:`📏 **BMI (Body Mass Index)**\n\n**What it measures:** Weight relative to height — gives a rough indicator of healthy weight range.\n\n${bmi ? `**Your BMI: ${bmi}**\nCategory: ${+bmi < 18.5 ? "Underweight" : +bmi < 25 ? "✅ Normal weight" : +bmi < 30 ? "Overweight" : "Obese"}\n\n` : ""}**BMI Scale:**\n• Under 18.5 → Underweight\n• 18.5 – 24.9 → ✅ Normal\n• 25 – 29.9 → Overweight\n• 30+ → Obese\n\n**BMI limitation for Indians:** Indians tend to have higher body fat at lower BMI. The healthy range for South Asians is 18.5–23, not 18.5–25.\n\n**Better measurement:** Waist circumference is more accurate for Indians.\n• Men: under 90cm = healthy\n• Women: under 80cm = healthy` };
  }

  // ── 5. DIABETES / CHOLESTEROL / BLOOD PRESSURE ────────────────────────────
  if (q.includes("diabetes") || q.includes("sugar") && q.includes("blood")) {
    return { type:"text", text:`🩸 **Diet for Blood Sugar Control**\n\nIndians are genetically 4x more prone to type 2 diabetes. Diet is the most powerful tool.\n\n**What to prioritise:**\n• High fibre foods: rajma, oats, whole wheat roti, vegetables\n• Low glycemic: brown rice over white, ragi roti, barley\n• Protein at every meal — slows glucose absorption\n• Eat meals at fixed times — no skipping\n\n**What to reduce:**\n• White rice, maida, refined flour products\n• Fruit juices, sweetened chai/coffee\n• Packaged biscuits, namkeen, processed snacks\n• Late night eating\n\n**Best foods for blood sugar:**\n| Food | Why | \n|------|-----|\n| Bitter gourd (karela) | Lowers glucose naturally |\n| Fenugreek seeds (methi) | Improves insulin sensitivity |\n| Ragi | Low GI, high fibre |\n| Cinnamon | Reduces insulin resistance |\n\n⚠️ Please consult a doctor for personalised medical advice.` };
  }

  if (q.includes("cholesterol")) {
    return { type:"text", text:`🫀 **Cholesterol & Diet**\n\n**Foods that LOWER cholesterol:**\n• Oats (beta-glucan) · Walnuts · Fatty fish (salmon, mackerel)\n• Rajma, chickpeas · Flaxseed · Olive oil · Garlic\n\n**Foods that RAISE bad cholesterol:**\n• Fried foods · Vanaspati/hydrogenated oil · Full-fat packaged snacks\n• Red meat in excess · Refined carbs\n\n**Indian diet tips:**\n• Replace dalda with mustard oil or cold-pressed groundnut oil\n• Add 1 tbsp flaxseed to dal/roti daily\n• Eat 1 small handful walnuts/day (5g omega-3)\n• Oats for breakfast 5 days/week — proven 5–10% LDL reduction\n\n⚠️ High cholesterol needs medical treatment — diet alone may not be sufficient.` };
  }

  // ── 6. SLEEP ───────────────────────────────────────────────────────────────
  if (q.includes("sleep") || q.includes("insomnia") || q.includes("rest")) {
    return { type:"text", text:`💤 **Sleep & Your Health**\n\nSleep is the most underrated pillar of fitness. Here's the science:\n\n**For ${goal==="fat_loss"?"fat loss":goal==="muscle_gain"?"muscle gain":"your goal"}:**\n${goal==="fat_loss"
      ? "• Sleep deprivation raises ghrelin (hunger hormone) 24%\n• You crave high-calorie food the next day\n• Fat loss slows — body burns muscle instead in sleep debt\n• Cortisol stays high → belly fat storage increases"
      : goal==="muscle_gain"
      ? "• 70% of growth hormone releases during deep sleep\n• Muscle protein synthesis peaks at night 2–3AM\n• Less than 7h sleep = measurably less muscle gain per week"
      : "• 7–8 hours stabilises metabolism and cortisol\n• Consistent wake time matters as much as total hours"}\n\n**Improve sleep quality:**\n• Stop eating 2–3h before bed\n• Phone away 45 min before sleep (blue light blocks melatonin)\n• Room at 18–20°C\n• Magnesium glycinate 200mg before bed — well studied\n• Same wake time every day (even weekends) — most impactful habit` };
  }

  // ── 7. WATER ───────────────────────────────────────────────────────────────
  if (q.includes("water") || q.includes("hydration") || q.includes("how much drink") || q.includes("dehydrat")) {
    const daily = Math.round(weight * 0.033 * 10) / 10;
    return { type:"text", text:`💧 **Daily Water Intake for ${name}**\n\nBased on your weight (${weight}kg):\n\n**Your target: ${daily} litres/day (${Math.round(daily*1000)} ml)**\n\n**Timing for maximum benefit:**\n• 🌅 500ml immediately after waking → boosts metabolism 24% for 1 hour\n• 🍽️ 250ml 30 min before each meal → reduces calories eaten naturally\n• 💪 400–500ml during workout\n• 🌙 250ml one hour before bed\n\n**Signs of dehydration:**\nDark yellow urine · headache · fatigue · food cravings (often thirst misread as hunger)\n\n**Pro tip:** Add pinch of Himalayan salt + lemon to morning water — improves mineral absorption and fires up digestion.` };
  }

  // ── 8. STRESS ──────────────────────────────────────────────────────────────
  if (q.includes("stress") || q.includes("anxiety") || q.includes("cortisol") || q.includes("emotional eating")) {
    return { type:"text", text:`🧘 **Stress & Eating**\n\nCortisol (stress hormone) directly undermines your goals:\n\n• Triggers cravings for sugar and high-fat foods\n• Increases belly fat — even on a calorie deficit\n• Disrupts sleep → raises hunger hormones next day\n• Reduces willpower and decision-making\n\n**Anti-stress foods:**\n• 🍫 Dark chocolate 70%+ — lowers cortisol measurably\n• 🐟 Fatty fish — omega-3 reduces brain inflammation\n• 🫐 Blueberries — antioxidants fight stress damage\n• 🥜 Almonds — magnesium calms nervous system\n• 🍵 Green tea — L-theanine = calm focus without jitters\n\n**Immediate resets:**\n• 4-7-8 breathing: inhale 4 sec → hold 7 → exhale 8 (×3)\n• 10 min walk after stressful situations — cortisol drops 25%\n• Never skip meals when stressed — low blood sugar = higher cortisol` };
  }

  // ── 9. PROTEIN ─────────────────────────────────────────────────────────────
  if (q.includes("protein") || q.includes("how much protein")) {
    const proTarget = Math.round(weight * (goal==="muscle_gain" ? 2.2 : 1.6));
    return { type:"text", text:`💪 **Protein Guide for ${name}**\n\n**Your daily target: ${proTarget}g** (${goal==="muscle_gain"?"2.2g":"1.6g"}/kg for ${goal.replace("_"," ")})\n\n**Best Indian sources (per 100g):**\n\n| Food | Protein | Calories |\n|------|---------|----------|\n| Chicken breast | 31g | 165 kcal |\n| Egg white | 11g | 52 kcal |\n| Paneer | 18g | 265 kcal |\n| Moong dal (cooked) | 7g | 105 kcal |\n| Greek yogurt | 10g | 59 kcal |\n| Rajma (cooked) | 9g | 127 kcal |\n| Tuna (canned) | 26g | 116 kcal |\n\n**Per meal target:** ~${Math.round(proTarget/(user?.mealsPerDay||3))}g per meal across ${user?.mealsPerDay||3} meals\n\n**Tip:** Body absorbs ~30–40g of protein per meal effectively. Spread it out rather than eating all of it at once.` };
  }

  // ── 10. CALORIE / BMR / TDEE ───────────────────────────────────────────────
  if (q.includes("calorie") || q.includes("kcal") || q.includes("tdee") || q.includes("bmr") || q.includes("deficit") || q.includes("surplus")) {
    const bmr  = gender==="female" ? 10*weight+6.25*height-5*age-161 : 10*weight+6.25*height-5*age+5;
    const mults = {sedentary:1.2,light:1.375,moderate:1.55,active:1.725};
    const tdee = Math.round(bmr * (mults[user?.activity||"light"]));
    return { type:"text", text:`📊 **Your Calorie Breakdown, ${name}**\n\n**BMR (at complete rest):** ${Math.round(bmr)} kcal\n**TDEE (with your activity):** ${tdee} kcal\n**Your daily target:** ${target.toLocaleString()} kcal\n\n**Why:** ${goal==="fat_loss"?`${tdee} − 500 = ${tdee-500} kcal/day → ~0.5kg fat loss per week`:goal==="muscle_gain"?`${tdee} + 300 = ${tdee+300} kcal/day → lean muscle gain`:"= your TDEE → maintain current weight"}\n\n**How to hit your target:**\n• Protein: ${Math.round(weight*1.6)}g → ${Math.round(weight*1.6)*4} kcal\n• Remaining: ${target - Math.round(weight*1.6)*4} kcal from carbs + fats\n\n**Common hidden calorie traps:**\n• 1 tbsp oil = 120 kcal (most underestimated)\n• Sweet chai twice a day = 100–150 kcal\n• Packaged fruit juice 200ml = 90–110 kcal\n• Curd rice at night = 350–450 kcal` };
  }

  // ── 11. FAT LOSS ───────────────────────────────────────────────────────────
  if (q.includes("fat loss") || q.includes("lose weight") || q.includes("weight loss") || q.includes("lose fat") || q.includes("slim") || q.includes("reduce weight") || q.includes("get lean")) {
    return { type:"text", text:`🔥 **Fat Loss Plan for ${name}**\n\n**One law: Calories In < Calories Out**\n\nYour target: **${target.toLocaleString()} kcal/day** (${Math.max(0, Math.round((user?.weight||70)*10+6.25*(user?.height||170)-5*(user?.age||25)+(user?.gender==="male"?5:-161))*1.375-500)} kcal deficit = ~0.5kg/week)\n\n**5 highest-impact habits:**\n1. **Log every meal** → awareness alone cuts 200–300 kcal/day\n2. **Protein at every meal** → controls hunger, protects muscle\n3. **Walk 8,000 steps/day** → burns ~250 extra kcal\n4. **Eat fibre first** → dal/sabzi before rice/roti, slows sugar spike\n5. **Sleep 7–8h** → poor sleep = 24% more hunger hormone\n\n**Best fat-loss Indian foods:**\n• Moong dal chilla · Egg white omelette · Grilled chicken\n• Lauki sabzi · Broccoli · Spinach · Cucumber\n• Green tea + black coffee (before workout)\n\n**Avoid:** Maida items · fried snacks · packaged juices · eating after 9PM` };
  }

  // ── 12. MUSCLE GAIN ────────────────────────────────────────────────────────
  if (q.includes("muscle") || q.includes("bulk") || q.includes("gain weight") || q.includes("gain mass") || q.includes("build body") || q.includes("mass")) {
    return { type:"text", text:`💪 **Muscle Gain Plan for ${name}**\n\n**Target: ${target.toLocaleString()} kcal/day** (+300 kcal lean bulk)\n**Protein: ${Math.round(weight*2.2)}g/day** (2.2g per kg)\n\n**4 pillars:**\n1. **Progressive overload** — lift slightly heavier/more reps each week\n2. **High protein** — hit ${Math.round(weight*2.2)}g split across ${user?.mealsPerDay||3} meals\n3. **Calorie surplus** — 200–300 kcal above TDEE (lean bulk, not dirty bulk)\n4. **Sleep 8h** — 70% of growth hormone releases during deep sleep\n\n**Sample day:**\n• Breakfast: 3 eggs + 2 rotis + milk → 520 kcal, 38g protein\n• Lunch: Chicken 150g + rice 1 cup + dal → 580 kcal, 45g protein\n• Snack: Banana + peanut butter + whey → 400 kcal, 30g protein\n• Dinner: Paneer 150g + sabzi + rice → 480 kcal, 28g protein\n\n**Supplements worth taking:**\nCreatine 5g/day · Whey if diet short · Vitamin D3 2000IU` };
  }

  // ── 13. WORKOUT NUTRITION ─────────────────────────────────────────────────
  if (q.includes("workout") || q.includes("gym") || q.includes("exercise") || q.includes("pre workout") || q.includes("post workout") || q.includes("pre-workout") || q.includes("after gym") || q.includes("before gym") || q.includes("training")) {
    return { type:"text", text:`🏋️ **Workout Nutrition for ${name}**\n\n**Pre-workout (1–2 hours before):**\n• Complex carbs + moderate protein, low fat\n• Best: Banana + peanut butter · Oats + milk · Rice + dal\n• Avoid: High-fat meals (slow digestion), raw vegetables in bulk\n• Caffeine (black coffee) 30 min before = 10–15% performance boost\n\n**Post-workout (within 30 min — most important window):**\n• Fast protein + simple carbs to refuel glycogen\n• Best: Whey shake + banana · Eggs on toast · Chicken + white rice\n• Skip this and recovery slows ~40%\n\n**Rest day nutrition:**\n• Same protein intake (muscles repair on rest days too)\n• Reduce carbs by ~20%\n• Keep fats the same\n\n**Your post-workout protein target:** ${Math.round(weight*0.3)}g protein within 30 min` };
  }

  // ── 14. INTERMITTENT FASTING ──────────────────────────────────────────────
  if (q.includes("fasting") || q.includes("intermittent") || q.includes("16:8") || q.includes("16 8") || q.includes("if ")) {
    return { type:"text", text:`⏱️ **Intermittent Fasting (IF) Guide**\n\n**Most practical for Indians: 16:8**\n• Eat in 8-hour window: e.g. 12PM–8PM\n• Fast other 16 hours (sleep counts)\n• Black tea/coffee allowed — NO milk or sugar\n\n**Benefits:**\n• Naturally reduces calorie intake without counting\n• Improves insulin sensitivity (vital for Indians — genetically prone to diabetes)\n• Simplifies meal planning\n• Reduces bloating\n\n**For your goal (${goal.replace("_"," ")}):**\n${goal==="fat_loss"
      ? "✅ Excellent. Easy to maintain deficit.\n• Still hit protein target: "+Math.round(weight*1.6)+"g/day in your eating window"
      : goal==="muscle_gain"
      ? "⚠️ Harder — difficult to eat enough in 8 hours.\n• Try 14:10 instead. Or restrict only on rest days."
      : "✅ Works well. Sustainable long-term habit."}\n\n**Break your fast with:** Protein first (eggs, dal, paneer) — NOT fruits or pure carbs alone.` };
  }

  // ── 15. HIGH PROTEIN BREAKFAST ────────────────────────────────────────────
  if (q.includes("breakfast") && (q.includes("protein") || q.includes("high protein"))) {
    return { type:"text", text:`🍳 **High Protein Breakfast for ${name}**\n\nTop 5 ranked by protein:\n\n1. **Whey Protein Oats** — 30g protein, 310 kcal\n   Oats + whey scoop + banana + milk\n\n2. **Egg White Omelette (3 whites)** — 20g protein, 100 kcal\n   With spinach, mushroom, capsicum\n\n3. **Paneer Bhurji (low oil)** — 14g protein, 190 kcal\n   100g crumbled paneer + capsicum + spices\n\n4. **Greek Yogurt Bowl** — 12g protein, 130 kcal\n   150g yogurt + berries + 1 tsp honey\n\n5. **Moong Dal Chilla ×2** — 9g protein, 140 kcal\n   Soaked moong paste + ginger + green chilli\n\n💡 **Why it matters:** Protein breakfast reduces total daily calories eaten by ~400 kcal through hunger hormone control.` };
  }

  // ── 16. GENERAL BREAKFAST ─────────────────────────────────────────────────
  if (q.includes("breakfast")) {
    return { type:"text", text:`🌅 **Best Breakfast for ${goal.replace("_"," ")}**\n\n${goal==="fat_loss"
      ? "**Under 300 kcal + high protein:**\n• Egg white omelette + 1 toast (155 kcal)\n• Moong dal chilla ×2 + curd (200 kcal)\n• Steamed idli ×3 + sambar (210 kcal)\n• Besan chilla + mint chutney (190 kcal)"
      : goal==="muscle_gain"
      ? "**High calorie + high protein:**\n• Oats + whey + banana + milk (420 kcal, 35g P)\n• 3 whole eggs + 2 rotis + milk (520 kcal, 38g P)\n• Paneer bhurji + 2 rotis + yogurt (500 kcal, 30g P)"
      : "**Balanced 300–400 kcal:**\n• Poha + chai (230 kcal)\n• Idli ×2 + sambar (200 kcal)\n• Oats porridge + fruit (280 kcal)"}\n\n**Golden rule:** Eat within 1 hour of waking. Skipping breakfast raises cortisol and causes overeating at lunch.` };
  }

  // ── 17. VEGETARIAN SOURCES / VEGAN ───────────────────────────────────────
  if (q.includes("vegetarian") || q.includes("vegan") || q.includes("plant") || q.includes("no meat")) {
    return { type:"text", text:`🌱 **Vegetarian Protein Sources for ${name}**\n\n**Top plant proteins (per 100g cooked):**\n\n| Food | Protein | Notes |\n|------|---------|-------|\n| Paneer | 18g | Complete protein |\n| Soya chunks | 52g | Best plant protein |\n| Moong dal | 7g | Easy to digest |\n| Rajma | 9g | High fibre too |\n| Chickpeas | 9g | Versatile |\n| Greek yogurt | 10g | Probiotic benefit |\n| Tofu | 8g | Versatile, low cal |\n\n**To hit ${Math.round(weight*1.6)}g protein/day as vegetarian:**\n• Paneer 100g at lunch (18g) + Greek yogurt 150g (15g) + Dal twice (14g) + Eggs (if lacto-ovo) = 60–80g easily\n• Add soya chunks to curries for a big protein boost\n• Whey protein supplement covers the gap if needed\n\n**Combine grains + legumes** (rice + dal, roti + rajma) for complete amino acid profiles.` };
  }

  // ── 18. FIBER / GUT ───────────────────────────────────────────────────────
  if (q.includes("fiber") || q.includes("fibre") || q.includes("gut") || q.includes("digestion") || q.includes("bloat") || q.includes("constipat")) {
    return { type:"text", text:`🌾 **Fibre & Gut Health**\n\n**Daily target:** 25–35g/day (most Indians get only 10–15g)\n\n**Best Indian fibre sources:**\n• Rajma/chickpeas: 6–7g per ½ cup\n• Whole wheat roti: 2g per piece\n• Oats: 4g per ½ cup dry\n• Broccoli/carrot: 3g per 100g\n• Apple with skin: 4g\n• Isabgol (psyllium husk): 7g per tbsp — best supplement\n\n**For ${goal==="fat_loss"?"fat loss":"your goal"}:** High fibre = slower digestion = longer fullness = fewer calories consumed naturally.\n\n**Reduce bloating:**\n• Soak beans overnight + rinse before cooking\n• Add hing (asafoetida) to dal — natural anti-bloating\n• Fermented foods daily (curd, idli, dosa) for gut bacteria\n• Increase fibre gradually over 2 weeks\n• Drink more water as you increase fibre` };
  }

  // ── 19. VITAMINS / SUPPLEMENTS ────────────────────────────────────────────
  if (q.includes("vitamin") || q.includes("supplement") || q.includes("b12") || q.includes("d3") || q.includes("iron") || q.includes("deficiency") || q.includes("calcium")) {
    return { type:"text", text:`💊 **Supplements for Indians**\n\n**Most common deficiencies in India:**\n\n| Nutrient | Who needs it | Best source |\n|---------|-------------|-------------|\n| Vitamin D3 | Most Indians (indoor jobs) | Sunlight 20min/day + fish |\n| Vitamin B12 | All vegetarians | Eggs, dairy, fortified milk |\n| Iron | Women especially | Spinach+lemon, rajma, ragi |\n| Calcium | All ages | Milk, curd, ragi, sesame |\n| Omega-3 | Everyone | Walnuts, flaxseed, fish |\n\n**Actually worth taking:**\n1. **Vitamin D3 2000–4000 IU/day** — most impactful for Indians\n2. **Creatine monohydrate 5g/day** — if building muscle (most researched supplement)\n3. **Whey protein** — only if food can't cover protein goal\n4. **Omega-3 1g/day** — if not eating fish 3x/week\n\n**Save your money on:** BCAAs · Fat burners · Detox teas · "Weight gain" powders with sugar` };
  }

  // ── 20. FALLBACK for relevant topic but no specific match ─────────────────
  return { type:"text", text:`I see you're asking about **"${msg}"**.\n\nHere's what I can help with specifically:\n\n🍛 **Recipes** — *"Recipe for chicken biryani"* · *"How to make dal tadka"*\n📋 **Meal plans** — *"What should I eat for fat loss"* · *"Weekly diet plan"*\n💪 **Protein & nutrition** — *"High protein breakfast"* · *"Vegetarian protein sources"*\n🔥 **Fat loss** — *"Tips to lose fat"* · *"Is rice good for weight loss"*\n💪 **Muscle gain** — *"How to build muscle"* · *"Bulking diet plan"*\n😴 **Sleep** · 💧 **Hydration** · 🧘 **Stress & eating**\n⚡ **Workout meals** · ⏱️ **Intermittent fasting**\n💊 **Vitamins & supplements** · 🩸 **Diabetes & cholesterol**\n\nCould you rephrase your question? I'll give you a detailed personalised answer!` };
}

// ── Irrelevant response ───────────────────────────────────────────────────────
function sorryResponse(msg) {
  return {
    type:"text",
    text:`😊 Sorry, I'm a **nutrition and health assistant** and can only help with food, diet, and wellness topics.\n\nYou asked: *"${msg}"*\n\n**I can help you with:**\n🍛 Recipes (biryani, dal, paneer tikka and 15+ more)\n📋 Personalised meal plans\n💪 Protein & calorie targets\n🔥 Fat loss strategies\n💪 Muscle gain nutrition\n😴 Sleep & stress effects on health\n💧 Hydration targets\n⚡ Pre/post workout food\n⏱️ Intermittent fasting\n💊 Vitamins & supplements for Indians\n\nPlease ask something from these topics and I'll give you a detailed answer! 🙏`,
  };
}

// ── CHATBOT COMPONENT ─────────────────────────────────────────────────────────
export default function AIChatbot({ onClose, initialQuery }) {
  const { user } = useApp();
  const [messages, setMessages] = useState([{
    role:"bot", type:"text",
    text:`👋 Hi **${user?.name?.split(" ")[0]||"there"}**! I'm your NutriFlow AI Health Assistant.\n\nI specialise in **food, nutrition, and healthy lifestyle** topics only.\n\nAsk me about:\n🍛 Recipes · 📋 Meal plans · 💪 Protein\n🔥 Fat loss · 💪 Muscle gain · 😴 Sleep\n💧 Water · ⚡ Workout food · ⏱️ Fasting\n\nOr click a suggestion below!`,
  }]);
  const [input,  setInput]  = useState(initialQuery || "");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef();
  const inputRef  = useRef();
  const initSent  = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (initialQuery && !initSent.current) {
      initSent.current = true;
      setTimeout(() => sendMessage(initialQuery), 500);
    }
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;
    setInput("");
    setMessages(prev => [...prev, { role:"user", text:msg }]);
    setTyping(true);

    try {
      // Use Gemini API if key is configured
      const usingGemini = GEMINI_API_KEY && !GEMINI_API_KEY.startsWith("PASTE");
      if (usingGemini) {
        const aiText = await askGemini(msg, user);
        setMessages(prev => [...prev, { role:"bot", type:"text", text: aiText }]);
      } else {
        // Fallback to built-in engine
        await new Promise(r => setTimeout(r, 500 + Math.random()*300));
        const resp = isHealthTopic(msg) ? generateResponse(msg, user) : sorryResponse(msg);
        setMessages(prev => [...prev, { role:"bot", ...resp }]);
      }
    } catch (e) {
      console.error("Gemini error:", e);
      // Fallback to built-in on error
      const resp = isHealthTopic(msg) ? generateResponse(msg, user) : sorryResponse(msg);
      setMessages(prev => [...prev, { role:"bot", ...resp }]);
    } finally {
      setTyping(false);
    }
  }, [input, typing, user]);

  function handleKey(e) {
    if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function renderText(text) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("|")) {
        const cells = line.split("|").filter(c => c.trim() && !c.trim().match(/^[-\s]+$/));
        if (!cells.length) return null;
        return (
          <div key={i} style={{display:"flex",margin:"1px 0"}}>
            {cells.map((c,j) => (
              <div key={j} style={{flex:1,padding:"3px 7px",background:j===0?"var(--bg)":"transparent",fontSize:"11px",borderBottom:"1px solid var(--border)"}}>
                {c.trim().split(/\*\*(.+?)\*\*/g).map((p,k)=>k%2===1?<strong key={k}>{p}</strong>:p)}
              </div>
            ))}
          </div>
        );
      }
      return (
        <div key={i} style={{marginBottom:line===""?".4rem":"2px",lineHeight:1.65,fontSize:"13px"}}>
          {line.split(/\*\*(.+?)\*\*/g).map((p,j)=>j%2===1?<strong key={j}>{p}</strong>:p)}
        </div>
      );
    }).filter(Boolean);
  }

  return (
    <>
      <style>{`
        @keyframes chatIn{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes dotBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      `}</style>
      <div style={{
        position:"fixed",bottom:"90px",right:"24px",
        width:"390px",maxHeight:"600px",
        background:"var(--card)",borderRadius:"20px",
        border:"1px solid var(--border)",
        boxShadow:"0 24px 64px rgba(0,0,0,.18)",
        display:"flex",flexDirection:"column",
        zIndex:1000,overflow:"hidden",
        animation:"chatIn .25s ease",
      }}>

        {/* Header */}
        <div style={{padding:"1rem 1.2rem",background:"linear-gradient(135deg,#085041,#1D9E75)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"38px",height:"38px",borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>🤖</div>
            <div>
              <div style={{fontWeight:700,color:"#fff",fontSize:"14px"}}>NutriFlow AI</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,.7)",display:"flex",alignItems:"center",gap:"5px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#9FE1CB"}}/>
                Food · Nutrition · Lifestyle
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",width:"28px",height:"28px",borderRadius:"50%",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:"10px"}}>
          {messages.map((m,i) => (
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:"7px"}}>
              {m.role==="bot" && (
                <div style={{width:"26px",height:"26px",borderRadius:"50%",background:"var(--gl)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",flexShrink:0}}>🤖</div>
              )}
              <div style={{
                maxWidth:"86%",padding:"10px 13px",
                borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                background:m.role==="user"?"var(--g)":"var(--bg)",
                color:m.role==="user"?"#fff":"var(--text)",
                border:m.role==="bot"?"1px solid var(--border)":"none",
              }}>
                {m.type==="recipe" ? (
                  <div>
                    <div style={{fontWeight:700,fontSize:"14px",marginBottom:".5rem"}}>🍽️ {m.name}</div>
                    <div style={{display:"flex",gap:"7px",marginBottom:".8rem",flexWrap:"wrap"}}>
                      <span style={{background:"var(--gl)",color:"var(--gd)",fontSize:"11px",fontWeight:600,padding:"2px 8px",borderRadius:"5px"}}>{m.cal} kcal</span>
                      <span style={{background:"#E0F0FF",color:"#0C447C",fontSize:"11px",fontWeight:600,padding:"2px 8px",borderRadius:"5px"}}>Protein: {m.pro}g</span>
                    </div>
                    <div style={{fontSize:"11px",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".5rem"}}>Steps</div>
                    {m.steps.map((step,si) => (
                      <div key={si} style={{display:"flex",gap:"8px",marginBottom:"6px",alignItems:"flex-start"}}>
                        <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"var(--g)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700,flexShrink:0,marginTop:"1px"}}>{si+1}</div>
                        <div style={{fontSize:"12px",lineHeight:1.55}}>{step}</div>
                      </div>
                    ))}
                    <div style={{background:"var(--al)",borderRadius:"8px",padding:"8px 10px",marginTop:".8rem",fontSize:"11px",color:"var(--ad)"}}>💡 {m.tip}</div>
                  </div>
                ) : renderText(m.text)}
              </div>
              {m.role==="user" && (
                <div style={{width:"26px",height:"26px",borderRadius:"50%",background:"var(--g)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:700,color:"#fff",flexShrink:0}}>
                  {(user?.name||"U")[0].toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
              <div style={{width:"26px",height:"26px",borderRadius:"50%",background:"var(--gl)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px"}}>🤖</div>
              <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:"16px",padding:"11px 15px",display:"flex",gap:"5px"}}>
                {[0,1,2].map(d=>(
                  <div key={d} style={{width:"7px",height:"7px",borderRadius:"50%",background:"var(--g)",animation:`dotBounce .7s ${d*.15}s infinite`}}/>
                ))}
              </div>
            </div>
          )}

          {messages.length===1 && !typing && (
            <div style={{marginTop:".3rem"}}>
              <div style={{fontSize:"11px",color:"var(--muted)",marginBottom:".5rem",fontWeight:600}}>Try asking:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                {QUICK_SUGGESTIONS.map(s=>(
                  <button key={s.label} onClick={()=>sendMessage(s.query)}
                    style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:"20px",padding:"5px 12px",fontSize:"11px",fontWeight:500,cursor:"pointer",color:"var(--text)",transition:"all .15s"}}
                    onMouseEnter={e=>{e.target.style.borderColor="var(--g)";e.target.style.background="var(--gl)"}}
                    onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.background="var(--bg)"}}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{padding:".8rem 1rem",borderTop:"1px solid var(--border)",display:"flex",gap:"8px",flexShrink:0}}>
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Ask about food, recipes, nutrition…"
            style={{flex:1,border:"1.5px solid var(--border)",borderRadius:"10px",padding:"9px 13px",fontSize:"13px",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"'DM Sans',sans-serif",transition:"border-color .15s"}}
            onFocus={e=>e.target.style.borderColor="var(--g)"}
            onBlur={e=>e.target.style.borderColor="var(--border)"}
          />
          <button onClick={()=>sendMessage()} disabled={!input.trim()||typing}
            style={{background:input.trim()&&!typing?"var(--g)":"var(--border)",color:"#fff",border:"none",borderRadius:"10px",width:"40px",height:"40px",cursor:input.trim()&&!typing?"pointer":"default",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s",flexShrink:0}}>
            ➤
          </button>
        </div>
      </div>
    </>
  );
}
