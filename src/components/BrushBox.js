import "../styles/BrushBox.css"
import LineIcon from "../img/lineIcon.svg"
import SquareIcon from "../img/squareIcon.svg"
import CircleIcon from "../img/circleIcon.svg"
import PolygonIcon from "../img/polygonIcon.svg"
import StampIcon from "../img/stampIcon.svg"
import PanIcon from "../img/panIcon.svg"

//TODO: Eventually replace these with direct path reads from an object of available stamps.
import CastleStamp from "../stamps/castleStamp.svg"
import FenceStamp from "../stamps/fenceStamp.svg"
import GateStamp from "../stamps/gateStamp.svg"
import GrassStamp from "../stamps/grassStamp.svg"
import RubbleStamp from "../stamps/rubbleStamp.svg"
import TentStamp from "../stamps/tentStamp.svg"
import TreeStamp from "../stamps/treeStamp.svg"
import WaterStamp from "../stamps/waterStamp.svg"


const BrushBox = ({paintTool, paintToolSetter, paintMode, paintModeSetter, deleteMode, deleteModeSetter}) => {

    /**
     * Changes the parent paintMode useState to match user brush selection
     */
    const handleBrushChange = (event) => {

        //Gets id prefix
        let id = event.target.id.split("-")

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
                <button id="stamp-button" className="icon-button" disabled={paintMode === "painting"} onClick={handleBrushChange} style={{backgroundColor: paintTool === "stamp" & paintMode !== "panning" ? "#9e9ee2" : "#e6e6fa"}}>
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
                <p><span>Stamp:</span> Place a decorative tree in an open tile.</p>
                <p><span>Pan:</span> Drag the map to change your view.</p>
            </div>
        
            {/* Overlays TODO: Remove if now more overlays are needed*/}
            {/* Stamp Overlay */}
            <div class="stamp-overlay">
                <div class="stamp-overlay-header">
                    <h3>Stamp Library</h3>
                    <button class="close-button">
                        X
                    </button>
                </div>
                <div class="stamp-overlay-grid">
                    {/* TODO: Ehance this to read from and object and automatically make grid items */}
                    <button class="stamp-grid-item">
                        <img src={CastleStamp} alt="" />
                        <span>Castle</span>
                    </button>
                    <button class="stamp-grid-item">
                        <img src={FenceStamp} alt="" />
                        <span>Fence</span>
                    </button>
                    <button class="stamp-grid-item">
                        <img src={GateStamp} alt="" />
                        <span>Gate</span>
                    </button>
                    <button class="stamp-grid-item">
                        <img src={GrassStamp} alt="" />
                        <span>Grass</span>
                    </button>
                    <button class="stamp-grid-item">
                        <img src={RubbleStamp} alt="" />
                        <span>Rubble</span>
                    </button>
                    <button class="stamp-grid-item">
                        <img src={TentStamp} alt="" />
                        <span>Tent</span>
                    </button>
                    <button class="stamp-grid-item">
                        <img src={TreeStamp} alt="" />
                        <span>Tree</span>
                    </button>
                    <button class="stamp-grid-item">
                        <img src={WaterStamp} alt="" />
                        <span>Water</span>
                    </button>
                </div>
            </div>
        </div>
     );
}
 
export default BrushBox;