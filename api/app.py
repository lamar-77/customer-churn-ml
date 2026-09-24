# Import Flask tools for the local web app, API routes, sessions, and static pages.
from flask import Flask, request, jsonify, session, send_from_directory, redirect, g

# Import joblib to load the saved machine-learning files.
import joblib

# Import pandas to rebuild the model input as a DataFrame.
import pandas as pd

# Import Supabase so all installed copies of ChurnSense can share one online database.
from supabase import create_client

# Import dotenv so local Supabase settings can be read from a .env file.
from dotenv import load_dotenv

# Import wraps so permission decorators keep the original route metadata.
from functools import wraps

# Import operating-system helpers for paths and environment variables.
import os

# Import secrets so the local Flask session gets a safe random fallback key.
import secrets


# Load values from a local .env file when it exists.
load_dotenv()

# Find the main project folder.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Point to the website folder that Flask serves.
WEBSITE_DIR = os.path.join(BASE_DIR, "website")

# Point to the folder that contains the trained model files.
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Read the shared Supabase project settings.
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_PUBLISHABLE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "").strip()

# Stop early with a clear message if the shared database is not configured yet.
if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
    raise RuntimeError(
        "Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to your .env file."
    )

# Create the Flask app and tell it where the frontend files live.
app = Flask(__name__, static_folder=WEBSITE_DIR, static_url_path="")

# Use a user-provided key when available, otherwise create a safe local key for this run.
app.secret_key = os.environ.get("CHURNSENSE_SECRET_KEY") or secrets.token_hex(32)

# Protect the local session cookie from JavaScript and cross-site form requests.
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=True,
)


# Load the trained Logistic Regression model once when the local app starts.
model = joblib.load(os.path.join(MODELS_DIR, "churn_model.pkl"))

# Load the exact fitted encoder used during training.
encoder = joblib.load(os.path.join(MODELS_DIR, "encoder.pkl"))

# Load the saved model configuration.
model_config = joblib.load(os.path.join(MODELS_DIR, "model_config.pkl"))

# Read the final decision threshold from the configuration file.
threshold = float(model_config["threshold"])

# Read the final feature order used during model training.
feature_names = list(model_config["feature_names"])

# Keep the categorical columns in the exact same groups used during training.
categorical_cols = [
    "gender",
    "Partner",
    "Dependents",
    "PhoneService",
    "MultipleLines",
    "InternetService",
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "StreamingTV",
    "StreamingMovies",
    "Contract",
    "PaperlessBilling",
    "PaymentMethod",
]

# Keep the numerical columns in the same order used during training.
numerical_cols = [
    "SeniorCitizen",
    "tenure",
    "MonthlyCharges",
    "TotalCharges",
]

# Keep one complete list so incoming customer data can be validated.
required_model_fields = categorical_cols + numerical_cols

# Keep the roles in one place so validation stays consistent across the app.
VALID_ROLES = {"user", "analyst", "manager", "admin"}

# Map each role to the features it is allowed to use.
ROLE_PERMISSIONS = {
    "user": {"overview", "analyze", "profile", "settings"},
    "analyst": {"overview", "analyze", "records", "analytics", "simulator", "profile", "settings"},
    "manager": {"overview", "analyze", "records", "analytics", "profile", "settings"},
    "admin": {"overview", "analyze", "records", "analytics", "simulator", "profile", "settings", "admin", "users_manage"},
}


# Create a fresh public Supabase client.
# The publishable key is safe for a desktop/local app because database access is protected by RLS.
def new_supabase_client():
    return create_client(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)


# Save a Supabase login session inside the local Flask session.
def save_auth_session(auth_response):
    auth_session = getattr(auth_response, "session", None)
    auth_user = getattr(auth_response, "user", None)

    if auth_session is None or auth_user is None:
        return False

    # Store only the current user's tokens and ID.
    session["sb_access_token"] = auth_session.access_token
    session["sb_refresh_token"] = auth_session.refresh_token
    session["user_id"] = str(auth_user.id)
    return True


# Clear authentication values from the local session.
def clear_auth_session():
    session.pop("sb_access_token", None)
    session.pop("sb_refresh_token", None)
    session.pop("user_id", None)
    session.pop("role", None)


