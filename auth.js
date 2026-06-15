// ══════════════════════════════════════════════════════════════
// FormulaDecode — Authentication & Profile Module
// ══════════════════════════════════════════════════════════════

const SUPABASE_URL = FD_CONFIG.supabaseUrl;
const SUPABASE_ANON_KEY = FD_CONFIG.supabaseAnonKey;

let _fdClient = null;
let _signingOut = false;

function initSupabase() {
  if (typeof window.supabase !== "undefined") {
    _fdClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "fd-auth",
      },
      global: {
        fetch: (...args) => {
          return Promise.race([
            fetch(...args),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Request timeout")), 8000),
            ),
          ]);
        },
      },
    });
  } else {
    console.error("Supabase SDK not loaded.");
  }
}

// ── Auth State ────────────────────────────────────────────────
const FD_Auth = {
  currentUser: null,
  userProfile: null,
  isLoading: false,
  authListeners: [],

  setUser(user) {
    this.currentUser = user;
    this.notifyListeners();
    updateNavAvatar();
  },

  setProfile(profile) {
    this.userProfile = profile;
    this.notifyListeners();
  },

  onAuthChange(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser, this.userProfile);
  },

  notifyListeners() {
    this.authListeners.forEach((cb) => cb(this.currentUser, this.userProfile));
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  getUserFirstLetter() {
    if (!this.currentUser) return "?";
    const name = this.userProfile?.full_name || this.currentUser.email || "?";
    return name.charAt(0).toUpperCase();
  },
};

// ── Password Validation ───────────────────────────────────────
const passwordRules = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (pw) => pw.length >= 8,
  },
  {
    id: "lowercase",
    label: "At least 1 lowercase letter (a-z)",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    id: "uppercase",
    label: "At least 1 uppercase letter (A-Z)",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: "number",
    label: "At least 1 number (0-9)",
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    id: "special",
    label: "At least 1 special character",
    test: (pw) => /[^a-zA-Z0-9]/.test(pw),
  },
];

function validatePassword(password) {
  return passwordRules.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));
}

function isPasswordValid(password) {
  return passwordRules.every((rule) => rule.test(password));
}

function renderPasswordRequirements(password, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const results = validatePassword(password);
  container.innerHTML = results
    .map(
      (r) => `
    <div class="pw-rule ${r.passed ? "passed" : "failed"}">
      <span class="pw-rule-icon">${r.passed ? "✓" : "✗"}</span>
      <span class="pw-rule-label">${r.label}</span>
    </div>
  `,
    )
    .join("");
}

// ── Sign Up ───────────────────────────────────────────────────
async function signUp(fullName, gender, email, password, confirmPassword) {
  if (!_fdClient)
    return { error: { message: "Auth service not initialized." } };

  if (!fullName || fullName.trim().length < 2)
    return { error: { message: "Full name must be at least 2 characters." } };
  if (!gender) return { error: { message: "Please select your gender." } };
  if (!isPasswordValid(password))
    return { error: { message: "Password does not meet all requirements." } };
  if (password !== confirmPassword)
    return { error: { message: "Passwords do not match." } };

  try {
    const { data, error } = await _fdClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim(), gender } },
    });
    if (error) return { error };
    if (data.user) {
      await createUserProfile(data.user.id, {
        full_name: fullName.trim(),
        gender,
        email: email.trim().toLowerCase(),
        onboarding_completed: false,
      });
    }
    return { data };
  } catch (err) {
    return { error: { message: err.message || "Sign up failed." } };
  }
}

// ── Sign In ───────────────────────────────────────────────────
async function signIn(email, password, rememberMe = false) {
  if (!_fdClient)
    return { error: { message: "Auth service not initialized." } };

  try {
    const signInPromise = _fdClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Sign in timed out. Please check your connection and try again.",
            ),
          ),
        10000,
      ),
    );
    const { data, error } = await Promise.race([signInPromise, timeoutPromise]);
    if (error) return { error };
    if (data.user) {
      // Set user immediately — don't wait for profile
      FD_Auth.setUser(data.user);
      // Route immediately — don't make user wait for profile
      handlePostAuth(data.user, null);
      // Then load profile + data silently in background
      fetchUserProfile(data.user.id).then((profile) => {
        FD_Auth.setProfile(profile);
        if (profile?.onboarding_completed && profile?.onboarding_answers) {
          DD.profile = buildProfileFromAnswers(profile.onboarding_answers);
        }
        loadScansFromDB();
        renderDashboard();
      });
    }
    return { data };
  } catch (err) {
    return { error: { message: err.message || "Sign in failed." } };
  }
}

