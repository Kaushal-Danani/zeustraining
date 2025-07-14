/**
 * Manages undo and redo stacks for commands
 */
 export class CommandManager {
    /**
     * Initializes the command manager
     * @param {number} maxStackSize - Maximum number of commands to store
     */
    constructor(maxStackSize = 50) {
        /** @type {Command[]} Undo stack */
        this.undoStack = [];
        
        /** @type {Command[]} Redo stack */
        this.redoStack = [];
        
        /** @type {number} Maximum stack size */
        this.maxStackSize = maxStackSize;
    }

    /**
     * Executes a command and adds it to the undo stack
     * @param {Command} command - The command to execute
     */
    executeCommand(command) {
        command.execute();   
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift(); // Remove oldest command
        }
        this.redoStack = []; // Clear redo stack on new action
    }

    /**
     * Undoes the last command
     */
    undo() {
        if (this.undoStack.length === 0) return;
        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);
        if (this.redoStack.length > this.maxStackSize) {
            this.redoStack.shift();
        }
    }

    /**
     * Redoes the last undone command
     */
    redo() {
        if (this.redoStack.length === 0) return;
        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }
    }

    /**
     * Checks if undo is available
     * @returns {boolean}
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Checks if redo is available
     * @returns {boolean}
     */
    canRedo() {
        return this.redoStack.length > 0;
    }
}