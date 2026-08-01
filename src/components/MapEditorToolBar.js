import { resizeCanvas, shiftGeometry, toolbarImport, toolbarPNGExport, toolbarRedo, toolbarSave, toolbarUndo } from "../helpers/ToolbarUtils";
import UndoIcon from "../img/undoIcon.svg";
import RedoIcon from "../img/redoIcon.svg";
import SaveIcon from "../img/saveIcon.svg";
import ImportIcon from "../img/importIcon.svg";
import pngExportIcon from "../img/pngExportIcon.svg";
import resizeIcon from "../img/resizeIcon.svg";
import arrowUpIcon from "../img/arrowUpIcon.svg";
import arrowDownIcon from "../img/arrowDownIcon.svg";
import arrowLeftIcon from "../img/arrowLeftIcon.svg";
import arrowRightIcon from "../img/arrowRightIcon.svg";
import gridIcon from "../img/gridIcon.svg";
import { useEffect, useRef, useState } from "react";
import { updateDimensions } from "../helpers/MapState";
import { applyViewportTransform } from "../helpers/ViewportUtils";
import { rebuildLineCanvas, rebuildSolidCanvas, rebuildStampCanvas } from "../helpers/BrushUtils";
import { drawInitialVisuals } from "../helpers/EditorDrawingUtils";

