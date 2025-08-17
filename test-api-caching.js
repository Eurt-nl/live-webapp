#!/usr/bin/env node

/**
 * Test script om API caching te valideren
 * Controleert of /api/** requests altijd network-only zijn
 */

const puppeteer = require('puppeteer')

async function testApiCaching() {
  console.log('🚀 Start API caching test...')
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true
  })
  
  try {
    const page = await browser.newPage()
    
    // Enable service worker logging
    await page.evaluateOnNewDocument(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('SW Message:', event.data)
        })
      }
    })
    
    // Navigate to the app
    console.log('📱 Loading app...')
    await page.goto('http://localhost:9001', { waitUntil: 'networkidle0' })
    
    // Wait for service worker to be ready
    await page.waitForTimeout(2000)
    
    // Check if service worker is active
    const swActive = await page.evaluate(() => {
      return navigator.serviceWorker.controller !== null
    })
    
    console.log(`🔧 Service Worker active: ${swActive}`)
    
    if (!swActive) {
      console.log('⚠️  Service Worker not active, waiting...')
      await page.waitForTimeout(3000)
    }
    
    // Test API request
    console.log('🌐 Testing API request...')
    
    const response = await page.evaluate(async () => {
      try {
        const start = Date.now()
        const response = await fetch('/api/test', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const end = Date.now()
        
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          duration: end - start,
          url: response.url
        }
      } catch (error) {
        return { error: error.message }
      }
    })
    
    console.log('📊 API Response:', response)
    
    // Check if response came from network (not cache)
    if (response.error) {
      console.log('❌ API request failed:', response.error)
    } else {
      console.log('✅ API request successful')
      console.log(`⏱️  Response time: ${response.duration}ms`)
      
      // Check cache headers
      const cacheControl = response.headers['cache-control']
      console.log(`📋 Cache-Control: ${cacheControl}`)
      
      if (cacheControl && cacheControl.includes('no-store')) {
        console.log('✅ Server correctly sends no-store header')
      } else {
        console.log('⚠️  Server cache headers not as expected')
      }
    }
    
    // Test second request to see if it's cached
    console.log('🔄 Testing second API request...')
    
    const response2 = await page.evaluate(async () => {
      try {
        const start = Date.now()
        const response = await fetch('/api/test', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const end = Date.now()
        
        return {
          status: response.status,
          duration: end - start
        }
      } catch (error) {
        return { error: error.message }
      }
    })
    
    console.log('📊 Second API Response:', response2)
    
    if (response2.error) {
      console.log('❌ Second API request failed:', response2.error)
    } else {
      console.log('✅ Second API request successful')
      console.log(`⏱️  Second response time: ${response2.duration}ms`)
      
      // If response times are similar, it suggests network-only (not cached)
      const timeDiff = Math.abs(response.duration - response2.duration)
      if (timeDiff < 50) {
        console.log('✅ Response times consistent - likely network-only')
      } else {
        console.log('⚠️  Response times differ significantly')
      }
    }
    
    // Check service worker cache
    const cacheInfo = await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        const apiCache = await caches.open('api-cache')
        const apiRequests = await apiCache.keys()
        
        return {
          cacheNames,
          apiCacheSize: apiRequests.length,
          apiRequests: apiRequests.map(req => req.url)
        }
      }
      return null
    })
    
    console.log('🗄️  Cache info:', cacheInfo)
    
    if (cacheInfo && cacheInfo.apiCacheSize === 0) {
      console.log('✅ API cache is empty - network-only working correctly')
    } else {
      console.log('⚠️  API cache contains entries')
    }
    
    console.log('✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

// Run the test
testApiCaching().catch(console.error)
