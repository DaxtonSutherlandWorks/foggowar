import { updateLines } from "../helpers/BrushUtils";
import { addLine, deleteLine } from "../helpers/MapState";
import { Command } from "./Command";

/**
 * Represents a user command to delete a line, with functionality to undo/redo
 */
export class DeleteLineCommand extends Command {
    
    constructor(line) 
    {
        super();

        this.line = line;

    }

    execute(editorContext) 
    {
        deleteLine(editorContext.mapStateRef.current, this.line);
        updateLines(editorContext, true);
    }

    undo(editorContext) 
    {
        addLine(editorContext.mapStateRef.current, this.line);
        updateLines(editorContext, false);
    }
}