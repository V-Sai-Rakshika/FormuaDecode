// ── FormulaDecode App Logic ────────────────────────────────
// ── Helpers ──────────────────────────────────────────────

// ── Persist state to localStorage ────────────────────────────
function saveState() {
  // Only persist data for logged-in users
  if (!FD_Auth?.isLoggedIn()) return;
  try {
    localStorage.setItem(
      "fd-state",
      JSON.stringify({
        scanHistory: DD.state.scanHistory,
        savedProducts: DD.state.savedProducts,
        favorites: DD.state.favorites,
      }),
    );
  } catch (e) {}
}

function loadState() {
  // Only load persisted data for logged-in users
  if (!FD_Auth?.isLoggedIn()) return;
  try {
    const saved = localStorage.getItem("fd-state");
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (parsed.scanHistory) DD.state.scanHistory = parsed.scanHistory;
    if (parsed.savedProducts) DD.state.savedProducts = parsed.savedProducts;
    if (parsed.favorites) DD.state.favorites = parsed.favorites;
  } catch (e) {}
}

// loadState is called from initAuth after DD is confirmed ready

function getOnboardingQuestionList() {
  if (Array.isArray(DD.onboardingQuestions)) return DD.onboardingQuestions;
  return Object.values(DD.onboardingQuestions || {}).flat();
}

function getDefaultProfile() {
  return {
    name: "",
    age: "",
    gender: "",

    skinType: {
      postWashFeel: "",
      daytimeShine: "",
      poreSize: "",
      skinTypeSelf: "Combination",
      tightAfterCleansing: "",
    },

    sensitivity: {
      productsIrritate: "",
      sensitivityLevel: "",
      fragranceSensitive: "",
      allergicReactions: "",
      commonReactions: [],
    },

    acneBreakouts: {
      acneFrequency: "",
      acneType: [],
      breakoutLocation: [],
    },

    concerns: {
      biggestConcerns: ["Hyperpigmentation", "Acne"],
      hyperpigmentationLevel: "",
      darkCircles: "",
      dullnessFrequency: "",
    },

    barrierHealth: {
      peelingFlaking: "",
      dehydratedFrequency: "",
      redEasily: "",
    },

    sunEnvironment: {
      sunExposure: "",
      sunscreenUse: "",
    },

    lifestyle: {
      waterIntake: "",
      sleepQuality: "",
      stressLevel: "",
    },

    productCompatibility: {
      issueIngredients: ["Fragrance"],
      lookForIngredients: [],
      skincareGoal: [],
    },

    bonusAI: {
      makeupFrequency: "",
      poreClogging: "",
      prescriptionTreatment: "",
      activeExperience: "",
      fitzpatrick: "",
    },

    allergies: [],
  };
}

function buildProfileFromAnswers(answers) {
  const profile = getDefaultProfile();

  profile.name = answers.name || "User";
  profile.age = answers.age || "";
  profile.gender = answers.gender || "";

  profile.skinType.postWashFeel = answers.postWashFeel || "";
  profile.skinType.daytimeShine = answers.daytimeShine || "";
  profile.skinType.poreSize = answers.poreSize || "";
  profile.skinType.skinTypeSelf = answers.skinTypeSelf || "Combination";
  profile.skinType.tightAfterCleansing = answers.tightAfterCleansing || "";

  profile.sensitivity.productsIrritate = answers.productsIrritate || "";
  profile.sensitivity.sensitivityLevel = answers.sensitivityLevel || "";
  profile.sensitivity.fragranceSensitive = answers.fragranceSensitive || "";
  profile.sensitivity.allergicReactions = answers.allergicReactions || "";
  profile.sensitivity.commonReactions = answers.commonReactions || [];

  profile.acneBreakouts.acneFrequency = answers.acneFrequency || "";
  profile.acneBreakouts.acneType = answers.acneType || [];
  profile.acneBreakouts.breakoutLocation = answers.breakoutLocation || [];

  profile.concerns.biggestConcerns = answers.biggestConcerns || [];
  profile.concerns.hyperpigmentationLevel =
    answers.hyperpigmentationLevel || "";
  profile.concerns.darkCircles = answers.darkCircles || "";
  profile.concerns.dullnessFrequency = answers.dullnessFrequency || "";

  profile.barrierHealth.peelingFlaking = answers.peelingFlaking || "";
  profile.barrierHealth.dehydratedFrequency = answers.dehydratedFrequency || "";
  profile.barrierHealth.redEasily = answers.redEasily || "";

  profile.sunEnvironment.sunExposure = answers.sunExposure || "";
  profile.sunEnvironment.sunscreenUse = answers.sunscreenUse || "";

  profile.lifestyle.waterIntake = answers.waterIntake || "";
  profile.lifestyle.sleepQuality = answers.sleepQuality || "";
  profile.lifestyle.stressLevel = answers.stressLevel || "";

  profile.productCompatibility.issueIngredients =
    answers.issueIngredients || [];
  profile.productCompatibility.lookForIngredients =
    answers.lookForIngredients || [];
  profile.productCompatibility.skincareGoal = answers.skincareGoal || [];

  profile.bonusAI.makeupFrequency = answers.makeupFrequency || "";
  profile.bonusAI.poreClogging = answers.poreClogging || "";
  profile.bonusAI.prescriptionTreatment = answers.prescriptionTreatment || "";
  profile.bonusAI.activeExperience = answers.activeExperience || "";
  profile.bonusAI.fitzpatrick = answers.fitzpatrick || "";

  return profile;
}

function getDisplaySkinType(profile) {
  return profile?.skinType?.skinTypeSelf || "Combination";
}

function getDisplayConcerns(profile) {
  return profile?.concerns?.biggestConcerns || [];
}

function getDisplaySensitivities(profile) {
  const items = [];
  const issueIngredients =
    profile?.productCompatibility?.issueIngredients || [];
  const commonReactions = profile?.sensitivity?.commonReactions || [];

  if (profile?.sensitivity?.fragranceSensitive === "Yes")
    items.push("Fragrance");
  issueIngredients.forEach((i) => {
    if (i !== "None" && i !== "Not Sure" && !items.includes(i)) items.push(i);
  });
  commonReactions.forEach((r) => {
    if (r !== "None" && !items.includes(r)) items.push(r);
  });

  return items;
}

function getSensitivityKeywords(profile) {
  return [
    ...getDisplaySensitivities(profile),
    ...(profile?.productCompatibility?.issueIngredients || []),
  ]
    .filter(Boolean)
    .filter((v) => v !== "None" && v !== "Not Sure")
    .map((v) => v.toLowerCase());
}

// ── Router ────────────────────────────────────────────────
function showPage(id) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));
  const page = document.getElementById("page-" + id);
  if (page) page.classList.add("active");
  const link = document.querySelector(`[data-page="${id}"]`);
  if (link) link.classList.add("active");
  DD.state.currentPage = id;

  closeChatModal();
}

// ── Onboarding ────────────────────────────────────────────
let onboardStep = 0;
let onboardAnswers = {};

function initOnboarding() {
  onboardStep = 0;
  onboardAnswers = {};
  renderOnboardStep();
}

function renderOnboardStep() {
  const questions = getOnboardingQuestionList();
  const q = questions[onboardStep];
  const total = questions.length;
  const container = document.getElementById("onboard-content");

  if (!q || !container) return;

  const progressHtml = questions
    .map(
      (_, i) =>
        `<div class="onboard-step ${i < onboardStep ? "done" : i === onboardStep ? "active" : ""}"></div>`,
    )
    .join("");
  document.getElementById("onboard-progress").innerHTML = progressHtml;

  let optionsHtml = "";
  if (q.type === "text") {
    const value = onboardAnswers[q.id] || "";
    optionsHtml = `<input class="input" id="onboard-text-input" value="${value}" placeholder="${q.placeholder || ""}" style="font-size:16px;padding:16px;" />`;
  } else {
    optionsHtml =
      `<div class="option-chips">` +
      q.options
        .map(
          (opt) =>
            `<div class="option-chip ${isSelected(q.id, opt.value) ? "selected" : ""}"
              data-qid="${q.id}" data-val="${opt.value}" data-type="${q.type}"
              onclick="toggleOption(this, '${q.id}', '${String(opt.value).replace(/'/g, "\\'")}', '${q.type}')">
           ${opt.label}
         </div>`,
        )
        .join("") +
      `</div>`;
  }

  container.innerHTML = `
    <div class="fade-in">
      ${q.category ? `<div class="onboard-sub" style="margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em">${q.category}</div>` : ""}
      <div class="onboard-question">${q.question}</div>
      <div class="onboard-sub">${q.sub || ""}</div>
      ${optionsHtml}
    </div>
  `;

  document.getElementById("onboard-counter").textContent =
    `${onboardStep + 1} / ${total}`;

  const backBtn = document.getElementById("onboard-back");
  backBtn.style.display = onboardStep === 0 ? "none" : "";
}

function isSelected(qid, val) {
  const ans = onboardAnswers[qid];
  if (!ans) return false;
  if (Array.isArray(ans)) return ans.includes(val);
  return ans === val;
}

