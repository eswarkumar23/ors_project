# AGFE-Fire v4: Complete Dataset Documentation
## Adaptive Group-Weighted Fusion Ensemble for Forest Fire Vulnerability
### Western Ghats Biogeographic Zone, India (2003–2025)

---

## Table of Contents

1. [Why This Study?](#1-why-this-study)
2. [Study Area: Western Ghats](#2-study-area-western-ghats)
3. [Why MODIS Satellite?](#3-why-modis-satellite)
4. [Temporal Design: 2003–2025](#4-temporal-design-20032025)
5. [5-Year Temporal Blocks](#5-five-year-temporal-blocks)
6. [Data Sources Overview](#6-data-sources-overview)
7. [FIRE PARAMETERS — The Targets (What We Predict)](#7-fire-parameters--the-targets)
8. [WEATHER PARAMETERS — Climate Drivers](#8-weather-parameters--climate-drivers)
9. [VEGETATION PARAMETERS — Fuel Characteristics](#9-vegetation-parameters--fuel-characteristics)
10. [TOPOGRAPHY PARAMETERS — Terrain Influence](#10-topography-parameters--terrain-influence)
11. [HUMAN PARAMETERS — Anthropogenic Factors](#11-human-parameters--anthropogenic-factors)
12. [CROSS-MODAL INTERACTION FEATURES](#12-cross-modal-interaction-features)
13. [LAND COVER](#13-land-cover)
14. [Sampling Strategy](#14-sampling-strategy)
15. [Final Dataset Structure](#15-final-dataset-structure)
16. [Parameter Summary Table](#16-parameter-summary-table)
17. [References](#17-references)

---

## 1. Why This Study?

### The Problem

India loses **thousands of square kilometers of forest to fire every year**. Forest fires:
- Destroy biodiversity and wildlife habitats
- Release massive amounts of CO₂ (climate change feedback)
- Cause soil degradation and landslides
- Threaten livelihoods of forest-dependent communities
- Reduce air quality across entire regions

### The Gap

Existing fire prediction studies for India suffer from:
- **Short time windows** (5–10 years) — miss long-term climate cycles like ENSO
- **Shallow spatial coverage** (all of India at once) — different regions have fundamentally different fire drivers
- **Limited parameters** — many studies use only NDVI + Temperature, ignoring fuel moisture, wind, human factors

### Our Approach

We build a **22-year, multi-parameter dataset** (2003–2025) for the **Western Ghats** that captures:
- **Fire occurrence** (did it burn?) — location prediction
- **Fire intensity** (how strong?) — FRP in megawatts
- **Burned area** (how much?) — extent in pixels

Using **36 parameters** across 6 categories: fire, weather, vegetation, topography, human, and their interactions.

---

## 2. Study Area: Western Ghats

### What Are the Western Ghats?

The Western Ghats (also called Sahyadri) is a **1,600 km mountain chain** running parallel to India's western coast, from Gujarat to Tamil Nadu. It is:
- A **UNESCO World Heritage Site** (2012)
- One of the world's **8 "hottest biodiversity hotspots"**
- Home to **7,402 species of flowering plants** (of which 5,588 are endemic)
- Covers parts of **6 states**: Gujarat, Maharashtra, Goa, Karnataka, Kerala, Tamil Nadu

### Why Western Ghats for Fire Study?

| Reason | Detail |
|--------|--------|
| **Ecological importance** | UNESCO biodiversity hotspot — fire damage here is irreplaceable |
| **Diverse fire regimes** | Ranges from moist evergreen (low fire) to dry deciduous (high fire) |
| **Human pressure** | Encroachment, plantations, tourism — anthropogenic ignition sources |
| **Climate vulnerability** | Monsoon variability, ENSO impacts on rainfall patterns |
| **Data availability** | Well-covered by MODIS (no cloud-free gaps unlike NE India) |
| **Manageable scale** | Following Prof. Kiran's "decrease spatial, increase temporal" directive |

### 4 Ecoregions Used

We use the **RESOLVE Ecoregions 2017** dataset to define the Western Ghats boundary:

| Ecoregion | Location | Forest Type | Fire Character |
|-----------|----------|-------------|----------------|
| **South Western Ghats moist deciduous forests** | Kerala, Karnataka, Tamil Nadu hills | Moist deciduous with teak, rosewood | Moderate fire — dry season only |
| **North Western Ghats moist deciduous forests** | Maharashtra, Goa, N. Karnataka | Moist deciduous with bamboo thickets | Higher fire — longer dry season |
| **South Western Ghats montane rain forests** | High elevation Nilgiris, Anamalais | Shola forests + grasslands | Grassland fires, rare forest fires |
| **North Western Ghats montane rain forests** | Mahabaleshwar, Amboli plateaus | Semi-evergreen montane | Least fire-prone, but increasing |

> **Source**: `ee.FeatureCollection("RESOLVE/ECOREGIONS/2017")`

---

## 3. Why MODIS Satellite?

### What is MODIS?

**MODIS** (Moderate Resolution Imaging Spectroradiometer) is a sensor aboard two NASA satellites:
- **Terra** — launched December 1999, crosses equator at ~10:30 AM
- **Aqua** — launched May 2002, crosses equator at ~1:30 PM

Together, they observe **every point on Earth at least 4 times per day**.

### MODIS vs VIIRS — Why We Chose MODIS

| Feature | MODIS | VIIRS |
|---------|-------|-------|
| Available from | **2000 (Terra), 2002 (Aqua)** | 2012 (Suomi-NPP) |
| Usable for our study | **2003–2025 (22 years)** | 2012–2025 (13 years only) |
| Fire pixel resolution | 1 km | 375 m |
| Temporal consistency | ✅ Same sensor, 22 years | ❌ Only 13 years |
| ENSO cycles captured | **4–5 complete cycles** | 2–3 cycles (insufficient) |
| Climate trend detection | ✅ 2+ decades | ❌ Too short |

**Prof. Kiran's directive**: *"We need 2–3 decades to capture climate influence on fire. MODIS gives us this. VIIRS resolution is better, but temporal consistency matters more."*

### What is Google Earth Engine (GEE)?

All our data is accessed through **Google Earth Engine** — a cloud computing platform that:
- Hosts **petabytes** of satellite imagery (including all MODIS products)
- Processes data on Google's servers (no need to download raw images)
- Exports clean, analysis-ready tables (CSV)

---

## 4. Temporal Design: 2003–2025

### Why 22 Years?

| Reason | Explanation |
|--------|-------------|
| **ENSO cycle = 4–5 years** | El Niño/La Niña oscillation controls Indian monsoon → controls drought → controls fire. We need 4–5 full cycles to learn this pattern |
| **Climate trends** | Short windows (5–10 years) can't distinguish trend from noise. 22 years shows real directional change |
| **Land use change** | Forests don't change overnight. Deforestation, road construction, urbanization happen over decades |
| **Vegetation recovery** | After a fire, forest takes 5–15 years to recover. 22 years captures multiple fire-recovery cycles |
| **MODIS consistency** | Collection 6.1 fire products are consistent from 2003 onward |

### What is ENSO and Why Does It Matter for Indian Fires?

**ENSO** = El Niño–Southern Oscillation. A natural climate cycle in the tropical Pacific Ocean:

```
El Niño (warm phase):
  Pacific Ocean warms → Indian monsoon WEAKENS → less rain → DROUGHT → MORE FIRES

La Niña (cool phase):
  Pacific Ocean cools → Indian monsoon STRENGTHENS → more rain → wet forests → FEWER FIRES

Neutral:
  Normal monsoon conditions
```

**The connection to Western Ghats fire:**
- El Niño years (e.g., 2004–05, 2009–10, 2015–16, 2023–24): Reduced monsoon → dry fuel → more fires
- La Niña years (e.g., 2007–08, 2010–12, 2020–23): Strong monsoon → wet fuel → fewer fires

The **Oceanic Niño Index (ONI)** measures this:
- ONI > +0.5°C for 5 months = El Niño
- ONI < −0.5°C for 5 months = La Niña

---

## 5. Five-Year Temporal Blocks

### Prof. Kiran's Key Insight

*"Pixels change over time. A forest pixel in 2003 is not the same pixel in 2020. Check for every 5 years — the fire patterns, the drivers, everything shifts."*

### Block Design

| Block | Period | Years | ENSO Events | Role |
|-------|--------|-------|-------------|------|
| **Block 1** | 2003–2008 | 6 years | El Niño 2004–05, La Niña 2007–08 | TRAIN |
| **Block 2** | 2009–2014 | 6 years | El Niño 2009–10, La Niña 2010–12 | TRAIN |
| **Block 3** | 2015–2020 | 6 years | Strong El Niño 2015–16, La Niña 2017–18 | TRAIN |
| **Block 4** | 2021–2025 | 5 years | La Niña 2021–23, El Niño 2023–24 | **TEST** |

### Why This Block Design?

1. **Each block ≈ one ENSO cycle** — the model sees the full El Niño → La Niña → Neutral pattern in each block
2. **Pixel change detection** — compare the same location across blocks to see how fire risk evolves
3. **Temporal generalization test** — train on past (2003–2020), predict future (2021–2025)
4. **Progressive training** — test if more historical data improves prediction

### What We'll Analyze Per Block

```
For each 5-year block, at each pixel location:
  ├── Did this pixel burn? (fire occurrence)
  ├── How many times? (fire frequency)
  ├── How intense? (FRP)
  ├── How much area burned? (burned area)
  ├── What was the vegetation state? (NDVI, LAI)
  ├── What was the climate? (temperature, rainfall)
  ├── What was the human pressure? (population)
  └── Has any of this changed from the previous block?
```

---

## 6. Data Sources Overview

All data is accessed via **Google Earth Engine (GEE)** or external sources:

| # | Dataset | GEE Asset ID | Native Resolution | Temporal Res. | What It Provides |
|---|---------|-------------|-------------------|---------------|------------------|
| 1 | MODIS Active Fire | `MODIS/061/MOD14A1` | 1 km | Daily | Fire detection, FRP |
| 2 | MODIS Burned Area | `MODIS/061/MCD64A1` | 500 m | Monthly | Which pixels burned |
| 3 | NASA FIRMS | `FIRMS` (GEE) | 1 km | Daily | Fire brightness, confidence |
| 4 | ERA5-Land Reanalysis | `ECMWF/ERA5_LAND/MONTHLY_AGGR` | ~9 km | Monthly | Weather variables |
| 5 | MODIS Vegetation | `MODIS/061/MOD13A2` | 1 km | 16-day | NDVI, EVI |
| 6 | MODIS LAI/FPAR | `MODIS/061/MOD15A2H` | 500 m | 8-day | Leaf area, photosynthesis |
| 7 | SRTM DEM | `USGS/SRTMGL1_003` | 30 m | Static | Elevation |
| 8 | WorldPop | `WorldPop/GP/100m/pop` | 100 m | Annual | Population density |
| 9 | MODIS Land Cover | `MODIS/061/MCD12Q1` | 500 m | Annual | Forest type |
| 10 | RESOLVE Ecoregions | `RESOLVE/ECOREGIONS/2017` | Vector | Static | Study boundary |

---

## 7. FIRE PARAMETERS — The Targets

*These are what we predict. They answer: Where? How often? How intense? How much?*

### 7.1 Fire Occurrence (Binary: 0 or 1)

| Property | Detail |
|----------|--------|
| **Column name** | `fire_occurrence` |
| **Source** | MODIS MOD14A1 → `FireMask` band |
| **Values** | 0 = No fire detected in this block, 1 = Fire detected at least once |
| **How computed** | `FireMask` values 7, 8, or 9 indicate fire → any pixel with at least one such detection = 1 |
| **Resolution** | 1 km × 1 km pixel |
| **What it means** | This is the **primary target** for our classification model. "Was this pixel ever on fire during this 5-year block?" |

**How MODIS detects fire:**
MODIS uses two thermal infrared channels (4 µm and 11 µm) to detect fire. The algorithm:
1. Identifies pixels significantly hotter than their surroundings
2. Applies contextual tests — comparing each pixel to its 8 neighbors
3. Rejects false alarms (sun glint, hot desert, volcanic activity)
4. Assigns confidence: 7 = low, 8 = nominal, 9 = high

**Why binary (not continuous)?**
- A pixel either burned or didn't — this is a **classification problem**
- Probability of fire (from the model) gives continuous output even though the target is binary
- Aligns with Doc1, Doc2, Doc3 methodologies

---

### 7.2 Total Fire Count

| Property | Detail |
|----------|--------|
| **Column name** | `total_fire_count` |
| **Source** | MODIS MOD14A1 → `FireMask` band |
| **Values** | 0, 1, 2, 3, … (count of fire-detected days) |
| **How computed** | Sum of all days where `FireMask ≥ 7` in the block period |
| **What it means** | **Fire recurrence** — how many times the same pixel burned. A pixel with fire_count = 20 is a chronic fire hotspot; fire_count = 1 may be an isolated incident |

**Why this matters:**
- Some pixels burn once and recover — **low recurrence**
- Some pixels burn every year in the same season — **chronic fire**
- Fire management strategies are completely different for these two cases
- This can be used as a **secondary target** for regression or as a **feature** for the binary model

---

### 7.3 FRP — Fire Radiative Power (Mean, in MW)

| Property | Detail |
|----------|--------|
| **Column name** | `FRP_mean_MW` |
| **Source** | MODIS MOD14A1 → `MaxFRP` band |
| **Unit** | Megawatts (MW) |
| **Values** | 0 (no fire) to >1000 MW (extreme fire) |
| **How computed** | Average of all `MaxFRP` values across the block period |
| **Resolution** | 1 km pixel |

**What is FRP?**

Fire Radiative Power measures the **rate of energy release** by a fire. It is derived from the 4 µm channel brightness temperature:

```
FRP ∝ (T_fire⁴ - T_background⁴) × pixel_area
```

**Interpretation:**
| FRP Range | Fire Type | Example |
|-----------|-----------|---------|
| 0–10 MW | Small ground fire | Agricultural stubble burning |
| 10–50 MW | Moderate surface fire | Undergrowth fire in deciduous forest |
| 50–200 MW | Intense fire | Crown fire in dense forest |
| >200 MW | Extreme fire | Firestorm, massive wildfire |

**Why we include FRP:**
- FRP indicates **fire intensity** — a critical variable for damage assessment
- Low FRP fires may benefit ecosystems (controlled burns)
- High FRP fires cause irreversible damage (soil sterilization, canopy destruction)
- FRP correlates with **emissions** — used to estimate CO₂, PM2.5 from fires

---

### 7.4 FRP — Fire Radiative Power (Maximum, in MW)

| Property | Detail |
|----------|--------|
| **Column name** | `FRP_max_MW` |
| **Source** | MODIS MOD14A1 → `MaxFRP` band |
| **How computed** | Maximum FRP value recorded at this pixel across the entire block |
| **What it means** | The **worst-case fire intensity** this pixel experienced. Even if a pixel usually has small fires, one extreme event matters for damage assessment |

---

### 7.5 Burned Area (Binary)

| Property | Detail |
|----------|--------|
| **Column name** | `burned_area_binary` |
| **Source** | MODIS MCD64A1 → `BurnDate` band |
| **Values** | 0 = never burned, 1 = burned at least once |
| **How computed** | `BurnDate > 0` means the pixel burned that month. Max across all months = "ever burned?" |
| **Resolution** | 500 m (resampled to 1 km during extraction) |

**How MCD64A1 Works (Different from MOD14A1!):**

MOD14A1 (active fire) catches fires **while they're burning** — like a snapshot.
MCD64A1 (burned area) detects the **scar left after the fire** — using surface reflectance changes:

1. Before fire: High reflectance in near-infrared (healthy vegetation)
2. After fire: Low reflectance in near-infrared (charred surface)
3. Algorithm detects this **spectral change** and marks the pixel as "burned"
4. Assigns the **ordinal day of year** when the burn occurred

**Why we need BOTH active fire AND burned area:**
| Scenario | Active Fire (MOD14A1) | Burned Area (MCD64A1) |
|----------|----------------------|----------------------|
| Small fire under cloud cover | ❌ Missed (cloud blocks satellite view) | ✅ Detected (burn scar visible after cloud clears) |
| Fast-moving fire at night | ✅ Detected by thermal sensor | ❌ May miss if area is small |
| Smoldering fire lasting days | ✅ Multiple detections | ✅ Single burn scar |
| Large fire over many pixels | ✅ But may undercount area | ✅ Accurate area mapping |

---

### 7.6 Burn Month Count

| Property | Detail |
|----------|--------|
| **Column name** | `burn_month_count` |
| **Source** | MODIS MCD64A1 → `BurnDate` band |
| **Values** | 0, 1, 2, 3, … (number of months with burning) |
| **How computed** | Sum of months where at least one day had `BurnDate > 0` |
| **What it means** | **Burn recurrence at larger scale**. If burn_month_count = 3 in a 5-year block, this pixel burned in 3 different months — possibly 3 different years |

---

### 7.7 FIRMS Brightness Temperature (Kelvin)

| Property | Detail |
|----------|--------|
| **Column name** | `FIRMS_brightness_K` |
| **Source** | FIRMS → `T21` band |
| **Unit** | Kelvin (K) |
| **Typical range** | 300 K (no fire) to >500 K (intense fire) |
| **How computed** | Mean brightness temperature from MODIS Channel 21 (3.9 µm) |

**What is brightness temperature?**

When MODIS looks at the Earth, its thermal sensor measures how much infrared radiation a pixel emits. This is converted to **brightness temperature** — the temperature a perfect blackbody would need to emit that much radiation.

- Background (forest, no fire): ~290–310 K
- Small fire within the pixel: ~330–400 K (sub-pixel fire raises the average)
- Large/intense fire: >450 K

**Why Channel 21 (3.9 µm)?**
- This wavelength is extremely sensitive to **hot objects** — even a fire covering just 0.01% of a 1 km pixel is detectable
- It can detect fires as small as **0.1 hectares** (1000 m²)

---

### 7.8 FIRMS Confidence (%)

| Property | Detail |
|----------|--------|
| **Column name** | `FIRMS_confidence` |
| **Source** | FIRMS → `confidence` band |
| **Unit** | Percentage (0–100%) |
| **How computed** | Mean detection confidence across all fire observations at this pixel |

**What confidence means:**
| Range | Category | What it indicates |
|-------|----------|-------------------|
| 0–30% | Low confidence | Might be a false alarm (hot bare soil, industrial heat source) |
| 30–80% | Nominal confidence | Likely a real fire, but some uncertainty |
| 80–100% | High confidence | Very likely a real vegetation fire |

**How it's calculated (inside the MODIS algorithm):**
- Brightness temperature difference between fire pixel and background
- Number of contextual tests passed
- View angle of the satellite
- Time of day (daytime fires have more false alarms from sun glint)

---

## 8. WEATHER PARAMETERS — Climate Drivers

*Weather controls WHEN fires start and HOW they spread. All from ERA5-Land reanalysis.*

### What is ERA5-Land?

**ERA5-Land** is produced by the European Centre for Medium-Range Weather Forecasts (ECMWF). It is a **reanalysis** product — meaning it combines:
- Satellite observations
- Weather station ground measurements
- Weather model physics

To produce a **complete, gap-free, physically consistent** weather record globally. It's not raw observation — it's the best estimate of "what weather actually was" at every point on Earth, every hour, since 1950.

We use the **monthly aggregated** version (`ERA5_LAND/MONTHLY_AGGR`), which provides monthly statistics computed from hourly data.

---

### 8.1 Temperature — Mean (°C)

| Property | Detail |
|----------|--------|
| **Column name** | `temp_mean_C` |
| **Source** | ERA5-Land → `temperature_2m` |
| **Unit** | Degrees Celsius (originally Kelvin, converted by subtracting 273.15) |
| **How computed** | Average of monthly mean temperatures across the block period |
| **Resolution** | ~9 km (0.1° × 0.1°) |

**Why temperature matters for fire:**
- Higher temperature → faster drying of vegetation (fuel)
- Higher temperature → lower relative humidity → fuel ignites more easily
- Higher temperature → more convective activity → lightning ignitions
- Western Ghats dry season (Jan–May): temperatures reach 35–42°C in lowlands

---

### 8.2 Temperature — Maximum (°C)

| Property | Detail |
|----------|--------|
| **Column name** | `temp_max_C` |
| **Source** | ERA5-Land → `temperature_2m` |
| **How computed** | Maximum of all monthly mean temperatures in the block |
| **What it means** | The **hottest month** experienced at this location during the block. Extreme heat events trigger fire more than average temperature |

---

### 8.3 Temperature — Minimum (°C)

| Property | Detail |
|----------|--------|
| **Column name** | `temp_min_C` |
| **Source** | ERA5-Land → `temperature_2m` |
| **How computed** | Minimum monthly temperature in the block |
| **What it means** | Indicates how cold winters get. Cold winters → frost → vegetation die-back → dry fuel accumulation for next fire season. Also: temp_max minus temp_min = **temperature range** (continentality) |

---

### 8.4 Precipitation — Mean Monthly (mm)

| Property | Detail |
|----------|--------|
| **Column name** | `precip_mean_mm` |
| **Source** | ERA5-Land → `total_precipitation_sum` |
| **Unit** | Millimeters per month (originally in meters, multiplied by 1000) |
| **How computed** | Average of monthly total precipitation across the block |
| **What it means** | Long-term average rainfall. The Western Ghats have extreme gradients: windward side gets 3,000–5,000 mm/year, leeward side gets 500–800 mm/year. This gradient drives the fire risk gradient |

**The monsoon connection:**
- Southwest monsoon (June–September): 70–80% of annual rainfall
- Post-monsoon drying (October–December): Vegetation dries out
- Dry season (January–May): Fire season — no rain, hot temperatures
- Low `precip_mean_mm` = drier location = higher fire risk (generally)

---

### 8.5 Precipitation — Total (mm)

| Property | Detail |
|----------|--------|
| **Column name** | `precip_total_mm` |
| **Source** | ERA5-Land → `total_precipitation_sum` |
| **How computed** | Sum of all monthly precipitation across the entire block (5–6 years) |
| **What it means** | **Cumulative water input**. Total rainfall determines total biomass growth → total fuel load. Paradoxically, wetter areas can have MORE fuel to burn in dry years |

---

### 8.6 Wind Speed (m/s)

| Property | Detail |
|----------|--------|
| **Column name** | `wind_speed_ms` |
| **Source** | ERA5-Land → `u_component_of_wind_10m` (east-west) + `v_component_of_wind_10m` (north-south) |
| **Unit** | Meters per second |
| **How computed** | `wind_speed = √(u² + v²)` averaged across the block |

**Why wind matters for fire:**
- Wind supplies **oxygen** to the fire → increases combustion rate
- Wind **carries embers** ahead of the fire front → causes spot fires
- Wind **tilts flames** toward unburned fuel → pre-heats and dries it
- Fire spread rate is roughly proportional to wind speed²
- Western Ghats: strong trade winds in dry season accelerate fire on windward slopes

**Fire spread rate relationship:**
```
At 0 m/s wind:   Fire spreads ~0.5 m/min
At 5 m/s wind:   Fire spreads ~5 m/min
At 15 m/s wind:  Fire spreads ~50 m/min (extremely dangerous)
```

---

### 8.7 Wind Direction (degrees)

| Property | Detail |
|----------|--------|
| **Column name** | `wind_direction_deg` |
| **Source** | ERA5-Land → computed from u and v wind components |
| **Unit** | Degrees (0° = North, 90° = East, 180° = South, 270° = West) |
| **How computed** | `direction = atan2(v, u) × (180/π) + 180` |
| **What it means** | Which direction wind blows FROM. Fires spread fastest downwind. In Western Ghats, southwest monsoon winds → fire spreads northeast during early dry season |

---

### 8.8 Relative Humidity (%)

| Property | Detail |
|----------|--------|
| **Column name** | `relative_humidity_pct` |
| **Source** | ERA5-Land → derived from `temperature_2m` and `dewpoint_temperature_2m` |
| **Unit** | Percentage (0–100%) |
| **How computed** | Using the **Magnus formula**: RH = (e_actual / e_saturation) × 100, where e = 0.6108 × exp(17.27×T / (T+237.3)) |

**Why relative humidity matters for fire:**
- RH directly controls the **moisture content of dead fuel** (leaves, twigs, bark on the ground)
- Below 30% RH: Dead fuel reaches critical flammability — fires start easily
- Below 15% RH: **Red Flag Warning** conditions — any ignition causes rapid fire
- Above 60% RH: Fuel too moist — difficult to sustain fire

**Western Ghats context:**
- Monsoon months (Jun–Sep): RH = 85–95% → almost impossible to burn
- Dry season (Feb–May): RH drops to 20–40% → fire season
- Leeward side: RH is always lower → more fire-prone

---

### 8.9 VPD — Vapor Pressure Deficit (kPa)

| Property | Detail |
|----------|--------|
| **Column name** | `VPD_kPa` |
| **Source** | ERA5-Land → derived from temperature and dewpoint |
| **Unit** | Kilopascals (kPa) |
| **How computed** | `VPD = e_saturation - e_actual` (saturation vapor pressure minus actual vapor pressure) |

**What is VPD?**

VPD measures **how thirsty the atmosphere is** — the difference between how much moisture the air *could* hold and how much it *actually* holds.

```
High VPD (>2 kPa):
  → Atmosphere is very dry
  → Pulls moisture OUT of vegetation (stomata close, leaves dry out)
  → Dead fuel dries rapidly
  → FIRE RISK INCREASES

Low VPD (<0.5 kPa):
  → Atmosphere is nearly saturated
  → Vegetation retains moisture
  → Fuel stays wet
  → FIRE RISK LOW
```

**Why VPD is better than RH alone:**
- RH depends on temperature (same moisture content shows different RH at different temperatures)
- VPD directly measures the **drying power** of the atmosphere
- VPD is increasingly recognized as the **best single predictor** of wildfire risk globally
- Multiple studies (Seager et al. 2015, Williams et al. 2019) show VPD trends explain fire increase better than temperature alone

---

### 8.10 Dry Months Count

| Property | Detail |
|----------|--------|
| **Column name** | `dry_months_count` |
| **Source** | ERA5-Land → derived from `total_precipitation_sum` |
| **Values** | 0 to 60+ (number of months with < 20 mm rainfall in the block) |
| **How computed** | Count of months where monthly precipitation < 20 mm |

**What it means:**
- A **drought severity indicator**
- 20 mm threshold = below this, vegetation experiences significant water stress
- More dry months → longer fire season → more accumulated dry fuel
- Western Ghats windward side: 2–4 dry months/year → 10–24 per block
- Western Ghats leeward side: 6–8 dry months/year → 30–48 per block

---

## 9. VEGETATION PARAMETERS — Fuel Characteristics

*Vegetation is the FUEL that fires burn. These parameters measure how much fuel exists, how dry it is, and how it changes seasonally.*

### What is a Vegetation Index?

Healthy green vegetation reflects a lot of **near-infrared (NIR)** light and absorbs **red** light (for photosynthesis). By comparing these two wavelengths, we can measure vegetation "greenness" from space.

---

### 9.1 NDVI — Normalized Difference Vegetation Index (Mean)

| Property | Detail |
|----------|--------|
| **Column name** | `NDVI_mean` |
| **Source** | MODIS MOD13A2 → `NDVI` band |
| **Unit** | Dimensionless (-1 to +1, typically 0 to 0.9 for vegetation) |
| **Scale factor** | Raw value × 0.0001 |
| **How computed** | Mean of all 16-day NDVI composites across the block |
| **Resolution** | 1 km |

**Formula:**
```
NDVI = (NIR - Red) / (NIR + Red)
```

**Interpretation:**
| NDVI Range | Meaning | Fire Relevance |
|------------|---------|----------------|
| < 0 | Water, snow | Not applicable |
| 0 – 0.1 | Bare soil, rock | No fuel to burn |
| 0.1 – 0.3 | Sparse vegetation, grassland | Burns quickly, low intensity |
| 0.3 – 0.5 | Shrubland, dry deciduous | **Most fire-prone** — enough fuel, dry enough |
| 0.5 – 0.7 | Dense deciduous forest | Moderate fire risk — depends on season |
| 0.7 – 0.9 | Dense evergreen forest | Low fire risk — high moisture (usually) |

**Why NDVI is the most-used fire variable:**
- Available globally since 1981 (AVHRR), 2000 (MODIS)
- Directly measures "how much fuel is there"
- Seasonal NDVI drop (green → brown) = vegetation drying = fire season approaching
- Used in ALL four reference papers (Doc1, Doc2, Doc3, Doc4)

---

### 9.2 NDVI — Minimum

| Property | Detail |
|----------|--------|
| **Column name** | `NDVI_min` |
| **How computed** | Lowest 16-day NDVI value in the block |
| **What it means** | Peak of the dry season — when vegetation is driest and most fire-prone. Lower NDVI_min = more severe drought stress |

---

### 9.3 NDVI — Maximum

| Property | Detail |
|----------|--------|
| **Column name** | `NDVI_max` |
| **How computed** | Highest NDVI in the block |
| **What it means** | Peak of the growing season (monsoon). Higher NDVI_max = more biomass = more potential fuel for the next dry season |

**Paradox of NDVI_max:**
A pixel with NDVI_max = 0.85 grows a LOT of biomass in the monsoon. When this biomass dries out, there's MORE fuel. So:
- **High NDVI_max + Low NDVI_min = MOST DANGEROUS** (lots of fuel that dries severely)
- This is captured by the NDVI_seasonality parameter below

---

### 9.4 NDVI — Seasonality (Standard Deviation)

| Property | Detail |
|----------|--------|
| **Column name** | `NDVI_seasonality` |
| **How computed** | Standard deviation of all NDVI values in the block |
| **What it means** | **How dramatically does vegetation change between seasons?** High seasonality = deciduous forest (green in monsoon, brown in dry season). Low seasonality = evergreen forest (green year-round) |

**Fire connection:**
- High NDVI_seasonality → deciduous → massive fuel load change → fire season
- Low NDVI_seasonality → evergreen → more constant moisture → less fire-prone
- In Western Ghats: dry deciduous teak forests have very high seasonality → very fire-prone

---

### 9.5 EVI — Enhanced Vegetation Index

| Property | Detail |
|----------|--------|
| **Column name** | `EVI_mean` |
| **Source** | MODIS MOD13A2 → `EVI` band |
| **Scale factor** | Raw × 0.0001 |
| **Unit** | Dimensionless (-1 to +1) |

**How EVI differs from NDVI:**
```
EVI = 2.5 × (NIR - Red) / (NIR + 6×Red - 7.5×Blue + 1)
```

| Feature | NDVI | EVI |
|---------|------|-----|
| Saturates in dense canopy? | Yes (stops increasing above NDVI ~0.7) | **No** — remains sensitive in dense forest |
| Atmospheric correction? | Minimal | Yes — uses blue band to reduce aerosol effects |
| Soil background sensitivity? | High | **Reduced** |
| Best for | Sparse-to-moderate vegetation | **Dense tropical forests** |

**Why we need BOTH NDVI and EVI:**
Western Ghats has extremely dense forests. In these areas, NDVI saturates (tops out at ~0.8 and can't distinguish between "dense" and "very dense"). EVI continues to differentiate. We include both for complementary information.

---

### 9.6 LAI — Leaf Area Index

| Property | Detail |
|----------|--------|
| **Column name** | `LAI_mean` |
| **Source** | MODIS MOD15A2H → `Lai_500m` band |
| **Scale factor** | Raw × 0.1 |
| **Unit** | m²/m² (square meters of leaf per square meter of ground) |
| **Typical range** | 0 (bare soil) to 8+ (dense tropical forest) |

**What is LAI?**

Imagine looking straight down at a forest. LAI measures **how many layers of leaves are stacked above each square meter of ground**.

```
LAI = 1: One complete layer of leaves covers the ground
LAI = 3: Three layers stacked — moderate forest
LAI = 6: Six layers — dense tropical forest canopy
```

**Why LAI matters for fire:**
- LAI controls **how much light reaches the forest floor** → affects undergrowth drying
- Low LAI → open canopy → sun reaches ground → ground fuel dries fast → fire-prone
- High LAI → closed canopy → shaded, humid understory → resistant to fire
- After fire: LAI drops → next season has MORE light → different vegetation grows → changes future fire risk
- LAI is used in the cross-modal interaction feature `dryness_x_fuel = VPD × (1/LAI)`

---

### 9.7 FPAR — Fraction of Photosynthetically Active Radiation

| Property | Detail |
|----------|--------|
| **Column name** | `FPAR_mean` |
| **Source** | MODIS MOD15A2H → `Fpar_500m` band |
| **Scale factor** | Raw × 0.01 |
| **Unit** | Fraction (0 to 1) |

**What is FPAR?**

FPAR measures **what fraction of sunlight is absorbed by vegetation for photosynthesis**:
- FPAR = 0: No vegetation (bare soil, water)
- FPAR = 0.5: Vegetation absorbs half the incoming light
- FPAR = 0.9: Dense canopy absorbs almost all light

**Fire connection:**
- High FPAR → active photosynthesis → vegetation is alive and moist → low fire risk
- Low FPAR → dormant vegetation → dry or dead → high fire risk
- Seasonal drop in FPAR signals the end of the growing season = start of fire season

---

### 9.8 LFMC Proxy — Live Fuel Moisture Content

| Property | Detail |
|----------|--------|
| **Column name** | `LFMC_proxy` |
| **Source** | Derived from EVI and NDVI |
| **Unit** | Dimensionless ratio |
| **Formula** | `LFMC_proxy = EVI / (1 - NDVI)` |

**What is Live Fuel Moisture?**

LFMC measures **the water content of living vegetation** as a percentage of dry weight:
- LFMC > 120%: Very moist, won't burn
- LFMC 80–120%: Moderate — will burn under extreme conditions
- LFMC < 80%: **Critical** — vegetation will readily ignite

**Why a proxy, not the real thing?**

True LFMC requires destructive sampling (cut branches, weigh them, dry in oven, weigh again). Satellite proxies using vegetation indices provide a reasonable approximation:
- When EVI is high and NDVI is high → vegetation is photosynthetically active → high moisture
- When EVI drops and (1-NDVI) is large → vegetation stressed → low moisture

---

## 10. TOPOGRAPHY PARAMETERS — Terrain Influence

*Topography is STATIC (doesn't change over time) but permanently influences fire behavior. These are computed once from SRTM digital elevation data.*

### What is SRTM?

The **Shuttle Radar Topography Mission** (2000) used radar from the Space Shuttle Endeavour to map Earth's elevation at **30-meter resolution**. It's the most widely used elevation dataset for scientific research.

---

### 10.1 Elevation (meters)

| Property | Detail |
|----------|--------|
| **Column name** | `elevation` |
| **Source** | USGS SRTM → `elevation` band |
| **Unit** | Meters above sea level |
| **Resolution** | 30 m |
| **Range in Western Ghats** | 0 m (coastal) to ~2,695 m (Anamudi peak) |

**How elevation affects fire:**

| Elevation Band | Western Ghats Context | Fire Character |
|---------------|----------------------|----------------|
| 0–300 m | Coastal plains, laterite plateaus | Moderate — agricultural fires |
| 300–800 m | Dry deciduous foothills | **Highest fire zone** — hot, dry, accessible |
| 800–1500 m | Moist deciduous / semi-evergreen | Moderate — cooler, wetter |
| 1500–2000 m | Montane (shola-grassland mosaic) | **Grassland fires** — frequent but low intensity |
| >2000 m | Alpine grasslands (rare in WG) | Low — too cold, too wet |

**Fire physics:**
- Temperature decreases ~6.5°C per 1000 m → higher = cooler = wetter = less fire
- BUT: higher elevation → stronger winds → fire spreads faster when it does occur
- Fire tends to spread UPHILL faster than downhill (preheating by rising hot air)

---

### 10.2 Slope (degrees)

| Property | Detail |
|----------|--------|
| **Column name** | `slope_deg` |
| **Source** | Derived from SRTM using `ee.Terrain.products()` |
| **Unit** | Degrees (0° = flat, 90° = vertical cliff) |
| **How computed** | Maximum rate of change of elevation from a pixel to its neighbors |

**Why slope is critical for fire:**

Slope is one of the **most important topographic fire variables** because:

```
Fire spreads UPHILL much faster than on flat ground:

Flat (0°):     spread rate × 1.0
15° slope:     spread rate × 2.0
30° slope:     spread rate × 4.0
45° slope:     spread rate × 8.0

This is because:
1. Hot air rises along the slope, pre-heating fuel above
2. Flames lean INTO uphill fuel
3. Convective column creates its own updraft, pulling fire uphill
```

**In Western Ghats:**
- The western escarpment has slopes of 30–60° → extremely fast fire spread
- Valley bottoms (low slope) are fire breaks
- Ridgetops (low slope) accumulate wind → different fire behavior

---

### 10.3 Aspect (degrees)

| Property | Detail |
|----------|--------|
| **Column name** | `aspect_deg` |
| **Source** | Derived from SRTM using `ee.Terrain.products()` |
| **Unit** | Degrees (0° = North-facing, 90° = East, 180° = South, 270° = West) |
| **What it means** | Which direction does the slope face? |

**Why aspect matters for fire in India:**

| Aspect | Sunlight | Moisture | Fire Risk |
|--------|----------|----------|-----------|
| **South-facing** (135°–225°) | Maximum sun exposure | Driest | **Highest** fire risk |
| **West-facing** (225°–315°) | Afternoon sun (hottest) | Dry | High |
| **East-facing** (45°–135°) | Morning sun | Moderate | Moderate |
| **North-facing** (315°–45°) | Least sun | Wettest | **Lowest** fire risk |

In the Western Ghats specifically:
- **Windward (western) slopes** receive monsoon rain → wetter → less fire
- **Leeward (eastern) slopes** are in rain shadow → drier → more fire
- Aspect captures this east-west moisture gradient at the pixel level

---

### 10.4 TWI — Topographic Wetness Index

| Property | Detail |
|----------|--------|
| **Column name** | `TWI` |
| **Source** | Derived from slope |
| **Unit** | Dimensionless (typically 2–20) |
| **Formula** | `TWI = ln(1 / tan(slope))` (simplified; full formula uses upslope contributing area) |

**What is TWI?**

TWI estimates **where water accumulates** in the landscape based on topography:

```
High TWI (>10): Valley bottoms, flat areas → water collects → wet → LOW fire risk
Low TWI (<5):   Ridgetops, steep slopes → water drains away → dry → HIGH fire risk
```

**Why we include TWI:**
- It captures **micro-scale moisture patterns** that NDVI and precipitation miss
- A steep slope can be dry even in a rainy region (water runs off immediately)
- Valley bottoms stay moist even in dry season (groundwater seepage)
- TWI explains why fires burn ridgetops but skip valley floors

---

## 11. HUMAN PARAMETERS — Anthropogenic Factors

*Most forest fires in India are caused by humans — intentionally or accidentally. Human proximity is a key predictor.*

### 11.1 Population Density

| Property | Detail |
|----------|--------|
| **Column name** | `population_density` |
| **Source** | WorldPop 2020 → 100m grid |
| **Unit** | People per 100m × 100m pixel (≈ per hectare) |
| **How computed** | 2020 population count mosaic for India |

**Why population matters for fire:**

In India, **>95% of forest fires are human-caused** (Forest Survey of India reports):
- **Intentional**: Slash-and-burn agriculture (jhum/podu), clearing for grazing, land encroachment
- **Accidental**: Campfires, cigarettes, machinery sparks
- **Negligence**: Burning crop residues near forest edges

```
Higher population near forest → More ignition sources → More fires

BUT: Very high population (urban) → No forest → No fires

The relationship is NON-LINEAR:
  Low pop (remote forest):     Few fires (no ignition source)
  Medium pop (forest fringe):  MOST fires (people + fuel)
  High pop (urban):            No fires (no fuel)
```

> **Note**: Distance to roads and distance to settlements are not directly available as GEE bands. In the Python pipeline stage, these can be computed from OpenStreetMap data or as a future enhancement.

---

## 12. CROSS-MODAL INTERACTION FEATURES

*These combine variables from different categories. They capture physics that single variables miss.*

**Source**: Doc4 (FireRisk-Multi by Yuan et al.) proved these are the **top-3 most important features** in fire prediction.

---

### 12.1 Terrain × Vegetation

| Property | Detail |
|----------|--------|
| **Column name** | `terrain_x_veg` |
| **Formula** | `Slope × (1 - NDVI)` |
| **What it captures** | Steep slope + sparse/dry vegetation = fire spreads fast uphill through dry fuel |

**Interpretation:**
- High slope + low NDVI → very high value → **extreme fire spread risk**
- Flat terrain + green vegetation → near zero → low risk
- This interaction captures what neither slope nor NDVI can alone: a steep slope with dense green forest is NOT high risk; a steep slope with dry grassland IS

---

### 12.2 Climate × Fuel

| Property | Detail |
|----------|--------|
| **Column name** | `climate_x_fuel` |
| **Formula** | `Temperature × (1 - NDVI)` |
| **What it captures** | Hot weather + dry vegetation = high ignition probability |

**Interpretation:**
- 40°C + NDVI 0.1 (dry grassland) → value = 40 × 0.9 = 36 → **extreme fire risk**
- 25°C + NDVI 0.8 (green forest) → value = 25 × 0.2 = 5 → low risk
- Captures the **compound effect** of heat waves hitting already-dry vegetation

---

### 12.3 Fire Weather Index Proxy

| Property | Detail |
|----------|--------|
| **Column name** | `FWI_proxy` |
| **Formula** | `(Temperature × Wind Speed) / (Precipitation + 1)` |
| **What it captures** | Hot + windy + dry = extreme fire weather |

**This approximates the Canadian Fire Weather Index** — the global standard for fire danger rating:
- Numerator: Heat + wind = fire energy and spread
- Denominator: Rain = moisture suppresses fire
- The "+1" prevents division by zero in rainless months

---

### 12.4 Dryness × Fuel

| Property | Detail |
|----------|--------|
| **Column name** | `dryness_x_fuel` |
| **Formula** | `VPD × (1 / LAI)` |
| **What it captures** | Dry atmosphere + thin canopy = ground fuel dries rapidly |

**Interpretation:**
- High VPD + low LAI → open, dry forest → ground fuel exposed to sun and dry air → **highest fire risk at ground level**
- Low VPD + high LAI → dense, humid canopy → shaded, moist understory → low risk
- This is especially relevant for **understory fires** common in Western Ghats deciduous forests

---

## 13. LAND COVER

### 13.1 IGBP Land Cover Type

| Property | Detail |
|----------|--------|
| **Column name** | `land_cover` |
| **Source** | MODIS MCD12Q1 → `LC_Type1` (IGBP classification) |
| **Resolution** | 500 m, annual |
| **Values** | Integer codes 1–17 |

**IGBP Land Cover Classes (relevant for Western Ghats):**

| Code | Class | Western Ghats Example | Fire Relevance |
|------|-------|----------------------|----------------|
| 1 | Evergreen Needleleaf | Rare in WG | — |
| 2 | Evergreen Broadleaf | Wet evergreen forests | Low fire (moist) |
| 4 | Deciduous Broadleaf | **Teak forests, dry deciduous** | **Very high fire** |
| 5 | Mixed Forest | Transitional zones | Moderate |
| 7 | Open Shrublands | Plateau grasslands | Moderate-High |
| 8 | Woody Savannas | Laterite plateaus | High |
| 9 | Savannas | Open grasslands | Moderate |
| 10 | Grasslands | Montane grasslands (shola) | High (grass fires) |
| 12 | Croplands | Adjacent agriculture | Source of ignition |
| 13 | Urban | City edges | Ignition source but no fuel |
| 14 | Cropland/Natural Mosaic | Forest-farm boundary | **Highest human-fire interaction** |

**Why land cover matters:**
- Different vegetation types have fundamentally different **flammability**
- Land cover CHANGES over 22 years (deforestation, plantation expansion)
- Comparing land cover across blocks reveals **land use change → fire risk change**

---

## 14. Sampling Strategy

### The Problem: Imbalanced Data

In any study area, **fire pixels are rare** compared to non-fire pixels. If we randomly sample:
- ~95% of samples would be "no fire"
- ~5% would be "fire"
- ML models would learn to always predict "no fire" and get 95% accuracy — useless!

### Our Solution: Stratified Balanced Sampling

```
For each 5-year block:
  Fire pixels (fire_occurrence = 1):      Sample 5,000 points
  Non-fire pixels (fire_occurrence = 0):  Sample 5,000 points
  ────────────────────────────────────────────────────────
  Total per block:                         10,000 points

Across 4 blocks:
  Block 1 (2003-2008):  10,000
  Block 2 (2009-2014):  10,000
  Block 3 (2015-2020):  10,000
  Block 4 (2021-2025):  10,000
  ────────────────────────────
  Grand Total:           40,000 samples
```

### Parameters of Sampling

| Parameter | Value | Why |
|-----------|-------|-----|
| **Scale** | 1,000 m (1 km) | Matches MODIS fire pixel resolution |
| **Class balance** | 1:1 (fire : non-fire) | Prevents majority-class bias |
| **Seed** | 42 | Reproducibility — same sample every run |
| **Geometries** | true | Keeps lat/lon for spatial analysis and mapping |

---

## 15. Final Dataset Structure

### Each CSV File Contains:

| Column Group | Columns | Count |
|-------------|---------|-------|
| **Metadata** | `block`, `block_role`, `latitude`, `longitude` | 4 |
| **Fire Targets** | `fire_occurrence`, `total_fire_count`, `FRP_mean_MW`, `FRP_max_MW`, `burned_area_binary`, `burn_month_count`, `FIRMS_brightness_K`, `FIRMS_confidence` | 8 |
| **Weather** | `temp_mean_C`, `temp_max_C`, `temp_min_C`, `precip_mean_mm`, `precip_total_mm`, `wind_speed_ms`, `wind_direction_deg`, `relative_humidity_pct`, `VPD_kPa`, `dry_months_count` | 10 |
| **Vegetation** | `NDVI_mean`, `NDVI_min`, `NDVI_max`, `NDVI_seasonality`, `EVI_mean`, `LAI_mean`, `FPAR_mean`, `LFMC_proxy` | 8 |
| **Cross-modal** | `terrain_x_veg`, `climate_x_fuel`, `FWI_proxy`, `dryness_x_fuel` | 4 |
| **Topography** | `elevation`, `slope_deg`, `aspect_deg`, `TWI` | 4 |
| **Human** | `population_density` | 1 |
| **Land Cover** | `land_cover` | 1 |
| **Total** | | **40** |

### File Structure

```
📂 Google Drive / AGFE_Fire_WesternGhats /
│
├── WG_AGFE_Block1_2003_2008.csv    10,000 rows × 40 columns  [TRAIN]
├── WG_AGFE_Block2_2009_2014.csv    10,000 rows × 40 columns  [TRAIN]
├── WG_AGFE_Block3_2015_2020.csv    10,000 rows × 40 columns  [TRAIN]
└── WG_AGFE_Block4_2021_2025.csv    10,000 rows × 40 columns  [TEST]

Total: 40,000 samples × 40 columns
```

---

## 16. Parameter Summary Table

| # | Parameter | Unit | Source | Category | Static/Dynamic | Why Included |
|---|-----------|------|--------|----------|---------------|--------------|
| 1 | fire_occurrence | 0/1 | MOD14A1 | Target | Dynamic | Primary prediction target — did the pixel burn? |
| 2 | total_fire_count | count | MOD14A1 | Target | Dynamic | Fire recurrence — chronic vs isolated |
| 3 | FRP_mean_MW | MW | MOD14A1 | Target | Dynamic | Average fire intensity |
| 4 | FRP_max_MW | MW | MOD14A1 | Target | Dynamic | Peak fire intensity — worst case |
| 5 | burned_area_binary | 0/1 | MCD64A1 | Target | Dynamic | Did the burn scar appear? |
| 6 | burn_month_count | count | MCD64A1 | Target | Dynamic | How many months had burning? |
| 7 | FIRMS_brightness_K | Kelvin | FIRMS | Target | Dynamic | Thermal signature of fire |
| 8 | FIRMS_confidence | % | FIRMS | Target | Dynamic | Detection reliability filter |
| 9 | temp_mean_C | °C | ERA5 | Weather | Dynamic | Average heat — controls fuel drying |
| 10 | temp_max_C | °C | ERA5 | Weather | Dynamic | Extreme heat events trigger fire |
| 11 | temp_min_C | °C | ERA5 | Weather | Dynamic | Cold winters → frost → dead fuel |
| 12 | precip_mean_mm | mm | ERA5 | Weather | Dynamic | Average rainfall — moisture supply |
| 13 | precip_total_mm | mm | ERA5 | Weather | Dynamic | Cumulative water input — biomass control |
| 14 | wind_speed_ms | m/s | ERA5 | Weather | Dynamic | Fire spread rate and oxygen supply |
| 15 | wind_direction_deg | degrees | ERA5 | Weather | Dynamic | Direction of fire spread |
| 16 | relative_humidity_pct | % | ERA5 | Weather | Dynamic | Dead fuel moisture control |
| 17 | VPD_kPa | kPa | ERA5 | Weather | Dynamic | Atmospheric drying power — best fire predictor |
| 18 | dry_months_count | count | ERA5 | Weather | Dynamic | Drought severity / fire season length |
| 19 | NDVI_mean | index | MOD13A2 | Vegetation | Dynamic | Average vegetation greenness = fuel amount |
| 20 | NDVI_min | index | MOD13A2 | Vegetation | Dynamic | Driest condition = peak fire vulnerability |
| 21 | NDVI_max | index | MOD13A2 | Vegetation | Dynamic | Peak biomass = maximum fuel load |
| 22 | NDVI_seasonality | std dev | MOD13A2 | Vegetation | Dynamic | Deciduousness = seasonal fuel change |
| 23 | EVI_mean | index | MOD13A2 | Vegetation | Dynamic | Dense forest discrimination (where NDVI saturates) |
| 24 | LAI_mean | m²/m² | MOD15A2H | Vegetation | Dynamic | Canopy density = shade/moisture control |
| 25 | FPAR_mean | fraction | MOD15A2H | Vegetation | Dynamic | Photosynthetic activity = vegetation health |
| 26 | LFMC_proxy | ratio | Derived | Vegetation | Dynamic | Live fuel moisture estimate |
| 27 | terrain_x_veg | — | Derived | Interaction | Mixed | Slope × dry vegetation = fast uphill fire |
| 28 | climate_x_fuel | — | Derived | Interaction | Dynamic | Heat × dry fuel = ignition risk |
| 29 | FWI_proxy | — | Derived | Interaction | Dynamic | Fire weather danger index |
| 30 | dryness_x_fuel | — | Derived | Interaction | Dynamic | Atmospheric drying × open canopy |
| 31 | elevation | meters | SRTM | Topography | **Static** | Temperature/moisture gradient with altitude |
| 32 | slope_deg | degrees | SRTM | Topography | **Static** | Fire spread rate multiplier |
| 33 | aspect_deg | degrees | SRTM | Topography | **Static** | Sun exposure → drying → fire risk |
| 34 | TWI | index | SRTM | Topography | **Static** | Landscape wetness from terrain shape |
| 35 | population_density | people/ha | WorldPop | Human | Quasi-static | Human ignition source proximity |
| 36 | land_cover | class code | MCD12Q1 | Land Cover | Slow-change | Vegetation type = fuel type |

---

## 17. References

### Satellite Data Products

1. **MOD14A1 v6.1** — Giglio, L., et al. (2016). MODIS Collection 6 active fire product. *Remote Sensing of Environment*, 178, 31–41. DOI: 10.5067/MODIS/MOD14A1.061
2. **MCD64A1 v6.1** — Giglio, L., et al. (2018). The Collection 6 MODIS burned area mapping algorithm and product. *Remote Sensing of Environment*, 217, 72–85. DOI: 10.5067/MODIS/MCD64A1.061
3. **MOD13A2 v6.1** — Didan, K. (2021). MODIS/Terra Vegetation Indices 16-Day L3 Global 1km. DOI: 10.5067/MODIS/MOD13A2.061
4. **MOD15A2H v6.1** — Myneni, R., et al. (2021). MODIS/Terra LAI/FPAR 8-Day L4 Global 500m. DOI: 10.5067/MODIS/MOD15A2H.061
5. **MCD12Q1 v6.1** — Friedl, M., Sulla-Menashe, D. (2022). MODIS/Terra+Aqua Land Cover Type Yearly L3 Global 500m. DOI: 10.5067/MODIS/MCD12Q1.061
6. **ERA5-Land** — Muñoz Sabater, J. (2019). ERA5-Land monthly aggregated. *Copernicus Climate Change Service (C3S)*. DOI: 10.24381/cds.68d2bb30
7. **SRTM v3** — Farr, T.G., et al. (2007). The Shuttle Radar Topography Mission. *Reviews of Geophysics*, 45(2). DOI: 10.1029/2005RG000183
8. **WorldPop** — Tatem, A.J. (2017). WorldPop, open data for spatial demography. *Scientific Data*, 4, 170004.
9. **FIRMS** — NASA Fire Information for Resource Management System. https://firms.modaps.eosdis.nasa.gov/

### Reference Papers (Doc1–Doc4)

10. **[Doc1]** Sarkar, P., et al. — AUC-Weighted Ensemble for fire prediction in Northeast India
11. **[Doc2]** Shahzad, A., et al. — Multi-Layer Stacking Ensemble with SHAP interpretability
12. **[Doc3]** Hu, T., et al. (BIPE) — Bi-Layer Predictive Ensemble: Ensemble methods outperform deep learning for fire
13. **[Doc4]** Yuan, M., et al. (FireRisk-Multi) — Dynamic Multimodal Fusion with cross-modal interaction features

### ENSO & Climate

14. **ENSO/ONI**: Trenberth, K.E. (1997). The definition of El Niño. *Bulletin of the AMS*, 78(12), 2771–2777.
15. **VPD-fire link**: Williams, A.P., et al. (2019). Observed impacts of anthropogenic climate change on wildfire in California. *Earth's Future*, 7(8), 892–910.

---

*Document prepared for AGFE-Fire v4 project under Prof. Kiran's guidance.*
*Western Ghats biogeographic zone, MODIS-consistent data, 2003–2025.*
