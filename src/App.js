import { useState } from 'react';
import './App.css';
import BrushBox from './components/BrushBox';
import ChatBox from './components/ChatBox';
import MapEditor from './components/MapEditor';
import Toolbar from './components/Toolbar';

function App() {

  const [paintMode, paintModeSetter] = useState("line");

  return (
    <div>
      <Toolbar></Toolbar>
      <div className='workspace'>
        <BrushBox paintMode={paintMode} paintModeSetter={paintModeSetter}></BrushBox>
        <MapEditor dimensions={[10,10]} paintMode={paintMode}></MapEditor>
        <ChatBox></ChatBox>
      </div>
    </div>
  );
}

export default App;
