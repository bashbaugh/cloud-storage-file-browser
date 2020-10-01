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
      const response = files.map((file) => file.metadata)
      res.json(response)
    })
    .catch((err) => {
      console.error(new Error(err))
      return res.status(500).send("Unable to get files")
    })
}
