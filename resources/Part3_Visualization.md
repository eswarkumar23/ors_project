# AGFE-Fire v4 — Deep Explanation: Part 3 of 3
# 🗺️ Predicted Fire Points & Visualization ([GEE_RF_FirePrediction_Visualization.js](file:///home/yaswanth/Desktop/ors%20project/GEE_RF_FirePrediction_Visualization.js))

---

## 1. How Predicted Points Are Generated (Python → CSV → GEE)

After the 5 ML models are trained in the notebook (Part 2), predictions on the **Block 4 test set** are made:

```python
# From Section 21a of the notebook
pred_RF  = rf_model.predict(X_test_scaled)     # 0 or 1
proba_RF = rf_model.predict_proba(X_test_scaled)[:, 1]  # fire probability

# y_test = ground truth labels
# X_test also contains the lat/lon coordinates from df_all[test_mask]
```

The test DataFrame (Block 4, 2021–2025) already has `latitude` and `longitude` columns from GEE export. So the result CSV `test_results_with_coords.csv` looks like:

| latitude | longitude | y_true | pred_RF | proba_RF | pred_XGB | ... |
|---|---|---|---|---|---|---|
| 13.856 | 75.193 | 1 | 1 | 0.87 | 1 | |
| 18.015 | 73.792 | 0 | 0 | 0.12 | 0 | |
| ... | | | | | | |

- **`y_true`** = `fire_occurrence` from the GEE-extracted data (ground truth from MOD14A1 + MCD64A1).
- **`pred_RF`** = Random Forest prediction (1 = fire predicted, 0 = no fire).
- Total test samples: ~4,248 (after spatial thinning and NaN removal).
- Ground truth fires (`y_true == 1`): **2,262 points** (Blue markers).
- RF predicted fires (`pred_RF == 1`): **1,986 points** (Red markers).

---

## 2. What "Ground Truth Fire" Actually Means

The `y_true` label (`fire_occurrence`) was **created in GEE** (Part 1, Section 5A):

```js
// From GEE_WesternGhats_AllParameters.js
var fireImages = mod14.select('FireMask').map(function(img) {
  return img.gte(7).rename('fire');  // confidence ≥ 7
});
var fireOccurrence = fireImages.max().unmask(0).rename('fire_occurrence');
```

So a pixel is labeled `fire_occurrence = 1` if **MODIS MOD14A1 detected fire at any confidence level ≥ 7 (low confidence and above) on any day during the 2021–2025 block**.

This is the **observational truth** from satellite thermal sensors — not model output, not manual labeling.

---

## 3. How the Visualization Script Works

