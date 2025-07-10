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
        this.isHeaderSelecting = false; // Track header dragging
        this.selectedRanges = []; // Store multiple selection ranges

        // Ensure canvasContainer is focusable for keyboard events
        this.canvasContainer.setAttribute('tabindex', '0');
    }

    rerenderSelectionChangeEffect = (range) => {
        this.grid.updateStatusBar();
        this.grid.canvasPool.renderSelection(range); // Optimized: Render only the selection
        this.grid.headerRenderer.drawColumnHeaders(); // Update Column headers for selection highlight
        this.grid.headerRenderer.drawRowHeaders(); // Update Row headers for selection highlight
    }

    /**
     * Sets up event listeners for selection
     */
    setupEventListeners() {
        const horizontalHeader = document.querySelector('#horizontal-header');
        const verticalHeader = document.querySelector('#vertical-header');

        // Column header selection
        if (horizontalHeader) {
            let startCol = null;
            let hasMoved = false;

            horizontalHeader.addEventListener('pointerdown', (e) => {
                if (this.isEditing || e.button !== 0) return;
                const colResizer = e.target.closest('.column-resizer');
                if (colResizer) return;

                const x = e.clientX - this.config.headerWidth + this.grid.scrollX;
                let colX = 0;
                let col = 0;
                while (colX < x && col < this.grid.currentColumns) {
                    colX += this.grid.columns.get(col)?.width || this.config.columnWidth;
                    col++;
                }
                col = Math.max(0, col - 1);

                if (col >= this.grid.currentColumns) return;

                startCol = col;
                this.isHeaderSelecting = true;
                hasMoved = false;

                const range = {
                    startRow: 0,
                    startCol: col,
                    endRow: this.grid.currentRows - 1,
                    endCol: col,
                    type: 'column'
                };

                if (e.ctrlKey || e.metaKey) {
                    this.selectedRanges = this.selectedRanges.filter(r => r.startCol !== col || r.endCol !== col);
                    this.selectedRanges.push(range);
                } else {
                    this.store.clearSelections();
                    this.selectedRanges = [range];
                }

                this.store.setSelectionRange(range.startRow, range.startCol, range.endRow, range.endCol, true);
                this.startCell = { row: range.startRow, col: range.startCol, address: `${this.grid.columnNumberToLetter(range.startCol)}${range.startRow + 1}` };
                this.endCell = { row: range.endRow, col: range.endCol, address: `${this.grid.columnNumberToLetter(range.endCol)}${range.endRow + 1}` };

                this.rerenderSelectionChangeEffect(range);
            });

            horizontalHeader.addEventListener('pointermove', (e) => {
                if (!this.isHeaderSelecting || this.isEditing) return;

                hasMoved = true;

                const x = e.clientX - this.config.headerWidth + this.grid.scrollX;
                let colX = 0;
                let col = 0;
                while (colX < x && col < this.grid.currentColumns) {
                    colX += this.grid.columns.get(col)?.width || this.config.columnWidth;
                    col++;
                }
                col = Math.max(0, col - 1);

                if (col >= this.grid.currentColumns || col === this.endCell?.col) return;

                const range = {
                    startRow: 0,
                    startCol: Math.min(startCol, col),
                    endRow: this.grid.currentRows - 1,
                    endCol: Math.max(startCol, col),
                    type: startCol === col ? 'column' : 'column-range'
                };

                if (e.ctrlKey || e.metaKey) {
                    this.selectedRanges = this.selectedRanges.filter(r => r.type !== 'column' && r.type !== 'column-range');
                    this.selectedRanges.push(range);
                } else {
                    this.store.clearSelections();
                    this.selectedRanges = [range];
                }

                this.store.setSelectionRange(range.startRow, range.startCol, range.endRow, range.endCol, true);
                this.endCell = { row: range.endRow, col: range.endCol, address: `${this.grid.columnNumberToLetter(range.endCol)}${range.endRow + 1}` };
                
                this.rerenderSelectionChangeEffect(range);
            });

            horizontalHeader.addEventListener('pointerup', (e) => {
                if (this.isHeaderSelecting) {
                    this.isHeaderSelecting = false;
                    startCol = null;
                    hasMoved = false;
                }
            });
        }

        // Row header selection
        if (verticalHeader) {
            let startRow = null;
            let hasMoved = false;

            verticalHeader.addEventListener('pointerdown', (e) => {
                if (this.isEditing || e.button !== 0) return;
                const rowResizer = e.target.closest('.row-resizer');
                if (rowResizer) return;

                const y = e.clientY - this.config.headerHeight + this.grid.scrollY;
                let rowY = 0;
                let row = 0;
                while (rowY < y && row < this.grid.currentRows) {
                    rowY += this.grid.store.rows.get(row)?.height || this.config.rowHeight;
                    row++;
                }
                row = Math.max(0, row - 1);

                if (row >= this.grid.currentRows) return;

                startRow = row;
                this.isHeaderSelecting = true;
                hasMoved = false;

                const range = {
                    startRow: row,
                    startCol: 0,
                    endRow: row,
                    endCol: this.grid.currentColumns - 1,
                    type: 'row'
                };

                if (e.ctrlKey || e.metaKey) {
                    this.selectedRanges = this.selectedRanges.filter(r => r.startRow !== row || r.endRow !== row);
                    this.selectedRanges.push(range);
                } else {
                    this.store.clearSelections();
                    this.selectedRanges = [range];
                }

                this.store.setSelectionRange(range.startRow, range.startCol, range.endRow, range.endCol, true);
                this.startCell = { row: range.startRow, col: range.startCol, address: `${this.grid.columnNumberToLetter(range.startCol)}${range.startRow + 1}` };
                this.endCell = { row: range.endRow, col: range.endCol, address: `${this.grid.columnNumberToLetter(range.endCol)}${range.endRow + 1}` };
                
                this.rerenderSelectionChangeEffect(range);
            });

            verticalHeader.addEventListener('pointermove', (e) => {
                if (!this.isHeaderSelecting || this.isEditing) return;

                hasMoved = true;

                const y = e.clientY - this.config.headerHeight + this.grid.scrollY;
                let rowY = 0;
                let row = 0;
                while (rowY < y && row < this.grid.currentRows) {
                    rowY += this.grid.store.rows.get(row)?.height || this.config.rowHeight;
                    row++;
                }
                row = Math.max(0, row - 1);

                if (row >= this.grid.currentRows || row === this.endCell?.row) return;

                const range = {
                    startRow: Math.min(startRow, row),
                    startCol: 0,
                    endRow: Math.max(startRow, row),
                    endCol: this.grid.currentColumns - 1,
                    type: startRow === row ? 'row' : 'row-range'
                };

                if (e.ctrlKey || e.metaKey) {
                    this.selectedRanges = this.selectedRanges.filter(r => r.type !== 'row' && r.type !== 'row-range');
                    this.selectedRanges.push(range);
                } else {
                    this.store.clearSelections();
                    this.selectedRanges = [range];
                }

                this.store.setSelectionRange(range.startRow, range.startCol, range.endRow, range.endCol, true);
                this.endCell = { row: range.endRow, col: range.endCol, address: `${this.grid.columnNumberToLetter(range.endCol)}${range.endRow + 1}` };
                
                this.rerenderSelectionChangeEffect(range);
            });

            verticalHeader.addEventListener('pointerup', (e) => {
                if (this.isHeaderSelecting) {
                    this.isHeaderSelecting = false;
                    startRow = null;
                    hasMoved = false;
                }
            });
        }

        this.canvasContainer.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            console.log("Howww????")

            const x = e.clientX - this.config.headerWidth;
            const y = e.clientY - this.config.headerHeight;
            
            const cell = this.grid.getCurrentCell(x, y);
            if (cell) {
                const range = {
                    startRow: cell.row,
                    startCol: cell.col,
                    endRow: cell.row,
                    endCol: cell.col,
                    type: 'cell'
                };
                console.log(range)

                if (e.ctrlKey || e.metaKey) {
                    this.selectedRanges = this.selectedRanges.filter(r => r.startRow !== cell.row || r.startCol !== cell.col || r.endRow !== cell.row || r.endCol !== cell.col);
                    this.selectedRanges.push(range);
                } else {
                    this.store.clearSelections();
                    this.selectedRanges = [range];
                }

                this.store.setSelectionRange(cell.row, cell.col, cell.row, cell.col, true);
                this.startCell = cell;
                this.endCell = cell;
                this.isSelecting = true;
                this.rerenderSelectionChangeEffect(range);
            }
        });

        this.canvasContainer.addEventListener('pointermove', (e) => {
            if (this.isSelecting && !this.isEditing) {
                const x = e.clientX - this.config.headerWidth;
                const y = e.clientY - this.config.headerHeight;
                
                const cell = this.grid.getCurrentCell(x, y);
                if (cell && (cell.row !== this.endCell?.row || cell.col !== this.endCell?.col)) {
                    this.store.clearSelections();
                    this.endCell = cell;
                    const range = {
                        startRow: this.startCell.row,
                        startCol: this.startCell.col,
                        endRow: cell.row,
                        endCol: cell.col,
                        type: (this.startCell.row === cell.row && this.startCell.col === cell.col) ? 'cell' : 'cell-range'
                    };
                    this.selectedRanges = [range];
                    this.store.setSelectionRange(
                        this.startCell.row,
                        this.startCell.col,
                        this.endCell.row,
                        this.endCell.col,
                        true
                    );
                    this.rerenderSelectionChangeEffect(range);
                }
            }
        });

        this.canvasContainer.addEventListener('pointerup', () => {
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
                const range = { startRow: cell.row, startCol: cell.col, endRow: cell.row, endCol: cell.col, type: 'cell' };
                this.selectedRanges = [range];
                this.store.setSelectionRange(cell.row, cell.col, cell.row, cell.col, true);
                this.createInputBox(cell);
                // Do not render to avoid scrolling
            }
        });

        window.addEventListener('keydown', (e) => {
            if (this.isEditing) return;

            // Handle alphanumeric or special character input to start editing
            const isAlphanumericOrSpecial = /^[a-zA-Z0-9`~!@#$%^&*()_+\-=\[\]{}\\|;:'",.<>\/?]$/.test(e.key);
            if (isAlphanumericOrSpecial && this.startCell) {
                e.preventDefault();
                this.isEditing = true;
                this.store.clearSelections();
                const range = { startRow: this.startCell.row, startCol: this.startCell.col, endRow: this.startCell.row, endCol: this.startCell.col, type: 'cell' };
                this.selectedRanges = [range];
                this.store.setSelectionRange(this.startCell.row, this.startCell.col, this.startCell.row, this.startCell.col, true);
                this.createInputBox(this.startCell, e.key);
                // Do not render to avoid scrolling
                return;
            }

            if (!this.startCell) return;
            
            let newRow = this.startCell.row;
            let newCol = this.startCell.col;

            switch (e.key) {
                case 'Tab':
                    e.preventDefault();
                    if (e.shiftKey) {
                        newCol = Math.max(0, newCol - 1);
                    } else {
                        newCol = Math.min(this.grid.currentColumns - 1, newCol + 1);
                    }
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

            if (newRow === this.startCell.row && newCol === this.startCell.col)
                return;
            
            this.store.clearSelections();
            const range = { startRow: newRow, startCol: newCol, endRow: newRow, endCol: newCol, type: 'cell' };
            this.selectedRanges = [range];
            this.store.setSelectionRange(newRow, newCol, newRow, newCol, true);
            this.grid.scrollToCell(newRow, this.startCell.row, newCol, this.startCell.col);
            this.startCell = { row: newRow, col: newCol, address: `${this.grid.columnNumberToLetter(newCol)}${newRow + 1}` };
            this.endCell = this.startCell;
            this.rerenderSelectionChangeEffect(range);
        });
    }

    saveValue = (row, col, inputBox, range) => {
        this.store.setCellValue(row, col, inputBox.value);
        this.isEditing = false;
        inputBox.remove();
        this.rerenderSelectionChangeEffect(range);
        this.grid.canvasPool.renderCell(row, col); // Optimized: Render only the cell value
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

        const inputBox = document.createElement('input');
        inputBox.type = 'text';
        inputBox.style.position = 'absolute';
        inputBox.style.margin = '0';
        inputBox.style.width = `${width - 6}px`;
        inputBox.style.height = `${height - 2}px`;
        inputBox.style.background = 'white';
        inputBox.style.font = `16px Arial`;
        inputBox.style.color = this.config.colors.cellText;
        inputBox.style.outline = 'none';
        inputBox.style.border = 'none';
        inputBox.style.zIndex = '1000';
        inputBox.style.left = `${left + 3}px`;
        inputBox.style.top = `${top + 1}px`;
        inputBox.value = initialValue || this.store.getCell(cell.row, cell.col).value || '';
        
        this.canvasContainer.appendChild(inputBox);
        inputBox.focus();

        inputBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                // this.store.clearSelections();
                this.saveValue(cell.row, cell.col, inputBox, range);
            } else if (e.key === 'Escape') {
                this.isEditing = false;
                inputBox.value = '';
                inputBox.remove();
            } else if (e.key === 'Tab') {
                // this.store.clearSelections();
                this.saveValue(cell.row, cell.col, inputBox, range);
            }
        });

        inputBox.addEventListener('blur', () => {
            this.saveValue(cell.row, cell.col, inputBox, range);
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

    /**
     * Resets the selection
     */
    reset() {
        this.startCell = null;
        this.endCell = null;
        this.isSelecting = false;
        this.isEditing = false;
        this.isHeaderSelecting = false;
        this.selectedRanges = [];
        this.store.clearSelections();
        this.grid.canvasPool.renderTiles(); // Full redraw to clear selections
        this.grid.headerRenderer.drawColumnHeaders();
        this.grid.headerRenderer.drawRowHeaders();
        this.grid.updateStatusBar();
    }
}