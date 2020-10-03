import React, { useState, useEffect } from 'react'
import './FileUploadModal.css'
import { Modal, Button, Icon, List } from 'semantic-ui-react'
import { useDropzone } from 'react-dropzone'
import { formatBytes } from '../../util/fileutil'
import config from '../../config'

const FileUploadModal = ({ idToken, open, closeModal }) => {
  const {acceptedFiles, getRootProps, getInputProps} = useDropzone()

  const startUpload = () => {
    const file = acceptedFiles[0]
    fetch(config.APIEndpoint + '/manage-files', {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Bearer ${idToken}`
      }),
      body: JSON.stringify({
        action: 'getNewUploadUrl',
        filepath: file.path,
        fileContentType: file.type,
        fileSize: file.size
      })
    })
      .then((res) => {
        console.log(res)
      })
  }

  const fileList = acceptedFiles.map(file => (
    <List.Item>
      <span className="file-list-name">
        {file.path}
      </span> - {formatBytes(file.size)}
    </List.Item>
  ))

  return (
    <div>
      <Modal open={open} onClose={closeModal}>
        <Modal.Header>Upload Files</Modal.Header>
        <Modal.Content>
          <Modal.Description>
          </Modal.Description>
          <Button {...getRootProps()} basic size='huge' primary style={{margin: '0 auto', display: 'block'}}>
            <input {...getInputProps()} />
            Click or drag files here to upload
          </Button>
          <div className='file-list'>
            <List>
              {fileList}
            </List>
          </div>
        </Modal.Content>
        <Modal.Actions>
          <Button color='black' onClick={closeModal}>
            Cancel
          </Button>
          <Button color='orange' onClick={startUpload}>
            <Icon name='upload'/>
            Start Upload
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  )
}

export default FileUploadModal