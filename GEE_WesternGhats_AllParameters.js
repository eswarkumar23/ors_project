// ============================================================
// AGFE-Fire v4: Western Ghats — COMPLETE Fire Dataset Extraction
// ============================================================
// ALL parameters from Doc5 methodology:
//
//  FIRE TARGETS (8 bands):
//    - Fire occurrence (binary), Total fire count
//    - FRP mean & max (from MOD14A1)
//    - Burned area binary & burn month count (from MCD64A1)
//    - FIRMS brightness temperature & confidence
//
//  WEATHER / CLIMATE (10 bands):
//    - Temperature (mean, max, min)
//    - Precipitation (mean monthly, total)
//    - Wind speed & direction
//    - Relative Humidity, VPD
//    - Dry months count (drought proxy)
//
//  VEGETATION / FUEL (8 bands):
//    - NDVI (mean, min, max, std)
//    - EVI, LAI, FPAR, LFMC proxy
//
//  TOPOGRAPHY (4 bands):
//    - Elevation, Slope, Aspect, TWI
//
//  HUMAN (1 band):
//    - Population density
//
//  CROSS-MODAL INTERACTIONS (4 bands) [Doc4]:
//    - Terrain × Vegetation
//    - Climate × Fuel
//    - Fire Weather Index proxy
//    - Dryness × Fuel
//
//  LAND COVER (1 band)
//
//  5-Year Temporal Blocks (Prof. Kiran):
//    Block 1: 2003-2008 | Block 2: 2009-2014
//    Block 3: 2015-2020 | Block 4: 2021-2025 (TEST)
// ============================================================


// ==========================================
//  1. STUDY AREA: Western Ghats
// ==========================================
var ecoregions = ee.FeatureCollection("RESOLVE/ECOREGIONS/2017");
var westernGhats = ecoregions.filter(ee.Filter.or(
  ee.Filter.eq('ECO_NAME', 'South Western Ghats moist deciduous forests'),
  ee.Filter.eq('ECO_NAME', 'North Western Ghats moist deciduous forests'),
  ee.Filter.eq('ECO_NAME', 'South Western Ghats montane rain forests'),
  ee.Filter.eq('ECO_NAME', 'North Western Ghats montane rain forests')
));
var studyArea = westernGhats.geometry();

Map.centerObject(westernGhats, 7);
Map.addLayer(westernGhats, {color: '228B22'}, 'Western Ghats Boundary');


// ==========================================
//  2. TEMPORAL BLOCKS (Prof. Kiran)
// ==========================================
// Each block ≈ 1 complete ENSO cycle (4-5 years)
var blocks = [
  {name: 'Block1_2003_2008', start: '2003-01-01', end: '2008-12-31', role: 'TRAIN'},
  {name: 'Block2_2009_2014', start: '2009-01-01', end: '2014-12-31', role: 'TRAIN'},
  {name: 'Block3_2015_2020', start: '2015-01-01', end: '2020-12-31', role: 'TRAIN'},
  {name: 'Block4_2021_2025', start: '2021-01-01', end: '2025-12-31', role: 'TEST'}
];


// ==========================================
//  3. STATIC FEATURES (computed once)
// ==========================================

// --- 3a. Topography from SRTM (30m) ---
var dem = ee.Image("USGS/SRTMGL1_003");
var elevation  = dem.select('elevation').rename('elevation');
var terrainAll = ee.Terrain.products(dem);
var slope      = terrainAll.select('slope').rename('slope_deg');
var aspect     = terrainAll.select('aspect').rename('aspect_deg');

// TWI (Topographic Wetness Index) — simplified: ln(1 / tan(slope))
// Full TWI needs flow accumulation; this approximation is standard for GEE
var slopeRad = slope.multiply(Math.PI).divide(180);
var twi = slopeRad.tan().max(0.001)  // avoid division by zero
  .pow(-1).log().rename('TWI');

// --- 3b. Population Density (WorldPop, India, 2020) ---
var population = ee.ImageCollection("WorldPop/GP/100m/pop")
  .filter(ee.Filter.eq('country', 'IND'))
  .filter(ee.Filter.eq('year', 2020))
  .mosaic()
  .rename('population_density');

