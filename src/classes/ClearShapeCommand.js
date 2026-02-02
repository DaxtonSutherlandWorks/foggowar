import { drawEdgeDots, recomputeBorders } from "../helpers/BrushUtils";
import { Command } from "./Command";

/**
 * This class represents a user command that clears/deletes a shape from the solid canvas.
 * An image of the canvas before and after is stored, that can be used for undo/redo functionality.
 */
export class ClearShapeCommand extends Command {
  
    constructor({ beforeImage, afterImage, editorContextRef }) 
    {
        super();
        
        this.before = beforeImage;
        this.after = afterImage;
        this.editor = editorContextRef.current;
    }

    execute() 
    {
        this.editor.solidContext.current.putImageData(this.after, 0, 0);
        const edges = recomputeBorders(this.editor, this.after);
        drawEdgeDots(this.editor.borderContext.current, edges, 3)
    }

    undo() 
    {
        this.editor.solidContext.current.putImageData(this.before, 0, 0);
        const edges = recomputeBorders(this.editor, this.before);
        drawEdgeDots(this.editor.borderContext.current, edges, 3);
    }
}