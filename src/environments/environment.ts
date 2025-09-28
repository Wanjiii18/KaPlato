// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  enableLogging: true,
  performance: {
    enableDebugMode: true,
    lazyLoadDelay: 100
  },
  apiUrl: 'http://localhost:8000/api', // Laravel API URL - Updated for mobile access
  spoonacular: {
    apiKey: 'dd401666a6f944fabefcc73a78db06c7', // Replace with your actual API key from spoonacular.com
    baseUrl: 'https://api.spoonacular.com'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
