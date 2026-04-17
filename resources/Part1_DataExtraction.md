# AGFE-Fire v4 — Deep Explanation: Part 1 of 3
# 🌍 Google Earth Engine Data Extraction ([GEE_WesternGhats_AllParameters.js](file:///home/yaswanth/Desktop/ors%20project/GEE_WesternGhats_AllParameters.js))

---

## 1. What is This Script Doing? (Big Picture)

This GEE script is the **data factory** for the entire project. It queries NASA/ESA satellite archives, computes derived indices, and exports a **tabular CSV dataset** that will later be used to train and test a fire prediction ML model.

The output is **~40,000 rows × 36 columns** representing spatial samples across the Western Ghats from 2003–2025.

---

## 2. Study Area Definition

```js
var ecoregions = ee.FeatureCollection("RESOLVE/ECOREGIONS/2017");
var westernGhats = ecoregions.filter(ee.Filter.or(
  ee.Filter.eq('ECO_NAME', 'South Western Ghats moist deciduous forests'),
  ee.Filter.eq('ECO_NAME', 'North Western Ghats moist deciduous forests'),
  ee.Filter.eq('ECO_NAME', 'South Western Ghats montane rain forests'),
  ee.Filter.eq('ECO_NAME', 'North Western Ghats montane rain forests')
));
```

- The **RESOLVE Ecoregions 2017** globally-standardized dataset is used (not a hand-drawn polygon).
- Exactly **4 named ecoregions** are selected — both North and South variants of two forest types.
- Together they form the complete Western Ghats biodiversity hotspot (~160,000 km²).
- `studyArea = westernGhats.geometry()` becomes the spatial mask for every subsequent query.

**Why this matters:** Using ecoregion boundaries rather than a state/country polygon means you include ecologically relevant land — forest types actually at risk of fire — and exclude non-forest areas.

---

## 3. Temporal Block Design (Prof. Kiran's Framework)

```
Block 1: 2003-01-01 → 2008-12-31  →  TRAIN
Block 2: 2009-01-01 → 2014-12-31  →  TRAIN
Block 3: 2015-01-01 → 2020-12-31  →  TRAIN
Block 4: 2021-01-01 → 2025-12-31  →  TEST
```

Each block is ~5–6 years, which corresponds to approximately **one full ENSO (El Niño–Southern Oscillation) cycle**. This is scientifically deliberate:

- ENSO drives monsoon variability, which drives drought and fire risk in India.
- A 5-year block captures both El Niño (dry) and La Niña (wet) conditions.
- **Blocks 1–3 are training data** (2003–2020, 18 years of history).
- **Block 4 is the holdout test set** (2021–2025, truly unseen future data).

This is a **strict temporal split** — no data leakage across blocks.

---

## 4. Static Features (Computed Once, Applied to All Blocks)

### 4a. Topography (SRTM 30m)
```js
var dem = ee.Image("USGS/SRTMGL1_003");
var elevation  = dem.select('elevation').rename('elevation');
var slope      = ee.Terrain.products(dem).select('slope').rename('slope_deg');
var aspect     = ee.Terrain.products(dem).select('aspect').rename('aspect_deg');
```

| Band | Source | Why it matters for fire |
|------|--------|------------------------|
| **elevation** | SRTM DEM | Higher elevation = cooler, wetter = less fire |
| **slope_deg** | Terrain analysis | Fire spreads 2× faster uphill per 10° slope |
| **aspect_deg** | Terrain analysis | South-facing slopes (India) drier = more fire-prone |
| **TWI** | Computed | Topographic Wetness Index — water accumulation pattern |

**TWI computation:**
```js
var slopeRad = slope.multiply(Math.PI).divide(180);
var twi = slopeRad.tan().max(0.001).pow(-1).log().rename('TWI');
```
TWI = ln(1 / tan(slope)). Gentle flat areas hold moisture (high TWI = wet). This is a proxy for soil moisture that doesn't require a flow-accumulation raster.

### 4b. Population Density (WorldPop 2020)
```js
var population = ee.ImageCollection("WorldPop/GP/100m/pop")
  .filter(ee.Filter.eq('country', 'IND'))
  .filter(ee.Filter.eq('year', 2020))
  .mosaic().rename('population_density');
```
- Encodes **human ignition risk** — more people → more accidental/deliberate ignitions.
- Single 2020 snapshot used (static) since population changes slowly vs. 5-year blocks.

---

## 5. Per-Block Feature Extraction ([processBlock](file:///home/yaswanth/Desktop/ors%20project/GEE_WesternGhats_AllParameters.js#107-358) function)

This is the core function. For each time block, it queries multiple satellite datasets and computes aggregate statistics. Let me walk through every category.

---

### 5A. Fire Targets — Active Fire (MODIS MOD14A1, daily, 1km)

