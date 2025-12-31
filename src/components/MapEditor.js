import React from "react";
import "../styles/MapEditor.css"
import TileMap from "./TileMap";

class MapEditor extends React.Component {

    state = {
        dimensions: [10,10]
    }

    constructor(props) {
        super(props);
        this.canvasRef = React.createRef();

        this.brushColor = '#000000';
        this.brushSize = 2;
        this.painting = false;
    }

    componentDidMount() {
       this.context = this.canvasRef.current.getContext('2d');

       this.canvasRef.current.width = this.state.dimensions[1] * 72;
       this.canvasRef.current.height = this.state.dimensions[0] * 72;

       this.canvasRef.current.addEventListener('mousedown', (event) => {
            this.painting = true;
            this.context.beginPath();
            this.context.moveTo(event.layerX, event.layerY);
        })

        this.canvasRef.current.addEventListener('mouseup', () => {
            this.painting = false;
        })

        this.canvasRef.current.addEventListener('mousemove', (event) => {
            if (this.painting) {
                this.context.lineTo(event.layerX, event.layerY);
                this.context.strokeStyle = this.brushColor;
                this.context.lineWidth = this.brushSize;
                this.context.stroke();
            }
        })
    }

    render () {
        return ( 
            <div style={{border: "solid 5px black", width: this.state.dimensions[1] * 72, height: this.state.dimensions[0] * 72}}>
                <canvas ref={this.canvasRef} className="map-canvas"></canvas>
                <TileMap dimensions={this.state.dimensions}></TileMap>
            </div>
        );
    }
}
 
export default MapEditor;