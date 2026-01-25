import "../styles/BrushBox.css"
import LineIcon from "../img/lineIcon.svg"
import SquareIcon from "../img/squareIcon.svg"
import CircleIcon from "../img/circleIcon.svg"
import PolygonIcon from "../img/polygonIcon.svg"
import StampIcon from "../img/stampIcon.svg"


const BrushBox = ({paintMode, paintModeSetter, deleteMode, deleteModeSetter, currStamp, setCurrStamp}) => {

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
        <div>
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
            
            <h1>Tools</h1>
            <button id="line-button" className="icon-button" onClick={handleBrushChange}><img id="line-icon" src={LineIcon} alt="Line Icon"></img></button>
            <button id="square-button" className="icon-button" onClick={handleBrushChange}><img id="square-icon" src={SquareIcon} alt="Square Icon"></img></button>
            <button id="circle-button" className="icon-button" onClick={handleBrushChange}><img id="circle-icon" src={CircleIcon} alt="Circle Icon"></img></button>
            <button id="polygon-button" className="icon-button" onClick={handleBrushChange}><img id="polygon-icon" src={PolygonIcon} alt="Polygon Icon"></img></button>
            <button id="stamp-button" className="icon-button" onClick={handleBrushChange}><img id="stamp-icon" src={StampIcon} alt="Stamp Icon"></img></button>
            <p>{paintMode}</p>
            {(paintMode !== "line" && paintMode != "stamp") && <div>
                <button id="draw-button"  onClick={handleDeleteChange}>Draw</button>
                <button id="delete-button" onClick={handleDeleteChange}>Delete</button>
            </div>}
        </div>
     );
}
 
export default BrushBox;