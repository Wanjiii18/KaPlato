# 🧪 Spoonacular API Testing Guide

## 1. Get Your API Key

1. Go to [Spoonacular.com](https://spoonacular.com/food-api)
2. Sign up for a free account
3. Navigate to your profile/dashboard
4. Copy your API key

## 2. Configure API Key

1. Open `src/environments/environment.ts`
2. Replace `'YOUR_SPOONACULAR_API_KEY'` with your actual API key:

```typescript
export const environment = {
  production: false,
  spoonacular: {
    apiKey: 'your-actual-api-key-here', // Replace this
    baseUrl: 'https://api.spoonacular.com'
  }
};
```

3. Also update `src/environments/environment.prod.ts` for production.

## 3. Test the API Connection

### Method 1: Using the Menu Management Page
1. Start your Ionic app: `ionic serve`
2. Navigate to the Karenderia Menu page
3. Look for the WiFi icon (📶) in the top-right header
4. Click the WiFi icon to test the API connection
5. Check the console logs and toast messages for results

### Method 2: Using the Order Modal
1. From the Menu Management page, click "Place Order"
2. In the order modal, you'll see:
   - A WiFi icon in the header
   - An "API Test" section in the menu tab
3. Click either test button
4. Check the results in console and toast messages

### Method 3: Browser Console Testing
1. Open your browser's developer tools (F12)
2. In the console, run:
```javascript
// Get the SpoonacularService instance
const spoonacularService = window.ng.getComponent(document.querySelector('app-order-modal')).spoonacularService;

// Test the API
spoonacularService.testApiConnection().then(result => {
  console.log('API Test Result:', result);
});
```

## 4. Expected Results

### ✅ Success Response:
```
✅ API Test Successful! Retrieved recipe: "Recipe Name"
```

### ❌ Common Error Messages:

**Invalid API Key:**
```
API Key is invalid or missing. Please check your environment configuration.
```
- **Solution:** Double-check your API key in environment files

**Quota Exceeded:**
```
API quota exceeded. Please check your Spoonacular plan.
```
- **Solution:** You've reached your daily/monthly limit. Upgrade plan or wait for reset.

**Network Error:**
```
Network error. Please check your internet connection.
```
- **Solution:** Check internet connection and firewall settings

## 5. Console Debugging

Open browser console to see detailed logs:
- `✅ API Test Success:` - Shows successful API calls
- `❌ API Test Failed:` - Shows error details
- `Testing Spoonacular API connection...` - Shows test initiation
- `API Key: Set/Not set` - Confirms if API key is configured

## 6. Testing Different API Features

Once basic connection works, test these features:

### Search Recipes:
1. In the order modal, try searching for food items (e.g., "chicken", "pasta")
2. Check if results load from Spoonacular

### Category Filtering:
1. Select different categories (breakfast, main dish, etc.)
2. Verify items load from the API

### Menu Loading:
1. Open the order modal
2. Check if popular recipes load automatically

## 7. Troubleshooting

### CORS Issues:
If you get CORS errors, add this to your `ionic.config.json`:
```json
{
  "proxies": [
    {
      "path": "/api/*",
      "proxyUrl": "https://api.spoonacular.com/*"
    }
  ]
}
```

### API Rate Limits:
- Free plan: 150 requests/day
- Make sure to not exceed limits during testing

## 8. Production Checklist

Before deploying:
- [ ] Real API key set in `environment.prod.ts`
- [ ] API quota sufficient for expected usage
- [ ] Error handling working properly
- [ ] Fallback images configured for failed recipe images
- [ ] Cost calculations are reasonable for your market

## 9. Next Steps

After API is working:
1. Customize ingredient cost mapping in `SpoonacularService`
2. Adjust profit margins as needed
3. Add more recipe categories
4. Implement inventory tracking
5. Add nutritional information display
