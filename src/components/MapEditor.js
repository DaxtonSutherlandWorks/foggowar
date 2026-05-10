//TODO: Commit notes: Merged canvas listerners, merged many brush/pan trackers into one state ref.
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
    const lineContext = useRef(null);
    const stampContext = useRef(null);
    const gridContext = useRef(null);
    const borderContext = useRef(null);
    const overlayContext = useRef(null);
    const solidContext = useRef(null);
    const dotContext = useRef(null);

    //Canvas operation Refs
    const startCoords = useRef([]);
    const paintPoints = useRef([]);
    const stampImage = useRef(null);
    const brushColor = useRef("black");
    const brushSize = useRef(3);
    const guideRadius = useRef(2);
    const guideHoverRadius = useRef(6);
    const snapDistance = useRef(12);

    //Viewport Refs
    const isPanningRef = useRef(false);
    const panningStartScreenX = useRef(0);
    const panningStartScreenY = useRef(0);
    const panningStartCameraX = useRef(0);
    const panningStartCameraY = useRef(0);
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

            solidContext,
            gridContext,
            borderContext,
            lineContext,
            stampContext,

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
        lineContext.current = lineCanvasRef.current.getContext("2d");
        stampContext.current = stampCanvasRef.current.getContext("2d");
        gridContext.current = gridCanvasRef.current.getContext("2d");
        borderContext.current = borderCanvasRef.current.getContext("2d");
        overlayContext.current = overlayCanvasRef.current.getContext("2d");
        solidContext.current = solidCanvasRef.current.getContext("2d");
        dotContext.current = dotCanvasRef.current.getContext("2d");

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
        solidContext.current.fillStyle = "#fdf8f0ff"
        solidContext.current.fillRect(0, 0, solidCanvasRef.current.width, solidCanvasRef.current.width);

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
            stampImage.current = null;
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            stampImage.current = img;
        };

        img.onerror = () => {
            stampImage.current = null;
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

        const pointer = getPointerData(event, overlayCanvasRef.current, viewportStateRef.current);

        //Break out to handle panning
        if (interactionStateRef.current.mode === "panning")
        {
            panningStartScreenX.current = pointer.screen.x;
            panningStartScreenY.current = pointer.screen.y;

            panningStartCameraX.current = viewportStateRef.current.cameraX;
            panningStartCameraY.current = viewportStateRef.current.cameraY;

            interactionStateRef.current.grabbing = true;

            viewportRef.current.style.cursor = "grabbing";

            //Prevents text selection and dragging quirks
            event.preventDefault();

            return;
        }
            
        //Checks whether the cursor is in range of a guide point
        let guidePoint = nearestGuidePoint(pointer.world.x, pointer.world.y, tileSize, snapDistance.current)

        //Click functions by mode
        switch (interactionStateRef.current.tool)
        {
            case "line":

                //Line deletion
                if (interactionStateRef.current.deletion)
                {
                    //Only triggers if a valid line is within range
                    if (guidePoint)
                    {
                        const line = findLineAtGuidePoint(
                            guidePoint.x,
                            guidePoint.y,
                            mapStateRef.current.lines,
                            16
                        );

                        if (line)
                        {
                            commandManagerRef.current.execute(
                                new DeleteLineCommand(line)
                            );
                        }

                    }
                }

                //First click of stroke
                else if (interactionStateRef.current.mode !== "painting")
                {
                    //If in range of a guide point, snaps to it
                    if (guidePoint)
                    {
                        interactionStateRef.current.mode = "painting";
                        startCoords.current = [guidePoint.x, guidePoint.y];
                    }
                    
                }

                //Terminate stroke
                else
                {
                    //Only terminates in range of guide point, snaps to it
                    if (guidePoint)
                    {
                        const line = {
                            id: crypto.randomUUID(), 
                            x1: startCoords.current[0], 
                            y1: startCoords.current[1], 
                            x2: guidePoint.x, 
                            y2: guidePoint.y
                        }
                        //Creates a new command that is executed through its own helper, then added to the manager's undo stack.
                        commandManagerRef.current.execute(
                            new DrawLineCommand(line)
                        );

                        //Clears the redo stack to avoid conflicts
                        commandManagerRef.current.clearRedoStack();

                        //Udates the painting state and clears the overlay preview
                        interactionStateRef.current.mode = "inactive";
                        overlayContext.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.width);
                    }
                }
                break;

            case "square":
                
                //First click of stroke
                if (interactionStateRef.current.mode !== "painting")
                {
                    //If in range of a guide point, snaps to it
                    if (guidePoint)
                    {
                        interactionStateRef.current.mode = "painting";
                        startCoords.current = [guidePoint.x, guidePoint.y];
                    }
                    
                }

                //Terminate stroke
                else
                {
                    //Only terminates in range of guide point, snaps to it
                    if (guidePoint)
                    {
                        const x1 = startCoords.current[0];
                        const y1 = startCoords.current[1];
                        const x2 = guidePoint.x;
                        const y2 = guidePoint.y;

                        //Normalize the rectange (set leftmost coords as first set) for consistent shape storage
                        const normalizedRect = normalizeRectangleCoords(x1, y1, x2, y2);

                        const rec = createShape(
                            {
                                id: crypto.randomUUID(),
                                type: "rectangle",

                                x: normalizedRect.x,
                                y: normalizedRect.y,

                                width: normalizedRect.w,
                                height: normalizedRect.h,

                                operation: interactionStateRef.current.deletion ? "subtract" : "add"
                            }
                        )

                        commandManagerRef.current.execute(
                            new ClearShapeCommand(rec)
                        );

                        //Clears the redo stack to avoid conflicts
                        commandManagerRef.current.clearRedoStack();

                        interactionStateRef.current.mode = "inactive";
                        overlayContext.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.width)

                    }
                }
                break;

            case "circle":
                
                //First click of stroke
                if (interactionStateRef.current.mode !== "painting")
                {
                    //If in range of a guide point, snaps to it
                    if (guidePoint)
                    {
                        interactionStateRef.current.mode = "painting";
                        startCoords.current = [guidePoint.x, guidePoint.y];
                    }
                    
                }

                //Terminate stroke
                else
                {
                    //Only terminates in range of guide point, snaps to it
                    if (guidePoint)
                    {
                        const x = startCoords.current[0];
                        const y = startCoords.current[1];
                        const r = Math.abs(Math.hypot((guidePoint.x - startCoords.current[0]), (guidePoint.y - startCoords.current[1])));

                        const circ = createShape(
                            {
                                id: crypto.randomUUID(),
                                type: "circle",

                                x: x,
                                y: y,
                                r: r,

                                operation: interactionStateRef.current.deletion ? "subtract" : "add"
                            }
                        )

                        commandManagerRef.current.execute(
                            new ClearShapeCommand(circ)
                        );

                        //Clears the redo stack to avoid conflicts
                        commandManagerRef.current.clearRedoStack();

                        interactionStateRef.current.mode = "inactive";
                        overlayContext.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.width);
                    }
                }
                break;

            case "polygon":

                //Checks for a guide point in range
                if (guidePoint)
                {

                    //First click of stroke
                    if (paintPoints.current.length === 0)
                    {
                        paintPoints.current = [...paintPoints.current, guidePoint];
                        interactionStateRef.current.mode = "painting";
                    }

                    else
                    {
                        //Checks if we're back at the start
                        if (guidePoint.x === paintPoints.current[0].x && guidePoint.y === paintPoints.current[0].y)
                        {

                            const poly = createShape(
                                {
                                    id: crypto.randomUUID(),
                                    type: "polygon",
                                    points: paintPoints.current,
                                    operation: interactionStateRef.current.deletion ? "subtract" : "add"
                                }
                            )
                            
                            commandManagerRef.current.execute(
                                new ClearShapeCommand(poly)
                            );

                            //Clears the redo stack to avoid conflicts
                            commandManagerRef.current.clearRedoStack();

                            paintPoints.current = [];
                            interactionStateRef.current.mode = "inactive";
                            overlayContext.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.width);
                        }
                        else
                        {
                            paintPoints.current = [...paintPoints.current, guidePoint];
                        }
                    }
                }

                break;

            case "stamp":

                if(guidePoint)
                {
                    //Stamp Deletion
                    if (interactionStateRef.current.deletion)
                    {
                        //Checks all stamps to find a match
                        for (let i = mapStateRef.current.stamps.length - 1; i >= 0; i--)
                        {
                            if (guidePoint.x >= mapStateRef.current.stamps[i].x 
                                && guidePoint.x <= mapStateRef.current.stamps[i].x + mapStateRef.current.stamps[i].width
                                && guidePoint.y >= mapStateRef.current.stamps[i].y
                                && guidePoint.y <= mapStateRef.current.stamps[i].y + mapStateRef.current.stamps[i].height)
                                {
                                    const stamp = mapStateRef.current.stamps[i];

                                    commandManagerRef.current.execute(
                                        new DeleteStampCommand(stamp)
                                    );
                                }
                        }

                        
                    }

                    //Checks if the stamp's potential area is clear
                    else if (isSquareCleared(solidContext.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]) && isSquareCleared(stampContext.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]))
                    {
                        const stamp = {
                            id: crypto.randomUUID(), 
                            imagePath: currStamp, 
                            x: guidePoint.x, 
                            y: guidePoint.y, 
                            width: stampSize[0], 
                            height: stampSize[1]
                        };

                        //Creates a new command that is executed through its own helper, then added to the manager's undo stack.
                        commandManagerRef.current.execute(
                            new DrawStampCommand(stamp)
                        );

                        //Clears the redo stack to avoid conflicts
                        commandManagerRef.current.clearRedoStack();
                    }
                }
                
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
        const rect = overlayCanvasRef.current.getBoundingClientRect();
        
        const pointer = getPointerData(event, overlayCanvasRef.current, viewportStateRef.current);

        const guidePoint = nearestGuidePoint(pointer.world.x, pointer.world.y, tileSize, snapDistance.current);

        //Draws active guide dot if not panning, clears old ones otherwise.
        if (interactionStateRef.current.mode !== "panning")
        {
            drawHoverGuide(overlayContext, guidePoint, interactionStateRef.current.deletion);
        }
        else
        {
            overlayContext.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

            if (interactionStateRef.current.grabbing)
            {
                //Calculates length of pan
                const panDistanceX = pointer.screen.x - panningStartScreenX.current;
                const panDistanceY = pointer.screen.y - panningStartScreenY.current;

                //Documents current pan coords
                viewportStateRef.current.cameraX = panningStartCameraX.current + panDistanceX;
                viewportStateRef.current.cameraY = panningStartCameraY.current + panDistanceY;

                //Takes the current pan coords and forces them to reenter the map if they had gotten out of bounds
                clampCamera(viewportStateRef.current, viewportRef.current.clientWidth, viewportRef.current.clientHeight, gridCanvasRef.current.width, gridCanvasRef.current.height);

                //Updates visuals
                applyViewportTransform(viewportStateRef.current, canvasStageRef.current);
            }
        }

        overlayContext.current.save();

        switch (interactionStateRef.current.tool)
        {
            case "line":

                //Ignore movements unless painting
                if (interactionStateRef.current.mode !== "painting")
                {
                    return;
                }

                overlayContext.current.beginPath();
                overlayContext.current.moveTo(startCoords.current[0], startCoords.current[1]);
                overlayContext.current.lineTo(pointer.world.x, pointer.world.y);
                overlayContext.current.lineWidth = brushSize.current;

                //Changes preview line color based on if it has a valid placement
                guidePoint ? overlayContext.current.strokeStyle = brushColor.current : overlayContext.current.strokeStyle = "rgba(65, 65, 65, 0.5)"

                overlayContext.current.stroke();
                break;

            case "square":

                //Ignore movements unless painting
                if (interactionStateRef.current.mode !== "painting")
                {
                    return;
                }

                overlayContext.current.beginPath();
                overlayContext.current.lineWidth = brushSize.current;
                overlayContext.current.rect(startCoords.current[0], startCoords.current[1], pointer.world.x - startCoords.current[0], pointer.world.y - startCoords.current[1]);

                //Changes preview line color based on if it has a valid placement
                if(!guidePoint)
                {
                    interactionStateRef.current.deletion ? overlayContext.current.strokeStyle = "rgba(255, 0, 0, 0.5)" : overlayContext.current.strokeStyle = "rgba(65, 65, 65, 0.5)";
                }
                else
                {
                    interactionStateRef.current.deletion ? overlayContext.current.strokeStyle = "red" : overlayContext.current.strokeStyle = brushColor.current;
                }

                overlayContext.current.stroke();
                break;

            case "circle":

                //Ignore movements unless painting
                if (interactionStateRef.current.mode !== "painting")
                {
                    return;
                }

                overlayContext.current.beginPath();
                overlayContext.current.arc(startCoords.current[0], startCoords.current[1], Math.abs(Math.hypot((pointer.world.x - startCoords.current[0]), (pointer.world.y - startCoords.current[1]))), 0, 2 * Math.PI);
                overlayContext.current.lineWidth = brushSize.current;

                //Changes preview line color based on if it has a valid placement
                if(!guidePoint)
                {
                    interactionStateRef.current.deletion ? overlayContext.current.strokeStyle = "rgba(255, 0, 0, 0.5)" : overlayContext.current.strokeStyle = "rgba(65, 65, 65, 0.5)";
                }
                else
                {
                    interactionStateRef.current.deletion ? overlayContext.current.strokeStyle = "red" : overlayContext.current.strokeStyle = brushColor.current;
                }

                overlayContext.current.stroke();
                break;

            case "polygon":
                
                //Ignore movements unless painting
                if (interactionStateRef.current.mode !== "painting")
                {
                    return;
                }

                overlayContext.current.lineWidth = brushSize.current;

                //Changes preview line color based on if it has a valid placement
                if(!guidePoint)
                {
                    interactionStateRef.current.deletion ? overlayContext.current.strokeStyle = "rgba(255, 0, 0, 0.5)" : overlayContext.current.strokeStyle = "rgba(65, 65, 65, 0.5)";
                }
                else
                {
                    interactionStateRef.current.deletion ? overlayContext.current.strokeStyle = "red" : overlayContext.current.strokeStyle = brushColor.current;
                }

                overlayContext.current.beginPath();
                overlayContext.current.moveTo(paintPoints.current[0].x, paintPoints.current[0].y)

                for (let i = 1; i < paintPoints.current.length; i++)
                {
                    overlayContext.current.lineTo(paintPoints.current[i].x, paintPoints.current[i].y);
                }

                overlayContext.current.lineTo(pointer.world.x, pointer.world.y);
                overlayContext.current.stroke();
                break;

            case "stamp":

                if (guidePoint && !interactionStateRef.current.deletion && interactionStateRef.current.mode === "inactive")
                {

                    overlayContext.current.drawImage(stampImage.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]);
                    
                    if (!isSquareCleared(solidContext.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]) || !isSquareCleared(stampContext.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]))
                    {
                        overlayContext.current.globalCompositeOperation = "source-atop";
                        overlayContext.current.fillStyle = "red";
                        overlayContext.current.fillRect(guidePoint.x + 6, guidePoint.y, stampSize[0], stampSize[1]);
                    }
                    
                }
                
                break;

            default:
                return;
        }

        overlayContext.current.restore();
    }

    /**
     * Viewport MouseUp Listener
     */
    const onPointerUp = (event) =>
    {
        if (interactionStateRef.current.mode !== "panning" || !interactionStateRef.current.grabbing)
        {
            return;
        }

        interactionStateRef.current.grabbing = false;

        //Exits middle mouse pan mode and returns to previous brush
        if (event.button === 1 && interactionStateRef.current.middlePan)
        {
            interactionStateRef.current.middlePan = false;
            interactionStateRef.current.mode = "inactive";
            viewportRef.current.style.cursor = "default";
            return;
        }

        viewportRef.current.style.cursor = "grab";

    }

    /**
     * Viewport MouseLeave Listener
     */
    const onPointerLeave = (event) =>
    {
        if (interactionStateRef.current.mode !== "panning")
        {
            return;
        }

        isPanningRef.current = false;
        viewportRef.current.style.cursor = "grab";
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

        //Zoom math

        //Translate mouse wheel delta (scroll ammount with direction shown by sign) into a +/-10% factor to use for scaling
        const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;

        const oldZoom = viewportStateRef.current.zoom;

        let newZoom = oldZoom * zoomFactor;

        //Locks zoom to set max/min
        newZoom = Math.max(
            viewportStateRef.current.minZoom,
            Math.min(
                viewportStateRef.current.maxZoom,
                newZoom
            )
        );

        const pointer = getPointerData(event, overlayCanvasRef.current, viewportStateRef.current);

        //Applying transformations

        //Zoom
        viewportStateRef.current.zoom = newZoom;

        //Panning
        viewportStateRef.current.cameraX = pointer.screen.x - (pointer.world.x * newZoom);
        viewportStateRef.current.cameraY = pointer.screen.y - (pointer.world.y * newZoom);

        clampCamera(viewportStateRef.current, viewportRef.current.clientWidth, viewportRef.current.clientHeight, gridCanvasRef.current.width, gridCanvasRef.current.height);

        applyViewportTransform(viewportStateRef.current, canvasStageRef.current);
    };

    /********************************************************************************
     * Drawing Helpers
     ********************************************************************************/

    /**
     * Draws the guide dots along with the grid
     */
    const drawStaticGuides = () => {

        gridContext.current.fillStyle = "#000000";

        const { width, height } = gridContext.current.canvas;

        const cols = Math.ceil(width / tileSize);
        const rows = Math.ceil(height / tileSize);

        //This loop draws dots for each tile and gridlines
        for (let i = 0; i <= cols; i++)
        {
            //Draws a gridline for this column
            gridContext.current.beginPath();
            gridContext.current.moveTo(i * tileSize, 0);
            gridContext.current.lineTo(i * tileSize, gridContext.current.canvas.height);
            gridContext.current.lineWidth = 1;
            gridContext.current.strokeStyle = "#7a7a7aff";
            gridContext.current.stroke();
            
            for (let j = 0; j <= rows; j++)
            {
                const x = i * tileSize;
                const y = j * tileSize;

                //Draws a gridline for this row once
                if (i === 0)
                {
                    gridContext.current.beginPath();
                    gridContext.current.moveTo(0, j * tileSize);
                    gridContext.current.lineTo(gridContext.current.canvas.width, j * tileSize);
                    gridContext.current.lineWidth = 1;
                    gridContext.current.strokeStyle = "#7a7a7aff";
                    gridContext.current.stroke();
                }

                //Corners
                drawDot(dotContext, x, y, guideRadius.current);

                //Line Midpoints
                if (x + tileSize <= width)
                {
                    drawDot(dotContext, x + (tileSize / 2), y, guideRadius.current)
                }
                if (y + tileSize <= height)
                {
                    drawDot(dotContext, x, y + (tileSize / 2), guideRadius.current)
                }

                //Center Point
                drawDot(dotContext, x + (tileSize / 2), y + (tileSize / 2), guideRadius.current)
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
        context.current.arc(dot.x, dot.y, guideHoverRadius.current, 0, Math.PI * 2);
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
     * Tempory logging helper
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