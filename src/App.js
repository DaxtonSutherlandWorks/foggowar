import { useState } from 'react';
import './App.css';
import BrushBox from './components/BrushBox';
import ChatBox from './components/ChatBox';
import MapEditor from './components/MapEditor';
import Toolbar from './components/Toolbar';

function App() {

  const [paintMode, paintModeSetter] = useState("line");
  const [currStamp, setCurrStamp] = useState("/stamps/stampPH.svg");

  return (
    <div>
      <Toolbar></Toolbar>
      <div className='workspace'>
        <BrushBox paintMode={paintMode} paintModeSetter={paintModeSetter} currStamp={currStamp} currStampSetter={setCurrStamp}></BrushBox>
        <MapEditor dimensions={[10,10]} paintMode={paintMode} currStamp={currStamp} stampSize={[70,70]}></MapEditor>
        <ChatBox></ChatBox>
      </div>
    </div>
  );
}

export default App;
