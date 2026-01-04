import React from "react";
import "../styles/MapEditor.css"
import TileMap from "./TileMap";

//Set up as class in order to access React.createRef
class MapEditor extends React.Component {

    //TODO: Make this dynamic based on user input
    state = {
        dimensions: [10,10]
    }

    
    //Sets up canvas references and initial brush settings
    constructor(props) {
        super(props);
        this.bgCanvasRef = React.createRef();
        this.guideCanvasRef = React.createRef();
        this.overlayCanvasRef = React.createRef();

        this.brushColor = '#000000';
        this.brushSize = 3;

        this.painting = false;
        this.paintMode = "line";

        this.startX = 0;
        this.startY = 0;

        this.tileSize = 72;
        this.guideRadius = 2;
        this.guideHoverRadius = 6;
        this.snapDistance = 12;

        //Methods must be bound to "this" in order to access "this'" properties
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.drawStaticGuides = this.drawStaticGuides.bind(this);
        this.nearestGuidePoint = this.nearestGuidePoint.bind(this);
        this.drawHoverGuide = this.drawHoverGuide.bind(this);
    }

    /**
     * Sets up listeners for the overlay and background canvases
     */
    componentDidMount() {

        //Canvas Contexts
        this.bgContext = this.bgCanvasRef.current.getContext('2d');
        this.guideContext = this.guideCanvasRef.current.getContext('2d');
        this.overlayContext = this.overlayCanvasRef.current.getContext('2d');

        //Canvas sizing dynamic to grid size, done here to prevent scaling issues
        this.bgCanvasRef.current.width = this.state.dimensions[1] * 72;
        this.bgCanvasRef.current.height = this.state.dimensions[0] * 72;

        this.guideCanvasRef.current.width = this.state.dimensions[1] * 72;
        this.guideCanvasRef.current.height = this.state.dimensions[0] * 72;

        this.overlayCanvasRef.current.width = this.state.dimensions[1] * 72;
        this.overlayCanvasRef.current.height = this.state.dimensions[0] * 72;

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

            switch (this.paintMode)
            {
                case "line":
                    //First click of stroke
                    if (!this.painting)
                    {
                        this.painting = true;
                        this.startX = event.offsetX;
                        this.startY = event.offsetY;
                    }

                    //Terminate stroke
                    else
                    {
                        this.bgContext.beginPath();
                        this.bgContext.moveTo(this.startX, this.startY);
                        this.bgContext.lineTo(event.offsetX, event.offsetY);
                        this.bgContext.lineWidth = this.brushSize;
                        this.bgContext.stroke();

                        this.painting = false;
                        this.overlayContext.clearRect(0, 0, this.overlayCanvasRef.current.width, this.overlayCanvasRef.current.width)
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

        const guide = this.nearestGuidePoint(x, y);
        this.drawHoverGuide(this.overlayContext, guide);

         switch (this.paintMode)
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
                    this.overlayContext.stroke();
                    break;
                
                default:
                    return;
            }
    }

    /**
     * Draws the guide dots along with TODO: the grid
     */
    drawStaticGuides() {
        
        let context = this.guideContext;
        context.fillStyle = "#000000";

        const { width, height } = context.canvas;

        const cols = Math.ceil(width / this.tileSize);
        const rows = Math.ceil(height / this.tileSize);

        //This loop draws dots for each tile
        for (let i = 0; i <= cols; i++)
        {
            for (let j = 0; j <= rows; j++)
            {
                const x = i * this.tileSize;
                const y = j * this.tileSize;

                //Corners
                this.drawDot(context, x, y, this.guideRadius);

                //Midpoints
                if (x + this.tileSize <= width)
                {
                    this.drawDot(context, x + (this.tileSize / 2), y, this.guideRadius)
                }
                if (y + this.tileSize <= height)
                {
                    this.drawDot(context, x, y + (this.tileSize / 2), this.guideRadius)
                }
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
     * Calculates the nearest guide dot to the cursor.
     */
    nearestGuidePoint(x, y)
    {
        //Locates nearest grid intersection, only points a half tile within it and itself are possible fits.
        const gx = Math.round(x / this.tileSize) * this.tileSize;
        const gy = Math.round(y / this.tileSize) * this.tileSize;

        const candidates = [
            //Intersection
            { x: gx, y: gy},

            //Horizontal midpoints
            { x: gx + (this.tileSize / 2), y: gy},
            { x: gx - (this.tileSize / 2), y: gy},

            //Vertical midpoints
            { x: gx, y: gy + (this.tileSize / 2)},
            { x: gx, y: gy - (this.tileSize / 2)}
        ];

        let closest = null;
        let smallestDist = Infinity;

        //Loops through possible candidates to find the closest.
        for (const point of candidates)
        {
            const dx = point.x - x;
            const dy = point.y - y;

            //Gets distance from current candidate
            const dist = Math.hypot(dx, dy);

            //Updates tracking values
            if (dist < smallestDist)
            {
                smallestDist = dist;
                closest = point;
            }
        }

        //Returns the closest point if the cursor is within snapping range
        return smallestDist <= this.snapDistance ? closest : null;
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
            <div style={{border: "solid 5px black", width: this.state.dimensions[1] * 72, height: this.state.dimensions[0] * 72}}>
                <canvas ref={this.overlayCanvasRef} className="overlay-canvas"></canvas>
                <canvas ref={this.guideCanvasRef} className="guide-canvas"></canvas>
                <canvas ref={this.bgCanvasRef} className="bg-canvas"></canvas>
            </div>
        );
    }
}
 
export default MapEditor;