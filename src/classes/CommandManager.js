/**
 * This class stores commands and runs their execution and undo functions
 */
export class CommandManager {
    
    /**
     * Sets up an empty command history and a master context from the map editor
     */
    constructor(context) 
    {
        this.context = context;
        this.undoStack = [];
    }

    /**
     * Adds a command to the undo history that is assumed to "executed" elsewhere.
     */
    push(command)
    {
        this.undoStack.push(command);
    }

    /**
     * Accepts a Command and adds it to the command history
     */
    execute(command) 
    {
        command.execute(this.context);

        this.undoStack.push(command);
    }

    /**
     * Pops a Command from the history and executes its undo funciton.
     */
    undo() 
    {
        //Exits if there are no commands to undo.
        if (!this.undoStack.length) return;

        this.undoStack.pop().undo(this.context);
    }
}