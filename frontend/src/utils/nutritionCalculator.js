// ─── Single source of truth for all nutrition calculations ───────────────────

export function getProteinMultiplier(experience) {
  if (experience === "beginner")     return 1.5;
  if (experience === "intermediate") return 1.8;
  if (experience === "advanced")     return 2.1;
  return 1.5;
}

export function getCalorieTarget(tdee, goal, experience) {
  if (goal === "fat_loss") {
    if (experience === "beginner")     return tdee - 200;
    if (experience === "intermediate") return tdee - 300;
    if (experience === "advanced")     return tdee - 400;
    return tdee - 200;
  }
  if (goal === "muscle_gain") {
    if (experience === "beginner")     return tdee + 100;
    if (experience === "intermediate") return tdee + 200;
    if (experience === "advanced")     return tdee + 300;
    return tdee + 100;
  }
  return tdee;
}

export function calculateMacros(user, tdee) {
  const experience = user.experience || "beginner";
  const goal       = user.goal       || "maintain";
  const weight     = user.weight     || 70;

  const protein  = Math.round(weight * getProteinMultiplier(experience));
  const calories = getCalorieTarget(tdee, goal, experience);

  const proteinCalories   = protein * 4;
  const fatCalories       = calories * 0.25;
  const fat               = Math.round(fatCalories / 9);
  const remainingCalories = calories - (proteinCalories + fatCalories);
  const carbs             = Math.round(Math.max(0, remainingCalories) / 4);

  return {
    calories: Math.round(calories),
    protein,
    fat,
    carbs,
  };
}

export function calcBMR(u) {
  const { weight: w = 70, height: h = 170, age: a = 25, gender: g = "male" } = u;
  return g === "male"
    ? 10 * w + 6.25 * h - 5 * a + 5
    : 10 * w + 6.25 * h - 5 * a - 161;
}

export function calcTDEE(u) {
  const m = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  return Math.round(calcBMR(u) * (m[u.activity] || 1.375));
}

export function calcTarget(u) {
  const tdee = calcTDEE(u);
  return getCalorieTarget(tdee, u.goal || "maintain", u.experience || "beginner");
}

export function getExperienceLabel(experience) {
  if (experience === "beginner")     return "Beginner";
  if (experience === "intermediate") return "Intermediate";
  if (experience === "advanced")     return "Advanced";
  return "Beginner";
}

export function getExperienceDescription(experience) {
  if (experience === "beginner")     return "Less than 1 year training";
  if (experience === "intermediate") return "1–3 years training";
  if (experience === "advanced")     return "3+ years training";
  return "Less than 1 year training";
}