export const environment = {
  production: true,
  apiUrl: 'http://localhost:8000/api', // Update based on your production domain
  spoonacular: {
    apiKey: '', // API key must be set via backend endpoint - never expose in frontend
    baseUrl: 'https://api.spoonacular.com'
  }
};
