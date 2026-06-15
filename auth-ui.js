// ══════════════════════════════════════════════════════════════
// FormulaDecode — Auth UI Module
// Renders auth forms, handles submissions, live validation
// ══════════════════════════════════════════════════════════════

// ── Shared: set form error ─────────────────────────────────────
function setAuthError(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

function clearAuthError(containerId) {
  setAuthError(containerId, "");
}

function setAuthSuccess(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

// ── Show/hide password toggle ──────────────────────────────────
function togglePasswordVisibility(inputId, toggleBtn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === "text";
  input.type = isText ? "password" : "text";
  toggleBtn.textContent = isText ? "👁" : "🙈";
}

// ── Live password validation ───────────────────────────────────
function onPasswordInput(inputId, requirementsId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const pw = input.value;
  renderPasswordRequirements(pw, requirementsId);

  // Also re-validate confirm field if visible
  const confirmInput = document.getElementById(
    inputId.replace("password", "confirm-password"),
  );
  if (confirmInput && confirmInput.value) {
    validateConfirmPassword(
      inputId,
      inputId.replace("password", "confirm-password"),
      inputId.replace("password", "confirm-error"),
    );
  }
}

function validateConfirmPassword(passwordId, confirmId, errorId) {
  const pw = document.getElementById(passwordId)?.value || "";
  const confirm = document.getElementById(confirmId)?.value || "";
  if (confirm && pw !== confirm) {
    setAuthError(errorId, "Passwords do not match.");
  } else {
    clearAuthError(errorId);
  }
}

// ── Sign Up Form Handler ───────────────────────────────────────
async function handleSignUp(event, context = "overlay") {
  event.preventDefault();
  const prefix = context === "modal" ? "modal-signup" : "signup";

  const fullName = document.getElementById(`${prefix}-name`)?.value?.trim();
  const gender = document.getElementById(`${prefix}-gender`)?.value;
  const email = document.getElementById(`${prefix}-email`)?.value?.trim();
  const password = document.getElementById(`${prefix}-password`)?.value;
  const confirmPassword = document.getElementById(
    `${prefix}-confirm-password`,
  )?.value;
  const errorId = `${prefix}-error`;
  const btnId = `${prefix}-btn`;

  clearAuthError(errorId);

  // Client-side validation
  if (!fullName || fullName.length < 2) {
    return setAuthError(
      errorId,
      "Please enter your full name (min 2 characters).",
    );
  }
  if (!gender) {
    return setAuthError(errorId, "Please select your gender.");
  }
  if (!email || !email.includes("@")) {
    return setAuthError(errorId, "Please enter a valid email address.");
  }
  if (!isPasswordValid(password)) {
    return setAuthError(
      errorId,
      "Password does not meet all requirements listed below.",
    );
  }
  if (password !== confirmPassword) {
    return setAuthError(errorId, "Passwords do not match.");
  }

  // Loading state
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Creating account...";
  }

  const { data, error } = await signUp(
    fullName,
    gender,
    email,
    password,
    confirmPassword,
  );

  if (btn) {
    btn.disabled = false;
    btn.textContent = "Create Account";
  }

  if (error) {
    return setAuthError(errorId, error.message);
  }

  // Check if email confirmation needed
  if (data?.user && !data.session) {
    setAuthSuccess(
      `${prefix}-success`,
      "Account created! Check your email to verify your account, then sign in.",
    );
    // Clear form
    ["name", "gender", "email", "password", "confirm-password"].forEach((f) => {
      const el = document.getElementById(`${prefix}-${f}`);
      if (el) el.value = "";
    });
    const reqs = document.getElementById(`${prefix}-pw-requirements`);
    if (reqs) reqs.innerHTML = "";
    return;
  }

  // Auto-signed in (email confirmation disabled)
  if (data?.session) {
    // auth.js listener handles navigation
  }
}

// ── Sign In Form Handler ───────────────────────────────────────
async function handleSignIn(event, context = "overlay") {
  event.preventDefault();
  const prefix = context === "modal" ? "modal-login" : "login";

  const email = document.getElementById(`${prefix}-email`)?.value?.trim();
  const password = document.getElementById(`${prefix}-password`)?.value;
  const rememberMe =
    document.getElementById(`${prefix}-remember`)?.checked || false;
  const errorId = `${prefix}-error`;
  const btnId = `${prefix}-btn`;

  clearAuthError(errorId);

  if (!email || !email.includes("@")) {
    return setAuthError(errorId, "Please enter a valid email address.");
  }
  if (!password) {
    return setAuthError(errorId, "Please enter your password.");
  }

  const btn = document.getElementById(btnId);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Signing in...";
  }

  let result;
  try {
    result = await signIn(email, password, rememberMe);
  } catch (e) {
    result = { error: { message: e.message || "Sign in failed." } };
  }
  const { data, error } = result || {};

  if (btn) {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }

  if (error) {
    const msg = error.message.includes("Invalid login")
      ? "Invalid email or password. Please try again."
      : error.message;
    return setAuthError(errorId, msg);
  }

  // auth.js listener handles navigation
}

