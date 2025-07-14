import { CellValueCommand } from './command-pattern/CellValueCommand.js';

/**
 * Manages cell selection in the grid
 */
export class Selection {
    /**
     * Initializes the Selection object
     * @param {ExcelGrid} grid - Reference to the main ExcelGrid instance
     * @param {Store} store - Reference to the data store
     * @param {Object} config - Grid configuration
     * @param {HTMLElement} canvasContainer - Container for canvas elements
     */
    constructor(grid, store, config, canvasContainer) {
        this.grid = grid;
        this.store = store;
        this.config = config;
        this.canvasContainer = canvasContainer;

        this.startCell = null; // startCell variable used for direct input enter in grid (keydown event)
        this.endCell = null; // endCell variable used for direct input enter in grid (keydown event)
        this.isEditing = false;
        this.inputBox = null;
        this.isHeaderSelecting = false; // Track header dragging
        this.selectedRanges = []; // Store multiple selection ranges

        // Ensure canvasContainer is focusable for keyboard events
        this.canvasContainer.setAttribute('tabindex', '0');
    }

    rerenderSelectionChangeEffect = (range) => {
        this.grid.updateStatusBar();
        this.grid.headerRenderer.drawColumnHeaders(); // Update Column headers for selection highlight
        this.grid.headerRenderer.drawRowHeaders(); // Update Row headers for selection highlight
        this.grid.canvasPool.renderSelection(range); // Optimized: Render only the selection
    }

    saveValue = (row, col, range) => {
        const oldValue = this.store.getCell(row, col).value;
        const newValue = this.inputBox.value;
        this.isEditing = false;
        if (this.inputBox) {
            this.inputBox.remove();
            this.inputBox = null;
        }
        if (oldValue !== newValue) {
            const command = new CellValueCommand(this.store, row, col, newValue, oldValue, this.grid, range);
            this.grid.commandManager.executeCommand(command);
        } 

        // Force focus back to canvas to ensure key events work
        this.canvasContainer.focus();
        this.preventFocusLoss();
    };

    preventFocusLoss = () => {
        // Prevent focus from shifting away from canvas
        this.canvasContainer.addEventListener('blur', (e) => {
            if (!this.isEditing) {
                e.preventDefault();
                this.canvasContainer.focus();
            }
        }, { once: true });
    };

    /**
     * Creates an input box for editing a cell
     * @param {{row: number, col: number}} cell - The cell to edit
     * @param {string} [initialValue=''] - Initial value for the input box
     */
    createInputBox(cell, initialValue = '') {
        const range = this.selectedRanges.find(r => r.startRow === cell.row && r.startCol === cell.col && r.endRow === cell.row && r.endCol === cell.col) || this.selectedRanges[0];
        const minRow = Math.min(range.startRow, range.endRow);
        const maxRow = Math.max(range.startRow, range.endRow);
        const minCol = Math.min(range.startCol, range.endCol);
        const maxCol = Math.max(range.startCol, range.endCol);

        let left = 0;
        for (let col = 0; col < minCol; col++) {
            left += this.grid.columns.get(col)?.width || this.config.columnWidth;
        }
        let width = 0;
        for (let col = minCol; col <= maxCol; col++) {
            width += this.grid.columns.get(col)?.width || this.config.columnWidth;
        }

        let top = 0;
        for (let row = 0; row < minRow; row++) {
            top += this.grid.store.rows.get(row)?.height || this.config.rowHeight;
        }
        let height = 0;
        for (let row = minRow; row <= maxRow; row++) {
            height += this.grid.store.rows.get(row)?.height || this.config.rowHeight;
        }

        this.inputBox = document.createElement('input');
        this.inputBox.type = 'text';
        this.inputBox.style.position = 'absolute';
        this.inputBox.style.margin = '0';
        this.inputBox.style.width = `${width - 6}px`;
        this.inputBox.style.height = `${height - 3}px`;
        this.inputBox.style.background = 'white';
        this.inputBox.style.font = `16px Arial`;
        this.inputBox.style.color = this.config.colors.cellText;
        this.inputBox.style.outline = 'none';
        this.inputBox.style.border = 'none';
        this.inputBox.style.zIndex = '1000';
        this.inputBox.style.left = `${left + 3}px`;
        this.inputBox.style.top = `${top + 1}px`;
        this.inputBox.value = initialValue || this.store.getCell(cell.row, cell.col).value || '';
        
        this.canvasContainer.appendChild(this.inputBox);
        this.inputBox.focus();

        this.inputBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.saveValue(cell.row, cell.col, range);
                // Keep selection on the same cell
                this.selectedRanges = [{
                    startRow: cell.row,
                    startCol: cell.col,
                    endRow: cell.row,
                    endCol: cell.col,
                    type: 'cell'
                }];
            } else if (e.key === 'Escape') {
                this.isEditing = false;
                this.inputBox.value = '';
                this.inputBox.remove();
                this.inputBox = null;
                this.canvasContainer.focus();
                this.preventFocusLoss();
            } else if (e.key === 'Tab') {
                this.saveValue(cell.row, cell.col, range);
                const nextCol = cell.col + 1 < this.grid.currentColumns ? cell.col + 1 : cell.col;
                this.selectedRanges = [{
                    startRow: cell.row,
                    startCol: nextCol,
                    endRow: cell.row,
                    endCol: nextCol,
                    type: 'cell'
                }];
                this.grid.scrollToCell(cell.row, cell.row, nextCol, cell.col);
            }
        });
    }

    /**
     * Gets the text representation of the current selection
     * @param {function} columnNumberToLetter - Function to convert column number to letter
     * @returns {string} Selection text (e.g., "A1" or "A1:B2")
     */
    getSelectionText(columnNumberToLetter) {
        if (!this.selectedRanges.length) return "";
        if (this.selectedRanges.length === 1) {
            const range = this.selectedRanges[0];
            if (range.startRow === range.endRow && range.startCol === range.endCol) {
                return `${columnNumberToLetter(range.startCol)}${range.startRow + 1}`;
            }
            return `${columnNumberToLetter(range.startCol)}${range.startRow + 1}:${columnNumberToLetter(range.endCol)}${range.endRow + 1}`;
        }
        return this.selectedRanges.map(range => 
            `${columnNumberToLetter(range.startCol)}${range.startRow + 1}:${columnNumberToLetter(range.endCol)}${range.endRow + 1}`
        ).join(", ");
    }

    /**
     * Gets the set of selected rows
     * @returns {Set<number>} Set of selected row indices
     */
    getSelectedRows() {
        const selectedRows = new Set();
        this.selectedRanges.forEach(range => {
            const minRow = Math.min(range.startRow, range.endRow);
            const maxRow = Math.max(range.startRow, range.endRow);
            for (let row = minRow; row <= maxRow; row++) {
                selectedRows.add(row);
            }
        });
        return selectedRows;
    }

    /**
     * Gets the set of selected columns
     * @returns {Set<number>} Set of selected column indices
     */
    getSelectedColumns() {
        const selectedColumns = new Set();
        this.selectedRanges.forEach(range => {
            const minCol = Math.min(range.startCol, range.endCol);
            const maxCol = Math.max(range.startCol, range.endCol);
            for (let col = minCol; col <= maxCol; col++) {
                selectedColumns.add(col);
            }
        });
        return selectedColumns;
    }
}