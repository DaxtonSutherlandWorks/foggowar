    
/** *************************************************************************
 * 
 * General Utils
 * 
 * **************************************************************************/

/**
 * Creates a bounding box for a given shape object
 */
export const createBoundingBox = (shape) =>
{
    let box = {};
    let padding = 2;

    switch (shape.type)
    {
        case "rectangle":

            box =
            {
                x: Math.floor(Math.max(shape.x - padding, 0)), //accounts for deci and negatives
                y: Math.floor(Math.max(shape.y - padding, 0)),
                width: Math.ceil(shape.width + (padding * 2)),
                height: Math.ceil(shape.height + (padding * 2)),
                padding
            }
            break;

        case "circle":
            
            box =
            {
                x: Math.floor(Math.max(shape.x - shape.r - padding, 0)),
                y: Math.floor(Math.max(shape.y - shape.r - padding, 0)),
                width: Math.ceil((shape.r + padding) * 2),
                height: Math.ceil((shape.r + padding) * 2),
                padding
            }
            break;

        case "polygon":

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const p of shape.points) 
        {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
            
            box = 
            {
                x: minX - padding,
                y: minY - padding,
                width: (maxX - minX) + padding * 2,
                height: (maxY - minY) + padding * 2,
                padding
            }
            break;


        default:
            console.log("OOPS")
            break;
    }

    return box;

}

/**
 * Goes through an array of edges and draws a dot on each one.
 */
export const drawEdgeDots = (context, edges, brushSize) => 
{
    context.save();
    context.fillStyle = "#000000";

    for (const point of edges)
    {
        context.fillRect(point.x, point.y, brushSize, brushSize);
    }

    context.restore();
}

/**
 * Finds the closest line to a given point within a defined tolerance distance.
 */
export const findLineAtGuidePoint = (px, py, linesRef, tolerance) =>
{
    const lines = linesRef;

    let closest = null;
    let bestDist = Infinity;

    //Checks each drawn line to find the closest
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];

        const dist = pointToSegmentDistance(
            px,
            py,
            line.x1,
            line.y1,
            line.x2,
            line.y2
        );

        if (dist <= tolerance && dist < bestDist) {
            closest = line;
            bestDist = dist;
        }
    }

    return closest;
}

/**
 * Checks if a square of a given width and heigh is clear, with the guide point given being the top left.
 */
export const isSquareCleared = (context, guideX, guideY, squareWidth, squareHeight) =>
{
    //Checks that the area does not extend past the canvas
    if (guideX < 0 || guideY < 0 || guideX + squareWidth > context.canvas.width || guideY + squareHeight > context.canvas.height)
    {
        return false;
    }

    const img = context.getImageData(guideX, guideY, squareWidth, squareHeight).data;

    //Loops through the returned array, checking the alpha value of each pixel.
    for (let i = 3; i < img.length; i += 4) 
    {
        if (img[i] !== 0) 
        {
            return false;
        }
    }

    return true;
    
}

/**
 * Calculates the nearest guide dot to the cursor.
 */