// Bundle all static features
var staticFeatures = elevation
  .addBands(slope)
  .addBands(aspect)
  .addBands(twi)
  .addBands(population);


// ==========================================
//  4. BLOCK PROCESSING FUNCTION
// ==========================================

function processBlock(block) {
  var start = block.start;
  var end   = block.end;
  
  // -------------------------------------------------------
  //  A. FIRE TARGETS — Active Fire (MOD14A1, daily, 1km)
  // -------------------------------------------------------
  var mod14 = ee.ImageCollection("MODIS/061/MOD14A1")
    .filterDate(start, end)
    .filterBounds(studyArea);
  
  // FireMask: 7=low confidence fire, 8=nominal, 9=high
  var fireImages = mod14.select('FireMask').map(function(img) {
    return img.gte(7).rename('fire').copyProperties(img, ['system:time_start']);
  });
  
  // Did this pixel have ANY fire in this block? (binary 0/1)
  var fireOccurrence = fireImages.max().unmask(0).rename('fire_occurrence');
  
  // How many days was fire detected? (count)
  var totalFireCount = fireImages.sum().unmask(0).rename('total_fire_count');
  
  // FRP — Fire Radiative Power (MW) — fire intensity
  var frpMean = mod14.select('MaxFRP').mean().unmask(0).rename('FRP_mean_MW');
  var frpMax  = mod14.select('MaxFRP').max().unmask(0).rename('FRP_max_MW');
  
  // -------------------------------------------------------
  //  B. FIRE TARGETS — Burned Area (MCD64A1, monthly, 500m)
  // -------------------------------------------------------
  var mcd64 = ee.ImageCollection("MODIS/061/MCD64A1")
    .filterDate(start, end)
    .filterBounds(studyArea);
  
  // BurnDate > 0 means the pixel burned that month
  var burnedImages = mcd64.select('BurnDate').map(function(img) {
    return img.gt(0).rename('burned');
  });
  
  // Did this pixel burn at all in this block?
  var burnedBinary = burnedImages.max().unmask(0).rename('burned_area_binary');
  
  // How many months did it burn? (recurrence)
  var burnMonthCount = burnedImages.sum().unmask(0).rename('burn_month_count');
  
  // -------------------------------------------------------
  //  C. FIRE TARGETS — FIRMS brightness & confidence
  // -------------------------------------------------------
  var firms = ee.ImageCollection("FIRMS")
    .filterDate(start, end)
    .filterBounds(studyArea);
  
  var firmsT21  = firms.select('T21').mean().unmask(0).rename('FIRMS_brightness_K');
  var firmsConf = firms.select('confidence').mean().unmask(0).rename('FIRMS_confidence');
  
  // -------------------------------------------------------
  //  D. WEATHER / CLIMATE (ERA5-Land Monthly Aggregated)
  // -------------------------------------------------------
  var era5 = ee.ImageCollection("ECMWF/ERA5_LAND/MONTHLY_AGGR")
    .filterDate(start, end)
    .filterBounds(studyArea);
  
  // Temperature (Kelvin → Celsius)
  var tempMean = era5.select('temperature_2m').mean()
    .subtract(273.15).rename('temp_mean_C');
  var tempMax  = era5.select('temperature_2m').max()
    .subtract(273.15).rename('temp_max_C');
  var tempMin  = era5.select('temperature_2m').min()
    .subtract(273.15).rename('temp_min_C');
  
  // Precipitation (meters → millimeters)
  var precipMean  = era5.select('total_precipitation_sum').mean()
    .multiply(1000).rename('precip_mean_mm');
  var precipTotal = era5.select('total_precipitation_sum').sum()
    .multiply(1000).rename('precip_total_mm');
  
  // Wind speed = sqrt(u² + v²)
  var uWind = era5.select('u_component_of_wind_10m').mean();
  var vWind = era5.select('v_component_of_wind_10m').mean();
  var windSpeed = uWind.pow(2).add(vWind.pow(2)).sqrt()
    .rename('wind_speed_ms');
  
  // Wind direction (degrees, for fire spread analysis)
  var windDir = vWind.atan2(uWind)
    .multiply(180).divide(Math.PI)
    .add(180)
    .rename('wind_direction_deg');
  
  // Relative Humidity via Magnus formula
  //   es = 0.6108 × exp(17.27×T / (T+237.3))
  //   ea = 0.6108 × exp(17.27×Td / (Td+237.3))
  //   RH = (ea / es) × 100
  var dewTemp = era5.select('dewpoint_temperature_2m').mean().subtract(273.15);
  var airTemp = era5.select('temperature_2m').mean().subtract(273.15);
  
  var satVP = airTemp.multiply(17.27).divide(airTemp.add(237.3)).exp()
    .multiply(0.6108);  // saturation vapor pressure (kPa)
  var actVP = dewTemp.multiply(17.27).divide(dewTemp.add(237.3)).exp()
    .multiply(0.6108);  // actual vapor pressure (kPa)
  
  var relHumidity = actVP.divide(satVP).multiply(100)
    .min(100).max(0)
    .rename('relative_humidity_pct');
  
  // VPD — Vapor Pressure Deficit (kPa) — key fire weather variable
  var vpd = satVP.subtract(actVP).max(0).rename('VPD_kPa');
  
  // Drought proxy: count months with precipitation < 20mm
  var dryMonths = era5.select('total_precipitation_sum').map(function(img) {
    return img.multiply(1000).lt(20).rename('dry');
  }).sum().rename('dry_months_count');
  
  // -------------------------------------------------------
  //  E. VEGETATION / FUEL
  // -------------------------------------------------------
  
  // NDVI & EVI from MOD13A2 (16-day composite, 1km)
  var mod13 = ee.ImageCollection("MODIS/061/MOD13A2")
    .filterDate(start, end)
    .filterBounds(studyArea);
  
  // Scale factor: 0.0001
  var ndviMean = mod13.select('NDVI').mean().multiply(0.0001).rename('NDVI_mean');
  var ndviMin  = mod13.select('NDVI').min().multiply(0.0001).rename('NDVI_min');
  var ndviMax  = mod13.select('NDVI').max().multiply(0.0001).rename('NDVI_max');
  var ndviStd  = mod13.select('NDVI').reduce(ee.Reducer.stdDev())
    .multiply(0.0001).rename('NDVI_seasonality');
  
  var eviMean  = mod13.select('EVI').mean().multiply(0.0001).rename('EVI_mean');
  
  // LAI & FPAR from MOD15A2H (8-day, 500m)
  var mod15 = ee.ImageCollection("MODIS/061/MOD15A2H")
    .filterDate(start, end)
    .filterBounds(studyArea);
  
  var laiMean  = mod15.select('Lai_500m').mean().multiply(0.1).rename('LAI_mean');
  var fparMean = mod15.select('Fpar_500m').mean().multiply(0.01).rename('FPAR_mean');
  
  // LFMC proxy (Live Fuel Moisture Content) = EVI / (1 - NDVI)
  // Higher → wetter fuel → less fire-prone
  var lfmc = eviMean.divide(
    ee.Image(1).subtract(ndviMean).max(0.01)  // avoid div-by-zero
  ).rename('LFMC_proxy');
  
  // -------------------------------------------------------
  //  F. LAND COVER (MODIS MCD12Q1)
  // -------------------------------------------------------
  var startYear = parseInt(start.substring(0, 4), 10);
  var lcYear = Math.min(startYear + 2, 2022);  // cap at available year
  var landCover = ee.ImageCollection("MODIS/061/MCD12Q1")
    .filter(ee.Filter.calendarRange(lcYear, lcYear, 'year'))
    .first()
    .select('LC_Type1')
    .rename('land_cover');
  
  // -------------------------------------------------------
  //  G. CROSS-MODAL INTERACTION FEATURES [Doc4]
  // -------------------------------------------------------
  
  // 1. Terrain × Vegetation = Slope × (1 - NDVI)
  //    High slope + low vegetation = fire spreads fast uphill
  var terrainVeg = slope.multiply(
    ee.Image(1).subtract(ndviMean)
  ).rename('terrain_x_veg');
  
  // 2. Climate × Fuel = Temperature × (1 - NDVI)
  //    Hot + dry vegetation = high ignition risk
  var climateFuel = tempMean.multiply(
    ee.Image(1).subtract(ndviMean)
  ).rename('climate_x_fuel');
  
  // 3. Fire Weather Index proxy = (Temp × Wind) / (Precip + 1)
  //    Hot + windy + dry = extreme fire weather
  var fwiProxy = tempMean.multiply(windSpeed)
    .divide(precipMean.add(1))
    .rename('FWI_proxy');
  
  // 4. Dryness × Fuel = VPD × (1 / LAI)
  //    High atmospheric demand + thin canopy = fire-prone
  var drynessVeg = vpd.multiply(
    laiMean.max(0.1).pow(-1)
  ).rename('dryness_x_fuel');
  
  // -------------------------------------------------------
  //  H. COMBINE ALL BANDS INTO ONE IMAGE
  // -------------------------------------------------------
  var allBands = fireOccurrence
    // ---- Fire targets (8) ----
    .addBands(totalFireCount)
    .addBands(frpMean)
    .addBands(frpMax)
    .addBands(burnedBinary)
    .addBands(burnMonthCount)
    .addBands(firmsT21)
    .addBands(firmsConf)
    // ---- Weather (10) ----
    .addBands(tempMean)
    .addBands(tempMax)
    .addBands(tempMin)
    .addBands(precipMean)
    .addBands(precipTotal)
    .addBands(windSpeed)
    .addBands(windDir)
    .addBands(relHumidity)
    .addBands(vpd)
    .addBands(dryMonths)
    // ---- Vegetation (8) ----
    .addBands(ndviMean)
    .addBands(ndviMin)
    .addBands(ndviMax)
    .addBands(ndviStd)
    .addBands(eviMean)
    .addBands(laiMean)
    .addBands(fparMean)
    .addBands(lfmc)
    // ---- Cross-modal interactions (4) ----
    .addBands(terrainVeg)
    .addBands(climateFuel)
    .addBands(fwiProxy)
    .addBands(drynessVeg)
    // ---- Static: Topo(4) + Human(1) ----
    .addBands(staticFeatures)
    // ---- Land cover (1) ----
    .addBands(landCover);
  
  // Clip to study area
  allBands = allBands.clip(studyArea);
  
  // -------------------------------------------------------
  //  I. STRATIFIED SAMPLING (fire vs non-fire)
  // -------------------------------------------------------
  var sampled = allBands.stratifiedSample({
    numPoints: 5000,            // 5000 fire + 5000 non-fire = 10,000 per block
    classBand: 'fire_occurrence',
    region: studyArea,
    scale: 1000,                // 1km to match MODIS fire resolution
    seed: 42,
    geometries: true            // keep lat/lon for spatial analysis
  });
  
  // Add block metadata & coordinates
  sampled = sampled.map(function(f) {
    var coords = f.geometry().coordinates();
    return f
      .set('block', block.name)
      .set('block_role', block.role)
      .set('longitude', coords.get(0))
      .set('latitude', coords.get(1));
  });
  
  return sampled;
}


