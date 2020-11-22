const { Storage } = require('@google-cloud/storage')
const { OAuth2Client } = require('google-auth-library')

const oauthClient = new OAuth2Client(process.env.OAUTH_CLIENT_ID)

const DEFAULT_SETTINGS = {
  defaultPublicFiles: false,
  privateUrlExpiration: 7,
  cdnAdmins: ''
}

const storage = new Storage()
const bucket = storage.bucket(process.env.CDN_BUCKET_NAME)
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

function setCors(req, res) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST')
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.set('Access-Control-Max-Age', '3600')
    res.status(204).send('')
    return true
  }
}

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

// Post request to manage files, create folders, request upload URLs, etc.
exports.manageFiles = async (req, res) => {
  if (setCors(req, res)) return // Returns true on OPTIONS

  const idToken = req.headers.authorization && req.headers.authorization.split('Bearer ')[1]

  if (!idToken) return res.status(401).send("no id token")

  try {
    const userEmail = (await oauthClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.OAUTH_CLIENT_ID
    })).getPayload().email

    if (!CDN_ADMINS.includes(userEmail)) return res.status(403).send("Unauthorized")
  } catch (err) {
    console.error(err)

    return res.status(403).send("Unauthorized")
  }

  let body

  try {
    body = JSON.parse(req.body) // We have to do this for some reason as the body is a string sometimes??? This is the only way I got it to work.
  } catch {
    body = req.body
  }

  try {

    let file, newFile
    switch (body.action) {
      /* Action getNewUploadUrl: Generates a signed file POST URL.
       * filepath: Where to upload the file to (in the bucket)
       * fileContentType: the MIME type of the file to be uploaded
       * fileSize: the size in bytes of the file
       */
      case 'getFiles':
        return bucket.getFiles()
          .then((files) => {
            const filesMetadata = files[0].map((file) => file.metadata)
            const filesResponse = filesMetadata.map((file) => ({
              cacheControl: file.cacheControl || '',
              contentEncoding: file.contentEncoding || '',
              contentType: file.contentType || '',
              version: file.generation,
              id: file.id,
              downloadLink: file.mediaLink,
              name: file.name,
              size: file.size,
              updated: file.updated,
              isPublic: file.isPublic
            }))
            return res.json({ bucket: bucket.name, files: filesResponse })
          })
          .catch((err) => {
            console.error(new Error(err))
            return res.status(500).send("Unable to get files")
          })
      case 'setPublic':
        await bucket.file(body.filepath).makePublic()
        return res.json({ success: true })
      case 'setPrivate':
        await bucket.file(body.filepath).makePrivate()
        return res.json({ success: true })
      case 'getShareUrl':
        const expiryDate = new Date(Date.now() + 60 * 60 * 1000) // Plus one hour
        if (!body.download) expiryDate.setDate(expiryDate.getDate() + PRIVATE_URL_EXPIRY_DAYS)
        const [url] = await bucket.file(body.filepath).getSignedUrl({
          version: 'v2',
          action: 'read',
          expires: expiryDate,
          cname: body.download ? null : CDN_URL,
          promptSaveAs: body.download ? body.filepath.split('/')[body.filepath.split('/').length - 1] : null
        })
        return res.json({ url, duration: PRIVATE_URL_EXPIRY_DAYS })
      case 'getNewUploadUrl':
        await setBucketCors()

        newFile = bucket.file(body.filepath)

        const expDate = Date.now() + 60 * 60 * 1000 // Allow 60 minutes for upload
        const options = {
          expires: expDate,
          conditions: [
            ['eq', '$Content-Type', body.fileContentType],
            ['content-length-range', 0, body.fileSize + 1024],
          ],
          fields: {
            'success_action_status': '201',
            'Content-Type': body.fileContentType
          }
        }
        return newFile.generateSignedPostPolicyV4(options)
          .then((data) => {
            const response = data[0]
            return res.json({ url: response.url, fields: response.fields })
          })
      case 'addFolder':
        const newFolder = bucket.file(body.folderpath + '/')
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
      case 'deleteFile':
        await bucket.file(body.filepath).delete()
        return res.json({ deleted: true })
      case 'moveFile':
        if ((await bucket.file(body.destination).exists())[0]) return res.json({ alreadyExists: true, success: false })
        const wasPublic = (await bucket.file(body.filepath).isPublic())[0]
        await bucket.file(body.filepath).move(body.destination)
        if (wasPublic) await bucket.file(body.destination).makePublic()
        else await bucket.file(body.destination).makePrivate()
        return res.json({ success: true })
      case 'getSettings':
        return res.json({ settings: await getUserSettings() })
      case 'saveSettings':
        await bucket.file('.bucket.dashboard-settings.json').save(JSON.stringify(body.settings))
        updateWithUserSettings()
        return res.json({ success: true })
      default:
        res.status(400).send(`Couldn't find action`)
    }
  } catch (err) {
    console.error(err)
    res.status(500).send(`Something went wrong`)
  }
}
