# ChurnSense

ChurnSense is a machine learning project that predicts whether a telecom customer is likely to churn.

The project started as a customer churn classification model and was later connected to a simple web application where users can enter customer information and receive a churn risk prediction.

## Project Idea

Customer churn means that a customer stops using a company's service.

The goal of this project is to use customer information such as contract type, tenure, internet service, payment method, and monthly charges to predict whether the customer is likely to leave.

## Dataset

I used the IBM Telco Customer Churn dataset.

- Original rows: 7,043
- Rows after cleaning: 7,032
- Target column: `Churn`

Some of the features include:

- Tenure
- Contract type
- Internet service
- Monthly charges
- Total charges
- Payment method
- Tech support
- Online security

## Data Preprocessing

The main preprocessing steps were:

- Converted `TotalCharges` to numeric
- Removed rows with missing `TotalCharges`
- Removed `customerID`
- Split the data into training and testing sets using an 80/20 split
- Used stratified splitting to keep the churn distribution similar
- Applied One-Hot Encoding to categorical features
- Fitted the encoder only on the training data to avoid data leakage
- Used the same encoder for the test data

The final model input contains 45 features.

## Models

I trained and compared three models:

- Logistic Regression
- Random Forest
- Gradient Boosting

### Initial Results

| Model | Accuracy | Recall | Precision | F1 |
| --- | ---: | ---: | ---: | ---: |
| Logistic Regression | 81.66% | 56.68% | 68.83% | 62.17% |
| Random Forest | 79.67% | 52.67% | 64.38% | 58.68% |
| Gradient Boosting | 81.17% | 56.15% | 67.52% | 61.31% |

Logistic Regression gave the best overall results, so I selected it as the final model.

## Cross-Validation

I also used 5-fold cross-validation on the training data.

Average results:

- Recall: 53.78%
- F1 Score: 58.80%

## Threshold Tuning

The default threshold was 0.50.

Because Recall is important in churn prediction, I tested lower thresholds to reduce the number of customers who actually churn but are predicted as non-churn.

| Threshold | Recall | Precision | F1 | False Negatives |
| --- | ---: | ---: | ---: | ---: |
| 0.50 | 56.68% | 68.83% | 62.17% | 162 |
| 0.45 | 61.50% | 65.16% | 63.27% | 144 |
| 0.40 | 65.78% | 60.74% | 63.16% | 128 |

I selected a threshold of **0.40** because it improved Recall and reduced False Negatives.

## Final Results

The final Logistic Regression model with a threshold of 0.40 achieved:

- Accuracy: **79.60%**
- Recall: **65.78%**
- Precision: **60.74%**
- F1 Score: **63.16%**

Confusion Matrix:

- True Negatives: 874
- False Positives: 159
- False Negatives: 128
- True Positives: 246

## Visualizations

### Model Performance

![Model Performance](images/metrics_bar_chart.png)

### Threshold Comparison

![Threshold Comparison](images/threshold_comparison.png)

### Confusion Matrix

![Confusion Matrix](images/confusion_matrix.png)

## ChurnSense Web App

I connected the trained model to a Flask web application.

The user can enter customer information through the website, and the application:

1. Sends the customer data to the Flask backend
2. Applies the same preprocessing used during training
3. Uses the saved Logistic Regression model
4. Calculates the churn probability
5. Applies the 0.40 threshold
6. Displays the result to the user

The website supports both English and Arabic.

## User Accounts

ChurnSense also includes a simple account system using Supabase.

The application currently supports:

- Register
- Login and logout
- Shared user database
- User roles
- Admin account
- Prediction history
- Profile and settings

The available roles are:

- User
- Analyst
- Manager
- Admin

New users are created as regular users, while the Admin can change user roles.

## Risk Simulator

The project also includes a simple Risk Simulator.

It allows the user to change some customer information and run the model again to compare the new churn probability with the original prediction.

The simulator is only used for prediction comparison and does not prove that changing one feature directly causes churn to increase or decrease.

## Technologies Used

- Python
- pandas
- NumPy
- scikit-learn
- Matplotlib
- Jupyter Notebook
- Flask
- HTML
- CSS
- JavaScript
- Supabase
- Git
- GitHub
- VS Code

## Project Structure

```text
customer-churn-ml/
│
├── api/
├── models/
├── website/
├── supabase/
├── images/
├── churn_analysis.ipynb
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Run the Project Locally

Clone the repository:

```bash
git clone https://github.com/lamar-77/customer-churn-ml.git
cd customer-churn-ml
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

Create a `.env` file using `.env.example` and add your Supabase project information.

Then run:

```bash
python api/app.py
```

Open:

```text
http://127.0.0.1:5000
```

## Future Improvements

Some improvements I may add later:

- Improve the email confirmation redirect
- Improve the analytics section
- Add more model explanations
- Package the project as an easier local application
- Test more machine learning models

## Author

**Lamar Almutairi**

Computer Science Graduate  
Interested in Artificial Intelligence and Machine Learning