import React, { useState } from 'react';
import logo from '../../assets/logo.svg';
import './App.css';
import Sidebar from '../Sidebar/Sidebar'
import FileExplorer from '../FileExplorer/FileExplorer'
import Auth from '../GoogleAuth/GoogleAuth'

function App() {
  const [idToken, setIdToken] = useState('')
  const [profile, setProfile] = useState({})

  return (
    <div className="App">
      <nav>
        <Sidebar profile={profile}/>
      </nav>
      <Auth setIdToken={setIdToken} setProfile={setProfile}/>
      <section className='app-content'>
        <FileExplorer idToken={idToken} profile={profile}/>
      </section>
    </div>
  );
}

export default App;
