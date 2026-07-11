//TODO: Bug when activeley drawing and middle dragging.

import { useEffect, useRef, useState } from "react";
import "../styles/MapEditor.css"
import {CommandManager} from "../classes/CommandManager"
import { nearestGuidePoint, rebuildLineCanvas, rebuildSolidCanvas, rebuildStampCanvas } from "../helpers/BrushUtils";
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
import { createInitialMapState, updateDimensions } from "../helpers/MapState";
import { applyViewportTransform, createInitialViewportState, getPointerData } from "../helpers/ViewportUtils";
import { linePointerDown, linePointerMove } from "../helpers/LineUtils";
import { rectanglePointerDown, rectanglePointerMove } from "../helpers/RectUtils";
import { circlePointerDown, circlePointerMove } from "../helpers/CircleUtils";
import { polygonPointerDown, polygonPointerMove } from "../helpers/PolygonUtils";
import { stampPointerDown, stampPointerMove } from "../helpers/StampUtils";
import { panPointerDown, panPointerLeave, panPointerMove, panPointerUp, zoomPointerWheel } from "../helpers/PanZoomUtils";
import { shiftGeometry, toolbarImport, toolbarPNGExport, toolbarRedo, toolbarSave, toolbarUndo } from "../helpers/ToolbarUtils";

