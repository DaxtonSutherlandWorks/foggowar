import { updateLines } from "../helpers/BrushUtils";
import { Command } from "./Command";

/**
 * Represents a user command to draw a line, with functionality to undo/redo
 */
export class DrawLineCommand extends Command {
    
    // line = {id, x1, y1, x2, y2}
    constructor(line) 
    {
        super();
        this.line = line;
    }

    execute(editorContext) 
    {
        editorContext.linesRef.current.push(this.line);
        updateLines(editorContext, false);
    }

    undo(editorContext) 
    {
        editorContext.linesRef.current.pop();
        updateLines(editorContext, true);
    }
}