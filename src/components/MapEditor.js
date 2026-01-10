import React from "react";
import "../styles/MapEditor.css"
import TileMap from "./TileMap";

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
        this.nearestGuidePoint = this.nearestGuidePoint.bind(this);
        this.drawHoverGuide = this.drawHoverGuide.bind(this);
        this.clearCircle = this.clearCircle.bind(this);
        this.applyCircleBrush = this.applyCircleBrush.bind(this);
        this.captureAlpha = this.captureAlpha.bind(this);
        this.findNewEdges = this.findNewEdges.bind(this);
        this.drawEdgeDots = this.drawEdgeDots.bind(this);
        this.clearRectangle = this.clearRectangle.bind(this);
        this.applySquareBrush = this.applySquareBrush.bind(this);
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
            let guidePoint = this.nearestGuidePoint(event.offsetX, event.offsetY)

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
                            this.applySquareBrush(this.solidContext, this.borderContext, this.startX, this.startY, guidePoint.x, guidePoint.y)
                            
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

                            this.applyCircleBrush(this.solidContext, this.borderContext, this.startX, this.startY, Math.abs(Math.hypot((guidePoint.x - this.startX), (guidePoint.y - this.startY))))

                            this.painting = false;
                            this.overlayContext.clearRect(0, 0, this.overlayCanvasRef.current.width, this.overlayCanvasRef.current.width)
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

        const guidePoint = this.nearestGuidePoint(x, y);
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
            { x: gx, y: gy - (this.tileSize / 2)},

            //Tile midpoints
            {x: gx + (this.tileSize / 2), y: gy + (this.tileSize / 2)},
            {x: gx - (this.tileSize / 2), y: gy + (this.tileSize / 2)},
            {x: gx + (this.tileSize / 2), y: gy - (this.tileSize / 2)},
            {x: gx - (this.tileSize / 2), y: gy - (this.tileSize / 2)},
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

    applySquareBrush(solidContext, borderContext, startX, startY, endX, endY)
    {

        //Normalizing input to accout for flipped rectangles
        const rectX = Math.min(startX, endX);
        const rectY = Math.min(startY, endY);
        const rectWidth = Math.abs(endX - startX);
        const rectHeight = Math.abs(endY - startY);

        //Set up bounding box
        const pad = 2;

        const boxX = Math.floor(rectX - pad);
        const boxY = Math.floor(rectY - pad);
        const boxWidth = Math.ceil((rectWidth + pad) * 2);
        const boxHeight = Math.ceil((rectHeight + pad) * 2);

        //Grabs the image data of the area before fulfilling the stroke
        const beforeAlpha = this.captureAlpha(solidContext, boxX, boxY, boxWidth, boxHeight)
        
        this.clearRectangle(solidContext, borderContext, rectX, rectY, rectWidth, rectHeight);

        //Grabs the image data of the area after fulfilling the stroke
        const afterAlpha = this.captureAlpha(solidContext, boxX, boxY, boxWidth, boxHeight);

        //Calculates the new borders
        const edges = this.findNewEdges(beforeAlpha, afterAlpha, boxWidth, boxHeight);

        //Draws new borders
        this.drawEdgeDots(borderContext, edges, boxX, boxY);
    }

    clearRectangle(solidContext, borderContext, startX, startY, width, height)
    {
        solidContext.save()
        borderContext.save()

        //This line means that now wherever we draw, it will remove whatever was already there
        solidContext.globalCompositeOperation = "destination-out";
        borderContext.globalCompositeOperation = "destination-out";

        //Clears engulfed borders
        borderContext.fillRect(startX, startY, width, height);

        //Clears the rectangle from the solid canvas by filling it with transparency
        solidContext.fillRect(startX, startY, width, height);

        solidContext.restore();
        borderContext.restore();
    }

    /**
     * Carves a circle out of a canvas and erases engulfed borders
     */
    clearCircle(solidContext, borderContext, x, y, r)
    {
        solidContext.save()
        borderContext.save()

        //This line means that now wherever we draw, it will remove whatever was already there
        solidContext.globalCompositeOperation = "destination-out";
        borderContext.globalCompositeOperation = "destination-out";

        //Clears engulfed borders
        borderContext.beginPath();
        borderContext.arc(x, y, r, 0, Math.PI * 2);
        borderContext.fill();

        //Clears the circle from the solid canvas by filling it with transparency
        solidContext.beginPath();
        solidContext.arc(x, y, r, 0, Math.PI * 2);
        solidContext.fill();

        solidContext.restore();
        borderContext.restore();
    }

    /**
     * Snags the image data of an area
     */
    captureAlpha(context, x, y, w, h)
    {
        const img = context.getImageData(x, y, w, h);
        return img.data;
    }

    /**
     * Determines which pixels became empty after a brush stroke, and which are touching parts of the solid canvas' rectangle that still exist.
     * 
     * Before and after are image data, Uint8ClampedArrays to be precise, they are formatted as:
     * an array of pixels where each pixel occuppies four array slots
     * [..., Red, Green, Blue, Alpha, Red, Green, Blue, Alpha, ...]
     * So data[0] = First pixel red, etc.
     */
    findNewEdges(before, after, w, h)
    {
        let edges = [];

        //This loop is set up to ignore edge pixels, because it would run out of bounds.
        //This is fine because there is padding that prevents any relevant pixels from being skipped.
        for (let y = 1; y < h - 1; y++) 
        {
            for (let x = 1; x < w - 1; x++) 
            {
                //I equals the pixel index (y * w + x) times the RGBA step (4) + 3 to get to the alpha value
                const i = (y * w + x) * 4 + 3;

                //Compares if alpha was solid before and clear now
                const wasSolid = before[i] !== 0;
                const isClear  = after[i] === 0;

                //Early break for efficiency if either is false, no need to check further.
                if (!wasSolid || !isClear) continue;

                const neighbors = [
                    i - 4,
                    i + 4,
                    i - w * 4,
                    i + w * 4
                ];

                //Checks if at least one neighbor pixel is still solid, is so this pixel needs a border drawn on it.
                if (neighbors.some(n => after[n] !== 0)) {
                    edges.push({ x, y });
                }
            }
        }

        return edges;
    }

    /**
     * Goes through an array of edges and draws a dot on each one.
     */
    drawEdgeDots(context, edges, x, y)
    {
        context.save();
        context.fillStyle = "#000000";

        for (const point of edges)
        {
            context.fillRect(x + point.x, y + point.y, this.brushSize, this.brushSize);
        }

        context.restore();
    }

    /**
     * Calls all the helpers used to carry out a user confirming their circle stroke
     */
    applyCircleBrush(solidContext, borderContext, x, y, r)
    {
        //Makes a bounding box to limit the area checked for transparency changes to the circle area plus a little padding
        const pad = 2;
        const boxSize = Math.ceil(r * 2) + pad * 2;
        const boxX = Math.floor(x - r - pad);
        const boxY = Math.floor(y - r - pad);

        //Grabs the image data of the area before fulfilling the stroke
        const beforeAlpha = this.captureAlpha(solidContext, boxX, boxY, boxSize, boxSize)
        
        this.clearCircle(solidContext, borderContext, x, y, r);

        //Grabs the image data of the area after fulfilling the stroke
        const afterAlpha = this.captureAlpha(solidContext, boxX, boxY, boxSize, boxSize);

        //Calculates the new borders
        const edges = this.findNewEdges(beforeAlpha, afterAlpha, boxSize, boxSize);

        //Draws new borders
        this.drawEdgeDots(borderContext, edges, boxX, boxY);
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