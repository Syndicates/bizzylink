/**
 * Test script to verify wallpaper API functionality
 */

const axios = require('axios');

async function testWallpaperAPI() {
  try {
    console.log('Testing wallpaper API...');
    
    // Test if backend is running
    const healthCheck = await axios.get('http://localhost:8080/api/test');
    console.log('✅ Backend is running:', healthCheck.data);
    
    // Test wallpaper update (this will fail without auth, but we can see if endpoint exists)
    try {
      const wallpaperUpdate = await axios.put('http://localhost:8080/api/user/profile', {
        wallpaperId: 'herobrine_hill'
      });
      console.log('✅ Wallpaper API response:', wallpaperUpdate.data);
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✅ Wallpaper API endpoint exists (401 Unauthorized - expected without token)');
      } else {
        console.log('❌ Wallpaper API error:', err.response?.status, err.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWallpaperAPI(); 