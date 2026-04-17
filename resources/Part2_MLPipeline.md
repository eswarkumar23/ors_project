# AGFE-Fire v4 — Deep Explanation: Part 2 of 3
# 🤖 ML Pipeline (`AGFE_Fire_v4_Doc3_BIPE_Colab.ipynb`)

---

## Overview of the Notebook Pipeline

```
Block CSVs (4 files)
        ↓
Section 2: Load & Merge into df_all
        ↓
Section 3: Spatial Thinning (remove autocorrelation)
        ↓
Section 4: Class Balance Check
        ↓
Section 5: Harmonization (VIF + Correlation Filter)  ← KEY STEP
        ↓
Section 6: Prior-Block Fire History Features         ← CORE NOVELTY
        ↓
Section 7: Temporal Delta Features
        ↓
Section 8: Climate Indices (ONI/IOD) + Interactions
        ↓
Section 9: Final Feature Assembly + Leakage Check
        ↓
Section 10: Train/Test Split (Temporal)
        ↓
Section 11: SMOTE Oversampling (train only)
        ↓
Section 12: StandardScaler Normalization
        ↓
Sections 13–17: Train 5 Models with Optuna
        ↓
Section 18: SHAP Explainability
        ↓
Section 21: Evaluation Metrics & Plots
```

---

## Section 2: Loading the Four Block CSVs

```python
csv_files = sorted(glob.glob(os.path.join(PROJECT_DIR, 'WG_AGFE_Block*.csv')))
block_dfs = {}
for fname in csv_files:
    df = pd.read_csv(fname)
    for bid in [1, 2, 3, 4]:
        if f'Block{bid}' in fname:
            df['block_id'] = bid
            block_dfs[bid] = df

df_all = pd.concat(block_dfs.values(), ignore_index=True)
```

- Reads the **four CSVs exported from GEE** (one per temporal block).
- Adds a `block_id` column (1, 2, 3, 4) to track which time period each row belongs to.
- Concatenates into one **single unified DataFrame** `df_all` with ~40,000 rows.
- Each row = one spatial pixel-sample, with 36+ columns of features + coordinates + label.

---

## Section 3: Spatial Thinning to Remove Autocorrelation

```python
def spatial_thin_fast(df, min_dist_km=1.0, lat_col='latitude', lon_col='longitude'):
    coords_rad = np.radians(df[[lat_col, lon_col]].values)
    radius_rad = min_dist_km / 6371.0   # Earth radius
    tree = cKDTree(coords_rad)
    
    keep = np.ones(len(df), dtype=bool)
    for i in range(len(df)):
        if not keep[i]: continue
        neighbors = tree.query_ball_point(coords_rad[i], radius_rad)
        for j in neighbors:
            if j > i and keep[j]:
                keep[j] = False   # drop the later point
    
    return df[keep].reset_index(drop=True)
```

**Problem it solves:** When GEE samples points at 1km × 1km, adjacent pixels share spatial autocorrelation (pixels near each other have similar climate, topography, and fire history). If both training and test have autocorrelated neighbors, the model can "cheat" — it just learns the local neighborhood pattern.

**How it works:**
1. Converts lat/lon to radians.
2. Builds a **k-d tree** for fast distance queries (scipy `cKDTree`).
3. Greedily scans all points: for each point kept, it marks all other points within **1 km** as removed.
4. This "greedy thinning" preserves maximum coverage while ensuring minimum 1km separation.

Applied **per block** independently — so Block 1's thinning doesn't affect Block 4's points.

---

## Section 4: Class Balance Check

```python
for bid in sorted(df_all['block_id'].unique()):
    block = df_all[df_all['block_id'] == bid]
    fire_n   = (block['fire_occurrence'] == 1).sum()
    nofire_n = (block['fire_occurrence'] == 0).sum()
    ratio = fire_n / max(nofire_n, 1)
    print(f"  Block {bid}: 🔥 fire={fire_n:,} | ❌ no_fire={nofire_n:,} | ratio=1:{1/ratio:.1f}")
```

Because GEE's `stratifiedSample` already drew **5,000 fire + 5,000 non-fire** per block, the data is ~50:50 balanced. This confirms no heavy class imbalance before ML training.

---

## Section 5: Harmonization — VIF Screening & Correlation Filter

