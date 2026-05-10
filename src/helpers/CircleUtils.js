import { ClearShapeCommand } from "../classes/ClearShapeCommand";
import { createShape } from "../schemas/shapeSchema";

/**
 * Executes circle draw/delete clicks
 */
export function circlePointerDown(interactionStateRef, guidePoint, startCoordsRef, commandManagerRef, overlayContextRef, overlayCanvasRef)
{
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
            const x = startCoordsRef.current[0];
            const y = startCoordsRef.current[1];
            const r = Math.abs(Math.hypot((guidePoint.x - startCoordsRef.current[0]), (guidePoint.y - startCoordsRef.current[1])));

            const circ = createShape(
                {
                    id: crypto.randomUUID(),
                    type: "circle",

                    x: x,
                    y: y,
                    r: r,

                    operation: interactionStateRef.current.deletion ? "subtract" : "add"
                }
            )

            commandManagerRef.current.execute(
                new ClearShapeCommand(circ)
            );

            //Clears the redo stack to avoid conflicts
            commandManagerRef.current.clearRedoStack();

            interactionStateRef.current.mode = "inactive";
            overlayContextRef.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.width);
        }
    }
}

/**
 * Handles preview drawing for circles
 */
export function circlePointerMove(interactionStateRef, overlayContextRef, startCoordsRef, pointer, brushSizeRef, guidePoint, brushColorRef)
{
    //Ignore movements unless painting
    if (interactionStateRef.current.mode !== "painting")
    {
        return;
    }

    overlayContextRef.current.beginPath();
    overlayContextRef.current.arc(startCoordsRef.current[0], startCoordsRef.current[1], Math.abs(Math.hypot((pointer.world.x - startCoordsRef.current[0]), (pointer.world.y - startCoordsRef.current[1]))), 0, 2 * Math.PI);
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

    overlayContextRef.current.stroke();
}