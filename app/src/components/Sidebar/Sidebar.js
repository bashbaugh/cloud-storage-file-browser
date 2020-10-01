import React from 'react'
import { Header, Icon, Menu, Sidebar, Segment, Image } from 'semantic-ui-react'
import {useGoogleLogout, UseGoogleLogout} from 'react-google-login'
import config from '../../config'

export default ({ profile }) => {
  const onFailure = (res) => {
    alert("Unable to log out. Please clear your cache and cookies to ensure that you're signed out.")
  }

  const onLogoutSuccess = (res) => {
    window.location.reload()
  }

  const { signOut, loaded } = useGoogleLogout({
    clientId: config.googleClientId,
    onFailure,
    onLogoutSuccess
  })

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
      <Menu.Item as='a'>
        <Icon name='cloud upload' />
        Upload File(s)
      </Menu.Item>
      <Menu.Item as='a'>
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