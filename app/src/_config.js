// Duplicate and remove the underscore from this file and add your google oauth ID and API endpoint below before building

export default {
  googleClientId: 'your_id.apps.googleusercontent.com',
  APIEndpoint: 'https://region-yourprojectname.cloudfunctions.net',
  CDN_URL: 'https://cdn.mywebsite.com/', // The base URL to your CDN or bucket. This might be a custom subdomain or https://bucket-name.storage.googleapis.com/
  appName: 'CDN File Manager',
  hiddenFilePrefix: '.bucket.' // The prefix for hidden bucket config and temp files
}
