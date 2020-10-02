import React, { useState, useEffect } from 'react'
import './FileExplorer.css'
import { Header, Segment, Icon, Breadcrumb, List, Card, Button, Message } from 'semantic-ui-react'
import config from '../../config'

const FileExplorer = ({ idToken, profile }) => {
  const [state, setState] = useState({
    currentPath: [],
    loading: false,
    loadingError: false
  })
  const [fileMetadata, setFileMetadata] = useState([])
  const [view, setView] = useState('list')

  const getFiles = () => {
    setState({...state, loading: true, loadingError: false})
    fetch(config.APIEndpoint + '/get-files', {
      headers: new Headers({
        'Authorization': `Bearer ${idToken}`
      })
    })
      .then(res => res.json())
      .then((data) => {
        setFileMetadata(data)
        setState({...state, loadingError: false, loading: false })
      })
      .catch(() => setState({ ...state, loading: true, loadingError: true }))
  }

  useEffect(() => {
    // When idToken is set, start loading files.
    if (!idToken || idToken.length < 3) return
    setState({...state, loading: true})

    getFiles()
  }, [idToken])

  return (
    <div>
      <Header as='h2'>
        <u>Files</u>
      </Header>
      <div className='buttons'>
        <Button basic color='green' size='tiny' onClick={getFiles}>
          <Icon name='refresh' loading={state.refreshing}/>
          Refresh
        </Button>
        <Button.Group size='tiny'>
          <Button icon basic={view === 'list'} color='purple' onClick={() => setView('grid')}>
            <Icon name='grid layout'/>
          </Button>
          <Button icon basic={view === 'grid'} color='purple' onClick={() => setView('list')}>
            <Icon name='list layout'/>
          </Button>
        </Button.Group>
      </div>
      <Breadcrumb>
        <Icon name='folder open outline'/>
        <Breadcrumb.Section link active={!state.currentPath.length}>Objects</Breadcrumb.Section>
        <Breadcrumb.Divider />
        {
          state.currentPath.map((folderName, folderDepth) => (
            <span>
              <Breadcrumb.Section link active={state.currentPath.length === folderDepth+1}>{folderName}</Breadcrumb.Section>
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
          { state.loadingError ? 'Either the request failed or you are not authorized to access these files ' : 'We are gathering your files...' }
          { state.loadingError && <a href='#' onClick={getFiles}>Try again.</a> }
          </Message.Content>
          </Message>
        }
      </div>
      
    </div>
  )
}

export default FileExplorer