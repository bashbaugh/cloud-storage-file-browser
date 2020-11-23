import axiosLib from 'axios'
import config from '../config'

const axios = axiosLib.create({
  baseURL: config.APIEndpoint
})

const reqConfig = obj => ({
  headers: {
    'Authorization': `Bearer ${obj.idToken}`
  }
})

export default {
  idToken: null,
  getFiles () {
    return axios.get('/get-files', reqConfig(this))
  },
  checkIsPublic (path) {
    return axios.head(config.BucketUrl + path + `?bc_timestamp=${new Date().getTime()}`) // Append unused query param to ensure that browser cache is bypassed.
      .then(res => res.status === 200)
      .catch(res => false)
  },
  setPublicOrPrivate (filepath, pub) {
    return axios.post(pub ? '/set-public' : '/set-private', {
      filepath
    }, reqConfig(this))
  },
  getSharableUrl (filepath, download) {
    return axios.post('/get-share-url', {
      filepath,
      download
    }, reqConfig(this))
      .then(res => res.data)
  },
  addFolder (folderpath) {
    return axios.post('/add-folder', {
      folderpath
    }, reqConfig(this))
  },
  deleteFile (filepath) {
    return axios.post('/delete-file', {
      filepath
    }, reqConfig(this))
  },
  moveFile (filepath, destination) {
    return axios.post('/move-file', {
      filepath,
      destination
    }, reqConfig(this))
      .then(res => res.data)
  },
  getNewUploadPolicy (filepath, fileContentType, fileSize) {
    return axios.post('/get-new-upload-policy', {
      filepath,
      fileContentType,
      fileSize,
    }, reqConfig(this))
  },
  postFile (uploadPolicy, file, progressCb) {
    const data = new FormData()
    for (const [key, value] of Object.entries(uploadPolicy.fields)) { // Add form fields, including policy and signature, to formdata
      data.append(key, value)
    }
    data.append('file', file) // Add the file to the formdata

    return axiosLib.post(uploadPolicy.url, data, { // Use the axiosLib because it's a different API baseURL
      onUploadProgress: (p) => progressCb(p.loaded / p.total)
    })
  },
  getSettings () {
    return axios.get('/get-settings', reqConfig(this))
      .then(res => res.data.settings)
  },
  saveSettings (settings) {
    return axios.post('/save-settings', {
      settings
    }, reqConfig(this))
      .then(res => res.data)
  }
}