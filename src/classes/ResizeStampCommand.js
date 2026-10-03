import { updateStamps } from "../helpers/BrushUtils";
import { setStampResizeDimensions } from "../helpers/StampUtils";
import { Command } from "./Command";

/**
 * Represents a user command to resize a stamp, with functionality to undo/redo
 */
export class ResizeStampCommand extends Command {
    
    // stamp = {id, image, x, y, width, height}
    // dimensions = {x, y, width, height}
    constructor(stamp, newDimensions, oldDimensions) 
    {
        super();

        this.stamp = stamp;
        this.newDimensions = newDimensions;
        this.oldDimensions = oldDimensions;
    }

    execute(editorContext) 
    {
        setStampResizeDimensions(this.stamp, this.newDimensions);
        updateStamps(editorContext, true);
    }

    undo(editorContext) 
    {
        setStampResizeDimensions(this.stamp, this.oldDimensions);
        updateStamps(editorContext, true);
    }
}