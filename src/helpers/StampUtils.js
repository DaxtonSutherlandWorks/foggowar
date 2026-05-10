import { DeleteStampCommand } from "../classes/DeleteStampCommand";
import { DrawStampCommand } from "../classes/DrawStampCommand";
import { isSquareCleared } from "./BrushUtils";

/**
 * Executes stamp draw/deletion clicks
 */
export function stampPointerDown(guidePoint, interactionStateRef, mapStateRef, commandManagerRef, solidContextRef, stampContextRef, currStamp, stampSize)
{
    if(guidePoint)
    {
        //Stamp Deletion
        if (interactionStateRef.current.deletion)
        {
            //Checks all stamps to find a match
            for (let i = mapStateRef.current.stamps.length - 1; i >= 0; i--)
            {
                if (guidePoint.x >= mapStateRef.current.stamps[i].x 
                    && guidePoint.x <= mapStateRef.current.stamps[i].x + mapStateRef.current.stamps[i].width
                    && guidePoint.y >= mapStateRef.current.stamps[i].y
                    && guidePoint.y <= mapStateRef.current.stamps[i].y + mapStateRef.current.stamps[i].height)
                    {
                        const stamp = mapStateRef.current.stamps[i];

                        commandManagerRef.current.execute(
                            new DeleteStampCommand(stamp)
                        );
                    }
            }
        }

        //Checks if the stamp's potential area is clear
        else if (isSquareCleared(solidContextRef.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]) && isSquareCleared(stampContextRef.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]))
        {
            const stamp = {
                id: crypto.randomUUID(), 
                imagePath: currStamp, 
                x: guidePoint.x, 
                y: guidePoint.y, 
                width: stampSize[0], 
                height: stampSize[1]
            };

            //Creates a new command that is executed through its own helper, then added to the manager's undo stack.
            commandManagerRef.current.execute(
                new DrawStampCommand(stamp)
            );

            //Clears the redo stack to avoid conflicts
            commandManagerRef.current.clearRedoStack();
        }
    }
}

/**
 * Handles stamp preview drawing
 */
export function stampPointerMove(guidePoint, interactionStateRef, overlayContextRef, stampImageRef, stampSize, solidContextRef, stampContextRef)
{
    if (guidePoint && !interactionStateRef.current.deletion && interactionStateRef.current.mode === "inactive")
    {
        overlayContextRef.current.drawImage(stampImageRef.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]);
        
        if (!isSquareCleared(solidContextRef.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]) || !isSquareCleared(stampContextRef.current, guidePoint.x, guidePoint.y, stampSize[0], stampSize[1]))
        {
            overlayContextRef.current.globalCompositeOperation = "source-atop";
            overlayContextRef.current.fillStyle = "red";
            overlayContextRef.current.fillRect(guidePoint.x + 6, guidePoint.y, stampSize[0], stampSize[1]);
        }
        
    }
}