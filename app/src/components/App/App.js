import React, { useState } from 'react';
import logo from '../../assets/logo.svg';
import './App.css';
import Sidebar from '../Sidebar/Sidebar'
import FileExplorer from '../FileExplorer/FileExplorer'
import Auth from '../GoogleAuth/GoogleAuth'

function App() {
  const [accessToken, setAccessToken] = useState('')
  const [profile, setProfile] = useState({})

  return (
    <div className="App">
      <nav>
        <Sidebar profile={profile}/>
      </nav>
      <Auth setAccessToken={setAccessToken} setProfile={setProfile}/>
      <section className='app-content'>
        <FileExplorer/>
      </section>
    </div>
  );
}

export default App;
