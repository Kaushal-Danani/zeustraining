import { Command } from './Command.js';

/**
 * Command for resizing a row
 */
export class RowResizeCommand extends Command {
    /**
     * @param {ExcelGrid} grid - Reference to the ExcelGrid instance
     * @param {number} rowIndex - Row index
     * @param {number} newHeight - New row height
     * @param {number} oldHeight - Previous row height
     */
    constructor(grid, rowIndex, newHeight, oldHeight) {
        super();
        this.grid = grid;
        this.rowIndex = rowIndex;
        this.newHeight = newHeight;
        this.oldHeight = oldHeight;
    }

    execute() {
        this.grid.store.rows.get(this.rowIndex).setHeight(this.newHeight);
        this.grid.updateScrollContent();
        this.grid.canvasPool.renderGridLines();
        this.grid.headerRenderer.drawRowHeaders();
        this.grid.setupResizeHandles();
    }

    undo() {
        this.grid.store.rows.get(this.rowIndex).setHeight(this.oldHeight);
        this.grid.updateScrollContent();
        this.grid.canvasPool.renderGridLines();
        this.grid.headerRenderer.drawRowHeaders();
        this.grid.setupResizeHandles();
    }
}