# Build an authenticated Supabase client for the current local user.
def current_supabase_client():
    # Reuse one authenticated client during the same Flask request.
    if hasattr(g, "supabase_client"):
        return g.supabase_client

    # Read the user's saved Supabase tokens.
    access_token = session.get("sb_access_token")
    refresh_token = session.get("sb_refresh_token")

    # No tokens means there is no signed-in shared account.
    if not access_token or not refresh_token:
        return None

    # Create a client using only the public project key.
    client = new_supabase_client()

    try:
        # Restore the user's Supabase session.
        # Supabase can refresh an expired access token by using the refresh token.
        auth_response = client.auth.set_session(access_token, refresh_token)

        # Keep refreshed tokens synchronized with the local Flask session.
        if getattr(auth_response, "session", None) is not None:
            session["sb_access_token"] = auth_response.session.access_token
            session["sb_refresh_token"] = auth_response.session.refresh_token

        # Keep the authenticated user ID synchronized too.
        if getattr(auth_response, "user", None) is not None:
            session["user_id"] = str(auth_response.user.id)

        # Cache the ready client for the rest of this request.
        g.supabase_client = client
        return client

    except Exception:
        # Invalid or revoked tokens should behave like a normal logout.
        clear_auth_session()
        return None


# Return the logged-in Supabase user ID, or None when there is no active session.
def current_user_id():
    return session.get("user_id")


