import React, { useState, useReducer, useEffect, createRef } from 'react'
import styles from './FileUploadModal.module.css'
import { Modal, Button, Icon, List, Progress, Checkbox, Popup } from 'semantic-ui-react'
import { toast } from 'react-toastify'
import { formatBytes } from '../../util/fileutil'
// import getDroppedOrSelectedFiles from '../../util/upload'
import api from '../../api/storage'
import axios from 'axios'


let uploadCancelFunc = () => {}

const initialUploadState = {
  files: [],
  status: '',
  progress: 0,
  totalProgress: 0,
  totalUploadSize: 0,
  totalUploadedSize: 0,
  uploading: false,
  error: false,
  folderUpload: false,
  uploadCancelled: false
}

function uploadStateReducer (state, action) {
  switch (action.type) {
    case 'reset':
      if (action.betweenSteps) return {...state, status: action.status || '', progress: 0, error: false }
      else {
        uploadCancelFunc() // Cancel the current upload request.
        return {...initialUploadState }
      }
    case 'setStatus':
      return {...state, status: action.status}
    case 'uploadError':
      console.error(action.error)
      return {...state, error: true, uploading: false, progress: 100, status: action.error + ' (preceding files successfully uploaded)'}
    case 'setUploading':
      return {...state, uploading: action.uploading}
    case 'setProgress':
      return {...state, progress: Math.round(action.rawProgress * 100 * 10) / 10}
    case 'addUploadedAmount':
      const totalUploadedSize = state.totalUploadedSize + action.amount
      return {...state,
        totalUploadedSize,
        totalProgress: totalUploadedSize / state.totalUploadSize * 100
      }
    case 'setFiles':
      let size = 0
      for (const file of action.files) size += file.size || 0 // Count the total size of all the files
      return {...state, files: action.files || [], totalUploadSize: size}
    case 'switchFolderUpload':
      return {...state, folderUpload: !state.folderUpload}
  }
}

const FileUploadModal = ({ open, closeModal, path, onSuccess }) => {
  const fileInput = createRef()

  const [state, dispatch] = useReducer(uploadStateReducer, initialUploadState)

  const startUpload = async () => {
    const shouldBePublic = (await api.getSettings()).defaultPublicFiles

    const handleStepFail = (err, message) => {
      console.error(err)
      // Return a rejection so that the catch block is called
      return Promise.reject(message)
    }

    for (const [i, file] of state.files.entries()) {
      try {
        dispatch({ type: 'reset', betweenSteps: true, status: 'Requesting upload policy...' })
        const uploadPolicy = await api.getNewUploadPolicy(file.name, file.type, file.size) // Get upload policy for full file destination path.
          .catch(err => handleStepFail(err, `Unable to get upload policy for file ${i+1}`))

        dispatch({ type: 'setUploading', uploading: true })
        dispatch({ type: 'setStatus', status: `Uploading file ${i + 1} of ${state.files.length}...` })

        const [uploadPromise, cancelFunc] = api.postFile(uploadPolicy, file, (p) => dispatch({ type: 'setProgress', rawProgress: p })) // Post file and set progress callback
        uploadCancelFunc = cancelFunc
        let doBreak = false
        await uploadPromise.catch(err => {
          // If the error was an intentional axios cancel, don't handle it and instead exit the loop
          if (axios.isCancel(err)) {
            doBreak = true
            return
          }
          return handleStepFail(err, `Unable to upload file ${i+1}`)
        })
        if (doBreak) break

        dispatch({ type: 'addUploadedAmount', amount: file.size || 0}) // File was successfully uploaded, add its size to the counter.

        dispatch({ type: 'setStatus', status: `Setting file ${shouldBePublic ? 'public' : 'private'}...` })
        await api.setPublicOrPrivate(file.name, shouldBePublic)
          .catch(err => handleStepFail(err, `Unable to make file ${i+1} ${shouldBePublic ? 'public' : 'private'}`))

        if (i === state.files.length - 1) { // If that was the last file
          toast.dark("🚀 All files uploaded!")
          dispatch({ type: 'reset' })
          setTimeout(onSuccess, 1000) // Wait one second before closing modal and refreshing explorer
        }
      } catch (errorMessage) {
        dispatch({ type: 'uploadError', error: errorMessage })
        break
      }
    }
  }

  const onFilesChange = (event) => {
    const parentPath = path.length ? path.join('/') + '/' : '' // Folder to upload files to
    let fileArray = Array.from(event.target.files).map(file => {
      const fileName = parentPath + (state.folderUpload ? file.webkitRelativePath : file.name) // The absolute destination path of file. webkitRelativePath is the relative path of the file on the user's FS.
      const newFile = new File([file], fileName, { type: file.type })
      return newFile
    })
    if (state.folderUpload) {
      // If it's a folder upload we also have to generate files for each folder so that they show up in the file manager
      let folderPaths = []
      for (const file of fileArray) {
        const fileParentFolder = file.name.split('/').slice(0, -1).join('/') + '/'
        console.log(fileParentFolder)
        if (!folderPaths.includes(fileParentFolder)) folderPaths.push(fileParentFolder)
      }
      folderPaths = folderPaths.map(folderName => new File([''], folderName))
      fileArray = fileArray.concat(folderPaths)
      console.log(fileArray)
    }
    dispatch({ type: 'setFiles', files: fileArray })
  }

  const fileList = state.files.map(file => (
    <List.Item>
      <span className={styles.fileListName}>
        {file.name}
      </span> - {formatBytes(file.size)}
    </List.Item>
  ))

  return (
    <div>
      <Modal open={open}>
        <Modal.Header>Upload Files</Modal.Header>
        <Modal.Content>
          <p>You can select multiple files or a single folder to upload. If you upload a folder, file structure will be preserved. Files will be uploaded to {(path || []).join('/') + '/'}.</p>

          <Checkbox toggle label='Upload a folder' checked={state.folderUpload} onClick={() => dispatch({ type: 'switchFolderUpload' })} />
          {/*<Popup content='' trigger={<Icon name='info circle' />} />*/}

          <div className={styles.fileInputContainer}>
            <input
              style={{ display: 'none' }}
              multiple
              type='file'
              webkitdirectory={state.folderUpload ? '' : undefined} // Seems redundant, but needed for some reason
              mozdirectory={state.folderUpload ? '' : undefined}
              msdirectory={state.folderUpload ? '' : undefined}
              odirectory={state.folderUpload ? '' : undefined}
              directory={state.folderUpload ? '' : undefined}
              ref={fileInput}
              onChange={onFilesChange}
            />
            <Button color='blue' size='huge' style={{ display: 'block', margin: '15px auto'}}  onClick={() => fileInput.current.click()} disabled={state.uploading}>
              Select { state.folderUpload ? 'a Folder' : 'Files'}
            </Button>
          </div>

          <div className={styles.fileList}>
            <List>
              {fileList}
            </List>
          </div>
          <p style={{textAlign: 'right', marginRight: '30px', color: state.error ? 'red' : 'black'}}><strong>{state.status}</strong></p>
          {state.status && <Progress percent={state.progress} color='teal' progress active={state.uploading} error={state.error} />}
          {state.status && state.uploading && <Progress percent={state.totalProgress} color='violet'/>}
        </Modal.Content>
        <Modal.Actions>
          <Button color='black' onClick={() => { dispatch({ type: 'reset' }); closeModal();}}>
            Cancel
          </Button>
          <Button color='orange' onClick={startUpload} disabled={!state.files.length || state.uploading}>
            <Icon name='upload'/>
            { state.uploading ? 'Uploading...' : 'Start Upload' }
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  )
}

export default FileUploadModal