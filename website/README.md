# Customer Churn Prediction Website

Frontend for the Customer Churn Prediction machine learning portfolio project.

## Current status

- Responsive website completed
- Full 19-feature customer input form completed
- Final model results displayed
- Threshold tuning results displayed
- JavaScript prepared for API integration
- Python backend integration is the next step

## Final ML model

- Model: Logistic Regression
- Decision threshold: 0.40
- Accuracy: 79.60%
- Recall: 65.78%
- Precision: 60.74%
- F1-score: 63.16%

## Website files

- `index.html` — website structure and project content
- `style.css` — responsive styling
- `script.js` — form handling and prepared `/predict` API request

## Next integration step

The frontend expects a backend endpoint:

```text
POST /predict
```

The backend should receive the 19 raw customer features, apply the saved preprocessing/encoder, run the saved Logistic Regression model, use threshold `0.40`, and return a JSON response similar to:

```json
{
  "prediction": "Yes",
  "churn_probability": 0.68
}
```
