const { Storage } = require('@google-cloud/storage')
const { OAuth2Client } = require('google-auth-library')
const express = require('express')

const oauthClient = new OAuth2Client(process.env.OAUTH_CLIENT_ID)

const DEFAULT_SETTINGS = {
  defaultPublicFiles: false,
  privateUrlExpiration: 7,
  cdnAdmins: ''
}

const bucket = new Storage().bucket(process.env.CDN_BUCKET_NAME)
const CDN_URL = process.env.CDN_URL || null
const DASHBOARD_ORIGIN = process.env.DASHBOARD_ORIGIN || '*'

let CDN_ADMINS = [process.env.CDN_ADMIN]
let PRIVATE_URL_EXPIRY_DAYS = DEFAULT_SETTINGS.privateUrlExpiration

async function getUserSettings () {
  if (!(await bucket.file('.bucket.dashboard-settings.json').exists())[0]) return DEFAULT_SETTINGS // Settings don't exist, return defaults
  return JSON.parse((await bucket.file('.bucket.dashboard-settings.json').download())[0].toString('utf8'))
}

async function updateWithUserSettings () {
  const userSettings = await getUserSettings()
  if (!userSettings.useSettings) return
  PRIVATE_URL_EXPIRY_DAYS = userSettings.privateUrlExpiration
  CDN_ADMINS = [process.env.CDN_ADMIN]
  CDN_ADMINS.push(...userSettings.cdnAdmins.split(','))
}

updateWithUserSettings()

let CorsAlreadyChecked = false
async function setBucketCors() {
  if (CorsAlreadyChecked) return
  const corsSetFlag = bucket.file('.bucket.cors-configured')
  if ((await corsSetFlag.exists())[0]) { CorsAlreadyChecked = true; return }
  const corsConfig = [{
    "method": ["*"],
    "origin": [DASHBOARD_ORIGIN],
    "responseHeader": ["*"]
  }]
  await bucket.setCorsConfiguration(corsConfig)
  await corsSetFlag.save(`This bucket's CORS has been set to allow request from the file manager`)
  CorsAlreadyChecked = true
}

function cors(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST')
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.set('Access-Control-Max-Age', '3600')
    return res.status(204).send('')
  }
  next()
}

async function auth(req, res, next) {
  const idToken = req.headers.authorization && req.headers.authorization.split('Bearer ')[1]

  if (!idToken) return res.status(401).send("no id token")

  try {
    const userEmail = (await oauthClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.OAUTH_CLIENT_ID
    })).getPayload().email

    if (!CDN_ADMINS.includes(userEmail)) return res.status(403).send("Unauthorized")

    return next()
  } catch (err) {
    console.error(err)

    return res.status(403).send("Unauthorized")
  }
}

const api = express()

api.use(cors)
api.use(auth)

api.get('/get-files', (req, res, next) => {
  return bucket.getFiles()
    .then(([files]) => {
      const filesResponse = files.map(({ metadata: file } ) => ({
        cacheControl: file.cacheControl || '',
        contentEncoding: file.contentEncoding || '',
        contentType: file.contentType || '',
        version: file.generation,
        id: file.id,
        downloadLink: file.mediaLink,
        name: file.name,
        size: file.size,
        updated: file.updated,
        isPublic: !!(file.acl && file.acl.find(accessControl => accessControl.entity === 'allUsers' && accessControl.role === 'READER')) // File is public if it contains a allUsers read ACL
      }))
      return res.json({ bucket: bucket.name, files: filesResponse })
    })
    .catch(next)
})

api.post('/set-public', async (req, res, next) => {
  await bucket.file(req.body.filepath).makePublic().catch(next)
  return res.json({ success: true })
})

api.post('/set-private', async (req, res, next) => {
  await bucket.file(req.body.filepath).makePrivate().catch(next)
  return res.json({ success: true })
})

api.post('/get-share-url', async (req, res, next) => {
  const expiryDate = new Date(Date.now() + 60 * 60 * 1000) // Plus one hour
    if (!req.body.download) expiryDate.setDate(expiryDate.getDate() + PRIVATE_URL_EXPIRY_DAYS)
    const [url] = await bucket.file(req.body.filepath).getSignedUrl({
      version: 'v2',
      action: 'read',
      expires: expiryDate,
      cname: req.body.download ? null : CDN_URL,
      promptSaveAs: req.body.download ? req.body.filepath.split('/')[req.body.filepath.split('/').length - 1] : null
    }).catch(next)
    return res.json({ url, duration: PRIVATE_URL_EXPIRY_DAYS })
})

api.post('/get-new-upload-policy', async (req, res, next) => {
  const newFile = bucket.file(req.body.filepath)

  const expDate = Date.now() + 60 * 60 * 1000 // Allow 60 minutes for upload
  const options = {
    expires: expDate,
    conditions: [
      ['eq', '$Content-Type', req.body.fileContentType],
      ['content-length-range', 0, req.body.fileSize + 1024],
    ],
    fields: {
      'success_action_status': '201',
      'Content-Type': req.body.fileContentType
    }
  }
  return newFile.generateSignedPostPolicyV4(options)
    .then((data) => {
      const response = data[0]
      return res.json({ url: response.url, fields: response.fields })
    })
})

api.post('/add-folder', (req, res, next) => {
  const newFolder = bucket.file(req.body.folderpath + '/')
  return newFolder.exists()
    .then(([exists]) => {
      if (exists) return res.status(409).json({ error: 'file-exists'}) // 409 conflict
      return newFolder.save('')
    })
    .then(() => {
      res.json({ saved: true })
    })
    .catch((err) => {
      return res.status(500).json({ error: 'save-error' })
    })
})

api.post('/delete-file', async (req, res, next) => {
  await bucket.file(req.body.filepath).delete().catch(next)
  return res.json({ deleted: true })
})

api.post('/move-file', async (req, res, next) => {
  try {
    if ((await bucket.file(req.body.destination).exists())[0]) return res.status(409).json({ alreadyExists: true, success: false })
    const wasPublic = (await bucket.file(req.body.filepath).isPublic())[0]
    await bucket.file(req.body.filepath).move(req.body.destination)
    if (wasPublic) await bucket.file(req.body.destination).makePublic()
    else await bucket.file(req.body.destination).makePrivate()
    return res.json({ success: true })
  } catch (err) {
    return next(err)
  }
})

api.get('/get-settings', async (req, res, next) => {
  return res.json({ settings: await getUserSettings().catch(next) })
})

api.post('/save-settings', async (req, res, next) => {
  await bucket.file('.bucket.dashboard-settings.json').save(JSON.stringify(req.body.settings)).catch(next)
  updateWithUserSettings()
  return res.json({ success: true })
})

api.all('*', (req, res) => {
  return res.status(404).send('Route not found')
})

api.use((err, req, res, next) => {
  console.error(new Error(err))
  return res.status(500).send('API Error')
})

exports.fileApi = api
