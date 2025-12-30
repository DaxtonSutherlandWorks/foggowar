import "../styles/Tile.css"

const Tile = ({data}) => {

    return ( 
        <div className="tile">
            <p>{data["x"]},{data["y"]}</p>
        </div>
     );
}
 
export default Tile;