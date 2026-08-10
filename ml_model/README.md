# Food Freshness Monitoring Platform – Machine Learning Module

This is a production-ready, modular Machine Learning module for identifying food types and predicting food freshness from images. It classifies food items into **6 classes** (representing combinations of **Apple, Banana, Orange** and **Fresh, Spoiled** states) using **Transfer Learning and Fine-Tuning** with `EfficientNetB0` and `TensorFlow`.

This module is designed to be easily imported directly into a Python project (such as a FastAPI backend) and consumed by frontend client requests.

---

## Project Structure

```text
ml_model/
│
├── train.py                  # Orchestrates the 2-phase training and evaluation pipeline
├── predict.py                # Reusable prediction function and CLI wrapper
├── preprocessing.py          # Image validation, resizing, normalization, and data augmentation
├── dataset_loader.py         # Handles directory scanning, stratified 70/15/15 splits, and caching
├── utils.py                  # History plotting, class weighting, confusion matrices, and ROC curves
├── requirements.txt          # Python project dependencies
├── README.md                 # Project documentation (this file)
│
# Generated outputs after running train.py
├── labels.json               # Ordered class name definitions
├── food_freshness_model.keras # Best checkpoint containing model weights and architecture
├── training_history.png      # Plot containing loss and accuracy curves (Phase 1 & Phase 2)
├── confusion_matrix.png      # Multi-class confusion matrix
└── roc_curve.png             # Multi-class ROC curves with individual AUC scores
```

---

## Dataset Selection & Mapping

We use the primary benchmark dataset:
* **Dataset:** [sriramr/fruits-fresh-and-rotten-for-classification](https://www.kaggle.com/datasets/sriramr/fruits-fresh-and-rotten-for-classification) (~13,600 images, ~450 MB)
* **Classes Mapping:** The dataset's directories are mapped directly to 6 outputs:
  - `freshapples` $\rightarrow$ Class `0` (Apple, Fresh)
  - `freshbanana` $\rightarrow$ Class `1` (Banana, Fresh)
  - `freshoranges` $\rightarrow$ Class `2` (Orange, Fresh)
  - `rottenapples` $\rightarrow$ Class `3` (Apple, Spoiled)
  - `rottenbanana` $\rightarrow$ Class `4` (Banana, Spoiled)
  - `rottenoranges` $\rightarrow$ Class `5` (Orange, Spoiled)

---

## Model Architecture & Fine-Tuning

The model uses **Transfer Learning** based on `EfficientNetB0` pre-trained on ImageNet:
1. **Phase 1: Feature Extraction**: The pre-trained base model is frozen (`trainable = False`), and a custom head (`GlobalAveragePooling2D` $\rightarrow$ `BatchNormalization` $\rightarrow$ `Dropout(0.4)` $\rightarrow$ `Dense(6, activation='softmax')`) is trained for **10 epochs** using `Adam(learning_rate=1e-4)`.
2. **Phase 2: Fine-Tuning**: The top 25 layers of `EfficientNetB0` are unfrozen, and the model is trained for **15-20 epochs** using a reduced learning rate `Adam(learning_rate=1e-5)` to fit features specifically for food category and freshness.
3. **Callbacks**: Both phases utilize `EarlyStopping`, `ReduceLROnPlateau`, and `ModelCheckpoint` monitoring `val_loss` to prevent overfitting.

---

## Setup Instructions

### 1. Install Dependencies
Ensure Python (version 3.9 to 3.13) is installed, then run:
```bash
pip install -r requirements.txt
```

### 2. Set Up the Dataset
You can download the dataset in one of two ways:

#### A. Automatic Download (Kaggle CLI)
Configure your Kaggle account environment variables:
* **PowerShell (Windows):**
  ```powershell
  $env:KAGGLE_USERNAME = "your_username"
  $env:KAGGLE_KEY = "your_api_key"
  ```
* **Bash (Linux/Mac):**
  ```bash
  export KAGGLE_USERNAME="your_username"
  export KAGGLE_KEY="your_api_key"
  ```

#### B. Manual Download
1. Go to: [Kaggle Dataset Page](https://www.kaggle.com/datasets/sriramr/fruits-fresh-and-rotten-for-classification)
2. Download the ZIP file.
3. Extract it into: `ml_model/data/fruits-fresh-and-rotten-for-classification`

---

## How to Train the Model

### Quick Debugging Run (Verify Code Setup)
To run a fast validation test of the full pipeline (data loading, splits, 2-phase training, saving, plotting, and evaluations) on a downsampled dataset in under 5 minutes on a CPU, run:
```bash
python train.py --quick-train
```

### Full Production Training
To perform the full production training on the complete dataset, run:
```bash
python train.py --full-training
```

---

## How to Run Predictions

### 1. Command-Line Interface (CLI)
Evaluate any image directly from your terminal:
```bash
python predict.py path/to/image.jpg
```
**Example Output:**
```text
Food Category    : Apple
Freshness Status : Fresh
Confidence       : 96.50%
```

### 2. Python Programmatic Import (FastAPI Integration)
You can import the prediction function directly into your backend code:
```python
from predict import predict_food_freshness

try:
    result = predict_food_freshness("path/to/image.jpg")
    print(result)
    # Output: {"food_category": "Apple", "freshness_status": "Fresh", "confidence": 96.5}
except ValueError as e:
    print(f"Validation Error: {e}")
except FileNotFoundError as e:
    print(f"Configuration Error: {e}")
```
_Note: The module caches the Keras model in memory after the first prediction, ensuring sub-millisecond response times for subsequent API requests._
