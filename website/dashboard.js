// Keep the most recent analyzed customer so the simulator can reuse it.
let lastCustomer = null;

// Keep account information available after loading /api/me.
let currentUser = null;

// Keep the live permissions returned by the backend for role-based UI access.
let currentPermissions = new Set();

// Cache admin users so language changes can re-render the table instantly.
let adminUsersCache = [];

// Start with the saved language, or English when no preference exists yet.
let dashboardLanguage = localStorage.getItem("churnsense_language") || "en";

// Translation dictionary for the dashboard interface.
const dashTranslations = {
  en: {
    navOverview: "Overview", navAnalyze: "Analyze", navCustomers: "Customer records", navAnalytics: "Analytics", navProfile: "Profile", navSettings: "Settings", navAdmin: "Admin", logout: "Log out",
    greetingText: "Customer retention overview", overviewEyebrow: "OVERVIEW", overviewTitle: "Your churn intelligence workspace", overviewText: "All numbers below come from predictions saved in your account.", newAnalysis: "New analysis",
    totalAnalyzed: "Customers analyzed", highRisk: "Higher-risk customers", averageRisk: "Average predicted risk", recentTitle: "Recent analyses", recentText: "Your latest saved customer predictions.", customerRef: "Customer", risk: "Risk", status: "Status", date: "Date",
    quickInsight: "QUICK INSIGHT", quickTitle: "Start with one customer", quickText: "Run a customer analysis and keep the result available in your workspace.", analyzeNow: "Analyze now",
    analysisEyebrow: "CUSTOMER RISK ANALYSIS", analysisTitle: "Analyze a customer", analysisText: "Enter the customer account, service, and billing information needed for risk analysis.", referenceLabel: "Customer reference (optional)", analyzeButton: "Analyze churn risk",
    simEyebrow: "RISK SIMULATOR", simTitle: "What if the customer profile changed?", simText: "Compare a predictive scenario. This is not a causal estimate.", simContract: "Contract scenario", simSupport: "Tech support scenario", simulateButton: "Compare scenario",
    recordsEyebrow: "CUSTOMER RECORDS", recordsTitle: "Prediction history", recordsText: "Only analyses created from your account appear here.", analyticsEyebrow: "ANALYTICS", analyticsTitle: "Risk distribution", analyticsText: "A simple summary calculated from your saved predictions.", highRiskShare: "Higher-risk share", analyticsNoteTitle: "Why this stays simple", analyticsNoteText: "ChurnSense avoids showing invented business metrics. These values are derived only from predictions saved in your local database.",
    profileEyebrow: "PROFILE", profileTitle: "Account profile", nameLabel: "Name", emailLabel: "Email", organizationLabel: "Organization", jobTitleLabel: "Job title", saveProfile: "Save profile",
    settingsEyebrow: "SETTINGS", settingsTitle: "Workspace preferences", languageSetting: "Language", languageSettingText: "Choose the default dashboard language.", themeSetting: "Theme", themeSettingText: "Saved now for future dark-mode support.", notifySetting: "Email notifications", notifySettingText: "Preference only; no email service is connected yet.", saveSettings: "Save settings",
    adminTitle: "Administration", adminText: "Manage user access and review workspace activity.", registeredUsers: "Registered users", savedPredictions: "Saved predictions", userManagementTitle: "User management", userManagementText: "New accounts start as User. Admins can assign Analyst, Manager, or Admin access.", roleLabel: "Role", joinedLabel: "Joined", actionLabel: "Action", saveRole: "Save", roleUpdated: "Role updated.", roleUser: "User", roleAnalyst: "Analyst", roleManager: "Manager", roleAdmin: "Admin",
    high: "Higher risk", low: "Lower risk", noRecords: "No predictions saved yet.", profileSaved: "Profile updated.", settingsSaved: "Settings updated.", originalRisk: "Original risk", simulatedRisk: "Simulated risk", change: "Change"
  },
  ar: {
    navOverview: "نظرة عامة", navAnalyze: "تحليل عميل", navCustomers: "سجل العملاء", navAnalytics: "التحليلات", navProfile: "الحساب الشخصي", navSettings: "الإعدادات", navAdmin: "الإدارة", logout: "تسجيل الخروج",
    greetingText: "نظرة على الاحتفاظ بالعملاء", overviewEyebrow: "نظرة عامة", overviewTitle: "مساحة ذكاء مغادرة العملاء", overviewText: "كل الأرقام أدناه مبنية على التنبؤات المحفوظة في حسابك.", newAnalysis: "تحليل جديد",
    totalAnalyzed: "العملاء الذين تم تحليلهم", highRisk: "العملاء الأعلى خطورة", averageRisk: "متوسط الخطر المتوقع", recentTitle: "أحدث التحليلات", recentText: "آخر توقعات العملاء المحفوظة.", customerRef: "العميل", risk: "الخطر", status: "الحالة", date: "التاريخ",
    quickInsight: "بداية سريعة", quickTitle: "ابدئي بعميل واحد", quickText: "حللي العميل وخلي النتيجة محفوظة ومتاحة داخل مساحة العمل.", analyzeNow: "حللي الآن",
    analysisEyebrow: "تحليل خطر العميل", analysisTitle: "تحليل عميل", analysisText: "أدخلي معلومات حساب العميل وخدماته وفوترته اللازمة لتحليل الخطر.", referenceLabel: "مرجع العميل (اختياري)", analyzeButton: "تحليل خطر المغادرة",
    simEyebrow: "محاكي الخطر", simTitle: "ماذا لو تغير ملف العميل؟", simText: "قارني سيناريو تنبؤي. هذه المقارنة ليست تقديراً سببياً.", simContract: "سيناريو العقد", simSupport: "سيناريو الدعم الفني", simulateButton: "مقارنة السيناريو",
    recordsEyebrow: "سجل العملاء", recordsTitle: "سجل التنبؤات", recordsText: "تظهر هنا فقط التحليلات التي تم إنشاؤها من حسابك.", analyticsEyebrow: "التحليلات", analyticsTitle: "توزيع الخطر", analyticsText: "ملخص بسيط محسوب من التنبؤات المحفوظة.", highRiskShare: "نسبة الأعلى خطورة", analyticsNoteTitle: "ليش التحليلات بسيطة؟", analyticsNoteText: "ChurnSense ما يعرض مؤشرات تجارية مخترعة. هذه القيم مشتقة فقط من التنبؤات المحفوظة في قاعدة البيانات المحلية.",
    profileEyebrow: "الحساب الشخصي", profileTitle: "بيانات الحساب", nameLabel: "الاسم", emailLabel: "البريد الإلكتروني", organizationLabel: "الجهة", jobTitleLabel: "المسمى الوظيفي", saveProfile: "حفظ الملف الشخصي",
    settingsEyebrow: "الإعدادات", settingsTitle: "تفضيلات مساحة العمل", languageSetting: "اللغة", languageSettingText: "اختاري اللغة الافتراضية للوحة التحكم.", themeSetting: "المظهر", themeSettingText: "يتم حفظه الآن لدعم الوضع الداكن لاحقاً.", notifySetting: "إشعارات البريد", notifySettingText: "يتم حفظ التفضيل فقط؛ لا توجد خدمة بريد مرتبطة حالياً.", saveSettings: "حفظ الإعدادات",
    adminTitle: "الإدارة", adminText: "إدارة صلاحيات المستخدمين ومراجعة نشاط مساحة العمل.", registeredUsers: "المستخدمون المسجلون", savedPredictions: "التنبؤات المحفوظة", userManagementTitle: "إدارة المستخدمين", userManagementText: "كل حساب جديد يبدأ كمستخدم عادي، ويستطيع الأدمن تعيين محلل أو مدير أو أدمن.", roleLabel: "الدور", joinedLabel: "تاريخ الانضمام", actionLabel: "الإجراء", saveRole: "حفظ", roleUpdated: "تم تحديث الدور.", roleUser: "مستخدم", roleAnalyst: "محلل", roleManager: "مدير", roleAdmin: "أدمن",
    high: "خطر أعلى", low: "خطر أقل", noRecords: "ما فيه تنبؤات محفوظة للحين.", profileSaved: "تم تحديث الحساب.", settingsSaved: "تم تحديث الإعدادات.", originalRisk: "الخطر الأصلي", simulatedRisk: "الخطر في السيناريو", change: "التغير"
  }
};

