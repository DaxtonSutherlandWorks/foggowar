import { ClearShapeCommand } from "../classes/ClearShapeCommand";
import { createShape } from "../schemas/shapeSchema";

/**
 * Executes a rectangle drawing/deletion click
 */
export function rectanglePointerDown(editorContextRef, guidePoint)
{
    const { interactionStateRef, startCoordsRef, commandManagerRef, overlayContextRef, overlayCanvasRef} = editorContextRef.current;

    //First click of stroke
    if (interactionStateRef.current.mode !== "painting")
    {
        //If in range of a guide point, snaps to it
        if (guidePoint)
        {
            interactionStateRef.current.mode = "painting";
            startCoordsRef.current = [guidePoint.x, guidePoint.y];
        }
        
    }

    //Terminate stroke
    else
    {
        //Only terminates in range of guide point, snaps to it
        if (guidePoint)
        {
            const x1 = startCoordsRef.current[0];
            const y1 = startCoordsRef.current[1];
            const x2 = guidePoint.x;
            const y2 = guidePoint.y;

            //Normalize the rectange (set leftmost coords as first set) for consistent shape storage
            const normalizedRect = normalizeRectangleCoords(x1, y1, x2, y2);

            const rec = createShape(
                {
                    id: crypto.randomUUID(),
                    type: "rectangle",

                    x: normalizedRect.x,
                    y: normalizedRect.y,

                    width: normalizedRect.w,
                    height: normalizedRect.h,

                    operation: interactionStateRef.current.deletion ? "subtract" : "add"
                }
            )

            commandManagerRef.current.execute(
                new ClearShapeCommand(rec)
            );

            //Clears the redo stack to avoid conflicts
            commandManagerRef.current.clearRedoStack();

            interactionStateRef.current.mode = "inactive";
            overlayContextRef.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)

        }
    }
}

/**
 * Handles rectangle drawing previews
 */
export function rectanglePointerMove(editorContextRef, brushSizeRef, pointer, guidePoint, brushColorRef)
{
    const { interactionStateRef, overlayContextRef, startCoordsRef} = editorContextRef.current;

    //Ignore movements unless painting
    if (interactionStateRef.current.mode !== "painting")
    {
        return;
    }

    overlayContextRef.current.beginPath();
    overlayContextRef.current.lineWidth = brushSizeRef.current;
    overlayContextRef.current.rect(startCoordsRef.current[0], startCoordsRef.current[1], pointer.world.x - startCoordsRef.current[0], pointer.world.y - startCoordsRef.current[1]);

    //Changes preview line color based on if it has a valid placement
    if(!guidePoint)
    {
        interactionStateRef.current.deletion ? overlayContextRef.current.strokeStyle = "rgba(255, 0, 0, 0.5)" : overlayContextRef.current.strokeStyle = "rgba(65, 65, 65, 0.5)";
    }
    else
    {
        interactionStateRef.current.deletion ? overlayContextRef.current.strokeStyle = "red" : overlayContextRef.current.strokeStyle = brushColorRef.current;
    }

    overlayContextRef.current.stroke();
}

/**
 * Normalizes rectangle coordinates to account for inverted rectangles
 */
const normalizeRectangleCoords = (x1, y1, x2, y2) => 
{
    const rectX = Math.min(x1, x2);
    const rectY = Math.min(y1, y2);
    const rectWidth = Math.abs(x2 - x1);
    const rectHeight = Math.abs(y2 - y1);

    return {x: rectX, y: rectY, w: rectWidth, h: rectHeight};
}