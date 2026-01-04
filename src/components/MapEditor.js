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
        this.overlayCanvasRef = React.createRef();

        this.brushColor = '#000000';
        this.brushSize = 3;

        this.painting = false;
        this.paintMode = "line";

        this.startX = 0;
        this.startY = 0;

        //Methods must be bound to "this" in order to access "this'" properties
        this.onMouseDown = this.onMouseDown.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)
        this.onMouseMove = this.onMouseMove.bind(this)
    }

    /**
     * Sets up listeners for the overlay and background canvases
     */
    componentDidMount() {

        //Canvas Contexts
        this.bgContext = this.bgCanvasRef.current.getContext('2d');
        this.overlayContext = this.overlayCanvasRef.current.getContext('2d');

        //Canvas sizing dynamic to grid size, done here to prevent scaling issues
        this.bgCanvasRef.current.width = this.state.dimensions[1] * 72;
        this.bgCanvasRef.current.height = this.state.dimensions[0] * 72;

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

         switch (this.paintMode)
            {
                case "line":

                    //Ignore movements unless painting
                    if (!this.painting)
                    {
                        return;
                    }

                    //Clears the entire overlay and renders a preview line everytime the mouse moves
                    this.overlayContext.clearRect(0, 0, this.overlayCanvasRef.current.width, this.overlayCanvasRef.current.height);

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

    /***********************************************************************
     * 
     * UI
     * 
     ***********************************************************************/
    render () {
        return ( 
            <div style={{border: "solid 5px black", width: this.state.dimensions[1] * 72, height: this.state.dimensions[0] * 72}}>
                <canvas ref={this.overlayCanvasRef} className="overlay-canvas"></canvas>
                <canvas ref={this.bgCanvasRef} className="bg-canvas"></canvas>
                <TileMap dimensions={this.state.dimensions}></TileMap>
            </div>
        );
    }
}
 
export default MapEditor;