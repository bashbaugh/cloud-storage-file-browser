import React, { useState } from 'react'
import {useGoogleLogin, UseGoogleLogin} from 'react-google-login'
import { Header, Icon, Modal, Button, Message } from 'semantic-ui-react'
import config from '../../config'

const DEV_MODE = process.env.GOOGLE_AUTH_TOKEN

export default ({ setAccessToken, setProfile }) => {
  const [ open, setOpen ] = useState(true)
  const [ signingIn, setSigningIn ] = useState(true)
  const [ error, setError ] = useState(false)

  // If a dev auth token is present, don't actually sign in with google OAuth.
  const DEV_MODE = process.env.GOOGLE_AUTH_TOKEN

  const onSuccess = (res) => {
    setAccessToken(res.accessToken)
    setProfile(res.profileObj)
    setOpen(false)
  }

  const onFailure = (res) => {
    setError(true)
    console.log(res)
  }

  const { signIn, loaded } = useGoogleLogin({
    onSuccess,
    onFailure,
    clientId: config.googleClientId,
    scope: 'profile email',
    // uxMode: 'redirect',
    isSignedIn: true,
    onAutoLoadFinished: () => {
      setSigningIn(false)
    }
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
        <Button style={{display: 'block', margin: '0 auto'}} primary onClick={() => {
          setSigningIn(true)
          signIn()
        }}>Sign In with Google</Button>
      </Modal.Content>
    </Modal>
  )
}