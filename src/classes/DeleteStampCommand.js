import { updateStamps } from "../helpers/BrushUtils";
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

        editorContext.stampsRef.current = editorContext.stampsRef.current.filter(keepStamps => keepStamps.id !== this.stamp.id);
        updateStamps(editorContext, true);
    }

    undo(editorContext) 
    {
        editorContext.stampsRef.current.push(this.stamp);
        updateStamps(editorContext, false);
    }
}