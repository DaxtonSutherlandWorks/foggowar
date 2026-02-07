import { useEffect, useRef } from "react";
import "../styles/MapEditor.css"
import {CommandManager} from "../classes/CommandManager"
import { nearestGuidePoint, applySquareBrush, applyPolygonBrush, applyCircleBrush, isSquareCleared, findLineAtGuidePoint } from "../helpers/BrushUtils";
import { DrawLineCommand } from "../classes/DrawLineCommand";
import { DrawStampCommand } from "../classes/DrawStampCommand";
import { ClearShapeCommand } from "../classes/ClearShapeCommand";
import UndoIcon from "../img/undoIcon.svg";
import RedoIcon from "../img/redoIcon.svg";
import { DeleteStampCommand } from "../classes/DeleteStampCommand";
import { DeleteLineCommand } from "../classes/DeleteLineCommand";

//Set up as class in order to access React.createRef
const MapEditor = ({dimensions, paintMode, deleteMode, currStamp, stampSize, tileSize}) => {

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

    const paintModeRef = useRef(paintMode);
    const deleteModeRef = useRef(deleteMode);
    const painting = useRef(false);
    const startCoords = useRef([]);
    const paintPoints = useRef([]);
    const stampImage = useRef(null);
    const stampId = useRef(1);
    const lineId = useRef(1);
    const brushColor = useRef("black");
    const brushSize = useRef(3);
    const guideRadius = useRef(2);
    const guideHoverRadius = useRef(6);
    const snapDistance = useRef(12);

    const editorContextRef = useRef(null);
    const commandManagerRef = useRef(null);

    const linesRef = useRef([]);
    const stampsRef = useRef([]);

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

            linesRef,
            stampsRef
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
       overlayCanvasRef.current.removeEventListener('mousedown', onMouseDown);
       overlayCanvasRef.current.addEventListener('mousedown', onMouseDown);

       overlayCanvasRef.current.removeEventListener('mousemove', onMouseMove);
       overlayCanvasRef.current.addEventListener('mousemove', onMouseMove);

        drawStaticGuides();

        loadStamp(currStamp)

    }, []);

    /**
     * Loads a new stamp whenever it is changed
     */
    useEffect(() => {

        loadStamp(currStamp);

    }, [currStamp]);

    /**
     * Updates the paintmode when changed in parent
     */
    useEffect(() => {
        
        paintModeRef.current = paintMode;

    }, [paintMode]);

    /**
     * Updates delete mode when changed in parent
     */
    useEffect(() => {

        deleteModeRef.current = deleteMode;

    }, [deleteMode]);

    /**
     * Loads the current stamp into an image that can be drawn on a canvas
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

    /**
    * Overlay mouse click listener
    */
    const onMouseDown = (event) => {

            //Checks whether the cursor is in range of a guide point
            let guidePoint = nearestGuidePoint(event.offsetX, event.offsetY, tileSize, snapDistance.current)

            switch (paintModeRef.current)
            {
                case "line":

                    if (deleteModeRef.current)
                    {
                        if (guidePoint)
                        {
                            const line = findLineAtGuidePoint(
                                guidePoint.x,
                                guidePoint.y,
                                linesRef.current,
                                16
                            );

                            if (line)
                            {
                                commandManagerRef.current.execute(
                                    new DeleteLineCommand({id: line.id, x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2})
                                );
                            }

                        }
                    }

                    //First click of stroke
                    else if (!painting.current)
                    {
                        //If in range of a guide point, snaps to it
                        if (guidePoint)
                        {
                            painting.current = true;
                            startCoords.current = [guidePoint.x, guidePoint.y];
                        }
                        
                    }

                    //Terminate stroke
                    else
                    {
                        //Only terminates in range of guide point, snaps to it
                        if (guidePoint)
                        {
                            //Creates a new command that is executed through its own helper, then added to the manager's undo stack.
                            commandManagerRef.current.execute(
                                new DrawLineCommand({id: lineId.current, x1: startCoords.current[0], y1: startCoords.current[1], x2: guidePoint.x, y2: guidePoint.y})
                            )

                            lineId.current = lineId.current + 1;

                            //Clears the redo stack to avoid conflicts
                            commandManagerRef.current.clearRedoStack();

                            painting.current = false;
                            overlayContext.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.width);
                        }
                    }
                    break;

                case "square":
                    
                    //First click of stroke
                    if (!painting.current)
                    {
                        //If in range of a guide point, snaps to it
                        if (guidePoint)
                        {
                            painting.current = true;
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

                            const canvasImages = applySquareBrush(editorContextRef.current, x1, y1, x2, y2, deleteModeRef.current);                            

                            commandManagerRef.current.push(
                                new ClearShapeCommand({beforeImage: canvasImages.beforeImage, afterImage: canvasImages.afterImage, editorContextRef})
                            );

                            //Clears the redo stack to avoid conflicts
                            commandManagerRef.current.clearRedoStack();

                            painting.current = false;
                            overlayContext.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.width)

                        }
                    }
                    break;

                case "circle":
                    
                    //First click of stroke
                    if (!painting.current)
                    {
                        //If in range of a guide point, snaps to it
                        if (guidePoint)
                        {
                            painting.current = true;
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

                            const canvasImages = applyCircleBrush(editorContextRef.current, x, y, r, deleteModeRef.current);

                            commandManagerRef.current.push(
                                new ClearShapeCommand({beforeImage: canvasImages.beforeImage, afterImage: canvasImages.afterImage, editorContextRef})
                            );

                            //Clears the redo stack to avoid conflicts
                            commandManagerRef.current.clearRedoStack();

                            painting.current = false;
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
                            painting.current = true;
                        }

                        else
                        {
                            //Checks if we're back at the start
                            if (guidePoint.x === paintPoints.current[0].x && guidePoint.y === paintPoints.current[0].y)
                            {

                                const canvasImages = applyPolygonBrush(editorContextRef.current, paintPoints.current, deleteModeRef.current);

                                commandManagerRef.current.push(
                                    new ClearShapeCommand({beforeImage: canvasImages.beforeImage, afterImage: canvasImages.afterImage, editorContextRef})
                                );

                                //Clears the redo stack to avoid conflicts
                                commandManagerRef.current.clearRedoStack();

                                paintPoints.current = [];
                                painting.current = false;
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
                        if (deleteModeRef.current)
                        {
                            for (let i = stampsRef.current.length - 1; i >= 0; i--)
                            {
                                if (guidePoint.x >= stampsRef.current[i].x 
                                    && guidePoint.x <= stampsRef.current[i].x + stampsRef.current[i].width
                                    && guidePoint.y >= stampsRef.current[i].y
                                    && guidePoint.y <= stampsRef.current[i].y + stampsRef.current[i].height)
                                    {
                                        const stamp = stampsRef.current[i];

                                        commandManagerRef.current.execute(
                                            new DeleteStampCommand({id: stamp.id, image: stamp.image, x: stamp.x, y: stamp.y, width: stamp.width, height: stamp.height})
                                        );
                                    }
                            }

                            
                        }

                        else if (isSquareCleared(solidContext.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]) && isSquareCleared(stampContext.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]))
                        {
                            //Creates a new command that is executed through its own helper, then added to the manager's undo stack.
                            commandManagerRef.current.execute(
                                new DrawStampCommand({id: stampId.current, image: stampImage.current, x: guidePoint.x, y: guidePoint.y, width: stampSize[0], height: stampSize[1]})
                            );

                            stampId.current = stampId.current + 1;

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
    const onMouseMove = (event) => {

        //Renders a guide dot to show user where their brush will snap to, drawing or not.
        const rect = overlayCanvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const guidePoint = nearestGuidePoint(x, y, tileSize, snapDistance.current);

        drawHoverGuide(overlayContext, guidePoint, deleteModeRef.current);

        overlayContext.current.save();

         switch (paintModeRef.current)
            {
                case "line":

                    //Ignore movements unless painting
                    if (!painting.current)
                    {
                        return;
                    }

                    overlayContext.current.beginPath();
                    overlayContext.current.moveTo(startCoords.current[0], startCoords.current[1]);
                    overlayContext.current.lineTo(event.offsetX, event.offsetY);
                    overlayContext.current.lineWidth = brushSize.current;

                    //Changes preview line color based on if it has a valid placement
                    if(!guidePoint)
                    {
                        overlayContext.current.strokeStyle = "rgba(65, 65, 65, 0.5)"
                    }
                    else
                    {
                        overlayContext.current.strokeStyle = brushColor.current;
                    }

                    overlayContext.current.stroke();
                    break;

                case "square":

                    //Ignore movements unless painting
                    if (!painting.current)
                    {
                        return;
                    }

                    overlayContext.current.beginPath();
                    overlayContext.current.lineWidth = brushSize.current;
                    overlayContext.current.rect(startCoords.current[0], startCoords.current[1], event.offsetX - startCoords.current[0], event.offsetY - startCoords.current[1]);

                    //Changes preview line color based on if it has a valid placement
                    if(!guidePoint)
                    {
                        if (deleteModeRef.current)
                        {
                            overlayContext.current.strokeStyle = "rgba(255, 0, 0, 0.5)"
                        }
                        else
                        {
                            overlayContext.current.strokeStyle = "rgba(65, 65, 65, 0.5)"
                        }
                    }
                    else
                    {
                        if (deleteModeRef.current)
                        {   
                            overlayContext.current.strokeStyle = "red";
                        }
                        else
                        {
                            overlayContext.current.strokeStyle = brushColor.current;
                        }
                    }

                    overlayContext.current.stroke();
                    break;

                case "circle":

                    //Ignore movements unless painting
                    if (!painting.current)
                    {
                        return;
                    }

                    overlayContext.current.beginPath();
                    overlayContext.current.arc(startCoords.current[0], startCoords.current[1], Math.abs(Math.hypot((event.offsetX - startCoords.current[0]), (event.offsetY - startCoords.current[1]))), 0, 2 * Math.PI);
                    overlayContext.current.lineWidth = brushSize.current;

                    //Changes preview line color based on if it has a valid placement
                    if(!guidePoint)
                    {
                        if (deleteModeRef.current)
                        {
                            overlayContext.current.strokeStyle = "rgba(255, 0, 0, 0.5)"
                        }
                        else
                        {
                            overlayContext.current.strokeStyle = "rgba(65, 65, 65, 0.5)"
                        }
                    }
                    else
                    {
                        if (deleteModeRef.current)
                        {   
                            overlayContext.current.strokeStyle = "red";
                        }
                        else
                        {
                            overlayContext.current.strokeStyle = brushColor.current;
                        }
                    }

                    overlayContext.current.stroke();
                    break;

                case "polygon":
                    
                    //Ignore movements unless painting
                    if (!painting.current)
                    {
                        return;
                    }

                    overlayContext.current.lineWidth = brushSize.current;

                    //Changes preview line color based on if it has a valid placement
                    if(!guidePoint)
                    {
                        if (deleteModeRef.current)
                        {
                            overlayContext.current.strokeStyle = "rgba(255, 0, 0, 0.5)"
                        }
                        else
                        {
                            overlayContext.current.strokeStyle = "rgba(65, 65, 65, 0.5)"
                        }
                    }
                    else
                    {
                        if (deleteModeRef.current)
                        {   
                            overlayContext.current.strokeStyle = "red";
                        }
                        else
                        {
                            overlayContext.current.strokeStyle = brushColor.current;
                        }
                    }

                    overlayContext.current.beginPath();
                    overlayContext.current.moveTo(paintPoints.current[0].x, paintPoints.current[0].y)

                    for (let i = 1; i < paintPoints.current.length; i++)
                    {
                        overlayContext.current.lineTo(paintPoints.current[i].x, paintPoints.current[i].y);
                    }

                    overlayContext.current.lineTo(event.offsetX, event.offsetY);
                    overlayContext.current.stroke();
                    break;

                case "stamp":

                    if (guidePoint && !deleteModeRef.current)
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
            </div>
            <div style={{border: "solid 2px black", width: dimensions[1] * tileSize, height: dimensions[0] * tileSize}}>
                <canvas ref={stampCanvasRef} className="stamp-canvas"></canvas>
                <canvas ref={lineCanvasRef} className="line-canvas"></canvas>
                <canvas ref={overlayCanvasRef} className="overlay-canvas"></canvas>
                <canvas ref={borderCanvasRef} className="border-canvas"></canvas>
                <canvas ref={dotCanvasRef} className="dot-canvas"></canvas>
                <canvas ref={solidCanvasRef} className="solid-canvas"></canvas>
                <canvas ref={gridCanvasRef} className="grid-canvas"></canvas>   
            </div>
        </div>
    );
}
 
export default MapEditor;