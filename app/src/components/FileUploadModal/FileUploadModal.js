import React, { useState, useEffect, createRef } from 'react'
import styles from './FileUploadModal.module.css'
import { Modal, Button, Icon, List, Progress, Checkbox, Popup } from 'semantic-ui-react'
import { toast } from 'react-toastify'
import { formatBytes } from '../../util/fileutil'
import api from '../../api/storage'

const FileUploadModal = ({ open, closeModal, path, onSuccess }) => {
  const fileInput = createRef()
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('') // Progress status
  const [progress, setProgress] = useState(0) // Progress percent
  const [uploading, setUploading] = useState(false) // Is the file currently uploading
  const [error, setError] = useState(false) // Has there been an error

  const [folderUpload, setFolderUpload] = useState(false)

  const reset = (clearFiles) => {
    setError(false)
    setUploading(false)
    setProgress(0)
    setStatus('')
    if (!clearFiles) return
    if (fileInput.current) fileInput.current.value = null
    setFiles([])
  }

  const startUpload = async () => {
    const shouldBePublic = (await api.getSettings()).defaultPublicFiles

    let failed = false
    for (const [i, file] of files.entries()) {
      if (failed) break
      reset(false)
      setStatus('Requesting upload policy...')

      api.getNewUploadPolicy(file.name, file.type, file.size) // Get upload policy with full file destination path.
        .catch((err) => {
          return Promise.reject(`Unable to get upload policy for file ${i+1}`)
        })
        .then((res) => {
          setUploading(true)
          setStatus(`Uploading file ${i + 1} of ${files.length}...`)
          return api.postFile(res.data, file, (p) => setProgress(Math.round(p * 100 * 10) / 10)) // Post file and set progress callback
            .then(() => api.setPublicOrPrivate(file.name, shouldBePublic))
            .catch((err) => Promise.reject(`Unable to upload file ${i+1}`))
        })
        .then((res) => {
          if (i + 1 === files.length) {
            setProgress(100)
            setStatus(`All files successfully uploaded.`)
            toast.dark("🚀 All files uploaded!")
            reset(true)
            onSuccess()
          }
        })
        .catch((err) => { // Handle any error that occurred
          setError(true)
          setUploading(false)
          setProgress(100)
          console.error(err)
          setStatus(err + ' (preceding files successfully uploaded)')
          failed = true
        })
    }
  }

  const onFilesChange = (e) => {
    const originalFiles = Array.from(e.target.files)
    setFiles(originalFiles.map(file => {
      return new File([file], (path.length ? path.join('/') + '/' : '') + file.name, { type: file.type })
    }))
  }

  const fileList = files.map(file => (
    <List.Item>
      <span className={styles.fileListName}>
        {file.name}
      </span> - {formatBytes(file.size)}
    </List.Item>
  ))

  return (
    <div>
      <Modal open={open} onClose={() => {reset(true); closeModal();}}>
        <Modal.Header>Upload Files</Modal.Header>
        <Modal.Content>
          <p>Files will be uploaded to {(path || []).join('/') + '/'}</p>

          <Checkbox toggle label='Enable folder upload' checked={folderUpload} onClick={() => setFolderUpload(!folderUpload)} />
          {/*<Popup content='' trigger={<Icon name='info circle' />} />*/}

          <div className={styles.fileInputContainer}>
            <input multiple type="file" webkitdirectory={folderUpload && ''} mozdirectory={folderUpload && ''} ref={fileInput} onChange={onFilesChange}/>
          </div>

          <div className={styles.fileList}>
            <List>
              {fileList}
            </List>
          </div>
          <p style={{textAlign: 'right', marginRight: '30px', color: error ? 'red' : 'black'}}><strong>{status}</strong></p>
          {status && <Progress percent={progress} color='teal' progress active={uploading} error={error} />}
        </Modal.Content>
        <Modal.Actions>
          <Button color='black' onClick={() => {reset(true); closeModal();}}>
            Cancel
          </Button>
          <Button color='orange' onClick={startUpload} disabled={!files.length || uploading}>
            <Icon name='upload'/>
            { uploading ? 'Uploading...' : 'Start Upload' }
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  )
}

export default FileUploadModal