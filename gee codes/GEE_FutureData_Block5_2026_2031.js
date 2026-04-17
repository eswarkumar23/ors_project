var ecoregions = ee.FeatureCollection("RESOLVE/ECOREGIONS/2017");
var westernGhats = ecoregions.filter(ee.Filter.or(
  ee.Filter.eq('ECO_NAME', 'South Western Ghats moist deciduous forests'),
  ee.Filter.eq('ECO_NAME', 'North Western Ghats moist deciduous forests'),
  ee.Filter.eq('ECO_NAME', 'South Western Ghats montane rain forests'),
  ee.Filter.eq('ECO_NAME', 'North Western Ghats montane rain forests')
));
var studyArea = westernGhats.geometry();
Map.centerObject(westernGhats, 7);
Map.addLayer(westernGhats, {color: '228B22'}, 'Western Ghats');
var START = '2023-01-01';
var END   = '2024-12-31';
var points = ee.FeatureCollection.randomPoints({
  region: studyArea,
  points: 10000,
  seed: 42
});
print('Sample points:', points.size());
var dem       = ee.Image("USGS/SRTMGL1_003");
var elevation = dem.select('elevation');
var slope     = ee.Terrain.slope(dem);
var aspect    = ee.Terrain.aspect(dem);
var ndvi_coll = ee.ImageCollection("MODIS/061/MOD13A2")
  .filterDate(START, END).filterBounds(studyArea)
  .select('NDVI').map(function(i) { return i.multiply(0.0001); });
var NDVI_mean = ndvi_coll.mean();
var NDVI_min  = ndvi_coll.min();
var NDVI_max  = ndvi_coll.max();
var evi_coll = ee.ImageCollection("MODIS/061/MOD13A2")
  .filterDate(START, END).filterBounds(studyArea)
  .select('EVI').map(function(i) { return i.multiply(0.0001); });
var EVI_mean = evi_coll.mean();
var lf = ee.ImageCollection("MODIS/061/MOD15A2H")
  .filterDate(START, END).filterBounds(studyArea);
var LAI_mean  = lf.select('Lai_500m').map(function(i) {
  return i.multiply(0.1); }).mean();
var FPAR_mean = lf.select('Fpar_500m').map(function(i) {
  return i.multiply(0.01); }).mean();
var era5 = ee.ImageCollection("ECMWF/ERA5_LAND/MONTHLY_AGGR")
  .filterDate(START, END).filterBounds(studyArea);
var temp_mean = era5.select('temperature_2m').mean().subtract(273.15);
var temp_max  = era5.select('temperature_2m').max().subtract(273.15);
var temp_min  = era5.select('temperature_2m').min().subtract(273.15);
var dewpoint  = era5.select('dewpoint_temperature_2m').mean().subtract(273.15);
var es = temp_mean.multiply(17.27).divide(temp_mean.add(237.3)).exp().multiply(0.6108);
var ea = dewpoint.multiply(17.27).divide(dewpoint.add(237.3)).exp().multiply(0.6108);
var VPD = es.subtract(ea).max(0);
var RH = ea.divide(es).multiply(100).min(100).max(0);
var wu = era5.select('u_component_of_wind_10m').mean();
var wv = era5.select('v_component_of_wind_10m').mean();
var wind_speed = wu.pow(2).add(wv.pow(2)).sqrt();
var wind_dir   = wv.atan2(wu).multiply(180).divide(Math.PI).add(180);
var precip_mean  = era5.select('total_precipitation_sum').mean()
  .multiply(1000);
var precip_total = era5.select('total_precipitation_sum').sum()
  .multiply(1000);
var land_cover = ee.ImageCollection("MODIS/061/MCD12Q1")
  .filterBounds(studyArea).sort('system:time_start', false)
  .first().select('LC_Type1');
var pop = ee.ImageCollection("WorldPop/GP/100m/pop")
  .filter(ee.Filter.eq('country', 'IND'))
  .filter(ee.Filter.eq('year', 2020))
  .mosaic();
var FWI_proxy = temp_mean.multiply(wind_speed)
  .divide(precip_mean.add(1));
