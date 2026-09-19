// ------------------------------------------------------------
// ChurnSense frontend behavior
// This file controls language switching, form steps, and API calls.
// ------------------------------------------------------------

// The Flask API currently runs locally on port 5000.
const API_URL = "";

// Keep track of the language currently shown on the page.
let currentLanguage = "en";

// Get the main form from the page.
const form = document.getElementById("predictionForm");

// Get every visible form step.
const formSteps = [...document.querySelectorAll(".form-step")];

// Get the step buttons shown at the top of the form.
const stepTabs = [...document.querySelectorAll(".step-tab")];

// Get every Continue button.
const nextButtons = [...document.querySelectorAll(".next-step")];

// Get every Back button.
const previousButtons = [...document.querySelectorAll(".previous-step")];

// Get the language button.
const languageToggle = document.getElementById("languageToggle");

// Get the result card elements that will be updated after prediction.
const resultEmpty = document.getElementById("resultEmpty");
const resultContent = document.getElementById("resultContent");
const resultStatus = document.getElementById("resultStatus");
const riskLabel = document.getElementById("riskLabel");
const probabilityValue = document.getElementById("probabilityValue");
const probabilityBar = document.getElementById("probabilityBar");
const resultDescription = document.getElementById("resultDescription");
const resetAnalysis = document.getElementById("resetAnalysis");

