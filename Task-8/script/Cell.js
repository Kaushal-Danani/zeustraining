/**
 * Represents an individual cell in the grid
 */
 export class Cell {
    /**
     * Initializes a cell
     * @param {number} row - Row index (0-based)
     * @param {number} col - Column index (0-based)
     * @param {any} value - Cell value
     */
    constructor(row, col, value = '') {
        /** @type {number} Row index */
        this.row = row;
        
        /** @type {number} Column index */
        this.col = col;
        
        /** @type {any} Cell value */
        this.value = value;
        
        /** @type {boolean} Whether the cell is selected */
        this.isSelected = false;
    }

    /**
     * Sets the cell value
     * @param {any} value - New value for the cell
     */
    setValue(value) {
        this.value = value;
    }

    /**
     * Sets the selection state of the cell
     * @param {boolean} selected - Selection state
     */
    setSelected(selected) {
        this.isSelected = selected;
    }

    /**
     * Gets the cell address in A1 notation
     * @param {function} columnNumberToLetter - Function to convert column number to letter
     * @returns {string} Cell address (e.g., A1)
     */
    getAddress(columnNumberToLetter) {
        return `${columnNumberToLetter(this.col)}${this.row + 1}`;
    }
}