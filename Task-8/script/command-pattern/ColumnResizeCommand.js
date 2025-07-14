import { Command } from './Command.js';

/**
 * Command for resizing a column
 */
export class ColumnResizeCommand extends Command {
    /**
     * @param {ExcelGrid} grid - Reference to the ExcelGrid instance
     * @param {number} colIndex - Column index
     * @param {number} newWidth - New column width
     * @param {number} oldWidth - Previous column width
     */
    constructor(grid, colIndex, newWidth, oldWidth) {
        super();
        this.grid = grid;
        this.colIndex = colIndex;
        this.newWidth = newWidth;
        this.oldWidth = oldWidth;
    }

    execute() {
        this.grid.columns.get(this.colIndex).setWidth(this.newWidth);
        this.grid.updateScrollContent();
        this.grid.canvasPool.renderGridLines();
        this.grid.headerRenderer.drawColumnHeaders();
        this.grid.setupResizeHandles();
    }

    undo() {
        this.grid.columns.get(this.colIndex).setWidth(this.oldWidth);
        this.grid.updateScrollContent();
        this.grid.canvasPool.renderGridLines();
        this.grid.headerRenderer.drawColumnHeaders();
        this.grid.setupResizeHandles();
    }
}