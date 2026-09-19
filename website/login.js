// Keep the authentication page bilingual without changing backend field values.
let authLanguage = localStorage.getItem("churnsense_language") || "en";

// Translation text used only on the login page.
const authTranslations = {
  en: {
    eyebrow: "CUSTOMER RETENTION INTELLIGENCE",
    title: "Turn churn signals into earlier action.",
    text: "Sign in to analyze customers, review saved risk assessments, and compare predictive scenarios.",
    note: "Secure account access • Passwords are stored as protected hashes.",
    signInTab: "Sign in",
    createTab: "Create account",
    welcome: "Welcome back",
    welcomeText: "Use your ChurnSense account to continue.",
    email: "Email",
    password: "Password",
    passwordRule: "Password (8+ characters)",
    signInButton: "Sign in",
    createTitle: "Create your workspace",
    createText: "Create your ChurnSense account to start analyzing customer risk.",
    name: "Name",
    createButton: "Create account"
  },
  ar: {
    eyebrow: "ذكاء الاحتفاظ بالعملاء",
    title: "حوّلي إشارات مغادرة العميل إلى إجراء مبكر.",
    text: "سجلي الدخول لتحليل العملاء ومراجعة التقييمات المحفوظة ومقارنة سيناريوهات التنبؤ.",
    note: "دخول آمن للحساب • كلمات المرور تُحفظ بصيغة محمية.",
    signInTab: "تسجيل الدخول",
    createTab: "إنشاء حساب",
    welcome: "حياك من جديد",
    welcomeText: "استخدمي حساب ChurnSense للمتابعة.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    passwordRule: "كلمة المرور (8 أحرف أو أكثر)",
    signInButton: "تسجيل الدخول",
    createTitle: "أنشئي مساحة العمل",
    createText: "أنشئي حساب ChurnSense لبدء تحليل مخاطر مغادرة العملاء.",
    name: "الاسم",
    createButton: "إنشاء الحساب"
  }
};

// Apply the selected language to all marked text.
function applyAuthLanguage() {
  document.documentElement.lang = authLanguage;
  document.documentElement.dir = authLanguage === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-auth-i18n]").forEach((element) => {
    const key = element.dataset.authI18n;
    if (authTranslations[authLanguage][key]) {
      element.textContent = authTranslations[authLanguage][key];
    }
  });
  document.getElementById("authLanguageToggle").textContent = authLanguage === "en" ? "عربي" : "EN";
}

// Switch between the sign-in and create-account forms.
document.querySelectorAll("[data-auth-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.authTab;
    document.querySelectorAll(".auth-tab").forEach((item) => item.classList.toggle("active", item === button));
    document.getElementById("loginForm").classList.toggle("active", tab === "login");
    document.getElementById("registerForm").classList.toggle("active", tab === "register");
  });
});

// Change language and remember the preference locally.
document.getElementById("authLanguageToggle").addEventListener("click", () => {
  authLanguage = authLanguage === "en" ? "ar" : "en";
  localStorage.setItem("churnsense_language", authLanguage);
  applyAuthLanguage();
});

// Submit sign-in credentials to the Flask API.
document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("loginMessage");
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  message.textContent = "";

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });

  const result = await response.json();
  if (!response.ok) {
    message.textContent = result.error || "Unable to sign in.";
    return;
  }

  window.location.href = "/dashboard";
});

// Submit a new account to the Flask API.
document.getElementById("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("registerMessage");
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  message.textContent = "";

  const response = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });

  const result = await response.json();
  if (!response.ok) {
    message.textContent = result.error || "Unable to create the account.";
    return;
  }

  // Supabase may require email confirmation before the first login.
  if (result.requires_email_confirmation) {
    message.textContent = result.message || "Account created. Check your email, then sign in.";
    return;
  }

  // When email confirmation is disabled, registration can continue directly to the dashboard.
  window.location.href = "/dashboard";
});

// Apply language when the page first opens.
applyAuthLanguage();
