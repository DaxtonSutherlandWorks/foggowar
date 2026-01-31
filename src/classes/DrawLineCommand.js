import { updateLines } from "../helpers/BrushUtils";
import { Command } from "./Command";

export class DrawLineCommand extends Command {
    
    // line = {x1, y1, x2, y2}
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