function toggleOption(el, qid, val, type) {
  if (type === "single") {
    onboardAnswers[qid] = val;
    document
      .querySelectorAll(`[data-qid="${qid}"]`)
      .forEach((c) => c.classList.remove("selected"));
    el.classList.add("selected");
  } else {
    if (!onboardAnswers[qid]) onboardAnswers[qid] = [];
    const idx = onboardAnswers[qid].indexOf(val);
    if (idx >= 0) {
      onboardAnswers[qid].splice(idx, 1);
      el.classList.remove("selected");
    } else {
      onboardAnswers[qid].push(val);
      el.classList.add("selected");
    }
  }
}

function onboardNext() {
  const questions = getOnboardingQuestionList();
  const q = questions[onboardStep];

  if (!q) return;

  if (q.type === "text") {
    const input = document.getElementById("onboard-text-input");
    onboardAnswers[q.id] = input ? input.value.trim() : "";
  }

  if (onboardStep < questions.length - 1) {
    onboardStep++;
    renderOnboardStep();
  } else {
    DD.profile = buildProfileFromAnswers(onboardAnswers);
    completeOnboarding();
  }
}

function onboardBack() {
  if (onboardStep > 0) {
    const questions = getOnboardingQuestionList();
    const q = questions[onboardStep];

    if (q?.type === "text") {
      const input = document.getElementById("onboard-text-input");
      onboardAnswers[q.id] = input ? input.value.trim() : "";
    }

    onboardStep--;
    renderOnboardStep();
  }
}

function completeOnboarding() {
  // If DB-saving version is available, use it instead
  if (window.completeOnboardingWithSave) {
    window.completeOnboardingWithSave();
    return;
  }
  const overlay = document.getElementById("onboard-complete-overlay");
  overlay.style.display = "flex";
  setTimeout(() => {
    overlay.style.display = "none";
    document.getElementById("page-onboarding").classList.remove("active");
    document.getElementById("nav").style.display = "flex";
    showPage("dashboard");
    renderDashboard();
  }, 2000);
}

// ── Dashboard ─────────────────────────────────────────────
function renderDashboard() {
  const profile = FD_Auth?.isLoggedIn() && DD.profile ? DD.profile : {};
  const greetName = FD_Auth?.isLoggedIn()
    ? FD_Auth.userProfile?.full_name?.split(" ")[0] || profile.name || "there"
    : "there";
  document.getElementById("dash-greeting-name").textContent = greetName;
  document.getElementById("dash-skin-type").textContent = FD_Auth?.isLoggedIn()
    ? getDisplaySkinType(profile) || "Complete your profile"
    : "Sign in for your profile";

  const tagsEl = document.getElementById("dash-concern-tags");
  if (FD_Auth?.isLoggedIn()) {
    const tags = [
      ...getDisplayConcerns(profile),
      ...getDisplaySensitivities(profile),
    ];
    tagsEl.innerHTML = tags
      .slice(0, 3)
      .map((t) => `<span class="badge badge-green">${t}</span>`)
      .join("");
  } else {
    tagsEl.innerHTML = "";
  }

  document.getElementById("stat-scans").textContent =
    DD.state.scanHistory.length;
  document.getElementById("stat-saved").textContent =
    DD.state.savedProducts.length;
  document.getElementById("stat-avoided").textContent =
    DD.state.scanHistory.reduce(
      (acc, p) => acc + (p.badIngredients?.length || 0),
      0,
    );
  document.getElementById("stat-favorites").textContent =
    DD.state.favorites.length;

  renderRecentHistory();
  renderRoutine();
  renderSensitivityAlert();

  // Hide CTA for logged-in users, show for guests
  const ctaCard = document.getElementById("personalized-cta-card");
  if (ctaCard) {
    ctaCard.style.display = FD_Auth?.isLoggedIn() ? "none" : "block";
  }
}

function renderRecentHistory() {
  const container = document.getElementById("recent-scans");
  const recent = DD.state.scanHistory.slice(0, 3);
  if (!recent.length) {
    container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">No scans yet — scan your first product to get started!</div>`;
    return;
  }
  container.innerHTML = recent
    .map(
      (p) =>
        `<div class="history-card" onclick="viewProduct(${p.id})">
      <div class="history-thumb">${p.emoji || "•"}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700">${p.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">${p.brand} · ${p.type}</div>
        <div style="margin-top:6px;display:flex;gap:6px;align-items:center">
          ${renderScoreTag(p.scores.overall)}
          ${renderCompatTag(p.scores.skinCompatibility)}
        </div>
      </div>
      <span style="color:var(--text-muted);font-size:18px">›</span>
    </div>`,
    )
    .join("");
}