const MapEditorToolBar = ({editorContextRef}) => {
    
    const commandManagerRef = editorContextRef.current.commandManagerRef;
    const mapStateRef = editorContextRef.current.mapStateRef;

    const tileSize = editorContextRef.current.mapStateRef.tileSize;

    //Extracting canvas and context refs
    const lineCanvasRef = editorContextRef.current.lineCanvasRef;
    const gridCanvasRef = editorContextRef.current.gridCanvasRef;
    const borderCanvasRef = editorContextRef.current.borderCanvasRef;
    const overlayCanvasRef = editorContextRef.current.overlayCanvasRef;
    const solidCanvasRef = editorContextRef.current.solidCanvasRef;
    const dotCanvasRef = editorContextRef.current.dotCanvasRef;
    const stampCanvasRef = editorContextRef.current.stampCanvasRef;

    const solidContextRef = editorContextRef.current.solidContextRef;
    const lineContextRef = editorContextRef.current.lineContextRef;
    const stampContextRef = editorContextRef.current.stampContextRef;

    const viewportStateRef = editorContextRef.current.viewportStateRef;
    const canvasStageRef = editorContextRef.current.canvasStageRef;

    const mapUploadRef = useRef(null);

    //Resize UseStates
    const [resizeMode, setResizeMode] = useState("expand");
    const [alterationDimensions, setAlterationDimensions] = useState({up: 0, left: 0, right: 0, down: 0})

    useEffect(() => {
        //Setting up buttons
        mapUploadRef.current.click();
    }, []);

    /********************************************************************************
     * Helpers
     ********************************************************************************/

    /**
     * Flips resize mode
     */
    const handleResizeModeClick = () => {
        setResizeMode(resizeMode === "expand" ? "reduce" : "expand");
    }

    /**
     * Updates an object containing dimension alterations for resizing.
     */
    const setResizeDimensions = (event) => {
        
        const direction = event.target.id.split("-")[0];

        let newDimensions = {up: alterationDimensions["up"], left: alterationDimensions["left"], right: alterationDimensions["right"], down: alterationDimensions["down"]};
        newDimensions[direction] = resizeMode === "expand" ? newDimensions[direction] + 1 : newDimensions[direction] - 1;

        setAlterationDimensions(newDimensions);
    }

    /**
     * Zeroes out alteration dimensions, meant to be used after a resize
     */
    const resestAlterationDimensions = () => {
        setAlterationDimensions({up: 0, left: 0, right: 0, down: 0});
    }

    /**
     * Handles a click for adding/removing rows/column
     */
    const alterDimensions = () => {

        const tileSize = editorContextRef.current.mapStateRef.current.metadata.tileSize;
        
        //Calculate new dimensions
        const newDimensions = 
        {
            //Calculates new column/row data
            columns: mapStateRef.current.metadata.dimensions[0] + alterationDimensions["left"] + alterationDimensions["right"],
            rows: mapStateRef.current.metadata.dimensions[1] + alterationDimensions["up"] + alterationDimensions["down"],

        }

        //Protection for going into negative or zero dimensions
        if (newDimensions.columns <= 0 || newDimensions.rows <= 0)
        {
            resestAlterationDimensions();
            alert("Given alterations will result in negative dimensions, please enter different values");
            return;
        }

        //Update map metadata
        updateDimensions(mapStateRef.current, [newDimensions.columns, newDimensions.rows]);

        //Shift geometry if resizing from left/top to account for shifting world space
        if (alterationDimensions["left"] !== 0 || alterationDimensions["up"] !== 0)
        {
            const offsetX = alterationDimensions["left"] * tileSize;
            const offsetY = alterationDimensions["up"] * tileSize;

            shiftGeometry(mapStateRef, offsetX, offsetY);
        }

        //Resize canvases
        const width = newDimensions.columns * tileSize;
        const height = newDimensions.rows * tileSize;

        resizeCanvas(lineCanvasRef.current, width, height);
        resizeCanvas(stampCanvasRef.current, width, height);
        resizeCanvas(gridCanvasRef.current, width, height);
        resizeCanvas(borderCanvasRef.current, width, height);
        resizeCanvas(overlayCanvasRef.current, width, height);
        resizeCanvas(solidCanvasRef.current, width, height);
        resizeCanvas(dotCanvasRef.current, width, height);

        //Reset render state
        resizeRebuild()

        resestAlterationDimensions();
    }

    /**
     * This rebuilds the solid, line, and stamp canvases following a resize to account for clipping out of bounds and zoom/pan.
     * Also redraws the static guides.
     */
    const resizeRebuild = () => {

        solidContextRef.current.save();
        lineContextRef.current.save();
        stampContextRef.current.save();

        //Apply camera transform
        applyViewportTransform(viewportStateRef.current, canvasStageRef.current);

        //Apply clipping
        applyMapClip(solidContextRef.current);
        applyMapClip(lineContextRef.current);
        applyMapClip(stampContextRef.current);

        //TODO: Some kind of culling for out of bounds shapes would be a good efficiency enhancement.
        //Rerender editor
        drawInitialVisuals(editorContextRef);
        rebuildSolidCanvas(editorContextRef.current);
        rebuildLineCanvas(editorContextRef.current);
        rebuildStampCanvas(editorContextRef.current);

        solidContextRef.current.restore();
        lineContextRef.current.restore();
        stampContextRef.current.restore();

    }

    /**
     * Canvas clipping helper, extra insurance to make sure nothing is drawn out of bounds
     */
    const applyMapClip = (context) => {
        context.beginPath();

        context.rect(0, 0, mapStateRef.current.metadata.width, mapStateRef.current.metadata.height);

        context.clip();
    }
    
    return ( 
        <div>
            {/*Tool Bar*/}
            <div className="tool-bar" style={{maxWidth: "700px"}}>
                <button onClick={() => toolbarUndo(commandManagerRef)}><img src={UndoIcon} alt="Undo button"></img></button>
                <button onClick={() => toolbarRedo(commandManagerRef)}><img src={RedoIcon} alt="Redo button"></img></button>
                <button onClick={() => toolbarSave(mapStateRef, document)}><img src={SaveIcon} alt="Save button"></img></button>
                <button onClick={() => mapUploadRef.current.click()}><img src={ImportIcon} alt="Import button"></img></button>
                <input type="file"
                accept=".fog"
                ref={mapUploadRef}
                style={{display:"none"}}
                onChange={(e) => toolbarImport(e, editorContextRef, mapStateRef)} />
                <button onClick={() => toolbarPNGExport(document, editorContextRef)}><img src={pngExportIcon} alt="PNG button"></img></button>
                <button command="show-modal" commandfor="resize-dialog"><img src={resizeIcon} alt="Resize button"></img></button>
            </div>
            {/*Resize Dialog*/}
            <div className="resize-dialog-wrapper">
                <dialog id="resize-dialog" closedby="any" className="resize-dialog">
                    <div className="resize-dialog-content">
                        <div className="resize-header">
                            <h1>Resize Map</h1>
                        </div>
                        <div className="dimensions-box">
                            <p>Current Dimensions: {mapStateRef.current.metadata.dimensions[0]} x {mapStateRef.current.metadata.dimensions[1]}</p>
                            <p>New Dimensions: {mapStateRef.current.metadata.dimensions[0] + alterationDimensions["left"] + alterationDimensions["right"]} x {mapStateRef.current.metadata.dimensions[1] + alterationDimensions["up"] + alterationDimensions["down"]}</p>
                        </div>
                        <div className="resize-button-wrapper">
                            <label htmlFor="up-resize" style={{paddingBottom: "10px"}}>{resizeMode === "expand" ? "Add to" : "Remove from"} Top:</label>
                            <button id="up-resize" onClick={setResizeDimensions}>
                                    <img id="up-icon" src={arrowUpIcon} alt="Up Arrow Icon" />
                            </button>
                        </div>
                        <div className="resize-graphic-wrapper">
                            <div className="resize-button-wrapper">
                                <label htmlFor="left-resize" style={{paddingBottom: "10px"}}>{resizeMode === "expand" ? "Add to" : "Remove from"} Left:</label>
                                <button id="left-resize" onClick={setResizeDimensions}>
                                    <img id="left-icon" src={arrowLeftIcon} alt="Left Arrow Icon" />
                                </button>
                            </div>
                            <div className="grid-graphic-wrapper">
                                <br />
                                <p style={{marginBlock: "0px", marginInline: "auto"}}>{(alterationDimensions["left"] + alterationDimensions["right"] >= 0 ? "+" : "")}{alterationDimensions["left"] + alterationDimensions["right"]} columns</p>
                                <p style={{margin: "auto"}}>{(alterationDimensions["up"] + alterationDimensions["down"] >= 0 ? "+" : "")}{alterationDimensions["up"] + alterationDimensions["down"]} rows</p>
                                <img src={gridIcon} alt="Grid Icon" style={{height: "200px", margin: "auto"}} />
                                <br />
                                <div style={{display: "flex", justifyContent: "center"}}>
                                    <label htmlFor="resize-mode-selector" style={{paddingRight: "10px"}}>Resize Mode:</label>
                                    <button id="resize-mode-selector" onClick={handleResizeModeClick} style={{marginBottom: "20px"}}>{resizeMode === "expand" ? "Add" : "Remove"}</button>
                                </div>
                            </div>
                            <div className="resize-button-wrapper">
                                <label htmlFor="right-resize" style={{paddingBottom: "10px"}}>{resizeMode === "expand" ? "Add to" : "Remove from"} Right:</label>
                                <button id="right-resize" onClick={setResizeDimensions}>
                                    <img id="right-icon" src={arrowRightIcon} alt="Right Arrow Icon" />
                                </button>
                            </div>
                        </div>
                        <div className="resize-button-wrapper" style={{paddingBottom: "20px"}}>
                            <label htmlFor="down-resize" style={{paddingBottom: "10px"}}>{resizeMode === "expand" ? "Add to" : "Remove from"} Bottom:</label>
                            <button id="down-resize" onClick={setResizeDimensions}>
                                    <img id="down-icon" src={arrowDownIcon} alt="Down Arrow Icon" />
                            </button>
                        </div>
                        <div>
                            <button onClick={alterDimensions} commandfor="resize-dialog" command="close" style={{marginRight: "20px", fontSize: "1.5em"}}>Submit Alterations</button>
                            <button commandfor="resize-dialog" command="close" style={{fontSize: "1.5em"}}>Cancel</button>
                        </div>
                    </div>
                </dialog>
            </div>
        </div>
        
     );
}
 
export default MapEditorToolBar;