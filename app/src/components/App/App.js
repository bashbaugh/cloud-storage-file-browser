import React, { useState } from 'react';
import logo from '../../assets/logo.svg';
import './App.css';
import Sidebar from '../Sidebar/Sidebar'
import FileExplorer from '../FileExplorer/FileExplorer'
import Auth from '../GoogleAuth/GoogleAuth'
import FileUploadModal from '../FileUploadModal/FileUploadModal'
import api from '../../api/storage'

function App() {
  const [idToken, setIdToken] = useState('')
  const [profile, setProfile] = useState({})

  const [fileUploadOpen, setFileUploadOpen] = useState(false)

  return (
    <div className="App">
      <nav>
        <Sidebar profile={profile} openFileUpload={() => setFileUploadOpen(true)}/>
      </nav>
      <Auth setIdToken={(t) => {
        api.idToken = t
        setIdToken(t)
      }} setProfile={setProfile}/>
      <section className='app-content'>
        <FileExplorer idToken={idToken} profile={profile}/>
      </section>
      <FileUploadModal idToken={idToken} open={fileUploadOpen} closeModal={() => setFileUploadOpen(false)}/>
    </div>
  );
}

export default App;
