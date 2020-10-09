import React, { useState, useEffect, createRef } from 'react'
import './FileUploadModal.css'
import { Modal, Button, Icon, List, Progress } from 'semantic-ui-react'
import { formatBytes } from '../../util/fileutil'
import api from '../../api/storage'

const FileUploadModal = ({ open, closeModal, path, onSuccess }) => {
  const fileInput = createRef()
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('') // Progress status
  const [progress, setProgress] = useState(0) // Progress percent
  const [uploading, setUploading] = useState(false) // Is the file currently uploading
  const [error, setError] = useState(false) // Has there been an error

  const reset = (clearFiles) => {
    setError(false)
    setUploading(false)
    setProgress(0)
    setStatus('')
    if (!clearFiles) return
    fileInput.current.value = null
    setFiles([])
  }

  const startUpload = () => {
    files.forEach((file, i) => {
      reset(false)
      setStatus('Requesting upload policy...')
      api.getNewUploadPolicy(file.name, file.type, file.size)
        .catch((err) => {
          return Promise.reject(`Unable to get upload policy for file ${i+1}`)
        })
        .then((res) => {
          setUploading(true)
          setStatus(`Uploading file ${i + 1} of ${files.length}...`)
          return api.postFile(res.data, file)
            .catch((err) => Promise.reject(`Unable to upload file ${i+1}`))
        })
        .then((res) => {
          // Handle upload response
        })
        .catch((err) => { // Handle any error that occurred
          setError(true)
          setStatus(err)
        })
    })
  }

  const onFileChange = (e) => {
    setFiles(Array.from(e.target.files))
  }

  const fileList = files.map(file => (
    <List.Item>
      <span className="file-list-name">
        {file.name}
      </span> - {formatBytes(file.size)}
    </List.Item>
  ))

  return (
    <div>
      <Modal open={open} onClose={() => {reset(true); closeModal();}}>
        <Modal.Header>Upload Files</Modal.Header>
        <Modal.Content>
          <Modal.Description>
          </Modal.Description>
          <input multiple type="file" ref={fileInput} onChange={onFileChange}/>
          <div className='file-list'>
            <List>
              {fileList}
            </List>
          </div>
          <p style={{textAlign: 'right', marginRight: '30px', color: error ? 'red' : 'black'}}><strong>{status}</strong></p>
          {status && <Progress percent={progress} autoSuccess progress indicating={uploading} error={error} />}
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