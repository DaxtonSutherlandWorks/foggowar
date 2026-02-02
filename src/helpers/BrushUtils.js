    
    /** *************************************************************************
     * 
     * General Utils
     * 
     * **************************************************************************/
      
    /**
     * Snags the image data of an area
     */
    export const captureAlpha = (context, x, y, w, h) =>
    {
        const img = context.getImageData(x, y, w, h);
        return img.data;
    } 

    /**
     * Creates a bounding box for a given shape object
     */
    export const createBoundingBox = (shape, mode) =>
    {
        let box = {};

        switch (mode)
        {
            // shape = {x1, y1, x2, y2}
            case "square":

                const { x1, y1, x2, y2 } = shape;
                const rect = normalizeRectangleCoords(x1, x2, y1, y2);

                //Set up bounding box
                const pad = 3;

                const boxX = Math.floor(rect.x - pad);
                const boxY = Math.floor(rect.y - pad);
                const boxWidth = Math.ceil((rect.w + pad) * 2);
                const boxHeight = Math.ceil((rect.h + pad) * 2);

                box =  {x: boxX, y: boxY, w: boxWidth, h: boxHeight};
                break;

            case "circle":
                console.log("circle");
                break;

            case "polygon":
                console.log("polygon");
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
     * Determines which pixels became empty after a brush stroke, and which are touching parts of the solid canvas' rectangle that still exist.
     * 
     * Before and after are image data, Uint8ClampedArrays to be precise, they are formatted as:
     * an array of pixels where each pixel occuppies four array slots
     * [..., Red, Green, Blue, Alpha, Red, Green, Blue, Alpha, ...]
     * So data[0] = First pixel red, etc.
     */
    export const findNewEdges = (before, after, w, h) =>
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

                //Makes a binary state based off of alpha
                const beforeState = before[i] !== 0;
                const afterState  = after[i] !== 0;

                //Early break for efficiency if no change, no need to check further.
                if (afterState === beforeState) continue;

                // Neighbor alpha indices (left, right, up, down)
                const neighbors = [
                    i - 4,
                    i + 4,
                    i - w * 4,
                    i + w * 4
                ];

                // If any neighbor has a different state than this pixel *after* the change,
            // then this pixel lies on a solid/clear boundary and needs an edge.
                if (neighbors.some(n => (after[n] !== 0) !== afterState)) {
                    edges.push({ x, y });
                }
            }
        }

        return edges;
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
     * Normalizes rectangle coordinates to account for inverted rectangles
     */
    export const normalizeRectangleCoords = (x1, y1, x2, y2) => 
    {
        const rectX = Math.min(x1, x2);
        const rectY = Math.min(y1, y2);
        const rectWidth = Math.abs(x2 - x1);
        const rectHeight = Math.abs(y2 - y1);

        return {x: rectX, y: rectY, w: rectWidth, h: rectHeight};
    }

    /**
     * Scans the solid canvas image and returns all border edge pixels.
     * Border pixels are solid pixels that touch at least one clear neighbor.
     */
    export const recomputeBorders = (editorContext, image) => 
    {
        //Clears existing borders
        editorContext.borderContext.current.clearRect(0, 0, editorContext.borderCanvasRef.current.width, editorContext.borderCanvasRef.current.width);

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
                    edges.push({ x, y });
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
     * Clears or fills a circle from the solid canvas and all engulfed borders from the border canvas
     */
    export const clearCircle = (solidContext, borderContext, x, y, r, deletion) =>
    {
        solidContext.save()
        borderContext.save()

        if (deletion)
        {
            solidContext.fillStyle = "#fdf8f0ff";
            borderContext.fillStyle = "#fdf8f0ff";
        }
        else
        {
            //This line means that now wherever we draw, it will remove whatever was already there
            solidContext.globalCompositeOperation = "destination-out";
            borderContext.globalCompositeOperation = "destination-out";
        }

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
     * Clears or fills a polygon from the solid canvas and all engulfed borders from the border canvas.
     */
    export const clearPolygon = (solidContext, borderContext, paintPoints, deletion) =>
    {
        solidContext.save()
        borderContext.save()

        if (deletion)
        {
            solidContext.fillStyle = "#fdf8f0ff";
            borderContext.fillStyle = "#fdf8f0ff";
        }
        else
        {
            //This line means that now wherever we draw, it will remove whatever was already there
            solidContext.globalCompositeOperation = "destination-out";
            borderContext.globalCompositeOperation = "destination-out";
        }

        //Clears engulfed borders
        borderContext.beginPath();
        borderContext.moveTo(paintPoints[0].x, paintPoints[0].y)

        for (let i = 1; i < paintPoints.length; i++)
        {
            borderContext.lineTo(paintPoints[i].x, paintPoints[i].y);
        }

        borderContext.closePath();
        borderContext.fill();

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
        borderContext.restore();
    }

    /**
     * Clears or fills a rectangle from the solid canvas
     */
    export const clearRectangle = (solidContext, borderContext, startX, startY, width, height, deletion) =>
    {
        solidContext.save()
        borderContext.save()

        if (deletion)
        {
            solidContext.fillStyle = "#fdf8f0ff";
            borderContext.fillStyle = "#fdf8f0ff";
        }
        else
        {
            //This line means that now wherever we draw, it will remove whatever was already there
            solidContext.globalCompositeOperation = "destination-out";
            borderContext.globalCompositeOperation = "destination-out";
        }

        //Clears the rectangle from the solid canvas by filling it with transparency
        solidContext.fillRect(startX, startY, width, height);

        solidContext.restore();
        borderContext.restore();
    }

    /** *************************************************************************
     * 
     * Brush Applicators
     * 
     * **************************************************************************/

    /**
     * Calls all the helpers used to carry out a user confirming their circle stroke
     */
    export const applyCircleBrush = (editorContext, x, y, r, deletion) =>
    {

        //Grabs the image data of the area before fulfilling the stroke
        const beforeImage = editorContext.solidContext.current.getImageData(0, 0, editorContext.solidCanvasRef.current.width, editorContext.solidCanvasRef.current.height);
        
        clearCircle(editorContext.solidContext.current, editorContext.borderContext.current, x, y, r, deletion);

        //Grabs the image data of the area after fulfilling the stroke
        const afterImage = editorContext.solidContext.current.getImageData(0, 0, editorContext.solidCanvasRef.current.width, editorContext.solidCanvasRef.current.height);

        //Calculates the new borders
        const edges = recomputeBorders(editorContext, afterImage);

        //Draws new borders
        drawEdgeDots(editorContext.borderContext.current, edges, 3);

        return {beforeImage, afterImage};
    }

    /**
     * Calls all the helpers used to carry out a user confirming their polygon stroke
     */
    export const applyPolygonBrush = (editorContext, paintPoints, deletion) =>
    {

        //Grabs the image data of the area before fulfilling the stroke
        const beforeImage = editorContext.solidContext.current.getImageData(0, 0, editorContext.solidCanvasRef.current.width, editorContext.solidCanvasRef.current.height);
        
        clearPolygon(editorContext.solidContext.current, editorContext.borderContext.current, paintPoints, deletion);

        //Grabs the image data of the area after fulfilling the stroke
        const afterImage = editorContext.solidContext.current.getImageData(0, 0, editorContext.solidCanvasRef.current.width, editorContext.solidCanvasRef.current.height);

        //Calculates the new borders
        const edges = recomputeBorders(editorContext, afterImage);

        //Draws new borders
        drawEdgeDots(editorContext.borderContext.current, edges, 3);

        return {beforeImage, afterImage};
        
    }
    
    /**
     * Calls all the helpers used to carry out a user confirming their square stroke
     */
    export const applySquareBrush = (editorContext, x1, y1, x2, y2, deletion) =>
    {
        const rect = normalizeRectangleCoords(x1, y1, x2, y2);
                                   
        const beforeImage = editorContext.solidContext.current.getImageData(0, 0, editorContext.solidCanvasRef.current.width, editorContext.solidCanvasRef.current.height);

        clearRectangle(editorContext.solidContext.current, editorContext.borderContext.current, rect.x, rect.y, rect.w, rect.h, deletion);

        const afterImage = editorContext.solidContext.current.getImageData(0, 0, editorContext.solidCanvasRef.current.width, editorContext.solidCanvasRef.current.height);

        //Calculates the new borders
        const edges = recomputeBorders(editorContext, afterImage);

        //Draws new borders
        drawEdgeDots(editorContext.borderContext.current, edges, 3);

        return {beforeImage, afterImage};
    }


    /** *************************************************************************
     * 
     * Canvas Updaters
     * 
     * **************************************************************************/
    
    /**
     * Updates the line canvas, drawing the newest line or all lines if needed.
     */
    export const updateLines = (editorContext, fullRedraw) =>
    {
        const lineCanvas = editorContext.lineCanvasRef.current;
        const canvasLines = editorContext.linesRef.current;
        const lineContext = lineCanvas.getContext("2d");


        if (!fullRedraw)
        {
            //Gets newest line
            const line = canvasLines[canvasLines.length - 1]

            lineContext.beginPath();
            lineContext.moveTo(line.x1, line.y1);
            lineContext.lineTo(line.x2, line.y2);
            lineContext.strokeStyle = "black";
            lineContext.lineWidth = 3;
            lineContext.stroke();
        }

        else
        {
            //Clears entire canvas
            lineContext.clearRect(0, 0, lineCanvas.width, lineCanvas.height);

            //Redraws all remaining lines from data
            for (const line of editorContext.linesRef.current)
            {
                lineContext.beginPath();
                lineContext.moveTo(line.x1, line.y1);
                lineContext.lineTo(line.x2, line.y2);
                lineContext.strokeStyle = "black";
                lineContext.lineWidth = 3;
                lineContext.stroke();
            }
        } 
    }

    /**
     * Updates the stamp canvas, drawing the newest stamp or all stamps if needed.
     */
    export const updateStamps = (editorContext, fullRedraw) =>
    {
        const stampCanvas = editorContext.stampCanvasRef.current;
        const canvasStamps = editorContext.stampsRef.current;
        const stampContext = stampCanvas.getContext("2d");


        if (!fullRedraw)
        {
            //Gets newest stamp
            const stamp = canvasStamps[canvasStamps.length - 1]

            stampContext.drawImage(stamp.image, stamp.x, stamp.y, stamp.width, stamp.height);
        }

        else
        {
            //Clears entire canvas
            stampContext.clearRect(0, 0, stampCanvas.width, stampCanvas.height);

            //Redraws all remaining lines from data
            for (const stamp of editorContext.stampsRef.current)
            {
                stampContext.drawImage(stamp.image, stamp.x, stamp.y, stamp.width, stamp.height);
            }
        } 
    }