import { Cell } from "./Cell.js";
import { DEFAULT_CONFIG } from "./config.js";

/**
 * Represents a row in the grid
 */
export class Row {
    /**
     * Initializes a row
     * @param {number} rowIndex - Row index (0-based)
     * @param {number} numColumns - Number of columns in the row
     */
    constructor(rowIndex, numColumns, height = DEFAULT_CONFIG.rowHeight) {
        /** @type {number} Row index */
        this.rowIndex = rowIndex;

        /** @type {number} Row height */
        this.height = height;
        
        /** @type {Map<number, Cell>} Map of column index to Cell */
        this.cells = new Map();

        // Initialize cells for the row
        for (let col = 0; col < numColumns; col++) {
            this.cells.set(col, new Cell(rowIndex, col));
        }
    }

    /**
     * Sets the row height
     * @param {number} height - New height in pixels
     */
    setHeight(height) {
        this.height = Math.max(1, height); // Ensure height is at least 1 pixel
    }

    /**
     * Gets a cell at the specified column
     * @param {number} col - Column index
     * @returns {Cell} The cell at the specified column
     */
    getCell(col) {
        return this.cells.get(col);
    }

    /**
     * Sets the value of a cell at the specified column
     * @param {number} col - Column index
     * @param {any} value - Cell value
     */
    setCellValue(col, value) {
        const cell = this.cells.get(col);
        if (cell) {
            cell.setValue(value);
        }
    }

    /**
     * Sets the selection state of a cell at the specified column
     * @param {number} col - Column index
     * @param {boolean} selected - Selection state
     */
    setCellSelected(col, selected) {
        const cell = this.cells.get(col);
        if (cell) {
            cell.setSelected(selected);
        }
    }
}