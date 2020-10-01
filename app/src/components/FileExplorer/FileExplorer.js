import React, { useState, useEffect } from 'react'
import './FileExplorer.css'
import { Header, Segment, Icon, Breadcrumb, List, Card, Button, Message } from 'semantic-ui-react'
import config from '../../config'

const FileExplorer = ({ accessToken, profile }) => {
  const [state, setState] = useState({
    currentPath: [],
    refreshing: false,
    loading: false,
    loadingError: false
  })
  const [fileMetadata, setFileMetadata] = useState([])
  const [view, setView] = useState('list')

  const getFiles = () => {
    setState({...state, loadingError: false})
    fetch(config.APIEndpoint + '/get-files')
      .then(res => res.json())
      .then(setFileMetadata)
      .catch(() => setState({ ...state, loadingError: true }))
  }

  useEffect(() => {
    // When accessToken is set, start loading files.
    if (!accessToken || accessToken.length < 3) return
    setState({...state, loading: true})

    getFiles()
  }, [accessToken])

  return (
    <div>
      <Header as='h2'>
        <u>Files</u>
      </Header>
      <div className='buttons'>
        <Button basic color='green' size='tiny' onClick={(e) => {
          setState({ ...state, refreshing: true })
        }}>
          <Icon name='refresh' loading={state.refreshing}/>
          { state.refreshing ? 'Loading...' : 'Refresh'}
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
        {state.loading || state.loadingError && <Message icon>
          <Icon name='circle notched' loading />
          <Message.Content>
          <Message.Header>Please wait...</Message.Header>
          We are gathering your files.
          </Message.Content>
          </Message>
        }
      </div>
      
    </div>
  )
}

export default FileExplorer