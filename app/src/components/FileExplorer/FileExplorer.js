import React, { useState, useEffect } from 'react'
import './FileExplorer.css'
import { Header, Segment, Icon, Breadcrumb, List, Card, Button, Message, Modal, Form, Portal, Checkbox } from 'semantic-ui-react'
import { toast } from 'react-toastify'
import FileCard from '../FileCard/FileCard'
import { formatBytes, formatDatetime } from '../../util/fileutil'
import api from '../../api/storage'
import config from '../../config'

const FileExplorer = ({ idToken, profile, setExplorerPath, doRefresh, didRefresh }) => {
  const [state, setState] = useState({
    loading: false,
    loadingError: false,
    bucketName: 'objects',
  })
  const [path, setPathState] = useState([])
  const [files, setFiles] = useState([]) // All file objects
  const [view, setView] = useState('list')

  const [viewingAllFiles, setViewingAllFiles] = useState(false)

  const [deletionState, setDeletionState] = useState({
    open: false,
    saving: false,
    error: false,
    file: '',
    isFolder: false
  })

  const [fileToRename, setFileToRename] = useState({})
  const [renameInputValue, setRenameInputValue] = useState('')

  const [fileToMove, setFileToMove] = useState({})
  const [fileMoveDestination, setFileMoveDestination] = useState({})

  const setPath = (p) => { setPathState(p); setExplorerPath(p); }

  const filesInPath = (p = path, allFiles) => files // Files and folders in current path, excluding full path in names, sorted with folders first.
    .map(file => {
      const isFolder = file.name.endsWith('/')
      const splitPath = isFolder ? file.name.slice(0, -1).split('/') : file.name.split('/')
      return {
        ...file,
        isFolder,
        path: file.name,
        splitPath,
        name: splitPath[splitPath.length - 1],
      }
    })
    .filter(file => {
      if (allFiles) return true // Don't filter if listing every file
      if (file.splitPath === p || file.name.includes('.bucket.')) return false // If it's the folder itself or is a hidden file
      if (!p.length && file.splitPath.length === 1) return true // This is a root file in the root path
      return !!(file.splitPath.slice(0, -1).toString() === p.toString() && p.length) // If the file is in the right path, return true
    })
    .sort((first, second) => {
      return second.isFolder - first.isFolder
    }) // Sort objects so that folders are first

  const getFiles = () => {
    setState({...state, loading: true, loadingError: false})
    api.getFiles()
      .then(({ data }) => {
        setFiles(data.files)
        setState({...state, loadingError: false, loading: false, bucketName: data.bucket })
      })
      .catch(() => setState({ ...state, loading: true, loadingError: true }))
  }

  useEffect(() => {
    // When idToken and doRefresh are set, refresh the files
    if (!idToken || idToken.length < 3 || !doRefresh) return
    setState({...state, loading: true})

    getFiles()
    didRefresh()
  }, [idToken, doRefresh])

  const deleteFile = () => {
    setDeletionState({...deletionState, saving: true})
    api.deleteFile(deletionState.file)
      .then((res) => {
        toast.dark(`✔️ ${deletionState.isFolder ? 'Folder' : 'File'} deleted`)
        if (res.data.deleted) setDeletionState({...deletionState, open: false, error: false, saving: false})
        getFiles()
      })
      .catch((err) => {
        setDeletionState({...deletionState, error: true, saving: false})
      })
  }

  const renameFile = () => {
    let newFilePath = fileToRename.path.split('/')
    newFilePath[fileToRename.path.split('/').length - 1] = renameInputValue
    api.moveFile(fileToRename.path, newFilePath.join('/'))
      .then(data => {
        if (!data.success) return Promise.reject()
        toast.dark('🖊 File renamed!')
        setRenameInputValue('')
        getFiles()
      })
      .catch(() => toast.dark(`❗ Couldn't rename file. Make sure a file with the same name doesn't already exist.`))
    setFileToRename({})
  }

  const moveFile = (moveToParent) => {
    let destFolder = fileToMove.splitPath
    let newFilePath
    if (!moveToParent) destFolder[fileToMove.splitPath.length - 1] = fileMoveDestination.name // Add new file parent dir to file path
    else destFolder = destFolder.slice(0, -2) // Find parent dir path of file (2 levels up from file itself)
    api.moveFile(fileToMove.path, destFolder.concat(fileToMove.name).join('/'))
      .then(data => {
        if (!data.success) return Promise.reject()
        toast.dark('🚚 File moved!')
        setPath(destFolder)
        getFiles()
      })
      .catch(() => toast.dark(`❗ Couldn't move file. Make sure a file with the same name doesn't already exist in that folder.`))
    setFileToMove({})
  }

  const fileCards = () => {
    return filesInPath(path, viewingAllFiles).map((file) => (
        <FileCard
          key={file.id}
          cardType={view}
          fileType={file.contentType}
          isFolder={file.isFolder}
          lastMod={formatDatetime(file.updated)}
          name={viewingAllFiles ? file.path : file.name}
          size={formatBytes(file.size)}
          isPublic={false}
          isDimmed={!!fileToMove.path && !file.isFolder}
          onDelete={() => {
            // If the folder isn't empty then don't delete (TODO recursive folder deletion)
            if (file.isFolder && filesInPath(file.path.split('/').slice(0, -1)).length) return toast.dark('❌ You must delete all files from this folder first.')
            setDeletionState({...deletionState, open: true, file: file.path, isFolder: file.isFolder})
          }}
          onRename={() => { setFileToRename(file); setRenameInputValue(file.name);}}
          onMove={() => { setFileToMove(file); setFileMoveDestination({}); }}
          onClickItem={async () => {
            if (!!fileToMove.path) setFileMoveDestination(file) // The user is selecting a folder to move the file to
            else if (file.isFolder) {
              setViewingAllFiles(false)
              setPath(file.path.slice(0, -1).split('/')) // Remove ending slash from folder path and split into separate folder names
            } else {
              if (await api.checkIsPublic(file.path)) {
                navigator.clipboard.writeText(config.CDN_URL + file.path)
                  .then(() => {
                    toast.dark("📋 File URL copied to clipboard")
                  })
                  .catch(() => {
                    toast.dark(`File URL: ${config.CDN_URL + file.path}`, {
                      position: 'top-center',
                      draggable: false,
                      closeOnClick: false,
                      autoClose: 10000
                    })
                  })
              } else {
                const {url, duration} = await api.getSharableUrl(file.path)
                if (!url) toast.dark("🚫 Couldn't get sharable URL. Try making the file public instead.")
                navigator.clipboard.writeText(url)
                  .then(() => {
                    toast.dark(`🔗 Sharable URL copied to clipboard. It will expire in ${duration} days. Make this file public to get a permanent public link.`, {
                      autoClose: 8000
                    })
                  })
                  .catch(() => {
                    toast.dark(`Sharable URL (will expire in ${duration} days): ${url}`, {
                      position: 'top-center',
                      draggable: false,
                      closeOnClick: false,
                      autoClose: 10000
                    })
                  })
              }
            }
          }}
          onDownload={async (publicDownload) => {
            if (publicDownload) {
              window.open(file.downloadLink, '_blank')
            } else {
              const { url } = await api.getSharableUrl(file.path, true)
              window.open(url, '_blank')
            }
          }}
          checkIsPublic={() => api.checkIsPublic(file.path)}
          onSetPublic={(pub) => {
            api.setPublicOrPrivate(file.path, pub)
              .then(() => {
                toast.dark(pub ? "🌎 File is now publicly accessible" : "🔑 File is now private")
              })
              .catch(() => {
                toast.dark("❓ Something went wrong")
              })
          }}
        />
      )
    )
  }

  return (
    <div>
      <Header as='h2'>
        <u>Files</u>
      </Header>
      {/* Explorer controls */}
      <div className='explorer-buttons'>
        <Button icon='arrow alternate circle up' basic size='tiny' color='blue' onClick={() => setPath(path.slice(0, -1))}/>
        <Button basic color='green' size='tiny' onClick={getFiles}>
          <Icon name='refresh' loading={state.refreshing}/>
          Refresh
        </Button>
        <Button basic color='orange' size='tiny' onClick={() => setViewingAllFiles(!viewingAllFiles)}>
          <Icon name={viewingAllFiles ? 'checkmark box' : 'square outline'}/>
          List all files
        </Button>
        <Button.Group size='tiny'>
          <Button icon basic={view === 'grid'} color='purple' onClick={() => setView('list')}>
            <Icon name='list layout'/>
          </Button>
          <Button icon basic={view === 'list'} color='purple' onClick={() => setView('grid')}>
            <Icon name='grid layout'/>
          </Button>
        </Button.Group>
      </div>

      {/* Folder breadcrumbs */}
      <Breadcrumb>
        <Icon name='folder open outline'/>
        <Breadcrumb.Section link active={!path.length} onClick={() => setPath([])}>{state.bucketName}</Breadcrumb.Section>
        <Breadcrumb.Divider />
        { viewingAllFiles && <Breadcrumb.Section>all files and folders</Breadcrumb.Section>}
        { !viewingAllFiles &&
          path.map((folderName, folderDepth) => (
            <span>
              <Breadcrumb.Section link active={path.length === folderDepth+1} onClick={() => setPath(path.slice(0, folderDepth + 1))}>{folderName}</Breadcrumb.Section>
              <Breadcrumb.Divider />
            </span>
          ))
        }
      </Breadcrumb>

      {/* File Explorer */}
      <div className='files'>
        {state.loading && <Message icon negative={state.loadingError}>
          <Icon name={state.loadingError ? 'warning sign' : 'circle notched'} loading={!state.loadingError} />
          <Message.Content>
          <Message.Header>{ state.loadingError ? 'Something went wrong.' : 'Please wait...' }</Message.Header>
          { state.loadingError ? 'Either the request failed or you are not authorized to access these files. ' : 'We are gathering your files...' }
          { state.loadingError && <a href='#' onClick={getFiles}>Try again.</a> }
          </Message.Content>
          </Message>
        }
        {viewingAllFiles && <Message warning content='Files that contain the text .bucket. may store dashboard settings or other information, so be careful when deleting or renaming them.'/>}
        { !filesInPath().length && !state.loading && !viewingAllFiles && <p>There are no files here :(</p>}
        { view === 'list' ? (
          <List divided relaxed>
            {fileCards()}
          </List>
        ) : (
          <Card.Group>
            {fileCards()}
          </Card.Group>
        )}
      </div>

      {/* Delete Modal */}
      <Modal basic open={deletionState.open} onClose={() => setDeletionState({...deletionState, open: false, error: false, saving: false})}>
        <Header icon>
          <Icon name='delete' />
          Delete {deletionState.isFolder ? 'folder' : 'file'}
        </Header>
        <Modal.Content>
          <p style={{textAlign: 'center'}}>Are you sure you want to delete <span style={{ color: 'orange', fontWeight: 'bold'}}>{deletionState.file}</span>?
          </p>
          { deletionState.error && <p style={{textAlign: 'center', color: 'red'}}>Something went wrong and we couldn't delete that file.</p>}
        </Modal.Content>
        <Modal.Actions>
          <Button basic color='blue' inverted onClick={() => setDeletionState({...deletionState, open: false, error: false, saving: false})}>
            No
          </Button>
          <Button color='red' inverted onClick={deleteFile}>
            <Icon name='checkmark' /> { deletionState.saving ? 'Deleting...' : 'Yes' }
          </Button>
        </Modal.Actions>
      </Modal>

      {/*Rename Modal*/}
      <Modal open={!!fileToRename.path} onClose={() => setFileToRename({})} size='mini'>
        <Header icon>
          <Icon name='edit' />
          Rename {fileToRename.name}
        </Header>
        <Modal.Content>
          <Form as='div'>
            <Form.Field>
              <input placeholder='New name' value={renameInputValue} onChange={e => setRenameInputValue(e.target.value)}/>
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button basic color='blue' onClick={() => { setFileToRename({}); setRenameInputValue('');}}>
            Cancel
          </Button>
          <Button color='violet' onClick={renameFile}>
            <Icon name='checkmark' />
            Rename
          </Button>
        </Modal.Actions>
      </Modal>

      {/* File Move Popup*/}
      <Portal open={!!fileToMove.path} onClose={() => setFileToMove({})} closeOnDocumentClick={false}>
        <div className='file-move-portal' style={{ position: 'fixed' }}>
          <Segment className='file-move-portal-segment'>

            <p>{ !fileMoveDestination.name ? `Select the folder you want to move this file into.` :
              `Move ${fileToMove.name} into ${fileMoveDestination.name}?`}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                style={{ display: 'inline-block' }}
                size='small'
                content='Cancel'
                color='purple'
                onClick={() => setFileToMove({})}
              />
              { !fileMoveDestination.path && fileToMove.path && fileToMove.path.length > 1 && <Button
                style={{ display: 'inline-block' }}
                size='small'
                content='Move up to parent'
                color='blue'
                onClick={() => moveFile(true)}
              />}
              { fileMoveDestination.name && <Button
                style={{ display: 'inline-block' }}
                size='small'
                content='Confirm'
                color='green'
                onClick={() => moveFile()}
              />}
            </div>
          </Segment>
        </div>
      </Portal>
    </div>
  )
}

export default FileExplorer