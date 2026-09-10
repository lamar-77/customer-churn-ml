# Customer Churn Prediction
This project aims to predict whether a customer will churn or stay, so the company can take action to reduce customer churn
## Dataset
Our dataset is the [Telco Customer Churn dataset](https://github.com/IBM/telco-customer-churn-on-icp4d) from IBM.

We aim to predict whether a customer will churn or stay.
Our target variable is `Churn`, which has two classes: `Yes` and `No`.
## Data Exploration and Cleaning
- We explored the dataset and discovered that `TotalCharges` was stored as a string, but it should be a numeric value.
- We converted `TotalCharges` from string to numeric.
- We found 11 missing values and removed those rows.
- Finally, after cleaning, we have 7,032 customers.
## Feature Selection and Data Splitting
- We separated the features (X) from the target (y).
- We removed `customerID` because it is only an identifier.
- We split the data into 80% training and 20% testing.
- We used stratified splitting to keep the same Churn distribution in both sets