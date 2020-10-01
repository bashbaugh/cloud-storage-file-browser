import { useState, useEffect } from 'react'
import { GoogleLogin, useGoogleLogout } from 'react-google-login'
import { Header, Icon, Modal, Button, Message } from 'semantic-ui-react'
import config from '../../config'


const GoogleAuth = ({ setAccessToken, setProfile }) => {
  const [ open, setOpen ] = useState(true)
  const [ signingIn, setSigningIn ] = useState(true)
  const [ error, setError ] = useState(false)

  let auth2

  useEffect(() => {
    window.gapi.load('auth2', () => {
      auth2 = gapi.auth2.init({
        client_id: config.googleClientId,
      })
    })
  })

  return (
    <Modal
      basic
      centered
      open={open}
      size='small'
    >
      <Header icon>
        <Icon name={error ? 'warning circle' : (signingIn ? 'spinner' : 'sign in')} loading={signingIn && !error}/>
        { error ? 'Something went wrong' : 'Sign In'}
      </Header>
      <Modal.Content>
        <Button style={{display: 'block', margin: '0 auto'}} primary disabled={props.disabled} onClick={() => {
          setSigningIn(true)
          //
        }}>Sign In with Google</Button>
      </Modal.Content>
    </Modal>
  )
}

export default GoogleAuth