// Translation dictionary used by the EN / عربي switch.
const translations = {
  en: {
    navAnalyze: "Analyze",
    navHow: "How it works",
    navPerformance: "Performance",
    navSignIn: "Sign in",
    heroEyebrow: "CUSTOMER RETENTION INTELLIGENCE",
    heroTitle: "Understand churn risk before customers leave.",
    heroText: "ChurnSense helps teams identify higher-risk customers earlier and support more informed retention decisions.",
    heroPrimary: "Analyze a customer",
    heroSecondary: "See how it works",
    insightLabel: "RISK INTELLIGENCE",
    insightReady: "Ready",
    insightOneTitle: "Identify risk",
    insightOneText: "Assess churn likelihood from customer information.",
    insightTwoTitle: "Support action",
    insightTwoText: "Surface higher-risk customers earlier.",
    analysisEyebrow: "CUSTOMER RISK ANALYSIS",
    analysisTitle: "Assess a customer in three quick steps.",
    analysisText: "Enter account, service, and billing information to estimate churn risk.",
    stepCustomer: "Customer",
    stepServices: "Services",
    stepBilling: "Billing",
    stepOneKicker: "STEP 01",
    customerTitle: "Customer information",
    customerText: "Basic account and relationship details.",
    genderLabel: "Gender",
    seniorLabel: "Senior citizen",
    partnerLabel: "Partner",
    dependentsLabel: "Dependents",
    tenureLabel: "Tenure (months)",
    selectOption: "Select",
    femaleOption: "Female",
    maleOption: "Male",
    yesOption: "Yes",
    noOption: "No",
    continueButton: "Continue",
    backButton: "Back",
    stepTwoKicker: "STEP 02",
    servicesTitle: "Services",
    servicesText: "Phone, internet, and add-on service details.",
    phoneLabel: "Phone service",
    linesLabel: "Multiple lines",
    noPhoneOption: "No phone service",
    internetLabel: "Internet service",
    fiberOption: "Fiber optic",
    securityLabel: "Online security",
    noInternetOption: "No internet service",
    backupLabel: "Online backup",
    protectionLabel: "Device protection",
    supportLabel: "Tech support",
    tvLabel: "Streaming TV",
    moviesLabel: "Streaming movies",
    stepThreeKicker: "STEP 03",
    billingTitle: "Contract & billing",
    billingText: "Payment and account charge information.",
    contractLabel: "Contract",
    monthlyOption: "Month-to-month",
    oneYearOption: "One year",
    twoYearOption: "Two year",
    paperlessLabel: "Paperless billing",
    paymentLabel: "Payment method",
    electronicCheckOption: "Electronic check",
    mailedCheckOption: "Mailed check",
    bankTransferOption: "Bank transfer (automatic)",
    creditCardOption: "Credit card (automatic)",
    monthlyChargesLabel: "Monthly charges",
    totalChargesLabel: "Total charges",
    analyzeButton: "Analyze churn risk",
    resultLabel: "RISK ASSESSMENT",
    resultReady: "Ready",
    resultEmptyTitle: "Ready to analyze",
    resultEmptyText: "Complete the three steps to generate a customer churn risk score.",
    scoreCaption: "churn risk",
    analyzeAnother: "Analyze another customer",
    howEyebrow: "HOW CHURNSENSE WORKS",
    howTitle: "A simple path from customer data to retention insight.",
    workflowOneTitle: "Customer data",
    workflowOneText: "Account, service, and billing information is prepared for analysis.",
    workflowTwoTitle: "Risk analysis",
    workflowTwoText: "The system evaluates the customer using the prediction model.",
    workflowThreeTitle: "Churn score",
    workflowThreeText: "A churn risk score is returned in a clear, decision-friendly format.",
    workflowFourTitle: "Retention support",
    workflowFourText: "Teams can use the result to prioritize earlier retention follow-up.",
    performanceEyebrow: "PREDICTION PERFORMANCE",
    performanceTitle: "A focused view of model quality.",
    performanceText: "Evaluation results from the held-out test set.",
    accuracyLabel: "Accuracy",
    recallLabel: "Recall",
    precisionLabel: "Precision",
    f1Label: "F1 score",
    footerTagline: "Customer retention intelligence.",
    higherRisk: "Higher churn risk",
    lowerRisk: "Lower churn risk",
    higherStatus: "Higher risk",
    lowerStatus: "Lower risk",
    higherDescription: "This customer shows a higher likelihood of churn based on the available account and service information.",
    lowerDescription: "This customer shows a lower likelihood of churn based on the available account and service information.",
    runningStatus: "Analyzing",
    unavailableStatus: "Unavailable",
    unavailableTitle: "Prediction unavailable",
    unavailableText: "The prediction service could not be reached. Make sure the local API is running.",
    validationMessage: "Please complete the required fields in this step before continuing."
  },

  ar: {
    navAnalyze: "تحليل عميل",
    navHow: "كيف يعمل",
    navPerformance: "الأداء",
    navSignIn: "تسجيل الدخول",
    heroEyebrow: "ذكاء الاحتفاظ بالعملاء",
    heroTitle: "افهم خطر فقد العميل قبل ما يغادر.",
    heroText: "يساعد ChurnSense الفرق على اكتشاف العملاء الأعلى عرضة للمغادرة مبكرًا ودعم قرارات احتفاظ أكثر وعيًا.",
    heroPrimary: "حلّل عميل",
    heroSecondary: "كيف يعمل النظام",
    insightLabel: "تحليل مخاطر العملاء",
    insightReady: "جاهز",
    insightOneTitle: "تحديد الخطر",
    insightOneText: "تقدير احتمالية مغادرة العميل من خلال بياناته.",
    insightTwoTitle: "دعم القرار",
    insightTwoText: "إبراز العملاء الأعلى خطورة بشكل مبكر.",
    analysisEyebrow: "تحليل مخاطر العميل",
    analysisTitle: "حلّل العميل بثلاث خطوات سريعة.",
    analysisText: "أدخل معلومات الحساب والخدمات والفوترة لتقدير خطر مغادرة العميل.",
    stepCustomer: "العميل",
    stepServices: "الخدمات",
    stepBilling: "الفوترة",
    stepOneKicker: "الخطوة 01",
    customerTitle: "معلومات العميل",
    customerText: "معلومات أساسية عن الحساب والعلاقة.",
    genderLabel: "الجنس",
    seniorLabel: "كبير سن",
    partnerLabel: "لديه شريك",
    dependentsLabel: "لديه معالون",
    tenureLabel: "مدة الاشتراك (بالأشهر)",
    selectOption: "اختر",
    femaleOption: "أنثى",
    maleOption: "ذكر",
    yesOption: "نعم",
    noOption: "لا",
    continueButton: "متابعة",
    backButton: "رجوع",
    stepTwoKicker: "الخطوة 02",
    servicesTitle: "الخدمات",
    servicesText: "تفاصيل الهاتف والإنترنت والخدمات الإضافية.",
    phoneLabel: "خدمة الهاتف",
    linesLabel: "خطوط متعددة",
    noPhoneOption: "لا توجد خدمة هاتف",
    internetLabel: "خدمة الإنترنت",
    fiberOption: "ألياف بصرية",
    securityLabel: "الحماية عبر الإنترنت",
    noInternetOption: "لا توجد خدمة إنترنت",
    backupLabel: "النسخ الاحتياطي عبر الإنترنت",
    protectionLabel: "حماية الجهاز",
    supportLabel: "الدعم الفني",
    tvLabel: "بث التلفزيون",
    moviesLabel: "بث الأفلام",
    stepThreeKicker: "الخطوة 03",
    billingTitle: "العقد والفوترة",
    billingText: "معلومات الدفع والرسوم الخاصة بالحساب.",
    contractLabel: "العقد",
    monthlyOption: "شهري",
    oneYearOption: "سنة واحدة",
    twoYearOption: "سنتان",
    paperlessLabel: "فوترة إلكترونية",
    paymentLabel: "طريقة الدفع",
    electronicCheckOption: "شيك إلكتروني",
    mailedCheckOption: "شيك بريدي",
    bankTransferOption: "تحويل بنكي تلقائي",
    creditCardOption: "بطاقة ائتمانية تلقائية",
    monthlyChargesLabel: "الرسوم الشهرية",
    totalChargesLabel: "إجمالي الرسوم",
    analyzeButton: "تحليل خطر المغادرة",
    resultLabel: "تقييم المخاطر",
    resultReady: "جاهز",
    resultEmptyTitle: "جاهز للتحليل",
    resultEmptyText: "أكمل الخطوات الثلاث للحصول على درجة خطر مغادرة العميل.",
    scoreCaption: "خطر المغادرة",
    analyzeAnother: "تحليل عميل آخر",
    howEyebrow: "كيف يعمل CHURNSENSE",
    howTitle: "مسار بسيط من بيانات العميل إلى معلومات تساعد على القرار.",
    workflowOneTitle: "بيانات العميل",
    workflowOneText: "تُجهز معلومات الحساب والخدمات والفوترة للتحليل.",
    workflowTwoTitle: "تحليل المخاطر",
    workflowTwoText: "يقيّم النظام بيانات العميل باستخدام نموذج التنبؤ.",
    workflowThreeTitle: "درجة المغادرة",
    workflowThreeText: "يعرض النظام درجة خطر واضحة وسهلة للاستخدام في القرار.",
    workflowFourTitle: "دعم الاحتفاظ",
    workflowFourText: "تساعد النتيجة الفرق على إعطاء أولوية للعملاء الأعلى خطورة.",
    performanceEyebrow: "أداء التنبؤ",
    performanceTitle: "نظرة مركزة على جودة النموذج.",
    performanceText: "نتائج التقييم على مجموعة الاختبار المنفصلة.",
    accuracyLabel: "الدقة العامة",
    recallLabel: "الاستدعاء",
    precisionLabel: "الدقة الإيجابية",
    f1Label: "درجة F1",
    footerTagline: "ذكاء الاحتفاظ بالعملاء.",
    higherRisk: "خطر مغادرة أعلى",
    lowerRisk: "خطر مغادرة أقل",
    higherStatus: "خطر أعلى",
    lowerStatus: "خطر أقل",
    higherDescription: "تشير بيانات الحساب والخدمات المتاحة إلى احتمالية أعلى لمغادرة هذا العميل.",
    lowerDescription: "تشير بيانات الحساب والخدمات المتاحة إلى احتمالية أقل لمغادرة هذا العميل.",
    runningStatus: "جاري التحليل",
    unavailableStatus: "غير متاح",
    unavailableTitle: "تعذر إجراء التنبؤ",
    unavailableText: "تعذر الوصول إلى خدمة التنبؤ. تأكدي من تشغيل الـ API المحلي.",
    validationMessage: "أكملي الحقول المطلوبة في هذه الخطوة قبل المتابعة."
  }
};

