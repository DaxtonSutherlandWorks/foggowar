import { updateLines } from "../helpers/BrushUtils";
import { Command } from "./Command";

/**
 * Represents a user command to delete a line, with functionality to undo/redo
 */
export class DeleteLineCommand extends Command {
    
    // line = {id, x1, y1, x2, y2}
    constructor(line) 
    {
        super();

        this.line = line;
    }

    execute(editorContext) 
    {

        editorContext.linesRef.current = editorContext.linesRef.current.filter(keepLines => keepLines.id !== this.line.id);
        updateLines(editorContext, true);
    }

    undo(editorContext) 
    {
        editorContext.linesRef.current.push(this.line);
        updateLines(editorContext, false);
    }
}