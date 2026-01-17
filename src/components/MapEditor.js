import React from "react";
import "../styles/MapEditor.css"
import { nearestGuidePoint, applySquareBrush, applyPolygonBrush, applyCircleBrush } from "../helpers/BrushUtils";

//Set up as class in order to access React.createRef
class MapEditor extends React.Component {
    
    //Sets up canvas references and initial brush settings
    constructor(props) {
        super(props);
        this.bgCanvasRef = React.createRef();
        this.dotCanvasRef = React.createRef();
        this.gridCanvasRef = React.createRef();
        this.borderCanvasRef = React.createRef();
        this.overlayCanvasRef = React.createRef();
        this.solidCanvasRef = React.createRef();

        this.brushColor = '#000000';
        this.brushSize = 3;

        this.painting = false;
        this.paintPoints = [];

        this.startX = 0;
        this.startY = 0;

        this.tileSize = 70;
        this.guideRadius = 2;
        this.guideHoverRadius = 6;
        this.snapDistance = 12;

        //Methods must be bound to "this" in order to access "this'" properties
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.drawStaticGuides = this.drawStaticGuides.bind(this);
        this.drawHoverGuide = this.drawHoverGuide.bind(this);
    }

    /**
     * Sets up listeners for the overlay and background canvases
     */
    componentDidMount() {

        //Canvas Contexts
        this.bgContext = this.bgCanvasRef.current.getContext('2d');
        this.dotContext = this.dotCanvasRef.current.getContext('2d');
        this.gridContext = this.gridCanvasRef.current.getContext('2d');
        this.overlayContext = this.overlayCanvasRef.current.getContext('2d');
        this.solidContext = this.solidCanvasRef.current.getContext('2d');
        this.borderContext = this.borderCanvasRef.current.getContext('2d');

        //Canvas sizing dynamic to grid size, done here to prevent scaling issues
        this.bgCanvasRef.current.width = this.props.dimensions[1] * this.tileSize;
        this.bgCanvasRef.current.height = this.props.dimensions[0] * this.tileSize;

        this.dotCanvasRef.current.width = this.props.dimensions[1] * this.tileSize;
        this.dotCanvasRef.current.height = this.props.dimensions[0] * this.tileSize;

        this.gridCanvasRef.current.width = this.props.dimensions[1] * this.tileSize;
        this.gridCanvasRef.current.height = this.props.dimensions[0] * this.tileSize;

        this.overlayCanvasRef.current.width = this.props.dimensions[1] * this.tileSize;
        this.overlayCanvasRef.current.height = this.props.dimensions[0] * this.tileSize;

        this.solidCanvasRef.current.width = this.props.dimensions[1] * this.tileSize;
        this.solidCanvasRef.current.height = this.props.dimensions[0] * this.tileSize;

        this.borderCanvasRef.current.width = this.props.dimensions[1] * this.tileSize;
        this.borderCanvasRef.current.height = this.props.dimensions[0] * this.tileSize;

        //Sets up the solid canvas
        this.solidContext.fillStyle = "#fdf8f0ff"
        this.solidContext.fillRect(0, 0, this.solidCanvasRef.current.width, this.solidCanvasRef.current.width)

        
        /***********************************************************************
        * 
        * Overlay Canvas Listeners
        * 
        ************************************************************************/
       
       //Listeners are made as class methods so they can be removed before being applied
       //This prevents the confusing and breaking behavior of listeners getting duplicated on a rerender.
       this.overlayCanvasRef.current.removeEventListener('mousedown', this.onMouseDown);
       this.overlayCanvasRef.current.addEventListener('mousedown', this.onMouseDown);
       
       this.overlayCanvasRef.current.removeEventListener('mouseup', this.onMouseUp);
       this.overlayCanvasRef.current.addEventListener('mouseup', this.onMouseUp);

       this.overlayCanvasRef.current.removeEventListener('mousemove', this.onMouseMove);
       this.overlayCanvasRef.current.addEventListener('mousemove', this.onMouseMove);

       this.drawStaticGuides();
    }

