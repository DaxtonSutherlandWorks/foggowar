import { updateStamps } from "../helpers/BrushUtils";
import { Command } from "./Command";

/**
 * Represents a user command to move a stamp, with functionality to undo/redo
 */
export class MoveStampCommand extends Command {
    
    // stamp = {id, image, x, y, width, height}
    // positions = {x, y}
    constructor(stamp, newPosition, oldPosition) 
    {
        super();

        this.stamp = stamp;
        this.newPosition = newPosition;
        this.oldPosition = oldPosition;
    }

    execute(editorContext) 
    {
        this.stamp.x = this.newPosition.newX;
        this.stamp.y = this.newPosition.newY;
        updateStamps(editorContext, true);
    }

    undo(editorContext) 
    {
        this.stamp.x = this.oldPosition.oldX;
        this.stamp.y = this.oldPosition.oldY;
        updateStamps(editorContext, true);
    }
}