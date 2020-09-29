import React from 'react'
import { Header, Segment, Icon, Breadcrumb } from 'semantic-ui-react'

const FileExplorer = () => {
  let currentPath = []

  return (
    <div>
      <Header as='h2'>
        <u>Files</u>
      </Header>
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