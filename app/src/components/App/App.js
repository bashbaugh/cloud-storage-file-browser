import React, { useState } from 'react';
import logo from '../../assets/logo.svg';
import './App.css';
import Sidebar from '../Sidebar/Sidebar'
import FileExplorer from '../FileExplorer/FileExplorer'
import Auth from '../GoogleAuth/GoogleAuth'
import FileUploadModal from '../FileUploadModal/FileUploadModal'
import FolderCreationModal from '../FolderCreationModal/FolderCreationModal'
import api from '../../api/storage'

function App() {
  const [idToken, setIdToken] = useState('')
  const [profile, setProfile] = useState({})

  const [explorerPath, setExplorerPath] = useState('') // Current file explorer path
  const [doRefresh, refreshExplorer] = useState(true)

  const [fileUploadOpen, setFileUploadOpen] = useState(false)
  const [folderCreatorOpen, setFolderCreatorOpen] = useState(false)

  return (
    <div className="App">
      <nav>
        <Sidebar
          profile={profile}
          openFileUpload={() => setFileUploadOpen(true)}
          openFolderCreator={() => setFolderCreatorOpen(true)}
        />
      </nav>
      <Auth setIdToken={(t) => {
        api.idToken = t
        setIdToken(t)
      }} setProfile={setProfile}/>
      <section className='app-content'>
        <FileExplorer
          idToken={idToken}
          profile={profile}
          setExplorerPath={setExplorerPath}
          doRefresh={doRefresh}
          didRefresh={() => refreshExplorer(false)}
        />
      </section>
      <FileUploadModal idToken={idToken} open={fileUploadOpen} closeModal={() => setFileUploadOpen(false)}/>
      <FolderCreationModal
        open={folderCreatorOpen}
        closeModal={() => setFolderCreatorOpen(false)}
        path={explorerPath}
        onSuccess={() => {setFolderCreatorOpen(false); refreshExplorer(true)}}
        />
    </div>
  );
}

export default App;
