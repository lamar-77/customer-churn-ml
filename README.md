# ChurnSense

**ChurnSense** is an end-to-end machine learning application for customer churn risk analysis.

It combines a trained machine learning model with a Flask backend, a bilingual user interface, authentication, role-based access control, a shared Supabase database, prediction history, and an interactive risk simulator.

> **Current version:** Local Flask application connected to a shared online Supabase database.

---

## About the Project

Customer churn is an important business problem for subscription-based companies. Identifying customers who are more likely to leave can help retention teams take action earlier.

ChurnSense analyzes customer account, service, and billing information and estimates the probability that a customer may churn.

The project covers the complete machine learning workflow:

**Data Preparation → Model Training → Evaluation → Threshold Tuning → API Integration → Web Application → Authentication → Shared Database**

---

## Main Features

- Customer churn probability prediction
- Real trained machine learning model
- English and Arabic interface
- RTL support for Arabic
- Multi-step customer analysis form
- Flask backend API
- Shared Supabase database
- Supabase Authentication
- Email-based user registration
- Login and logout system
- Role-Based Access Control (RBAC)
- Admin user management
- Customer prediction history
- Dashboard statistics
- Customer risk simulator
- User profile and settings
- Responsive web interface
- Local machine learning inference

---

## User Roles

ChurnSense uses a Role-Based Access Control system.

Every new account is created with the **User** role by default. Higher-level roles can only be assigned by an administrator.

| Role | Access |
| --- | --- |
| **User** | Overview, customer analysis, profile, and settings |
| **Analyst** | User access + customer records, analytics, and Risk Simulator |
| **Manager** | Extended access to customer records and analytics |
| **Admin** | Full access + user management and role assignment |

Users cannot assign themselves privileged roles such as Admin or Manager.

---

# Machine Learning

## Dataset

The model was developed using the **IBM Telco Customer Churn** dataset.

The dataset contains customer information such as:

- Customer tenure
- Contract type
- Internet service
- Online security
- Technical support
- Payment method
- Monthly charges
- Total charges
- Streaming services
- Partner and dependent information
- Churn status

---

## Data Preparation

The original dataset contained:

**7,043 customers**

After cleaning:

**7,032 customers**

Main preprocessing steps:

- Converted `TotalCharges` from text to numeric
- Removed rows with missing `TotalCharges`
- Removed `customerID` from model features
- Separated features from the target variable
- Used a stratified 80/20 train-test split
- Identified categorical and numerical features
- Applied One-Hot Encoding to categorical features
- Fitted the encoder only on training data to avoid data leakage
- Used the same fitted encoder for test and application data
- Preserved the exact feature order used during training

Final model input:

**45 features**

---

## Models Compared

Three classification models were trained and evaluated:

1. Logistic Regression
2. Random Forest
3. Gradient Boosting

### Initial Results

| Model | Accuracy | Recall | Precision | F1 Score |
| --- | ---: | ---: | ---: | ---: |
| Logistic Regression | 81.66% | 56.68% | 68.83% | 62.17% |
| Random Forest | 79.67% | 52.67% | 64.38% | 58.68% |
| Gradient Boosting | 81.17% | 56.15% | 67.52% | 61.31% |

Logistic Regression produced the strongest overall result in this experiment and was selected as the final model.

---

## Cross-Validation

5-fold cross-validation was performed on the training data.

The evaluation focused on:

- Recall
- F1 Score

Average cross-validation results:

| Metric | Result |
| --- | ---: |
| Recall | 53.78% |
| F1 Score | 58.80% |

Cross-validation was used to evaluate whether model performance remained reasonably consistent across different parts of the training data.

---

# Threshold Tuning

The default classification threshold for binary classification is typically:

```text
0.50
```

However, in customer churn prediction, missing an actual churn customer can be more important than incorrectly flagging a customer who may stay.

For this reason, different thresholds were evaluated.

| Threshold | Accuracy | Recall | Precision | F1 Score | False Negatives |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0.50 | 81.66% | 56.68% | 68.83% | 62.17% | 162 |
| 0.45 | 81.02% | 61.50% | 65.16% | 63.27% | 144 |
| 0.40 | 79.60% | 65.78% | 60.74% | 63.16% | 128 |

The final threshold was selected as:

```text
0.40
```

This decision prioritizes **Recall** and reduces the number of missed churn customers.

Lowering the threshold from `0.50` to `0.40` reduced false negatives from:

```text
162 → 128
```

while accepting an increase in false positives.

---

# Final Model Performance

The final model is:

**Logistic Regression with a 0.40 decision threshold**

Final test results:

| Metric | Result |
| --- | ---: |
| Accuracy | 79.60% |
| Recall | 65.78% |
| Precision | 60.74% |
| F1 Score | 63.16% |

Final confusion matrix:

