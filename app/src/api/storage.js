import axiosLib from 'axios'
import config from '../config'

const axios = axiosLib.create({
  baseURL: config.APIEndpoint
})

export default {
  idToken: null,
  getFiles () {
    return axios.post('/manage-files', {
      action: 'getFiles',
    }, {
      headers: {
        'Authorization': `Bearer ${this.idToken}`
      }
    })
  },
  addFolder (folderpath) {
    return axios.post('/manage-files', {
      action: 'addFolder',
      folderpath
    }, {
      headers: {
        'Authorization': `Bearer ${this.idToken}`
      }
    })
  },
  deleteFile (filepath) {
    return axios.post('/manage-files', {
      action: 'deleteFile',
      filepath
    }, {
      headers: {
        'Authorization': `Bearer ${this.idToken}`
      }
    })
  },
  getNewUploadPolicy (filepath, fileContentType, fileSize) {
    return axios.post('/manage-files', {
      action: 'getNewUploadUrl',
      filepath,
      fileContentType,
      fileSize
    }, {
      headers: {
        'Authorization': `Bearer ${this.idToken}`
      }
    })
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
  }
}