// ── Forgot Password Form Handler ───────────────────────────────
async function handleForgotPassword(event, context = "overlay") {
  event.preventDefault();
  const prefix = context === "modal" ? "modal-forgot" : "forgot";

  const email = document.getElementById(`${prefix}-email`)?.value?.trim();
  const errorId = `${prefix}-error`;
  const successId = `${prefix}-success`;
  const btnId = `${prefix}-btn`;

  clearAuthError(errorId);

  if (!email || !email.includes("@")) {
    return setAuthError(errorId, "Please enter a valid email address.");
  }

  const btn = document.getElementById(btnId);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Sending...";
  }

  const { error } = await sendPasswordReset(email);

  if (btn) {
    btn.disabled = false;
    btn.textContent = "Send Reset Link";
  }

  if (error) {
    return setAuthError(errorId, error.message);
  }

  setAuthSuccess(
    successId,
    `Reset link sent to ${email}. Check your inbox (and spam folder).`,
  );
}

// ── Google OAuth Handler ───────────────────────────────────────
async function handleGoogleAuth(context = "overlay") {
  const { error } = await signInWithGoogle();
  if (error) {
    const prefix = context === "modal" ? "modal-login" : "login";
    setAuthError(`${prefix}-error`, error.message);
  }
  // Redirect happens automatically via Supabase OAuth flow
}

// ── Auth HTML Builders ─────────────────────────────────────────

function buildGenderOptions() {
  return `
    <option value="">Select gender</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
    <option value="Non Binary">Non Binary</option>
    <option value="Prefer Not To Say">Prefer Not To Say</option>
  `;
}

function buildGoogleBtn(context, label = "Continue with Google") {
  return `
    <button type="button" class="btn-google" onclick="handleGoogleAuth('${context}')">
      <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      ${label}
    </button>
  `;
}

function buildDivider() {
  return `<div class="auth-divider"><span>or</span></div>`;
}

// ── Build Login Panel ──────────────────────────────────────────
function buildLoginPanel(prefix, context, switchFn) {
  return `
    <div id="${prefix}-panel-login" class="auth-panel">
      <div class="auth-header">
        <div class="auth-logo">
          <div class="auth-logo-icon">🧬</div>
          <span>Formula<span class="auth-logo-accent">Decode</span></span>
        </div>
        <h2 class="auth-title">Welcome back</h2>
        <p class="auth-subtitle">Sign in to access your personalized skincare profile</p>
      </div>

      ${buildGoogleBtn(context)}
      ${buildDivider()}

      <div id="${prefix}-login-error" class="auth-error" style="display:none"></div>

      <form onsubmit="handleSignIn(event, '${context}')">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input
            type="email"
            id="${prefix}-login-email"
            class="input"
            placeholder="you@example.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-with-toggle">
            <input
              type="password"
              id="${prefix}-login-password"
              class="input"
              placeholder="Your password"
              required
              autocomplete="current-password"
            />
            <button type="button" class="pw-toggle" onclick="togglePasswordVisibility('${prefix}-login-password', this)">👁</button>
          </div>
        </div>

        <div class="form-row-between">
          <label class="checkbox-label">
            <input type="checkbox" id="${prefix}-login-remember" />
            <span>Remember me</span>
          </label>
          <button type="button" class="auth-link" onclick="${switchFn}('forgot', '${context}')">
            Forgot password?
          </button>
        </div>

        <button type="submit" id="${prefix}-login-btn" class="btn btn-primary btn-full">
          Sign In
        </button>
      </form>

      <div class="auth-switch">
        Don't have an account?
        <button type="button" class="auth-link" onclick="${switchFn}('signup', '${context}')">Create account</button>
      </div>
    </div>
  `;
}