This is the **feature selection / multicollinearity removal** step. It ensures the ML model receives a clean, non-redundant feature set.

### Why it's needed?
The GEE script produced 28+ environmental features (weather, vegetation, topography, etc.). Many are **correlated**:
- `temp_mean_C` and `temp_max_C` are highly correlated (r ≈ 0.95).
- `NDVI_mean` and `EVI_mean` often track each other.
- `precip_mean_mm` and `precip_total_mm` are near-duplicates.

Correlated features cause:
1. **VIF inflation**: Model can't reliably estimate coefficients for linear models.
2. **Feature instability**: Tree-based models split importance randomly between correlated twins.
3. **Slower training** without accuracy benefit.

---

### Pass 1: Pearson Correlation Filter (|ρ| > 0.75)

```python
corr_matrix = X_vif.corr().abs()
upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))

corr_drop = set()
for col in upper.columns:
    for row in upper.index:
        if upper.loc[row, col] > 0.75:
            # Drop the one with LOWER correlation to target (fire_occurrence)
            r1 = abs(X_vif[col].corr(target_corr))   # col vs. fire
            r2 = abs(X_vif[row].corr(target_corr))   # row vs. fire
            drop = row if r1 >= r2 else col
            corr_drop.add(drop)
```

**Logic:** When two features have |Pearson r| > 0.75 (i.e., more than 75% correlated), drop the one that is **less correlated with the target** `fire_occurrence`. This is the smarter version: it doesn't randomly drop one, it drops the least informative one.

- Uses only the **upper triangle** of the correlation matrix to avoid double-counting pairs.
- All computations done on **training blocks only** (1, 2, 3) — never touches Block 4 test data (prevents data leakage into feature selection).

---

### Pass 2: Variance Inflation Factor (VIF) Screening (threshold = 10)

```python
while True:
    vifs = pd.Series(
        [variance_inflation_factor(X_check.values, i) for i in range(X_check.shape[1])],
        index=X_check.columns
    )
    max_vif = vifs.max()
    if max_vif <= 10:
        break
    worst = vifs.idxmax()
    removed_vif.append((worst, max_vif))
    X_vif = X_vif.drop(columns=[worst])
```

**VIF explained:**
- VIF for feature X_i = **1 / (1 − R²)** where R² is obtained by regressing X_i on all other features.
- VIF = 1 → no multicollinearity. VIF = 10 → X_i can be 90% explained by other features.
- **VIF > 10** is the standard threshold for "unacceptable collinearity."

**Algorithm:** Iteratively remove the feature with the highest VIF until all VIFs ≤ 10. This is called **sequential backward elimination by VIF**.

The result is `FINAL_ENV_FEATURES` — a set of environmental features that are:
- Mutually independent (low pairwise correlation)
- Each contributing unique information (low VIF)
- Maximally correlated with fire occurrence

---

## Section 6: Prior-Block Fire History — The Core Novelty

> **This is the key innovation!** — quoted from the notebook

```python
FIRE_LAG_COLS = ['fire_occurrence', 'total_fire_count', 'FRP_mean_MW', 'FRP_max_MW',
                 'burned_area_binary', 'burn_month_count', 'FIRMS_brightness_K']

df_all['pixel_key'] = create_pixel_key(df_all)  # "lat_lon" string key at 4 decimal places
```

### The Core Idea

For each pixel in Block k, we look at what happened at the **same pixel location in Block k−1** and use those historical fire values as input features for predicting Block k fire occurrence.

This teaches the model: **"places that burned before are much more likely to burn again."**

**Scientific justification:** 63.1% of Block 4 fire pixels had fire in at least one prior block.

### How Pixel Matching Works

```python
for bid in [2, 3, 4]:
    curr_mask = df_all['block_id'] == bid
    prev_mask = df_all['block_id'] == (bid - 1)
    
    prev_agg = prev_block.groupby('pixel_key')[FIRE_LAG_COLS].mean()
    curr_keys = df_all.loc[curr_idx, 'pixel_key']
    matched = curr_keys.isin(prev_agg.index)
    
    for col in FIRE_LAG_COLS:
        vals = matched_keys.map(prev_agg[col]).values
        df_all.loc[curr_idx[matched], f'prev_{col}'] = vals
```

