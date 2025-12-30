import './App.css';
import BrushBox from './components/BrushBox';
import ChatBox from './components/ChatBox';
import MapEditor from './components/MapEditor';
import Toolbar from './components/Toolbar';

function App() {
  return (
    <div>
      <Toolbar></Toolbar>
      <div className='workspace'>
        <BrushBox></BrushBox>
        <MapEditor dimensions={[10,10]}></MapEditor>
        <ChatBox></ChatBox>
      </div>
    </div>
  );
}

export default App;