// ── Build Sign Up Panel ────────────────────────────────────────
function buildSignupPanel(prefix, context, switchFn) {
  return `
    <div id="${prefix}-panel-signup" class="auth-panel" style="display:none">
      <div class="auth-header">
        <div class="auth-logo">
          <div class="auth-logo-icon">🧬</div>
          <span>Formula<span class="auth-logo-accent">Decode</span></span>
        </div>
        <h2 class="auth-title">Create your account</h2>
        <p class="auth-subtitle">Join FormulaDecode and decode what's really in your skincare</p>
      </div>

      ${buildGoogleBtn(context)}
      ${buildDivider()}

      <div id="${prefix}-signup-error" class="auth-error" style="display:none"></div>
      <div id="${prefix}-signup-success" class="auth-success" style="display:none"></div>

      <form onsubmit="handleSignUp(event, '${context}')">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input
            type="text"
            id="${prefix}-signup-name"
            class="input"
            placeholder="Your full name"
            required
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Gender</label>
          <select id="${prefix}-signup-gender" class="input select-input" required>
            ${buildGenderOptions()}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input
            type="email"
            id="${prefix}-signup-email"
            class="input"
            placeholder="you@example.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-with-toggle">
            <input
              type="password"
              id="${prefix}-signup-password"
              class="input"
              placeholder="Create a strong password"
              required
              autocomplete="new-password"
              oninput="onPasswordInput('${prefix}-signup-password', '${prefix}-signup-pw-requirements')"
            />
            <button type="button" class="pw-toggle" onclick="togglePasswordVisibility('${prefix}-signup-password', this)">👁</button>
          </div>
          <div id="${prefix}-signup-pw-requirements" class="pw-requirements"></div>
        </div>

        <div class="form-group">
          <label class="form-label">Confirm Password</label>
          <div class="input-with-toggle">
            <input
              type="password"
              id="${prefix}-signup-confirm-password"
              class="input"
              placeholder="Repeat your password"
              required
              autocomplete="new-password"
              oninput="validateConfirmPassword('${prefix}-signup-password', '${prefix}-signup-confirm-password', '${prefix}-signup-confirm-error')"
            />
            <button type="button" class="pw-toggle" onclick="togglePasswordVisibility('${prefix}-signup-confirm-password', this)">👁</button>
          </div>
          <div id="${prefix}-signup-confirm-error" class="auth-error" style="display:none"></div>
        </div>

        <button type="submit" id="${prefix}-signup-btn" class="btn btn-primary btn-full">
          Create Account
        </button>
      </form>

      <div class="auth-switch">
        Already have an account?
        <button type="button" class="auth-link" onclick="${switchFn}('login', '${context}')">Sign in</button>
      </div>
    </div>
  `;
}

// ── Build Forgot Password Panel ────────────────────────────────
function buildForgotPanel(prefix, context, switchFn) {
  return `
    <div id="${prefix}-panel-forgot" class="auth-panel" style="display:none">
      <div class="auth-header">
        <div class="auth-logo">
          <div class="auth-logo-icon">🧬</div>
          <span>Formula<span class="auth-logo-accent">Decode</span></span>
        </div>
        <h2 class="auth-title">Reset password</h2>
        <p class="auth-subtitle">Enter your email and we'll send you a reset link</p>
      </div>

      <div id="${prefix}-forgot-error" class="auth-error" style="display:none"></div>
      <div id="${prefix}-forgot-success" class="auth-success" style="display:none"></div>

      <form onsubmit="handleForgotPassword(event, '${context}')">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input
            type="email"
            id="${prefix}-forgot-email"
            class="input"
            placeholder="you@example.com"
            required
            autocomplete="email"
          />
        </div>

        <button type="submit" id="${prefix}-forgot-btn" class="btn btn-primary btn-full">
          Send Reset Link
        </button>
      </form>

      <div class="auth-switch">
        Remember your password?
        <button type="button" class="auth-link" onclick="${switchFn}('login', '${context}')">Back to sign in</button>
      </div>
    </div>
  `;
}

