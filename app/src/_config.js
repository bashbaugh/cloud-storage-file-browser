// Duplicate and remove the underscore from this file and add your google oauth ID and API endpoint below before building

export default {
  googleClientId: 'your_id.apps.googleusercontent.com', // The OAUTH client ID for your file browser
  APIEndpoint: 'https://region-yourprojectname.cloudfunctions.net/file-api', // The URL to the cloud function
  CDN_URL: 'https://cdn.mywebsite.com/', // The base URL to your CDN or bucket. This might be a custom subdomain or https://bucket-name.storage.googleapis.com/ if you don't have a CDN.
  BucketUrl: 'https://storage.googleapis.com/YOUR-BUCKET-NAME/', // This is used to bypass the cache on your CDN. ONLY replace the YOUR-BUCKET-NAME part with the name of your bucket.
  appName: 'CDN File Manager' // The name that appears at the top of the app menu.
}
