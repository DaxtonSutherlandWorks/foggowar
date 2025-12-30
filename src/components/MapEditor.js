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
    }

    componentDidMount() {
       this.context = this.canvasRef.current.getContext('2d');
    }

    render () {
        return ( 
            <div style={{border: "solid 5px black"}}>
                <canvas ref={this.canvasRef} className="map-canvas" style={{width: this.state.dimensions[1] * 72, height: this.state.dimensions[0] * 72}}></canvas>
                <TileMap dimensions={this.state.dimensions}></TileMap>
            </div>
        );
    }
}
 
export default MapEditor;