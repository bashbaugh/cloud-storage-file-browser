const { Storage } = require('@google-cloud/storage')

const storage = new Storage()
const bucket = storage.bucket(process.env.CDN_BUCKET_NAME)

function setCors(req, res) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Authorization');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('')
  }
}

// Post request to manage files, create folders, request upload URLs, etc.
exports.manageFiles = (req, res) => {
  setCors(req, res)

  if (!req.method === 'POST') return res.status(405).send('Method not allowed')

  const body = JSON.parse(req.body) // We have to do this for some reason as the body is a string or smth

  switch (body.action) { // So for some reason I can only access the body through brace notation rather than dot notation
    /* Action getNewUploadUrl: Generates a signed file POST URL.
     * filepath: Where to upload the file to (in the bucket)
     * fileContentType: the MIME type of the file to be uploaded
     * fileSize: the size in bytes of the file
     */
    case 'getNewUploadUrl':
      const newFile = bucket.file(body.filepath)
      const expDate = new Date()
      expDate.setHours(expDate.getHours() + 5) // allow 5 hours for upload
      const options = {
        expires: expDate,
        conditions: [
          ['eq', '$Content-Type', body.fileContentType],
          ['content-length-range', 0, body.fileSize + 1024],
        ],
        fields: {
        }
      }
      return newFile.generateSignedPostPolicyV4(options)
        .then((data) => {
            const response = data[0]
            return res.json({ url: response.url, fields: response.fields })
        })
    default:
      res.status(404).send(`Couldn\'t find action`)
  }

}