// ── Google OAuth ──────────────────────────────────────────────
async function signInWithGoogle() {
  if (!_fdClient)
    return { error: { message: "Auth service not initialized." } };

  try {
    const { data, error } = await _fdClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    return { data, error };
  } catch (err) {
    return { error: { message: err.message || "Google sign in failed." } };
  }
}

// ── Forgot Password ───────────────────────────────────────────
async function sendPasswordReset(email) {
  if (!_fdClient)
    return { error: { message: "Auth service not initialized." } };

  try {
    const { data, error } = await _fdClient.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo:
          window.location.origin + window.location.pathname + "?reset=true",
      },
    );
    return { data, error };
  } catch (err) {
    return { error: { message: err.message || "Password reset failed." } };
  }
}

// ── Sign Out ──────────────────────────────────────────────────
async function signOut() {
  _signingOut = true;

  // Don't await Supabase — it hangs. Fire and forget.
  if (_fdClient) {
    _fdClient.auth.signOut({ scope: "local" }).catch(() => {});
  }

  // Clear localStorage immediately
  try {
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith("sb-") ||
        key.includes("supabase") ||
        key === "fd-auth"
      ) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem("fd-state");
    localStorage.removeItem("fd-auth");
  } catch (e) {}

  // Clear all state
  FD_Auth.currentUser = null;
  FD_Auth.userProfile = null;
  DD.state.scanHistory = [];
  DD.state.savedProducts = [];
  DD.state.favorites = [];
  DD.state.compareList = [];
  DD.state.currentProduct = null;
  DD.profile = null;

  // Update avatar
  const avatar = document.getElementById("nav-avatar");
  if (avatar) {
    avatar.textContent = "?";
    avatar.onclick = () => showAuthModal("login");
  }

  // Navigate to dashboard
  showPage("dashboard");
  renderDashboard();

  setTimeout(() => {
    _signingOut = false;
  }, 3000);
}

window.signOut = signOut;

// ── User Profile CRUD ─────────────────────────────────────────
async function createUserProfile(userId, data) {
  if (!_fdClient) return null;

  const { data: profile, error } = await _fdClient
    .from("user_profiles")
    .upsert({
      id: userId,
      full_name: data.full_name,
      gender: data.gender,
      email: data.email,
      onboarding_completed: data.onboarding_completed ?? false,
      skin_profile: null,
      onboarding_answers: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) console.error("Profile creation error:", error);
  return profile;
}

async function fetchUserProfile(userId) {
  if (!_fdClient) return null;

  const { data, error } = await _fdClient
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Profile fetch error:", error);
  }
  return data || null;
}

