import { useEffect, useRef } from "react";
import "../styles/MapEditor.css"

import { nearestGuidePoint, applySquareBrush, applySquareDeletion, applyPolygonBrush, applyCircleBrush, isSquareCleared } from "../helpers/BrushUtils";

//Set up as class in order to access React.createRef
const MapEditor = ({dimensions, paintMode, deleteMode, currStamp, stampSize, tileSize}) => {

    //Canvas Refs
    const lineStampCanvasRef = useRef(null);
    const gridCanvasRef = useRef(null);
    const borderCanvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const solidCanvasRef = useRef(null);
    const dotCanvasRef = useRef(null);

    //Context Refs
    const lineStampContext = useRef(null);
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
    const brushColor = useRef("black");
    const brushSize = useRef(3);
    const guideRadius = useRef(2);
    const guideHoverRadius = useRef(6);
    const snapDistance = useRef(12);
    const commandHistory = useRef(["test","test","test2"]);

    useEffect(() => {

        if (!lineStampCanvasRef.current || !gridCanvasRef.current)
        {
            return
        }

        //Setting up contexts
        lineStampContext.current = lineStampCanvasRef.current.getContext("2d");
        gridContext.current = gridCanvasRef.current.getContext("2d");
        borderContext.current = borderCanvasRef.current.getContext("2d");
        overlayContext.current = overlayCanvasRef.current.getContext("2d");
        solidContext.current = solidCanvasRef.current.getContext("2d");
        dotContext.current = dotCanvasRef.current.getContext("2d");


        //Sizing canvases
        lineStampCanvasRef.current.width = dimensions[1] * tileSize;
        lineStampCanvasRef.current.height = dimensions[0] * tileSize;

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

    useEffect(() => {

        loadStamp(currStamp);

    }, [currStamp]);

    useEffect(() => {
        paintModeRef.current = paintMode;
    }, [paintMode]);

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
                            lineStampContext.current.beginPath();
                            lineStampContext.current.moveTo(startCoords.current[0], startCoords.current[1]);
                            lineStampContext.current.lineTo(guidePoint.x, guidePoint.y);
                            lineStampContext.current.lineWidth = brushSize.current;
                            lineStampContext.current.stroke();

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

                            applySquareBrush(solidContext.current, borderContext.current, startCoords.current[0], startCoords.current[1], guidePoint.x, guidePoint.y, brushSize.current, deleteModeRef.current);
                            
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

                            applyCircleBrush(solidContext.current, borderContext.current, startCoords.current[0], startCoords.current[1], Math.abs(Math.hypot((guidePoint.x - startCoords.current[0]), (guidePoint.y - startCoords.current[1]))), brushSize.current, deleteModeRef.current)

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
                                applyPolygonBrush(solidContext.current, borderContext.current, paintPoints.current, brushSize.current, deleteModeRef.current);

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
                        if (isSquareCleared(solidContext.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]))
                        {
                            lineStampContext.current.drawImage(stampImage.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]);
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

        drawHoverGuide(overlayContext, guidePoint);

         switch (paintModeRef.current)
            {
                case "line":

                    //Ignore movements unless painting
                    if (!painting.current)
                    {
                        return;
                    }

                    overlayContext.current.save();
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
                    overlayContext.current.restore();
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
                        overlayContext.current.strokeStyle = "rgba(65, 65, 65, 0.5)"
                    }
                    else
                    {
                        overlayContext.current.strokeStyle = brushColor.current;
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
                        overlayContext.current.strokeStyle = "rgba(65, 65, 65, 0.5)"
                    }
                    else
                    {
                        overlayContext.current.strokeStyle = brushColor.current;
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
                        overlayContext.current.strokeStyle = "rgba(65, 65, 65, 0.5)"
                    }
                    else
                    {
                        overlayContext.current.strokeStyle = brushColor.current;
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

                    if (guidePoint)
                    {
                        overlayContext.current.save();

                        overlayContext.current.drawImage(stampImage.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]);
                        
                        if (!isSquareCleared(solidContext.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]))
                        {
                            overlayContext.current.globalCompositeOperation = "source-atop";
                            overlayContext.current.fillStyle = "red";
                            overlayContext.current.fillRect(guidePoint.x + 6, guidePoint.y, stampSize[0], stampSize[1]);
                        }
                        
                        overlayContext.current.restore();
                    }
                    
                    break;
                
                default:
                    return;
            }
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
    const drawHoverGuide = (context, dot) =>
    {
        //Clears the canvas of previous guide dot and preview
        context.current.clearRect(0, 0, context.current.canvas.width, context.current.canvas.height);

        //Aborts if somehow no dot was provided
        if (!dot) return;

        context.current.fillStyle = "#000000ff";

        //Draws the new guide dot
        context.current.beginPath();
        context.current.arc(dot.x, dot.y, guideHoverRadius.current, 0, Math.PI * 2);
        context.current.fill();
    }

    /***********************************************************************
     * 
     * UI
     * 
     ***********************************************************************/
    return ( 
        <div>
            <div style={{border: "solid 5px black", width: dimensions[1] * tileSize, height: dimensions[0] * tileSize}}>
                <canvas ref={lineStampCanvasRef} className="line-stamp-canvas"></canvas>
                <canvas ref={overlayCanvasRef} className="overlay-canvas"></canvas>
                <canvas ref={borderCanvasRef} className="border-canvas"></canvas>
                <canvas ref={dotCanvasRef} className="dot-canvas"></canvas>
                <canvas ref={solidCanvasRef} className="solid-canvas"></canvas>
                <canvas ref={gridCanvasRef} className="grid-canvas"></canvas>   
            </div>
            <div>
                <p>test</p>
            </div>
        </div>
    );
}
 
export default MapEditor;