// Return the translation object for the active language.
function t() {
  return translations[currentLanguage];
}

// Update every element that has a data-i18n key.
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;

    if (t()[key]) {
      element.textContent = t()[key];
    }
  });

  // Switch the document language for accessibility and browser behavior.
  document.documentElement.lang = currentLanguage;

  // Arabic reads right-to-left; English reads left-to-right.
  document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";

  // Show the opposite language on the toggle button.
  languageToggle.textContent = currentLanguage === "en" ? "عربي" : "EN";
}

// Show one form step and hide the others.
function showStep(stepNumber) {
  formSteps.forEach((step) => {
    step.classList.toggle("active", Number(step.dataset.step) === stepNumber);
  });

  stepTabs.forEach((tab) => {
    tab.classList.toggle("active", Number(tab.dataset.stepTarget) === stepNumber);
  });
}

// Check the required fields inside one step before moving forward.
function validateStep(stepNumber) {
  const currentStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
  const requiredFields = [...currentStep.querySelectorAll("[required]")];

  for (const field of requiredFields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }

  return true;
}

// Move forward only if the current step is complete.
nextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const currentStep = Number(button.closest(".form-step").dataset.step);
    const nextStep = Number(button.dataset.next);

    if (validateStep(currentStep)) {
      showStep(nextStep);
    }
  });
});

