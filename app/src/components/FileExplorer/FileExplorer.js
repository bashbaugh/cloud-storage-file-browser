import React from 'react'
import './FileExplorer.css'
import { Header, Segment, Icon, Breadcrumb, List, Card, Button } from 'semantic-ui-react'



const FileExplorer = () => {
  const [state, setState] = React.useState({
    currentPath: [],
    refreshing: false
  })

  return (
    <div>
      <Header as='h2'>
        <u>Files</u>
      </Header>
      <div className='buttons'>
        <Button basic color='green' size='mini' onClick={(e) => {
          setState({ ...state, refreshing: true })
        }}>
          <Icon name='refresh' loading={state.refreshing}/>
          { state.refreshing ? 'Loading...' : 'Refresh'}
        </Button>
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
      
    </div>
  )
}

export default FileExplorer