```js
var mod14 = ee.ImageCollection("MODIS/061/MOD14A1")
  .filterDate(start, end).filterBounds(studyArea);

var fireImages = mod14.select('FireMask').map(function(img) {
  return img.gte(7).rename('fire');  // 7=low, 8=nominal, 9=high confidence
});
var fireOccurrence = fireImages.max().unmask(0).rename('fire_occurrence');
var totalFireCount  = fireImages.sum().unmask(0).rename('total_fire_count');
```

**How `FireMask` works:**
- MODIS Terra satellite passes over India every day.
- MOD14A1 contains a `FireMask` band where pixel values 7, 8, 9 indicate fire with increasing confidence.
- `gte(7)` converts this to binary: 1 = fire detected on that day, 0 = no fire.
- `.max()` across all daily images → **1 if fire detected on ANY day in the block**.
- `.sum()` across all daily images → **count of fire-days** in the block.

**FRP (Fire Radiative Power):**
```js
var frpMean = mod14.select('MaxFRP').mean().unmask(0).rename('FRP_mean_MW');
var frpMax  = mod14.select('MaxFRP').max().unmask(0).rename('FRP_max_MW');
```
FRP in megawatts measures **fire intensity** (how much energy released). Passive fires have low FRP; intense crown fires have high FRP. Used to distinguish large destructive fires from small surface fires.

---

### 5B. Fire Targets — Burned Area (MODIS MCD64A1, monthly, 500m)

```js
var mcd64 = ee.ImageCollection("MODIS/061/MCD64A1")
  .filterDate(start, end).filterBounds(studyArea);

var burnedImages = mcd64.select('BurnDate').map(function(img) {
  return img.gt(0).rename('burned');  // BurnDate > 0 = burned this month
});
var burnedBinary   = burnedImages.max().unmask(0).rename('burned_area_binary');
var burnMonthCount = burnedImages.sum().unmask(0).rename('burn_month_count');
```

**Difference from MOD14A1:**
- MOD14A1 detects *active flames* on any given day (commission-heavy, may miss slow burns).
- MCD64A1 uses post-fire reflectance changes to map *confirmed burned areas* monthly.
- Together they provide complementary fire evidence.

`burn_month_count` = **fire recurrence** proxy — a pixel that burned 5 out of 72 months shows persistent high-risk.

---

### 5C. Fire Targets — FIRMS (Fire Information for Resource Management)

```js
var firms = ee.ImageCollection("FIRMS")
  .filterDate(start, end).filterBounds(studyArea);

var firmsT21  = firms.select('T21').mean().unmask(0).rename('FIRMS_brightness_K');
var firmsConf = firms.select('confidence').mean().unmask(0).rename('FIRMS_confidence');
```

- FIRMS is NASA's near-real-time fire monitoring system using MODIS/VIIRS data.
- `T21` = **brightness temperature** in Kelvin from the 21-μm thermal channel (direct fire heat signature).
- `confidence` = the detection algorithm's confidence score (0–100%).
- Both averaged over the block period — a proxy for **fire intensity and detection reliability**.

---

### 5D. Weather / Climate (ERA5-Land Monthly Aggregated)

```js
var era5 = ee.ImageCollection("ECMWF/ERA5_LAND/MONTHLY_AGGR")
  .filterDate(start, end).filterBounds(studyArea);
```

ERA5-Land is the ECMWF global reanalysis (model-assimilated weather), 9 km resolution, monthly. It covers 1950–present.

#### Temperature
```js
var tempMean = era5.select('temperature_2m').mean().subtract(273.15).rename('temp_mean_C');
var tempMax  = era5.select('temperature_2m').max().subtract(273.15).rename('temp_max_C');
var tempMin  = era5.select('temperature_2m').min().subtract(273.15).rename('temp_min_C');
```
Kelvin → Celsius by subtracting 273.15. The `.mean()`, `.max()`, `.min()` are computed over all months in the block.

#### Precipitation
```js
var precipMean  = era5.select('total_precipitation_sum').mean().multiply(1000);
var precipTotal = era5.select('total_precipitation_sum').sum().multiply(1000);
```
ERA5 stores precipitation in **meters per month**. Multiplying by 1000 → **mm**. `precipTotal` is the entire block's accumulated rainfall; `precipMean` is average monthly rainfall.

#### Wind Components
```js
var uWind = era5.select('u_component_of_wind_10m').mean();  // Eastward
var vWind = era5.select('v_component_of_wind_10m').mean();  // Northward
var windSpeed = uWind.pow(2).add(vWind.pow(2)).sqrt().rename('wind_speed_ms');
var windDir   = vWind.atan2(uWind).multiply(180).divide(Math.PI).add(180);
```
**Wind speed** = √(u² + v²) — Pythagorean combination of the two orthogonal components.  
**Wind direction** = atan2(v, u) converted to meteorological degrees (0°=North, 90°=East).  
Wind drives fire spread — high wind + low humidity = extreme fire behavior.