async function updateUserProfile(userId, updates) {
  if (!_fdClient) return { error: { message: "Not initialized." } };

  const { data, error } = await _fdClient
    .from("user_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (!error) FD_Auth.setProfile(data);
  return { data, error };
}

async function saveOnboardingAnswers(userId, answers, skinProfile) {
  if (!_fdClient) return { error: { message: "Not initialized." } };

  const { data, error } = await _fdClient
    .from("user_profiles")
    .update({
      onboarding_completed: true,
      onboarding_answers: answers,
      skin_profile: skinProfile,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (!error) FD_Auth.setProfile(data);
  return { data, error };
}

// ── Chat History ──────────────────────────────────────────────
async function saveChatMessage(userId, role, content) {
  if (!_fdClient || !userId) return;
  await _fdClient.from("chat_history").insert({
    user_id: userId,
    role,
    content,
    created_at: new Date().toISOString(),
  });
}

async function fetchChatHistory(userId, limit = 50) {
  if (!_fdClient || !userId) return [];
  const { data } = await _fdClient
    .from("chat_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(limit);
  return data || [];
}

// ── Auth State Listener ───────────────────────────────────────
function initAuthListener() {
  if (!_fdClient) return;

  _fdClient.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session?.user && !_signingOut) {
      FD_Auth.setUser(session.user);

      let profile = await fetchUserProfile(session.user.id);

      // New Google user — create profile from metadata
      if (!profile && session.user.app_metadata?.provider === "google") {
        const meta = session.user.user_metadata || {};
        profile = await createUserProfile(session.user.id, {
          full_name: meta.full_name || meta.name || session.user.email,
          gender: "",
          email: session.user.email,
          onboarding_completed: false,
        });
      }

      FD_Auth.setProfile(profile);
      handlePostAuth(session.user, profile);
    } else if (event === "SIGNED_OUT") {
      FD_Auth.setUser(null);
      FD_Auth.setProfile(null);
      updateNavAvatar();
      showPage("dashboard");
      renderDashboard();
    } else if (event === "PASSWORD_RECOVERY") {
      showAuthPage("reset-password");
    }
  });
}

// ── Post-auth routing ─────────────────────────────────────────
function handlePostAuth(user, profile) {
  hideAuthModal();
  showMainApp();
  showPage("dashboard");
  renderDashboard();
  updateNavAvatar();
  // Load scan history from DB
  loadScansFromDB();
}

// ── Personalized Analysis CTA ─────────────────────────────────
function handlePersonalizedCTA() {
  if (FD_Auth.isLoggedIn()) {
    startPersonalizedFlow(FD_Auth.currentUser, FD_Auth.userProfile);
  } else {
    window._pendingPersonalizedFlow = true;
    showAuthModal("login");
  }
}

function startPersonalizedFlow(user, profile) {
  if (profile?.onboarding_completed && profile?.onboarding_answers) {
    DD.profile = buildProfileFromAnswers(profile.onboarding_answers);
    showMainApp();
    showPage("dashboard");
    renderDashboard();
  } else {
    showMainApp();
    document.getElementById("nav").style.display = "none";
    showPage("onboarding");
    initOnboarding();
  }
}

// ── UI helpers ────────────────────────────────────────────────
function showMainApp() {
  document.getElementById("app").style.display = "block";
  const overlay = document.getElementById("auth-overlay");
  if (overlay) overlay.style.display = "none";
  document.getElementById("nav").style.display = "flex";
  updateNavAvatar();
}

function showAuthOverlay(mode = "login") {
  const overlay = document.getElementById("auth-overlay");
  if (overlay) overlay.style.display = "flex";
  document.getElementById("app").style.display = "none";
  document.getElementById("nav").style.display = "none";
  showAuthPage(mode);
}

function showAuthModal(mode = "login") {
  const modal = document.getElementById("auth-modal");
  if (modal) {
    modal.style.display = "flex";
  }
  showAuthPage(mode, "modal");
}

function hideAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.style.display = "none";
}

function showAuthPage(mode, context = "overlay") {
  const prefix = context === "modal" ? "modal" : "auth";
  ["login", "signup", "forgot", "reset-password"].forEach((p) => {
    const el = document.getElementById(`${prefix}-panel-${p}`);
    if (el) el.style.display = "none";
  });
  const target = document.getElementById(`${prefix}-panel-${mode}`);
  if (target) target.style.display = "block";
}

// ── Nav Avatar ────────────────────────────────────────────────
function updateNavAvatar() {
  const avatar = document.getElementById("nav-avatar");
  if (!avatar) return;
  if (FD_Auth.isLoggedIn()) {
    avatar.textContent = FD_Auth.getUserFirstLetter();
    avatar.style.cursor = "pointer";
    avatar.onclick = () => {
      showPage("profile");
      renderProfile();
    };
  } else {
    avatar.textContent = "?";
    avatar.onclick = () => showAuthModal("login");
  }
}

// ── Init ──────────────────────────────────────────────────────
async function initAuth() {
  initSupabase();

  if (!_fdClient) {
    showMainApp();
    showPage("dashboard");
    renderDashboard();
    return;
  }

  // Check session FIRST before doing anything
  const {
    data: { session },
  } = await _fdClient.auth.getSession();

  if (session?.user) {
    // User is logged in — load everything before rendering
    FD_Auth.setUser(session.user);
    updateNavAvatar();
    showMainApp();

    const profile = await fetchUserProfile(session.user.id);
    FD_Auth.setProfile(profile);

    if (profile?.onboarding_completed && profile?.onboarding_answers) {
      DD.profile = buildProfileFromAnswers(profile.onboarding_answers);
    }

    showPage("dashboard");
    renderDashboard();
    loadScansFromDB();
  } else {
    // No session — show guest dashboard
    showMainApp();
    showPage("dashboard");
    renderDashboard();
  }

  // Start listener AFTER initial render is done
  initAuthListener();
}