var LFMC_proxy = EVI_mean.divide(
  ee.Image(1).subtract(NDVI_mean).max(0.01)
);
var terrain_x_veg = slope.multiply(
  ee.Image(1).subtract(NDVI_mean)
);
var climate_x_fuel = temp_mean.multiply(
  ee.Image(1).subtract(NDVI_mean)
);
var dryness_x_fuel = VPD.multiply(
  LAI_mean.max(0.1).pow(-1)
);
var NDVI_seasonality = ndvi_coll.reduce(ee.Reducer.stdDev());
var slopeRad = slope.multiply(Math.PI).divide(180);
var TWI = slopeRad.tan().max(0.001).pow(-1).log();
var dry_months_count = era5.select('total_precipitation_sum').map(function(img) {
  return img.multiply(1000).lt(20).rename('dry');
}).sum();
var stack = ee.Image.cat([
  elevation.rename('elevation'),
  slope.rename('slope_deg'),
  aspect.rename('aspect_deg'),
  NDVI_mean.rename('NDVI_mean'),
  NDVI_min.rename('NDVI_min'),
  NDVI_max.rename('NDVI_max'),
  NDVI_seasonality.rename('NDVI_seasonality'),
  EVI_mean.rename('EVI_mean'),
  LAI_mean.rename('LAI_mean'),
  FPAR_mean.rename('FPAR_mean'),
  temp_mean.rename('temp_mean_C'),
  temp_max.rename('temp_max_C'),
  temp_min.rename('temp_min_C'),
  VPD.rename('VPD_kPa'),
  RH.rename('relative_humidity_pct'),
  wind_speed.rename('wind_speed_ms'),
  wind_dir.rename('wind_direction_deg'),
  precip_total.rename('precip_total_mm'),
  precip_mean.rename('precip_mean_mm'),
  land_cover.rename('land_cover'),
  FWI_proxy.rename('FWI_proxy'),
  LFMC_proxy.rename('LFMC_proxy'),
  terrain_x_veg.rename('terrain_x_veg'),
  climate_x_fuel.rename('climate_x_fuel'),
  dryness_x_fuel.rename('dryness_x_fuel'),
  TWI.rename('TWI'),
  dry_months_count.rename('dry_months_count')
]).unmask(0).clip(studyArea);
stack = stack.addBands(pop.rename('population_density').unmask(0));
print('Band names:', stack.bandNames());
print('Band count:', stack.bandNames().size());
var sampled = stack.reduceRegions({
  collection: points,
  reducer: ee.Reducer.first(),
  scale: 1000,
  tileScale: 8
});
sampled = sampled.map(function(f) {
  var coords = f.geometry().coordinates();
  return f.set({
    'longitude': coords.get(0),
    'latitude': coords.get(1),
    'block': 'Block5_2026_2031',
    'block_role': 'PREDICT',
    'block_id': 5,
    'fire_occurrence': 0,
    'total_fire_count': 0,
    'burned_area_binary': 0,
    'burn_month_count': 0,
    'FRP_mean_MW': 0,
    'FRP_max_MW': 0,
    'FIRMS_brightness_K': 0,
    'FIRMS_confidence': 0
  });
});
sampled = sampled.filter(ee.Filter.notNull(['elevation']));
print('Sampled count:', sampled.size());
print('First feature:', sampled.first());
Export.table.toDrive({
  collection: sampled,
  description: 'WG_AGFE_Block5_2026_2031',
  folder: 'AGFE_Fire_Data',
  fileNamePrefix: 'WG_AGFE_Block5_2026_2031',
  fileFormat: 'CSV'
});
print('');
print('════════════════════════════════════════════');
print('  ✅ Go to TASKS tab (top-right) → Run');
print('  📁 Exports to: Google Drive > AGFE_Fire_Data/');
print('  📄 File: WG_AGFE_Block5_2026_2031.csv');
print('');
print('  ✅ Included: NDVI, EVI, terrain, climate,');
print('     precipitation, land cover, population');
print('  ❌ Not included: FRP, FIRMS (set to 0)');
print('     Fire history added from Block 4 in Python');
print('════════════════════════════════════════════');