// Allow the user to move backward without validation.
previousButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showStep(Number(button.dataset.previous));
  });
});

// Allow completed step tabs to be used as simple navigation.
stepTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    showStep(Number(tab.dataset.stepTarget));
  });
});

// Switch between English and Arabic.
languageToggle.addEventListener("click", () => {
  currentLanguage = currentLanguage === "en" ? "ar" : "en";
  applyTranslations();
});

// Reset the form and return to the first step.
resetAnalysis.addEventListener("click", () => {
  form.reset();
  showStep(1);

  resultContent.classList.add("hidden");
  resultEmpty.classList.remove("hidden");

  resultStatus.className = "result-status neutral";
  resultStatus.textContent = t().resultReady;

  probabilityValue.textContent = "0.0%";
  probabilityBar.style.width = "0%";
});

// Send the completed customer profile to the Flask API.
form.addEventListener("submit", async (event) => {
  // Stop the browser from reloading the page.
  event.preventDefault();

  // Validate the final step before sending data.
  if (!validateStep(3)) {
    return;
  }

  // Collect every form field into a FormData object.
  const formData = new FormData(form);

  // Convert the form data into a normal JavaScript object.
  const customer = Object.fromEntries(formData.entries());

  // HTML form values arrive as strings, so convert numeric fields to numbers.
  customer.SeniorCitizen = Number(customer.SeniorCitizen);
  customer.tenure = Number(customer.tenure);
  customer.MonthlyCharges = Number(customer.MonthlyCharges);
  customer.TotalCharges = Number(customer.TotalCharges);

  // Show a temporary loading state while the API is working.
  resultEmpty.classList.add("hidden");
  resultContent.classList.remove("hidden");
  resultStatus.className = "result-status neutral";
  resultStatus.textContent = t().runningStatus;
  riskLabel.textContent = t().runningStatus;
  probabilityValue.textContent = "…";
  probabilityBar.style.width = "0%";
  resultDescription.textContent = "";

  try {
    // Send the customer data to the prediction endpoint as JSON.
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(customer)
    });

    // Stop and show an error if the API responds with a failure status.
    if (!response.ok) {
      throw new Error("Prediction request failed.");
    }

    // Convert the API JSON response into a JavaScript object.
    const result = await response.json();

    // Convert the model probability from 0-1 into a percentage.
    const probabilityPercent = Number(result.churn_probability) * 100;

    // The Flask API returns Yes when the customer is classified as churn risk.
    const isHigherRisk = result.prediction === "Yes";

    // Update the risk label in the selected language.
    riskLabel.textContent = isHigherRisk ? t().higherRisk : t().lowerRisk;

    // Update the status pill and its visual state.
    resultStatus.textContent = isHigherRisk ? t().higherStatus : t().lowerStatus;
    resultStatus.className = `result-status ${isHigherRisk ? "high" : "low"}`;

    // Display the probability with one decimal place.
    probabilityValue.textContent = `${probabilityPercent.toFixed(1)}%`;

    // Fill the risk bar to match the probability value.
    probabilityBar.style.width = `${Math.min(probabilityPercent, 100)}%`;

    // Use a warm color for higher risk and teal for lower risk.
    probabilityBar.style.background = isHigherRisk ? "var(--risk-high)" : "var(--brand)";

    // Explain the result without exposing implementation details like thresholds.
    resultDescription.textContent = isHigherRisk ? t().higherDescription : t().lowerDescription;
  } catch (error) {
    // Show a clear user-facing message if the API cannot be reached.
    resultStatus.textContent = t().unavailableStatus;
    resultStatus.className = "result-status high";
    riskLabel.textContent = t().unavailableTitle;
    probabilityValue.textContent = "—";
    probabilityBar.style.width = "0%";
    resultDescription.textContent = t().unavailableText;
  }
});

// Apply English text when the page first loads.
applyTranslations();

// Start the form on step one.
showStep(1);
