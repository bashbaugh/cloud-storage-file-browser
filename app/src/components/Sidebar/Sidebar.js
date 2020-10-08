import React from 'react'
import { Header, Icon, Menu, Sidebar, Segment, Image } from 'semantic-ui-react'
import config from '../../config'

export default ({ profile, openFileUpload, openFolderCreator }) => {

  const signOut = () => {
    window.gapi.auth2.getAuthInstance().signOut()
    localStorage.clear()
    window.location.reload()
  }

  return (
    <Sidebar
      as={Menu}
      icon='labeled'
      inverted
      vertical
      visible
      width='thin'
    >
      <Header as='h4' color='grey' style={{ margin: '10px auto' }}>CDN File Manager</Header>
      <Image src={profile.imageUrl} avatar/>
      <Menu.Item as='a'>
        <Icon name='folder' />
        Files
      </Menu.Item>
      <Menu.Item as='a' onClick={openFileUpload}>
        <Icon name='cloud upload' />
        Upload File(s)
      </Menu.Item>
      <Menu.Item as='a' onClick={openFolderCreator}>
        <Icon name='plus circle' />
        New Folder
      </Menu.Item>
      <Menu.Item as='a' onClick={signOut}>
        <Icon name='sign-out' />
        Sign Out
      </Menu.Item>
    </Sidebar>
  )
}