function renderRoutine() {
  const container = document.getElementById("routine-list");
  if (!container) return;

  if (!FD_Auth?.isLoggedIn()) {
    container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">
      Sign in and complete your skin profile to get a personalized routine check.
    </div>`;
    return;
  }

  if (!DD.state.savedProducts.length) {
    container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">
      Save products from your analysis to see routine compatibility here.
    </div>`;
    return;
  }

  container.innerHTML = DD.state.savedProducts
    .slice(0, 5)
    .map((p) => {
      const compat = p.scores?.skinCompatibility || 0;
      const color = compat >= 8 ? "jade" : compat >= 5 ? "amber" : "coral";
      return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:20px">${p.emoji || "🧪"}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
          <div style="font-size:11px;color:var(--text-muted)">${p.brand}</div>
        </div>
        <div style="font-size:13px;font-weight:700;color:var(--${color})">${compat.toFixed(0)}%</div>
      </div>`;
    })
    .join("");
}

function renderScoreTag(score) {
  const color = score >= 8 ? "green" : score >= 6 ? "amber" : "red";
  return `<span class="badge badge-${color}">⭐ ${score}</span>`;
}

function renderCompatTag(score) {
  const text =
    score >= 9 ? "Excellent match" : score >= 7 ? "Good match" : "Use caution";
  const color = score >= 9 ? "green" : score >= 7 ? "blue" : "red";
  return `<span class="badge badge-${color}">${text}</span>`;
}

// ── Scan / Upload ─────────────────────────────────────────
let activeScanTab = "image";

function switchScanTab(tab) {
  activeScanTab = tab;
  document
    .querySelectorAll(".upload-tab")
    .forEach((t) => t.classList.remove("active"));
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
  document.getElementById("scan-image-panel").style.display =
    tab === "image" ? "block" : "none";
  document.getElementById("scan-text-panel").style.display =
    tab === "text" ? "block" : "none";
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById("upload-zone").classList.add("drag-over");
}

function handleDragLeave() {
  document.getElementById("upload-zone").classList.remove("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById("upload-zone").classList.remove("drag-over");
  const file = e.dataTransfer?.files?.[0];
  if (file) simulateImageScan(file);
}

function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (file) simulateImageScan(file);
}

function simulateImageScan(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const imgEl = document.getElementById("uploaded-preview");
    imgEl.src = e.target.result;
    imgEl.style.display = "block";
    document.getElementById("upload-zone").style.display = "none";
    document.getElementById("scan-preview-section").style.display = "block";
  };
  reader.readAsDataURL(file);
}

function analyzeScan() {
  showLoading([
    "🔍 Detecting product...",
    "🧬 Extracting ingredients via OCR...",
    "🤖 Running AI analysis...",
    "📊 Generating your report...",
  ]);
  setTimeout(() => {
    hideLoading();
    // Use a demo product as OCR placeholder until real OCR is wired up
    const demo = createDemoProduct();
    DD.state.currentProduct = demo;
    DD.state.scanHistory.unshift(demo);
    showPage("analysis");
    renderAnalysis(demo);
  }, 3600);
}

function analyzeIngredientList(ingredientList) {
  const good = [],
    bad = [],
    warn = [];

  // Extended local ingredient classifications
  const INGREDIENT_DB = {
    // Beneficial
    niacinamide: {
      type: "beneficial",
      benefits:
        "Controls oil, minimizes pores, evens skin tone, reduces inflammation. Clinically proven at 4-10%.",
    },
    "hyaluronic acid": {
      type: "beneficial",
      benefits:
        "Deep hydration, plumping. Holds 1000x its weight in water. Suitable for all skin types.",
    },
    glycerin: {
      type: "beneficial",
      benefits:
        "Gentle humectant, draws moisture to skin. Non-comedogenic, safe for all skin types.",
    },
    "ceramide np": {
      type: "beneficial",
      benefits:
        "Restores skin barrier, prevents moisture loss. Essential lipid naturally found in skin.",
    },
    "ceramide ap": {
      type: "beneficial",
      benefits: "Strengthens skin barrier and improves moisture retention.",
    },
    "ceramide eop": {
      type: "beneficial",
      benefits:
        "Key barrier lipid that seals moisture and protects against irritants.",
    },
    ceramides: {
      type: "beneficial",
      benefits:
        "Restores skin barrier, prevents moisture loss, soothes irritation.",
    },
    retinol: {
      type: "beneficial",
      benefits:
        "Anti-aging, collagen stimulation, cell turnover. Start at 0.025% and build up slowly. Use SPF.",
    },
    "salicylic acid": {
      type: "beneficial",
      benefits:
        "BHA that exfoliates inside pores, fights acne, unclogs blackheads. Effective at 0.5–2%.",
    },
    "vitamin c": {
      type: "beneficial",
      benefits:
        "Brightening antioxidant, reduces hyperpigmentation. Most potent as L-Ascorbic Acid at 10-20%.",
    },
    "ascorbic acid": {
      type: "beneficial",
      benefits:
        "Pure Vitamin C. Brightens, protects from free radicals, boosts collagen. Potent but can irritate sensitive skin.",
    },
    panthenol: {
      type: "beneficial",
      benefits:
        "Pro-Vitamin B5. Healing, soothing, moisture-retaining. Good for barrier repair.",
    },
    "zinc pca": {
      type: "beneficial",
      benefits:
        "Oil control, antibacterial, anti-inflammatory. Excellent for acne-prone and combination skin.",
    },
    "lactic acid": {
      type: "beneficial",
      benefits:
        "Gentle AHA exfoliant and humectant. Brightening with less irritation than glycolic acid.",
    },
    "azelaic acid": {
      type: "beneficial",
      benefits:
        "FDA-approved for rosacea. Anti-acne, reduces hyperpigmentation, calms redness.",
    },
    "ferulic acid": {
      type: "beneficial",
      benefits:
        "Antioxidant that stabilizes and doubles efficacy of Vitamin C and E.",
    },
    tocopherol: {
      type: "beneficial",
      benefits:
        "Vitamin E. Antioxidant, moisturizing, skin healing. Works synergistically with Vitamin C.",
    },
    allantoin: {
      type: "beneficial",
      benefits:
        "Soothing, healing, reduces irritation. Promotes cell renewal. Excellent for sensitive skin.",
    },
    "centella asiatica": {
      type: "beneficial",
      benefits:
        "Calms inflammation, promotes wound healing, strengthens barrier. Great for sensitive/acne skin.",
    },
    madecassoside: {
      type: "beneficial",
      benefits:
        "Potent anti-inflammatory from Centella. Accelerates healing, reduces redness.",
    },
    peptides: {
      type: "beneficial",
      benefits:
        "Signal proteins that boost collagen and elastin production. Anti-aging and firming.",
    },
    adenosine: {
      type: "beneficial",
      benefits:
        "Anti-wrinkle, anti-inflammatory. Clinically proven to reduce fine lines.",
    },
    "tranexamic acid": {
      type: "beneficial",
      benefits:
        "Reduces dark spots and melasma. Gentler alternative to hydroquinone.",
    },
    "alpha arbutin": {
      type: "beneficial",
      benefits:
        "Brightens hyperpigmentation, inhibits melanin production. Gentler than kojic acid.",
    },
    "kojic acid": {
      type: "beneficial",
      benefits:
        "Brightens dark spots by inhibiting melanin. Effective but can irritate sensitive skin.",
    },
    resveratrol: {
      type: "beneficial",
      benefits:
        "Powerful antioxidant, anti-aging. Protects against environmental damage.",
    },
    squalane: {
      type: "beneficial",
      benefits:
        "Lightweight non-comedogenic moisturizer. Identical to skin's own lipids. All skin types.",
    },
    "jojoba oil": {
      type: "beneficial",
      benefits:
        "Closely mimics skin sebum. Balancing, non-comedogenic, suitable for oily skin.",
    },
    "rosehip oil": {
      type: "beneficial",
      benefits:
        "Rich in Vitamin A and C. Brightening, anti-aging, improves texture.",
    },
    bakuchiol: {
      type: "beneficial",
      benefits:
        "Plant-based retinol alternative. Anti-aging benefits with less irritation.",
    },
    gluconolactone: {
      type: "beneficial",
      benefits:
        "PHA exfoliant. Very gentle, suitable for sensitive skin. Also a humectant.",
    },
    "polyglutamic acid": {
      type: "beneficial",
      benefits: "Super-humectant, 4x more moisturizing than hyaluronic acid.",
    },
    "propylene glycol": {
      type: "beneficial",
      benefits:
        "Humectant and penetration enhancer. Helps other ingredients absorb better.",
    },
    "sodium hyaluronate": {
      type: "beneficial",
      benefits:
        "Salt form of hyaluronic acid. Smaller molecule, penetrates deeper for lasting hydration.",
    },
    "hydrolyzed hyaluronic acid": {
      type: "beneficial",
      benefits:
        "Fragmented HA that penetrates deeper into skin for targeted hydration.",
    },
    betaine: {
      type: "beneficial",
      benefits:
        "Natural humectant and soothing agent. Reduces irritation, improves moisture.",
    },
    "xanthan gum": {
      type: "beneficial",
      benefits:
        "Natural thickener and stabilizer. Helps create gel texture, safe and non-irritating.",
    },
    carbomer: {
      type: "beneficial",
      benefits:
        "Gel-forming polymer for texture. Creates smooth, stable formulas. Generally safe.",
    },
    cholesterol: {
      type: "beneficial",
      benefits:
        "Skin-identical barrier lipid. Works with ceramides to restore and maintain barrier function.",
    },
    phytosphingosine: {
      type: "beneficial",
      benefits:
        "Skin-identical lipid. Anti-microbial, anti-inflammatory, supports barrier.",
    },

    // Caution
    "alcohol denat.": {
      type: "caution",
      benefits:
        "Helps product spread and dry quickly. Can disrupt skin barrier with frequent use at high concentrations.",
    },
    "denatured alcohol": {
      type: "caution",
      benefits:
        "Fast-drying solvent. Drying and barrier-disrupting at high concentrations.",
    },
    alcohol: {
      type: "caution",
      benefits:
        "Solvent and preservative. Potentially drying; depends on concentration and formulation context.",
    },
    parabens: {
      type: "caution",
      benefits:
        "Effective preservatives. Safe at regulated levels but some avoid due to endocrine disruption concerns.",
    },
    methylparaben: {
      type: "caution",
      benefits:
        "Common preservative. Safe within regulated limits; some consumers prefer to avoid.",
    },
    propylparaben: {
      type: "caution",
      benefits:
        "Preservative. Effective antimicrobial; ongoing discussion around hormone sensitivity.",
    },
    "essential oils": {
      type: "caution",
      benefits:
        "Provide fragrance and some antioxidants. Common sensitizers — can cause reactions in sensitive skin.",
    },
    "citric acid": {
      type: "caution",
      benefits:
        "pH adjuster and mild AHA. Useful in formulas but can be irritating in high concentrations.",
    },
    "sodium chloride": {
      type: "caution",
      benefits:
        "Salt used as thickener. Generally safe but can be drying in some rinse-off products.",
    },
    "peg compounds": {
      type: "caution",
      benefits:
        "Penetration enhancers and humectants. Some concerns around impurities in low-grade versions.",
    },
    "cocamidopropyl betaine": {
      type: "caution",
      benefits:
        "Gentle surfactant from coconut oil. Occasionally causes sensitization in some individuals.",
    },

    // Harmful
    fragrance: {
      type: "harmful",
      benefits:
        "Scent only — no skin benefit. Top allergen and common sensitizer. Can cause contact dermatitis.",
    },
    parfum: {
      type: "harmful",
      benefits:
        "Fragrance blend — no skin benefit. Common sensitizer and top allergen in cosmetics.",
    },
    "sodium lauryl sulfate": {
      type: "harmful",
      benefits:
        "Harsh surfactant for foaming. Strips natural oils, disrupts barrier. Used in clinical trials as a skin irritant.",
    },
    sls: {
      type: "harmful",
      benefits:
        "Harsh foaming agent. Strips barrier lipids. Avoid if you have sensitive or dry skin.",
    },
    "sodium laureth sulfate": {
      type: "harmful",
      benefits:
        "Milder than SLS but still a strong surfactant. Can disrupt barrier with regular use.",
    },
    formaldehyde: {
      type: "harmful",
      benefits:
        "Preservative. Known carcinogen and strong allergen. Banned in many countries.",
    },
    "mineral oil": {
      type: "caution",
      benefits:
        "Occlusive moisturizer. Creates a barrier to lock in moisture but can trap acne-causing bacteria for some.",
    },
    dimethicone: {
      type: "caution",
      benefits:
        "Silicone that smooths texture and seals moisture. Generally safe but can trap congestion for acne-prone skin.",
    },
  };

  // Normalize and match ingredients
  const normalizedList = ingredientList.map((name) => {
    const lower = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^a-z0-9\s().%/-]/g, "");

    // Direct match
    if (INGREDIENT_DB[lower]) return { original: name, key: lower };

    // Partial match for common patterns
    const keys = Object.keys(INGREDIENT_DB);
    const partial = keys.find((k) => lower.includes(k) || k.includes(lower));
    if (partial) return { original: name, key: partial };

    // Ceramide variants
    if (lower.startsWith("ceramide"))
      return { original: name, key: "ceramides" };
    if (lower.includes("hyaluronic"))
      return { original: name, key: "hyaluronic acid" };
    if (lower.includes("niacinamide"))
      return { original: name, key: "niacinamide" };
    if (lower.includes("retinol") || lower.includes("retinyl"))
      return { original: name, key: "retinol" };
    if (lower.includes("fragrance") || lower.includes("parfum"))
      return { original: name, key: "fragrance" };
    if (lower.includes("paraben"))
      return { original: name, key: "methylparaben" };
    if (lower.includes("vitamin c") || lower.includes("ascorbic"))
      return { original: name, key: "ascorbic acid" };
    if (lower.includes("vitamin e") || lower.includes("tocopherol"))
      return { original: name, key: "tocopherol" };
    if (lower.includes("salicylic"))
      return { original: name, key: "salicylic acid" };
    if (lower.includes("glycerin") || lower.includes("glycerol"))
      return { original: name, key: "glycerin" };
    if (lower.includes("panthenol"))
      return { original: name, key: "panthenol" };
    if (lower.includes("niacinamide"))
      return { original: name, key: "niacinamide" };
    if (lower.includes("alcohol"))
      return { original: name, key: "alcohol denat." };
    if (lower.includes("sodium lauryl"))
      return { original: name, key: "sodium lauryl sulfate" };

    return { original: name, key: null };
  });

  // Classify
  const enrichedList = normalizedList.map(({ original, key }) => {
    const data = key ? INGREDIENT_DB[key] : null;
    if (data?.type === "beneficial") good.push(original);
    else if (data?.type === "harmful") bad.push(original);
    else if (data?.type === "caution") warn.push(original);
    return { name: original, data };
  });

  const total = ingredientList.length;
  const knownCount = good.length + bad.length + warn.length;

  // ── Profile-aware scoring ──────────────────────────────
  const profile = FD_Auth?.isLoggedIn() && DD.profile ? DD.profile : {};
  const skinType = profile.skinType?.skinTypeSelf?.toLowerCase() || "";
  const userConcerns = (profile.concerns?.biggestConcerns || []).map((c) =>
    c.toLowerCase(),
  );
  const issueIngredients = (
    profile.productCompatibility?.issueIngredients || []
  )
    .filter((i) => i !== "None" && i !== "Not Sure")
    .map((i) => i.toLowerCase());
  const fragranceSensitive = profile.sensitivity?.fragranceSensitive === "Yes";
  const sensitivityLevel =
    profile.sensitivity?.sensitivityLevel?.toLowerCase() || "";
  const isSensitive =
    sensitivityLevel.includes("high") || sensitivityLevel.includes("very");

  // Count profile-specific good/bad
  let profileBonus = 0;
  let profilePenalty = 0;

  enrichedList.forEach(({ name, data }) => {
    if (!data) return;
    const lower = name.toLowerCase();

    // Penalize user's known issue ingredients
    if (issueIngredients.some((i) => lower.includes(i))) profilePenalty += 1.5;

    // Penalize fragrance for sensitive users
    if (
      fragranceSensitive &&
      (lower.includes("fragrance") || lower.includes("parfum"))
    )
      profilePenalty += 2;

    // Bonus for ingredients that match user concerns
    if (
      userConcerns.includes("acne") &&
      (lower.includes("salicylic") ||
        lower.includes("niacinamide") ||
        lower.includes("zinc"))
    )
      profileBonus += 0.5;
    if (
      userConcerns.includes("hyperpigmentation") &&
      (lower.includes("niacinamide") ||
        lower.includes("vitamin c") ||
        lower.includes("tranexamic") ||
        lower.includes("arbutin"))
    )
      profileBonus += 0.5;
    if (
      userConcerns.includes("hydration") &&
      (lower.includes("hyaluronic") ||
        lower.includes("glycerin") ||
        lower.includes("ceramide"))
    )
      profileBonus += 0.3;

    // Penalize harsh ingredients for sensitive skin
    if (isSensitive && data.type === "harmful") profilePenalty += 1;
  });

  // Cap bonuses and penalties
  profileBonus = Math.min(1.5, profileBonus);
  profilePenalty = Math.min(4, profilePenalty);

  // Base scores
  const rawQuality =
    knownCount === 0
      ? 5.5
      : Math.min(
          10,
          ((good.length * 1.0 + warn.length * 0.3 - bad.length * 1.5) /
            Math.max(knownCount, 1)) *
            10,
        );
  const qualityScore = Math.max(
    1,
    Math.min(10, rawQuality + profileBonus * 0.3),
  );

  const sciScore = Math.min(
    10,
    Math.max(
      3,
      (knownCount / Math.max(total, 1)) * 10 +
        (good.length / Math.max(total, 1)) * 3,
    ),
  );

  const riskScore = Math.min(
    10,
    Math.max(0, bad.length * 2.5 + warn.length * 0.6 + profilePenalty * 0.5),
  );

  const compatScore = Math.max(
    1,
    Math.min(
      10,
      10 - riskScore * 0.7 - profilePenalty * 0.4 + profileBonus * 0.3,
    ),
  );

  const overall = Math.min(
    10,
    Math.max(
      1,
      qualityScore * 0.35 +
        sciScore * 0.2 +
        compatScore * 0.3 +
        (10 - riskScore) * 0.15,
    ),
  );

  // Interactions
  const interactions = [];
  if (DD.interactionRules) {
    DD.interactionRules.forEach((rule) => {
      const aFound = ingredientList.some((i) =>
        i.toLowerCase().includes(rule.a.toLowerCase()),
      );
      const bFound = ingredientList.some((i) =>
        i.toLowerCase().includes(rule.b.toLowerCase()),
      );
      if (aFound && bFound) interactions.push(rule);
    });
  }

  const id = `scan_${Date.now()}`;
  return {
    id,
    name: "Custom Ingredient Scan",
    brand: "Pasted Formula",
    type: "Skincare",
    price: "—",
    quantity: "—",
    emoji: "🧪",
    scores: {
      overall: parseFloat(overall.toFixed(1)),
      ingredientQuality: parseFloat(qualityScore.toFixed(1)),
      scientificBacking: parseFloat(sciScore.toFixed(1)),
      skinCompatibility: parseFloat(compatScore.toFixed(1)),
      valueForMoney: 7.0,
      risk: parseFloat(riskScore.toFixed(1)),
    },
    goodIngredients: good,
    badIngredients: bad,
    warnIngredients: warn,
    fullIngredients: ingredientList,
    enrichedIngredients: enrichedList,
    interactions,
  };
}

function createDemoProduct() {
  return analyzeIngredientList([
    "Niacinamide",
    "Zinc PCA",
    "Glycerin",
    "Dimethicone",
    "Panthenol",
    "Lactic Acid",
  ]);
}

async function analyzeText() {
  const text = document.getElementById("ingredient-text-input").value.trim();
  if (!text) return alert("Please paste ingredient list first!");

  const ingredientList = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  showLoading([
    "🧬 Parsing ingredients...",
    "🔬 Cross-referencing database...",
    "🤖 AI analysis in progress...",
    "📊 Building your report...",
  ]);

  // Get Groq key
  const key = typeof FD_CONFIG !== "undefined" ? FD_CONFIG.groqApiKey : "";

  // Build profile context for Groq
  const profile = FD_Auth?.isLoggedIn() && DD.profile ? DD.profile : {};
  const skinType = profile.skinType?.skinTypeSelf || "Not specified";
  const concerns =
    (profile.concerns?.biggestConcerns || []).join(", ") || "None";
  const issueIngredients =
    (profile.productCompatibility?.issueIngredients || [])
      .filter((i) => i !== "None" && i !== "Not Sure")
      .join(", ") || "None";
  const fragranceSensitive =
    profile.sensitivity?.fragranceSensitive === "Yes" ? "Yes" : "No";
  const sensitivityLevel =
    profile.sensitivity?.sensitivityLevel || "Not specified";

  let aiResult = null;

  if (key) {
    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            max_tokens: 800,
            temperature: 0.2,
            messages: [
              {
                role: "system",
                content: `You are a friendly skincare expert explaining ingredients to a beginner. Be warm, clear, and simple — like explaining to a friend who knows nothing about skincare. Avoid jargon. Return ONLY valid JSON with no markdown, no extra text.`,
              },
              {
                role: "user",
                content: `Analyze these skincare ingredients for this exact user profile. 

IMPORTANT RULES:
- Only use the EXACT profile data provided below. Do NOT assume, infer, or add any extra concerns or conditions.
- If the user says "occasional acne" do NOT treat it as a major acne concern. Only score it as mild.
- Only flag ingredients that conflict with what is EXPLICITLY listed below.
- Do NOT infer hyperpigmentation from acne, or vice versa.

USER PROFILE (use ONLY what is listed here):
- Skin Type: ${skinType}
- Concerns (EXACT list, nothing else): ${concerns || "None listed"}
- Fragrance Sensitive: ${fragranceSensitive}
- Sensitivity Level: ${sensitivityLevel}
- Problem Ingredients (EXACT list): ${issueIngredients || "None listed"}

INGREDIENTS TO ANALYZE:
${ingredientList.join(", ")}

For ingredientDetails, explain each ingredient in 1-2 simple sentences like talking to a friend. Example: "Think of this as a moisture magnet — it pulls water into your skin and keeps it plump all day. Great for your skin type!"

Return ONLY this exact JSON (no markdown, no extra text):
{
  "productName": "Ingredient Scan",
  "brand": "Custom Formula Analysis",
  "scores": {
    "ingredientQuality": <number 1-10>,
    "scientificBacking": <number 1-10>,
    "skinCompatibility": <number 1-10>,
    "risk": <number 0-10>
  },
  "overall": <number 1-10>,
  "goodIngredients": ["exact ingredient name as given"],
  "badIngredients": ["exact ingredient name as given"],
  "warnIngredients": ["exact ingredient name as given"],
  "ingredientDetails": {
    "ExactIngredientName": "friendly 1-2 sentence explanation for this specific user"
  },
  "interactions": [
    {"a": "Ingredient1", "b": "Ingredient2", "type": "synergy or conflict", "desc": "simple explanation"}
  ]
}`,
              },
            ],
          }),
        },
      );

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      // Strip any markdown fences just in case
      const clean = content.replace(/```json|```/g, "").trim();
      aiResult = JSON.parse(clean);
    } catch (e) {
      console.warn("Groq analysis failed, falling back to local:", e);
    }
  }

  // Build product object from AI result or fallback to local
  let analyzed;
  if (aiResult) {
    analyzed = {
      id: `scan_${Date.now()}`,
      name: aiResult.productName || "Ingredient Scan",
      brand: aiResult.brand || "Custom Formula Analysis",
      type: "Skincare",
      price: "—",
      quantity: "—",
      emoji: "🧪",
      scores: {
        overall: parseFloat((aiResult.overall || 6).toFixed(1)),
        ingredientQuality: parseFloat(
          (aiResult.scores?.ingredientQuality || 6).toFixed(1),
        ),
        scientificBacking: parseFloat(
          (aiResult.scores?.scientificBacking || 6).toFixed(1),
        ),
        skinCompatibility: parseFloat(
          (aiResult.scores?.skinCompatibility || 6).toFixed(1),
        ),
        valueForMoney: 7.0,
        risk: parseFloat((aiResult.scores?.risk || 3).toFixed(1)),
      },
      goodIngredients: aiResult.goodIngredients || [],
      badIngredients: aiResult.badIngredients || [],
      warnIngredients: aiResult.warnIngredients || [],
      fullIngredients: ingredientList,
      enrichedIngredients: ingredientList.map((name) => ({
        name,
        data: aiResult.ingredientDetails?.[name]
          ? {
              benefits: aiResult.ingredientDetails[name],
              type: (aiResult.goodIngredients || []).includes(name)
                ? "beneficial"
                : (aiResult.badIngredients || []).includes(name)
                  ? "harmful"
                  : "caution",
            }
          : null,
      })),
      interactions: aiResult.interactions || [],
    };
  } else {
    // Fallback to local analysis
    analyzed = analyzeIngredientList(ingredientList);
  }

  setTimeout(() => {
    hideLoading();
    DD.state.currentProduct = analyzed;
    if (FD_Auth?.isLoggedIn()) {
      DD.state.scanHistory.unshift(analyzed);
      saveState();
      // Also save to Supabase for cross-device sync
      if (typeof saveScanToDB === "function") saveScanToDB(analyzed);
    }
    showPage("analysis");
    renderAnalysis(analyzed);
  }, 3600);
}

// ── Analysis Render ───────────────────────────────────────
function renderAnalysis(product) {
  const compatibility = product.scores.skinCompatibility;
  const compatLabel =
    compatibility >= 9
      ? "Excellent Match"
      : compatibility >= 7
        ? "Good Match"
        : "Use Caution";
  const compatColor =
    compatibility >= 9 ? "green" : compatibility >= 7 ? "blue" : "red";
  const sensitivityKeywords = getSensitivityKeywords(DD.profile);
  const hasSensitivity = product.fullIngredients.some((ing) =>
    sensitivityKeywords.some((s) => ing.toLowerCase().includes(s)),
  );

  // Render full product header with emoji, name, meta, badges and save button together
  document.getElementById("product-header").innerHTML = `
  <div class="product-header-emoji">${product.emoji || "🧪"}</div>
    <div class="product-header-info">
      <div class="product-header-name">${product.name}</div>
      <div class="product-header-meta">${product.brand} · ${product.type} · ${product.price} / ${product.quantity}</div>
      <div class="product-header-tags">
        <span class="badge badge-${compatColor}">${compatLabel}</span>
        <span class="badge badge-blue">${product.type}</span>
        ${product.badIngredients.length > 0 ? '<span class="badge badge-red">⚠ Flagged Ingredient</span>' : ""}
        ${hasSensitivity ? '<span class="badge badge-amber">⚡ Sensitivity Alert</span>' : ""}
      </div>
    </div>
    <div class="product-header-actions" style="margin-left:auto;display:flex;gap:8px;align-items:flex-start;flex-shrink:0;">
      <button class="btn btn-secondary btn-sm" id="save-btn" onclick="saveCurrentProduct('${product.id}', this)">🤍 Save</button>
      <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard?.writeText('${product.name}').then(()=>alert('Copied!'))">📋 Copy</button>
    </div>
  `;

  const tagsEl = document.getElementById("analysis-tags");
  if (tagsEl) tagsEl.innerHTML = "";

  // ── Analysis Grid ───────────────────────────────────────
  const grid = document.getElementById("analysis-grid");
  if (!grid) return;
  grid.style.cssText =
    "display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:24px 32px 48px;width:100%;box-sizing:border-box;";

  const circ = 2 * Math.PI * 48;
  const overallOffset = circ * (1 - product.scores.overall / 10);
  const scoreColor =
    product.scores.overall >= 8
      ? "#2dda93"
      : product.scores.overall >= 6
        ? "#f5a623"
        : "#ff6b6b";

  const scoreBar = (score, reverse = false) => {
    const pct = score * 10;
    const type = reverse
      ? score < 3
        ? "good"
        : score < 6
          ? "warning"
          : "danger"
      : score >= 8
        ? "good"
        : score >= 5
          ? "warning"
          : "danger";
    return `<div class="progress-bar"><div class="progress-fill ${type}" style="width:${pct}%"></div></div>`;
  };

  const ingredientPills = (names, type) =>
    names.length
      ? names
          .map((n) => `<span class="ingredient-pill ${type}">${n}</span>`)
          .join(" ")
      : `<span style="color:var(--text-muted);font-size:13px">None detected.</span>`;

  const ingredientCards = (names, type) =>
    names.length
      ? names
          .map((name) => {
            const enriched = (
              DD.state.currentProduct?.enrichedIngredients || []
            ).find((e) => e.name === name);
            const data = enriched?.data ||
              DD.ingredients[name] || {
                benefits:
                  "Base ingredient — commonly used as filler, solvent, or texture agent with minimal skin benefit.",
                concerns: [],
                research: "",
              };
            const isSens = sensitivityKeywords.some((s) =>
              name.toLowerCase().includes(s.toLowerCase()),
            );
            return `
          <div class="ingredient-item ${type}" onclick="toggleIngredientExpand(this)" style="cursor:pointer">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div class="ingredient-name">${name}</div>
              <div style="display:flex;gap:6px;align-items:center">
                ${isSens ? '<span class="badge badge-amber">Your Sensitivity</span>' : ""}
                <span style="color:var(--text-muted);font-size:12px">▼</span>
              </div>
            </div>
            <div class="ingredient-desc expand-content" style="display:none;margin-top:8px">
              <div style="margin-bottom:6px">${data.benefits}</div>
              ${data.concerns?.length ? `<div style="color:var(--amber);font-size:11px;margin-top:6px">${data.concerns.join(" · ")}</div>` : ""}
              ${data.research ? `<div class="ingredient-why" style="margin-top:8px;font-size:11px;color:var(--text-muted);font-style:italic">${data.research}</div>` : ""}
            </div>
          </div>`;
          })
          .join("")
      : `<div style="color:var(--text-muted);font-size:13px;padding:12px 0">None detected.</div>`;

  const interactionsHtml = (product.interactions || []).length
    ? product.interactions
        .map((ix) => {
          const isSynergy = ix.type === "synergy";
          return `
          <div class="interaction-card">
            <div class="interaction-pair" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
              <span class="badge badge-${isSynergy ? "green" : "amber"}">${ix.a}</span>
              <span style="font-size:14px">${isSynergy ? "+" : "⚡"}</span>
              <span class="badge badge-${isSynergy ? "green" : "amber"}">${ix.b}</span>
            </div>
            <div style="font-size:13px;color:var(--text-secondary)">${ix.desc}</div>
          </div>`;
        })
        .join("")
    : `<div style="color:var(--text-muted);font-size:13px">No notable interactions detected.</div>`;

  const fullListHtml = (product.fullIngredients || [])
    .map((name, i) => {
      const type = product.badIngredients.includes(name)
        ? "harmful"
        : product.warnIngredients.includes(name)
          ? "caution"
          : product.goodIngredients.includes(name)
            ? "beneficial"
            : "neutral";
      return `<span class="ingredient-pill ${type}" style="animation-delay:${i * 0.04}s">${name}</span>`;
    })
    .join(" ");

  grid.innerHTML = `

    <!-- ── Formula Score ─────────────────────────────── -->
    <div class="card p-24" style="grid-column:1/-1">
      <div class="section-title" style="font-size:16px;margin-bottom:24px">Formula <span>Score</span></div>
      <div style="display:flex;align-items:center;gap:48px;flex-wrap:wrap">

        <!-- Ring -->
        <div style="position:relative;width:130px;height:130px;flex-shrink:0">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="52" fill="none" stroke="var(--bg-elevated)" stroke-width="10"/>
            <circle cx="65" cy="65" r="52" fill="none" stroke="${scoreColor}" stroke-width="10"
              stroke-dasharray="${(2 * Math.PI * 52).toFixed(1)}"
              stroke-dashoffset="${(2 * Math.PI * 52 * (1 - product.scores.overall / 10)).toFixed(1)}"
              stroke-linecap="round" transform="rotate(-90 65 65)"
              style="transition:stroke-dashoffset 1.2s ease"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div style="font-size:30px;font-weight:900;color:${scoreColor};line-height:1">${product.scores.overall.toFixed(1)}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">/10</div>
          </div>
        </div>

        <!-- Score Bars -->
        <div style="flex:1;min-width:260px;display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:150px;flex-shrink:0;font-size:13px;color:var(--text-secondary)">Ingredient Quality</div>
            <div style="flex:1" class="progress-bar">${scoreBar(product.scores.ingredientQuality)}</div>
            <div style="width:36px;text-align:right;font-size:13px;font-weight:700;color:var(--text-primary)">${product.scores.ingredientQuality.toFixed(1)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:150px;flex-shrink:0;font-size:13px;color:var(--text-secondary)">Scientific Backing</div>
            <div style="flex:1" class="progress-bar">${scoreBar(product.scores.scientificBacking)}</div>
            <div style="width:36px;text-align:right;font-size:13px;font-weight:700;color:var(--text-primary)">${product.scores.scientificBacking.toFixed(1)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:150px;flex-shrink:0;font-size:13px;color:var(--text-secondary)">Skin Compatibility</div>
            <div style="flex:1" class="progress-bar">${scoreBar(product.scores.skinCompatibility)}</div>
            <div style="width:36px;text-align:right;font-size:13px;font-weight:700;color:var(--text-primary)">${product.scores.skinCompatibility.toFixed(1)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:150px;flex-shrink:0;font-size:13px;color:var(--text-secondary)">Risk Score</div>
            <div style="flex:1" class="progress-bar">${scoreBar(product.scores.risk, true)}</div>
            <div style="width:36px;text-align:right;font-size:13px;font-weight:700;color:${product.scores.risk > 5 ? "var(--coral)" : "var(--jade)"}">${product.scores.risk.toFixed(1)}</div>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Good Ingredients ──────────────────────────── -->
    <div class="card p-24">
      <div class="section-title" style="font-size:15px;margin-bottom:16px">✅ Good <span>Ingredients</span></div>
      ${ingredientCards(product.goodIngredients, "good")}
    </div>

    <!-- ── Flagged Ingredients ───────────────────────── -->
    <div class="card p-24">
      <div class="section-title" style="font-size:15px;margin-bottom:16px">🚫 Flagged <span>Ingredients</span></div>
      ${ingredientCards(product.badIngredients, "bad")}
    </div>

    <!-- ── Use With Caution ──────────────────────────── -->
    <div class="card p-24">
      <div class="section-title" style="font-size:15px;margin-bottom:16px">⚠️ Use With <span>Caution</span></div>
      ${ingredientCards(product.warnIngredients, "warn")}
    </div>

    <!-- ── Ingredient Interactions ───────────────────── -->
    <div class="card p-24">
      <div class="section-title" style="font-size:15px;margin-bottom:16px">⚡ Ingredient <span>Interactions</span></div>
      ${interactionsHtml}
    </div>

    <!-- ── Full Ingredient List ──────────────────────── -->
    <div class="card p-24" style="grid-column:1/-1">
      <div class="section-title" style="font-size:15px;margin-bottom:20px">📋 Full <span>Ingredient List</span></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${(product.fullIngredients || [])
          .map((name, i) => {
            const type = product.badIngredients.includes(name)
              ? "harmful"
              : product.warnIngredients.includes(name)
                ? "caution"
                : product.goodIngredients.includes(name)
                  ? "beneficial"
                  : "neutral";
            const enriched = (product.enrichedIngredients || []).find(
              (e) => e.name === name,
            );
            const data = enriched?.data;
            const desc =
              data?.benefits ||
              "Base ingredient — commonly used as filler, solvent, or texture agent. No specific concerns noted.";
            const colorMap = {
              beneficial: "var(--jade)",
              harmful: "var(--coral)",
              caution: "var(--amber)",
              neutral: "var(--text-muted)",
            };
            return `
            <div style="display:flex;align-items:flex-start;gap:16px;padding:10px 0;border-bottom:1px solid var(--border)">
              <span class="ingredient-pill ${type}" style="flex-shrink:0;animation-delay:${i * 0.03}s">${name}</span>
              <span style="font-size:13px;color:var(--text-secondary);line-height:1.5;padding-top:2px">${desc}</span>
            </div>`;
          })
          .join("")}
      </div>
    </div>

  `;
}

function renderScoreRing(id, score, color) {
  const el = document.getElementById(id);
  if (!el) return;
  const radius = 48;
  const circ = 2 * Math.PI * radius;
  const fraction = score / 10;
  const dashOffset = circ * (1 - fraction);
  el.innerHTML = `
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="var(--bg-elevated)" stroke-width="8"/>
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="${color}" stroke-width="8"
              stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}"
              stroke-linecap="round" style="transition:stroke-dashoffset 1s ease"/>
    </svg>
    <div class="score-ring-value" style="position:absolute">
      <div class="num" style="color:${color}">${score.toFixed(1)}</div>
      <div class="den">/10</div>
    </div>
  `;
}

function renderScoreBar(id, score, type = "", reverse = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const pct = reverse ? score * 10 : score * 10;
  const barType =
    type || (score >= 8 ? "good" : score >= 5 ? "warning" : "danger");
  el.innerHTML = `<div class="progress-fill ${reverse && score < 4 ? "good" : reverse && score > 6 ? "danger" : barType}" style="width:${pct}%"></div>`;
}

function renderIngredientList(id, ingredientNames, type) {
  const el = document.getElementById(id);
  if (!el) return;
  if (ingredientNames.length === 0) {
    el.innerHTML = `<div style="color:var(--text-muted);font-size:13px;padding:12px 0;">None detected.</div>`;
    return;
  }

  const sensitivityKeywords = getSensitivityKeywords(DD.profile);

  el.innerHTML = ingredientNames
    .map((name) => {
      const data = DD.ingredients[name] || {
        benefits: "Ingredient data unavailable.",
        concerns: [],
      };
      const sensitivity = sensitivityKeywords.some((s) =>
        name.toLowerCase().includes(s),
      );
      return `
      <div class="ingredient-item ${type}" onclick="toggleIngredientExpand(this)">
        <div class="flex items-center justify-between">
          <div class="ingredient-name">${name}</div>
          <div style="display:flex;gap:6px">
            ${sensitivity ? '<span class="badge badge-amber">Your Sensitivity</span>' : ""}
            <span style="color:var(--text-muted);font-size:12px">▼</span>
          </div>
        </div>
        <div class="ingredient-desc expand-content" style="display:none;margin-top:8px">
          <div style="margin-bottom:6px">${data.benefits}</div>
          ${data.concerns?.length ? `<div style="color:var(--amber);font-size:11px;margin-top:6px">${data.concerns.join(" · ")}</div>` : ""}
          ${data.research ? `<div class="ingredient-why">${data.research}</div>` : ""}
        </div>
      </div>
    `;
    })
    .join("");
}

function toggleIngredientExpand(el) {
  const content = el.querySelector(".expand-content");
  const arrow = el.querySelector("span:last-child");
  if (content.style.display === "none") {
    content.style.display = "block";
    if (arrow) arrow.textContent = "▲";
  } else {
    content.style.display = "none";
    if (arrow) arrow.textContent = "▼";
  }
}

function renderInteractions(interactions) {
  const el = document.getElementById("interactions-list");
  if (!el) return;
  if (!interactions || interactions.length === 0) {
    el.innerHTML = `<div style="color:var(--text-muted);font-size:13px">No notable interactions detected.</div>`;
    return;
  }
  el.innerHTML = interactions
    .map((ix) => {
      const isSynergy = ix.type === "synergy";
      return `
      <div class="interaction-card">
        <div class="interaction-pair">
          <span class="badge badge-${isSynergy ? "green" : "amber"} font-mono">${ix.a}</span>
          <span class="interaction-plus">${isSynergy ? "+" : "⚡"}</span>
          <span class="badge badge-${isSynergy ? "green" : "amber"} font-mono">${ix.b}</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:8px">
          <span style="font-size:16px">${isSynergy ? "OK" : "!"}</span>
          <div class="interaction-result">${ix.desc}</div>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderFullIngredientList(full, good, bad, warn) {
  const el = document.getElementById("full-ingredient-list");
  if (!el) return;
  el.innerHTML = full
    .map((name, i) => {
      const type = bad.includes(name)
        ? "harmful"
        : warn.includes(name)
          ? "caution"
          : good.includes(name)
            ? "beneficial"
            : "neutral";
      return `<span class="ingredient-pill ${type}" style="animation-delay:${i * 0.05}s">${name}</span>`;
    })
    .join(" ");
}

function renderAlternatives(product) {
  const el = document.getElementById("alternatives-list");
  if (!el) return;
  const alts = DD.products.filter((p) => p.id !== product.id).slice(0, 2);
  el.innerHTML = alts
    .map(
      (p) => `
    <div class="history-card" onclick="viewProduct(${p.id})">
      <div class="history-thumb">${p.emoji || "•"}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700">${p.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">${p.brand}</div>
        <div style="margin-top:6px;display:flex;gap:6px">
          ${renderScoreTag(p.scores.overall)}
          <span class="badge badge-${p.scores.risk < 3 ? "green" : "amber"}">Risk ${p.scores.risk}</span>
        </div>
      </div>
      <span style="color:var(--jade)">View ›</span>
    </div>
  `,
    )
    .join("");
}

function viewProduct(id) {
  const product =
    DD.state.scanHistory.find((p) => p.id === id) ||
    DD.state.savedProducts.find((p) => p.id === id);
  if (!product) return;
  DD.state.currentProduct = product;
  showPage("analysis");
  renderAnalysis(product);
}

// ── Comparison ────────────────────────────────────────────
function renderComparison() {
  const container = document.getElementById("compare-table");
  if (!container) return;

  const history = DD.state.scanHistory;

  if (history.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:64px 32px;color:var(--text-muted)">
        <div style="font-size:48px;margin-bottom:16px">📊</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:8px">No products to compare yet</div>
        <div style="font-size:13px">Scan some products first, then come back to compare them.</div>
        <button class="btn btn-primary" style="margin-top:20px" onclick="showPage('scan')">Scan a Product</button>
      </div>`;
    return;
  }

  // Get selected products (up to 5)
  const selected =
    DD.state.compareList.length > 0
      ? DD.state.compareList
      : history.slice(0, Math.min(3, history.length));

  const scoreKeys = [
    { key: "overall", label: "Overall Score" },
    { key: "ingredientQuality", label: "Ingredient Quality" },
    { key: "scientificBacking", label: "Scientific Backing" },
    { key: "skinCompatibility", label: "Skin Compatibility" },
    { key: "risk", label: "Risk Score" },
  ];

  // Product selector chips
  const selectorHtml = history
    .map((p) => {
      const isSelected = selected.find((s) => s.id === p.id);
      return `<button
      class="btn btn-sm ${isSelected ? "btn-primary" : "btn-ghost"}"
      style="font-size:12px"
      onclick="toggleCompareProduct(${p.id})"
    >${p.emoji || "🧪"} ${p.name}</button>`;
    })
    .join("");

  // Table header
  const headerCols = selected
    .map(
      (p) => `
    <th style="text-align:center;padding:16px 12px;min-width:160px">
      <div style="font-size:24px;margin-bottom:6px">${p.emoji || "🧪"}</div>
      <div style="font-size:13px;font-weight:700;line-height:1.3">${p.name}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${p.brand}</div>
    </th>`,
    )
    .join("");

  // Score rows
  const scoreRows = scoreKeys
    .map(({ key, label }) => {
      const isRisk = key === "risk";
      const vals = selected.map((p) => p.scores?.[key] ?? 0);
      const best = isRisk ? Math.min(...vals) : Math.max(...vals);

      const cols = selected
        .map((p) => {
          const val = p.scores?.[key] ?? 0;
          const isBest = val === best;
          const color = isRisk
            ? val <= 2
              ? "var(--jade)"
              : val <= 5
                ? "var(--amber)"
                : "var(--coral)"
            : val >= 8
              ? "var(--jade)"
              : val >= 5
                ? "var(--amber)"
                : "var(--coral)";
          return `<td style="text-align:center;padding:14px 12px;border-bottom:1px solid var(--border)">
        <div style="font-size:20px;font-weight:800;color:${color}">${val.toFixed(1)}</div>
        ${isBest ? `<div style="font-size:10px;color:${color};margin-top:2px">${isRisk ? "✓ Lowest" : "✓ Best"}</div>` : ""}
      </td>`;
        })
        .join("");

      return `<tr>
      <td style="padding:14px 16px;font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--border);white-space:nowrap">${label}</td>
      ${cols}
    </tr>`;
    })
    .join("");

  // Good/bad ingredient rows
  const ingredientRow = (label, getter, badgeClass) => {
    const cols = selected
      .map((p) => {
        const items = getter(p);
        return `<td style="padding:12px;border-bottom:1px solid var(--border);vertical-align:top">
        ${
          items.length
            ? items
                .map(
                  (i) =>
                    `<span class="badge ${badgeClass}" style="margin:2px;font-size:11px">${i}</span>`,
                )
                .join("")
            : `<span style="font-size:12px;color:var(--text-muted)">None</span>`
        }
      </td>`;
      })
      .join("");
    return `<tr>
      <td style="padding:12px 16px;font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--border);vertical-align:top">${label}</td>
      ${cols}
    </tr>`;
  };

  container.innerHTML = `
    <div style="margin-bottom:20px">
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Select up to 5 products to compare</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${selectorHtml}</div>
    </div>

    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:500px">
        <thead>
          <tr style="border-bottom:2px solid var(--border)">
            <th style="text-align:left;padding:16px;font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;min-width:160px">Category</th>
            ${headerCols}
          </tr>
        </thead>
        <tbody>
          ${scoreRows}
          ${ingredientRow("✅ Good", (p) => p.goodIngredients || [], "badge-green")}
          ${ingredientRow("🚫 Flagged", (p) => p.badIngredients || [], "badge-red")}
          ${ingredientRow("⚠️ Caution", (p) => p.warnIngredients || [], "badge-amber")}
        </tbody>
      </table>
    </div>
  `;
}

function toggleCompareProduct(id) {
  const product = DD.state.scanHistory.find((p) => p.id === id);
  if (!product) return;
  const idx = DD.state.compareList.findIndex((p) => p.id === id);
  if (idx >= 0) {
    DD.state.compareList.splice(idx, 1);
  } else {
    if (DD.state.compareList.length >= 5) {
      alert("You can compare up to 5 products at a time.");
      return;
    }
    DD.state.compareList.push(product);
  }
  renderComparison();
}

// ── History Page ──────────────────────────────────────────
function renderHistory() {
  const grid = document.getElementById("history-grid");
  const savedGrid = document.getElementById("saved-grid");

  const history = DD.state.scanHistory;
  const saved = DD.state.savedProducts;

  if (!grid) return;

  if (history.length === 0) {
    grid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:13px">
      No scans yet. <button class="btn btn-ghost btn-sm" onclick="showPage('scan')">Scan your first product →</button>
    </div>`;
  } else {
    grid.innerHTML = history
      .map((p) => {
        const scoreColor =
          p.scores.overall >= 8
            ? "var(--jade)"
            : p.scores.overall >= 5
              ? "var(--amber)"
              : "var(--coral)";
        return `
        <div class="card p-16" style="display:flex;align-items:center;gap:16px;margin-bottom:10px;cursor:pointer" onclick="viewProduct(${p.id})">
          <div style="font-size:32px;flex-shrink:0">${p.emoji || "🧪"}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:700;margin-bottom:2px">${p.name}</div>
            <div style="font-size:12px;color:var(--text-muted)">${p.brand}</div>
            <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
              ${(p.badIngredients || []).length > 0 ? `<span class="badge badge-red">⚠ ${p.badIngredients.length} flagged</span>` : ""}
              ${(p.goodIngredients || []).length > 0 ? `<span class="badge badge-green">✓ ${p.goodIngredients.length} good</span>` : ""}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:22px;font-weight:900;color:${scoreColor}">${p.scores.overall.toFixed(1)}</div>
            <div style="font-size:10px;color:var(--text-muted)">/10</div>
          </div>
        </div>`;
      })
      .join("");
  }

  if (savedGrid) {
    if (saved.length === 0) {
      savedGrid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:13px">No saved products yet. Hit Save on any analysis page.</div>`;
    } else {
      savedGrid.innerHTML = saved
        .map(
          (p) => `
        <div class="card p-16" style="cursor:pointer" onclick="viewProduct(${p.id})">
          <div style="font-size:28px;margin-bottom:8px">${p.emoji || "🧪"}</div>
          <div style="font-size:13px;font-weight:700">${p.name}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${p.brand}</div>
          <div style="font-size:18px;font-weight:800;color:var(--jade);margin-top:8px">${p.scores.overall.toFixed(1)}<span style="font-size:11px;color:var(--text-muted)">/10</span></div>
        </div>`,
        )
        .join("");
    }
  }
}

function toggleFav(id, btn) {
  const idx = DD.state.favorites.indexOf(id);
  if (idx >= 0) {
    DD.state.favorites.splice(idx, 1);
    btn.innerHTML = "Save";
  } else {
    DD.state.favorites.push(id);
    btn.innerHTML = "Saved";
  }
  saveState();
}

function saveCurrentProduct(productId, btn) {
  // Find product from scan history by ID
  const p =
    DD.state.scanHistory.find((s) => String(s.id) === String(productId)) ||
    DD.state.currentProduct;

  if (!p) {
    console.error("Product not found:", productId);
    return;
  }

  const alreadySaved = DD.state.savedProducts.some(
    (s) => String(s.id) === String(p.id),
  );

  if (alreadySaved) {
    DD.state.savedProducts = DD.state.savedProducts.filter(
      (s) => String(s.id) !== String(p.id),
    );
    if (btn) {
      btn.textContent = "🤍 Save";
      btn.style.background = "";
    }
  } else {
    DD.state.savedProducts.push(p);
    if (btn) {
      btn.textContent = "❤️ Saved!";
      btn.style.background = "var(--jade)";
    }
  }

  saveState();
  console.log("Saved:", DD.state.savedProducts.length, "products");
}

// Keep old name as alias so nothing else breaks
function toggleFavCurrent(btn) {
  const p = DD.state.currentProduct;
  if (p) saveCurrentProduct(p.id, btn);
}

function filterHistory(query) {
  const cards = document.querySelectorAll("#history-grid .history-card");
  cards.forEach((card) => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query.toLowerCase()) ? "" : "none";
  });
}

// ── Chat ──────────────────────────────────────────────────
function openChatModal() {
  document.getElementById("chat-modal").classList.add("open");
  document.getElementById("chat-fab").classList.add("hidden");
  DD.state.chatOpen = true;
  if (DD.state.chatMessages.length === 0) {
    addAIMessage(
      "Hi! I'm your FormulaDecode AI assistant. Ask me anything about the ingredients in your current product, your skin profile, or skincare in general!",
    );
  }
}

function closeChatModal() {
  document.getElementById("chat-modal")?.classList.remove("open");
  document.getElementById("chat-fab")?.classList.remove("hidden");
  DD.state.chatOpen = false;
}

function addAIMessage(text) {
  const msgs = document.getElementById("chat-messages");
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble ai";
  bubble.textContent = text;
  msgs.appendChild(bubble);
  msgs.scrollTop = msgs.scrollHeight;
  DD.state.chatMessages.push({ role: "ai", text });
}

function addUserMessage(text) {
  const msgs = document.getElementById("chat-messages");
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble user";
  bubble.textContent = text;
  msgs.appendChild(bubble);
  msgs.scrollTop = msgs.scrollHeight;
  DD.state.chatMessages.push({ role: "user", text });
}

function showTyping() {
  const msgs = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.id = "typing-indicator";
  div.className = "chat-bubble ai";
  div.innerHTML = `<div class="typing-dots">
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideTyping() {
  document.getElementById("typing-indicator")?.remove();
}

function handleChatKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendChat();
  }
}

// ── Loading ───────────────────────────────────────────────
function showLoading(steps) {
  const overlay = document.getElementById("loading-overlay");
  const stepsEl = document.getElementById("loading-steps");
  overlay.classList.remove("hidden");
  stepsEl.innerHTML = "";

  let currentIndex = 0;
  let loopInterval = null;

  function showStep(i) {
    // Fade out existing
    const existing = stepsEl.querySelector(".loading-step");
    if (existing) {
      existing.style.opacity = "0";
      existing.style.transform = "translateY(-10px)";
      setTimeout(() => {
        if (existing.parentNode) existing.remove();
      }, 300);
    }

    // Create new step after fade-out completes
    setTimeout(() => {
      const div = document.createElement("div");
      div.className = "loading-step active";
      div.textContent = steps[i % steps.length];
      div.style.cssText =
        "opacity:0;transform:translateY(12px);transition:opacity 0.35s ease,transform 0.35s ease;font-size:14px;";
      stepsEl.appendChild(div);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          div.style.opacity = "1";
          div.style.transform = "translateY(0)";
        });
      });
    }, 320);
  }

  // Show first step immediately
  showStep(0);
  currentIndex = 1;

  // Loop through steps
  loopInterval = setInterval(() => {
    showStep(currentIndex);
    currentIndex = (currentIndex + 1) % steps.length;
  }, 950);

  // Store interval so hideLoading can clear it
  overlay._loopInterval = loopInterval;
}

function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay._loopInterval) {
    clearInterval(overlay._loopInterval);
    overlay._loopInterval = null;
  }
  overlay.classList.add("hidden");
  const stepsEl = document.getElementById("loading-steps");
  if (stepsEl) stepsEl.innerHTML = "";
}

// ── Profile Page ──────────────────────────────────────────
function renderProfile() {
  const profile = FD_Auth?.isLoggedIn() && DD.profile ? DD.profile : {};
  const state = DD.state || {};
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  const fragToggle = document.getElementById("pref-fragrance-toggle");
  if (fragToggle) {
    fragToggle.checked =
      localStorage.getItem("pref-fragrance-alert") !== "false";
  }

  // Use auth data for name/email — not DD.profile
  const isLoggedIn = FD_Auth?.isLoggedIn();
  const fullName = isLoggedIn
    ? FD_Auth.userProfile?.full_name || profile.name || "User"
    : "Guest";
  const email = isLoggedIn
    ? FD_Auth.currentUser?.email || "—"
    : "Sign in to save your profile";
  const avatar = fullName.charAt(0).toUpperCase();

  // Skin data from onboarding
  const skinType = getDisplaySkinType(profile) || "Not set";
  const concerns = getDisplayConcerns(profile) || [];
  const sensitivities = getDisplaySensitivities(profile) || [];
  const goals = profile.productCompatibility?.skincareGoal || [
    "General Skin Health",
  ];

  setText("profile-name", fullName);
  setText("profile-email", email);
  setText("profile-avatar", avatar);
  setText("profile-skin-type", skinType);
  setText("profile-skin-type-badge", `${skinType} Skin`);
  setText("profile-goal-badge", Array.isArray(goals) ? goals[0] : goals);
  setText(
    "profile-sensitivity-level",
    sensitivities.length ? "Moderate" : "Low",
  );

  setText("profile-stat-scans", state.scanHistory?.length || 0);
  setText("profile-stat-saved", state.savedProducts?.length || 0);
  setText(
    "profile-stat-avoided",
    state.scanHistory?.reduce(
      (acc, p) => acc + (p.badIngredients?.length || 0),
      0,
    ) || 0,
  );
  setText("profile-stat-favorites", state.favorites?.length || 0);

  const concernsWrap = document.getElementById("profile-concerns");
  if (concernsWrap) {
    concernsWrap.innerHTML = concerns.length
      ? concerns
          .map((c) => `<span class="badge badge-blue">${c}</span>`)
          .join("")
      : `<span class="badge">Complete your skin profile to see concerns</span>`;
  }

  const sensWrap = document.getElementById("profile-sensitivities");
  if (sensWrap) {
    sensWrap.innerHTML = sensitivities.length
      ? sensitivities
          .map((s) => `<span class="badge badge-red">${s}</span>`)
          .join("")
      : `<span class="badge badge-green">No sensitivities detected</span>`;
  }
}

function exportProfile() {
  const profileData = {
    profile: DD.profile,
    stats: {
      scans: DD.state.scanHistory?.length || 0,
      saved: DD.state.savedProducts?.length || 0,
      favorites: DD.state.favorites?.length || 0,
    },
  };

  const blob = new Blob([JSON.stringify(profileData, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "formuladecode-profile.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Auth handles routing — initAuth() called from index.html
  DD.profile = DD.profile || getDefaultProfile();
});

function renderSensitivityAlert() {
  const container = document.getElementById("sensitivity-alert-section");
  if (!container) return;

  // Only show if logged in
  if (!FD_Auth?.isLoggedIn()) {
    container.innerHTML = "";
    return;
  }

  const profile = DD.profile || {};
  const fragranceSensitive = profile.sensitivity?.fragranceSensitive === "Yes";
  const sensitivityLevel = profile.sensitivity?.sensitivityLevel || "";
  const isHighSensitivity =
    sensitivityLevel.toLowerCase().includes("high") ||
    sensitivityLevel.toLowerCase().includes("very");

  // Check preferences toggle — default to only showing if user set fragrance sensitive
  const fragranceAlertPref =
    localStorage.getItem("pref-fragrance-alert") !== "false";

  if (!fragranceSensitive && !isHighSensitivity) {
    container.innerHTML = "";
    return;
  }

  if (!fragranceAlertPref) {
    container.innerHTML = "";
    return;
  }

  // Find flagged products from scan history
  const flaggedProducts = DD.state.scanHistory.filter((p) =>
    (p.badIngredients || []).some(
      (i) =>
        i.toLowerCase().includes("fragrance") ||
        i.toLowerCase().includes("parfum"),
    ),
  );

  // Find other sensitivities from profile
  const otherSensitivities = (
    profile.sensitivity?.commonReactions || []
  ).filter((s) => s && s !== "None" && s !== "Not Sure");

  const alerts = [];

  if (fragranceSensitive && flaggedProducts.length > 0) {
    alerts.push(
      `${flaggedProducts.length} recently scanned product${flaggedProducts.length > 1 ? "s contain" : " contains"} <strong style="color:var(--coral)">Fragrance</strong> — a known irritant for your skin.`,
    );
  }

  if (otherSensitivities.length > 0) {
    alerts.push(
      `You have noted sensitivities to: <strong style="color:var(--amber)">${otherSensitivities.join(", ")}</strong>. Watch out for these in your scans.`,
    );
  }

  if (alerts.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="card p-24" style="background:linear-gradient(135deg,rgba(255,107,107,0.08),rgba(245,166,35,0.08));border-color:rgba(255,107,107,0.2)">
      <div style="display:flex;align-items:flex-start;gap:16px">
        <div style="font-size:28px">⚠️</div>
        <div style="flex:1">
          <div style="font-weight:700;margin-bottom:8px">Sensitivity Alert</div>
          ${alerts
            .map(
              (a) => `
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:6px">${a}</div>
          `,
            )
            .join("")}
          <button class="btn btn-secondary btn-sm" style="margin-top:10px" onclick="showPage('history');renderHistory();">View Flagged Products →</button>
        </div>
      </div>
    </div>
  `;
}