    /**
    * Overlay mouse click listener
    */
    onMouseDown(event) {

            //Checks whether the cursor is in range of a guide point
            let guidePoint = nearestGuidePoint(event.offsetX, event.offsetY, this.tileSize, this.snapDistance)

            switch (this.props.paintMode)
            {
                case "line":

                    //First click of stroke
                    if (!this.painting)
                    {
                        //If in range of a guide point, snaps to it
                        if (guidePoint)
                        {
                            this.painting = true;
                            this.startX = guidePoint.x;
                            this.startY = guidePoint.y;
                        }
                        
                    }

                    //Terminate stroke
                    else
                    {
                        //Only terminates in range of guide point, snaps to it
                        if (guidePoint)
                        {
                            this.bgContext.beginPath();
                            this.bgContext.moveTo(this.startX, this.startY);
                            this.bgContext.lineTo(guidePoint.x, guidePoint.y);
                            this.bgContext.lineWidth = this.brushSize;
                            this.bgContext.stroke();

                            this.painting = false;
                            this.overlayContext.clearRect(0, 0, this.overlayCanvasRef.current.width, this.overlayCanvasRef.current.width)
                        }
                    }
                    break;

                case "square":
                    
                    //First click of stroke
                    if (!this.painting)
                    {
                        //If in range of a guide point, snaps to it
                        if (guidePoint)
                        {
                            this.painting = true;
                            this.startX = guidePoint.x;
                            this.startY = guidePoint.y;
                        }
                        
                    }

                    //Terminate stroke
                    else
                    {
                        //Only terminates in range of guide point, snaps to it
                        if (guidePoint)
                        {
                            applySquareBrush(this.solidContext, this.borderContext, this.startX, this.startY, guidePoint.x, guidePoint.y, this.brushSize)
                            
                            this.painting = false;
                            this.overlayContext.clearRect(0, 0, this.overlayCanvasRef.current.width, this.overlayCanvasRef.current.width)

                        }
                    }
                    break;

                case "circle":
                    
                    //First click of stroke
                    if (!this.painting)
                    {
                        //If in range of a guide point, snaps to it
                        if (guidePoint)
                        {
                            this.painting = true;
                            this.startX = guidePoint.x;
                            this.startY = guidePoint.y;
                        }
                        
                    }

                    //Terminate stroke
                    else
                    {
                        //Only terminates in range of guide point, snaps to it
                        if (guidePoint)
                        {

                            applyCircleBrush(this.solidContext, this.borderContext, this.startX, this.startY, Math.abs(Math.hypot((guidePoint.x - this.startX), (guidePoint.y - this.startY))), this.brushSize)

                            this.painting = false;
                            this.overlayContext.clearRect(0, 0, this.overlayCanvasRef.current.width, this.overlayCanvasRef.current.width)
                        }
                    }
                    break;

                case "polygon":

                    //Checks for a guide point in range
                    if (guidePoint)
                    {

                        //First click of stroke
                        if (this.paintPoints.length === 0)
                        {
                            this.paintPoints.push(guidePoint);
                            this.painting = true;
                        }

                        else
                        {
                            //Checks if we're back at the start
                            if (guidePoint.x === this.paintPoints[0].x && guidePoint.y === this.paintPoints[0].y)
                            {
                                applyPolygonBrush(this.solidContext, this.borderContext, this.paintPoints, this.brushSize);

                                this.paintPoints = [];
                                this.painting = false;
                                this.overlayContext.clearRect(0, 0, this.overlayCanvasRef.current.width, this.overlayCanvasRef.current.width);
                            }
                            else
                            {
                                this.paintPoints.push(guidePoint);
                            }
                        }
                    }

                    break;
                
                default:
                    return;
            }
    }

    /**
    * Overlay mouse release listener
    */
    onMouseUp(event) {

    }

    /**
    * Overlay mouse movement listener
    */
    onMouseMove(event) {

        //Renders a guide dot to show user where their brush will snap to, drawing or not.
        const rect = this.overlayCanvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const guidePoint = nearestGuidePoint(x, y, this.tileSize, this.snapDistance);
        this.drawHoverGuide(this.overlayContext, guidePoint);

         switch (this.props.paintMode)
            {
                case "line":

                    //Ignore movements unless painting
                    if (!this.painting)
                    {
                        return;
                    }

                    this.overlayContext.beginPath();
                    this.overlayContext.moveTo(this.startX, this.startY);
                    this.overlayContext.lineTo(event.offsetX, event.offsetY);
                    this.overlayContext.lineWidth = this.brushSize;

                    //Changes preview line color based on if it has a valid placement
                    if(!guidePoint)
                    {
                        this.overlayContext.strokeStyle = "red"
                    }
                    else
                    {
                        this.overlayContext.strokeStyle = this.brushColor;
                    }

                    this.overlayContext.stroke();
                    break;

                case "square":

                    //Ignore movements unless painting
                    if (!this.painting)
                    {
                        return;
                    }

                    this.overlayContext.beginPath();
                    this.overlayContext.rect(this.startX, this.startY, event.offsetX - this.startX, event.offsetY - this.startY);
                    this.overlayContext.lineWidth = this.brushSize;

                    //Changes preview line color based on if it has a valid placement
                    if(!guidePoint)
                    {
                        this.overlayContext.strokeStyle = "red"
                    }
                    else
                    {
                        this.overlayContext.strokeStyle = this.brushColor;
                    }

                    this.overlayContext.stroke();
                    break;

                case "circle":

                    //Ignore movements unless painting
                    if (!this.painting)
                    {
                        return;
                    }

                    this.overlayContext.beginPath();
                    this.overlayContext.arc(this.startX, this.startY, Math.abs(Math.hypot((event.offsetX - this.startX), (event.offsetY - this.startY))), 0, 2 * Math.PI);
                    this.overlayContext.lineWidth = this.brushSize;

                    //Changes preview line color based on if it has a valid placement
                    if(!guidePoint)
                    {
                        this.overlayContext.strokeStyle = "red"
                    }
                    else
                    {
                        this.overlayContext.strokeStyle = this.brushColor;
                    }

                    this.overlayContext.stroke();
                    break;

                case "polygon":
                    
                    //Ignore movements unless painting
                    if (!this.painting)
                    {
                        return;
                    }

                    this.overlayContext.lineWidth = this.brushSize;

                    //Changes preview line color based on if it has a valid placement
                    if(!guidePoint)
                    {
                        this.overlayContext.strokeStyle = "red"
                    }
                    else
                    {
                        this.overlayContext.strokeStyle = this.brushColor;
                    }

                    this.overlayContext.beginPath();
                    this.overlayContext.moveTo(this.paintPoints[0].x, this.paintPoints[0].y)

                    for (let i = 1; i <this.paintPoints.length; i++)
                    {
                        this.overlayContext.lineTo(this.paintPoints[i].x, this.paintPoints[i].y);
                    }

                    this.overlayContext.lineTo(event.offsetX, event.offsetY);
                    this.overlayContext.stroke();
                    break;
                
                default:
                    return;
            }
    }