```text
True Negatives  = 874
False Positives = 159
False Negatives = 128
True Positives  = 246
```

---

# Model Visualizations

## Performance Metrics

![Model Performance](images/metrics_bar_chart.png)

## Threshold Comparison

![Threshold Comparison](images/threshold_comparison.png)

## Confusion Matrix

![Confusion Matrix](images/confusion_matrix.png)

---

# How ChurnSense Works

The application follows this flow:

```text
Customer Information
        ↓
Flask Backend
        ↓
Saved One-Hot Encoder
        ↓
45 Model Features
        ↓
Logistic Regression Model
        ↓
Churn Probability
        ↓
Threshold = 0.40
        ↓
Risk Prediction
        ↓
Result Displayed to User
```

The frontend sends the customer information to the Flask backend.

The backend then:

1. Validates the required customer fields
2. Converts numerical inputs to the correct data types
3. Uses the saved fitted encoder for categorical features
4. Recreates the exact 45-feature structure used during training
5. Loads the trained Logistic Regression model
6. Calculates the churn probability using `predict_proba()`
7. Applies the final `0.40` threshold
8. Returns the prediction to the frontend

---

# Application Architecture

```text
                 ┌──────────────────────┐
                 │      ChurnSense      │
                 │       Frontend       │
                 │ HTML / CSS / JS      │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    Flask Backend     │
                 │       Python         │
                 └───────┬──────┬───────┘
                         │      │
              ┌──────────┘      └──────────┐
              ▼                            ▼
     ┌─────────────────┐         ┌─────────────────┐
     │ Machine Learning│         │    Supabase     │
     │      Model      │         │                 │
     │                 │         │ Authentication  │
     │ Logistic        │         │ PostgreSQL      │
     │ Regression      │         │ User Roles      │
     └────────┬────────┘         │ Predictions     │
              │                  │ Settings        │
              ▼                  └─────────────────┘
     Churn Probability
              │
              ▼
        Risk Prediction
```

---

# Shared Database

ChurnSense uses **Supabase PostgreSQL** as a shared online database.

This means different users can use ChurnSense from different devices while their accounts and application records are stored in the same database.

The shared database stores:

- User profiles
- User roles
- User settings
- Prediction history
- Customer references
- Prediction probabilities
- Prediction results

Passwords are **not stored manually by ChurnSense**.

Authentication and password management are handled by **Supabase Authentication**.

---

# Authentication

ChurnSense includes:

- Account registration
- Email authentication
- Login
- Logout
- User sessions
- User profile information

Supabase Authentication manages user identity and passwords.

---

# Role-Based Access Control

The application uses RBAC to control what each user can access.

For example:

```text
User
├── Overview
├── Analyze Customer
├── Profile
└── Settings
```

```text
Analyst
├── User Features
├── Customer Records
├── Analytics
└── Risk Simulator
```

```text
Manager
├── Customer Records
├── Analytics
└── Extended Business Access
```

```text
Admin
├── Full Application Access
├── User Management
└── Role Assignment
```

Admin permissions are protected in both the frontend and backend.

Hiding an Admin button is not considered sufficient security. Backend authorization checks are also used to prevent unauthorized access.

---

# Admin User Management

Administrators can:

- View registered users
- View user email addresses
- View current roles
- Change user roles
- Assign Analyst roles
- Assign Manager roles
- Assign Admin roles

New users receive the following role automatically:

```text
user
```

Users cannot select privileged roles during registration.

---

# Risk Simulator

ChurnSense includes an interactive **Risk Simulator**.

The simulator allows selected customer information to be modified and sends the updated data through the same trained model again.

Example:

```text
Current prediction:
Churn Risk = 68%

Simulated customer:
Contract: Month-to-month → One year

New prediction:
Churn Risk = 49%
```

The simulator is intended for scenario exploration.

> The Risk Simulator provides a predictive comparison, not a causal conclusion. A change in predicted churn probability does not prove that changing one customer feature will directly cause churn risk to change.

---

# Bilingual Interface

ChurnSense supports:

- English
- Arabic

The Arabic interface also supports:

```text
RTL — Right-to-Left layout
```

The language can be changed from the application interface.

---

# Tech Stack

## Machine Learning

- Python
- pandas
- NumPy
- scikit-learn
- Matplotlib
- Jupyter Notebook
- joblib

## Backend

- Flask
- Python
- python-dotenv
- Supabase Python client

## Frontend

- HTML
- CSS
- JavaScript

## Database

- Supabase PostgreSQL

## Authentication

- Supabase Authentication

## Security

- Row Level Security (RLS)
- Role-Based Access Control
- Environment variables
- Backend authorization checks

## Development Tools

- Visual Studio Code
- Git
- GitHub

---

# Project Structure

