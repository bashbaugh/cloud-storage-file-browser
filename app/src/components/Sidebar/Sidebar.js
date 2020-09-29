import React from 'react'
import { Header, Icon, Menu, Sidebar, Segment } from 'semantic-ui-react'

export default () => (
  <Sidebar
    as={Menu}
    icon='labeled'
    inverted
    vertical
    visible
    width='thin'
  >
    <Header as='h4' color='grey' style={{ margin: '10px auto' }}>CDN File Manager</Header>
    <Menu.Item as='a'>
      <Icon name='folder' />
      Files
    </Menu.Item>
    <Menu.Item as='a'>
      <Icon name='cloud upload' />
      Upload File(s)
    </Menu.Item>
    <Menu.Item as='a'>
      <Icon name='plus circle' />
      New Folder
    </Menu.Item>
    <Menu.Item as='a'>
      <Icon name='sign-out' />
      Sign Out
    </Menu.Item>
  </Sidebar>
)