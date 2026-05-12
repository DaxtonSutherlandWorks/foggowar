import { DeleteLineCommand } from "../classes/DeleteLineCommand";
import { DrawLineCommand } from "../classes/DrawLineCommand";
import { findLineAtGuidePoint } from "./BrushUtils";

/**
 * Executes a line click
 */
export function linePointerDown(editorContextRef, guidePoint)
{
    const { interactionStateRef, mapStateRef, commandManagerRef, startCoordsRef, overlayCanvasRef, overlayContextRef} = editorContextRef.current;
    //Line deletion
    if (interactionStateRef.current.deletion)
    {
        //Only triggers if a valid line is within range
        if (guidePoint)
        {
            const line = findLineAtGuidePoint(
                guidePoint.x,
                guidePoint.y,
                mapStateRef.current.lines,
                16
            );

            if (line)
            {
                commandManagerRef.current.execute(
                    new DeleteLineCommand(line)
                );
            }

        }
    }

    //First click of stroke
    else if (interactionStateRef.current.mode !== "painting")
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
            const line = {
                id: crypto.randomUUID(), 
                x1: startCoordsRef.current[0], 
                y1: startCoordsRef.current[1], 
                x2: guidePoint.x, 
                y2: guidePoint.y
            }
            //Creates a new command that is executed through its own helper, then added to the manager's undo stack.
            commandManagerRef.current.execute(
                new DrawLineCommand(line)
            );

            //Clears the redo stack to avoid conflicts
            commandManagerRef.current.clearRedoStack();

            //Udates the painting state and clears the overlay preview
            interactionStateRef.current.mode = "inactive";
            overlayContextRef.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
    }
}

/**
 * Handles line drawing previews
 */
export function linePointerMove(editorContextRef, pointer, brushSizeRef, brushColorRef, guidePoint)
{
    const { interactionStateRef, overlayContextRef, startCoordsRef} = editorContextRef.current;
    //Ignore movements unless painting
    if (interactionStateRef.current.mode !== "painting")
    {
        return;
    }

    overlayContextRef.current.beginPath();
    overlayContextRef.current.moveTo(startCoordsRef.current[0], startCoordsRef.current[1]);
    overlayContextRef.current.lineTo(pointer.world.x, pointer.world.y);
    overlayContextRef.current.lineWidth = brushSizeRef.current;

    //Changes preview line color based on if it has a valid placement
    guidePoint ? overlayContextRef.current.strokeStyle = brushColorRef.current : overlayContextRef.current.strokeStyle = "rgba(65, 65, 65, 0.5)"

    overlayContextRef.current.stroke();
}