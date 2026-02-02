import { updateStamps } from "../helpers/BrushUtils";
import { Command } from "./Command";

/**
 * Represents a user command to draw a stamp, with functionality to undo/redo
 */
export class DrawStampCommand extends Command {
    
    // stamp = {image, x, y, width, height}
    constructor(stamp) 
    {
        super();
        this.stamp = stamp;
    }

    execute(editorContext) 
    {
        editorContext.stampsRef.current.push(this.stamp);
        updateStamps(editorContext, false);
    }

    undo(editorContext) 
    {
        editorContext.stampsRef.current.pop();
        updateStamps(editorContext, true);
    }
}