```text
customer-churn-ml/
│
├── api/
│   ├── __init__.py
│   └── app.py
│
├── models/
│   ├── churn_model.pkl
│   ├── encoder.pkl
│   └── model_config.pkl
│
├── website/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── style.css
│   ├── script.js
│   ├── login.js
│   └── dashboard.js
│
├── supabase/
│   ├── 01_setup.sql
│   └── 02_make_first_admin.sql
│
├── images/
│   ├── metrics_bar_chart.png
│   ├── threshold_comparison.png
│   └── confusion_matrix.png
│
├── database/
│   └── .gitkeep
│
├── churn_analysis.ipynb
├── requirements.txt
├── .env.example
├── .gitignore
├── Procfile
└── README.md
```

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/lamar-77/customer-churn-ml.git
```

Move into the project:

```bash
cd customer-churn-ml
```

---

## 2. Create a Virtual Environment

```bash
python -m venv .venv
```

### Windows

Activate it using:

```bash
.venv\Scripts\activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

# Supabase Setup

Create a Supabase project.

Then open the Supabase SQL Editor and run:

```text
supabase/01_setup.sql
```

This creates the database structure, security policies, role system, and required functions for ChurnSense.

---

# Environment Variables

Copy:

```text
.env.example
```

and create:

```text
.env
```

Add your Supabase values:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CHURNSENSE_SECRET_KEY=
CHURNSENSE_DEBUG=1
```

Never commit `.env` to GitHub.

The repository only includes:

```text
.env.example
```

which contains placeholders and no private project credentials.

---

# Authentication URL Configuration

For local development, configure the Supabase Authentication Site URL as:

```text
http://127.0.0.1:5000
```

A local redirect URL can also be added for development.

---

# Run the Application

Start ChurnSense using:

```bash
python api/app.py
```

Then open:

```text
http://127.0.0.1:5000
```

---

# Create the First Admin

After registering the first account, open:

```text
supabase/02_make_first_admin.sql
```

Replace the email placeholder with the account email.

Run the query inside Supabase SQL Editor.

Then:

```text
Logout
↓
Login again
↓
Admin role becomes active
```

---

# Security

ChurnSense includes several security measures:

- Passwords are handled by Supabase Authentication
- Passwords are not stored manually in the application database
- New users cannot assign themselves privileged roles
- Admin-only operations require authorization
- Row Level Security protects database records
- The `.env` file is excluded from Git
- Sensitive configuration values are stored through environment variables
- Secret and service-role keys are not included in the client application
- The application uses the Supabase Publishable Key rather than a secret database key

---

# Git Ignore

The project excludes local and sensitive files such as:

```gitignore
.venv/
.ipynb_checkpoints/
data/
.env
__pycache__/
*.pyc
database/*.db
```

This prevents local datasets, virtual environments, secrets, and temporary files from being uploaded to GitHub.

---

# Current Project Status

### Machine Learning

- Data cleaning ✅
- Exploratory analysis ✅
- Feature preparation ✅
- Logistic Regression ✅
- Random Forest ✅
- Gradient Boosting ✅
- Model comparison ✅
- Cross-validation ✅
- Threshold tuning ✅
- Model serialization ✅

### Application

- Flask backend ✅
- Prediction API ✅
- Bilingual frontend ✅
- Responsive design ✅
- Customer analysis form ✅
- Risk result interface ✅
- Risk Simulator ✅

### Accounts and Database

- Supabase integration ✅
- Shared PostgreSQL database ✅
- User registration ✅
- Login / Logout ✅
- User roles ✅
- Admin management ✅
- Prediction history ✅
- User settings ✅

### Current Development Note

Email confirmation redirect handling for the local application is still being refined.

---

# Future Improvements

Possible future improvements include:

- Improve email confirmation redirect handling
- Package ChurnSense as a simple Windows application
- Add richer customer-level model explanations
- Add additional analytics visualizations
- Add automated backend tests
- Add automated frontend tests
- Improve accessibility
- Add production deployment if needed
- Explore additional models and hyperparameter tuning

---

# Project Goal

The goal of ChurnSense is not only to train a machine learning model, but to demonstrate how a model can be integrated into a usable application.

The project combines:

```text
Machine Learning
       +
Backend Development
       +
Frontend Development
       +
Authentication
       +
Database Integration
       +
User Experience
```

into one end-to-end application.

---

# Author

**Lamar Almutairi**

Computer Science Graduate  
Princess Nourah bint Abdulrahman University

Interested in:

- Artificial Intelligence
- Machine Learning
- Applied AI Systems
- Data-driven applications

---

## Repository

**GitHub:** `lamar-77/customer-churn-ml`

---

## Disclaimer

ChurnSense is an educational machine learning project.

Predictions are generated from patterns learned from the training dataset and should not be interpreted as guaranteed future customer behavior or causal business conclusions.