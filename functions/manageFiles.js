const { Storage } = require('@google-cloud/storage')
const { OAuth2Client } = require('google-auth-library')

const storage = new Storage()
const bucket = storage.bucket(process.env.CDN_BUCKET_NAME)

const oauthClient = new OAuth2Client(process.env.OAUTH_CLIENT_ID)

const CDN_ADMINS = process.env.CDN_ADMINS.split(',') // CDN_ADMINS should be a comma-seperated list of admins

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

function setBucketCors() {
  const corsSetFlag = bucket.file('.bucket.cors-set')
  corsSetFlag.exists()
    .then(([exists]) => {
      if (!exists) {
        const corsConfig = [{
          "method": ["*"],
          "origin": ["*"],
          "responseHeader": ["*"]
        }]
        return bucket.setCorsConfiguration(corsConfig)
      }
    })
    .then(() => {
      corsSetFlag.save('This is a config file used by the CDN File Manager')
    })
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
            updated: file.updated
          }))
          return res.json({ bucket: bucket.name, files: filesResponse })
        })
        .catch((err) => {
          console.error(new Error(err))
          return res.status(500).send("Unable to get files")
        })
    case 'getNewUploadUrl':
      setBucketCors()
      const newFile = bucket.file(body.filepath)
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
      const file = bucket.file(body.filepath)
      return file.delete()
        .then(() => {
          return res.json({ deleted: true })
        })
        .catch(err => {
          console.error(err)
          return res.status(500).json({ error: 'Unable to delete file'})
        })

    default:
      res.status(400).send(`Couldn\'t find action`)
  }

}
