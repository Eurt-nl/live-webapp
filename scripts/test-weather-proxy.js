#!/usr/bin/env node

/**
 * Test script voor de weather proxy endpoint
 * Test zowel de proxy als directe MET Norway API calls
 */

const fetch = (await import('node-fetch')).default;

const TEST_COORDS = {
  amsterdam: { lat: 52.3676, lon: 4.9041 },
  oslo: { lat: 59.9139, lon: 10.7522 },
};

async function testDirectMETNorway(coords) {
  console.log('\n🔍 Testing direct MET Norway API...');
  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${coords.lat}&lon=${coords.lon}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PitchPuttApp/1.0 (https://pitch-putt.live)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Direct MET Norway failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    const current = data.properties.timeseries[0];
    console.log(`✅ Direct MET Norway success: ${current.data.instant.details.air_temperature}°C`);
    return true;
  } catch (error) {
    console.error('❌ Direct MET Norway error:', error.message);
    return false;
  }
}

async function testWeatherProxy(coords) {
  console.log('\n🔍 Testing weather proxy endpoint...');
  try {
    const url = `http://localhost:3000/api/weather?lat=${coords.lat}&lon=${coords.lon}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Weather proxy failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    const current = data.properties.timeseries[0];
    console.log(`✅ Weather proxy success: ${current.data.instant.details.air_temperature}°C`);
    return true;
  } catch (error) {
    console.error('❌ Weather proxy error:', error.message);
    return false;
  }
}

async function testRateLimiting() {
  console.log('\n🔍 Testing rate limiting...');
  const promises = [];

  // Stuur 15 requests (meer dan de 10/minuut limiet)
  for (let i = 0; i < 15; i++) {
    promises.push(
      fetch(`http://localhost:3000/api/weather?lat=52.3676&lon=4.9041`, {
        headers: { Accept: 'application/json' },
      }).then((res) => ({ status: res.status, ok: res.ok })),
    );
  }

  const results = await Promise.all(promises);
  const successful = results.filter((r) => r.ok).length;
  const rateLimited = results.filter((r) => r.status === 429).length;

  console.log(`📊 Rate limiting test: ${successful} successful, ${rateLimited} rate limited`);

  if (rateLimited > 0) {
    console.log('✅ Rate limiting working correctly');
  } else {
    console.log('⚠️  Rate limiting may not be working');
  }
}

async function main() {
  console.log('🌤️  Weather Proxy Test Suite');
  console.log('============================');

  const coords = TEST_COORDS.amsterdam;

  // Test 1: Direct MET Norway
  const directSuccess = await testDirectMETNorway(coords);

  // Test 2: Weather Proxy
  const proxySuccess = await testWeatherProxy(coords);

  // Test 3: Rate Limiting
  await testRateLimiting();

  // Summary
  console.log('\n📋 Test Summary');
  console.log('==============');
  console.log(`Direct MET Norway: ${directSuccess ? '✅' : '❌'}`);
  console.log(`Weather Proxy: ${proxySuccess ? '✅' : '❌'}`);

  if (directSuccess && proxySuccess) {
    console.log('\n🎉 All tests passed! Weather proxy is working correctly.');
  } else if (!directSuccess && proxySuccess) {
    console.log('\n🔄 MET Norway is down, but proxy fallback is working!');
  } else {
    console.log('\n❌ Some tests failed. Check server logs for details.');
  }
}

// Run tests
main().catch(console.error);
