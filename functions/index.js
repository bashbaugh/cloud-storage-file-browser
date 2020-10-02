const {Storage} = require('@google-cloud/storage')

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

exports.manageStorage = (req, res) => {
  res.send('Hey')
};

exports.getFiles = (req, res) => {
  setCors(req, res)

  bucket.getFiles()
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
      res.json({ bucket: bucket.name, files: filesResponse })
    })
    .catch((err) => {
      console.error(new Error(err))
      return res.status(500).send("Unable to get files")
    })
}
