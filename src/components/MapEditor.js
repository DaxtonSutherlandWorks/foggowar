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
import { resizeCanvas, shiftGeometry, toolbarImport, toolbarPNGExport, toolbarRedo, toolbarSave, toolbarUndo } from "../helpers/ToolbarUtils";
import MapEditorToolBar from "./MapEditorToolBar";
import { drawHoverGuide, drawInitialVisuals } from "../helpers/EditorDrawingUtils";

//TODO: Lock Zoom to not go out of bounds when zooming out.
//TODO: There is a quirk where you can delete the map out from under lines and stamps.

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
    
    //Flag to keep toolbar from loading before dependancies exist
    const [editorContextReady, setEditorContextReady] = useState(false);

    //Stamp Ref
    const currStampRef = useRef(currStamp);

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
            dotCanvasRef,

            solidContextRef,
            gridContextRef,
            borderContextRef,
            lineContextRef,
            stampContextRef,
            overlayContextRef,
            dotContextRef,

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

            guideRadiusRef,
            guideHoverRadiusRef,

            commandManagerRef
        }

        commandManagerRef.current = new CommandManager(editorContextRef.current);

        setEditorContextReady(true);

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

        //Sizing canvases
        const width = dimensions[0] * tileSize;
        const height = dimensions[1] * tileSize;

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
       drawInitialVisuals(editorContextRef);

        //Loads in the initial stamp image
        loadStamp(currStamp)

    }, []);

    /**
     * Loads a new stamp whenever it is changed, updates the ref because my listeners don't play nicely with the useState
     */
    useEffect(() => {

        loadStamp(currStamp);
        currStampRef.current = currStamp;

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
    const loadStamp = (stampData) =>
    {
        if (!stampData) {
            stampImageRef.current = null;
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = stampData.image;

        img.onload = () => {
            stampImageRef.current = img;
        };

        img.onerror = () => {
            stampImageRef.current = null;
        };
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
                stampPointerDown(editorContextRef, guidePoint, currStampRef.current);
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

        //Clears the canvas of previous guide dot and preview
        overlayContextRef.current.clearRect(0, 0, overlayContextRef.current.canvas.width, overlayContextRef.current.canvas.height);

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
                stampPointerMove(editorContextRef, guidePoint, stampImageRef.current, currStamp);
                break;        

            default:
                return;
        }

        overlayContextRef.current.restore();

        //Draws active guide dot if not panning, clears old ones otherwise.
        if (interactionStateRef.current.mode !== "panning")
        {
            drawHoverGuide(overlayContextRef, guidePoint, interactionStateRef.current.deletion, guideHoverRadiusRef);
        }
        else
        {
            overlayContextRef.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

            if (interactionStateRef.current.grabbing)
            {
                panPointerMove(editorContextRef, pointer);
            }
        }

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
            {editorContextReady && <MapEditorToolBar editorContextRef={editorContextRef}></MapEditorToolBar>}
            <div id="viewport" className="map-viewport">
                <div ref={canvasStageRef} className="canvas-stage">
                    <div style={{position: " ", width: dimensions[0] * tileSize, height: dimensions[1] * tileSize}}>
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