// ==========================================
//  5. PROCESS & EXPORT ALL BLOCKS
// ==========================================

// ---- Run all 4 blocks ----
blocks.forEach(function(block) {
  var data = processBlock(block);
  
  Export.table.toDrive({
    collection: data,
    description: 'WG_AGFE_' + block.name,
    fileNamePrefix: 'WG_AGFE_' + block.name,
    folder: 'AGFE_Fire_WesternGhats',
    fileFormat: 'CSV'
  });
  
  print('✅ Export task ready: ' + block.name + ' (' + block.role + ')');
});


// ==========================================
//  6. VISUALIZATION (Block 3: 2015-2020)
// ==========================================

// Fire count heatmap
var vizMOD14 = ee.ImageCollection("MODIS/061/MOD14A1")
  .filterDate('2015-01-01', '2020-12-31')
  .filterBounds(studyArea);

var vizFireCount = vizMOD14.select('FireMask').map(function(img) {
  return img.gte(7);
}).sum().clip(studyArea);

Map.addLayer(vizFireCount, {
  min: 0, max: 50,
  palette: ['FFFFFF', 'FFFF00', 'FFA500', 'FF0000', '8B0000']
}, '🔥 Fire Count 2015-2020');

// Max FRP heatmap
var vizFRP = vizMOD14.select('MaxFRP').max().clip(studyArea);
Map.addLayer(vizFRP, {
  min: 0, max: 500,
  palette: ['0000FF', '00FFFF', '00FF00', 'FFFF00', 'FF0000']
}, '⚡ Max FRP 2015-2020 (MW)');

