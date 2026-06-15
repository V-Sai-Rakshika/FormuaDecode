// ── FormulaDecode Data & State ─────────────────────────────

const DD = {
  // App state
  state: {
    currentPage: "onboarding",
    profile: null,
    scanHistory: [],
    savedProducts: [],
    favorites: [],
    currentProduct: null,
    compareList: [],
    chatOpen: false,
    chatMessages: [],
  },

  // Ingredient database (curated)
  ingredients: {
    Niacinamide: {
      type: "beneficial",
      benefits:
        "Controls oil production, minimizes pores, evens skin tone, reduces inflammation.",
      rating: 9.2,
      concerns: [],
      research:
        "Highly clinically proven. 4-10% shown effective for acne & pigmentation.",
    },
    "Hyaluronic Acid": {
      type: "beneficial",
      benefits: "Deep hydration, plumping effect, suitable for all skin types.",
      rating: 9.5,
      concerns: [],
      research: "Holds up to 1000x its weight in water. Widely studied.",
    },
    Retinol: {
      type: "beneficial",
      benefits: "Anti-aging, collagen stimulation, cell turnover acceleration.",
      rating: 8.8,
      concerns: ["Can cause initial purging", "Sun sensitivity"],
      research:
        "Gold standard anti-aging ingredient. Start low (0.025%), build up slowly.",
    },
    "Salicylic Acid": {
      type: "beneficial",
      benefits: "Exfoliates inside pores, fights acne, unclogs blackheads.",
      rating: 8.7,
      concerns: ["Can be drying at high %"],
      research: "BHA, lipid-soluble. Effective in 0.5–2% range for acne.",
    },
    "Vitamin C (Ascorbic Acid)": {
      type: "beneficial",
      benefits:
        "Brightening, antioxidant protection, hyperpigmentation reduction.",
      rating: 9.0,
      concerns: [
        "Unstable, can oxidize",
        "Can irritate sensitive skin at high %",
      ],
      research: "L-Ascorbic acid most potent form. 10-20% most studied.",
    },
    Ceramides: {
      type: "beneficial",
      benefits:
        "Restores skin barrier, prevents moisture loss, soothes irritation.",
      rating: 9.3,
      concerns: [],
      research:
        "Essential lipids naturally found in skin. Replaces depleted barrier lipids.",
    },
    Glycerin: {
      type: "beneficial",
      benefits: "Humectant that draws moisture, non-comedogenic, very gentle.",
      rating: 8.9,
      concerns: [],
      research:
        "One of the most researched humectants. Safe for all skin types.",
    },
    Fragrance: {
      type: "harmful",
      benefits: "Scent only — no skin benefit.",
      rating: 2.1,
      concerns: [
        "Top allergen",
        "Skin sensitizer",
        "May worsen sensitive skin",
        "Can cause dermatitis",
      ],
      research:
        "No therapeutic value. Causes contact dermatitis in up to 10% of adults.",
    },
    "Alcohol Denat.": {
      type: "caution",
      benefits: "Helps product spread, fast-drying texture.",
      rating: 4.2,
      concerns: [
        "Disrupts skin barrier",
        "Drying at high concentrations",
        "Sensitizing over time",
      ],
      research:
        "Short-term use OK. High concentration / frequent use damages barrier function.",
    },
    "Sodium Lauryl Sulfate": {
      type: "harmful",
      benefits: "Foaming / cleansing action.",
      rating: 3.1,
      concerns: [
        "Strong irritant",
        "Disrupts barrier",
        "Can trigger acne",
        "Strips natural oils",
      ],
      research:
        "SLS used as a skin irritant in clinical trials to test other ingredients. Avoid if sensitive.",
    },
    "Zinc PCA": {
      type: "beneficial",
      benefits: "Oil control, antibacterial, anti-inflammatory.",
      rating: 8.4,
      concerns: [],
      research:
        "Effective sebum regulator. Good for acne-prone and combination skin.",
    },
    Panthenol: {
      type: "beneficial",
      benefits: "Healing, soothing, moisture-retaining. Pro-vitamin B5.",
      rating: 8.6,
      concerns: [],
      research:
        "Penetrates well. Clinical evidence for wound healing and hydration.",
    },
    Parabens: {
      type: "caution",
      benefits: "Preservative — prevents microbial growth.",
      rating: 5.5,
      concerns: [
        "Endocrine disruption concerns (ongoing research)",
        "Some sensitization reports",
      ],
      research:
        "Currently considered safe at regulated levels. Ongoing research into bioaccumulation.",
    },
    "Lactic Acid": {
      type: "beneficial",
      benefits: "Gentle AHA exfoliant, hydrating, brightening.",
      rating: 8.5,
      concerns: ["Photosensitizing — use SPF"],
      research:
        "Larger molecule than glycolic, gentler. 5-10% effective for mild exfoliation.",
    },
    "Azelaic Acid": {
      type: "beneficial",
      benefits: "Anti-acne, hyperpigmentation reduction, rosacea-calming.",
      rating: 9.1,
      concerns: [],
      research:
        "FDA-approved for rosacea (15%). Excellent for combination skin with pigmentation.",
    },
    "Ferulic Acid": {
      type: "beneficial",
      benefits: "Antioxidant that stabilizes and boosts Vitamin C efficacy.",
      rating: 8.7,
      concerns: [],
      research:
        "Synergistic with Vitamin C and E. Significantly increases photoprotection.",
    },
    "Tocopherol (Vitamin E)": {
      type: "beneficial",
      benefits: "Antioxidant, moisturizing, skin healing.",
      rating: 8.3,
      concerns: ["Can be comedogenic in high amounts for some"],
      research:
        "Works synergistically with Vitamin C. Well-studied antioxidant.",
    },
    Dimethicone: {
      type: "neutral",
      benefits:
        "Creates smooth skin feel, forms protective barrier, occlusive.",
      rating: 6.5,
      concerns: ["Occlusive — may trap debris", "Not absorbed by skin"],
      research:
        "Generally considered safe. Debate around pore-clogging for acne-prone skin.",
    },
  },

  // Products — populated by user scans only
  products: [],

  // Interactions knowledge
  interactionRules: [
    {
      a: "Retinol",
      b: "Salicylic Acid",
      type: "warning",
      desc: "Both are exfoliants. Combining can cause over-exfoliation and barrier damage.",
    },
    {
      a: "Vitamin C (Ascorbic Acid)",
      b: "Retinol",
      type: "caution",
      desc: "Different pH needs. Use Vitamin C in AM, Retinol in PM.",
    },
    {
      a: "Niacinamide",
      b: "Vitamin C (Ascorbic Acid)",
      type: "caution",
      desc: "May reduce efficacy of each other at high concentrations. Use separately or ensure lower %.",
    },
    {
      a: "Niacinamide",
      b: "Zinc PCA",
      type: "synergy",
      desc: "Excellent duo for acne and oiliness control.",
    },
    {
      a: "Ferulic Acid",
      b: "Vitamin C (Ascorbic Acid)",
      type: "synergy",
      desc: "Ferulic acid dramatically stabilizes and boosts Vitamin C.",
    },
    {
      a: "Ceramides",
      b: "Hyaluronic Acid",
      type: "synergy",
      desc: "Ceramides seal in the hydration provided by Hyaluronic Acid.",
    },
  ],

  // Onboarding questions
  onboardingQuestions: {
    basicProfile: [
      {
        id: "name",
        category: "Basic Profile",
        question: "What should we call you?",
        sub: "We'll personalize your skincare experience.",
        type: "text",
        placeholder: "Your name...",
      },
      {
        id: "age",
        category: "Basic Profile",
        question: "What's your age?",
        sub: "Your age helps us tailor skin analysis and recommendations.",
        type: "text",
        placeholder: "Enter your age...",
      },
      {
        id: "gender",
        category: "Basic Profile",
        question: "What is your gender?",
        sub: "Optional — helps improve personalization.",
        type: "single",
        optional: true,
        options: [
          { value: "Female", label: "Female" },
          { value: "Male", label: "Male" },
          { value: "Non-binary", label: "Non-binary" },
          { value: "Prefer not to say", label: "Prefer not to say" },
        ],
      },
    ],

    skinType: [
      {
        id: "postWashFeel",
        category: "Skin Type",
        question: "How does your skin feel 2–3 hours after washing?",
        sub: "This helps identify oil production and moisture balance.",
        type: "single",
        options: [
          { value: "Very oily", label: "Very oily" },
          { value: "Slightly oily", label: "Slightly oily" },
          { value: "Balanced", label: "Balanced" },
          { value: "Slightly dry", label: "Slightly dry" },
          { value: "Very dry", label: "Very dry" },
        ],
      },
      {
        id: "daytimeShine",
        category: "Skin Type",
        question: "How often does your face become shiny during the day?",
        sub: "Shine levels help determine whether your skin leans oily.",
        type: "single",
        options: [
          { value: "Never", label: "Never" },
          { value: "Rarely", label: "Rarely" },
          { value: "Sometimes", label: "Sometimes" },
          { value: "Often", label: "Often" },
          { value: "Always", label: "Always" },
        ],
      },
      {
        id: "poreSize",
        category: "Skin Type",
        question: "How large do your pores appear?",
        sub: "Visible pore size can indicate skin type and congestion risk.",
        type: "single",
        options: [
          { value: "Very small", label: "Very small" },
          { value: "Small", label: "Small" },
          { value: "Medium", label: "Medium" },
          { value: "Large", label: "Large" },
          { value: "Very large", label: "Very large" },
        ],
      },
      {
        id: "skinTypeSelf",
        category: "Skin Type",
        question: "Which best describes your skin type?",
        sub: "Choose the option that feels most accurate overall.",
        type: "single",
        options: [
          { value: "Oily", label: "Oily" },
          { value: "Dry", label: "Dry" },
          { value: "Combination", label: "Combination" },
          { value: "Normal", label: "Normal" },
          { value: "Not sure", label: "Not sure" },
        ],
      },
      {
        id: "tightAfterCleansing",
        category: "Skin Type",
        question: "Does your skin feel tight after cleansing?",
        sub: "Tightness can suggest dryness or a weakened barrier.",
        type: "single",
        options: [
          { value: "Never", label: "Never" },
          { value: "Rarely", label: "Rarely" },
          { value: "Sometimes", label: "Sometimes" },
          { value: "Often", label: "Often" },
          { value: "Always", label: "Always" },
        ],
      },
    ],

    sensitivity: [
      {
        id: "productsIrritate",
        category: "Sensitivity",
        question: "Do skincare products easily irritate your skin?",
        sub: "This helps identify reactive or sensitive skin.",
        type: "single",
        options: [
          { value: "Never", label: "Never" },
          { value: "Rarely", label: "Rarely" },
          { value: "Sometimes", label: "Sometimes" },
          { value: "Often", label: "Often" },
          { value: "Almost always", label: "Almost always" },
        ],
      },
      {
        id: "sensitivityLevel",
        category: "Sensitivity",
        question: "How sensitive is your skin?",
        sub: "Rate your overall skin sensitivity.",
        type: "single",
        options: [
          { value: "Not sensitive", label: "Not sensitive" },
          { value: "Slightly sensitive", label: "Slightly sensitive" },
          { value: "Moderately sensitive", label: "Moderately sensitive" },
          { value: "Very sensitive", label: "Very sensitive" },
        ],
      },
      {
        id: "fragranceSensitive",
        category: "Sensitivity",
        question: "Are you sensitive to fragrance?",
        sub: "Fragrance is a common skin irritant.",
        type: "single",
        options: [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
          { value: "Not sure", label: "Not sure" },
        ],
      },
      {
        id: "allergicReactions",
        category: "Sensitivity",
        question: "Have you ever experienced allergic reactions from skincare?",
        sub: "This helps identify potential allergens for you.",
        type: "single",
        options: [
          { value: "Never", label: "Never" },
          { value: "Once or twice", label: "Once or twice" },
          { value: "Occasionally", label: "Occasionally" },
          { value: "Frequently", label: "Frequently" },
        ],
      },
      {
        id: "commonReactions",
        category: "Sensitivity",
        question: "What reactions do you commonly experience?",
        sub: "Select all that apply.",
        type: "multi",
        options: [
          { value: "Redness", label: "Redness" },
          { value: "Itching", label: "Itching" },
          { value: "Burning", label: "Burning" },
          { value: "Stinging", label: "Stinging" },
          { value: "Swelling", label: "Swelling" },
          { value: "Breakouts", label: "Breakouts" },
          { value: "None", label: "None" },
        ],
      },
    ],

    acneBreakouts: [
      {
        id: "acneFrequency",
        category: "Acne & Breakouts",
        question: "How often do you get acne?",
        sub: "This helps determine acne severity.",
        type: "single",
        options: [
          { value: "Never", label: "Never" },
          { value: "Rarely", label: "Rarely" },
          { value: "Occasionally", label: "Occasionally" },
          { value: "Frequently", label: "Frequently" },
          { value: "Severe/Persistent", label: "Severe/Persistent" },
        ],
      },
      {
        id: "acneType",
        category: "Acne & Breakouts",
        question: "What type of acne do you experience?",
        sub: "Select all that apply.",
        type: "multi",
        options: [
          { value: "Whiteheads", label: "Whiteheads" },
          { value: "Blackheads", label: "Blackheads" },
          { value: "Papules", label: "Papules" },
          { value: "Pustules", label: "Pustules" },
          { value: "Cystic Acne", label: "Cystic Acne" },
          { value: "Hormonal Acne", label: "Hormonal Acne" },
          { value: "None", label: "None" },
        ],
      },
      {
        id: "breakoutLocation",
        category: "Acne & Breakouts",
        question: "Where do breakouts mostly occur?",
        sub: "Select all that apply.",
        type: "multi",
        options: [
          { value: "Forehead", label: "Forehead" },
          { value: "Nose", label: "Nose" },
          { value: "Chin", label: "Chin" },
          { value: "Cheeks", label: "Cheeks" },
          { value: "Jawline", label: "Jawline" },
          { value: "Neck", label: "Neck" },
          { value: "None", label: "None" },
        ],
      },
    ],

    skinConcerns: [
      {
        id: "biggestConcerns",
        category: "Skin Concerns",
        question: "What are your biggest skin concerns?",
        sub: "Select all that apply.",
        type: "multi",
        options: [
          { value: "Acne", label: "Acne" },
          { value: "Dark Spots", label: "Dark Spots" },
          { value: "Hyperpigmentation", label: "Hyperpigmentation" },
          { value: "Uneven Skin Tone", label: "Uneven Skin Tone" },
          { value: "Fine Lines", label: "Fine Lines" },
          { value: "Wrinkles", label: "Wrinkles" },
          { value: "Dryness", label: "Dryness" },
          { value: "Excess Oil", label: "Excess Oil" },
          { value: "Enlarged Pores", label: "Enlarged Pores" },
          { value: "Redness", label: "Redness" },
          { value: "Dullness", label: "Dullness" },
        ],
      },
      {
        id: "hyperpigmentationLevel",
        category: "Skin Concerns",
        question: "How would you rate your hyperpigmentation?",
        sub: "Rate the severity of dark spots or discoloration.",
        type: "single",
        options: [
          { value: "None", label: "None" },
          { value: "Mild", label: "Mild" },
          { value: "Moderate", label: "Moderate" },
          { value: "Severe", label: "Severe" },
        ],
      },
      {
        id: "darkCircles",
        category: "Skin Concerns",
        question: "Do you have dark circles?",
        sub: "Rate the severity of dark circles under your eyes.",
        type: "single",
        options: [
          { value: "No", label: "No" },
          { value: "Mild", label: "Mild" },
          { value: "Moderate", label: "Moderate" },
          { value: "Severe", label: "Severe" },
        ],
      },
      {
        id: "dullnessFrequency",
        category: "Skin Concerns",
        question: "How often does your skin appear dull or tired?",
        sub: "This helps assess skin brightness and vitality.",
        type: "single",
        options: [
          { value: "Never", label: "Never" },
          { value: "Rarely", label: "Rarely" },
          { value: "Sometimes", label: "Sometimes" },
          { value: "Often", label: "Often" },
          { value: "Always", label: "Always" },
        ],
      },
    ],

    barrierHealth: [
      {
        id: "peelingFlaking",
        category: "Barrier Health",
        question: "Does your skin frequently peel or flake?",
        sub: "Peeling can indicate dehydration or barrier damage.",
        type: "single",
        options: [
          { value: "Never", label: "Never" },
          { value: "Rarely", label: "Rarely" },
          { value: "Sometimes", label: "Sometimes" },
          { value: "Often", label: "Often" },
        ],
      },
      {
        id: "dehydratedFrequency",
        category: "Barrier Health",
        question: "How often does your skin feel dehydrated?",
        sub: "Dehydration indicates moisture balance issues.",
        type: "single",
        options: [
          { value: "Never", label: "Never" },
          { value: "Rarely", label: "Rarely" },
          { value: "Sometimes", label: "Sometimes" },
          { value: "Often", label: "Often" },
          { value: "Always", label: "Always" },
        ],
      },
      {
        id: "redEasily",
        category: "Barrier Health",
        question: "Does your skin become red easily?",
        sub: "Easy redness suggests sensitivity or barrier weakness.",
        type: "single",
        options: [
          { value: "Never", label: "Never" },
          { value: "Rarely", label: "Rarely" },
          { value: "Sometimes", label: "Sometimes" },
          { value: "Often", label: "Often" },
          { value: "Always", label: "Always" },
        ],
      },
    ],

    sunEnvironment: [
      {
        id: "sunExposure",
        category: "Sun & Environment",
        question: "How much sun exposure do you get daily?",
        sub: "Sun exposure affects skin health and pigmentation.",
        type: "single",
        options: [
          { value: "Less than 30 mins", label: "Less than 30 mins" },
          { value: "30 mins–1 hour", label: "30 mins–1 hour" },
          { value: "1–3 hours", label: "1–3 hours" },
          { value: "More than 3 hours", label: "More than 3 hours" },
        ],
      },
      {
        id: "sunscreenUse",
        category: "Sun & Environment",
        question: "Do you use sunscreen regularly?",
        sub: "Regular sunscreen use protects against UV damage.",
        type: "single",
        options: [
          { value: "Every day", label: "Every day" },
          { value: "Most days", label: "Most days" },
          { value: "Sometimes", label: "Sometimes" },
          { value: "Rarely", label: "Rarely" },
          { value: "Never", label: "Never" },
        ],
      },
    ],

    lifestyle: [
      {
        id: "waterIntake",
        category: "Lifestyle",
        question: "How much water do you drink daily?",
        sub: "Hydration supports skin health.",
        type: "single",
        options: [
          { value: "Less than 1L", label: "Less than 1L" },
          { value: "1–2L", label: "1–2L" },
          { value: "2–3L", label: "2–3L" },
          { value: "More than 3L", label: "More than 3L" },
        ],
      },
      {
        id: "sleepQuality",
        category: "Lifestyle",
        question: "How would you rate your sleep quality?",
        sub: "Sleep affects skin repair and clarity.",
        type: "single",
        options: [
          { value: "Poor", label: "Poor" },
          { value: "Fair", label: "Fair" },
          { value: "Good", label: "Good" },
          { value: "Excellent", label: "Excellent" },
        ],
      },
      {
        id: "stressLevel",
        category: "Lifestyle",
        question: "How stressed are you on average?",
        sub: "Stress can impact skin condition.",
        type: "single",
        options: [
          { value: "Very low", label: "Very low" },
          { value: "Low", label: "Low" },
          { value: "Moderate", label: "Moderate" },
          { value: "High", label: "High" },
          { value: "Very high", label: "Very high" },
        ],
      },
    ],

    productCompatibility: [
      {
        id: "issueIngredients",
        category: "Product Compatibility",
        question: "Which ingredients have caused issues before?",
        sub: "Select all that apply.",
        type: "multi",
        options: [
          { value: "Fragrance", label: "Fragrance" },
          { value: "Alcohol", label: "Alcohol" },
          { value: "Essential Oils", label: "Essential Oils" },
          { value: "Retinol", label: "Retinol" },
          { value: "Salicylic Acid", label: "Salicylic Acid" },
          { value: "Benzoyl Peroxide", label: "Benzoyl Peroxide" },
          { value: "Niacinamide", label: "Niacinamide" },
          { value: "Vitamin C", label: "Vitamin C" },
          { value: "None", label: "None" },
          { value: "Not Sure", label: "Not Sure" },
        ],
      },
      {
        id: "lookForIngredients",
        category: "Product Compatibility",
        question: "Which ingredients do you actively look for?",
        sub: "Select all that apply.",
        type: "multi",
        options: [
          { value: "Hyaluronic Acid", label: "Hyaluronic Acid" },
          { value: "Ceramides", label: "Ceramides" },
          { value: "Niacinamide", label: "Niacinamide" },
          { value: "Vitamin C", label: "Vitamin C" },
          { value: "Retinol", label: "Retinol" },
          { value: "Peptides", label: "Peptides" },
          { value: "Centella Asiatica", label: "Centella Asiatica" },
          { value: "Salicylic Acid", label: "Salicylic Acid" },
          { value: "Not Sure", label: "Not Sure" },
        ],
      },
      {
        id: "skincareGoal",
        category: "Product Compatibility",
        question: "What is your skincare goal?",
        sub: "Select all that apply.",
        type: "multi",
        options: [
          { value: "Clear Acne", label: "Clear Acne" },
          { value: "Reduce Dark Spots", label: "Reduce Dark Spots" },
          { value: "Glass Skin", label: "Glass Skin" },
          { value: "Anti-Aging", label: "Anti-Aging" },
          { value: "Hydration", label: "Hydration" },
          { value: "Brightening", label: "Brightening" },
          { value: "Oil Control", label: "Oil Control" },
          { value: "Barrier Repair", label: "Barrier Repair" },
          { value: "Reduce Redness", label: "Reduce Redness" },
          { value: "General Skin Health", label: "General Skin Health" },
        ],
      },
    ],

    bonusAI: [
      {
        id: "makeupFrequency",
        category: "Bonus AI Score Inputs",
        question: "How often do you wear makeup?",
        sub: "Makeup use affects skin compatibility scoring.",
        type: "single",
        options: [
          { value: "Never", label: "Never" },
          { value: "Occasionally", label: "Occasionally" },
          { value: "Weekly", label: "Weekly" },
          { value: "Daily", label: "Daily" },
        ],
      },
      {
        id: "poreClogging",
        category: "Bonus AI Score Inputs",
        question: "Do products frequently clog your pores?",
        sub: "This helps identify congestion-prone skin.",
        type: "single",
        options: [
          { value: "Never", label: "Never" },
          { value: "Rarely", label: "Rarely" },
          { value: "Sometimes", label: "Sometimes" },
          { value: "Often", label: "Often" },
        ],
      },
      {
        id: "prescriptionTreatment",
        category: "Bonus AI Score Inputs",
        question: "Are you currently using prescription acne treatments?",
        sub: "Prescription treatments affect ingredient compatibility.",
        type: "single",
        options: [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
        ],
      },
      {
        id: "activeExperience",
        category: "Bonus AI Score Inputs",
        question: "How experienced are you with active ingredients?",
        sub: "This helps recommend appropriate product strengths.",
        type: "single",
        options: [
          { value: "Beginner", label: "Beginner" },
          { value: "Intermediate", label: "Intermediate" },
          { value: "Advanced", label: "Advanced" },
        ],
      },
      {
        id: "fitzpatrick",
        category: "Bonus AI Score Inputs",
        question: "What's your Fitzpatrick skin tone?",
        sub: "Skin tone affects pigmentation and treatment recommendations.",
        type: "single",
        options: [
          { value: "Type I (Very Fair)", label: "Type I (Very Fair)" },
          { value: "Type II (Fair)", label: "Type II (Fair)" },
          { value: "Type III (Medium)", label: "Type III (Medium)" },
          { value: "Type IV (Olive)", label: "Type IV (Olive)" },
          { value: "Type V (Brown)", label: "Type V (Brown)" },
          { value: "Type VI (Deep Brown)", label: "Type VI (Deep Brown)" },
        ],
      },
    ],
  },
};
