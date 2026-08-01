/**
 * Draws all the initial visual guides in the editor. This includes:
 * -Background color
 * -Solid mask
 * -Grid
 * -Guide dots
 */
export function drawInitialVisuals (editorContextRef) {

    const solidContextRef = editorContextRef.current.solidContextRef;
    const gridContextRef = editorContextRef.current.gridContextRef;

    const solidCanvasRef = editorContextRef.current.solidCanvasRef;
    const gridCanvasRef = editorContextRef.current.gridCanvasRef;

    //Sets up the solid canvas
    solidContextRef.current.fillStyle = "#fdf8f0ff"
    solidContextRef.current.fillRect(0, 0, solidCanvasRef.current.width, solidCanvasRef.current.height);

    //Sets up the grid canvas
    gridContextRef.current.fillStyle = "#ffebcd";
    gridContextRef.current.fillRect(0, 0, gridCanvasRef.current.width, gridCanvasRef.current.height);
    
    //Draws the dots and grid
    drawStaticGuides(editorContextRef);
}


/**
 * Draws the guide dots along with the grid
 */
export function drawStaticGuides (editorContextRef) {

    const gridContextRef = editorContextRef.current.gridContextRef;
    const dotContextRef = editorContextRef.current.dotContextRef;

    const tileSize = editorContextRef.current.mapStateRef.current.metadata.tileSize;

    const guideRadiusRef = editorContextRef.current.guideRadiusRef;

    gridContextRef.current.fillStyle = "#000000";

    const { width, height } = gridContextRef.current.canvas;

    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);

    //This loop draws dots for each tile and gridlines
    for (let i = 0; i <= cols; i++)
    {
        //Draws a gridline for this column
        gridContextRef.current.beginPath();
        gridContextRef.current.moveTo(i * tileSize, 0);
        gridContextRef.current.lineTo(i * tileSize, gridContextRef.current.canvas.height);
        gridContextRef.current.lineWidth = 1;
        gridContextRef.current.strokeStyle = "#7a7a7aff";
        gridContextRef.current.stroke();
        
        for (let j = 0; j <= rows; j++)
        {
            const x = i * tileSize;
            const y = j * tileSize;

            //Draws a gridline for this row once
            if (i === 0)
            {
                gridContextRef.current.beginPath();
                gridContextRef.current.moveTo(0, j * tileSize);
                gridContextRef.current.lineTo(gridContextRef.current.canvas.width, j * tileSize);
                gridContextRef.current.lineWidth = 1;
                gridContextRef.current.strokeStyle = "#7a7a7aff";
                gridContextRef.current.stroke();
            }

            //Corners
            drawDot(dotContextRef, x, y, guideRadiusRef.current);

            //Line Midpoints
            if (x + tileSize <= width)
            {
                drawDot(dotContextRef, x + (tileSize / 2), y, guideRadiusRef.current)
            }
            if (y + tileSize <= height)
            {
                drawDot(dotContextRef, x, y + (tileSize / 2), guideRadiusRef.current)
            }

            //Center Point
            drawDot(dotContextRef, x + (tileSize / 2), y + (tileSize / 2), guideRadiusRef.current)
        }
    }
}

/**
 * Draws a dot with given params
 */
export function drawDot(context, x, y, r)
{
    context.current.fillStyle = "black"
    context.current.beginPath();
    context.current.arc(x, y, r, 0, Math.PI * 2);
    context.current.fill();
}

/**
 * Draws a larger dot over a guide dot to denote which dot is closest to the cursor
 */
export function drawHoverGuide(context, dot, deleteMode, guideHoverRadiusRef)
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
    context.current.arc(dot.x, dot.y, guideHoverRadiusRef.current, 0, Math.PI * 2);
    context.current.fill();
}