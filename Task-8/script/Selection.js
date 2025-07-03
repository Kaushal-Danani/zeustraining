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

        this.startCell = null;
        this.endCell = null;
        this.isSelecting = false;
        this.isEditing = false;
        this.selectionDiv = null;

        // Ensure canvasContainer is focusable for keyboard events
        this.canvasContainer.setAttribute('tabindex', '0');
    }

    /**
     * Creates a selection div for the current selection range
     */
    createSelectionDiv() {
        this.removeSelectionDiv();

        if (!this.startCell || !this.endCell) return;

        this.selectionDiv = document.createElement('div');
        this.selectionDiv.style.position = 'absolute';
        this.selectionDiv.style.border = `2px solid ${this.config.colors.selectionBorder}`;
        this.selectionDiv.style.pointerEvents = 'none';
        this.selectionDiv.style.zIndex = '900';
        this.canvasContainer.appendChild(this.selectionDiv);
    }

    /**
     * Removes the current selection div if it exists
     */
    removeSelectionDiv() {
        if (this.selectionDiv) {
            this.selectionDiv.remove();
            this.selectionDiv = null;
        }
    }

    /**
     * Sets up event listeners for selection
     */
    setupEventListeners() {
        this.canvasContainer.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || this.isEditing) return; // Only handle left-click

            const x = e.clientX - this.config.headerWidth;
            const y = e.clientY - this.config.headerHeight;
            
            const cell = this.grid.getCurrentCell(x, y);
            if (cell) {
                this.store.clearSelections();
                if (e.shiftKey && this.startCell) {
                    // Extend selection
                    this.endCell = cell;
                    this.store.setSelectionRange(
                        this.startCell.row,
                        this.startCell.col,
                        cell.row,
                        cell.col,
                        true
                    );
                } else {
                    // New selection
                    this.startCell = cell;
                    this.endCell = cell;
                    this.store.setSelectionRange(cell.row, cell.col, cell.row, cell.col, true);
                }
                this.isSelecting = true;
                this.createSelectionDiv();
                this.updateSelectionDivPosition(this.grid.scrollX, this.grid.scrollY);
                this.grid.updateStatusBar();
                this.grid.render();
            }
        });

        this.canvasContainer.addEventListener('mousemove', (e) => {
            if (this.isSelecting && !this.isEditing) {
                const x = e.clientX - this.config.headerWidth;
                const y = e.clientY - this.config.headerHeight;
                
                const cell = this.grid.getCurrentCell(x, y);
                if (cell && (cell.row !== this.endCell?.row || cell.col !== this.endCell?.col)) {
                    this.store.clearSelections();
                    this.endCell = cell;
                    this.store.setSelectionRange(
                        this.startCell.row,
                        this.startCell.col,
                        this.endCell.row,
                        this.endCell.col,
                        true
                    );
                    this.createSelectionDiv();
                    this.grid.scrollToCell(cell.row, this.startCell.row, cell.col, this.startCell.col);
                    this.updateSelectionDivPosition(this.grid.scrollX, this.grid.scrollY);
                    this.grid.updateStatusBar();
                    this.grid.render();
                }
            }
        });

        this.canvasContainer.addEventListener('mouseup', () => {
            this.isSelecting = false;
        });

        this.canvasContainer.addEventListener('dblclick', (e) => {
            if (this.isEditing) return;

            const x = e.clientX - this.config.headerWidth;
            const y = e.clientY - this.config.headerHeight;
            
            const cell = this.grid.getCurrentCell(x, y);
            if (cell) {
                this.startCell = cell;
                this.endCell = cell;
                this.isEditing = true;
                this.store.clearSelections();
                this.store.setSelectionRange(cell.row, cell.col, cell.row, cell.col, true);
                this.createInputBox(cell);
                this.grid.render();
            }
        });

        this.canvasContainer.addEventListener('keydown', (e) => {
            if (this.isEditing) return;

            // Handle alphanumeric or special character input to start editing
            const isAlphanumericOrSpecial = /^[a-zA-Z0-9`~!@#$%^&*()_+\-=\[\]{}\\|;:'",.<>\/?]$/.test(e.key);
            if (isAlphanumericOrSpecial && this.startCell) {
                e.preventDefault();
                this.isEditing = true;
                this.store.clearSelections();
                this.store.setSelectionRange(this.startCell.row, this.startCell.col, this.startCell.row, this.startCell.col, true);
                this.createInputBox(this.startCell, e.key);
                return;
            }

            if (!this.startCell) return;
            
            let newRow = this.startCell.row;
            let newCol = this.startCell.col;
            
            switch (e.key) {
                case 'Tab':
                    e.preventDefault();
                    newCol = Math.min(this.grid.currentColumns - 1, newCol + 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    newRow = Math.max(0, newRow - 1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    newRow = Math.min(this.grid.currentRows - 1, newRow + 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    newCol = Math.max(0, newCol - 1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    newCol = Math.min(this.grid.currentColumns - 1, newCol + 1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    newRow = Math.min(this.grid.currentRows - 1, newRow + 1);
                    break;
                default:
                    return;
            }
            
            this.store.clearSelections();
            this.startCell = { row: newRow, col: newCol, address: `${this.grid.columnNumberToLetter(newCol)}${newRow + 1}` };
            this.endCell = this.startCell;
            this.store.setSelectionRange(newRow, newCol, newRow, newCol, true);
            this.createSelectionDiv();
            this.grid.scrollToCell(newRow, this.startCell.row, newCol, this.startCell.col);
            this.updateSelectionDivPosition(this.grid.scrollX, this.grid.scrollY);
            this.grid.updateStatusBar();
            this.grid.render();
        });
    }

    /**
     * Creates an input box for editing a cell
     * @param {{row: number, col: number}} cell - The cell to edit
     * @param {string} [initialValue=''] - Initial value for the input box
     */
    createInputBox(cell, initialValue = '') {
        this.removeSelectionDiv();

        const minRow = Math.min(this.startCell.row, this.endCell.row);
        const maxRow = Math.max(this.startCell.row, this.endCell.row);
        const minCol = Math.min(this.startCell.col, this.endCell.col);
        const maxCol = Math.max(this.startCell.col, this.endCell.col);

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

        this.selectionDiv = document.createElement('div');
        this.selectionDiv.style.position = 'absolute';
        this.selectionDiv.style.border = `2px solid ${this.config.colors.selectionBorder}`;
        this.selectionDiv.style.pointerEvents = 'none';
        this.selectionDiv.style.left = `${left - 2}px`;
        this.selectionDiv.style.top = `${top - 2}px`;
        this.selectionDiv.style.width = `${width + 3}px`;
        this.selectionDiv.style.height = `${height + 3}px`;
        this.selectionDiv.style.zIndex = '900';
        this.canvasContainer.appendChild(this.selectionDiv);

        const inputBox = document.createElement('input');
        inputBox.type = 'text';
        inputBox.style.position = 'absolute';
        inputBox.style.all = 'unset';
        inputBox.style.padding = '0px 0px 0px 3px';
        inputBox.style.margin = '0';
        inputBox.style.width = `calc(100% - 4px)`;
        inputBox.style.height = `calc(100% - 2px)`;
        inputBox.style.background = 'white';
        inputBox.style.font = `16px Arial`;
        inputBox.style.color = this.config.colors.cellText;
        inputBox.style.zIndex = '1000';
        inputBox.value = initialValue || this.store.getCell(cell.row, cell.col).value || '';
        
        this.selectionDiv.appendChild(inputBox);
        inputBox.focus();

        const saveValue = () => {
            this.store.setCellValue(cell.row+1, cell.col+1, inputBox.value);
            this.isEditing = false;
            this.selectionDiv.removeChild(inputBox);
            this.grid.canvasPool.renderTiles();
            this.grid.render();
        };

        inputBox.addEventListener('blur', saveValue);

        inputBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveValue();
                this.store.clearSelections();
                this.endCell = this.startCell;
                this.store.setSelectionRange(newRow, newCol, newRow, newCol, true);
                this.createSelectionDiv();
                this.grid.scrollToCell(newRow, cell.row, newCol, cell.col);
                this.updateSelectionDivPosition(this.grid.scrollX, this.grid.scrollY);
                this.grid.updateStatusBar();
            } else if (e.key === 'Escape') {
                this.isEditing = false;
                this.selectionDiv.removeChild(inputBox);
                this.grid.canvasPool.renderTiles();
                this.grid.render();
            } else if (e.key === 'Tab') {
                saveValue();
                let newRow = cell.row;
                let newCol = Math.min(this.grid.currentColumns - 1, cell.col + 1);
                this.store.clearSelections();
                this.startCell = { row: newRow, col: newCol, address: `${this.grid.columnNumberToLetter(newCol)}${newRow + 1}` };
                this.endCell = this.startCell;
                this.store.setSelectionRange(newRow, newCol, newRow, newCol, true);
                this.createSelectionDiv();
                this.grid.scrollToCell(newRow, cell.row, newCol, cell.col);
                this.updateSelectionDivPosition(this.grid.scrollX, this.grid.scrollY);
                this.grid.updateStatusBar();
            }
        });
    }

    /**
     * Updates the position and size of the selection div
     * @param {number} scrollX - Current horizontal scroll position
     * @param {number} scrollY - Current vertical scroll position
     */
    updateSelectionDivPosition(scrollX, scrollY) {
        if (!this.startCell || !this.endCell) {
            this.removeSelectionDiv();
            return;
        }

        if (!this.selectionDiv) {
            this.createSelectionDiv();
        }

        const minRow = Math.min(this.startCell.row, this.endCell.row);
        const maxRow = Math.max(this.startCell.row, this.endCell.row);
        const minCol = Math.min(this.startCell.col, this.endCell.col);
        const maxCol = Math.max(this.startCell.col, this.endCell.col);

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

        this.selectionDiv.style.left += `${left - 2}px`;
        this.selectionDiv.style.top = `${top - 2}px`;
        this.selectionDiv.style.width = `${width + 3}px`;
        this.selectionDiv.style.height = `${height + 3}px`;

        if (!this.isEditing) {
            // Remove existing selectRect if any
            const existingRect = this.selectionDiv.querySelector('div');
            if (existingRect) {
                this.selectionDiv.removeChild(existingRect);
            }

            const selectRect = document.createElement('div');
            selectRect.style.position = 'absolute';
            selectRect.style.left = `${width - 2.5}px`;
            selectRect.style.top = `${height - 2.5}px`;
            selectRect.style.width = '4px';
            selectRect.style.height = '4px';
            selectRect.style.boxShadow = `0 0 0 1px white`;
            selectRect.style.backgroundColor = this.config.colors.selectionBorder;
            this.selectionDiv.appendChild(selectRect);
        }

        // Add selectRect for resize handle
        if (maxCol - minCol !== 0 || maxRow - minRow !== 0) {
            this.selectionDiv.style.backgroundColor = this.config.colors.selectRangeColor;
        }
    }

    /**
     * Updates the position and size of the input box
     */
    updateInputBoxPosition() {
        if (!this.isEditing || !this.selectionDiv) return;

        const inputBox = this.selectionDiv.querySelector('input');
        if (!inputBox || !this.startCell) return;

        let left = this.config.headerWidth;
        for (let col = 0; col < this.startCell.col; col++) {
            left += this.grid.columns.get(col)?.width || this.config.columnWidth;
        }
        let top = this.config.headerHeight;
        for (let row = 0; row < this.startCell.row; row++) {
            top += this.grid.store.rows.get(row)?.height || this.config.rowHeight;
        }
        inputBox.style.left = `${left - this.grid.scrollX - 2}px`;
        inputBox.style.top = `${top - this.grid.scrollY - 2}px`;
    }

    /**
     * Gets the text representation of the current selection
     * @param {function} columnNumberToLetter - Function to convert column number to letter
     * @returns {string} Selection text (e.g., "A1" or "A1:B2")
     */
    getSelectionText(columnNumberToLetter) {
        if (!this.startCell) return "";
        if (this.startCell.row === this.endCell?.row && this.startCell.col === this.endCell?.col) {
            return this.startCell.address;
        }
        return `${this.startCell.address}:${columnNumberToLetter(this.endCell.col)}${this.endCell.row + 1}`;
    }

    /**
     * Gets the set of selected rows
     * @returns {Set<number>} Set of selected row indices
     */
    getSelectedRows() {
        const selectedRows = new Set();
        if (this.startCell && this.endCell) {
            const minRow = Math.min(this.startCell.row, this.endCell.row);
            const maxRow = Math.max(this.startCell.row, this.endCell.row);
            for (let row = minRow; row <= maxRow; row++) {
                selectedRows.add(row);
            }
        }
        return selectedRows;
    }

    /**
     * Gets the set of selected columns
     * @returns {Set<number>} Set of selected column indices
     */
    getSelectedColumns() {
        const selectedColumns = new Set();
        if (this.startCell && this.endCell) {
            const minCol = Math.min(this.startCell.col, this.endCell.col);
            const maxCol = Math.max(this.startCell.col, this.endCell.col);
            for (let col = minCol; col <= maxCol; col++) {
                selectedColumns.add(col);
            }
        }
        return selectedColumns;
    }

    /**
     * Resets the selection
     */
    reset() {
        this.startCell = null;
        this.endCell = null;
        this.isSelecting = false;
        this.isEditing = false;
        this.removeSelectionDiv();
        this.store.clearSelections();
    }
}