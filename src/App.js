import { useState } from 'react';
import './App.css';
import BrushBox from './components/BrushBox';
import ChatBox from './components/ChatBox';
import MapEditor from './components/MapEditor';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {

  const [paintTool, paintToolSetter] = useState("line");
  const [currStamp, setCurrStamp] = useState("/stamps/stampPH.svg");
  const [paintMode, paintModeSetter] = useState("inactive");
  const [deleteMode, setDeleteMode] = useState(false);
  const [dimensions, setDimensions] = useState([1,1]);

  return (
    <div className='page-content'>
      <Header></Header>
      <div className='workspace'>
        <BrushBox paintTool={paintTool} paintToolSetter={paintToolSetter} paintMode={paintMode} paintModeSetter={paintModeSetter} deleteMode={deleteMode} deleteModeSetter={setDeleteMode}></BrushBox>
        <MapEditor dimensions={dimensions} dimensionsSetter={setDimensions} paintTool={paintTool} paintMode={paintMode} setPaintMode={paintModeSetter} deleteMode={deleteMode} currStamp={currStamp} stampSize={[70,70]} tileSize={70} ></MapEditor>
      </div>
      <Footer></Footer>
    </div>
  );
}

export default App;