//Set up as class in order to access React.createRef
const MapEditor = ({dimensions, dimensionsSetter, paintTool, paintMode, setPaintMode, deleteMode, currStamp, stampSize, tileSize}) => {

    //Canvas Refs
    const lineCanvasRef = useRef(null);
    const stampCanvasRef = useRef(null);
    const gridCanvasRef = useRef(null);
    const borderCanvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const solidCanvasRef = useRef(null);
    const dotCanvasRef = useRef(null);

    //Context Refs
    const lineContextRef = useRef(null);
    const stampContextRef = useRef(null);
    const gridContextRef = useRef(null);
    const borderContextRef = useRef(null);
    const overlayContextRef = useRef(null);
    const solidContextRef = useRef(null);
    const dotContextRef = useRef(null);

    //Canvas operation Refs
    const startCoordsRef = useRef([]);
    const paintPointsRef = useRef([]);
    const stampImageRef = useRef(null);
    const brushColorRef = useRef("black");
    const brushSizeRef = useRef(3);
    const guideRadiusRef = useRef(2);
    const guideHoverRadiusRef = useRef(6);
    const snapDistanceRef = useRef(12);

    //Viewport Refs
    const panningStartScreenXRef = useRef(0);
    const panningStartScreenYRef = useRef(0);
    const panningStartCameraXRef = useRef(0);
    const panningStartCameraYRef = useRef(0);
    const viewportRef = useRef(null);
    const canvasStageRef = useRef(null);
    const viewportStateRef = useRef(createInitialViewportState());

    //Object refs
    const editorContextRef = useRef(null);
    const commandManagerRef = useRef(null);
    const mapStateRef = useRef(createInitialMapState(dimensions, tileSize));
    const interactionStateRef = useRef({mode: "painting", tool: paintMode, deletion: deleteMode, grabbing: false, middlePan: false});

    //Toolbar Refs
    const mapUploadRef = useRef(null);
    const alterationDimensions = useRef({up: 0, left: 0, right: 0, down: 0});
    
    const [resizeMode, setResizeMode] = useState("expand");

    /**
     * Initializes our editor context and creates a new command editor to support brush execution and undoing
     */
    useEffect(() => {
        editorContextRef.current = {
            solidCanvasRef,
            gridCanvasRef,
            borderCanvasRef,
            lineCanvasRef,
            stampCanvasRef,
            overlayCanvasRef,

            solidContextRef,
            gridContextRef,
            borderContextRef,
            lineContextRef,
            stampContextRef,
            overlayContextRef,

            mapStateRef,
            interactionStateRef,
            viewportStateRef,
            startCoordsRef,
            paintPointsRef,
            panningStartScreenXRef,
            panningStartScreenYRef,
            panningStartCameraXRef,
            panningStartCameraYRef,

            viewportRef,
            canvasStageRef,

            commandManagerRef
        }

        commandManagerRef.current = new CommandManager(editorContextRef.current);
    }, []);

    /**
     * Initializes canvases and several drawing tools.
     */
    useEffect(() => {

        if (!lineCanvasRef.current || !gridCanvasRef.current)
        {
            return
        }

        //Setting up contexts
        lineContextRef.current = lineCanvasRef.current.getContext("2d");
        stampContextRef.current = stampCanvasRef.current.getContext("2d");
        gridContextRef.current = gridCanvasRef.current.getContext("2d");
        borderContextRef.current = borderCanvasRef.current.getContext("2d");
        overlayContextRef.current = overlayCanvasRef.current.getContext("2d");
        solidContextRef.current = solidCanvasRef.current.getContext("2d");
        dotContextRef.current = dotCanvasRef.current.getContext("2d");

        //Initializing viewport
        viewportRef.current = document.getElementById("viewport");

        //Setting up buttons
        mapUploadRef.current.click();

        //Sizing canvases
        const width = dimensions[1] * tileSize;
        const height = dimensions[0] * tileSize;

        resizeCanvas(lineCanvasRef.current, width, height);
        resizeCanvas(stampCanvasRef.current, width, height);
        resizeCanvas(gridCanvasRef.current, width, height);
        resizeCanvas(borderCanvasRef.current, width, height);
        resizeCanvas(overlayCanvasRef.current, width, height);
        resizeCanvas(solidCanvasRef.current, width, height);
        resizeCanvas(dotCanvasRef.current, width, height);


       //Listeners are made as class methods so they can be removed before being applied
       //This prevents the confusing and breaking behavior of listeners getting duplicated on a rerender.
       overlayCanvasRef.current.removeEventListener('pointerdown', onPointerDown);
       overlayCanvasRef.current.addEventListener('pointerdown', onPointerDown);

       overlayCanvasRef.current.removeEventListener('pointermove', onPointerMove);
       overlayCanvasRef.current.addEventListener('pointermove', onPointerMove);

       overlayCanvasRef.current.removeEventListener('pointerup', onPointerUp);
       overlayCanvasRef.current.addEventListener('pointerup', onPointerUp);

       overlayCanvasRef.current.removeEventListener('pointercancel', onPointerLeave);
       overlayCanvasRef.current.addEventListener('pointercancel', onPointerLeave);

       viewportRef.current.removeEventListener('contextmenu', blockContextMenu);
       viewportRef.current.addEventListener('contextmenu', blockContextMenu);

       viewportRef.current.removeEventListener('wheel', onPointerWheel);
       viewportRef.current.addEventListener('wheel', onPointerWheel, {passive: false});

       //Draws all the visual guides
       drawInitialVisuals();

        //Loads in the initial stamp image
        loadStamp(currStamp)

    }, []);

    /**
     * Loads a new stamp whenever it is changed
     */
    useEffect(() => {

        loadStamp(currStamp);

    }, [currStamp]);

    /**
     * Updates the paintTool when changed in parent
     */
    useEffect(() => {
        
        interactionStateRef.current.tool = paintTool;

    }, [paintTool]);

    /**
     * Updates the paintMode when changed in parent
     */
    useEffect(() => {
        
        interactionStateRef.current.mode = paintMode;

        if (paintMode === "panning")
        {
            viewportRef.current.style.cursor = "grab";
        }
        else
        {
            viewportRef.current.style.cursor = "default";
        }
    }, [paintMode])

    /**
     * Updates delete mode when changed in parent
     */
    useEffect(() => {

        interactionStateRef.current.deletion = deleteMode;

    }, [deleteMode]);

    /**
     * Loads the current stamp into an image that can be drawn on a canvas
     * Used for previews
     */
    const loadStamp = (path) =>
    {
        if (!path) {
            stampImageRef.current = null;
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            stampImageRef.current = img;
        };

        img.onerror = () => {
            stampImageRef.current = null;
        };

        img.src = path;
    };

    /********************************************************************************
     * Overlay Canvas Listeners
     ********************************************************************************/

    /**
    * Overlay mouse click listener
    */
    const onPointerDown = (event) => {

        event.preventDefault();

        //Blocks right clicks and allows for panning with middle mouse
        if (event.button === 2)
        {
            return;
        }
        else if (event.button === 1 && interactionStateRef.current.mode !== "panning")
        {
            interactionStateRef.current.middlePan = true;
            interactionStateRef.current.mode = "panning";
        }

        const pointer = getPointerData(event, viewportRef.current, viewportStateRef.current);

        //Break out to handle panning
        if (interactionStateRef.current.mode === "panning")
        {
            overlayCanvasRef.current.setPointerCapture(event.pointerId);
            
            panPointerDown(editorContextRef, pointer);
            
            //Prevents text selection and dragging quirks
            event.preventDefault();
            
            return;
        }
            
        //Checks whether the cursor is in range of a guide point
        let guidePoint = nearestGuidePoint(pointer.world.x, pointer.world.y, tileSize, snapDistanceRef.current)

        //Click functions by mode
        switch (interactionStateRef.current.tool)
        {
            case "line":
                linePointerDown(editorContextRef, guidePoint);
                break;

            case "square":
                rectanglePointerDown(editorContextRef, guidePoint);
                break;

            case "circle":
                circlePointerDown(editorContextRef, guidePoint);
                break;

            case "polygon":
                polygonPointerDown(editorContextRef, guidePoint);
                break;

            case "stamp":
                stampPointerDown(editorContextRef, guidePoint, currStamp, stampSize);
                break;
            
            default:
                return;
        }
    }

    /**
    * Overlay mouse movement listener
    */
    const onPointerMove = (event) => {

        //Renders a guide dot to show user where their brush will snap to, drawing or not.
        const pointer = getPointerData(event, viewportRef.current, viewportStateRef.current);

        const guidePoint = nearestGuidePoint(pointer.world.x, pointer.world.y, tileSize, snapDistanceRef.current);

        //Draws active guide dot if not panning, clears old ones otherwise.
        if (interactionStateRef.current.mode !== "panning")
        {
            drawHoverGuide(overlayContextRef, guidePoint, interactionStateRef.current.deletion);
        }
        else
        {
            overlayContextRef.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

            if (interactionStateRef.current.grabbing)
            {
                panPointerMove(editorContextRef, pointer);
            }
        }

        overlayContextRef.current.save();

        switch (interactionStateRef.current.tool)
        {
            case "line":
                linePointerMove(editorContextRef, pointer, brushSizeRef, brushColorRef, guidePoint);
                break;

            case "square":
                rectanglePointerMove(editorContextRef, brushSizeRef, pointer, guidePoint, brushColorRef);
                break;

            case "circle":
                circlePointerMove(editorContextRef, pointer, brushSizeRef, guidePoint, brushColorRef);
                break;

            case "polygon":
                polygonPointerMove(editorContextRef, brushSizeRef, guidePoint, brushColorRef, pointer);
                break;

            case "stamp":
                stampPointerMove(editorContextRef, guidePoint, stampImageRef, stampSize);
                break;        

            default:
                return;
        }

        overlayContextRef.current.restore();
    }

    /**
     * Viewport MouseUp Listener
     */
    const onPointerUp = (event) =>
    {
        panPointerUp(editorContextRef, event);
        overlayCanvasRef.current.releasePointerCapture(event.pointerId);
    }

    /**
     * Viewport MouseLeave Listener
     */
    const onPointerLeave = (event) =>
    {
        panPointerLeave(editorContextRef);
    }

    /**
     * Viewport ContextMenu Blocker
     */
    const blockContextMenu = (event) =>
    {
        event.preventDefault();
    }

    /**
     * Viewport MouseWheel Listener
     */
    const onPointerWheel = (event) => {

        event.preventDefault();

        zoomPointerWheel(editorContextRef, event);
    };

    /********************************************************************************
     * Drawing Helpers
     ********************************************************************************/

    /**
     * Draws all the initial visual guides in the editor. This includes:
     * -Background color
     * -Solid mask
     * -Grid
     * -Guide dots
     */
    const drawInitialVisuals = () => {

        //Sets up the solid canvas
        solidContextRef.current.fillStyle = "#fdf8f0ff"
        solidContextRef.current.fillRect(0, 0, solidCanvasRef.current.width, solidCanvasRef.current.height);

        //Sets up the grid canvas
        gridContextRef.current.fillStyle = "#ffebcd";
        gridContextRef.current.fillRect(0, 0, gridCanvasRef.current.width, gridCanvasRef.current.height);
        
        //Draws the dots and grid
        drawStaticGuides();
    }


    /**
     * Draws the guide dots along with the grid
     */
    const drawStaticGuides = () => {

        gridContextRef.current.fillStyle = "#000000";

        const { width, height } = gridContextRef.current.canvas;

        const cols = Math.ceil(width / tileSize);
        const rows = Math.ceil(height / tileSize);

        //This loop draws dots for each tile and gridlines
        for (let i = 0; i <= cols; i++)
        {
            //Draws a gridline for this column
            gridContextRef.current.beginPath();
            gridContextRef.current.moveTo(i * tileSize, 0);
            gridContextRef.current.lineTo(i * tileSize, gridContextRef.current.canvas.height);
            gridContextRef.current.lineWidth = 1;
            gridContextRef.current.strokeStyle = "#7a7a7aff";
            gridContextRef.current.stroke();
            
            for (let j = 0; j <= rows; j++)
            {
                const x = i * tileSize;
                const y = j * tileSize;

                //Draws a gridline for this row once
                if (i === 0)
                {
                    gridContextRef.current.beginPath();
                    gridContextRef.current.moveTo(0, j * tileSize);
                    gridContextRef.current.lineTo(gridContextRef.current.canvas.width, j * tileSize);
                    gridContextRef.current.lineWidth = 1;
                    gridContextRef.current.strokeStyle = "#7a7a7aff";
                    gridContextRef.current.stroke();
                }

                //Corners
                drawDot(dotContextRef, x, y, guideRadiusRef.current);

                //Line Midpoints
                if (x + tileSize <= width)
                {
                    drawDot(dotContextRef, x + (tileSize / 2), y, guideRadiusRef.current)
                }
                if (y + tileSize <= height)
                {
                    drawDot(dotContextRef, x, y + (tileSize / 2), guideRadiusRef.current)
                }

                //Center Point
                drawDot(dotContextRef, x + (tileSize / 2), y + (tileSize / 2), guideRadiusRef.current)
            }
        }
    }

    /**
     * Draws a dot with given params
     */
    const drawDot = (context, x, y, r) =>
    {
        context.current.fillStyle = "black"
        context.current.beginPath();
        context.current.arc(x, y, r, 0, Math.PI * 2);
        context.current.fill();
    }

    /**
     * Draws a larger dot over a guide dot to denote which dot is closest to the cursor
     */
    const drawHoverGuide = (context, dot, deleteMode) =>
    {
        //Clears the canvas of previous guide dot and preview
        context.current.clearRect(0, 0, context.current.canvas.width, context.current.canvas.height);

        //Aborts if somehow no dot was provided
        if (!dot) return;

        if (deleteMode)
        {
            context.current.fillStyle = "red";
        }

        else
        {
            context.current.fillStyle = "#000000ff";
        }
        
        //Draws the new guide dot
        context.current.beginPath();
        context.current.arc(dot.x, dot.y, guideHoverRadiusRef.current, 0, Math.PI * 2);
        context.current.fill();
    }

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

        alterationDimensions.current[direction] = resizeMode === "expand" ? alterationDimensions.current[direction] + 1 : alterationDimensions.current[direction] - 1;

    }

    /**
     * Handles a click for adding/removing rows/column
     */
    const alterDimensions = () => {
        
        //Calculate new dimensions
        const newDimensions = 
        {
            //Calculates new column/row data
            columns: mapStateRef.current.metadata.dimensions[1] + alterationDimensions.current["left"] + alterationDimensions.current["right"],
            rows: mapStateRef.current.metadata.dimensions[0] + alterationDimensions.current["up"] + alterationDimensions.current["down"],

        }

        //Protection for going into negative or zero dimensions
        if (newDimensions.columns <= 0 || newDimensions.rows <= 0)
        {
            resestAlterationDimensions();
            alert("Given alterations will result in negative dimensions, please enter different values");
            return;
        }

        //Update map metadata
        updateDimensions(mapStateRef.current, [newDimensions.rows, newDimensions.columns]);

        //Shift geometry if resizing from left/top to account for shifting world space
        if (alterationDimensions.current.left !== 0 || alterationDimensions.current.up !== 0)
        {
            const offsetX = alterationDimensions.current.left * tileSize;
            const offsetY = alterationDimensions.current.up * tileSize;

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
        drawInitialVisuals();
        rebuildSolidCanvas(editorContextRef.current);
        rebuildLineCanvas(editorContextRef.current);
        rebuildStampCanvas(editorContextRef.current);

        solidContextRef.current.restore();
        lineContextRef.current.restore();
        stampContextRef.current.restore();

    }

    /**
     * Canvas resizer helper
     */
    const resizeCanvas = (canvas, width, height) => {
        canvas.width = width;
        canvas.height = height;
    }

    /**
     * Canvas clipping helper, extra insurance to make sure nothing is drawn out of bounds
     */
    const applyMapClip = (context) => {
        context.beginPath();

        context.rect(0, 0, mapStateRef.current.metadata.width, mapStateRef.current.metadata.height);

        context.clip();
    }

    /**
     * Zeroes out alteration dimensions, meant to be used after a resize
     */
    const resestAlterationDimensions = () => {
        alterationDimensions.current = {up: 0, left: 0, right: 0, down: 0};
    }

    /**
     * Temporary logging helper
     */
    const logger = () => {
        console.log(interactionStateRef.current)
        console.log(mapStateRef.current);
        console.log(viewportStateRef.current)
        console.log(resizeMode)
    }

    /***********************************************************************
     * 
     * UI
     * 
     ***********************************************************************/
    return ( 
        <div>
            <div className="tool-bar" style={{maxWidth: "700px"}}>
                <p>Tool Bar: </p>
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
            <div id="viewport" className="map-viewport">
                <div ref={canvasStageRef} className="canvas-stage">
                    <div style={{position: " ", width: dimensions[1] * tileSize, height: dimensions[0] * tileSize}}>
                        <canvas ref={stampCanvasRef} className="stamp-canvas"></canvas>
                        <canvas ref={lineCanvasRef} className="line-canvas"></canvas>
                        <canvas ref={overlayCanvasRef} className="overlay-canvas"></canvas>
                        <canvas ref={borderCanvasRef} className="border-canvas"></canvas>
                        <canvas ref={dotCanvasRef} className="dot-canvas"></canvas>
                        <canvas ref={solidCanvasRef} className="solid-canvas"></canvas>
                        <canvas ref={gridCanvasRef} className="grid-canvas"></canvas>   
                    </div>
                </div>
            </div>
            <div>
                <button onClick={logger}>test</button>
            </div>
            <div>
                <dialog id="resize-dialog" closedby="any">
                    <h1>Resize Map</h1>
                    <button onClick={handleResizeModeClick}>{resizeMode}</button>
                    <div className="resize-graphic-container">
                        <button id="up-resize" onClick={setResizeDimensions}>
                            <img id="up-icon" src={arrowUpIcon} alt="Up Arrow Icon" />
                        </button>
                        <button id="left-resize" onClick={setResizeDimensions}>
                            <img id="left-icon" src={arrowLeftIcon} alt="Left Arrow Icon" />
                        </button>
                        <img src={gridIcon} alt="Grid Icon" />
                        <button id="right-resize" onClick={setResizeDimensions}>
                            <img id="right-icon" src={arrowRightIcon} alt="Right Arrow Icon" />
                        </button>
                        <button id="down-resize" onClick={setResizeDimensions}>
                            <img id="down-icon" src={arrowDownIcon} alt="Down Arrow Icon" />
                        </button>
                    </div>
                    <button onClick={alterDimensions} commandfor="resize-dialog" command="close">Submit Alterations</button>
                    <button commandfor="resize-dialog" command="close">Cancel</button>
                </dialog>
            </div>
        </div>
    );
}
 
export default MapEditor;