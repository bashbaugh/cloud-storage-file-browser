import React, { useState, useEffect } from 'react'
import { Header, Icon, Modal, Button, Message } from 'semantic-ui-react'
import config from '../../config'


const GoogleAuth = ({ setIdToken, setProfile }) => {
  const [ open, setOpen ] = useState(true) // Is the sign in modal open
  const [ signingIn, setSigningIn ] = useState(true) // Is the user in the process of signing in
  const [ error, setError ] = useState(false) // Has there been a sign in error

  const SCOPES = 'profile email'
  // let gauth // Google Auth Object

  const onSuccess = (isSignedIn) => {
    let user = window.gauth.currentUser.get()
    let profile = user.getBasicProfile()
    let tokenObj = user.getAuthResponse(true) // Get ID token
    if (isSignedIn && user.hasGrantedScopes(SCOPES) && tokenObj) {
      setIdToken(tokenObj.id_token)
      setProfile({
        name: profile.getName(),
        imageUrl: profile.getImageUrl(),
        email: profile.getEmail()
      })
      setOpen(false)
    }
  }

  useEffect(() => {
    window.gapi.load('auth2', () => {
      window.gapi.auth2.init({
        'client_id': config.googleClientId,
        'scope': SCOPES,
        'ux_mode': 'redirect'
      }).then((auth2) => {
        window.gauth = auth2
        window.gauth.isSignedIn.listen(onSuccess)
        onSuccess(true)

        setSigningIn(false)
      })
    })
  }, [])

  const signIn = () => {
    window.gauth.signIn()
      .then(() => {
        onSuccess(true)
      })
      .catch((err) => {
        console.error(err)
        setError(true)
      })
  }

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
        <Button style={{display: 'block', margin: '0 auto'}} primary disabled={signingIn} onClick={() => {
          setSigningIn(true)
          signIn()
        }}>Sign In with Google</Button>
      </Modal.Content>
    </Modal>
  )
}

export default GoogleAuth