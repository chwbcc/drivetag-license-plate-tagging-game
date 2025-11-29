export async function checkBackendHealth() {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (!baseUrl) {
    console.error('[Health Check] No base URL configured');
    return {
      success: false,
      error: 'No base URL configured',
    };
  }
  
  console.log('[Health Check] Testing backend connection...');
  console.log('[Health Check] Base URL:', baseUrl);
  
  try {
    console.log('[Health Check] Checking root endpoint:', `${baseUrl}/`);
    const rootResponse = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[Health Check] Root endpoint status:', rootResponse.status);
    const rootText = await rootResponse.text();
    console.log('[Health Check] Root endpoint response:', rootText.substring(0, 200));
    
    if (!rootResponse.ok) {
      return {
        success: false,
        error: `Root endpoint returned ${rootResponse.status}`,
        details: rootText,
      };
    }
    
    console.log('[Health Check] Checking health endpoint:', `${baseUrl}/health`);
    const healthResponse = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[Health Check] Health endpoint status:', healthResponse.status);
    const healthText = await healthResponse.text();
    console.log('[Health Check] Health endpoint response:', healthText);
    
    if (!healthResponse.ok) {
      return {
        success: false,
        error: `Health endpoint returned ${healthResponse.status}`,
        details: healthText,
      };
    }
    
    try {
      const healthData = JSON.parse(healthText);
      console.log('[Health Check] ✅ Backend is healthy:', JSON.stringify(healthData, null, 2));
      return {
        success: true,
        health: healthData,
      };
    } catch (e) {
      console.log('[Health Check] ⚠️ Backend responded but not with JSON');
      return {
        success: false,
        error: 'Backend responded but not with valid JSON',
        details: healthText,
      };
    }
  } catch (error) {
    console.error('[Health Check] ❌ Failed to connect to backend:', error);
    return {
      success: false,
      error: `Network error: ${(error as any)?.message || 'Unknown'}`,
      details: error,
    };
  }
}
