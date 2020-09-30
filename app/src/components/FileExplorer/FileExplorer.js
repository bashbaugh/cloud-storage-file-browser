import React from 'react'
import './FileExplorer.css'
import { Header, Segment, Icon, Breadcrumb, List, Card } from 'semantic-ui-react'

const FileExplorer = () => {
  let currentPath = []
  let refreshing

  return (
    <div>
      <Header as='h2'>
        <u>Files</u>
      </Header>
      <div className='buttons'>
        <Button basic color='green' size='mini'>
          <Icon name='refresh' loading={refreshing}/>
          { refreshing ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
      <Breadcrumb>
        <Icon name='folder open outline'/>
        <Breadcrumb.Section link active={!currentPath.length}>Objects</Breadcrumb.Section>
        <Breadcrumb.Divider />
        {
          currentPath.map((folderName, folderDepth) => (
            <span>
              <Breadcrumb.Section link active={currentPath.length === folderDepth+1}>{folderName}</Breadcrumb.Section>
              <Breadcrumb.Divider />
            </span>
          ))
        }
      </Breadcrumb>
      
    </div>
  )
}

export default FileExplorer