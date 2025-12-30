import { useEffect, useState } from "react";
import "../styles/TileMap.css";
import Tile from "./Tile";

const TileMap = ({dimensions}) => {
    
    const [tiles, setTiles] = useState([]);

    const populateTiles = (dimensions) => {

        var tempTiles = [];

        for (let i = 0; i < dimensions[0]; i++)
        {
            for (let j = 0; j < dimensions[1]; j++)
            {
                tempTiles.push({"x": i, "y": j})
            }
        }

        setTiles(tempTiles);
    }

    const test = () => {
        console.log(tiles)
    }

    useEffect(() => {
        populateTiles(dimensions)
    }, [])

    return ( 
        <div>
            {tiles.length > 0 && <div className="tilemap" style={{width: dimensions[1] * 72, height: dimensions[0] * 72, gridTemplateColumns: "repeat("+dimensions[1]+", 1fr)"}}>
                    {tiles.map((tile) => (
                        <Tile data={tile}></Tile>
                    ))}
                </div>
            }
            <button onClick={test}>test button</button>
        </div>
     );
}
 
export default TileMap;