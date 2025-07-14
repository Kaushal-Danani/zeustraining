import { Command } from './Command.js';

/**
 * Command for changing a cell's value
 */
export class CellValueCommand extends Command {
    /**
     * @param {Store} store - Reference to the data store
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {any} newValue - New cell value
     * @param {any} oldValue - Previous cell value
     * @param {ExcelGrid} grid - Reference to the ExcelGrid instance
     * @param {Object} range - Selection range
     */
    constructor(store, row, col, newValue, oldValue, grid, range) {
        super();
        this.store = store;
        this.row = row;
        this.col = col;
        this.newValue = newValue;
        this.oldValue = oldValue;
        this.grid = grid;
        this.range = range;
    }

    execute() {
        this.store.setCellValue(this.row, this.col, this.newValue);
        this.grid.canvasPool.renderCell(this.row, this.col);
        this.grid.selection.rerenderSelectionChangeEffect(this.range);
    }

    undo() {
        console.log("Cell Undo@!!! :", this.oldValue);
        this.store.setCellValue(this.row, this.col, this.oldValue);
        this.grid.canvasPool.renderCell(this.row, this.col);
        this.grid.selection.rerenderSelectionChangeEffect(this.range);
    }
}