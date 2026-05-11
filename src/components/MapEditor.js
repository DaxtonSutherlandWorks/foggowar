//TODO: Phase 4, make a bunch of helper functions for listeners
//  -Better utilize the editor context ref to cut down on helper params
//TODO: Phase 5, shift to using pointer capture from mouse events
import { useEffect, useRef } from "react";
import "../styles/MapEditor.css"
import {CommandManager} from "../classes/CommandManager"
import { nearestGuidePoint, isSquareCleared, findLineAtGuidePoint, normalizeRectangleCoords, rebuildSolidCanvas, rebuildLineCanvas, rebuildStampCanvas } from "../helpers/BrushUtils";
import { DrawLineCommand } from "../classes/DrawLineCommand";
import { DrawStampCommand } from "../classes/DrawStampCommand";
import { ClearShapeCommand } from "../classes/ClearShapeCommand";
import UndoIcon from "../img/undoIcon.svg";
import RedoIcon from "../img/redoIcon.svg";
import SaveIcon from "../img/saveIcon.svg";
import ImportIcon from "../img/importIcon.svg";
import { DeleteStampCommand } from "../classes/DeleteStampCommand";
import { DeleteLineCommand } from "../classes/DeleteLineCommand";
import { createInitialMapState } from "../helpers/MapState";
import { createShape } from "../schemas/shapeSchema";
import { applyViewportTransform, clampCamera, createInitialViewportState, getPointerData, screenToWorld } from "../helpers/ViewportUtils";
import { linePointerDown, linePointerMove } from "../helpers/LineUtils";
import { rectanglePointerDown, rectanglePointerMove } from "../helpers/RectUtils";
import { circlePointerDown, circlePointerMove } from "../helpers/CircleUtils";
import { polygonPointerDown, polygonPointerMove } from "../helpers/PolygonUtils";
import { stampPointerDown, stampPointerMove } from "../helpers/StampUtils";
import { panPointerDown, panPointerLeave, panPointerMove, panPointerUp, zoomPointerWheel } from "../helpers/PanZoomUtils";