// ── Onboarding save to DB ─────────────────────────────────────
const _originalCompleteOnboarding = window.completeOnboarding;

window.completeOnboardingWithSave = async function () {
  const overlay = document.getElementById("onboard-complete-overlay");
  if (overlay) overlay.style.display = "flex";

  DD.profile = buildProfileFromAnswers(onboardAnswers);

  // Save to DB in background — don't await
  if (FD_Auth.isLoggedIn()) {
    const skinProfileData = {
      skinType: DD.profile.skinType,
      concerns: DD.profile.concerns,
      sensitivity: DD.profile.sensitivity,
    };
    saveOnboardingAnswers(
      FD_Auth.currentUser.id,
      onboardAnswers,
      skinProfileData,
    ).catch((e) => console.error("onboarding save error:", e));
  }

  // Always navigate after 1.5s regardless of DB save
  setTimeout(() => {
    if (overlay) overlay.style.display = "none";
    document.getElementById("page-onboarding")?.classList.remove("active");
    const nav = document.getElementById("nav");
    if (nav) nav.style.display = "flex";
    showPage("dashboard");
    renderDashboard();
  }, 1500);
};

// ── Save scan to Supabase ─────────────────────────────────────
async function saveScanToDB(product, isSaved = false) {
  if (!_fdClient || !FD_Auth.isLoggedIn()) return;
  try {
    const { data, error } = await _fdClient
      .from("scan_history")
      .insert({
        user_id: FD_Auth.currentUser.id,
        product_name: product.name || "",
        product_brand: product.brand || "",
        product_type: product.type || "",
        ingredients_raw: product.ingredients
          ? product.ingredients.join(", ")
          : "",
        analysis_result: product, // store full product object here
        overall_score: product.scores?.overall || null,
        ingredient_quality: product.scores?.ingredientQuality || null,
        skin_compatibility: product.scores?.skinCompatibility || null,
        risk_score: product.scores?.risk || null,
        is_saved: isSaved,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) console.error("saveScanToDB error:", error);
    // Attach the DB-generated uuid back to the product so we can reference it later
    if (data) product._dbId = data.id;
    return data;
  } catch (e) {
    console.error("saveScanToDB error:", e);
  }
}

async function markProductSaved(product, saved) {
  if (!_fdClient || !FD_Auth.isLoggedIn()) return;
  const dbId = product._dbId;
  if (!dbId) return;
  try {
    await _fdClient
      .from("scan_history")
      .update({ is_saved: saved })
      .eq("id", dbId)
      .eq("user_id", FD_Auth.currentUser.id);
  } catch (e) {
    console.error("markProductSaved error:", e);
  }
}

// ── Load scan history from Supabase ──────────────────────────
async function loadScansFromDB() {
  if (!_fdClient || !FD_Auth.isLoggedIn()) return;
  try {
    const { data, error } = await _fdClient
      .from("scan_history")
      .select("*")
      .eq("user_id", FD_Auth.currentUser.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("loadScansFromDB error:", error);
      return;
    }

    if (data?.length) {
      // analysis_result holds the full product object we stored
      DD.state.scanHistory = data.map((row) => ({
        ...row.analysis_result,
        _dbId: row.id, // keep DB uuid attached
      }));
      DD.state.savedProducts = data
        .filter((r) => r.is_saved === true)
        .map((r) => ({ ...r.analysis_result, _dbId: r.id }));
      DD.state.favorites = data
        .filter((r) => r.is_favorite === true)
        .map((r) => r._dbId || r.id);
      saveState();
      renderDashboard();
      console.log("Loaded", data.length, "scans from DB");
    }
  } catch (e) {
    console.error("loadScansFromDB error:", e);
  }
}
window.signOut = signOut;