#### Relative Humidity (Magnus Formula)
```js
var satVP  = airTemp.multiply(17.27).divide(airTemp.add(237.3)).exp().multiply(0.6108);
var actVP  = dewTemp.multiply(17.27).divide(dewTemp.add(237.3)).exp().multiply(0.6108);
var relHumidity = actVP.divide(satVP).multiply(100).min(100).max(0);
```
**Saturation vapor pressure** (es) = max water the air can hold at temperature T.  
**Actual vapor pressure** (ea) = water air currently holds (from dewpoint temperature).  
**RH** = (ea/es) × 100%. Clipped to [0, 100].

#### Vapor Pressure Deficit (VPD)
```js
var vpd = satVP.subtract(actVP).max(0).rename('VPD_kPa');
```
VPD = es − ea = the "drying power" of the atmosphere. High VPD → air aggressively evaporates moisture from plants → dry fuel → fire-prone. **This is one of the most important fire weather variables.**

#### Drought Proxy (Dry Months Count)
```js
var dryMonths = era5.select('total_precipitation_sum').map(function(img) {
  return img.multiply(1000).lt(20).rename('dry');
}).sum().rename('dry_months_count');
```
Counts months with < 20 mm rainfall (standard meteorological "dry month" threshold).

---

### 5E. Vegetation / Fuel

#### NDVI & EVI (MOD13A2, 16-day composite, 1km)
```js
var mod13 = ee.ImageCollection("MODIS/061/MOD13A2")
  .filterDate(start, end).filterBounds(studyArea);

var ndviMean = mod13.select('NDVI').mean().multiply(0.0001).rename('NDVI_mean');
var ndviMin  = mod13.select('NDVI').min().multiply(0.0001).rename('NDVI_min');
var ndviMax  = mod13.select('NDVI').max().multiply(0.0001).rename('NDVI_max');
var ndviStd  = mod13.select('NDVI').reduce(ee.Reducer.stdDev()).multiply(0.0001).rename('NDVI_seasonality');
var eviMean  = mod13.select('EVI').mean().multiply(0.0001).rename('EVI_mean');
```
- **Scale factor 0.0001**: MODIS stores NDVI as integers (e.g., 8000 = 0.8 NDVI).
- **NDVI_mean**: Average greenness → dense forest vs. sparse scrub.
- **NDVI_min**: Driest/most stressed state during the block → fuel dryness signal.
- **NDVI_seasonality (std)**: High variability = deciduous monsoon patterns = dry season fire window.
- **EVI** (Enhanced Vegetation Index): Better than NDVI in dense canopy; less atmosphere-saturated.

#### LAI & FPAR (MOD15A2H, 8-day, 500m)
```js
var mod15 = ee.ImageCollection("MODIS/061/MOD15A2H")
  .filterDate(start, end).filterBounds(studyArea);

var laiMean  = mod15.select('Lai_500m').mean().multiply(0.1).rename('LAI_mean');
var fparMean = mod15.select('Fpar_500m').mean().multiply(0.01).rename('FPAR_mean');
```
- **LAI** (Leaf Area Index, m²/m²): Total leaf area per unit ground area. Dense canopy = high LAI. Scale factor 0.1.
- **FPAR** (Fraction of Absorbed Photosynthetically Active Radiation): Canopy photosynthetic capacity. Scale factor 0.01.
- Both together describe how thick and productive the vegetation is.

#### LFMC Proxy (Live Fuel Moisture Content)
```js
var lfmc = eviMean.divide(
  ee.Image(1).subtract(ndviMean).max(0.01)
).rename('LFMC_proxy');
```
**Formula: LFMC_proxy = EVI / (1 − NDVI)**

This is a GEE-computable approximation of fuel moisture:
- **High EVI + High NDVI** → numerator large, denominator small → high LFMC → wet fuel → less fire risk.
- **Low EVI + Low NDVI** → low numerator and larger denominator → low LFMC → dry fuel → fire-prone.

---

### 5F. Land Cover (MODIS MCD12Q1 — IGBP Classification)
```js
var lcYear = Math.min(startYear + 2, 2022);  // cap at available year
var landCover = ee.ImageCollection("MODIS/061/MCD12Q1")
  .filter(ee.Filter.calendarRange(lcYear, lcYear, 'year'))
  .first()
  .select('LC_Type1')
  .rename('land_cover');
```
- **LC_Type1** uses the IGBP classification (17 classes: evergreen forest, deciduous forest, savanna, grassland, cropland, urban, etc.).
- Year is set 2 years into the block (stable mid-period snapshot), capped at 2022 (latest available).
- Forest types (class 1–5) have different fire behavior than shrublands (class 6–7) or croplands (class 12).

