import React from 'react'
import { GoogleLogin } from 'react-google-login'
import config from '../../config'

function onResponse(res) {

}

export default () => {
  return (
    <GoogleLogin
      clientId={config.googleClientId}
      buttonText="Sign In"
      onSuccess={onResponse}
      onFailure={onResponse}
      cookiePolicy={'single_host_origin'}
      isSignedIn={true}
    />
  )
}