- Pixels are matched by their `pixel_key` = `"latitude_longitude"` string (4 decimal places ≈ 11m precision).
- For matched pixels, the **previous block's fire values are filled in** as `prev_*` columns.
- For Block 1 (no previous block): all `prev_*` = 0 (default).
- Uses `.groupby('pixel_key').mean()` to handle any duplicate keys.

### Fire Recurrence (How Many Prior Blocks Had Fire?)

```python
for prior_bid in range(1, bid):
    prior_fire = df_all[prior_mask].groupby('pixel_key')['fire_occurrence'].mean()
    has_fire = curr_keys.map(prior_fire).fillna(0).values
    df_all.loc[curr_idx, 'fire_recurrence'] += (has_fire > 0).astype(float)
```

`fire_recurrence` = count of all prior blocks that showed fire at this pixel location.
- Block 2 max = 1 (prior Block 1 only)
- Block 3 max = 2 (prior Blocks 1 and 2)
- Block 4 max = 3 (all three prior blocks)

### Fire Trend Delta

```python
if bid >= 3:
    delta_map = prev1_agg['total_fire_count'] - prev2_agg['total_fire_count']
    df_all.loc[curr_idx, 'fire_trend_delta'] = curr_keys.map(delta_map).fillna(0).values
```

`fire_trend_delta` = change in fire count between the two most recent prior blocks (k−1 minus k−2).
- Positive → fire getting worse at this location (escalating risk).
- Negative → fire getting better (recovery or management).

### 5km Neighborhood Fire History

```python
prev_tree = cKDTree(np.radians(prev_block[['latitude', 'longitude']].values))
radius_rad = 5.0 / 6371.0  # 5km in radians

for i in range(len(curr_coords)):
    neighbors = prev_tree.query_ball_point(curr_coords[i], radius_rad)
    neighbor_vals[i] = np.mean(prev_fire_vals[neighbors]) if neighbors else 0
```

`neighbor_fire_5km` = average fire occurrence within 5km radius in the previous block.

This captures **fire contagion** — if surrounding areas burned, this pixel's risk is elevated from:
- Fuel accumulation (seeds from burned areas)
- Landscape connectivity for fire spread
- Persistent ignition sources (human settlement patterns)

### Final Fire History Features (11 total)
- `prev_fire_occurrence`, `prev_total_fire_count`, `prev_FRP_mean_MW`, `prev_FRP_max_MW`
- `prev_burned_area_binary`, `prev_burn_month_count`, `prev_FIRMS_brightness_K`
- `fire_recurrence`, `fire_trend_delta`, `neighbor_fire_5km`

---

## Section 7: Temporal Delta Features

```python
for feat in DELTA_FEATURES:
    delta_col = f'delta_{feat}'
    df_all[delta_col] = 0.0
    
    for bid in [2, 3, 4]:
        prev_agg = df_all[prev_mask].groupby('pixel_key')[feat].mean()
        curr_vals = df_all.loc[curr_idx[matched], feat].values
        prev_vals = matched_keys.map(prev_agg).values
        df_all.loc[curr_idx[matched], delta_col] = curr_vals - prev_vals
```

For every environmental feature in `FINAL_ENV_FEATURES`, a **delta** = current block value − previous block value is computed.

**Purpose:**
- `delta_temp_mean_C = +2.5` → temperature rose 2.5°C → increasing fire risk.
- `delta_NDVI_mean = -0.15` → vegetation declined (drought?) → fuel drying.
- `delta_VPD_kPa = +0.8` → atmosphere became drier.

The **direction of change** often matters more than the absolute value for predicting fire shifts.

---

## Section 8: Climate Indices and Interaction Terms

### ONI and IOD Block Averages (Hardcoded)

```python
ONI_BLOCK_AVG = {1: -0.15, 2: 0.12, 3: 0.35, 4: -0.45}
IOD_BLOCK_AVG = {1:  0.08, 2: 0.15, 3: 0.22, 4: -0.10}

df_all['ONI_index'] = df_all['block_id'].map(ONI_BLOCK_AVG)
df_all['IOD_index'] = df_all['block_id'].map(IOD_BLOCK_AVG)
```