The GEE visualization script ([GEE_RF_FirePrediction_Visualization.js](file:///home/yaswanth/Desktop/ors%20project/GEE_RF_FirePrediction_Visualization.js)) takes the **pre-computed coordinate arrays** (hardcoded from `test_results_with_coords.csv`) and plots them on an interactive map.

The coordinate arrays are **embedded directly into the script** as JavaScript objects because GEE cannot read CSV files directly — all data must come from:
1. GEE's asset store (rasters, vectors), or
2. Code-embedded literals

---

## 4. Study Area Re-Definition

```js
var ecoregions = ee.FeatureCollection("RESOLVE/ECOREGIONS/2017");
var westernGhats = ecoregions.filter(ee.Filter.or(
  ee.Filter.eq('ECO_NAME', 'South Western Ghats moist deciduous forests'),
  ee.Filter.eq('ECO_NAME', 'North Western Ghats moist deciduous forests'),
  ee.Filter.eq('ECO_NAME', 'South Western Ghats montane rain forests'),
  ee.Filter.eq('ECO_NAME', 'North Western Ghats montane rain forests')
));
Map.centerObject(westernGhats, 7);
```

Identical to the extraction script — same 4 ecoregions, reused for clipping background layers and providing the boundary green overlay on the map.

---

## 5. Converting Coordinate Arrays → GEE FeatureCollections

```js
function coordsToFC(coordArray) {
  var features = coordArray.map(function(c) {
    return ee.Feature(ee.Geometry.Point(c[0], c[1]));
  });
  return ee.FeatureCollection(features);
}

var gtFC = coordsToFC(gtFireCoords);   // Ground Truth (2262 points)
var rfFC = coordsToFC(rfFireCoords);   // RF Predicted (1986 points)
```

Each `[longitude, latitude]` pair becomes an `ee.Geometry.Point` → wrapped in an `ee.Feature` → collected into a `FeatureCollection`.

GEE FeatureCollections are the vector data structure — analogous to a shapefile or a GeoPandas GeoDataFrame.

---

## 6. Spatial Overlap Analysis: TP / FP / FN

This is where the script does its **most important computation** — determining which predictions agreed with ground truth.

### True Positives (Gold/Yellow): Both GT and RF say fire

```js
var tpFC = rfFC.map(function(feat) {
  var nearby = gtFC.filterBounds(feat.geometry().buffer(1000));  // 1km buffer
  return feat.set('is_tp', nearby.size().gt(0));
}).filter(ee.Filter.eq('is_tp', 1));
```

**Logic:**
1. For each RF-predicted fire point, create a **1000-meter (1km) circular buffer**.
2. Count how many Ground Truth fire points fall inside that buffer.
3. If count > 0 → this RF prediction has a nearby GT fire → it's a **True Positive**.
4. Filter to keep only TPs.

**Why 1km buffer and not exact match?**
- GEE sampling at 1km resolution means two independently sampled points at the "same" location can have coordinates differing by hundreds of meters.
- Exact coordinate matching would massively undercount TPs.
- 1km = one MODIS pixel width = physically meaningful matching threshold.

### False Positives (Orange): RF predicted fire, no GT fire nearby

```js
var fpFC = rfFC.map(function(feat) {
  var nearby = gtFC.filterBounds(feat.geometry().buffer(1000));
  return feat.set('is_fp', nearby.size().eq(0));  // eq(0) = no GT nearby
}).filter(ee.Filter.eq('is_fp', 1));
```

RF predicted fire but no MODIS-confirmed fire within 1km. Could be:
- RF false alarm
- Real fire that MODIS missed (cloud cover, small fire, timing)
- Legitimate early warning (fires that ignited shortly after the observation)

### False Negatives (Purple): GT fire that RF missed

```js
var fnFC = gtFC.map(function(feat) {
  var nearby = rfFC.filterBounds(feat.geometry().buffer(1000));
  return feat.set('is_fn', nearby.size().eq(0));
}).filter(ee.Filter.eq('is_fn', 1));
```

Fire was confirmed by MODIS but RF didn't predict fire there. These are the **misses** — most dangerous in a fire alerting context.

---

## 7. Map Layers — What Each Color Means

| Layer | Color | Meaning | Points |
|---|---|---|---|
| GT Fire | 🔵 Blue | MODIS confirmed fire (truth) | 2,262 |
| RF Predicted | 🔴 Red | Random Forest says fire | 1,986 |
| True Positives | 🟡 Yellow | Both agree — correct detection | Subset of RF |
| False Positives | 🟠 Orange | RF alarmed, no MODIS fire | Subset of RF |
| False Negatives | 🟣 Purple | MODIS fire, RF missed | Subset of GT |

**Background layers:**
```js
// MODIS Fire Density heatmap (Block 4 context)
var fireCount = mod14.select('FireMask').map(function(img) {
  return img.gte(7);
}).sum().clip(studyArea);
Map.addLayer(fireCount,
  {min: 0, max: 30, palette: ['FFFFFF','FFFF80','FFA500','FF4500','8B0000']},
  '🔥 MODIS Fire Density 2021-2025 (background)', true, 0.5);
```

The MODIS fire count heatmap (white → yellow → orange → red → dark red) shows where fires were most frequent throughout the entire 2021–2025 period. Points overlay this continuous heatmap for context.

```js
// NDVI vegetation context
var ndvi = ee.ImageCollection("MODIS/061/MOD13A2")
  .filterDate('2021-01-01', '2025-12-31')
  .filterBounds(studyArea)
  .select('NDVI').median().multiply(0.0001).clip(studyArea);
```

NDVI layer (hidden by default) shows vegetation density — useful to see whether fire predictions align with dry, sparse vegetation.

---

## 8. Legend UI Widget

```js
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.9)'
  }
});

items.forEach(function(item) {
  var row = ui.Panel({layout: ui.Panel.Layout.flow('horizontal')});
  var dot = ui.Label({
    style: {
      backgroundColor: '#' + item.color,
      padding: '6px',     // creates a colored dot
      margin: '0 6px 0 0'
    }
  });
  var lbl = ui.Label({value: item.label});
  row.add(dot); row.add(lbl); legend.add(row);
});

Map.add(legend);
```

GEE's `ui.Panel` and `ui.Label` widgets create an HTML-like overlay panel directly on the map. The "colored dot" is created by setting the background color of a tiny label with padding — a common GEE UI pattern since there's no circle widget.

---

## 9. Model Performance Reading from the Visualization

From the console output:
- **Ground Truth fires: 2,262** (MODIS-confirmed)
- **RF Predicted fires: 1,986** (model output)

From the spatial overlap (1km buffer):
- **True Positives (Yellow)** = where the red and blue dots overlap → correct fire detections.
- **False Positives (Orange)** = red dots with no blue nearby → false alarms.
- **False Negatives (Purple)** = blue dots with no red nearby → missed fires.

You can visually see the model's spatial pattern:
- Which areas are consistently well-predicted (hotspot zones appear in both blue + red → yellow).
- Where the model is overconfident (many orange dots in a region = spatial bias in FPs).
- Where the model systematically fails (many purple dots = hard-to-predict fire zones).

---

## 10. Complete End-to-End Flow Diagram

```
SATELLITE DATA SOURCES (NASA/ESA/ECMWF)
│
├── MODIS MOD14A1 (daily fire, 1km)
├── MODIS MCD64A1 (monthly burned area, 500m)
├── FIRMS (near-real-time brightness/confidence)
├── ERA5-Land (monthly climate reanalysis, 9km)
├── MODIS MOD13A2 (16-day NDVI/EVI, 1km)
├── MODIS MOD15A2H (8-day LAI/FPAR, 500m)
├── MODIS MCD12Q1 (annual land cover, 500m)
├── SRTM DEM (30m topography, static)
└── WorldPop 2020 (100m population, static)
        │
        ▼
[GEE_WesternGhats_AllParameters.js]
• Study area: 4 Western Ghats ecoregions
• 4 temporal blocks (2003–2008, 2009–2014, 2015–2020, 2021–2025)
• Computes 36 features per pixel-block combo
• Stratified sampling: 5,000 fire + 5,000 non-fire per block
• Exports: 4 CSVs × 10,000 rows = ~40,000 samples
        │
        ▼
[AGFE_Fire_v4_Doc3_BIPE_Colab.ipynb]
│
├── Section 2:  Load 4 CSVs → unified df_all (~40k rows)
├── Section 3:  Spatial thinning (1km min dist, cKDTree)
├── Section 4:  Class balance check (~50:50 is healthy)
├── Section 5:  Harmonization
│   ├── Pass 1: Pearson correlation filter (|r|>0.75)
│   └── Pass 2: VIF screening iterative (VIF>10)
├── Section 6:  Prior-block fire history (KEY INNOVATION)
│   ├── prev_* lag features (pixel-to-pixel matching by lat/lon key)
│   ├── fire_recurrence (count of blocks with fire)
│   ├── fire_trend_delta (change in fire count)
│   └── neighbor_fire_5km (5km spatial fire history)
├── Section 7:  Temporal delta features (Δ per environmental feature)
├── Section 8:  ONI/IOD climate indices + interaction terms
├── Section 9:  Final feature assembly + leakage guard
├── Section 10: Temporal split (Blocks 1-3 train, Block 4 test)
├── Section 11: SMOTE on training set
├── Section 12: StandardScaler (fit on train, transform both)
├── Sections 13-17: Train 5 models with Optuna (30 trials each)
│   ├── Random Forest (sklearn)
│   ├── XGBoost
│   ├── CatBoost
│   ├── LightGBM
│   └── MLP Neural Network
├── Section 18: SHAP explainability (LightGBM TreeSHAP)
├── Section 19: Blockwise pattern visualization
├── Section 20: Save all models + data to disk
└── Section 21: Evaluation metrics + publication plots
        │
        ▼
test_results_with_coords.csv
• y_true, pred_RF, pred_XGB, pred_CAT, pred_LGB, pred_MLP
• latitude, longitude for each test sample
• 2,262 GT fires | 1,986 RF predicted fires
        │
        ▼
[GEE_RF_FirePrediction_Visualization.js]
• Hardcode coordinates from CSV into JS arrays
• coordsToFC(): arrays → GEE FeatureCollections
• Spatial overlap (1km buffer): TP / FP / FN detection sets
• 5 map layers: Ground Truth (blue), RF (red), TP (yellow),
                FP (orange), FN (purple)
• Background: MODIS fire heatmap + NDVI vegetation
• UI legend panel at bottom-left
• Interactive toggle per layer
```

---

## 11. Key Scientific Findings (from the project)

| Finding | What it means |
|---|---|
| **63.1% of Block 4 fires had prior fire history** | Fire locations are persistent — historical burning is the strongest predictor |
| **VIF filtering** removed highly redundant weather features | Keeps model interpretable and prevents overfitting to correlated inputs |
| **Strict temporal split** (no shuffling) | Ensures the reported metrics represent realistic future-prediction performance |
| **1km sampling resolution** | Matches the spatial scale of MODIS fire detection, avoids false precision |
| **FWI_proxy** is a top SHAP feature | Confirms atmospheric fire weather conditions are the primary driver |
| **NDVI_min** high SHAP importance | Seasonal minimum greenness (driest moment) = key fuel dryness proxy |
| **5 models evaluated** | Allows ensemble building and understanding of model-specific biases |

---

## 12. Why the Visualization Matters for Proof/Explanation

The three-layer plot (GT=blue, RF=red, TP=yellow) is the **visual proof** that:
1. The model has learned real fire patterns — yellow zones align with known fire hotspot corridors in Karnataka, Maharashtra, and the Sahyadri mountain range.
2. FP (orange) points reveal where the model is overcautious — often near agricultural areas with persistent high-risk features.
3. FN (purple) points show hard cases — often in remote areas with poor prior fire history or one-time events.

Together, the three files form a **complete reproducible research pipeline**:
- [GEE_WesternGhats_AllParameters.js](file:///home/yaswanth/Desktop/ors%20project/GEE_WesternGhats_AllParameters.js) → data collection
- `AGFE_Fire_v4_Doc3_BIPE_Colab.ipynb` → model training + evaluation
- [GEE_RF_FirePrediction_Visualization.js](file:///home/yaswanth/Desktop/ors%20project/GEE_RF_FirePrediction_Visualization.js) → spatial result visualization
