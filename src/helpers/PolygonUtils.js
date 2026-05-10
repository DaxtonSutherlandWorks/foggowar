import { ClearShapeCommand } from "../classes/ClearShapeCommand";
import { createShape } from "../schemas/shapeSchema";

/**
 * Executes a polygon draw/delete click
 */
export function polygonPointerDown(guidePoint, paintPointsRef, interactionStateRef, commandManagerRef, overlayContextRef, overlayCanvasRef)
{
    //Checks for a guide point in range
    if (guidePoint)
    {

        //First click of stroke
        if (paintPointsRef.current.length === 0)
        {
            paintPointsRef.current = [...paintPointsRef.current, guidePoint];
            interactionStateRef.current.mode = "painting";
        }

        else
        {
            //Checks if we're back at the start
            if (guidePoint.x === paintPointsRef.current[0].x && guidePoint.y === paintPointsRef.current[0].y)
            {

                const poly = createShape(
                    {
                        id: crypto.randomUUID(),
                        type: "polygon",
                        points: paintPointsRef.current,
                        operation: interactionStateRef.current.deletion ? "subtract" : "add"
                    }
                )
                
                commandManagerRef.current.execute(
                    new ClearShapeCommand(poly)
                );

                //Clears the redo stack to avoid conflicts
                commandManagerRef.current.clearRedoStack();

                paintPointsRef.current = [];
                interactionStateRef.current.mode = "inactive";
                overlayContextRef.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.width);
            }
            else
            {
                paintPointsRef.current = [...paintPointsRef.current, guidePoint];
            }
        }
    }
}

/**
 * Handles polygon preview drawing
 */
export function polygonPointerMove(interactionStateRef, overlayContextRef, brushSizeRef, guidePoint, paintPointsRef, brushColorRef, pointer)
{
    //Ignore movements unless painting
    if (interactionStateRef.current.mode !== "painting")
    {
        return;
    }

    overlayContextRef.current.lineWidth = brushSizeRef.current;

    //Changes preview line color based on if it has a valid placement
    if(!guidePoint)
    {
        interactionStateRef.current.deletion ? overlayContextRef.current.strokeStyle = "rgba(255, 0, 0, 0.5)" : overlayContextRef.current.strokeStyle = "rgba(65, 65, 65, 0.5)";
    }
    else
    {
        interactionStateRef.current.deletion ? overlayContextRef.current.strokeStyle = "red" : overlayContextRef.current.strokeStyle = brushColorRef.current;
    }

    overlayContextRef.current.beginPath();
    overlayContextRef.current.moveTo(paintPointsRef.current[0].x, paintPointsRef.current[0].y)

    for (let i = 1; i < paintPointsRef.current.length; i++)
    {
        overlayContextRef.current.lineTo(paintPointsRef.current[i].x, paintPointsRef.current[i].y);
    }

    overlayContextRef.current.lineTo(pointer.world.x, pointer.world.y);
    overlayContextRef.current.stroke();
}