export const nearestGuidePoint = (x, y, tileSize, snapDistance) =>
{
    //Locates nearest grid intersection, only points a half tile within it and itself are possible fits.
    const gx = Math.round(x / tileSize) * tileSize;
    const gy = Math.round(y / tileSize) * tileSize;

    const candidates = [
        //Intersection
        { x: gx, y: gy},

        //Horizontal midpoints
        { x: gx + (tileSize / 2), y: gy},
        { x: gx - (tileSize / 2), y: gy},

        //Vertical midpoints
        { x: gx, y: gy + (tileSize / 2)},
        { x: gx, y: gy - (tileSize / 2)},

        //Tile midpoints
        {x: gx + (tileSize / 2), y: gy + (tileSize / 2)},
        {x: gx - (tileSize / 2), y: gy + (tileSize / 2)},
        {x: gx + (tileSize / 2), y: gy - (tileSize / 2)},
        {x: gx - (tileSize / 2), y: gy - (tileSize / 2)},
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
    return smallestDist <= snapDistance ? closest : null;
}

/**
 * Calculates distance from a given point to a line segment
 */
export const pointToSegmentDistance = (px, py, x1, y1, x2, y2) =>
{
    //Calculates distance vectors
    const dx = x2 - x1;
    const dy = y2 - y1;

    //Checks if line is just a point to avoid dividing by zero later.
    if (dx === 0 && dy === 0)
    {
        return Math.hypot(px -x1, py - y1);
    }

    //This calculates the position along the line by calculating the vectors
    //from the start to the click, then normalizing by line length, then clamps to the nearest segment endpoint if needed.
    const t = Math.max(
        0,
        Math.min(
                    1,
                    ((px - x1) * dx + (py - y1) * dy) /
                    (dx * dx + dy * dy)
                )
    );

    //Computes nearest point on this segment
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;

    //Returns the distance of the click to the nearest point on the line.
    return Math.hypot(px - cx, py - cy);
}

/**
 * Scans the solid canvas image and returns all border edge pixels.
 * Border pixels are solid pixels that touch at least one clear neighbor.
 */
export const recomputeBorders = (editorContextRef, image, box) => 
{
    //Clears old borders
    editorContextRef.borderContextRef.current.clearRect(box.x, box.y, box.width, box.height);

    const { data, width: w, height: h } = image;
    const edges = [];

    // Ignore outermost pixels to avoid bounds checks
    for (let y = 1; y < h - 1; y++)
    {
        for (let x = 1; x < w - 1; x++)
        {
            // Alpha index for this pixel
            const i = (y * w + x) * 4 + 3;

            // Skip clear pixels — no need to check since borders are on solid pixels
            if (data[i] === 0) continue;

            // Alpha indices of 4-connected neighbors
            const neighbors = [
                i - 4,         // left
                i + 4,         // right
                i - w * 4,     // up
                i + w * 4      // down
            ];

            // If any neighbor is clear, this pixel is a border
            const touchesClear = neighbors.some(n => data[n] === 0);

            if (touchesClear)
            {
                edges.push({ x: (x + box.x - box.padding), y: (y + box.y - box.padding) });
            }
        }
    }

    return edges;
}

/** *************************************************************************
 * 
 * Clearing Utils
 * 
 * **************************************************************************/

/**
 * Clears or fills a circle from the solid canvas
 */
export const clearCircle = (solidContext, shape) =>
{
    solidContext.save();

    if (shape.operation === "subtract")
    {
        solidContext.fillStyle = "#fdf8f0ff";
    }
    else
    {
        //This line means that now wherever we draw, it will remove whatever was already there
        solidContext.globalCompositeOperation = "destination-out";
    }

    //Clears the circle from the solid canvas by filling it with transparency
    solidContext.beginPath();
    solidContext.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
    solidContext.fill();

    solidContext.restore();

}

/**
 * Clears or fills a polygon from the solid canvas
 */
export const clearPolygon = (solidContext, shape) =>
{
    solidContext.save();

    if (shape.operation === "subtract")
    {
        solidContext.fillStyle = "#fdf8f0ff";
    }
    else
    {
        //This line means that now wherever we draw, it will remove whatever was already there
        solidContext.globalCompositeOperation = "destination-out";
    }

    const paintPoints = shape.points;

    //Clears the polygon from the solid canvas by filling it with transparency
    solidContext.beginPath();
    solidContext.moveTo(paintPoints[0].x, paintPoints[0].y)

    for (let i = 1; i < paintPoints.length; i++)
    {
        solidContext.lineTo(paintPoints[i].x, paintPoints[i].y);
    }

    solidContext.closePath();
    solidContext.fill();

    solidContext.restore();
}

/**
 * Clears or fills a rectangle from the solid canvas
 */
export const clearRectangle = (solidContext, shape) =>
{
    solidContext.save();

    if (shape.operation === "subtract")
    {
        solidContext.fillStyle = "#fdf8f0ff";
    }
    else
    {
        //This line means that now wherever we draw, it will remove whatever was already there
        solidContext.globalCompositeOperation = "destination-out";
    }

    //Clears the rectangle from the solid canvas by filling it with transparency
    solidContext.fillRect(shape.x, shape.y, shape.width, shape.height);

    solidContext.restore();
}

/** *************************************************************************
 * 
 * Canvas Updaters
 * 
 * **************************************************************************/

/**
 * Updates the line canvas, drawing the newest line or all lines if needed.
 */
export const updateLines = (editorContextRef, fullRedraw) =>
{
    const canvasLines = editorContextRef.mapStateRef.current.lines;
    const lineContext = editorContextRef.lineContextRef.current;

    lineContext.save();

    if (!fullRedraw)
    {
        //Gets newest line
        const line = canvasLines[canvasLines.length - 1]

        drawLines([line], lineContext);
    }

    else
    {
        rebuildLineCanvas(editorContextRef);
    } 

    lineContext.restore();
}

/**
 * Updates the stamp canvas, drawing the newest stamp or all stamps if needed.
 */
export const updateStamps = (editorContext, fullRedraw) =>
{
    const canvasStamps = editorContext.mapStateRef.current.stamps;
    const stampContext = editorContext.stampContextRef.current;

    if (!fullRedraw)
    {
        //Gets newest stamp
        const stamp = canvasStamps[canvasStamps.length - 1]

        drawStamps([stamp], stampContext);
        
    }

    else
    {
        rebuildStampCanvas(editorContext);
    } 
}

/**
 * Rerenders the solid canvas from scratch by iterating through the list of shapes.
 */
export const rebuildSolidCanvas = (editorContext) =>
{

    const solidContext = editorContext.solidContextRef.current;
    const borderContext = editorContext.borderContextRef.current;
    const shapes = editorContext.mapStateRef.current.shapes;
    const canvasWidth = editorContext.solidCanvasRef.current.width;
    const canvasHeight = editorContext.solidCanvasRef.current.height;

    solidContext.clearRect(0, 0, canvasWidth, canvasHeight);

    solidContext.fillStyle = "#fdf8f0ff";
    solidContext.fillRect(0, 0, canvasWidth, canvasHeight);

    for (const shape of shapes)
    {
        drawShape(editorContext, shape);
    }

    const imageData = solidContext.getImageData(0, 0, canvasWidth, canvasHeight);

    const canvasBox = {x: 0, y: 0, width: canvasWidth, height: canvasHeight, padding: 0};

    const edges = recomputeBorders(editorContext, imageData, canvasBox);

    drawEdgeDots(borderContext, edges, 3);

}

/**
 * Draws borders for just one shape
 */
export const drawShapeBorders = (editorContext, shape) =>
{
    const box = createBoundingBox(shape);

    const imageData = editorContext.solidContext.current.getImageData(box.x, box.y, box.width, box.height);

    const edges = recomputeBorders(editorContext, imageData, box);

    drawEdgeDots(editorContext.borderContext.current, edges, 3);
}

/**
 * Rebuilds a portion of the canvas affected by the given shape
 */
export const rebuildShapeArea = (editorContext, shape) =>
{
    const solidContext = editorContext.solidContextRef.current;
    const borderContext = editorContext.borderContextRef.current;
    const box = createBoundingBox(shape);

    drawShape(editorContext, shape);

    const imageData = solidContext.getImageData(box.x, box.y, box.width, box.height);

    const edges = recomputeBorders(editorContext, imageData, box);

    drawEdgeDots(borderContext, edges, 3);
}

/**
 * Draws a shape
 */
export const drawShape = (editorContext, shape) =>
{
    const solidContext = editorContext.solidContextRef.current;

    switch (shape.type)
    {
        case "rectangle":
            clearRectangle(solidContext, shape);
            break;

        case "circle":
            clearCircle(solidContext, shape);
            break;

        case "polygon":
            clearPolygon(solidContext, shape);
            break;

        default:
            break;
    }
}

/**
 * Clears and rebuilds the line canvas
 */
export const rebuildLineCanvas = (editorContext) =>
{
    const lineContext = editorContext.lineContextRef.current;
    const lines = editorContext.mapStateRef.current.lines;
    const canvasWidth = editorContext.solidCanvasRef.current.width;
    const canvasHeight = editorContext.solidCanvasRef.current.height;

    lineContext.clearRect(0, 0, canvasWidth, canvasHeight);

    drawLines(lines, lineContext);
}

/**
 * Draws all the lines of a given list
 */
export const drawLines = (lines, lineContext) =>
{
    lineContext.save()

    lineContext.strokeStyle = "black";
    lineContext.lineWidth = 3;

    for (const line of lines)
    {
        lineContext.beginPath();
        lineContext.moveTo(line.x1, line.y1);
        lineContext.lineTo(line.x2, line.y2);
        lineContext.stroke();
    }

    lineContext.restore();
}

/**
 * Clears and rebuilds the stamp canvas
 */
export const rebuildStampCanvas = (editorContext) =>
{
    const stampContext = editorContext.stampContextRef.current;
    const stamps = editorContext.mapStateRef.current.stamps;
    const canvasWidth = editorContext.solidCanvasRef.current.width;
    const canvasHeight = editorContext.solidCanvasRef.current.height;

    stampContext.clearRect(0, 0, canvasWidth, canvasHeight);

    drawStamps(stamps, stampContext);
}

/**
 * Draws all the stamps in a given list
 */
export const drawStamps = (stamps, stampContext) =>
{
    for (const stamp of stamps)
    {
        const stampImage = createStampImg(stamp.imagePath);
        stampContext.drawImage(stampImage, stamp.x, stamp.y, stamp.width, stamp.height);
    }
}

/**
 * Loads a stamp path into an image that can be drawn on a canvas
 */
export const createStampImg = (path) =>
{
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.src = path;

    return img;
};