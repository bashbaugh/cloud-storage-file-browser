# GCP Storage File Browser

A lightweight file management wrapper for Google Cloud Storage made with React.js and react-semantic-ui. Not better than the  official browser built into the GCP dashboard, but if you just need a simple UI to upload and download files to a storage bucket (perhaps one attached to the GCP CDN or Cloudflare) and don't need complex permissions or retention controls then this one loads faster and looks nicer, in my opinion.

![file browser](https://s.bweb.app/file-manager-screenshots/browser.png "First version of the file manager")

![file upload](https://s.bweb.app/file-manager-screenshots/fileupload.png "File upload")

### Features

+ File browser/manager consumes a Google Cloud Functions API that uses the [GCP Storage Node Client](https://googleapis.dev/nodejs/storage/latest/). If you would rather use Amazon S3 or another cloud storage provider instead of Google Cloud, it shouldn't take too long to rewrite the API.
+ Simple access management: just add a list of comma-separated CDN admins who can then sign in with their Google accounts.
+ Basic file folder upload
+ Click a file name to copy the sharable link
+ Basic file structure operations such as delete/rename/move
+ Easily switch files between public and private mode
+ List and card view

## Installation


You will need Node 10 or greater and Yarn (or NPM) installed in order to build the app (although a CDN-installable version is planned for the future). I also won't go over the details of hosting the app here - I'll leave that up to you - but rather configuring everything in GCP.

You can host the file manager wherever you want. I have my file manager set up on a Cloudflare worker, as I also have the storage bucket set up with Cloudflare in order to use their free CDN. However, you can host it anywhere, even in the bucket itself!!!

Along with the React app, you'll also need to set up the API and OAuth screen.

### Authentication

The google sign-in plugin in the web app requires users to sign in to their Google account, obtaining an OAuth ID token that gets sent to the cloud functions API where it's used to verify the user's email. In order for it to work you need to register an OAuth client and consent screen on GCP.

1. First, create an OAuth Consent screen. You can do this by navigating to the [API Oauth consent screen](https://console.cloud.google.com/apis/credentials/consent) page.
2. Choose "external user" type, enter a name like "File Browser", and enter the domain/subdomain where you want to host the file manager for all the URL fields (except `authorized domains`, where you'll need to a top-level domain that you've verified in the [search console](https://search.google.com/search-console)). 
3. For the scopes section, just add the `userinfo.email` and `userinfo.profile` scopes. Don't add any additional scopes or info or you'll be required to go through the verification process with Google.
3. Once you create the consent screen, navigate to the [credentials page](https://console.cloud.google.com/apis/credentials) and select Create Credentials -> OAuth Client ID.
4. Choose web application and add your file manager domain/subdomain (including protocol) to the "Authorized JavaScript Origins". Under "Authorized redirect URIs," add the URL to the page you want your file dashboard to be hosted at. You will most likely need to include the final slash at the end of the domain (it's very picky). Finally, click Create. You might want to copy the OAuth Client ID that is generated as you'll need it for the next steps.

### The Cloud Functions API

If you host the cloud function needed for your dashboard on Google Cloud Functions in the same project as your storage bucket, it will automatically connect to cloud storage.

Before deploying cloud functions, make sure you [enable the Cloud Build API](https://console.cloud.google.com/marketplace/product/google/cloudbuild.googleapis.com), the [Cloud Storage API](https://console.cloud.google.com/flows/enableapi?apiid=storage-api.googleapis.com), and the [IAM service account credentials API](https://console.developers.google.com/apis/library/iamcredentials.googleapis.com). These will allow your functions to run and access Google Cloud Storage.

Additionally, you may need to add the Service Account Token Creator role to the service account used by your cloud functions. This will give them permission to generate signed URL policies for file uploads and downloads. To do this, visit the [IAM (identity and access management) page](https://console.cloud.google.com/iam-admin/iam) in the cloud console. In the list of service accounts, search for the account named "App engine default service account". Then, select "add" at the top of the page and under "New members", start typing and select the account you just found. Finally, select `Service Account Token Creator` for the role and click save.

![Adding the token creator role](https://s.bweb.app/file-manager-screenshots/addTokenRole.png "Adding the token creator role")

Now you need to upload the function. You can do so using the `gcloud` command line tool, or just upload the files directly to the GCP dashboard as I'll explain here. begin by navigating to the [Cloud Functions](https://console.cloud.google.com/functions/list) page and creating a new function. Set the name to `file-api` or something similar and make sure to allow unauthenticated access (the API will be secured by verifying the email of each user using their OAuth ID token). Keep note of or copy the URL as you'll need it in the last step.

![function setup](https://s.bweb.app/file-manager-screenshots/function-setup.png)

#### Environment Variables

Then, under `environment variables` you'll need to add 5 runtime variables:

+ `OAUTH_CLIENT_ID` - Your app's OAuth client ID from the authentication step
+ `CDN_ADMIN` - The email of your google account. You will be able to add additional CDN admins through the settings page in the app later.
+ `CDN_BUCKET_NAME` - The cloud storage bucket (in the same GCP project) where you want to store your files.
+ `CDN_URL` (optional) - The base URL to the CDN frontend for your bucket (without an ending slash): `https://cdn.example.com`. If you don't have a CDN subdomain you can leave it blank or set it to `https://bucket-name.storage.googleapis.com`
+ `DASHBOARD_ORIGIN` (optional) - This is used to set your bucket's [`Access-Control-Allow-Origin` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). If you want to block websites (other than the file manager) from fetching files from your bucket, set this to your file manager's URL (including protocol, excluding path). Otherwise, leave it blank to allow all origins.

![env variables](https://s.bweb.app/file-manager-screenshots/function-env-variables.png)

Finally, click next to add the code. It's a single function with an Express.js API.
You can clone this repo now and get the two small files from the `/functions` directory, or you can just copy and paste the two files from here: [`package.json`](/functions/package.json), [`fileApi.js`](/functions/fileApi.js). Also, make sure to set the entry point to `fileApi`.

![the function code](https://s.bweb.app/file-manager-screenshots/functions-code.png)

Click deploy, and after several seconds hopefully your API will be ready!

### Configuring the App

In the future, you may be able to just create a single HTML page for the React app but for now you'll have to clone this repo and build and host it yourself. 

Clone the repo and cd into the app directory, then make a copy of the `src/_config.js` at `src/config.js` file so that you can edit it:

    git clone https://github.com/scitronboy/cloud-storage-file-browser.git
    cd cloud-storage-file-browser/app
    cp src/_config.js src/config.js
    
Then, open the `src/config.js` file in an editor or `nano` and replace each property as instructed by the comments. Make sure to replace `GoogleClientId` with the OAuth client ID from the authorization step and `APIEndpoint` with the url to your cloud function from the API step.

Once you finish setting the config, install the dependencies and build the app with:

    yarn # or npm i
    yarn build # or npm run build

Then, you can take the compiled `app/build` directory and upload it to whichever hosting service you prefer! As mentioned previously I use a separate subdomain with Cloudflare workers, but you could also use Netlify/Vercel/something on GCP/etc.

Note that if you want to upload it to a subdirectory (of your CDN for example) you may need to make a few React configuration changes.
    
---

If you have any questions or run into any problems or need help hosting it, open an issue (or email me at `scitronboy[at]gmail[dot]com`).

Contributions are always welcome!