- **ONI (Oceanic Niño Index)**: Average sea surface temperature anomaly in the Niño 3.4 region of the Pacific.
  - Positive = El Niño → drier Indian monsoon → more fire.
  - Negative = La Niña → wetter monsoon → less fire.
- **IOD (Indian Ocean Dipole)**: SST difference between western and eastern Indian Ocean.
  - Positive IOD → stronger monsoon suppression over parts of India.

Block-level averages are assigned as a **constant column** per block (all samples in Block 3 get ONI=0.35). This encodes the large-scale climate state of each period.

### Interaction Terms

```python
safe_interact(df_all, 'FWI_proxy', 'NDVI_min', 'fwi_x_ndvi')
safe_interact(df_all, 'prev_FRP_mean_MW', 'FWI_proxy', 'prev_frp_x_fwi')
safe_interact(df_all, 'elevation', 'NDVI_min', 'elev_x_ndvi')
safe_interact(df_all, 'ONI_index', 'precip_total_mm', 'oni_x_precip')
safe_interact(df_all, 'neighbor_fire_5km', 'FWI_proxy', 'neighbor_fire_x_fwi')
```

Simple multiplicative pairwise products that capture compound effects:
- `fwi_x_ndvi`: Extreme fire weather + dry vegetation = double risk.
- `prev_frp_x_fwi`: High past fire intensity + current fire weather = elevated re-burn risk.
- `oni_x_precip`: ENSO state modulating rainfall impact.

---

## Section 9: Final Feature Assembly + Leakage Guard

```python
ALL_FEATURES = (
    FINAL_ENV_FEATURES +     # Environmental (VIF-filtered)
    FIRE_HISTORY_FEATURES +  # Prior-block fire history (Section 6)
    TEMPORAL_DELTA_COLS +    # Temporal deltas (Section 7)
    ['ONI_index', 'IOD_index'] + 
    INTERACTION_COLS + 
    ['fire_season']
)

# LEAKAGE CHECK: Make sure no current-block fire params sneaked in
CURRENT_FIRE_COLS = ['fire_occurrence', 'total_fire_count', 'FRP_mean_MW', ...]
leaked = [f for f in ALL_FEATURES if f in CURRENT_FIRE_COLS]
assert len(leaked) == 0, f"❌ LEAKAGE DETECTED!"
```

**Why the leakage guard?** The current-block fire columns (total_fire_count, FRP, burned_area, etc.) are computed from the same time period as the target `fire_occurrence`. Using them would be circular — they are part of the fire signal you're trying to predict, not predictors.

The only fire-derived features in `ALL_FEATURES` are from **previous blocks** (`prev_*` columns from Section 6).

---

## Section 10: Strict Temporal Train/Test Split

```python
train_mask = df_all['block_id'].isin([1, 2, 3])  # 2003–2020
test_mask  = df_all['block_id'] == 4              # 2021–2025

X_train = df_all.loc[train_mask, ALL_FEATURES].values
y_train = df_all.loc[train_mask, TARGET_COL].values.astype(int)
X_test  = df_all.loc[test_mask,  ALL_FEATURES].values
y_test  = df_all.loc[test_mask,  TARGET_COL].values.astype(int)
```

- **No random shuffling** — order preserved to prevent temporal leakage.
- Training: ~30,000 samples from 2003–2020.
- Testing: ~10,000 samples from 2021–2025 (entirely unseen).
- `NaN/Inf` replaced with 0 before splitting (rare edge cases from division operations).

---

## Section 11: SMOTE Oversampling (Training Set Only)

Even though the data is already ~50:50, SMOTE is applied to add robustness:

```python
from imblearn.over_sampling import SMOTE
smote = SMOTE(sampling_strategy=1.0, random_state=42)
X_train_sm, y_train_sm = smote.fit_resample(X_train_scaled, y_train)
```

**SMOTE (Synthetic Minority Oversampling Technique):**
- For each minority-class sample, finds its k nearest minority neighbors.
- Generates synthetic points along the line connecting them.
- Ensures the model sees **diverse fire examples** not just the same 50% repeated.

⚠️ Applied **only to training data** — the test set is never touched (no data leakage).

---

## Section 12: StandardScaler Normalization

```python
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)   # use same scaler — NOT refit on test
```