# Read the current user's live profile from the shared database.
def current_user_record():
    # Reuse the profile if another permission check already loaded it this request.
    if hasattr(g, "current_profile"):
        return g.current_profile

    # A valid Supabase session is required before reading protected data.
    client = current_supabase_client()
    user_id = current_user_id()
    if client is None or user_id is None:
        return None

    try:
        # RLS allows a user to read only their own profile directly.
        response = (
            client.table("profiles")
            .select("id,name,email,organization,job_title,role,created_at")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        # ternary expression
        profile = response.data[0] if response.data else None

        # Cache the profile for the rest of this request.
        g.current_profile = profile

        # Keep the role available for display only; permissions still use the live profile.
        if profile:
            session["role"] = profile["role"]

        return profile
    except Exception:
        return None


# Check whether the current local session belongs to a real shared account.
def is_logged_in():
    return current_user_record() is not None


# Check whether the current user has one of the allowed roles.
def has_role(*allowed_roles):
    user = current_user_record()
    return user is not None and user["role"] in allowed_roles


# Check whether the current user's role contains one named permission.
def has_permission(permission):
    user = current_user_record()
    if user is None:
        return False
    return permission in ROLE_PERMISSIONS.get(user["role"], set())


# Reusable API guard for endpoints that require a logged-in account (Decorator)
def login_required(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        if not is_logged_in():
            return jsonify({"error": "Authentication required."}), 401
        return function(*args, **kwargs)
    return wrapped


# Reusable API guard for role-based feature permissions.
def permission_required(permission):
    def decorator(function):
        @wraps(function)
        def wrapped(*args, **kwargs):
            if not is_logged_in():
                return jsonify({"error": "Authentication required."}), 401
            if not has_permission(permission):
                return jsonify({"error": "You do not have permission to use this feature."}), 403
            return function(*args, **kwargs)
        return wrapped
    return decorator


# Convert one raw customer dictionary into the exact 45-feature model input.
def prepare_customer(customer_data):
    # Check that every feature required by the model was sent.
    missing_fields = [field for field in required_model_fields if field not in customer_data]

    # Stop early when required values are missing.
    if missing_fields:
        raise ValueError("Missing required fields: " + ", ".join(missing_fields))

    # Make a clean copy so the original request dictionary is not modified.
    clean_customer = dict(customer_data)

    # Convert numerical fields to real numbers.
    clean_customer["SeniorCitizen"] = int(clean_customer["SeniorCitizen"])
    clean_customer["tenure"] = float(clean_customer["tenure"])
    clean_customer["MonthlyCharges"] = float(clean_customer["MonthlyCharges"])
    clean_customer["TotalCharges"] = float(clean_customer["TotalCharges"])

    # Put the customer into a one-row DataFrame.
    customer_df = pd.DataFrame([clean_customer])

    # Transform only categorical fields using the saved fitted encoder.
    encoded_data = encoder.transform(customer_df[categorical_cols])

    # Get the same encoded column names created during training.
    encoded_names = encoder.get_feature_names_out(categorical_cols)

    # Convert the encoded array back into a labeled DataFrame.
    encoded_df = pd.DataFrame(encoded_data, columns=encoded_names)

    # Keep untouched numerical values in a one-row DataFrame.
    numerical_df = customer_df[numerical_cols].reset_index(drop=True)

    # Join numerical and encoded features side by side.
    customer_ready = pd.concat(
        [numerical_df, encoded_df.reset_index(drop=True)],
        axis=1,
    )

    # Force final columns into the exact order used by the trained model.
    customer_ready = customer_ready[feature_names]

    # Return both versions: clean raw data and final model-ready data.
    return clean_customer, customer_ready


# Run one prediction and return both label and probability.
def run_prediction(customer_data):
    # Prepare the raw customer exactly like the training data.
    clean_customer, customer_ready = prepare_customer(customer_data)

    # Find which probability column belongs to the positive churn class.
    yes_index = list(model.classes_).index("Yes")

    # Get the customer's churn probability.
    churn_probability = float(model.predict_proba(customer_ready)[0][yes_index])

    # Apply the chosen business threshold.
    prediction = "Yes" if churn_probability >= threshold else "No"

    # Return everything needed by the API and shared database.
    return clean_customer, churn_probability, prediction


# Serve the public landing page.
@app.route("/")
def home_page():
    return send_from_directory(WEBSITE_DIR, "index.html")


# Serve the login page.
@app.route("/login")
def login_page():
    # Send a valid signed-in user directly to the dashboard.
    if is_logged_in():
        return redirect("/dashboard")

    # Clear stale local authentication values.
    if current_user_id() is not None:
        clear_auth_session()

    return send_from_directory(WEBSITE_DIR, "login.html")


# Serve the dashboard page.
@app.route("/dashboard")
def dashboard_page():
    # Protect the dashboard itself, not only its API calls.
    if not is_logged_in():
        return redirect("/login")
    return send_from_directory(WEBSITE_DIR, "dashboard.html")


# Create a new shared Supabase account.
@app.route("/api/register", methods=["POST"])
def register():
    # Read the submitted JSON body.
    data = request.get_json(silent=True) or {}

    # Clean the basic fields.
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    # Validate minimum account information before calling Supabase.
    if not name or not email or len(password) < 8:
        return jsonify({"error": "Name, email, and a password of at least 8 characters are required."}), 400

    try:
        # Supabase Auth stores the password securely and creates the auth account.
        client = new_supabase_client()
        auth_response = client.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {
                    "data": {"name": name},
                    "email_redirect_to": "https://churnsense-125l.onrender.com/login?confirmed=1",
                    },
            }
        )

        # The SQL trigger creates the matching profile and settings rows automatically.
        logged_in = save_auth_session(auth_response)

        # When email confirmation is enabled, there is no session until the email is confirmed.
        if not logged_in:
            return jsonify({
                "message": "Account created. Check your email to confirm the account, then sign in.",
                "requires_email_confirmation": True,
            }), 201

        # Return a simple success response when sign-up also created a session.
        return jsonify({"message": "Account created successfully."}), 201

    except Exception as error:
        # Return a short user-facing message without exposing project secrets.
        return jsonify({"error": str(error)}), 400


# Log an existing shared account in.
@app.route("/api/login", methods=["POST"])
def login():
    # Read the submitted JSON body.
    data = request.get_json(silent=True) or {}

    # Normalize login fields.
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    try:
        # Ask Supabase Auth to verify the email and password.
        client = new_supabase_client()
        auth_response = client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )

        # Save the authenticated Supabase session locally.
        if not save_auth_session(auth_response):
            return jsonify({"error": "Unable to start the account session."}), 401

        # Load the user's live shared profile.
        g.supabase_client = client
        profile = current_user_record()
        if profile is None:
            clear_auth_session()
            return jsonify({"error": "Account profile is not ready yet."}), 401

        # Return the account to the frontend.
        return jsonify({
            "message": "Login successful.",
            "user": profile,
        })

    except Exception:
        # Keep login errors generic so account details are not leaked.
        return jsonify({"error": "Incorrect email or password, or the email has not been confirmed."}), 401


