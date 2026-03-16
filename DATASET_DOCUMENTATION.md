# 🔥 AGFE-Fire v4 — Dataset Documentation (Simple Version)
### A Complete Guide to Our Forest Fire Prediction Dataset
**Western Ghats, India | 2003–2025**

---

## Quick Summary (Read This First!)

> **What are we doing?**
> We collected satellite data for 22 years to predict **where forest fires will happen** in the Western Ghats.
>
> **What data do we have?**
> 4 CSV files, each covering ~5 years. Each file has ~10,000 rows (locations) and 36 columns (measurements).
>
> **What do the columns mean?**
> Each column is a measurement about that location — like temperature, rainfall, how green the forest is, how steep the hill is, etc.

---

## 📖 Table of Contents

1. [The Big Picture — What & Why](#1-the-big-picture)
2. [Where — Western Ghats](#2-where--western-ghats)
3. [When — 22 Years in 4 Blocks](#3-when--22-years-in-4-blocks)
4. [Where Did the Data Come From?](#4-where-did-the-data-come-from)
4B. [Data Origins, Formats & Harmonization](#4b-data-origins-formats--harmonization--the-full-picture)
4C. [🗂️ MASTER REFERENCE TABLE — Everything in ONE Place](#4c--master-reference-table--everything-about-every-parameter-in-one-place)
5. [Column-by-Column Explanation](#5-column-by-column-explanation)
6. [How We Picked the Sample Points](#6-how-we-picked-the-sample-points)
7. [Final File Structure](#7-final-file-structure)

---

## 1. The Big Picture

### What is the problem?

Forests in India catch fire every year. These fires:
- Kill animals and destroy trees
- Release smoke and CO₂ into the air
- Damage soil so nothing grows back for years
- Hurt people who live near forests

**We want to predict BEFORE the fire happens — which areas are most likely to burn.**

### How do we predict?

We use **machine learning** (ML). Think of it like this:

```
We show the computer thousands of examples:
  "This location had THIS weather, THIS type of forest, 
   THIS steepness of hill... and it DID catch fire."
  
  "This other location had THAT weather, THAT forest...
   and it DID NOT catch fire."

After seeing enough examples, the computer learns the PATTERN:
  "Hot + Dry + Steep + Sparse forest = HIGH chance of fire"
  "Cool + Wet + Flat + Dense forest = LOW chance of fire"

Then we give it a NEW location and ask: "Will this burn?"
```

### What data do we need?

To teach the computer, we need to know about each location:

| Question | What We Measure | Why It Matters |
|----------|----------------|----------------|
| Did it burn? | Fire yes/no, how many times, how intense | This is what we're PREDICTING |
| How hot was it? | Temperature (°C) | Hot = dry fuel = easy to burn |
| Did it rain? | Rainfall (mm) | Rain = wet fuel = hard to burn |
| How green is the forest? | NDVI, EVI (vegetation indices) | Green = moist = safe. Brown = dry = danger |
| How steep is the hill? | Slope (degrees) | Fire climbs hills FAST |
| Do people live nearby? | Population count | People start 95% of fires in India |
| What type of forest? | Land cover class | Dry deciduous burns easily, evergreen doesn't |

We measure **36 things** for each location. That's what the 36 columns in our CSV files are.

---

## 2. Where — Western Ghats

### What are the Western Ghats?

A **1,600 km long mountain chain** running along India's west coast.

```
States it passes through (North to South):
  Gujarat → Maharashtra → Goa → Karnataka → Kerala → Tamil Nadu
```

### Why study fire HERE?

| Reason | In Simple Words |
|--------|----------------|
| **Biodiversity hotspot** | Home to thousands of unique species found NOWHERE else on Earth |
| **UNESCO World Heritage** | So important that the UN declared it a protected site |
| **Fire is increasing** | Climate change + human activity = more fires every year |
| **Diverse forests** | Has everything from dry grasslands to dense rainforests |
| **Good satellite data** | Satellites can see this region clearly (unlike cloudy NE India) |

### How did we draw the boundary?

We used a dataset called **RESOLVE Ecoregions 2017** (available in Google Earth Engine). It defines 4 ecoregions that together form the Western Ghats:

1. **South Western Ghats moist deciduous forests** — Kerala, Karnataka hills
2. **North Western Ghats moist deciduous forests** — Maharashtra, Goa
3. **South Western Ghats montane rain forests** — Nilgiris, Anamalai hills
4. **North Western Ghats montane rain forests** — Mahabaleshwar plateaus

**Coordinates:** Roughly 8°N to 22°N latitude, 72.6°E to 78.3°E longitude.

---

## 3. When — 22 Years in 4 Blocks

### Why 22 years (2003–2025)?

There's a natural climate cycle called **ENSO** (El Niño / La Niña) that repeats every 4–5 years:

```
El Niño  → Less rain in India → Forests get dry → MORE fires
La Niña  → More rain in India → Forests stay wet → FEWER fires
```

With 22 years, we capture **4–5 complete cycles** of this. If we only used 5 years, we might accidentally pick all El Niño years and think fires are always bad — or all La Niña years and think fires are rare.

### What are the 4 blocks?

We split the 22 years into chunks:

```
┌──────────────┬──────────────┬──────────────┬─────────────┐
│   BLOCK 1    │   BLOCK 2    │   BLOCK 3    │   BLOCK 4   │
│  2003–2008   │  2009–2014   │  2015–2020   │  2021–2025  │
│   TRAINING   │   TRAINING   │   TRAINING   │    TEST     │
└──────────────┴──────────────┴──────────────┴─────────────┘
  ◄────── Computer LEARNS from these ──────►  ◄── We TEST ─►
```

- **Blocks 1, 2, 3** = Training data — we show these to the computer so it can learn
- **Block 4** = Test data — we hide this and check if the computer can predict correctly

### Why blocks instead of one big dataset?

The same forest location **changes over time**:
- A forest in 2003 might be denser than in 2020 (deforestation)
- Climate is getting warmer decade by decade
- Fire patterns shift as land use changes

By having blocks, we can see: "How did this location change from Block 1 to Block 4?"

---

## 4. Where Did the Data Come From?

All data comes from **satellites** and **weather models**, accessed through **Google Earth Engine (GEE)**.

### What is Google Earth Engine?

Think of it as **Google Maps for scientists**. Google stores petabytes (= millions of gigabytes) of satellite images on their servers. Instead of downloading huge files, we write code that runs on Google's computers and gives us a clean CSV file.

### Our Data Sources (Simple Table)

| What We Need | Source | How It Works |
|-------------|--------|-------------|
| 🔥 Fire locations | **MODIS satellite** (NASA) | A camera on a satellite that detects hot spots from space |
| 🔥 Burned areas | **MODIS MCD64A1** | Looks for burn scars — dark patches where fire was |
| 🌡️ Temperature, rain, wind, humidity | **ERA5-Land** (European weather agency) | Combines weather stations + satellites + physics models |
| 🌿 Vegetation greenness | **MODIS MOD13A2** | Measures how green/brown the land is from space |
| 🌿 Leaf density | **MODIS MOD15A2H** | Measures how thick the tree canopy is |
| ⛰️ Elevation, slope | **SRTM** (NASA shuttle mission) | A radar that mapped Earth's height in the year 2000 |
| 👥 Population | **WorldPop** | Estimates how many people live in each area |
| 🗺️ Forest type | **MODIS MCD12Q1** | Classifies each pixel as forest, grassland, cropland, etc. |

### What is MODIS?

**MODIS** = a camera mounted on two NASA satellites (Terra and Aqua). They fly over every point on Earth **4 times per day**. MODIS has been running since **2000** — giving us 22+ years of consistent data.

Why MODIS and not something newer? Because newer satellites (like VIIRS) only started in 2012. We need 22 years, and only MODIS goes back far enough.

---

## 4B. Data Origins, Formats & Harmonization — The Full Picture

You might wonder: "These 36 parameters come from DIFFERENT satellites, DIFFERENT agencies, in DIFFERENT formats — how did they all end up as neat columns in ONE CSV file?" This section explains exactly that.

---

### 🛰️ Step 1: Where Does Each Parameter PHYSICALLY Come From?

Every parameter starts its life as a measurement taken by a satellite sensor, a weather model, or a terrain-mapping mission. Here is the **complete origin story**:

#### 🔥 FIRE Parameters — Source & Format

| Parameter | Satellite / Mission | Sensor | Agency | GEE Asset ID | Original Format | Native Resolution | File Type in the Wild |
|-----------|-------------------|--------|--------|-------------|----------------|-------------------|----------------------|
| fire_occurrence | **Terra** (launched 1999) | MODIS (Band 21 — 3.9µm thermal) | NASA | `MODIS/061/MOD14A1` | **Raster** (gridded image) | 1 km × 1 km | HDF4 (.hdf) — a scientific image format |
| total_fire_count | **Terra** | MODIS FireMask band | NASA | `MODIS/061/MOD14A1` | **Raster** | 1 km | HDF4 |
| FRP_mean_MW | **Terra** | MODIS MaxFRP band | NASA | `MODIS/061/MOD14A1` | **Raster** | 1 km | HDF4 |
| FRP_max_MW | **Terra** | MODIS MaxFRP band | NASA | `MODIS/061/MOD14A1` | **Raster** | 1 km | HDF4 |
| burned_area_binary | **Terra + Aqua** (both combined) | MODIS BurnDate band | NASA | `MODIS/061/MCD64A1` | **Raster** | 500 m (resampled to 1 km) | HDF4 |
| burn_month_count | **Terra + Aqua** | MODIS BurnDate band | NASA | `MODIS/061/MCD64A1` | **Raster** | 500 m → 1 km | HDF4 |
| FIRMS_brightness_K | **Terra + Aqua** | MODIS Channel 21 (T21) | NASA FIRMS | FIRMS table in GEE | **Table / Point** (not raster!) | Point locations (~1 km) | CSV / Shapefile — individual fire detections |
| FIRMS_confidence | **Terra + Aqua** | MODIS contextual algorithm | NASA FIRMS | FIRMS table in GEE | **Table / Point** | Point locations | CSV / Shapefile |

> **Key insight:** Most fire data is **raster** (gridded images), but FIRMS is actually a **point table** — each fire detection is a lat/lon point with attributes. GEE converts this to pixel-level statistics during extraction.

#### 🌡️ WEATHER Parameters — Source & Format

| Parameter | Source System | Producer | GEE Asset ID | Original Format | Native Resolution | File Type in the Wild |
|-----------|-------------|----------|-------------|----------------|-------------------|----------------------|
| temp_mean_C | **ERA5-Land** reanalysis | ECMWF (European weather agency) | `ECMWF/ERA5_LAND/MONTHLY_AGGR` | **Raster** (gridded model output) | ~9 km (0.1° × 0.1°) | NetCDF (.nc) or GRIB (.grib) |
| temp_max_C | ERA5-Land | ECMWF | Same | **Raster** | ~9 km | NetCDF / GRIB |
| temp_min_C | ERA5-Land | ECMWF | Same | **Raster** | ~9 km | NetCDF / GRIB |
| precip_mean_mm | ERA5-Land | ECMWF | Same | **Raster** | ~9 km | NetCDF / GRIB |
| precip_total_mm | ERA5-Land | ECMWF | Same | **Raster** | ~9 km | NetCDF / GRIB |
| wind_speed_ms | ERA5-Land (u + v wind components) | ECMWF | Same | **Raster** | ~9 km | NetCDF / GRIB |
| wind_direction_deg | ERA5-Land (computed from u, v) | ECMWF | Same | **Raster** | ~9 km | NetCDF / GRIB |
| relative_humidity_pct | ERA5-Land (derived: temp + dewpoint) | ECMWF | Same | **Raster** | ~9 km | NetCDF / GRIB |
| VPD_kPa | ERA5-Land (derived: temp + dewpoint) | ECMWF | Same | **Raster** | ~9 km | NetCDF / GRIB |
| dry_months_count | ERA5-Land (derived: precip < 20mm) | ECMWF | Same | **Raster** | ~9 km | NetCDF / GRIB |

> **Key insight:** ERA5-Land is NOT from a satellite. It's a **weather model output** — ECMWF runs a physics simulation that combines satellite observations + weather stations + atmospheric models to produce a gap-free weather grid. Think of it as "what the weather computer calculated happened at every 9 km pixel, every hour, since 1950." The native file format is NetCDF (.nc) or GRIB (.grib) — scientific formats that store multi-dimensional data (lat × lon × time × variable).

#### 🌿 VEGETATION Parameters — Source & Format

| Parameter | Satellite / Mission | Sensor & Band | Agency | GEE Asset ID | Original Format | Native Resolution | File Type |
|-----------|-------------------|--------------|--------|-------------|----------------|-------------------|-----------|
| NDVI_mean | **Terra** | MODIS Band 1 (Red) + Band 2 (NIR) | NASA | `MODIS/061/MOD13A2` | **Raster** | 1 km | HDF4 |
| NDVI_max | Terra | MODIS (same) | NASA | Same | **Raster** | 1 km | HDF4 |
| NDVI_min | Terra | MODIS (same) | NASA | Same | **Raster** | 1 km | HDF4 |
| NDVI_seasonality | Terra | MODIS (computed: std dev of NDVI) | NASA | Same | **Raster** | 1 km | HDF4 |
| EVI_mean | Terra | MODIS Red + NIR + Blue bands | NASA | `MODIS/061/MOD13A2` | **Raster** | 1 km | HDF4 |
| LAI_mean | Terra | MODIS (radiative transfer model) | NASA | `MODIS/061/MOD15A2H` | **Raster** | 500 m → 1 km | HDF4 |
| FPAR_mean | Terra | MODIS (radiative transfer model) | NASA | `MODIS/061/MOD15A2H` | **Raster** | 500 m → 1 km | HDF4 |
| LFMC_proxy | Derived in GEE code | Formula: EVI / (1 − NDVI) | Computed | Not a direct product | **Computed on-the-fly** | 1 km | N/A — generated in code |

> **Key insight:** Most vegetation parameters are **raster images** from MODIS. But `LFMC_proxy` is NOT from any satellite — it's a **formula we compute** in our GEE code using two other MODIS products (EVI and NDVI). Similarly, `NDVI_seasonality` is the standard deviation computed across all NDVI images in the block.

#### ⛰️ TOPOGRAPHY Parameters — Source & Format

| Parameter | Mission | How It Was Made | Agency | GEE Asset ID | Original Format | Native Resolution | File Type |
|-----------|---------|----------------|--------|-------------|----------------|-------------------|-----------|
| elevation | **SRTM** (Shuttle Radar Topography Mission, Feb 2000) | Space Shuttle Endeavour carried a radar that bounced signals off Earth's surface to measure height | NASA + NGA | `USGS/SRTMGL1_003` | **Raster** (Digital Elevation Model / DEM) | 30 m (!) | GeoTIFF (.tif) or HGT (.hgt) |
| slope_deg | Derived from SRTM | Computed: rate of elevation change between neighboring pixels | Computed in GEE | `ee.Terrain.slope(DEM)` | **Computed raster** | 30 m → 1 km | N/A — generated in code |
| aspect_deg | Derived from SRTM | Computed: direction of steepest descent from each pixel | Computed in GEE | `ee.Terrain.aspect(DEM)` | **Computed raster** | 30 m → 1 km | N/A — generated in code |
| TWI | Derived from SRTM | Computed: `ln(upstream area / tan(slope))` | Computed in GEE | Custom formula | **Computed raster** | 30 m → 1 km | N/A — generated in code |

> **Key insight:** Only **elevation** comes directly from a satellite mission. `slope_deg`, `aspect_deg`, and `TWI` are all **mathematically derived** from the elevation data in our GEE code. SRTM has incredibly fine resolution (30 m) compared to weather data (9 km). Also, SRTM is **STATIC** — it was collected in a single 11-day Space Shuttle mission in February 2000 and never changes. The native format is GeoTIFF (.tif) or raw HGT files.

#### 👥 HUMAN + 🗺️ LAND COVER — Source & Format

| Parameter | Source | Producer | GEE Asset ID | Original Format | Native Resolution | File Type |
|-----------|--------|----------|-------------|----------------|-------------------|-----------|
| population_density | **WorldPop** (statistical population model) | WorldPop / University of Southampton | `WorldPop/GP/100m/pop` | **Raster** | 100 m | GeoTIFF (.tif) |
| land_cover | **MODIS MCD12Q1** (IGBP classification) | NASA + Boston University | `MODIS/061/MCD12Q1` | **Raster** (categorical: each pixel = a class code) | 500 m → 1 km | HDF4 |

> **Key insight:** WorldPop is NOT a satellite image — it's a **statistical model** that combines census data + satellite-derived settlement maps + machine learning to estimate population at 100 m resolution. `land_cover` is a **classification raster** where each pixel holds a number (1–17) representing a land type, not a continuous measurement.

#### 🏷️ METADATA — Source & Format

| Parameter | Source | Format |
|-----------|--------|--------|
| system:index | Google Earth Engine row ID | Text string — auto-generated |
| block | Our code labels each row | Text string (e.g., "B1_2003_2008") |
| block_role | Our code labels each row | Text string ("TRAIN" or "TEST") |
| latitude | Extracted from pixel centroid | Number (decimal degrees) |
| longitude | Extracted from pixel centroid | Number (decimal degrees) |
| .geo | GeoJSON geometry from GEE | JSON string |

#### 🗺️ STUDY BOUNDARY — Source & Format

| What | Source | GEE Asset ID | Original Format | File Type in the Wild |
|------|--------|-------------|----------------|----------------------|
| Western Ghats boundary | **RESOLVE Ecoregions 2017** | `RESOLVE/ECOREGIONS/2017` | **Vector / Shapefile** | Shapefile (.shp + .dbf + .shx + .prj) or GeoJSON |

> **Key insight:** The study boundary is the ONE piece of data that is a **Shapefile / Vector**, NOT a raster. It defines the polygon outline of the 4 Western Ghats ecoregions. All raster data is clipped to this boundary.

---

### 📦 Step 2: Understanding the Original Data Formats

There are 3 main types of geospatial data in our project:

```
┌────────────────────────────────────────────────────────────────┐
│  FORMAT 1: RASTER (Gridded Image)                             │
│  ┌──┬──┬──┬──┬──┐                                            │
│  │23│24│25│26│27│  ← Each cell = one pixel with a VALUE       │
│  ├──┼──┼──┼──┼──┤                                            │
│  │22│21│24│28│30│  Imagine a spreadsheet laid over a map.     │
│  ├──┼──┼──┼──┼──┤  Each cell has a number (temperature,      │
│  │20│19│22│26│29│  NDVI, elevation, etc.)                     │
│  └──┴──┴──┴──┴──┘                                            │
│  Used by: MODIS (fire, vegetation, land cover), ERA5,        │
│           SRTM (elevation), WorldPop                          │
│  File types: HDF4 (.hdf), NetCDF (.nc), GeoTIFF (.tif),     │
│              GRIB (.grib)                                     │
│  Sizes: HUGE — one MODIS fire product = ~500 MB per year     │
│         ERA5 global monthly file = ~2 GB                      │
│         SRTM 30m global = ~100 GB                            │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  FORMAT 2: VECTOR / SHAPEFILE (Polygons, Lines, Points)       │
│         ┌─────────┐                                           │
│        ╱           ╲     ← Polygons = boundaries              │
│       │  Western    │      Lines = roads, rivers               │
│       │  Ghats      │      Points = fire detection spots       │
│        ╲           ╱                                           │
│         └─────────┘                                           │
│  Used by: RESOLVE Ecoregions (study boundary), FIRMS points  │
│  File types: Shapefile (.shp + .dbf + .shx + .prj — always   │
│              comes as a GROUP of 4+ files), GeoJSON (.geojson)│
│  Sizes: Small — Western Ghats boundary = ~5 MB               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  FORMAT 3: TABLE (Rows and Columns)                           │
│  ┌─────────┬──────┬──────┬────────┐                          │
│  │ lat     │ lon  │ FRP  │ conf   │                          │
│  ├─────────┼──────┼──────┼────────┤                          │
│  │ 12.34   │ 75.2 │ 45.2 │ 87%   │                          │
│  │ 13.01   │ 74.8 │ 12.1 │ 45%   │  ← Each ROW = one fire  │
│  └─────────┴──────┴──────┴────────┘                          │
│  Used by: FIRMS fire detections (points with attributes)      │
│  File types: CSV, Shapefile-as-points                        │
│  Sizes: FIRMS global archive = several GB                    │
└────────────────────────────────────────────────────────────────┘
```

### Our data comes in ALL THREE formats — but our final output is ONE CSV. How?

---

### ⚙️ Step 3: How Google Earth Engine Harmonizes Everything

This is the most important part. Here's how **10 different datasets** in **4 different file formats** at **6 different resolutions** become **36 neat columns in a single CSV**:

```
THE PROBLEM:
  Source          Resolution    Format     Projection         Temporal
  ────────────    ──────────    ───────    ──────────────     ────────
  MODIS fire      1 km          HDF4       Sinusoidal         Daily
  MODIS burned    500 m         HDF4       Sinusoidal         Monthly
  ERA5-Land       9 km          NetCDF     Regular lat/lon    Monthly
  MODIS NDVI      1 km          HDF4       Sinusoidal         16-day
  MODIS LAI       500 m         HDF4       Sinusoidal         8-day
  SRTM            30 m          GeoTIFF    WGS84 lat/lon      Static
  WorldPop        100 m         GeoTIFF    WGS84 lat/lon      Annual
  MODIS Land Cov  500 m         HDF4       Sinusoidal         Annual
  FIRMS           Points        CSV/SHP    WGS84              Daily
  RESOLVE         Polygon       Shapefile  WGS84              Static

  All different! Different sizes, formats, grids, time steps.

THE SOLUTION — GEE does 6 things automatically:
```

#### ✅ Harmonization Step A: REPROJECTION — Put everything on the same map grid

Different datasets use different **coordinate systems** (called projections):
- MODIS uses **Sinusoidal projection** (a mathematical grid that preserves area but looks wavy)
- ERA5, SRTM, WorldPop use **WGS84 / EPSG:4326** (standard latitude/longitude)

```
What GEE does:
  MODIS (Sinusoidal) ──reprojected──→ WGS84 lat/lon
  ERA5 (already WGS84) ────────────→ stays as WGS84
  SRTM (already WGS84) ────────────→ stays as WGS84
  
  Result: ALL datasets now share the same coordinate system (WGS84).
  Every pixel can be described by latitude + longitude.
```

#### ✅ Harmonization Step B: RESAMPLING — Make all pixels the same size

Each dataset has a different pixel size. We need them all at **1 km** (our target resolution):

```
  SRTM (30 m)     ──aggregate 33×33 pixels──→  1 km  (take mean/mode)
  WorldPop (100 m) ──aggregate 10×10 pixels──→  1 km  (take sum for population)
  MODIS LAI (500 m)──aggregate 2×2 pixels───→  1 km  (take mean)
  MCD64A1 (500 m)  ──aggregate 2×2 pixels───→  1 km  (take max for burn detection)
  MODIS NDVI (1km) ──already 1 km──────────→  1 km  ✅
  MODIS fire (1km) ──already 1 km──────────→  1 km  ✅
  ERA5 (9 km)      ──bilinear interpolation─→  1 km  (GEE estimates sub-grid values)

  How resampling works (example for SRTM 30m → 1 km):
  ┌──┬──┬──┬──┐
  │30│31│35│32│  ← These 33×33 tiny SRTM pixels (30m each)
  ├──┼──┼──┼──┤     are averaged into ONE 1 km pixel.
  │29│30│34│31│     Elevation of the 1 km pixel = mean of ~1,089
  ├──┼──┼──┼──┤     small pixels = e.g., 820 meters.
  │28│29│33│30│
  └──┴──┴──┴──┘     For slope: mean of 1,089 slope values.
                     For aspect: circular mean (because 359° + 1° ≠ 180°).
```

> **Special cases:**
> - **Population**: We SUM the 10×10 WorldPop pixels (100m) because we want TOTAL people in the 1 km area, not average
> - **Burned area**: We take MAX of 2×2 pixels (500m) → if ANY sub-pixel burned, the 1 km pixel = burned
> - **Land cover**: We take MODE (most common class) of 2×2 pixels → the dominant land type wins
> - **ERA5 (9 km → 1 km)**: GEE uses bilinear interpolation — it estimates what value a 1 km pixel would have based on the surrounding 9 km pixels. This is smooth but means nearby 1 km pixels within the same 9 km cell will have similar (not identical) weather values.

#### ✅ Harmonization Step C: TEMPORAL AGGREGATION — Combine many dates into one block

Each data source delivers data at different time intervals. We aggregate everything into one value per 5-year block:

```
  Source              Original Frequency     What We Compute per Block
  ─────────────────   ──────────────────     ──────────────────────────
  MODIS fire (daily)  365 images/year        → fire_occurrence (max), fire_count (sum), FRP (mean/max)
  MCD64A1 (monthly)   12 images/year         → burned_area (max), burn_month_count (sum)
  ERA5 (monthly)      12 images/year         → temp mean/max/min, precip mean/sum, wind, humidity, VPD
  MODIS NDVI (16-day) 23 images/year         → NDVI mean/max/min/std
  MODIS LAI (8-day)   46 images/year         → LAI_mean
  SRTM (static)       1 image (year 2000)    → elevation, slope, aspect, TWI (same in every block)
  WorldPop (annual)   1 image/year           → population_density (mode year in block)
  MODIS land cov      1 image/year           → land_cover (mode year in block)

  Example: temp_mean_C for Block 1 (2003–2008):
    → GEE loads ALL 72 monthly ERA5 images (6 years × 12 months)
    → At each 1 km pixel, it computes the MEAN of those 72 temperature values
    → That single number becomes the temp_mean_C column value for that pixel
  
  Example: fire_occurrence for Block 1:
    → GEE loads ALL ~2,190 daily fire images (6 years × 365 days)
    → At each pixel, checks: was FireMask ≥ 7 on ANY day?
    → If yes → 1, if no → 0
```

#### ✅ Harmonization Step D: SPATIAL CLIPPING — Keep only Western Ghats

```
  Before clipping:                After clipping:
  ┌──────────────────────┐       ┌──────────────────────┐
  │  All of India         │       │                      │
  │  (millions of pixels)│       │    ╱──────╲           │
  │                      │  ──→  │   │ Western│          │
  │                      │       │   │ Ghats  │          │
  │                      │       │    ╲──────╱           │
  └──────────────────────┘       └──────────────────────┘

  The RESOLVE Ecoregions shapefile (vector polygon) defines WHERE the 
  Western Ghats is. GEE uses this polygon like a cookie cutter — any 
  raster pixel whose CENTER falls inside the polygon is KEPT, all 
  others are THROWN AWAY.
```

#### ✅ Harmonization Step E: POINT SAMPLING — From images to rows

After steps A–D, we have aligned raster layers. But we want a **CSV table**, not images. So we sample:

```
  Imagine 36 transparent maps stacked on top of each other:
  
  Layer 1:  fire_occurrence  (0s and 1s)
  Layer 2:  total_fire_count (counts)
  Layer 3:  FRP_mean_MW      (megawatts)
  ...
  Layer 36: land_cover       (class codes)

  At each sample point (lat, lon), we POKE A PIN through all 36 layers
  and read the value at that spot from each layer:

       PIN at (12.5°N, 75.2°E):
         Layer 1  (fire_occurrence)    → 1
         Layer 2  (total_fire_count)   → 7
         Layer 3  (FRP_mean_MW)        → 45.2
         Layer 4  (FRP_max_MW)         → 123.8
         ...
         Layer 36 (land_cover)         → 4

  This becomes ONE ROW in the CSV:
    12.5, 75.2, 1, 7, 45.2, 123.8, ..., 4
  
  Repeat for 10,000 sample points → 10,000 rows → one CSV file per block!
```

#### ✅ Harmonization Step F: EXPORT — From GEE to your computer

```
  GEE server (Google Cloud) ──exports──→ CSV file on Google Drive ──download──→ Your computer

  The final CSV has:
    • NO projection information (just lat/lon numbers)
    • NO file format complexity (just comma-separated text)
    • NO multi-dimensional layers (just flat columns)
    • ALL 36 parameters as COLUMNS, all sample points as ROWS
    • One file per temporal block
```

---

### 🔄 Step 4: Complete Format Conversion Summary

Here's the FULL journey for each parameter from satellite to CSV column:

| Parameter | Original Format → | Reprojected? | Resampled? | Temporally Aggregated? | Final in CSV |
|-----------|------------------|-------------|-----------|----------------------|-------------|
| fire_occurrence | HDF4 Raster (Sinusoidal, 1km, daily) | Yes → WGS84 | No (already 1km) | Yes (2190 days → 1 binary value) | Number: 0 or 1 |
| total_fire_count | HDF4 Raster (Sinusoidal, 1km, daily) | Yes → WGS84 | No | Yes (sum of daily fire days) | Integer: 0–2190 |
| FRP_mean_MW | HDF4 Raster (Sinusoidal, 1km, daily) | Yes → WGS84 | No | Yes (mean of all FRP values) | Float: 0–1000+ |
| FRP_max_MW | HDF4 Raster (same) | Yes → WGS84 | No | Yes (max of all FRP values) | Float: 0–1000+ |
| burned_area_binary | HDF4 Raster (Sinusoidal, 500m, monthly) | Yes → WGS84 | Yes (500m → 1km, max) | Yes (72 months → 1 binary) | Number: 0 or 1 |
| burn_month_count | HDF4 Raster (same) | Yes → WGS84 | Yes (500m → 1km) | Yes (sum of burn months) | Integer: 0–72 |
| FIRMS_brightness_K | **Point table** (CSV/SHP, WGS84) | No (already WGS84) | Rasterized to 1km | Yes (mean across detections) | Float: 300–500+ |
| FIRMS_confidence | **Point table** (same) | No | Rasterized to 1km | Yes (mean confidence) | Float: 0–100 |
| temp_mean_C | NetCDF/GRIB (WGS84, 9km, monthly) | No | Yes (9km → 1km, bilinear) | Yes (72 months → mean) | Float: °C |
| temp_max_C | NetCDF/GRIB (same) | No | Yes (9km → 1km) | Yes (72 months → max) | Float: °C |
| temp_min_C | NetCDF/GRIB (same) | No | Yes (9km → 1km) | Yes (72 months → min) | Float: °C |
| precip_mean_mm | NetCDF/GRIB (same) | No | Yes (9km → 1km) | Yes (72 months → mean, ×1000 for mm) | Float: mm |
| precip_total_mm | NetCDF/GRIB (same) | No | Yes (9km → 1km) | Yes (72 months → sum, ×1000) | Float: mm |
| wind_speed_ms | NetCDF/GRIB (u+v components, 9km) | No | Yes (9km → 1km) | Yes (√(u²+v²) then mean) | Float: m/s |
| wind_direction_deg | NetCDF/GRIB (same) | No | Yes (9km → 1km) | Yes (atan2(v,u) then mean) | Float: 0–360° |
| relative_humidity_pct | **Derived** (temp + dewpoint → Magnus formula) | No | Yes (9km → 1km) | Yes (72 months → mean) | Float: 0–100% |
| VPD_kPa | **Derived** (temp + dewpoint → VPD formula) | No | Yes (9km → 1km) | Yes (72 months → mean) | Float: kPa |
| dry_months_count | **Derived** (precip < 20mm per month) | No | Yes (9km → 1km) | Yes (count months with <20mm) | Integer: 0–72 |
| NDVI_mean | HDF4 Raster (Sinusoidal, 1km, 16-day) | Yes → WGS84 | No | Yes (~138 composites → mean) | Float: 0–0.9 |
| NDVI_max | HDF4 Raster (same) | Yes → WGS84 | No | Yes (~138 composites → max) | Float: 0–0.9 |
| NDVI_min | HDF4 Raster (same) | Yes → WGS84 | No | Yes (~138 composites → min) | Float: 0–0.9 |
| NDVI_seasonality | **Derived** (std dev of all NDVI composites) | Yes → WGS84 | No | Yes (~138 values → std dev) | Float |
| EVI_mean | HDF4 Raster (Sinusoidal, 1km, 16-day) | Yes → WGS84 | No | Yes (~138 composites → mean) | Float: 0–0.9 |
| LAI_mean | HDF4 Raster (Sinusoidal, 500m, 8-day) | Yes → WGS84 | Yes (500m → 1km, mean) | Yes (~276 composites → mean) | Float: 0–8 |
| FPAR_mean | HDF4 Raster (Sinusoidal, 500m, 8-day) | Yes → WGS84 | Yes (500m → 1km, mean) | Yes (~276 composites → mean) | Float: 0–1 |
| LFMC_proxy | **Computed** from EVI & NDVI | — | — | Computed after EVI/NDVI aggregation | Float |
| elevation | GeoTIFF Raster (WGS84, 30m, static) | No | Yes (30m → 1km, mean) | No (static) | Float: meters |
| slope_deg | **Computed** from elevation (GeoTIFF, 30m) | No | Yes (30m → 1km, mean) | No (static) | Float: degrees |
| aspect_deg | **Computed** from elevation (GeoTIFF, 30m) | No | Yes (30m → 1km, circular mean) | No (static) | Float: 0–360° |
| TWI | **Computed** from slope + flow accumulation | No | Yes (30m → 1km) | No (static) | Float |
| terrain_x_veg | **Computed**: slope × (1 − NDVI) | — | — | — | Float |
| climate_x_fuel | **Computed**: temp × (1 − NDVI) | — | — | — | Float |
| FWI_proxy | **Computed**: (temp × wind) / (rain + 1) | — | — | — | Float |
| dryness_x_fuel | **Computed**: VPD × (1 / LAI) | — | — | — | Float |
| population_density | GeoTIFF Raster (WGS84, 100m, annual) | No | Yes (100m → 1km, sum) | Yes (block representative year) | Float: people |
| land_cover | HDF4 Raster (Sinusoidal, 500m, annual) | Yes → WGS84 | Yes (500m → 1km, mode) | Yes (block representative year) | Integer: 1–17 |

---

### 💡 Step 5: Key Takeaways

```
1. RASTER is the dominant format — 8 out of 10 data sources are raster (gridded images)
2. Only ONE source is VECTOR (RESOLVE ecoregions shapefile for study boundary)
3. Only ONE source is POINT TABLE (FIRMS fire detections)
4. Six parameters are DERIVED/COMPUTED in our GEE code, not from any direct satellite product
5. Four INTERACTION features are COMPUTED from other parameters

The magic of GEE:
  → You NEVER download the raw HDF4/NetCDF/GeoTIFF files
  → GEE handles reprojection, resampling, and temporal aggregation on Google's servers
  → You only download the final clean CSV
  → This saves you from dealing with ~500+ GB of raw satellite data!
```

---

## 4C. 🗂️ MASTER REFERENCE TABLE — Everything About Every Parameter in ONE Place

**No more jumping between sections!** This single table tells you everything for each of the 36 parameters:
- **Where it comes from** (satellite / mission / agency)
- **File type** (Raster / Vector / Point / Computed)
- **Original resolution** and how it became 1 km
- **Static or Dynamic driver?**
- **What it measures** in plain English
- **How the ML model uses it** during training/testing
- **Importance tier** (🏆 Top → ○ Lower)

---

### 🔄 What are Static vs Dynamic Drivers?

```
STATIC DRIVERS (🗻 don't change between blocks):
  → Same value in Block 1 (2003) and Block 4 (2025)
  → Mountains don't move, rivers don't relocate
  → Examples: elevation, slope, aspect, TWI
  → Advantage: The model can ALWAYS rely on these — zero noise
  → They form the "base fire risk map"

DYNAMIC DRIVERS (🔄 change between blocks):
  → Different value in each 5-year block
  → Weather changes, vegetation grows/dies, people move
  → Examples: temperature, NDVI, VPD, population, fire history
  → Advantage: Capture CURRENT conditions and climate trends
  → They tell the model "what's different THIS time?"

SEMI-DYNAMIC DRIVERS (🔄🗻 change slowly):
  → Technically change but very slowly over decades
  → Examples: land_cover (a forest doesn't become cropland overnight),
     population_density (grows gradually)
  → Between our blocks they may shift slightly

MIXED / COMPUTED DRIVERS (⚡):
  → Interaction features that combine static + dynamic inputs
  → Example: terrain_x_veg = slope (static) × (1 − NDVI) (dynamic)
  → These CHANGE between blocks because the dynamic part changes,
     even though the static part stays the same
```

### Quick Count:
| Driver Type | Count | Parameters |
|-------------|-------|------------|
| 🗻 Static | 4 | elevation, slope_deg, aspect_deg, TWI |
| 🔄 Dynamic | 26 | All fire (8) + all weather (10) + all vegetation (8) |
| 🔄🗻 Semi-Dynamic | 2 | population_density, land_cover |
| ⚡ Mixed (static × dynamic) | 4 | terrain_x_veg, climate_x_fuel, FWI_proxy, dryness_x_fuel |
| **Total** | **36** | |

---

### 🔥 FIRE Parameters (8) — What we predict + fire history

| # | Column | Source | File Type | Resolution | Driver Type | What It Measures | ML Role | Tier |
|---|--------|--------|-----------|-----------|-------------|-----------------|---------|------|
| 1 | **fire_occurrence** | MODIS MOD14A1 (Terra satellite, NASA) | Raster (HDF4) | 1 km, daily → block max | 🔄 **Dynamic** — changes every block (fire happens in different places each 5 years) | **Did this pixel burn?** 0 = No, 1 = Yes. Detected via thermal infrared (3.9µm band). | 🎯 **PRIMARY TARGET** — This is the answer the model learns to predict. ALL other features exist to predict THIS. Hidden during testing. | 🎯 TARGET |
| 2 | **total_fire_count** | MODIS MOD14A1 (Terra, NASA) | Raster (HDF4) | 1 km, daily → block sum | 🔄 **Dynamic** — fire frequency changes block to block | **How many days did it burn?** Sum of all days with FireMask ≥ 7. Count=20 means chronic hotspot; count=1 means isolated event. | Feature: Tells model about fire recurrence. Pixel that burned 15 times before is very likely to burn again. ⚠️ Use ONLY from previous blocks, not same block! | ⭐⭐ |
| 3 | **FRP_mean_MW** | MODIS MOD14A1 → MaxFRP band (Terra, NASA) | Raster (HDF4) | 1 km, daily → block mean | 🔄 **Dynamic** — intensity varies with weather conditions each block | **Average fire intensity** in megawatts. <50 MW = small ground fire. >200 MW = massive canopy fire. Derived from 4µm thermal channel. | Feature: Tells model about typical fire intensity at this location. High FRP areas have conditions enabling intense fires (steep + dry + windy). | ⭐⭐ |
| 4 | **FRP_max_MW** | MODIS MOD14A1 → MaxFRP band (Terra, NASA) | Raster (HDF4) | 1 km, daily → block max | 🔄 **Dynamic** — worst fire can be different each block | **Worst fire intensity ever** at this pixel. Even if usually small fires, one extreme event matters for damage. | Feature: Captures worst-case. Model learns: "Locations that had extreme fires have persistent danger conditions." | ⭐⭐ |
| 5 | **burned_area_binary** | MODIS MCD64A1 (Terra+Aqua, NASA) | Raster (HDF4) | 500m → 1km (max), monthly → block max | 🔄 **Dynamic** — different areas burn each block | **Did MODIS detect a burn scar?** Uses reflectance change (NIR drops after fire), not heat. Independent from active fire detection. | Feature: Cross-validates fire_occurrence using a DIFFERENT method. Two witnesses agreeing = stronger signal for the model. | ⭐⭐ |
| 6 | **burn_month_count** | MODIS MCD64A1 (Terra+Aqua, NASA) | Raster (HDF4) | 500m → 1km, monthly → block sum | 🔄 **Dynamic** — fire persistence varies yearly | **How many months had burning?** Count of months with burn scars. Measures fire persistence/duration. | Feature: Distinguishes chronic (burns many months) vs flash (burns once). Different management implications the model can learn. | ○ |
| 7 | **FIRMS_brightness_K** | NASA FIRMS (Terra+Aqua MODIS Channel 21) | **Point Table** (CSV/Shapefile) → rasterized to 1km | ~1km points, daily → block mean | 🔄 **Dynamic** — fire temperature changes per event | **How hot was the fire?** Brightness temperature in Kelvin. 300K = background, 400K+ = definite fire, 500K+ = extreme. | Feature: Adds thermal dimension complementary to FRP. Small very-hot fire ≠ large moderate fire. Model uses both signals. | ○ |
| 8 | **FIRMS_confidence** | NASA FIRMS (contextual algorithm) | **Point Table** (CSV/Shapefile) → rasterized to 1km | ~1km points, daily → block mean | 🔄 **Dynamic** — detection confidence varies per observation | **How sure is the satellite?** 0–100%. Low (<30%) = maybe false alarm (hot rock). High (>80%) = definitely vegetation fire. | Feature: Data quality filter. Model learns to trust high-confidence detections and discount low-confidence ones (reduces noise). | ○ |

---

### 🌡️ WEATHER Parameters (10) — Climate conditions driving fire

| # | Column | Source | File Type | Resolution | Driver Type | What It Measures | ML Role | Tier |
|---|--------|--------|-----------|-----------|-------------|-----------------|---------|------|
| 9 | **temp_mean_C** | ERA5-Land reanalysis (ECMWF, European weather agency) | Raster (NetCDF/GRIB) — NOT a satellite! It's a physics-based weather model combining stations + satellites. | 9 km → 1km (bilinear interpolation), monthly → block mean | 🔄 **Dynamic** — temperature changes year to year, block to block (climate warming trend visible: Block1 ~27°C → Block4 ~29°C) | **Average temperature** in °C. Higher temp → faster fuel drying → easier ignition. Originally in Kelvin, converted by −273.15. | Feature: Model learns temperature zones. >30°C = 3× more fire than <25°C areas. Draws decision boundaries around temperature ranges. | ⭐⭐⭐ |
| 10 | **temp_max_C** | ERA5-Land (ECMWF) | Raster (NetCDF/GRIB) | 9 km → 1km, monthly → block max | 🔄 **Dynamic** — extreme heat events differ each block | **Hottest month** in the block. Even if average is moderate, ONE extreme month can trigger fire season. | Feature: Captures extreme heat events the average misses. Pixel with 28°C mean but 42°C max ≠ pixel with 28°C mean and 32°C max. | 🏆 TOP |
| 11 | **temp_min_C** | ERA5-Land (ECMWF) | Raster (NetCDF/GRIB) | 9 km → 1km, monthly → block min | 🔄 **Dynamic** — coldest month varies with climate | **Coldest month.** Cold winters → frost → dead vegetation → dry fuel for next fire season. Max−Min = temperature range (continentality). | Feature: Indirect effect through dead fuel accumulation. Combined with temp_max gives seasonality signal. | ⭐⭐ |
| 12 | **precip_mean_mm** | ERA5-Land (ECMWF) | Raster (NetCDF/GRIB) | 9 km → 1km, monthly → block mean. Originally meters, ×1000 for mm. | 🔄 **Dynamic** — monsoon strength varies with ENSO (El Niño = less rain, La Niña = more rain) | **Average monthly rainfall.** WG windward: 3000–5000 mm/yr. Leeward: 500–800 mm/yr. This gradient = fire risk gradient. | Feature: Primary moisture indicator. Model learns inverse relationship (more rain = less fire) BUT also paradox: very wet areas grow more fuel → more fire when dry. Tree models handle this non-linearity. | ⭐⭐⭐⭐ |
| 13 | **precip_total_mm** | ERA5-Land (ECMWF) | Raster (NetCDF/GRIB) | 9 km → 1km, monthly → block sum, ×1000 | 🔄 **Dynamic** — cumulative rainfall differs per block (drought blocks have much lower totals) | **Total rainfall across 5–6 years.** Captures drought years — if one block has unusually low total, El Niño drought occurred. | Feature: Drought detection. Combined with precip_mean, reveals whether THIS specific block was drier than normal. | ⭐⭐⭐ |
| 14 | **wind_speed_ms** | ERA5-Land (ECMWF) — computed from u + v wind components | Raster (NetCDF/GRIB) | 9 km → 1km. Formula: √(u² + v²), monthly → block mean | 🔄 **Dynamic** — wind patterns shift with monsoon strength and season | **How fast wind blows** in m/s. Wind feeds oxygen to fire + carries embers + tilts flames into unburned fuel. Fire spread ∝ wind². | Feature: Model learns wind thresholds where fire danger jumps. Even small fires in windy areas are dangerous because they spread rapidly. | ⭐⭐⭐ |
| 15 | **wind_direction_deg** | ERA5-Land (ECMWF) — computed: atan2(v,u) × 180/π + 180 | Raster (NetCDF/GRIB) | 9 km → 1km, monthly → block mean | 🔄 **Dynamic** — dominant wind direction shifts between monsoon and dry season | **Which direction wind comes from** (0°=N, 90°=E, 180°=S, 270°=W). Fires spread downwind. SW winds in monsoon suppress fire; NE winds in dry season spread fire. | Feature: Directional context. ⚠️ CIRCULAR variable — 359° is near 0°, not far! Must encode as sin(dir) + cos(dir) in Python before training. | ○ |
| 16 | **relative_humidity_pct** | ERA5-Land (ECMWF) — **Derived** from temperature + dewpoint using Magnus formula | Raster (NetCDF/GRIB) | 9 km → 1km, monthly → block mean | 🔄 **Dynamic** — humidity drops in dry season, varies with ENSO phase | **How humid the air is** (0–100%). Below 30% = dead leaves catch fire like paper. Below 15% = Red Flag conditions. Monsoon: 85–95%. Dry season: 20–40%. | Feature: Model learns THRESHOLD effect — fire risk doesn't increase linearly, it JUMPS at ~30% RH. Tree models (XGBoost) naturally find these thresholds. | ⭐⭐⭐⭐ |
| 17 | **VPD_kPa** | ERA5-Land (ECMWF) — **Derived**: saturation vapor pressure − actual vapor pressure | Raster (NetCDF/GRIB) | 9 km → 1km, monthly → block mean | 🔄 **Dynamic** — VPD increases with warming trend → fire risk rising globally | **How "thirsty" the air is.** High VPD (>2 kPa) = air sucks moisture from plants → they dry out → fire risk spikes. Better than RH alone because it's temperature-independent. | Feature: 🏆 **SINGLE BEST PREDICTOR of wildfire globally.** Integrates temperature + humidity into one physically meaningful number. Model relies heavily on VPD thresholds. | 🏆 TOP |
| 18 | **dry_months_count** | ERA5-Land (ECMWF) — **Derived**: count months where precip < 20mm | Raster (NetCDF/GRIB) | 9 km → 1km, monthly → count per block | 🔄 **Dynamic** — drought years have more dry months; wet years have fewer | **How many months had almost no rain.** Windward WG: 2–4 dry months/yr. Leeward: 6–8/yr. More dry months = longer window for fires to start. | Feature: Directly estimates fire season LENGTH. Clean count that's easy for model to use — no noise, just "how long was fire possible?" | ⭐⭐⭐⭐ |

---

### 🌿 VEGETATION Parameters (8) — The fuel that burns

| # | Column | Source | File Type | Resolution | Driver Type | What It Measures | ML Role | Tier |
|---|--------|--------|-----------|-----------|-------------|-----------------|---------|------|
| 19 | **NDVI_mean** | MODIS MOD13A2 (Terra satellite, NASA) — Red + Near-Infrared bands | Raster (HDF4) | 1 km, every 16 days → block mean. Scale: raw × 0.0001 | 🔄 **Dynamic** — vegetation greenness changes with monsoon, drought, fire recovery, and deforestation | **Average greenness.** NDVI = (NIR−Red)/(NIR+Red). 0.8 = lush green. 0.2 = dry brown. 0 = bare soil. Most used vegetation index in fire science. | Feature: 🏆 **PRIMARY FUEL INDICATOR.** Low NDVI = sparse/dry = burns easily. High NDVI = dense/green = resistant. First check the model performs on any pixel. | 🏆 TOP |
| 20 | **NDVI_max** | MODIS MOD13A2 (Terra, NASA) | Raster (HDF4) | 1 km, 16-day → block max | 🔄 **Dynamic** — peak monsoon greenness varies with rainfall each block | **Greenest the forest got** (peak monsoon). High peak = lots of biomass grew. PARADOX: more green growth in monsoon = MORE fuel when it dries in summer. | Feature: Fuel load estimation. Model distinguishes: always-sparse (low max = moderate risk) vs green-then-dry (high max + low min = MAXIMUM risk). | ⭐⭐⭐ |
| 21 | **NDVI_min** | MODIS MOD13A2 (Terra, NASA) | Raster (HDF4) | 1 km, 16-day → block min | 🔄 **Dynamic** — worst dry season severity changes each block (El Niño blocks have lower min) | **Driest/brownest the forest got** (peak dry season). NDVI_min < 0.15 = near-complete vegetation drying = peak fire vulnerability. | Feature: Captures WORST-CASE dryness. Even if usually green, one severe dry spell (low min) signals extreme danger. Model weights this heavily. | ⭐⭐⭐⭐ |
| 22 | **NDVI_seasonality** | **Derived** from MODIS MOD13A2 — standard deviation of all NDVI values in block | Computed in GEE from Raster | 1 km | 🔄 **Dynamic** — seasonal swing can increase if droughts worsen or decrease after deforestation | **How much greenness swings** between seasons. High = deciduous (green↔brown, MOST fire-prone). Low = evergreen (always green, less fire-prone). | Feature: Continuous forest-type indicator. Better than just "deciduous vs evergreen" binary. Model learns seasonality > 0.15 = strong fire signal. | ⭐⭐⭐⭐ |
| 23 | **EVI_mean** | MODIS MOD13A2 (Terra, NASA) — Red + NIR + Blue bands | Raster (HDF4) | 1 km, 16-day → block mean. Scale: raw × 0.0001 | 🔄 **Dynamic** — canopy density responds to rainfall, logging, fire damage | **Better greenness for dense forests.** Like NDVI but doesn't saturate in thick canopy. Also corrects for atmosphere (uses blue band). Essential for Western Ghats dense forests. | Feature: Discriminating power where NDVI fails. Two pixels with NDVI=0.8 but EVI=0.5 vs 0.7 are very different forests. Model uses EVI for dense canopy areas. | ⭐⭐⭐ |
| 24 | **LAI_mean** | MODIS MOD15A2H (Terra, NASA) — radiative transfer model | Raster (HDF4) | 500m → 1km (mean), every 8 days → block mean. Scale: raw × 0.1 | 🔄 **Dynamic** — leaf cover changes with seasons, fire damage, and regrowth | **Layers of leaves above ground** (m²/m²). LAI=1: one leaf layer. LAI=6: thick canopy blocks sun → shaded, humid understory. Directly controls understory drying. | Feature: Microclimate indicator no other feature captures. High LAI = closed canopy = fire resistant. Low LAI = sun reaches ground fuel = fire prone. Also used in dryness_x_fuel interaction. | ⭐⭐⭐ |
| 25 | **FPAR_mean** | MODIS MOD15A2H (Terra, NASA) — radiative transfer model | Raster (HDF4) | 500m → 1km (mean), every 8 days → block mean. Scale: raw × 0.01 | 🔄 **Dynamic** — photosynthesis rate changes with moisture and season | **How much sunlight plants absorb** (0–1). High FPAR = active photosynthesis = alive and moist. Seasonal drop in FPAR = start of fire season. | Feature: Adds temporal context — recently active forest with sudden FPAR drop = vegetation just dried out = fresh fire fuel. | ⭐⭐ |
| 26 | **LFMC_proxy** | **Computed in GEE code** from EVI and NDVI: LFMC ≈ EVI / (1 − NDVI) | Computed — no direct satellite product | 1 km (derived from 1km inputs) | 🔄 **Dynamic** — plant moisture directly tracks seasonal drying and rewetting | **How moist are living plants?** High = moist, won't burn. Low = dry, catches fire like kindling. Most direct flammability indicator. | Feature: Essentially a "fire readiness score." Model learns threshold: LFMC < 80% = vegetation will ignite. Above it, very few fires. Below it, risk spikes. | ⭐⭐⭐⭐ |

---

### ⛰️ TOPOGRAPHY Parameters (4) — Permanent terrain that never changes

| # | Column | Source | File Type | Resolution | Driver Type | What It Measures | ML Role | Tier |
|---|--------|--------|-----------|-----------|-------------|-----------------|---------|------|
| 27 | **elevation** | SRTM — Shuttle Radar Topography Mission (Feb 2000, Space Shuttle Endeavour, NASA+NGA) | Raster (GeoTIFF / HGT) — radar-based DEM | 30m → 1km (mean). **Static** — collected once in 2000, never changes. | 🗻 **STATIC** — mountains don't move! Same elevation in 2003 and 2025. Collected ONCE in Feb 2000 by Space Shuttle. | **Height above sea level** in meters. Higher = cooler = wetter = less fire (usually). Controls temperature gradient (~6.5°C drop per 1000m). | Feature: Most STABLE predictor — never changes. Model builds reliable "base fire risk map" from terrain. <800m = most fires. >1500m = few fires except grassland. | ⭐⭐⭐ |
| 28 | **slope_deg** | **Computed in GEE** from SRTM elevation: `ee.Terrain.slope(DEM)` | Computed from GeoTIFF Raster | 30m → 1km (mean). Static. | 🗻 **STATIC** — hill steepness doesn't change over decades. Derived from static SRTM elevation. | **How steep the hill is** in degrees. Fire runs UPHILL 4–8× faster than flat ground (hot air rises, pre-heats fuel above, flames lean into slope). | Feature: Non-linear relationship — flat (0–10°) = low risk, but risk increases STEEPLY above 15°. Tree models capture this jump naturally. Critical for fire spread physics. | ⭐⭐⭐⭐ |
| 29 | **aspect_deg** | **Computed in GEE** from SRTM elevation: `ee.Terrain.aspect(DEM)` | Computed from GeoTIFF Raster | 30m → 1km (circular mean). Static. | 🗻 **STATIC** — slope direction doesn't change. A south-facing hill will face south forever. | **Which direction the slope faces** (0°=N, 180°=S). South-facing = most sun = driest = most fire. North-facing = least sun = wettest. | Feature: Sun exposure proxy. ⚠️ CIRCULAR variable like wind direction — must encode as sin(aspect) + cos(aspect) in Python before training. | ⭐⭐ |
| 30 | **TWI** | **Computed in GEE** from SRTM: `ln(upstream area / tan(slope))` | Computed from GeoTIFF Raster | 30m → 1km. Static. | 🗻 **STATIC** — water flow paths are determined by terrain shape, which doesn't change. | **Does water collect or drain away?** High TWI = valley (wet, rarely burns). Low TWI = ridgetop (dry, burns). Captures micro-moisture at 30m detail that 9km weather data can't see. | Feature: Micro-moisture indicator. Explains why two pixels with identical weather have different fire outcomes — one is a wet valley, the other a dry ridge. | ⭐⭐⭐ |

---

### ✖️ CROSS-MODAL INTERACTION Parameters (4) — Pre-computed danger signals

| # | Column | Source | File Type | Resolution | Driver Type | What It Measures | ML Role | Tier |
|---|--------|--------|-----------|-----------|-------------|-----------------|---------|------|
| 31 | **terrain_x_veg** | **Computed in GEE**: slope_deg × (1 − NDVI_mean) | Computed from other parameters | 1 km | ⚡ **Mixed** — slope is STATIC but NDVI is dynamic → product changes each block | **Steep + dry = danger.** Steep slope with green forest = safe. Steep slope with dry grass = EXTREME danger. Only the COMBINATION matters. | Feature: 🏆 **PRE-COMPUTED DANGER SIGNAL.** Without this, model needs deep trees to discover slope×NDVI interaction. With it, one simple split does the job → less overfitting. Ranked #1–3 in Doc4 (Yuan et al.). | 🏆 TOP |
| 32 | **climate_x_fuel** | **Computed in GEE**: temp_mean_C × (1 − NDVI_mean) | Computed from other parameters | 1 km | ⚡ **Mixed** — both temp and NDVI are dynamic → fully dynamic product | **Hot + dry fuel = ignition.** 40°C with wet forest = not immediate danger. 40°C with dry forest = disaster. This IS the ignition probability score. | Feature: 🏆 **IGNITION PROBABILITY INDEX.** Model uses single threshold on this instead of complex multi-variable logic. Among top-3 most important features. | 🏆 TOP |
| 33 | **FWI_proxy** | **Computed in GEE**: (temp × wind_speed) / (precip_mean + 1) | Computed from other parameters | 1 km | ⚡ **Mixed** — all 3 inputs (temp, wind, rain) are dynamic → fully dynamic product | **Fire Weather Index.** Combines heat + wind + drought into one score. Mimics the Canadian FWI system used worldwide by fire managers. | Feature: Proven fire danger index. Gives model established fire science knowledge "for free" — it doesn't have to rediscover this well-known relationship. | ⭐⭐⭐⭐ |
| 34 | **dryness_x_fuel** | **Computed in GEE**: VPD_kPa × (1 / LAI_mean) | Computed from other parameters | 1 km | ⚡ **Mixed** — VPD (dynamic) × 1/LAI (dynamic) → fully dynamic product | **Thirsty air + thin canopy = ground fuel dries fast.** Captures understory fire mechanism — most common fire type in WG dry deciduous forests. | Feature: Understory fire risk indicator. Model learns: open canopy + dry atmosphere = ground litter fire. Most WG fires start this way. | ⭐⭐⭐⭐ |

---

### 👥🗺️ HUMAN + LAND COVER Parameters (2)

| # | Column | Source | File Type | Resolution | Driver Type | What It Measures | ML Role | Tier |
|---|--------|--------|-----------|-----------|-------------|-----------------|---------|------|
| 35 | **population_density** | WorldPop (University of Southampton) — statistical model combining census + satellite settlement maps + ML | Raster (GeoTIFF) — NOT a satellite image, it's a modeled estimate | 100m → 1km (**SUM**, not mean — total people in 1km area). Annual. | 🔄🗻 **Semi-Dynamic** — population grows gradually over decades, not dramatically between blocks. But forest-fringe migration can shift ignition patterns. | **How many people live nearby.** 95% of India's forest fires are human-started. No people = no ignition source, no matter how dry. | Feature: Human ignition factor. Model learns NON-LINEAR U-shape: no people = low fire. Medium (forest fringe villages) = MAXIMUM fire. High (cities) = no forest = no fire. Tree models handle this automatically. | ⭐⭐⭐⭐ |
| 36 | **land_cover** | MODIS MCD12Q1 — IGBP classification (Terra+Aqua, NASA + Boston University) | Raster (HDF4) — **categorical**: each pixel = class code 1–17, not a continuous number | 500m → 1km (**MODE** — most common class wins). Annual. | 🔄🗻 **Semi-Dynamic** — land cover changes slowly (deforestation, encroachment) but a forest in 2003 is usually still forest in 2025. Major shifts visible only over decades. | **What type of land is this?** Code 2 = Evergreen (low fire). Code 4 = Deciduous (HIGH fire). Code 14 = Cropland/forest mix (HIGHEST — people + fuel). | Feature: Acts as categorical grouping variable. Model builds separate fire rules for each type. "Rules for deciduous fire" are completely different from "rules for grassland fire." Must be **one-hot encoded** in Python. | ⭐⭐⭐⭐ |

---

### 📋 METADATA (6 columns — NOT features, just labels)

| # | Column | Source | File Type | What It Is | ML Role |
|---|--------|--------|-----------|-----------|---------|
| — | **system:index** | Auto-generated by Google Earth Engine | Text string | Row ID — just a label, no meaning | ❌ **DROP** before training |
| — | **block** | Our GEE code labels each row | Text string ("B1_2003_2008", etc.) | Which time block this row belongs to | ❌ **DROP** — used for train/test split only, not as feature |
| — | **block_role** | Our GEE code labels each row | Text string ("TRAIN" or "TEST") | Whether this row is for training or testing | ❌ **DROP** — would cause data leakage |
| — | **latitude** | Extracted from pixel centroid in GEE | Number (decimal degrees) | North-South position | ⚠️ MAYBE — useful for spatial features but raw lat/lon risks spatial overfitting |
| — | **longitude** | Extracted from pixel centroid in GEE | Number (decimal degrees) | East-West position | ⚠️ MAYBE — same caution as latitude |
| — | **.geo** | GeoJSON geometry from GEE | JSON string | Same location in GeoJSON format | ❌ **DROP** — technical metadata, not a number |

---

### 🎯 Importance Tier Legend

| Symbol | Tier | Meaning |
|--------|------|---------|
| 🏆 TOP | Tier 1 | Model relies HEAVILY on these — top 5 predictors |
| ⭐⭐⭐⭐ | Tier 2 | Strong predictors — important supporting features |
| ⭐⭐⭐ | Tier 3 | Useful features that add value |
| ⭐⭐ | Tier 4 | Moderate — indirect or supporting role |
| ○ | Tier 5 | Lower but still useful — data quality or secondary signals |
| 🎯 TARGET | — | This is what we PREDICT, not a feature |

---

## 5. Column-by-Column Explanation

Here's every column in the CSV files explained in plain language.

---

### 🔥 FIRE COLUMNS (8 columns) — "What happened with fire?"

These tell us about fire activity at each location. The main one (`fire_occurrence`) is what we're trying to predict.

| # | Column Name | What It Means | Values | Simple Example |
|---|------------|---------------|--------|----------------|
| 1 | **fire_occurrence** | Did this spot catch fire? | 0 = No, 1 = Yes | "Yes, this pixel burned at least once in this 5-year block" |
| 2 | **total_fire_count** | How many times did it burn? | 0, 1, 2, 3... | "This pixel was on fire on 12 different days" |
| 3 | **FRP_mean_MW** | Average fire intensity (in megawatts) | 0 to 1000+ MW | Low (<50) = small ground fire. High (>200) = massive wildfire |
| 4 | **FRP_max_MW** | Worst fire intensity ever recorded here | 0 to 1000+ MW | "The biggest fire at this pixel was 350 MW" |
| 5 | **burned_area_binary** | Did MODIS detect a burn scar? | 0 = No, 1 = Yes | Like fire_occurrence, but uses a different detection method |
| 6 | **burn_month_count** | How many months had burning? | 0, 1, 2... | "This pixel had fire in 3 different months" |
| 7 | **FIRMS_brightness_K** | How hot was the fire? (Kelvin) | 300–500+ K | 300K = background. 400K+ = definite fire. 500K+ = intense |
| 8 | **FIRMS_confidence** | How sure is the satellite it's really fire? | 0–100% | Low (<30%) = maybe not real fire. High (>80%) = definitely fire |

> **Key point:** `fire_occurrence` is our **main target** — what we want to predict. The others can be used as secondary targets or as features.

---

### 🌡️ WEATHER COLUMNS (10 columns) — "What was the climate like?"

Weather controls **when** fires happen. Hot + dry + windy = fire weather.

| # | Column Name | What It Means | Unit | Why It Matters for Fire |
|---|------------|---------------|------|------------------------|
| 9 | **temp_mean_C** | Average temperature | °C | Hotter → fuel dries faster → easier to burn |
| 10 | **temp_max_C** | Hottest month in the block | °C | Extreme heat events trigger fires |
| 11 | **temp_min_C** | Coldest month in the block | °C | Cold winters → dead leaves → dry fuel pile |
| 12 | **precip_mean_mm** | Average monthly rainfall | mm | More rain → wetter forest → harder to burn |
| 13 | **precip_total_mm** | Total rainfall across the block | mm | How much water this area got in 5 years |
| 14 | **wind_speed_ms** | How fast the wind blows | m/s | Wind feeds oxygen to fire + carries embers |
| 15 | **wind_direction_deg** | Which direction wind comes from | degrees | Fire spreads in the direction wind blows |
| 16 | **relative_humidity_pct** | How humid the air is | % | Below 30% = dead leaves catch fire easily |
| 17 | **VPD_kPa** | How "thirsty" the air is | kPa | High VPD = air sucks moisture from plants → they dry out |
| 18 | **dry_months_count** | Months with almost no rain (<20mm) | count | More dry months = longer fire season |

#### Quick explanation of key weather terms:

**VPD (Vapor Pressure Deficit)** — Imagine the air is a sponge. When the sponge is dry (high VPD), it pulls moisture out of everything — plants, soil, dead leaves. This makes fire fuel dry faster. Many scientists say VPD is the **single best predictor** of wildfire.

**Relative Humidity** — The percentage of moisture in the air compared to the maximum it can hold. When humidity drops below 30%, dry leaves on the forest floor become as flammable as paper.

**Dry Months Count** — We count how many months had less than 20mm of rain. More dry months = longer window when fires can start.

---

### 🌿 VEGETATION COLUMNS (8 columns) — "What's the fuel like?"

Vegetation = fuel. These tell us: How much fuel? How dry? How dense?

| # | Column Name | What It Means | Values | Why It Matters |
|---|------------|---------------|--------|----------------|
| 19 | **NDVI_mean** | Average greenness | 0 to 0.9 | Low = dry/sparse → burns easily. High = green/dense → resistant |
| 20 | **NDVI_max** | Greenest the forest got | 0 to 0.9 | High peak greenness = lots of biomass grew → lots of fuel when it dries |
| 21 | **NDVI_min** | Brownest/driest the forest got | 0 to 0.9 | How bad did the dry season get? Lower = more severe |
| 22 | **NDVI_seasonality** | How much greenness swings | std dev | High = deciduous (green↔brown). Low = evergreen (always green) |
| 23 | **EVI_mean** | Better greenness for dense forests | 0 to 0.9 | Like NDVI but works better in thick forests where NDVI maxes out |
| 24 | **LAI_mean** | How many layers of leaves | 0 to 8 | LAI=1: one leaf layer. LAI=6: thick canopy that blocks sun |
| 25 | **FPAR_mean** | How much sunlight plants absorb | 0 to 1 | High = active growing. Low = dormant/dead → fire-ready |
| 26 | **LFMC_proxy** | How moist the living plants are | ratio | High = moist plants won't burn. Low = dry plants catch fire easily |

#### Quick explanation of key vegetation terms:

**NDVI** — Satellites look at two colors of light bouncing off Earth:
- Green plants reflect a lot of **near-infrared** light and absorb **red** light
- Dead/dry plants reflect both similarly
- NDVI = (near-infrared − red) / (near-infrared + red)
- **Result: 0.8 = lush green forest. 0.2 = dry brown grassland. 0 = bare soil**

**NDVI_seasonality** — How dramatically the forest changes between seasons:
- **High** → Deciduous forest (goes from green to completely brown) = MOST fire-prone
- **Low** → Evergreen forest (stays green all year) = less fire-prone

**LAI (Leaf Area Index)** — Imagine looking down at the forest from above. LAI tells you how many layers of leaves are stacked. A thick canopy (LAI=6) keeps the ground shaded and moist. A thin canopy (LAI=1) lets sun dry out fallen leaves on the ground.

**LFMC proxy** — Live Fuel Moisture Content. We estimate how wet the living plants are from satellite data: `LFMC ≈ EVI / (1 − NDVI)`. Moist plants won't burn. Dry plants are like kindling.

---

### ⛰️ TOPOGRAPHY COLUMNS (4 columns) — "What does the land look like?"

These are **permanent** — mountains don't move. But they permanently affect fire.

| # | Column Name | What It Means | Unit | Why It Matters |
|---|------------|---------------|------|----------------|
| 27 | **elevation** | Height above sea level | meters | Higher = cooler = wetter = less fire (usually) |
| 28 | **slope_deg** | How steep the hill is | degrees | Fire runs UPHILL very fast — steep = dangerous |
| 29 | **aspect_deg** | Which direction the slope faces | degrees | South-facing = more sun = drier = more fire |
| 30 | **TWI** | Does water collect or drain away? | index | Valley (high TWI) = wet. Ridgetop (low TWI) = dry |

#### Why slope is the most important terrain variable:

```
Imagine a fire at the bottom of a hill:
  - Hot air rises UP the hill
  - This pre-heats the fuel above
  - Flames lean INTO the uphill fuel
  
  Result: Fire climbs hills 4-8x FASTER than on flat ground!
  Flat ground:  fire moves at ~0.5 m/min
  Steep hill:   fire moves at ~4-8 m/min
```

**Aspect** — Which way the slope faces:
- **South-facing** slopes get the most sun → drier → more fire
- **North-facing** slopes get the least sun → wetter → less fire

**TWI** — Water flows downhill and collects in valleys:
- **High TWI** = valley bottom → stays wet → rarely burns
- **Low TWI** = ridgetop/steep slope → dries out → burns

---

### ✖️ CROSS-MODAL INTERACTION COLUMNS (4 columns) — "Combinations that matter"

Single variables alone don't tell the full story — it's the **combination** that predicts fire.

| # | Column Name | Formula | What It Captures |
|---|------------|---------|-----------------|
| 31 | **terrain_x_veg** | Slope × (1 − NDVI) | Steep + dry vegetation = fire races uphill |
| 32 | **climate_x_fuel** | Temp × (1 − NDVI) | Hot + dry vegetation = ignition conditions |
| 33 | **FWI_proxy** | (Temp × Wind) / (Rain + 1) | Hot + windy + no rain = extreme fire weather |
| 34 | **dryness_x_fuel** | VPD × (1 / LAI) | Thirsty air + thin canopy = ground fuel dries fast |

#### Why combinations?

- A **steep slope** with a **green, moist forest** → Not dangerous
- A **steep slope** with **dry, brown grass** → EXTREMELY dangerous
- **40°C** with a **wet forest** → Not immediate danger
- **40°C** with a **dry forest** → Disaster waiting to happen

The **interaction** between variables is what really predicts fire.

---

### 👥🗺️ HUMAN + LAND COVER COLUMNS (2 columns)

| # | Column Name | What It Means | Values | Why It Matters |
|---|------------|---------------|--------|----------------|
| 35 | **population_density** | How many people live nearby | people/hectare | 95% of forest fires in India are started by HUMANS |
| 36 | **land_cover** | What type of land is this? | Code 1–17 | Deciduous forest burns easily. Evergreen doesn't |

#### Land cover codes you'll see most:

| Code | Type | Fire Risk |
|------|------|-----------|
| 2 | Evergreen Forest | Low (stays moist) |
| 4 | Deciduous Forest | **HIGH** (dries seasonally) |
| 8 | Woody Savannas | High |
| 10 | Grasslands | High (burns fast) |
| 12 | Croplands | Ignition source |
| 14 | Cropland/Forest Mix | **HIGHEST** (people + fuel) |

---

### 📋 METADATA COLUMNS (not features — just labels)

| Column | What It Is |
|--------|-----------|
| **system:index** | Row ID from Google Earth Engine (ignore this) |
| **block** | Which time block: "B1_2003_2008", "B2_2009_2014", etc. |
| **block_role** | "TRAIN" (Blocks 1–3) or "TEST" (Block 4) |
| **latitude** | North-South position |
| **longitude** | East-West position |
| **.geo** | Same location in GeoJSON format |

---

## 5B. How Each Parameter Helps the ML Model (In-Depth)

Now that you know WHAT each column is, let's understand HOW the ML model actually uses each one during **training** and **testing**.

### First — Understanding Training vs Testing

```
TRAINING (Blocks 1–3, 30,000 samples):
  The model SEES both the input features AND the answer (fire_occurrence).
  It learns: "When these features look like THIS → fire happens"
  
TESTING (Block 4, 9,249 samples):
  The model ONLY sees the input features. The answer is HIDDEN.
  It predicts: "Based on what I learned, I think this pixel will/won't burn"
  Then we CHECK: Did it get it right?
```

**Key concept:** During training, the model finds **patterns** (rules) that connect features to fire. During testing, it applies those rules to NEW data it has never seen. A good model learns REAL patterns (not just memorizes training data).

---

### 🔥 FIRE COLUMNS — Role in Training & Testing

These columns have a **dual role**: some are TARGETS (what we predict) and some become FEATURES (inputs) depending on the task.

| Column | Role in Training | Role in Testing | In-Depth Explanation |
|--------|-----------------|-----------------|---------------------|
| **fire_occurrence** | 🎯 **PRIMARY TARGET** — This IS the answer the model learns to predict. For every training sample, the model sees all 28 input features and tries to output 0 or 1 to match this column. When it gets it wrong, it adjusts its internal rules. | 🎯 **HIDDEN TARGET** — We remove this column, let the model predict, then compare its prediction to the real value to measure accuracy. | The model learns rules like: "IF temp > 35 AND NDVI < 0.3 AND slope > 20° THEN fire_occurrence = 1 (probability 87%)". Every single other feature exists to help predict THIS column. |
| **total_fire_count** | 📊 **SECONDARY TARGET or FEATURE** — Can be used as a regression target ("predict how many times it burns") OR as an input feature for the binary model (a pixel that burned 10 times before is likely to burn again). | Same dual use. If used as a feature → model gets this as input. If used as a target → it's hidden and predicted. | Helps the model learn **fire recurrence patterns**. A pixel with count=15 in Block 2 tells the model "this is a chronic fire spot" — very useful for predicting Block 4. |
| **FRP_mean_MW** | 📊 **FEATURE for classification** — Tells the model about fire intensity patterns at this pixel. Also a **REGRESSION TARGET** if we want to predict fire intensity instead of just yes/no. | If feature → provides intensity context. If target → hidden for prediction. | The model learns: "Locations with historically high FRP tend to burn again with high intensity." Low FRP areas might be agricultural burns (less concerning). High FRP = forest canopy fires (very concerning). |
| **FRP_max_MW** | 📊 **FEATURE** — Tells the model about the WORST fire this pixel ever had. More informative than mean because one extreme event matters more than many small ones. | Same — model uses past worst-case to judge future risk. | The model learns: "Pixels that had extreme fires (FRP > 200 MW) have conditions that enable extreme fires — steep slopes, dry fuel, wind corridors. These conditions persist." |
| **burned_area_binary** | 📊 **FEATURE** — Independent confirmation of fire from a DIFFERENT satellite method. Adds reliability — if BOTH active fire AND burn scar say "fire", the model is more confident. | Same — provides cross-validation signal to the model. | Having TWO independent fire detections (active fire + burn scar) is like having two witnesses. The model learns that when both agree, the fire signal is very reliable. When they disagree, there's uncertainty. |
| **burn_month_count** | 📊 **FEATURE** — Tells the model about PERSISTENCE. Did the fire burn for 1 month or 6 months? Long-burning fires indicate different conditions than flash burns. | Same — helps distinguish chronic vs acute fire areas. | The model learns: "Pixels with many burn months have sustained dry conditions or repeated human ignition. These are management priorities, not random events." |
| **FIRMS_brightness_K** | 📊 **FEATURE** — Adds thermal information. Higher brightness = hotter fire = more energy released. Complementary to FRP (they're related but not identical). | Same — adds thermal dimension. | Temperature and brightness capture slightly different physics. FRP estimates total power; brightness measures peak temperature. A small, very hot fire has high brightness but low FRP. A large, moderate fire has lower brightness but high FRP. Both signals help. |
| **FIRMS_confidence** | 📊 **FEATURE** — Data quality indicator. High confidence means the fire detection is trustworthy. Low confidence could be a false alarm (hot rock, industrial heat). | Same — helps model weight fire evidence. | The model learns: "When FIRMS_confidence > 80%, this is definitely a real fire. When confidence is 20%, maybe ignore this pixel — it might be a false alarm." This improves the model's ability to distinguish real fires from noise. |

#### ⚠️ Important: Which fire columns are FEATURES vs TARGETS?

```
For our MAIN TASK (predicting fire_occurrence in Block 4):

  TARGET (what we predict):
    → fire_occurrence     ← THIS is hidden during testing

  FEATURES (inputs the model can use):
    → total_fire_count    ← From PREVIOUS blocks only!
    → FRP_mean_MW         ← From previous blocks
    → FRP_max_MW          ← From previous blocks  
    → burned_area_binary  ← From previous blocks
    → burn_month_count    ← From previous blocks
    → FIRMS_brightness_K  ← From previous blocks
    → FIRMS_confidence    ← From previous blocks

  ⚠️ CRITICAL RULE: When predicting Block 4, we can ONLY use 
  fire history from Blocks 1-3. We CANNOT use Block 4's own 
  fire columns as features — that would be CHEATING (data leakage)!
```

---

### 🌡️ WEATHER COLUMNS — Role in Training & Testing

Weather features are **always inputs (features)**, never targets. They answer: "What climate conditions existed at this location?"

| Column | What the Model Learns During Training | How It Helps During Testing | Importance Rank |
|--------|--------------------------------------|---------------------------|-----------------|
| **temp_mean_C** | "Locations with mean temp > 30°C have 3x more fire than locations with mean temp < 25°C. The model draws a decision boundary around temperature ranges." | Given a new pixel's avg temperature, the model checks: is it in the "high fire" temperature zone or "low fire" zone? | ⭐⭐⭐ HIGH — direct drying effect |
| **temp_max_C** | "Even if average temp is moderate, ONE extreme hot month can trigger fire. The model learns that temp_max > 38°C is a strong fire signal regardless of temp_mean." | Captures extreme events that the average misses. A pixel with 28°C mean but 42°C max is very different from 28°C mean with 32°C max. | ⭐⭐⭐⭐ VERY HIGH — extreme heat trigger |
| **temp_min_C** | "Cold winters mean frost damage → dead vegetation → dry fuel for next fire season. The model learns this INDIRECT seasonal connection." | Combined with temp_max, it gives temperature RANGE. Large range = continental climate = extreme seasons = more fire-prone. | ⭐⭐ MODERATE — indirect effect through dead fuel |
| **precip_mean_mm** | "The model learns the INVERSE relationship: more rain → less fire. But it also learns the PARADOX: very high rainfall areas grow MORE biomass → MORE fuel when it dries. So the relationship is non-linear." | Helps the model estimate: is this a wet zone (low fire) or dry zone (high fire)? But the tree models (XGBoost, etc.) can capture the non-linear relationship automatically. | ⭐⭐⭐⭐ VERY HIGH — primary moisture supply |
| **precip_total_mm** | "Cumulative rainfall over 5 years captures DROUGHT YEARS. If one block has unusually low total, an El Niño drought occurred → fire risk spikes." | Combined with precip_mean, captures both typical rainfall AND whether this specific block was drier than normal. | ⭐⭐⭐ HIGH — drought detection |
| **wind_speed_ms** | "Higher wind → fire spreads faster AND burns hotter (more oxygen). The model learns wind thresholds where fire danger jumps." | At test time, windy locations get higher fire probability. Even a small fire in a windy area is dangerous because it can spread rapidly. | ⭐⭐⭐ HIGH — spread rate control |
| **wind_direction_deg** | "Fires spread DOWNWIND. The model learns which wind directions push fire into forests vs away from them. In Western Ghats, southwest winds during monsoon SUPPRESS fire, but northeast winds in dry season SPREAD fire." | This is a CIRCULAR variable (0° = 360°) so the model needs to handle it carefully. In Python, we'll encode it as sin(direction) and cos(direction) to avoid the discontinuity problem. | ⭐⭐ MODERATE — directional context |
| **relative_humidity_pct** | "Below 30% RH, dead fuel on the forest floor reaches critical dryness. The model learns this THRESHOLD effect — fire risk doesn't increase linearly with decreasing humidity, it JUMPS at ~30%." | Tree-based models (XGBoost, etc.) are excellent at learning these threshold effects because they naturally split at specific values. The model will likely create splits near 25-35% RH. | ⭐⭐⭐⭐ VERY HIGH — fuel moisture control |
| **VPD_kPa** | "VPD integrates temperature AND humidity into a single number. The model learns that VPD > 2.0 kPa = extreme fire danger. Many global fire studies rank VPD as the #1 predictor." | Often the SINGLE MOST IMPORTANT weather feature. Because it combines two variables into one physically meaningful metric, it gives the model more information per feature. | ⭐⭐⭐⭐⭐ HIGHEST — best single fire predictor |
| **dry_months_count** | "More dry months = longer fire season window. The model learns that locations with 30+ dry months per block (6+ per year) are chronic fire zones." | Directly estimates fire season LENGTH. Unlike temperature or rain which fluctuate, this gives a clean count that's easy for the model to use. | ⭐⭐⭐⭐ VERY HIGH — fire season duration |

#### How Weather Features Work Together in the Model:

```
The model doesn't use each feature alone — it combines them:

Example decision path in XGBoost:
  IF VPD > 1.8 kPa (dry atmosphere)
    AND temp_max > 36°C (heat event)
    AND dry_months > 25 (long fire season)
    AND wind_speed > 3 m/s (fire spread risk)
    THEN → fire probability = 91%

  IF VPD < 0.8 kPa (humid)
    AND precip_mean > 200 mm/month (heavy rain area)
    THEN → fire probability = 3%

This is why we need MULTIPLE weather variables — each adds a 
different piece of the puzzle. The model learns which combinations 
matter most.
```

---

### 🌿 VEGETATION COLUMNS — Role in Training & Testing

Vegetation = FUEL. The model needs to know: "How much fuel is there, and how ready is it to burn?"

| Column | What the Model Learns During Training | How It Helps During Testing | Importance Rank |
|--------|--------------------------------------|---------------------------|-----------------|
| **NDVI_mean** | "Average greenness is the most basic fuel indicator. Low NDVI (0.2-0.3) = sparse, dry → burns easily. High NDVI (0.7+) = dense, green → resistant. The model draws thresholds around 0.35-0.45 where fire risk changes dramatically." | Given a new pixel's NDVI, the model instantly categorizes it: sparse/dry fuel vs dense/moist forest. This is the FIRST check the model performs. | ⭐⭐⭐⭐⭐ HIGHEST — primary fuel indicator |
| **NDVI_max** | "Peak greenness tells the model about FUEL LOAD. NDVI_max = 0.85 means this pixel grew a LOT of biomass during monsoon. When this dries out → huge amount of dry fuel. The PARADOX: greener peak = more fire fuel later!" | Helps the model distinguish between areas that are ALWAYS sparse (low max = low fuel = moderate risk) vs areas that are GREEN then DRY (high max + low min = maximum fuel + maximum drying = HIGHEST risk). | ⭐⭐⭐ HIGH — fuel load estimation |
| **NDVI_min** | "The DRIEST the vegetation ever got. NDVI_min < 0.15 = near-complete drying of vegetation. The model learns this represents peak fire vulnerability." | Captures the WORST-CASE condition. Even if a location is usually green, one severe dry spell (low NDVI_min) signals extreme danger. | ⭐⭐⭐⭐ VERY HIGH — peak vulnerability |
| **NDVI_seasonality** | "High seasonality = DECIDUOUS forest (seasonal green→brown). This is the most fire-prone forest type. Low seasonality = EVERGREEN (always green). The model learns that seasonality > 0.15 is a strong fire signal." | This is like a FOREST TYPE indicator that's continuous, not categorical. The model can make fine-grained distinctions — mild seasonal change vs extreme change. Better than just "deciduous vs evergreen" binary. | ⭐⭐⭐⭐ VERY HIGH — forest type + fire regime |
| **EVI_mean** | "In DENSE forests where NDVI stops increasing (saturates at ~0.8), EVI keeps going. The model learns to use EVI for dense canopy areas and NDVI for open/sparse areas. Together they cover the FULL range." | Provides discriminating power where NDVI fails. Two pixels with NDVI=0.8 but EVI=0.5 vs EVI=0.7 are very different forests. The model can tell them apart using EVI. | ⭐⭐⭐ HIGH — dense forest differentiation |
| **LAI_mean** | "Leaf Area Index tells the model about CANOPY CLOSURE. High LAI = closed canopy = shaded, humid understory = fire resistant. Low LAI = open canopy = sun-dried ground fuel = fire prone. The model uses LAI as a microclimate indicator." | This captures something no other feature does: the UNDERSTORY conditions. Even if NDVI is high (green canopy), a low LAI might mean sparse canopy with dry understory. The model learns these subtle distinctions. | ⭐⭐⭐ HIGH — canopy/understory dynamics |
| **FPAR_mean** | "How actively photosynthesizing the vegetation is. Low FPAR = dormant/stressed vegetation. The model learns that when FPAR drops, it's the transition from growing season to fire season." | Adds temporal context: a recently active forest (high FPAR in previous months) with suddenly low FPAR = vegetation just died/dried = fresh fire fuel. | ⭐⭐ MODERATE — vegetation activity |
| **LFMC_proxy** | "THE most direct indicator of fire readiness. LFMC < 80% = vegetation will ignite. The model learns this as a THRESHOLD — above it, very few fires; below it, fire risk spikes." | Integrates greenness information into a single metric that directly relates to flammability. The model uses this like a "fire readiness score" for the vegetation. | ⭐⭐⭐⭐ VERY HIGH — direct flammability |

#### The Vegetation "Story" the Model Learns:

```
During monsoon (June-September):
  NDVI rises → EVI rises → LAI rises → FPAR rises → LFMC rises
  = GREEN, WET, GROWING → Fire risk: NEAR ZERO

During dry season (January-May):
  NDVI drops → EVI drops → LAI drops → FPAR drops → LFMC drops
  = BROWN, DRY, DORMANT → Fire risk: MAXIMUM

The model learns to read this "story" from the numbers:
  "This pixel has NDVI_max=0.8 but NDVI_min=0.15, seasonality=0.22
   → It's a deciduous forest that completely dries out
   → Combined with high VPD and low humidity: VERY HIGH fire risk"
```

---

### ⛰️ TOPOGRAPHY COLUMNS — Role in Training & Testing

Terrain is **STATIC** (same in Block 1 and Block 4) but it **permanently** controls where fire can start and how it spreads.

| Column | What the Model Learns During Training | How It Helps During Testing | Importance Rank |
|--------|--------------------------------------|---------------------------|-----------------|
| **elevation** | "Fire patterns change with altitude. Below 800m: hot, dry, most fires. 800-1500m: moderate. Above 1500m: cool, wet, few fires EXCEPT grassland fires. The model creates elevation bands with different fire rules for each." | Elevation is the MOST STABLE predictor — it never changes. The model can rely on it completely. A new pixel at 200m elevation will always have higher base fire risk than one at 1800m. | ⭐⭐⭐ HIGH — altitude-climate gradient |
| **slope_deg** | "Steep slopes (>20°) have dramatically higher fire spread rates. The model learns this NON-LINEAR relationship — fire risk is nearly flat from 0-10°, then increases steeply from 15-40°." | Combined with vegetation and wind, slope determines HOW FAST fire spreads. The model uses slope to estimate: "If fire starts here, can it be contained or will it race away?" | ⭐⭐⭐⭐ VERY HIGH — fire spread physics |
| **aspect_deg** | "South-facing slopes (150-210°) receive the most sun → driest → most fire. North-facing (330-30°) receive the least → wettest → least fire. The model learns this circular pattern." | ⚠️ This is a CIRCULAR variable (359° is next to 0°, not far from it). Raw degrees can confuse the model. In Python, we encode it as sin(aspect) and cos(aspect). Then the model correctly understands that 355° and 5° are nearby. | ⭐⭐ MODERATE — sun exposure proxy |
| **TWI** | "Low TWI = ridgetops/steep slopes where water drains away → dry → fire. High TWI = valley bottoms where water pools → wet → no fire. The model learns TWI as a MICRO-MOISTURE indicator." | Captures moisture patterns that rainfall data (9km resolution) is too coarse to see. TWI at 30m resolution tells the model about LOCAL wetness that determines whether THIS specific pixel can sustain fire. | ⭐⭐⭐ HIGH — micro-moisture pattern |

#### Why Static Features Are Powerful:

```
Dynamic features (weather, vegetation) change every block — they can be noisy.
Static features (elevation, slope, aspect, TWI) are ALWAYS the same.

This means:
  → The model can build a reliable "base fire risk map" from terrain alone
  → Then ADJUST it based on current weather and vegetation conditions
  → This is exactly what human fire managers do:
     "This ridge is ALWAYS high risk (terrain). But THIS year it's 
      even worse because of El Niño drought (weather)."

The combination of stable terrain + variable weather is what makes 
our predictions both RELIABLE and RESPONSIVE to current conditions.
```

---

### ✖️ CROSS-MODAL INTERACTION COLUMNS — Role in Training & Testing

These are the **secret weapon**. Research (Yuan et al., Doc4) proved these are among the **top 3 most important features**.

| Column | What the Model Learns During Training | How It Helps During Testing | Importance Rank |
|--------|--------------------------------------|---------------------------|-----------------|
| **terrain_x_veg** | "Steep slope × dry vegetation = EXTREME danger. But steep slope × green vegetation = not dangerous. And flat × dry = not as dangerous (fire won't spread fast on flat ground). ONLY the combination is dangerous." | Gives the model a pre-computed "terrain fire danger" score. Without this feature, the model has to FIGURE OUT that slope and NDVI interact — which is hard. With this feature, the interaction is handed to the model on a plate. | ⭐⭐⭐⭐⭐ HIGHEST — pre-computed danger signal |
| **climate_x_fuel** | "Hot temperature × dry vegetation = ignition conditions. The model learns that this compound variable is a better predictor than either temperature or NDVI alone." | This is essentially a "fire ignition potential" score. High values = both conditions for ignition are met simultaneously. The model can use a single threshold on this feature instead of complex multi-variable logic. | ⭐⭐⭐⭐⭐ HIGHEST — ignition probability |
| **FWI_proxy** | "The Fire Weather Index combines three weather aspects (heat, wind, dryness) into one score. High FWI = dangerous fire weather day. The model learns FWI thresholds where fire occurrence jumps dramatically." | This mimics the Canadian FWI system used worldwide by fire managers. It's a PROVEN effective index. Giving it to the model means the model doesn't have to rediscover this well-known relationship on its own. | ⭐⭐⭐⭐ VERY HIGH — established fire danger index |
| **dryness_x_fuel** | "Dry atmosphere (high VPD) + thin canopy (low LAI) = ground fuel is exposed to dry air and dries rapidly. The model learns this as an UNDERSTORY fire risk indicator." | Captures a specific fire mechanism: understory fires that burn along the ground in forests with open canopies. These are the most common fire type in Western Ghats dry deciduous forests. | ⭐⭐⭐⭐ VERY HIGH — understory fire mechanism |

#### Why Interaction Features Are So Powerful:

```
Without interaction features, the model has to learn:
  Step 1: slope is high → MAYBE dangerous
  Step 2: NDVI is low → MAYBE dangerous
  Step 3: BOTH are high/low at the same pixel → DEFINITELY dangerous
  
  This requires DEEP trees (many decision levels) → risk of overfitting!

With interaction features, the model just learns:
  Step 1: terrain_x_veg > 15 → DEFINITELY dangerous
  
  This requires just ONE split → simple, robust, generalizes better!

This is why Doc4 (Yuan et al.) found interaction features ranked
#1, #2, #3 in feature importance. They PRE-COMPUTE the physics
so the model doesn't have to discover it.
```

---

### 👥🗺️ HUMAN + LAND COVER — Role in Training & Testing

| Column | What the Model Learns During Training | How It Helps During Testing | Importance Rank |
|--------|--------------------------------------|---------------------------|-----------------|
| **population_density** | "The model learns the NON-LINEAR relationship: no people = no ignition source = low fire. Medium population (forest fringe villages) = MAXIMUM fire risk. High population (cities) = no forest = no fire. Tree models handle this U-shape automatically." | Captures the HUMAN IGNITION factor. No matter how dry or steep, fire needs an ignition source. In India, 95%+ of forest fires are human-caused. Without this variable, the model misses why some "perfect fire conditions" spots DON'T burn (no people nearby)." | ⭐⭐⭐⭐ VERY HIGH — ignition source |
| **land_cover** | "Different forest types have FUNDAMENTALLY different fire behaviors. The model learns: Deciduous (class 4) = 5x more fire than Evergreen (class 2). Cropland/forest mix (class 14) = highest ignition risk. It creates separate fire rules for each land type." | Acts as a CATEGORICAL grouping variable. The model essentially builds mini-models for each land cover type. "Rules for predicting fire in deciduous forest" are completely different from "rules for grassland fire". Land cover tells the model WHICH rule set to apply. | ⭐⭐⭐⭐ VERY HIGH — fire regime identifier |

---

### 📋 METADATA — Role in Training & Testing

| Column | Used as Feature? | Why / Why Not |
|--------|-----------------|---------------|
| **system:index** | ❌ NO — dropped before training | Just a row ID. Has no predictive meaning. |
| **block** | ⚠️ INDIRECT — used for train/test split | Tells us WHICH time period. Used to split data, but NOT as a model input (otherwise the model would just memorize "Block 4 = test"). |
| **block_role** | ❌ NO — dropped before training | Just a label saying "TRAIN" or "TEST". Would cause data leakage if used. |
| **latitude** | ⚠️ MAYBE — as a feature | Location can predict fire (fire clusters spatially). But including raw lat/lon risks SPATIAL OVERFITTING — the model memorizes "pixel at lat 15.3 burns" instead of learning WHY it burns. Use cautiously or encode as spatial features instead. |
| **longitude** | ⚠️ MAYBE — same as latitude | Same caution. Better to use lat/lon for spatial feature engineering (neighbor fire rates, distance to coast, etc.) than as raw input. |
| **.geo** | ❌ NO — dropped before training | GeoJSON string. Technical metadata, not a number the model can use. |

---

### 🎯 Summary: Feature Importance Tiers

Based on fire science literature and what ML models typically find:

```
TIER 1 — Top Predictors (model relies heavily on these):
  🏆 VPD_kPa              — Atmospheric drying power
  🏆 NDVI_mean            — Primary fuel indicator
  🏆 terrain_x_veg        — Slope × dry vegetation interaction
  🏆 climate_x_fuel       — Temperature × dry fuel interaction
  🏆 temp_max_C           — Extreme heat trigger

TIER 2 — Strong Predictors (important supporting features):
  ⭐ NDVI_min             — Peak vulnerability (driest condition)
  ⭐ NDVI_seasonality     — Deciduous vs evergreen (fire regime type)
  ⭐ dry_months_count     — Fire season length
  ⭐ relative_humidity_pct — Dead fuel moisture
  ⭐ slope_deg            — Fire spread physics
  ⭐ LFMC_proxy           — Direct flammability
  ⭐ FWI_proxy            — Fire weather index
  ⭐ dryness_x_fuel       — Understory fire risk
  ⭐ population_density   — Human ignition source
  ⭐ land_cover           — Fire regime type

TIER 3 — Useful Supporting Features:
  ✓ precip_mean_mm, precip_total_mm    — Moisture supply
  ✓ temp_mean_C, temp_min_C            — Temperature context
  ✓ wind_speed_ms                      — Spread rate
  ✓ elevation, TWI                     — Terrain moisture
  ✓ NDVI_max, EVI_mean, LAI_mean       — Fuel detail
  ✓ FRP_mean_MW, FRP_max_MW            — Fire history
  ✓ FPAR_mean                          — Vegetation activity

TIER 4 — Lower But Still Useful:
  ○ wind_direction_deg    — Directional context (needs encoding)
  ○ aspect_deg            — Sun exposure (needs encoding)
  ○ burn_month_count      — Fire persistence
  ○ FIRMS_brightness_K    — Thermal signature
  ○ FIRMS_confidence      — Data quality indicator
  ○ burned_area_binary    — Cross-validation with active fire
  ○ total_fire_count      — Fire recurrence
```

### 🔄 How Training Actually Works (Step by Step):

```
STEP 1: LOAD DATA
  ├── Read Blocks 1, 2, 3 CSV files (30,000 rows)
  ├── Separate: X = features (28 input columns), y = fire_occurrence (target)
  └── Drop metadata columns (system:index, block, block_role, .geo)

STEP 2: PREPROCESSING
  ├── Encode circular variables: aspect → sin(aspect) + cos(aspect)
  ├── Encode circular variables: wind_direction → sin(dir) + cos(dir)
  ├── One-hot encode land_cover (class 2 → [1,0,0,...], class 4 → [0,1,0,...])
  ├── Scale features: StandardScaler or leave raw (tree models don't need scaling)
  └── Handle any edge cases (VPD < 0 → clip to 0)

STEP 3: TRAIN 5 MODELS (each sees the SAME data but learns differently)
  ├── XGBoost:     Builds 500+ sequential decision trees, each fixing previous errors
  ├── LightGBM:    Similar but grows trees leaf-wise (faster, often more accurate)
  ├── CatBoost:    Handles categorical features (land_cover) natively
  ├── Random Forest: Builds 500+ INDEPENDENT trees, takes majority vote
  └── MLP:         Neural network — finds non-linear patterns trees might miss

STEP 4: META-LEARNER
  ├── Take the 5 predictions from Step 3 as NEW features
  ├── Train Ridge Regression to find optimal combination weights
  └── Final prediction = weighted average of 5 base model predictions

STEP 5: TEST ON BLOCK 4
  ├── Load Block 4 (9,249 rows)
  ├── Apply same preprocessing from Step 2
  ├── Each of 5 models makes prediction
  ├── Meta-learner combines them
  ├── Compare predictions vs actual fire_occurrence
  └── Report: AUC, F1-score, accuracy, calibration
```

---

## 6. How We Picked the Sample Points

### The Problem: Fire is Rare

If we randomly picked 10,000 points, ~9,500 would be "no fire" and ~500 would be "fire". A lazy computer would just always say "no fire" and be right 95% of the time. Useless!

### Our Solution: Equal Fire & Non-Fire

```
For each block:
  ✅ 5,000 points WHERE fire happened     (fire_occurrence = 1)
  ✅ 5,000 points WHERE fire did NOT happen (fire_occurrence = 0)
  ─────────────────────────────────────
  = 10,000 points per block (perfectly balanced)
```

| Setting | Value | Why |
|---------|-------|-----|
| Resolution | 1 km | Matches satellite pixel size |
| Balance | 50/50 fire vs non-fire | Forces model to learn the difference |
| Random seed | 42 | Reproducibility |

---

## 7. Final File Structure

### The 4 CSV Files

```
📂 Your Project Folder
│
├── WG_AGFE_Block1_2003_2008.csv   → 10,000 rows  [TRAIN]
├── WG_AGFE_Block2_2009_2014.csv   → 10,000 rows  [TRAIN]
├── WG_AGFE_Block3_2015_2020.csv   → 10,000 rows  [TRAIN]
└── WG_AGFE_Block4_2021_2025.csv   →  9,249 rows  [TEST]
                                    ─────────
                              Total: 39,249 rows
```

### Column Summary

| Group | Count | Columns |
|-------|-------|---------|
| 🔥 Fire | 8 | fire_occurrence, total_fire_count, FRP_mean_MW, FRP_max_MW, burned_area_binary, burn_month_count, FIRMS_brightness_K, FIRMS_confidence |
| 🌡️ Weather | 10 | temp_mean_C, temp_max_C, temp_min_C, precip_mean_mm, precip_total_mm, wind_speed_ms, wind_direction_deg, relative_humidity_pct, VPD_kPa, dry_months_count |
| 🌿 Vegetation | 8 | NDVI_mean, NDVI_max, NDVI_min, NDVI_seasonality, EVI_mean, LAI_mean, FPAR_mean, LFMC_proxy |
| ⛰️ Topography | 4 | elevation, slope_deg, aspect_deg, TWI |
| ✖️ Interactions | 4 | terrain_x_veg, climate_x_fuel, FWI_proxy, dryness_x_fuel |
| 👥 Human | 1 | population_density |
| 🗺️ Land Cover | 1 | land_cover |
| **TOTAL** | **36** | |

### How It All Connects

```
STEP 1: Satellites orbit Earth, taking pictures every day
           │
STEP 2: Google Earth Engine stores 22 years of these images
           │
STEP 3: Our GEE code extracts 36 measurements per location
           │
STEP 4: We get 4 CSV files (one per time block)
           │
STEP 5: Python ML pipeline will:
           ├── Load all 4 CSVs
           ├── Engineer MORE features (temporal trends, climate indices)
           ├── Remove redundant features
           ├── Train 5 ML models on Blocks 1-3
           ├── Test predictions on Block 4
           └── Create fire vulnerability maps for Western Ghats
```

---

## Quick Reference Card

| Question | Answer |
|----------|--------|
| What are we predicting? | `fire_occurrence` — will this pixel burn? (Yes/No) |
| How many features? | 36 from satellites + more engineered in Python |
| How many samples? | ~39,000 total across 4 blocks |
| Training data | Blocks 1–3 (2003–2020) = 30,000 samples |
| Test data | Block 4 (2021–2025) = 9,249 samples |
| Where? | Western Ghats, India |
| Time span | 22 years (2003–2025) in 5-year blocks |
| Data source | Satellites (MODIS, SRTM) + Weather (ERA5) via Google Earth Engine |

---

## References

### Satellite Data
1. **MODIS Fire** — NASA fire detection (MOD14A1, MCD64A1)
2. **MODIS Vegetation** — NDVI, EVI (MOD13A2)
3. **MODIS LAI/FPAR** — Leaf density (MOD15A2H)
4. **MODIS Land Cover** — Forest type (MCD12Q1)
5. **ERA5-Land** — European weather reanalysis (ECMWF)
6. **SRTM** — NASA elevation map
7. **WorldPop** — Population density
8. **FIRMS** — NASA Fire Information System

### Research Papers
- **[Doc1]** Sarkar et al. — AUC-Weighted Ensemble
- **[Doc2]** Shahzad et al. — Stacking Ensemble + SHAP
- **[Doc3]** Hu et al. — Bi-Layer Predictive Ensemble (BIPE)
- **[Doc4]** Yuan et al. — FireRisk-Multi (cross-modal features)

---

*AGFE-Fire v4 | Western Ghats, India | 2003–2025 | Guided by Prof. Kiran*
