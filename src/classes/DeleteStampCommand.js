import { updateStamps } from "../helpers/BrushUtils";
import { addStamp, deleteStamp } from "../helpers/MapState";
import { Command } from "./Command";

/**
 * Represents a user command to draw a stamp, with functionality to undo/redo
 */
export class DeleteStampCommand extends Command {
    
    // stamp = {id, image, x, y, width, height}
    constructor(stamp) 
    {
        super();

        this.stamp = stamp;
    }

    execute(editorContext) 
    {
        deleteStamp(editorContext.mapStateRef.current, this.stamp);
        updateStamps(editorContext, true);
    }

    undo(editorContext) 
    {
        addStamp(editorContext.mapStateRef.current, this.stamp);
        updateStamps(editorContext, false);
    }
}