import "../styles/BrushBox.css"
import LineIcon from "../img/lineIcon.svg"
import SquareIcon from "../img/squareIcon.svg"
import CircleIcon from "../img/circleIcon.svg"
import PolygonIcon from "../img/polygonIcon.svg"


const BrushBox = ({paintMode, paintModeSetter}) => {

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
            default:
                return;
        }
    }


    return ( 
        <div>
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
            
            <h1>Tools</h1>
            <button id="line-button" className="icon-button" onClick={handleBrushChange}><img id="line-icon" src={LineIcon} alt=""></img></button>
            <button id="square-button" className="icon-button" onClick={handleBrushChange}><img id="square-icon" src={SquareIcon}></img></button>
            <button id="circle-button" className="icon-button" onClick={handleBrushChange}><img id="circle-icon" src={CircleIcon}></img></button>
            <button id="polygon-button" className="icon-button" onClick={handleBrushChange}><img id="polygon-icon" src={PolygonIcon}></img></button>
            <p>{paintMode}</p>
        </div>
     );
}
 
export default BrushBox;