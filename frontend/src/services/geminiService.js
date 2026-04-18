import { GEMINI_API_KEY, GEMINI_URL, SYSTEM_PROMPT } from "../config/gemini";
import { getProteinMultiplier } from "../utils/nutritionCalculator";

export async function askGemini(userMessage, userProfile) {
  const experience    = userProfile?.experience || "beginner";
  const proteinPerKg  = getProteinMultiplier(experience);
  const proteinTarget = userProfile?.weight
    ? Math.round(userProfile.weight * proteinPerKg)
    : 120;

  const context = userProfile ? `
Current user profile:
- Name: ${userProfile.name || "User"}
- Goal: ${userProfile.goal === "fat_loss" ? "Fat Loss" : userProfile.goal === "muscle_gain" ? "Muscle Gain" : "Maintenance"}
- Experience level: ${experience} (${experience === "beginner" ? "less than 1 year training" : experience === "intermediate" ? "1–3 years training" : "3+ years training"})
- Daily calorie target: ${userProfile.target || 2000} kcal
- Daily protein target: ${proteinTarget}g (${proteinPerKg}g/kg — based on ${experience} level)
- Weight: ${userProfile.weight || 70} kg
- Height: ${userProfile.height || 170} cm
- Age: ${userProfile.age || 25}
- Gender: ${userProfile.gender || "male"}
- Activity level: ${userProfile.activity || "light"}
- Meals per day: ${userProfile.mealsPerDay || 3}
- Dietary preference: ${userProfile.diet || "no preference"}

IMPORTANT: This user is a ${experience}. Do NOT recommend ${
    experience === "beginner"
      ? "2.2g/kg protein — that is for advanced athletes. Use 1.5g/kg for beginners."
      : experience === "intermediate"
      ? "more than 1.8g/kg protein."
      : "more than 2.1g/kg protein."
  }
` : "";

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${context}\nUser message: ${userMessage}`;

  let response;
  try {
    response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    });
  } catch (networkErr) {
    throw new Error("network error - check internet connection");
  }

  const raw = await response.text();

  if (!response.ok) {
    console.error("Gemini HTTP error:", response.status, raw);
    if (response.status === 400) throw new Error("API key invalid or request malformed");
    if (response.status === 403) throw new Error("API key not authorised");
    if (response.status === 429) throw new Error("quota exceeded - too many requests");
    throw new Error(`Gemini error ${response.status}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("Gemini parse error:", raw);
    throw new Error("Could not parse Gemini response");
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("Gemini empty response:", JSON.stringify(data));
    throw new Error("Gemini returned empty response");
  }

  return text.trim();
}