import { Row } from './Row.js';
import { Cell } from './Cell.js';

/**
 * Manages the data store for the grid using a Map for efficiency
 */
export class Store {
    /**
     * Initializes the store
     * @param {number} initialRows - Initial number of rows
     * @param {number} initialColumns - Initial number of columns
     */
    constructor(initialRows, initialColumns) {
        /** @type {Map<number, Row>} Map of row index to Row */
        this.rows = new Map();
        
        /** @type {number} Number of columns */
        this.numColumns = initialColumns;
        
        // Initialize rows
        for (let row = 0; row < initialRows; row++) {
            this.rows.set(row, new Row(row, initialColumns));
        }

        /** @type {ExcelGrid} Reference to the grid instance */
        this.grid = null; // Will be set by ExcelGrid
    }

    /**
     * Sets the grid reference
     * @param {ExcelGrid} grid - The ExcelGrid instance
     */
    setGrid(grid) {
        this.grid = grid;
    }

    /**
     * Gets a cell at the specified row and column
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {Cell} The cell at the specified position
     */
    getCell(row, col) {
        const rowObj = this.rows.get(row);
        if (!rowObj) {
            const newRow = new Row(row, this.numColumns);
            this.rows.set(row, newRow);
            return newRow.getCell(col);
        }
        return rowObj.getCell(col);
    }

    /**
     * Sets the value of a cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {any} value - Cell value
     * @param {boolean} [suppressRender=false] - If true, suppresses rendering
     */
    setCellValue(row, col, value, suppressRender = false) {
        const rowObj = this.rows.get(row) || new Row(row, this.numColumns);
        rowObj.setCellValue(col, value);
        this.rows.set(row, rowObj);
        if (!suppressRender && this.grid) {
            this.grid.canvasPool.renderCell(row, col);
        }
    }

    /**
     * Sets multiple cell values in a batch
     * @param {Array<{row: number, col: number, value: any}>} values - Array of cell updates
     * @param {boolean} [suppressRender=true] - If true, renders all affected tiles once after updates
     */
    setCellValues(values, suppressRender = true) {
        for (const { row, col, value } of values) {
            const rowObj = this.rows.get(row) || new Row(row, this.numColumns);
            rowObj.setCellValue(col, value);
            this.rows.set(row, rowObj);
        }
        if (suppressRender && this.grid) {
            this.grid.canvasPool.renderTiles();
        }
    }

    /**
     * Sets the selection state for a range of cells
     * @param {number} startRow - Starting row index
     * @param {number} startCol - Starting column index
     * @param {number} endRow - Ending row index
     * @param {number} endCol - Ending column index
     * @param {boolean} selected - Selection state
     */
    setSelectionRange(startRow, startCol, endRow, endCol, selected = true) {
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        for (let row = minRow; row <= maxRow; row++) {
            const rowObj = this.rows.get(row) || new Row(row, this.numColumns);
            for (let col = minCol; col <= maxCol; col++) {
                rowObj.setCellSelected(col, selected);
            }
            this.rows.set(row, rowObj);
        }
    }

    /**
     * Clears all selections
     */
    clearSelections() {
        for (const row of this.rows.values()) {
            for (const cell of row.cells.values()) {
                cell.setSelected(false);
            }
        }
    }

    /**
     * Updates the number of columns in all rows
     * @param {number} newNumColumns - New number of columns
     */
    updateColumns(newNumColumns) {
        this.numColumns = newNumColumns;
        for (const [rowIndex, row] of this.rows) {
            const newCells = new Map();
            for (let col = 0; col < newNumColumns; col++) {
                newCells.set(col, row.cells.get(col) || new Cell(rowIndex, col));
            }
            row.cells = newCells;
        }
    }
}