// Short helper to read the active translation object.
function dt() {
  return dashTranslations[dashboardLanguage];
}

// Check one permission returned by the backend.
function can(permission) {
  return currentPermissions.has(permission);
}

// Convert internal role names into friendly bilingual labels.
function roleLabel(role) {
  const key = `role${String(role || "user").charAt(0).toUpperCase()}${String(role || "user").slice(1)}`;
  return dt()[key] || role || dt().roleUser;
}

// Escape user-provided text before placing it inside HTML templates.
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Hide every navigation item or panel the current role is not allowed to use.
function applyPermissions() {
  document.querySelectorAll("[data-permission]").forEach((element) => {
    const allowed = can(element.dataset.permission);
    element.classList.toggle("permission-hidden", !allowed);
  });

  // Return to Overview if the active panel became unavailable.
  const activePanel = document.querySelector(".dashboard-panel.active");
  if (activePanel?.dataset.permission && !can(activePanel.dataset.permission)) {
    showPanel("overview");
  }
}

// Apply language, direction, and translated labels.
function applyDashboardLanguage() {
  document.documentElement.lang = dashboardLanguage;
  document.documentElement.dir = dashboardLanguage === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-dash-i18n]").forEach((element) => {
    const key = element.dataset.dashI18n;
    if (dt()[key]) element.textContent = dt()[key];
  });
  document.getElementById("dashboardLanguageToggle").textContent = dashboardLanguage === "en" ? "عربي" : "EN";
  if (currentUser) document.getElementById("userRole").textContent = roleLabel(currentUser.role);
  if (adminUsersCache.length) renderAdminUsers(adminUsersCache);
  renderGreeting();
}

