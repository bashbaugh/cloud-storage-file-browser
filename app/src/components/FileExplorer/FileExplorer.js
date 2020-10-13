import React, { useState, useEffect } from 'react'
import './FileExplorer.css'
import { Header, Segment, Icon, Breadcrumb, List, Card, Button, Message, Modal } from 'semantic-ui-react'
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

  const [deletionState, setDeletionState] = useState({
    open: false,
    saving: false,
    error: false,
    file: '',
    isFolder: false
  })

  const setPath = (p) => { setPathState(p); setExplorerPath(p); }

  const filesInPath = (p = path) => files // Files and folders in current path, excluding full path in names, sorted with folders first.
    // If filename starts with current path, is in root dir, isn't the folder itself, and isn't a hidden config file, then include
    .filter(file => ((!file.name.slice(0, -1).includes('/') && !p.length) || (file.name.startsWith(p.join('/') + '/') && p.length)) && file.name !== p.join('/') + '/' && !file.name.startsWith('.bucket'))
    .map(file => ({...file, isFolder: file.name.endsWith('/'), path: file.name, name: file.name.endsWith('/') ?
        file.name.split('/')[file.name.split('/').length - 2] :
        file.name.split('/')[file.name.split('/').length - 1]})) // Just include name without path
    .sort((first, second) => second.isFolder - first.isFolder) // Sort objects so that folders are first

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
        if (res.data.deleted) setDeletionState({...deletionState, open: false, error: false, saving: false})
        getFiles()
        toast.dark("✔️ File deleted")
      })
      .catch((err) => {
        setDeletionState({...deletionState, error: true, saving: false})
      })
  }

  const fileCards = () => {
    return filesInPath().map((file) => (
        <FileCard
          key={file.id}
          cardType={view}
          fileType={file.contentType}
          isFolder={file.isFolder}
          lastMod={formatDatetime(file.updated)}
          name={file.name}
          size={formatBytes(file.size)}
          downloadLink={file.downloadLink}
          onDelete={() => setDeletionState({...deletionState, open: true, file: file.path, isFolder: file.isFolder})}
          onClickItem={() => {
            if (file.isFolder) {
              setPath(file.path.slice(0, -1).split('/')) // Remove ending slash from folder path and split into separate folder names
            } else {
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
            }
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
        {
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
        { !filesInPath().length && !state.loading && <p>There are no files here :(</p>}
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

      {/* Deletion Modal */}
      <Modal basic open={deletionState.open} onClose={() => setDeletionState({...deletionState, open: false, error: false, saving: false})}>
        <Header icon>
          <Icon name='delete' />
          Delete {deletionState.isFolder ? 'folder' : 'file'}
        </Header>
        <Modal.Content>
          <p style={{textAlign: 'center'}}>Are you sure you want to delete <span style={{ color: 'orange', fontWeight: 'bold'}}>{deletionState.file}</span>?
            {deletionState.isFolder && 'This is a folder. Folder deletion is not yet supported.'}
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
    </div>
  )
}

export default FileExplorer