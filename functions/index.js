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

exports.fetchFiles = (req, res) => {
  setCors(req, res)

  bucket.getFiles()
    .then((files) => {
      res.send(files)
    })
}
