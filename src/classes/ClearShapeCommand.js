import { rebuildSolidCanvas } from "../helpers/BrushUtils";
import { Command } from "./Command";

/**
 * This class represents a user command that clears/deletes a shape from the solid canvas.
 * An image of the canvas before and after is stored, that can be used for undo/redo functionality.
 */
export class ClearShapeCommand extends Command {
  
    constructor({ shape, editorContextRef }) 
    {
        super();
        
        this.shape = shape;
        this.editor = editorContextRef.current;
    }

    execute() 
    {
        this.editor.shapesRef.current.push(this.shape);
        rebuildSolidCanvas(this.editor);
    }

    undo() 
    {
        this.editor.shapesRef.current = this.editor.shapesRef.current.filter(s => s.id !== this.shape.id);
        rebuildSolidCanvas(this.editor);
    }
}