// ── Build Reset Password Panel ─────────────────────────────────
function buildResetPasswordPanel(prefix, context) {
  return `
    <div id="${prefix}-panel-reset-password" class="auth-panel" style="display:none">
      <div class="auth-header">
        <div class="auth-logo">
          <div class="auth-logo-icon">🧬</div>
          <span>Formula<span class="auth-logo-accent">Decode</span></span>
        </div>
        <h2 class="auth-title">Set new password</h2>
        <p class="auth-subtitle">Choose a strong password for your account</p>
      </div>

      <div id="${prefix}-reset-error" class="auth-error" style="display:none"></div>
      <div id="${prefix}-reset-success" class="auth-success" style="display:none"></div>

      <form onsubmit="handleResetPassword(event, '${context}')">
        <div class="form-group">
          <label class="form-label">New Password</label>
          <div class="input-with-toggle">
            <input
              type="password"
              id="${prefix}-reset-password"
              class="input"
              placeholder="New password"
              required
              oninput="onPasswordInput('${prefix}-reset-password', '${prefix}-reset-pw-requirements')"
            />
            <button type="button" class="pw-toggle" onclick="togglePasswordVisibility('${prefix}-reset-password', this)">👁</button>
          </div>
          <div id="${prefix}-reset-pw-requirements" class="pw-requirements"></div>
        </div>

        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <div class="input-with-toggle">
            <input
              type="password"
              id="${prefix}-reset-confirm"
              class="input"
              placeholder="Confirm new password"
              required
              oninput="validateConfirmPassword('${prefix}-reset-password', '${prefix}-reset-confirm', '${prefix}-reset-confirm-error')"
            />
            <button type="button" class="pw-toggle" onclick="togglePasswordVisibility('${prefix}-reset-confirm', this)">👁</button>
          </div>
          <div id="${prefix}-reset-confirm-error" class="auth-error" style="display:none"></div>
        </div>

        <button type="submit" id="${prefix}-reset-btn" class="btn btn-primary btn-full">
          Update Password
        </button>
      </form>
    </div>
  `;
}

async function handleResetPassword(event, context = "overlay") {
  event.preventDefault();
  const prefix = context === "modal" ? "modal" : "auth";
  const password = document.getElementById(`${prefix}-reset-password`)?.value;
  const confirm = document.getElementById(`${prefix}-reset-confirm`)?.value;

  if (!isPasswordValid(password)) {
    return setAuthError(
      `${prefix}-reset-error`,
      "Password does not meet all requirements.",
    );
  }
  if (password !== confirm) {
    return setAuthError(`${prefix}-reset-error`, "Passwords do not match.");
  }

  const btn = document.getElementById(`${prefix}-reset-btn`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Updating...";
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (btn) {
    btn.disabled = false;
    btn.textContent = "Update Password";
  }

  if (error) {
    return setAuthError(`${prefix}-reset-error`, error.message);
  }

  setAuthSuccess(
    `${prefix}-reset-success`,
    "Password updated! Redirecting to dashboard...",
  );
  setTimeout(() => {
    handlePostAuth(FD_Auth.currentUser, FD_Auth.userProfile);
  }, 2000);
}

// ── Switch context helper ──────────────────────────────────────
// Used by both overlay and modal panels
function switchAuthPanel(mode, context) {
  showAuthPage(mode, context);
}

// ── Inject Auth Overlay into DOM ───────────────────────────────
function injectAuthOverlay() {
  const existing = document.getElementById("auth-overlay");
  if (existing) return;

  const div = document.createElement("div");
  div.id = "auth-overlay";
  div.className = "auth-overlay";
  div.style.display = "none";
  div.innerHTML = `
    <div class="auth-card">
      ${buildLoginPanel("auth", "overlay", "switchAuthPanel")}
      ${buildSignupPanel("auth", "overlay", "switchAuthPanel")}
      ${buildForgotPanel("auth", "overlay", "switchAuthPanel")}
      ${buildResetPasswordPanel("auth", "overlay")}
    </div>
  `;
  document.body.insertBefore(div, document.body.firstChild);
}

// ── Inject Auth Modal (for mid-session prompts) ────────────────
function injectAuthModal() {
  const existing = document.getElementById("auth-modal");
  if (existing) return;

  const div = document.createElement("div");
  div.id = "auth-modal";
  div.className = "auth-modal-overlay";
  div.style.display = "none";
  div.innerHTML = `
    <div class="auth-card auth-modal-card">
      <button class="auth-modal-close" onclick="hideAuthModal(); window._pendingPersonalizedFlow = false;">✕</button>
      ${buildLoginPanel("modal", "modal", "switchAuthPanel")}
      ${buildSignupPanel("modal", "modal", "switchAuthPanel")}
      ${buildForgotPanel("modal", "modal", "switchAuthPanel")}
    </div>
  `;
  document.body.appendChild(div);
}

// ── Auto-inject on DOM ready ───────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  injectAuthOverlay();
  injectAuthModal();
});
