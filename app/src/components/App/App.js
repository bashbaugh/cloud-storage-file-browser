import React from 'react';
import logo from '../../assets/logo.svg';
import './App.css';
import Sidebar from '../Sidebar/Sidebar'
import FileExplorer from '../FileExplorer/FileExplorer'

function App() {
  return (
    <div className="App">
      <nav>
        <Sidebar/>
      </nav>
      <section className='app-content'>
        <FileExplorer/>
      </section>
    </div>
  );
}

export default App;