// Show a time-neutral personalized greeting.
function renderGreeting() {
  const name = currentUser?.name || "";
  document.getElementById("greetingTitle").textContent = dashboardLanguage === "ar" ? `حياك ${name}` : `Welcome, ${name}`;
}

// Show one dashboard section at a time.
function showPanel(panelName) {
  const targetButton = document.querySelector(`.sidebar-link[data-panel="${panelName}"]`);
  const requiredPermission = targetButton?.dataset.permission;
  if (requiredPermission && !can(requiredPermission)) return;

  document.querySelectorAll(".dashboard-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `panel-${panelName}`));
  document.querySelectorAll(".sidebar-link[data-panel]").forEach((button) => button.classList.toggle("active", button.dataset.panel === panelName));
  if (panelName === "customers") loadRecords();
  if (panelName === "overview" || panelName === "analytics") loadDashboardStats();
  if (panelName === "admin") {
    loadAdminSummary();
    loadAdminUsers();
  }
}

// Attach navigation behavior to sidebar and shortcut buttons.
document.querySelectorAll("[data-panel]").forEach((button) => button.addEventListener("click", () => showPanel(button.dataset.panel)));
document.querySelectorAll("[data-open-panel]").forEach((button) => button.addEventListener("click", () => showPanel(button.dataset.openPanel)));

// Load the active account before exposing dashboard data.
async function loadMe() {
  const response = await fetch("/api/me", { credentials: "include" });
  if (!response.ok) {
    window.location.href = "/login";
    return;
  }

  const result = await response.json();
  currentUser = result.user;
  currentPermissions = new Set(currentUser.permissions || []);
  dashboardLanguage = result.settings?.language || dashboardLanguage;
  localStorage.setItem("churnsense_language", dashboardLanguage);

  document.getElementById("userName").textContent = currentUser.name;
  document.getElementById("userRole").textContent = roleLabel(currentUser.role);
  document.getElementById("userAvatar").textContent = currentUser.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  document.getElementById("profileName").value = currentUser.name || "";
  document.getElementById("profileEmail").value = currentUser.email || "";
  document.getElementById("profileOrganization").value = currentUser.organization || "";
  document.getElementById("profileJobTitle").value = currentUser.job_title || "";
  document.getElementById("settingLanguage").value = result.settings?.language || "en";
  document.getElementById("settingTheme").value = result.settings?.theme || "light";
  document.documentElement.dataset.theme = result.settings?.theme || "light";

  applyDashboardLanguage();
  applyPermissions();
  await loadDashboardStats();
  if (can("records")) await loadRecords();
}

// Load real dashboard statistics from saved predictions.
async function loadDashboardStats() {
  const response = await fetch("/api/dashboard", { credentials: "include" });
  if (!response.ok) return;
  const stats = await response.json();
  const averagePercent = stats.average_probability * 100;
  const highShare = stats.total ? (stats.high_risk / stats.total) * 100 : 0;

  document.getElementById("statTotal").textContent = stats.total;
  document.getElementById("statHighRisk").textContent = stats.high_risk;
  document.getElementById("statAverage").textContent = `${averagePercent.toFixed(1)}%`;
  document.getElementById("analyticsTotal").textContent = stats.total;
  document.getElementById("analyticsHighShare").textContent = `${highShare.toFixed(1)}%`;
  document.getElementById("analyticsAverage").textContent = `${averagePercent.toFixed(1)}%`;
}

// Render saved prediction history into a table body.
function renderRecordRows(target, predictions, limit = predictions.length) {
  target.innerHTML = "";
  const rows = predictions.slice(0, limit);
  if (!rows.length) {
    target.innerHTML = `<tr><td colspan="4">${dt().noRecords}</td></tr>`;
    return;
  }

  rows.forEach((item) => {
    const probability = Number(item.probability) * 100;
    const isHigh = item.prediction === "Yes";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.customer_reference || `#${item.id}`)}</td>
      <td>${probability.toFixed(1)}%</td>
      <td><span class="risk-badge ${isHigh ? "high" : "low"}">${isHigh ? dt().high : dt().low}</span></td>
      <td>${new Date(item.created_at).toLocaleDateString(dashboardLanguage === "ar" ? "ar-SA" : "en-GB")}</td>
    `;
    target.appendChild(row);
  });
}

// Load saved customer predictions from the shared database through the API.
async function loadRecords() {
  if (!can("records")) return;
  const response = await fetch("/api/predictions", { credentials: "include" });
  if (!response.ok) return;
  const result = await response.json();
  renderRecordRows(document.getElementById("recentTableBody"), result.predictions, 5);
  renderRecordRows(document.getElementById("recordsTableBody"), result.predictions);
}

// Convert the HTML form into the exact types expected by Python.
function buildCustomerFromForm(form) {
  const customer = Object.fromEntries(new FormData(form).entries());
  customer.SeniorCitizen = Number(customer.SeniorCitizen);
  customer.tenure = Number(customer.tenure);
  customer.MonthlyCharges = Number(customer.MonthlyCharges);
  customer.TotalCharges = Number(customer.TotalCharges);
  return customer;
}

// Run the real model from the dashboard and save the result automatically.
document.getElementById("dashboardPredictionForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const customer = buildCustomerFromForm(event.currentTarget);
  const resultBox = document.getElementById("dashboardPredictionResult");

  const response = await fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(customer)
  });

  const result = await response.json();
  resultBox.hidden = false;

  if (!response.ok) {
    resultBox.innerHTML = `<strong>${result.error || "Prediction failed."}</strong>`;
    return;
  }

  lastCustomer = { ...customer };
  delete lastCustomer.customer_reference;
  const probabilityPercent = Number(result.churn_probability) * 100;
  const isHigh = result.prediction === "Yes";
  resultBox.innerHTML = `<span class="risk-badge ${isHigh ? "high" : "low"}">${isHigh ? dt().high : dt().low}</span><br><strong>${probabilityPercent.toFixed(1)}%</strong>`;

  if (can("simulator")) {
    document.getElementById("simulatorCard").hidden = false;
    document.getElementById("simContract").value = customer.Contract;
    document.getElementById("simTechSupport").value = customer.TechSupport;
  }

  await loadDashboardStats();
  if (can("records")) await loadRecords();
});

// Compare a modified scenario using the same trained model.
document.getElementById("simulateButton").addEventListener("click", async () => {
  if (!lastCustomer) return;
  const changes = {
    Contract: document.getElementById("simContract").value,
    TechSupport: document.getElementById("simTechSupport").value
  };

  const response = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ customer: lastCustomer, changes })
  });

  const result = await response.json();
  const output = document.getElementById("simulatorResult");
  output.hidden = false;
  if (!response.ok) {
    output.innerHTML = `<div class="sim-score">${result.error || "Simulation failed."}</div>`;
    return;
  }

  output.innerHTML = `
    <div class="sim-score"><span>${dt().originalRisk}</span><strong>${(result.original.probability * 100).toFixed(1)}%</strong></div>
    <div class="sim-score"><span>${dt().simulatedRisk}</span><strong>${(result.simulated.probability * 100).toFixed(1)}%</strong><small>${dt().change}: ${result.difference > 0 ? "+" : ""}${result.difference.toFixed(1)} pts</small></div>
  `;
});

// Save profile changes to the shared profile.
document.getElementById("profileForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  if (response.ok) {
    document.getElementById("profileMessage").textContent = dt().profileSaved;
    await loadMe();
  }
});

// Save workspace preferences to the shared settings.
document.getElementById("saveSettingsButton").addEventListener("click", async () => {
  const body = {
    language: document.getElementById("settingLanguage").value,
    theme: document.getElementById("settingTheme").value,
    email_notifications: false
  };
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  if (response.ok) {
    dashboardLanguage = body.language;
    localStorage.setItem("churnsense_language", dashboardLanguage);
    document.documentElement.dataset.theme = body.theme;
    applyDashboardLanguage();
    document.getElementById("settingsMessage").textContent = dt().settingsSaved;
  }
});

// Load admin totals only when the signed-in user is an admin.
async function loadAdminSummary() {
  if (!can("admin")) return;
  const response = await fetch("/api/admin/summary", { credentials: "include" });
  if (!response.ok) return;
  const result = await response.json();
  document.getElementById("adminUsers").textContent = result.users;
  document.getElementById("adminPredictions").textContent = result.predictions;
}

// Render the admin user-management table with a role selector for each account.
function renderAdminUsers(users) {
  const body = document.getElementById("adminUsersTableBody");
  if (!body) return;
  body.innerHTML = "";

  users.forEach((user) => {
    const row = document.createElement("tr");
    const isCurrentAdmin = String(user.id) === String(currentUser?.id);
    const joined = new Date(user.created_at).toLocaleDateString(dashboardLanguage === "ar" ? "ar-SA" : "en-GB");

    row.innerHTML = `
      <td><strong>${escapeHtml(user.name)}</strong></td>
      <td>${escapeHtml(user.email)}</td>
      <td>
        <select class="admin-role-select" data-user-id="${user.id}" ${isCurrentAdmin ? "disabled" : ""}>
          <option value="user" ${user.role === "user" ? "selected" : ""}>${dt().roleUser}</option>
          <option value="analyst" ${user.role === "analyst" ? "selected" : ""}>${dt().roleAnalyst}</option>
          <option value="manager" ${user.role === "manager" ? "selected" : ""}>${dt().roleManager}</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>${dt().roleAdmin}</option>
        </select>
      </td>
      <td>${joined}</td>
      <td>
        <button class="button button-secondary admin-role-save" type="button" data-user-id="${user.id}" ${isCurrentAdmin ? "disabled" : ""}>${dt().saveRole}</button>
      </td>
    `;
    body.appendChild(row);
  });
}

// Load all users only for accounts with user-management permission.
async function loadAdminUsers() {
  if (!can("users_manage")) return;
  const response = await fetch("/api/admin/users", { credentials: "include" });
  if (!response.ok) return;
  const result = await response.json();
  adminUsersCache = result.users || [];
  renderAdminUsers(adminUsersCache);
}

// Save a changed user role through the protected admin API.
document.getElementById("adminUsersTableBody")?.addEventListener("click", async (event) => {
  const button = event.target.closest(".admin-role-save");
  if (!button) return;

  const userId = button.dataset.userId;
  const select = document.querySelector(`.admin-role-select[data-user-id="${userId}"]`);
  const message = document.getElementById("adminMessage");

  button.disabled = true;
  const response = await fetch(`/api/admin/users/${userId}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role: select.value })
  });
  const result = await response.json();
  button.disabled = false;

  if (!response.ok) {
    message.textContent = result.error || "Role update failed.";
    return;
  }

  message.textContent = dt().roleUpdated;
  await loadAdminUsers();
});

// Toggle dashboard language locally.
document.getElementById("dashboardLanguageToggle").addEventListener("click", () => {
  dashboardLanguage = dashboardLanguage === "en" ? "ar" : "en";
  localStorage.setItem("churnsense_language", dashboardLanguage);
  document.getElementById("settingLanguage").value = dashboardLanguage;
  applyDashboardLanguage();
  if (can("records")) loadRecords();
  if (can("users_manage")) loadAdminUsers();
});

// End the Flask session and return to the public site.
document.getElementById("logoutButton").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST", credentials: "include" });
  window.location.href = "/";
});

// Load the session, profile, settings, and real dashboard data on startup.
loadMe();
