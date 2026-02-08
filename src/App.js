import { useState } from 'react';
import './App.css';
import BrushBox from './components/BrushBox';
import ChatBox from './components/ChatBox';
import MapEditor from './components/MapEditor';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {

  const [paintMode, paintModeSetter] = useState("line");
  const [currStamp, setCurrStamp] = useState("/stamps/stampPH.svg");
  const [deleteMode, setDeleteMode] = useState(false);
  const [painting, setPainting] = useState(false);

  return (
    <div className='page-content'>
      <Header></Header>
      <div className='workspace'>
        <BrushBox paintMode={paintMode} paintModeSetter={paintModeSetter} painting={painting} deleteMode={deleteMode} deleteModeSetter={setDeleteMode}></BrushBox>
        <MapEditor dimensions={[10,10]} paintMode={paintMode} painting={painting} setPainting={setPainting} deleteMode={deleteMode} currStamp={currStamp} stampSize={[70,70]} tileSize={70} ></MapEditor>
      </div>
      <Footer></Footer>
    </div>
  );
}

export default App;