# Log the current user out.
@app.route("/api/logout", methods=["POST"])
def logout():
    # Revoke the refresh token through Supabase when possible.
    client = current_supabase_client()
    if client is not None:
        try:
            client.auth.sign_out()
        except Exception:
            pass

    # Remove all local session values.
    session.clear()

    # Confirm logout.
    return jsonify({"message": "Logged out successfully."})


# Return the currently logged-in shared profile and settings.
@app.route("/api/me", methods=["GET"])
@login_required
def me():
    # Read the live profile from Supabase.
    profile = current_user_record()
    client = current_supabase_client()

    # Read the current user's settings row.
    settings_response = (
        client.table("user_settings")
        .select("language,theme,email_notifications")
        .eq("user_id", profile["id"])
        .limit(1)
        .execute()
    )
    settings = settings_response.data[0] if settings_response.data else {}

    # Return only safe profile information and live role permissions.
    return jsonify({
        "user": {
            **profile,
            "permissions": sorted(ROLE_PERMISSIONS.get(profile["role"], set())),
        },
        "settings": {
            "language": settings.get("language", "en"),
            "theme": settings.get("theme", "light"),
            "email_notifications": bool(settings.get("email_notifications", False)),
        },
    })


# Update the current user's shared profile without allowing role changes.
@app.route("/api/profile", methods=["PUT"])
@login_required
def update_profile():
    # Read submitted profile values.
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    organization = str(data.get("organization", "")).strip()
    job_title = str(data.get("job_title", "")).strip()

    # Keep name required.
    if not name:
        return jsonify({"error": "Name is required."}), 400

    # Use a protected database function that only updates safe profile columns.
    client = current_supabase_client()
    client.rpc(
        "update_my_profile",
        {
            "p_name": name,
            "p_organization": organization,
            "p_job_title": job_title,
        },
    ).execute()

    # Clear this request's cached profile after the update.
    if hasattr(g, "current_profile"):
        delattr(g, "current_profile")

    # Confirm the update.
    return jsonify({"message": "Profile updated."})


# Update language, theme, and notification preferences in the shared database.
@app.route("/api/settings", methods=["PUT"])
@login_required
def update_settings():
    # Read the new settings.
    data = request.get_json(silent=True) or {}
    language = "ar" if data.get("language") == "ar" else "en"
    theme = "dark" if data.get("theme") == "dark" else "light"
    email_notifications = bool(data.get("email_notifications", False))

    # Save the current user's settings row.
    client = current_supabase_client()
    client.table("user_settings").upsert(
        {
            "user_id": current_user_id(),
            "language": language,
            "theme": theme,
            "email_notifications": email_notifications,
        },
        on_conflict="user_id",
    ).execute()

    # Confirm the update.
    return jsonify({"message": "Settings updated."})


# Make a churn prediction and save it to the shared database when the user is logged in.
@app.route("/predict", methods=["POST"])
def predict():
    # Read the submitted customer data.
    data = request.get_json(silent=True) or {}

    # Keep an optional human-friendly customer reference separate from the model fields.
    customer_reference = str(data.pop("customer_reference", "")).strip()

    try:
        # Run the real local ML model prediction.
        clean_customer, churn_probability, prediction = run_prediction(data)
    except (ValueError, TypeError) as error:
        return jsonify({"error": str(error)}), 400

    # Save prediction history only for authenticated dashboard users.
    client = current_supabase_client()
    user_id = current_user_id()
    if client is not None and user_id is not None:
        try:
            client.table("predictions").insert(
                {
                    "user_id": user_id,
                    "customer_reference": customer_reference,
                    "customer_data": clean_customer,
                    "probability": churn_probability,
                    "prediction": prediction,
                }
            ).execute()
        except Exception:
            # A cloud save failure should not destroy a prediction that already ran locally.
            pass

    # Return the live prediction.
    return jsonify({
        "prediction": prediction,
        "churn_probability": round(churn_probability, 4),
        "threshold": threshold,
    })