//Set up as class in order to access React.createRef
const MapEditor = ({dimensions, paintTool, paintMode, setPaintMode, deleteMode, currStamp, stampSize, tileSize}) => {

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
    const prePanModeRef = useRef(null);

    //Object refs
    const editorContextRef = useRef(null);
    const commandManagerRef = useRef(null);
    const mapStateRef = useRef(createInitialMapState(dimensions, tileSize));
    const interactionStateRef = useRef({mode: "painting", tool: paintMode, deletion: deleteMode, grabbing: false, middlePan: false});

    //Toolbar Refs
    const mapUploadRef = useRef(null);

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

            solidContext: solidContextRef,
            gridContext: gridContextRef,
            borderContext: borderContextRef,
            lineContext: lineContextRef,
            stampContext: stampContextRef,

            mapStateRef
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
        lineCanvasRef.current.width = dimensions[1] * tileSize;
        lineCanvasRef.current.height = dimensions[0] * tileSize;

        stampCanvasRef.current.width = dimensions[1] * tileSize;
        stampCanvasRef.current.height = dimensions[0] * tileSize;

        gridCanvasRef.current.width = dimensions[1] * tileSize;
        gridCanvasRef.current.height = dimensions[0] * tileSize;

        borderCanvasRef.current.width = dimensions[1] * tileSize;
        borderCanvasRef.current.height = dimensions[0] * tileSize;

        overlayCanvasRef.current.width = dimensions[1] * tileSize;
        overlayCanvasRef.current.height = dimensions[0] * tileSize;

        solidCanvasRef.current.width = dimensions[1] * tileSize;
        solidCanvasRef.current.height = dimensions[0] * tileSize;

        dotCanvasRef.current.width = dimensions[1] * tileSize;
        dotCanvasRef.current.height = dimensions[0] * tileSize;

        //Sets up the solid canvas
        solidContextRef.current.fillStyle = "#fdf8f0ff"
        solidContextRef.current.fillRect(0, 0, solidCanvasRef.current.width, solidCanvasRef.current.height);

       //Listeners are made as class methods so they can be removed before being applied
       //This prevents the confusing and breaking behavior of listeners getting duplicated on a rerender.
       overlayCanvasRef.current.removeEventListener('mousedown', onPointerDown);
       overlayCanvasRef.current.addEventListener('mousedown', onPointerDown);

       overlayCanvasRef.current.removeEventListener('mousemove', onPointerMove);
       overlayCanvasRef.current.addEventListener('mousemove', onPointerMove);

       viewportRef.current.removeEventListener('mouseup', onPointerUp);
       viewportRef.current.addEventListener('mouseup', onPointerUp);

       viewportRef.current.removeEventListener('mouseleave', onPointerLeave);
       viewportRef.current.addEventListener('mouseleave', onPointerLeave);

       viewportRef.current.removeEventListener('contextmenu', blockContextMenu);
       viewportRef.current.addEventListener('contextmenu', blockContextMenu);

       viewportRef.current.removeEventListener('wheel', onPointerWheel);
       viewportRef.current.addEventListener('wheel', onPointerWheel, {passive: false});

        drawStaticGuides();

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
            panPointerDown(panningStartScreenXRef, panningStartScreenYRef, panningStartCameraXRef, panningStartCameraYRef, interactionStateRef, viewportStateRef, viewportRef, pointer);
            
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
                linePointerDown(interactionStateRef, guidePoint, mapStateRef, commandManagerRef, startCoordsRef, overlayContextRef, overlayCanvasRef)
                break;

            case "square":
                rectanglePointerDown(interactionStateRef, guidePoint, startCoordsRef, commandManagerRef, overlayContextRef, overlayCanvasRef);
                break;

            case "circle":
                circlePointerDown(interactionStateRef, guidePoint, startCoordsRef, commandManagerRef, overlayContextRef, overlayCanvasRef);
                break;

            case "polygon":
                polygonPointerDown(guidePoint, paintPointsRef, interactionStateRef, commandManagerRef, overlayContextRef, overlayCanvasRef);
                break;

            case "stamp":
                stampPointerDown(guidePoint, interactionStateRef, mapStateRef, commandManagerRef, solidContextRef, stampContextRef, currStamp, stampSize);
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
                panPointerMove(interactionStateRef, pointer, panningStartScreenXRef, panningStartScreenYRef, viewportStateRef, panningStartCameraXRef, panningStartCameraYRef, viewportRef, gridCanvasRef, canvasStageRef);
            }
        }

        overlayContextRef.current.save();

        switch (interactionStateRef.current.tool)
        {
            case "line":
                linePointerMove(interactionStateRef, overlayContextRef, startCoordsRef, pointer, brushSizeRef, brushColorRef, guidePoint);
                break;

            case "square":
                rectanglePointerMove(interactionStateRef, overlayContextRef, brushSizeRef, startCoordsRef, pointer, guidePoint, brushColorRef);
                break;

            case "circle":
                circlePointerMove(interactionStateRef, overlayContextRef, startCoordsRef, pointer, brushSizeRef, guidePoint, brushColorRef);
                break;

            case "polygon":
                polygonPointerMove(interactionStateRef, overlayContextRef, brushSizeRef, guidePoint, paintPointsRef, brushColorRef, pointer);
                break;

            case "stamp":
                stampPointerMove(guidePoint, interactionStateRef, overlayContextRef, stampImageRef, stampSize, solidContextRef, stampContextRef);
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
        panPointerUp(interactionStateRef, event, viewportRef);

    }

    /**
     * Viewport MouseLeave Listener
     */
    const onPointerLeave = (event) =>
    {
        panPointerLeave(interactionStateRef, viewportRef);
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

        zoomPointerWheel(event, viewportStateRef, viewportRef, gridCanvasRef, canvasStageRef);
    };

    /********************************************************************************
     * Drawing Helpers
     ********************************************************************************/

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

    /********************************************************************************
     * Toolbar Helpers
     ********************************************************************************/

    /**
     * Handles a call to undo
     */
    const handleUndo = (event) => 
    {
        commandManagerRef.current.undo();
    }

    /**
     * Handles a call to redo
     */
    const handleRedo = (event) => 
    {
        commandManagerRef.current.redo();
    }

    /**
     * Handles a call to save
     */
    const handleSave = (event) =>
    {
        //Data prep
        const json = JSON.stringify(mapStateRef.current, null, 2);
        const blob = new Blob([json], {type: "application/json"});

        //Creating a tempory link that is automatically clicked
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "map.fog";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    /**
     * Handles importing a map
     */
    const handleMapImport = (event) =>
    {
        const file = event.target.files[0];

        if (!file)
        {
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => 
        {
            try
            {
                const parsed = JSON.parse(e.target.result);

                validateMapState(parsed);

                mapStateRef.current = parsed;

                rebuildFromState(parsed);
            }
            catch (err)
            {
                console.error("Invalid file", err);
                alert("Failed to load map file");
            }
        };

        reader.readAsText(file);
    }

    /**
     * Checks for basic map traits
     */
    const validateMapState = (data) => 
    {
        if (!data.version)
        {
            throw new Error("Missing version");
        }
        
        if (!data.shapes)
        {
            throw new Error("Invalid shapes");
        }
    }

    /**
     * Rebuilds the editor
     */
    const rebuildFromState = (state) =>
    {
        rebuildSolidCanvas(editorContextRef.current);
        rebuildLineCanvas(editorContextRef.current);
        rebuildStampCanvas(editorContextRef.current);
    }

    /**
     * Temporary logging helper
     */
    const logger = () => {
        console.log(interactionStateRef.current)
        console.log(mapStateRef.current);
        console.log(viewportStateRef.current)
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
                <button onClick={handleUndo}><img src={UndoIcon} alt="Undo button"></img></button>
                <button onClick={handleRedo}><img src={RedoIcon} alt="Redo button"></img></button>
                <button onClick={handleSave}><img src={SaveIcon} alt="Save button"></img></button>
                <button onClick={() => mapUploadRef.current.click()}><img src={ImportIcon} alt="Import button"></img></button>
                <input type="file"
                accept=".fog"
                ref={mapUploadRef}
                style={{display:"none"}}
                onChange={handleMapImport} />
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
        </div>
    );
}
 
export default MapEditor;