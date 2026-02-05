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
        this.redoStack = [];
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
     * Pops a Command from the undo history and executes its undo funciton.
     */
    undo() 
    {
        //Exits if there are no commands to undo.
        if (!this.undoStack.length) return;

        //Isolates command
        const undoCommand = this.undoStack.pop();

        undoCommand.undo(this.context);
        
        //Adds the undone command to the redo stack
        this.redoStack.push(undoCommand);
    }

    /**
     * Pops a command from the redo history and executes it.
     */
    redo()
    {
        //Protects from operating on an empty stack.
        if (!this.redoStack.length) return;

        //Isolates command
        const redoCommand = this.redoStack.pop();

        redoCommand.execute(this.context);

        //Puts this command back on the undoStack
        this.undoStack.push(redoCommand);
    }

    /**
     * Empties the redoStack, intended for use after completing a brush stroke.
     */
    clearRedoStack()
    {
        this.redoStack = [];
    }
}