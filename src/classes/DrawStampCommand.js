import { updateStamps } from "../helpers/BrushUtils";
import { addStamp, deleteStamp } from "../helpers/MapState";
import { Command } from "./Command";

/**
 * Represents a user command to draw a stamp, with functionality to undo/redo
 */
export class DrawStampCommand extends Command {

    constructor(stamp) 
    {
        super();
        this.stamp = stamp;
    }

    execute(editorContext) 
    {
        addStamp(editorContext.mapStateRef.current, this.stamp);
        updateStamps(editorContext, false);
    }

    undo(editorContext) 
    {
        deleteStamp(editorContext.mapStateRef.current, this.stamp);
        updateStamps(editorContext, true);
    }
}