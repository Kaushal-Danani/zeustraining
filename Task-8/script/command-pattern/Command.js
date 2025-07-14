/**
 * Interface for commands in the Command Pattern
 * @interface
 */
 export class Command {
    /**
     * Executes the command
     */
    execute() {}

    /**
     * Undoes the command
     */
    undo() {}
}