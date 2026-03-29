import { rebuildSolidCanvas } from "../helpers/BrushUtils";
import { addShape, deleteShape } from "../helpers/MapState";
import { Command } from "./Command";

/**
 * This class represents a user command that clears/deletes a shape from the solid canvas.
 * An image of the canvas before and after is stored, that can be used for undo/redo functionality.
 */
export class ClearShapeCommand extends Command {
  
    constructor(shape) 
    {
        super();
        
        this.shape = shape;
    }

    execute(editorContext) 
    {
        addShape(editorContext.mapStateRef.current, this.shape);
        rebuildSolidCanvas(editorContext);
    }

    undo(editorContext) 
    {
        deleteShape(editorContext.mapStateRef.current, this.shape);
        rebuildSolidCanvas(editorContext);
    }
}