**Why scaling?**
- Features differ wildly in range: `elevation` (0–2600m) vs. `NDVI_mean` (0–1) vs. `population_density` (0–50,000).
- Distance-based models (MLP, SVM) fail badly without normalization.
- Even tree-based models (RF, XGBoost) converge faster with scaled features.

Key: `scaler.fit()` only on training data. `scaler.transform()` on test data using training statistics. This prevents test-set statistics from leaking into feature scaling.

---

## Sections 13–17: Five Models with Optuna Hyperparameter Tuning

### Why 5 models?
The project builds an **ensemble framework** — 5 diverse models whose strengths complement each other.

| Model | Type | Strength |
|---|---|---|
| Random Forest | Bagging ensemble of trees | Stable, robust to noise, good baseline |
| XGBoost | Gradient boosting | Highly accurate, handles interactions well |
| CatBoost | Gradient boosting (Yandex) | Best with categorical features, less tuning needed |
| LightGBM | Gradient boosting (Microsoft) | Fastest, large-data specialist |
| MLP Neural Network | Deep learning | Learns non-linear representations |

### Optuna Hyperparameter Optimization

Each model uses **Optuna** — a modern Bayesian hyperparameter optimization framework:

```python
def rf_objective(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 100, 800),
        'max_depth': trial.suggest_int('max_depth', 5, 30),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
        'max_features': trial.suggest_categorical('max_features', ['sqrt', 'log2', 0.5]),
        'class_weight': trial.suggest_categorical('class_weight', ['balanced', None])
    }
    model = RandomForestClassifier(**params, n_jobs=-1, random_state=42)
    # Cross-validated on training blocks
    score = cross_val_score(model, X_train_sm, y_train_sm, cv=3, scoring='f1').mean()
    return score

study = optuna.create_study(direction='maximize', sampler=TPESampler(seed=42))
study.optimize(rf_objective, n_trials=30)
```

**How Optuna works:**
1. Starts with a few random trials (exploration).
2. After ~5 trials, uses **TPE (Tree-structured Parzen Estimator)** — a Bayesian model of which hyperparameter regions give good results.
3. Subsequent trials probe the **most promising regions** (exploitation).
4. Result: better hyperparameters than grid search, in fewer trials.

**Save/load checkpoint:** The notebook checks if a model was already saved and skips training if found — prevents re-running 30-minute optimization on Colab reruns.

---

## Section 18: SHAP Explainability

```python
import shap
explainer = shap.TreeExplainer(lgb_model)
shap_values = explainer.shap_values(X_shap)
```

- **SHAP (SHapley Additive exPlanations)** assigns each feature a contribution to each prediction.
- LightGBM uses native **TreeSHAP** (fast exact computation, not sampling).
- Outputs show which features (VPD, FWI_proxy, prev_fire_occurrence, etc.) drive fire prediction the most.
- The beeswarm plot shows **global importance + direction** at once.

---

## Section 21: Evaluation Metrics (5 Models on Block 4 Test)

```python
MODELS = {
    'Random Forest': rf_model,
    'XGBoost':       xgb_model,
    'CatBoost':      cat_model,
    'LightGBM':      lgb_model,
    'MLP':           mlp_model
}

for name, model in MODELS.items():
    pred  = model.predict(X_test_scaled)
    proba = model.predict_proba(X_test_scaled)[:, 1]
    tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()
    sens = tp / (tp + fn)   # Recall = sensitivity
    spec = tn / (tn + fp)   # Specificity
```

**Metrics computed for each model:**

| Metric | Formula | What it means for fire detection |
|---|---|---|
| **Accuracy** | (TP+TN) / Total | Overall correct rate |
| **Sensitivity (Recall)** | TP / (TP+FN) | What fraction of actual fires were caught? |
| **Specificity** | TN / (TN+FP) | What fraction of non-fires were correctly rejected? |
| **F1-Score** | 2×(Prec×Rec)/(Prec+Rec) | Harmonic mean — for imbalanced real-world scenarios |
| **AUC-ROC** | Area under ROC curve | Discrimination power across all thresholds |
| **MCC** | Matthews Correlation Coefficient | Best single metric for binary classification |
| **Brier Score** | Probability calibration error | Are the predicted probabilities well-calibrated? |
| **Cohen's Kappa** | Agreement above chance | How much better than random? |
