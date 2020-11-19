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
    return axios.post('/manage-files', {
      action: 'getFiles',
    }, reqConfig(this))
  },
  checkIsPublic (path) {
    return axios.head(config.BucketUrl + path)
      .then(res => res.status === 200)
      .catch(res => false)
  },
  setPublicOrPrivate (filepath, pub) {
    return axios.post('/manage-files', {
      action: pub ? 'setPublic' : 'setPrivate',
      filepath
    }, reqConfig(this))
  },
  getSharableUrl (filepath, download) {
    return axios.post('/manage-files', {
      action: 'getShareUrl',
      filepath,
      download
    }, reqConfig(this))
      .then(res => res.data)
  },
  addFolder (folderpath) {
    return axios.post('/manage-files', {
      action: 'addFolder',
      folderpath
    }, reqConfig(this))
  },
  deleteFile (filepath) {
    return axios.post('/manage-files', {
      action: 'deleteFile',
      filepath
    }, reqConfig(this))
  },
  getNewUploadPolicy (filepath, fileContentType, fileSize) {
    return axios.post('/manage-files', {
      action: 'getNewUploadUrl',
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
    return axios.post('/manage-files', {
      action: 'getSettings'
    }, reqConfig(this))
      .then(res => res.data.settings)
  },
  saveSettings (settings) {
    return axios.post('/manage-files', {
      action: 'saveSettings',
      settings
    }, reqConfig(this))
      .then(res => res.data)
  }
}