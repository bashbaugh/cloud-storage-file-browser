import React, { useState, useEffect } from 'react'
import './FileExplorer.css'
import { Header, Segment, Icon, Breadcrumb, List, Card, Button, Message } from 'semantic-ui-react'
import FileCard from '../FileCard/FileCard'
import { formatBytes } from '../../util/fileutil'
import api from '../../api/storage'

const FileExplorer = ({ idToken, profile }) => {
  const [state, setState] = useState({
    loading: false,
    loadingError: false,
    bucketName: 'objects'
  })
  const [path, setPath] = useState([])
  const [files, setFiles] = useState([]) // All file objects
  const [view, setView] = useState('list')

  const filesInPath = () => files // Files and folders in current path, excluding full path in names, sorted with folders first.
    // If filename starts with current path, is in root dir, and isn't the folder itself then include
    .filter(file => (!file.name.slice(0, -1).includes('/') && !path.length) || (file.name.startsWith(path.join('/')) && path.length) && file.name !== path.join('/') + '/')
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
    // When idToken is set, start loading files.
    if (!idToken || idToken.length < 3) return
    setState({...state, loading: true})

    getFiles()
  }, [idToken])

  const fileCards = () => {
    return filesInPath().map((file) => (
        <FileCard
          key={file.id}
          cardType={view}
          fileType={file.contentType}
          isFolder={file.isFolder}
          lastMod={file.updated}
          name={file.name}
          size={formatBytes(file.size)}
          downloadLink={file.downloadLink}
          onClickItem={() => {
            if (file.isFolder) {
              setPath(file.path.slice(0, -1).split('/')) // Remove ending slash from folder path and split into separate folder names
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
      <div className='buttons'>
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
        { !files || !files.length || !files[0].name && !state.loading && <p>There are no files here :(</p>}
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
      
    </div>
  )
}

export default FileExplorer