    /**
     * Draws the guide dots along with the grid
     */
    drawStaticGuides() {
        
        let gridContext = this.gridContext;
        let dotContext = this.dotContext;
        gridContext.fillStyle = "#000000";

        const { width, height } = gridContext.canvas;

        const cols = Math.ceil(width / this.tileSize);
        const rows = Math.ceil(height / this.tileSize);

        //This loop draws dots for each tile and gridlines
        for (let i = 0; i <= cols; i++)
        {
            //Draws a gridline for this column
            gridContext.beginPath();
            gridContext.moveTo(i * this.tileSize, 0);
            gridContext.lineTo(i * this.tileSize, gridContext.canvas.height);
            gridContext.lineWidth = 1;
            gridContext.strokeStyle = "#7a7a7aff";
            gridContext.stroke();
            
            for (let j = 0; j <= rows; j++)
            {
                const x = i * this.tileSize;
                const y = j * this.tileSize;

                //Draws a gridline for this row once
                if (i === 0)
                {
                    gridContext.beginPath();
                    gridContext.moveTo(0, j * this.tileSize);
                    gridContext.lineTo(gridContext.canvas.width, j * this.tileSize);
                    gridContext.lineWidth = 1;
                    gridContext.strokeStyle = "#7a7a7aff";
                    gridContext.stroke();
                }

                //Corners
                this.drawDot(dotContext, x, y, this.guideRadius);

                //Line Midpoints
                if (x + this.tileSize <= width)
                {
                    this.drawDot(dotContext, x + (this.tileSize / 2), y, this.guideRadius)
                }
                if (y + this.tileSize <= height)
                {
                    this.drawDot(dotContext, x, y + (this.tileSize / 2), this.guideRadius)
                }

                //Center Point
                this.drawDot(dotContext, x + (this.tileSize / 2), y + (this.tileSize / 2), this.guideRadius)
            }
        }
    }

    /**
     * Draws a dot with given params
     */
    drawDot(context, x, y, r)
    {
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2);
        context.fill();
    }

    /**
     * Draws a larger dot over a guide dot to denote which dot is closest to the cursor
     */
    drawHoverGuide(context, dot)
    {
        //Clears the canvas of previous guide dot and preview
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        //Aborts if somehow no dot was provided
        if (!dot) return;

        context.fillStyle = "#000000ff";

        //Draws the new guide dot
        context.beginPath();
        context.arc(dot.x, dot.y, this.guideHoverRadius, 0, Math.PI * 2);
        context.fill();
    }

    /***********************************************************************
     * 
     * UI
     * 
     ***********************************************************************/
    render () {
        return ( 
            <div style={{border: "solid 5px black", width: this.props.dimensions[1] * this.tileSize, height: this.props.dimensions[0] * this.tileSize}}>
                <canvas ref={this.overlayCanvasRef} className="overlay-canvas"></canvas>
                <canvas ref={this.borderCanvasRef} className="border-canvas"></canvas>
                <canvas ref={this.dotCanvasRef} className="dot-canvas"></canvas>
                <canvas ref={this.solidCanvasRef} className="solid-canvas"></canvas>
                <canvas ref={this.gridCanvasRef} className="grid-canvas"></canvas>
                <canvas ref={this.bgCanvasRef} className="bg-canvas"></canvas>
            </div>
        );
    }
}
 
export default MapEditor;