#!/usr/bin/env node

/**
 * Test script voor frontend weather functionaliteit
 * Simuleert de browser fetch calls
 */

// Gebruik ingebouwde fetch (Node.js 18+)

async function testWeatherFetch() {
  console.log('🌤️  Testing frontend weather fetch...');

  try {
    // Simuleer de exacte fetch call die de frontend maakt
    const response = await fetch(
      'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=52.3676&lon=4.9041',
      {
        headers: {
          Accept: 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      },
    );

    if (!response.ok) {
      console.error(`❌ Weather fetch failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    const currentWeather = data.properties.timeseries[0];
    const details = currentWeather.data.instant.details;

    console.log('✅ Weather fetch successful!');
    console.log(`📊 Current weather data:`);
    console.log(`   Temperature: ${details.air_temperature}°C`);
    console.log(`   Wind Speed: ${details.wind_speed} m/s`);
    console.log(`   Wind Direction: ${details.wind_from_direction}°`);
    console.log(`   Humidity: ${details.relative_humidity}%`);
    console.log(`   Pressure: ${details.air_pressure_at_sea_level} hPa`);
    console.log(`   Cloud Cover: ${details.cloud_area_fraction}%`);

    return true;
  } catch (error) {
    console.error('❌ Weather fetch error:', error.message);
    return false;
  }
}

async function testWeatherWidgetData() {
  console.log('\n🔍 Testing weather widget data processing...');

  try {
    const response = await fetch(
      'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=52.3676&lon=4.9041',
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const data = await response.json();
    const currentWeather = data.properties.timeseries[0];
    const details = currentWeather.data.instant.details;

    // Simuleer de data processing die WeatherWidget.vue doet
    const weatherData = {
      temperature: Math.round(details.air_temperature),
      feelsLike: Math.round(details.air_temperature), // Gebruik gewone temperatuur als fallback
      humidity: Math.round(details.relative_humidity),
      windSpeed: Math.round(details.wind_speed * 10) / 10,
      pressure: Math.round(details.air_pressure_at_sea_level),
      cloudCover: Math.round(details.cloud_area_fraction),
      symbol: data.properties.timeseries[0].data.next_1_hours?.summary?.symbol_code || 'fair_day',
      lastUpdated: currentWeather.time,
    };

    console.log('✅ Weather data processing successful!');
    console.log(`📊 Processed weather data:`);
    console.log(`   Temperature: ${weatherData.temperature}°C`);
    console.log(`   Feels Like: ${weatherData.feelsLike}°C`);
    console.log(`   Humidity: ${weatherData.humidity}%`);
    console.log(`   Wind Speed: ${weatherData.windSpeed} m/s`);
    console.log(`   Pressure: ${weatherData.pressure} hPa`);
    console.log(`   Cloud Cover: ${weatherData.cloudCover}%`);
    console.log(`   Symbol: ${weatherData.symbol}`);
    console.log(`   Last Updated: ${weatherData.lastUpdated}`);

    // Test weather description mapping
    const testDescriptions = {
      lightrain: 'Regen',
      cloudy: 'Bewolkt',
      clearsky_day: 'Helder',
      fair_day: 'Mooi weer',
    };

    console.log(`\n🔍 Weather description test:`);
    console.log(`   ${weatherData.symbol} → ${testDescriptions[weatherData.symbol] || 'Onbekend'}`);

    return true;
  } catch (error) {
    console.error('❌ Weather data processing error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🌤️  Frontend Weather Test Suite');
  console.log('================================');

  const fetchSuccess = await testWeatherFetch();
  const processingSuccess = await testWeatherWidgetData();

  console.log('\n📋 Test Summary');
  console.log('==============');
  console.log(`Weather Fetch: ${fetchSuccess ? '✅' : '❌'}`);
  console.log(`Data Processing: ${processingSuccess ? '✅' : '❌'}`);

  if (fetchSuccess && processingSuccess) {
    console.log('\n🎉 All frontend weather tests passed!');
    console.log('💡 The weather functionality should work in the browser.');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.');
  }
}

// Run tests
main().catch(console.error);
