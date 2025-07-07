/**
 * Represents a column in the grid
 */
 export class Column {
    /**
     * Initializes a column
     * @param {number} colIndex - Column index (0-based)
     * @param {number} width - Column width in pixels
     */
    constructor(colIndex, width) {
        /** @type {number} Column index */
        this.colIndex = colIndex;
        
        /** @type {number} Column width */
        this.width = width;
    }

    /**
     * Sets the column width
     * @param {number} width - New width in pixels
     */
    setWidth(width) {
        this.width = Math.max(2, width); // Ensure width is at least 1 pixel
    }
}