# Re-run the local model with modified customer values for scenario comparison.
@app.route("/api/simulate", methods=["POST"])
@permission_required("simulator")
def simulate():
    # Read the original customer and the proposed changes.
    data = request.get_json(silent=True) or {}
    original_customer = data.get("customer", {})
    changes = data.get("changes", {})

    # Build the simulated customer by applying only the requested changes.
    simulated_customer = dict(original_customer)
    simulated_customer.update(changes)

    try:
        # Score the original inputs.
        _, original_probability, original_prediction = run_prediction(original_customer)

        # Score the simulated inputs.
        _, simulated_probability, simulated_prediction = run_prediction(simulated_customer)
    except (ValueError, TypeError) as error:
        return jsonify({"error": str(error)}), 400

    # Return both scores and the difference in percentage points.
    return jsonify({
        "original": {
            "prediction": original_prediction,
            "probability": round(original_probability, 4),
        },
        "simulated": {
            "prediction": simulated_prediction,
            "probability": round(simulated_probability, 4),
        },
        "difference": round((simulated_probability - original_probability) * 100, 2),
        "note": "This is a predictive scenario comparison, not a causal estimate.",
    })


# Return recent shared prediction records for the logged-in user.
@app.route("/api/predictions", methods=["GET"])
@permission_required("records")
def predictions():
    # RLS makes this query return only the signed-in user's rows.
    client = current_supabase_client()
    response = (
        client.table("predictions")
        .select("id,customer_reference,probability,prediction,created_at")
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )

    # Return shared records to the dashboard.
    return jsonify({"predictions": response.data or []})


# Return dashboard statistics based on the signed-in user's shared prediction history.
@app.route("/api/dashboard", methods=["GET"])
@login_required
def dashboard_stats():
    # Run a protected aggregate function in PostgreSQL.
    client = current_supabase_client()
    response = client.rpc("my_dashboard_summary").execute()
    summary = response.data or {}

    # Return normalized values for a brand-new account too.
    return jsonify({
        "total": int(summary.get("total", 0)),
        "high_risk": int(summary.get("high_risk", 0)),
        "average_probability": round(float(summary.get("average_probability", 0)), 4),
    })


# Return all safe shared user-account fields to an admin.
@app.route("/api/admin/users", methods=["GET"])
@permission_required("users_manage")
def get_users():
    # The RPC checks the caller's admin role inside PostgreSQL too.
    client = current_supabase_client()
    response = client.rpc("admin_list_users").execute()
    return jsonify({"users": response.data or []})


# Let an admin change another shared account's role.
@app.route("/api/admin/users/<user_id>/role", methods=["PUT"])
@permission_required("users_manage")
def update_user_role(user_id):
    # Read and normalize the requested new role.
    data = request.get_json(silent=True) or {}
    new_role = str(data.get("role", "")).strip().lower()

    # Reject unknown roles before calling the shared database.
    if new_role not in VALID_ROLES:
        return jsonify({"error": "Invalid role."}), 400

    try:
        # The protected RPC verifies admin access and prevents self-demotion too.
        client = current_supabase_client()
        response = client.rpc(
            "admin_update_user_role",
            {
                "p_user_id": user_id,
                "p_new_role": new_role,
            },
        ).execute()
        result = response.data or {}

        return jsonify({
            "message": "User role updated successfully.",
            "user_id": result.get("user_id", user_id),
            "role": result.get("role", new_role),
        })

    except Exception as error:
        message = str(error)
        status = 403 if "Admin access required" in message else 400
        return jsonify({"error": message}), status


# Return admin-only totals across the whole shared database.
@app.route("/api/admin/summary", methods=["GET"])
@permission_required("admin")
def admin_summary():
    # The database function independently verifies that the caller is an admin.
    client = current_supabase_client()
    response = client.rpc("admin_summary").execute()
    summary = response.data or {}

    return jsonify({
        "users": int(summary.get("users", 0)),
        "predictions": int(summary.get("predictions", 0)),
    })


# Start the local development server when this file is executed directly.
if __name__ == "__main__":
    # Keep debug mode controllable from an environment variable.
    debug_mode = os.environ.get("CHURNSENSE_DEBUG", "1") == "1"
    app.run(debug=debug_mode)
