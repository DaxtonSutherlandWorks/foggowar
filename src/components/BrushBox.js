import "../styles/BrushBox.css"
import LineIcon from "../img/lineIcon.svg"
import SquareIcon from "../img/squareIcon.svg"
import CircleIcon from "../img/circleIcon.svg"
import PolygonIcon from "../img/polygonIcon.svg"
import StampIcon from "../img/stampIcon.svg"
import PanIcon from "../img/panIcon.svg"
import { getAllStamps, getStamp } from "../stamps/StampDatabase"
import { useEffect } from "react"


const BrushBox = ({paintTool, paintToolSetter, paintMode, paintModeSetter, deleteMode, deleteModeSetter, loadStamp, currStamp, setCurrStamp}) => {
    
    //Sets up HTML elements for stamps.
    const stamps = getAllStamps();

    const handleStampSelectionClick = (event) => {
        let selection = event.target.closest('button').id.split("-");
        
        setCurrStamp(getStamp(selection[0]));
    }

    const stampGridItems = stamps.map(stamp => 
        <button id={stamp.id + "-selection-button"} class="stamp-grid-item" onClick={handleStampSelectionClick} style={{backgroundColor: currStamp.name === stamp.name ? "#9e9ee2" : "#e6e6fa"}}>
            <img src={stamp.image} alt="" />
            <span>{stamp.name}</span>
        </button>
    )

    /**
     * Changes the parent paintMode useState to match user brush selection
     */
    const handleBrushChange = (event) => {

        //Gets id prefix
        let id = event.target.closest('button').id.split("-")

        switch (id[0])
        {
            case "line":
                paintToolSetter("line");
                paintModeSetter("inactive");
                break;
            case "square":
                paintToolSetter("square");
                paintModeSetter("inactive");
                break;
            case "circle":
                paintToolSetter("circle");
                paintModeSetter("inactive");
                break;
            case "polygon":
                paintToolSetter("polygon");
                paintModeSetter("inactive");
                break;
            case "stamp":
                paintToolSetter("stamp");
                paintModeSetter("inactive");
                break;
            case "pan":
                paintModeSetter("panning");
                break;
            default:
                return;
        }
    }

    const handleStampOverlayActivation = (event) => {
        paintToolSetter("stamp");
        paintModeSetter("inactive");

        document.getElementById("stamp-overlay").classList.add("open");
    }

    const handleStampOverlayDeactivation = (event) => {
        paintToolSetter("line");
        paintModeSetter("inactive");

        document.getElementById("stamp-overlay").classList.remove("open");
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
        <div className="brush-box">
            {/* Base Menu */}
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
            
            <div className="brush-grid">
                <button id="line-button" className="icon-button" disabled={paintMode === "painting"} onClick={handleBrushChange} style={{backgroundColor: paintTool === "line" & paintMode !== "panning" ? "#9e9ee2" : "#e6e6fa"}}>
                    <img id="line-icon" src={LineIcon} alt="Line Icon"></img>
                    <span>Line</span>
                </button>
                <button id="square-button" className="icon-button" disabled={paintMode === "painting"} onClick={handleBrushChange} style={{backgroundColor: paintTool === "square" & paintMode !== "panning" ? "#9e9ee2" : "#e6e6fa"}}>
                    <img id="square-icon" src={SquareIcon} alt="Square Icon"></img>
                    <span>Rectangle</span>
                </button>
                <button id="circle-button" className="icon-button" disabled={paintMode === "painting"} onClick={handleBrushChange} style={{backgroundColor: paintTool === "circle" & paintMode !== "panning" ? "#9e9ee2" : "#e6e6fa"}}>
                    <img id="circle-icon" src={CircleIcon} alt="Circle Icon"></img>
                    <span>Circle</span>
                </button>
                <button id="polygon-button" className="icon-button" disabled={paintMode === "painting"} onClick={handleBrushChange} style={{backgroundColor: paintTool === "polygon" & paintMode !== "panning" ? "#9e9ee2" : "#e6e6fa"}}>
                    <img id="polygon-icon" src={PolygonIcon} alt="Polygon Icon"></img>
                    <span>Polygon</span>
                </button>
                <button id="stamp-button" className="icon-button" disabled={paintMode === "painting"} onClick={handleStampOverlayActivation} style={{backgroundColor: paintTool === "stamp" & paintMode !== "panning" ? "#9e9ee2" : "#e6e6fa"}}>
                    <img id="stamp-icon" src={StampIcon} alt="Stamp Icon"></img>
                    <span>Stamp</span>
                </button>
                <button id="pan-button" className="icon-button" disabled={paintMode === "painting"} onClick={handleBrushChange} style={{backgroundColor: paintMode === "panning" ? "#9e9ee2" : "#e6e6fa"}}>
                    <img id="pan-icon" src={PanIcon} alt="Pan Icon"></img>
                    <span>Pan</span>
                </button>
            </div>
            
            <div style={{display: "flex", justifyContent: "center"}}>
                <button className="mode-button" id="draw-button" disabled={paintMode === "painting"} onClick={handleDeleteChange} style={{backgroundColor: deleteMode ? "#e6e6fa" : "#9e9ee2"}}>Draw</button>
                <button className="mode-button" id="delete-button" disabled={paintMode === "painting"} onClick={handleDeleteChange} style={{backgroundColor: deleteMode ? "#9e9ee2" : "#e6e6fa"}}>Delete</button>
            </div>

            <div className="info-box">
                <p><span>Line:</span> Draw a line from point A to B.</p>
                <p><span>Rectangle:</span> Clear or fill a rectangle.</p>
                <p><span>Circle:</span> Clear or fill a cirlce.</p>
                <p><span>Polygon:</span> Clear or fill a polygon by placing points, ending where you started.</p>
                <p><span>Stamp:</span> Place a stamp in an open tile.</p>
                <p><span>Pan:</span> Drag the map to change your view.</p>
            </div>
        
            {/* Overlays TODO: Remove if no more overlays are needed*/}
            {/* Stamp Overlay */}
            <div id="stamp-overlay" class="stamp-overlay">
                <div class="stamp-overlay-header">
                    <h3>Stamp Library</h3>
                    <button class="close-button" onClick={handleStampOverlayDeactivation}>
                        X
                    </button>
                </div>
                <div style={{display: "flex", justifyContent: "center"}}>
                    <button className="mode-button" id="draw-button" disabled={paintMode === "painting"} onClick={handleDeleteChange} style={{backgroundColor: deleteMode ? "#e6e6fa" : "#9e9ee2"}}>Add Stamp</button>
                    <button className="mode-button" id="delete-button" disabled={paintMode === "painting"} onClick={handleDeleteChange} style={{backgroundColor: deleteMode ? "#9e9ee2" : "#e6e6fa"}}>Delete Stamp</button>
                </div>
                <div class="stamp-overlay-grid">
                    {stampGridItems}
                </div>
            </div>
        </div>
     );
}
 
export default BrushBox;