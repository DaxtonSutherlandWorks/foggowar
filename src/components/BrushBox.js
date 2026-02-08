import "../styles/BrushBox.css"
import LineIcon from "../img/lineIcon.svg"
import SquareIcon from "../img/squareIcon.svg"
import CircleIcon from "../img/circleIcon.svg"
import PolygonIcon from "../img/polygonIcon.svg"
import StampIcon from "../img/stampIcon.svg"


const BrushBox = ({paintMode, paintModeSetter, painting, deleteMode, deleteModeSetter}) => {

    /**
     * Changes the parent paintMode useState to match user brush selection
     */
    const handleBrushChange = (event) => {

        //Gets id prefix
        let id = event.target.id.split("-")
        
        switch (id[0])
        {
            case "line":
                paintModeSetter("line");
                break;
            case "square":
                paintModeSetter("square");
                break;
            case "circle":
                paintModeSetter("circle");
                break;
            case "polygon":
                paintModeSetter("polygon");
                break;
            case "stamp":
                paintModeSetter("stamp");
                break;
            default:
                return;
        }
    }

    const handleDeleteChange = (event) => {
        //Gets id prefix
        let id = event.target.id.split("-")

        if (id[0] === "draw")
        {
            deleteModeSetter(false);
        }
        else
        {
            deleteModeSetter(true);
        }
    }

    return ( 
        <div style={{border: "2px black solid", textAlign: "cetner"}}>
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
            
            <div className="brush-grid">
                <button id="line-button" className="icon-button" disabled={painting} onClick={handleBrushChange} style={{backgroundColor: paintMode === "line" ? "#9e9ee2" : "#e6e6fa"}}>
                    <img id="line-icon" src={LineIcon} alt="Line Icon"></img>
                </button>
                <button id="square-button" className="icon-button" disabled={painting} onClick={handleBrushChange} style={{backgroundColor: paintMode === "square" ? "#9e9ee2" : "#e6e6fa"}}>
                    <img id="square-icon" src={SquareIcon} alt="Square Icon"></img>
                </button>
                <button id="circle-button" className="icon-button" disabled={painting} onClick={handleBrushChange} style={{backgroundColor: paintMode === "circle" ? "#9e9ee2" : "#e6e6fa"}}>
                    <img id="circle-icon" src={CircleIcon} alt="Circle Icon"></img>
                </button>
                <button id="polygon-button" className="icon-button" disabled={painting} onClick={handleBrushChange} style={{backgroundColor: paintMode === "polygon" ? "#9e9ee2" : "#e6e6fa"}}>
                    <img id="polygon-icon" src={PolygonIcon} alt="Polygon Icon"></img>
                </button>
                <div className="bottom-button-container">
                    <button id="stamp-button" className="icon-button" disabled={painting} onClick={handleBrushChange} style={{backgroundColor: paintMode === "stamp" ? "#9e9ee2" : "#e6e6fa"}}>
                        <img id="stamp-icon" src={StampIcon} alt="Stamp Icon"></img>
                    </button>
                </div>
            </div>
            
            <div style={{display: "flex", justifyContent: "center"}}>
                <button className="mode-button" id="draw-button" disabled={painting} onClick={handleDeleteChange} style={{backgroundColor: deleteMode ? "#e6e6fa" : "#9e9ee2"}}>Draw</button>
                <button className="mode-button" id="delete-button" disabled={painting} onClick={handleDeleteChange} style={{backgroundColor: deleteMode ? "#9e9ee2" : "#e6e6fa"}}>Delete</button>
            </div>

            <div className="info-box">
                <p><span>Line:</span> Draw a line from point A to B.</p>
                <p><span>Rectangle:</span> Clear or fill a rectangle.</p>
                <p><span>Circle:</span> Clear or fill a cirlce.</p>
                <p><span>Polygon:</span> Clear or fill a polygon by placing points, ending where you started.</p>
                <p><span>Stamp:</span> Place a decorative tree in an open tile.</p>
            </div>
        
        </div>
     );
}
 
export default BrushBox;