---

### 5G. Cross-Modal Interaction Features (Doc4 Methodology)

These are **engineered features** that multiply signals from different domains to capture compound risk. This is a key methodological contribution.

#### 1. Terrain × Vegetation
```js
var terrainVeg = slope.multiply(ee.Image(1).subtract(ndviMean)).rename('terrain_x_veg');
```
- **Slope × (1 − NDVI)**: High slope + low NDVI = bare steep hillside = fire spreads fast uphill on dry fuel.
- Captures the multiplicative interaction between topographic fire-spread potential and dry fuel availability.

#### 2. Climate × Fuel
```js
var climateFuel = tempMean.multiply(ee.Image(1).subtract(ndviMean)).rename('climate_x_fuel');
```
- **Temperature × (1 − NDVI)**: Hot air + dry vegetation = ignition risk.
- Captures the hot-dry compound condition.

#### 3. Fire Weather Index (FWI) Proxy
```js
var fwiProxy = tempMean.multiply(windSpeed).divide(precipMean.add(1)).rename('FWI_proxy');
```
- **Formula: (Temp × Wind) / (Precip + 1)**: Mimics the Canadian FWI structure.
- Hot + windy + no rain = extreme fire weather.
- +1 prevents division-by-zero in dry months.

#### 4. Dryness × Fuel
```js
var drynessVeg = vpd.multiply(laiMean.max(0.1).pow(-1)).rename('dryness_x_fuel');
```
- **VPD × (1/LAI)**: High atmospheric drying demand + sparse canopy = extreme fuel stress.
- Captures the atmospheric pull on leaf moisture for thin canopies (most vulnerable).

---

## 6. Stratified Sampling — Creating the Training Dataset

```js
var sampled = allBands.stratifiedSample({
  numPoints: 5000,            // 5000 fire + 5000 non-fire = 10,000 per block
  classBand: 'fire_occurrence',
  region: studyArea,
  scale: 1000,                // 1km resolution (matches MODIS fire data)
  seed: 42,
  geometries: true            // keep lat/lon coordinates
});
```

**Why stratified?** In reality, fire pixels are rare (~5–10% of the Western Ghats). A random sample would give 90%+ non-fire = class imbalance problem for ML.

**Stratified sampling** draws exactly equal numbers from each class:
- 5,000 pixels where `fire_occurrence = 1`
- 5,000 pixels where `fire_occurrence = 0`
- Result: **perfectly balanced 50:50 dataset per block**

Each sample keeps all 36 feature band values at its location + the lat/lon coordinates.

**Scale = 1000m**: Sampling at 1km resolution matches the MODIS fire product (MOD14A1) native resolution. This is the reference grid.

---

## 7. Coordinate Attachment and Export

```js
sampled = sampled.map(function(f) {
  var coords = f.geometry().coordinates();
  return f
    .set('block', block.name)
    .set('block_role', block.role)
    .set('longitude', coords.get(0))
    .set('latitude', coords.get(1));
});

Export.table.toDrive({
  collection: data,
  description: 'WG_AGFE_' + block.name,
  fileNamePrefix: 'WG_AGFE_' + block.name,
  folder: 'AGFE_Fire_WesternGhats',
  fileFormat: 'CSV'
});
```

- Coordinates are explicitly saved as `longitude` and `latitude` columns.
- Each block exports as a **separate CSV** to Google Drive.
- 4 CSVs × 10,000 rows = **~40,000 total samples**.

---

## 8. Final Feature Summary (36 columns)

| Category | Count | Key Features |
|---|---|---|
| 🔥 Fire Targets | 8 | fire_occurrence *(label)*, total_fire_count, FRP_mean/max, burned_area_binary, burn_month_count, FIRMS_brightness_K, FIRMS_confidence |
| 🌡️ Weather | 10 | temp_mean/max/min_C, precip_mean/total_mm, wind_speed_ms, wind_direction_deg, relative_humidity_pct, VPD_kPa, dry_months_count |
| 🌿 Vegetation | 8 | NDVI_mean/min/max/seasonality, EVI_mean, LAI_mean, FPAR_mean, LFMC_proxy |
| ⛰️ Topography | 4 | elevation, slope_deg, aspect_deg, TWI |
| 👤 Human | 1 | population_density |
| 🔗 Cross-Modal | 4 | terrain_x_veg, climate_x_fuel, FWI_proxy, dryness_x_fuel |
| 🗺️ Land Cover | 1 | land_cover (IGBP class) |

> **`fire_occurrence`** is the **target/label** for ML. All other fire columns (FRP, burned_area, etc.) are also targets/diagnostic features — they are **never used as ML features** to avoid data leakage.