// Burned area heatmap
var vizBurn = ee.ImageCollection("MODIS/061/MCD64A1")
  .filterDate('2015-01-01', '2020-12-31')
  .filterBounds(studyArea)
  .select('BurnDate')
  .map(function(img) { return img.gt(0); })
  .sum().clip(studyArea);

Map.addLayer(vizBurn, {
  min: 0, max: 10,
  palette: ['FFFFFF', 'FFD700', 'FF8C00', '8B4513', '000000']
}, '🗺️ Burn Months 2015-2020');

// NDVI for reference
var vizNDVI = ee.ImageCollection("MODIS/061/MOD13A2")
  .filterDate('2015-01-01', '2020-12-31')
  .filterBounds(studyArea)
  .select('NDVI').median().multiply(0.0001).clip(studyArea);

Map.addLayer(vizNDVI, {
  min: 0, max: 0.9,
  palette: ['CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
            '74A901', '66A000', '529400', '3E8601', '207401', '056201']
}, '🌿 NDVI Median 2015-2020');


// ==========================================
//  7. SUMMARY
// ==========================================
print('');
print('╔══════════════════════════════════════════════════╗');
print('║  AGFE-Fire v4: Western Ghats Dataset Extraction  ║');
print('╚══════════════════════════════════════════════════╝');
print('');
print('📍 Study Area: Western Ghats (4 ecoregions)');
print('📅 Period: 2003-2025 (22 years, 4 blocks)');
print('');
print('┌─────────────────────────────────────────────────┐');
print('│  TEMPORAL BLOCKS                                │');
print('│  Block 1: 2003-2008  →  TRAIN                  │');
print('│  Block 2: 2009-2014  →  TRAIN                  │');
print('│  Block 3: 2015-2020  →  TRAIN                  │');
print('│  Block 4: 2021-2025  →  TEST                   │');
print('└─────────────────────────────────────────────────┘');
print('');
print('┌─────────────────────────────────────────────────┐');
print('│  FEATURES PER SAMPLE (~36 columns)              │');
print('│                                                 │');
print('│  🔥 Fire Targets (8):                           │');
print('│     fire_occurrence, total_fire_count,           │');
print('│     FRP_mean, FRP_max,                          │');
print('│     burned_area_binary, burn_month_count,        │');
print('│     FIRMS_brightness, FIRMS_confidence           │');
print('│                                                 │');
print('│  🌡️ Weather (10):                               │');
print('│     temp (mean/max/min), precip (mean/total),    │');
print('│     wind_speed, wind_direction,                  │');
print('│     relative_humidity, VPD, dry_months_count     │');
print('│                                                 │');
print('│  🌿 Vegetation (8):                             │');
print('│     NDVI (mean/min/max/seasonality),             │');
print('│     EVI, LAI, FPAR, LFMC_proxy                  │');
print('│                                                 │');
print('│  ⛰️ Topography (4):                              │');
print('│     elevation, slope, aspect, TWI                │');
print('│                                                 │');
print('│  👤 Human (1):                                   │');
print('│     population_density                           │');
print('│                                                 │');
print('│  🔗 Cross-Modal [Doc4] (4):                      │');
print('│     terrain×veg, climate×fuel,                   │');
print('│     FWI_proxy, dryness×fuel                      │');
print('│                                                 │');
print('│  🗺️ Land Cover (1):                              │');
print('│     IGBP land cover type                         │');
print('└─────────────────────────────────────────────────┘');
print('');
print('📊 Sampling: 5,000 fire + 5,000 non-fire = 10,000 per block');
print('📦 Total: ~40,000 samples across 4 CSV files');
print('');
print('▶▶▶  Go to TASKS tab (top-right) to run exports  ◀◀◀');
