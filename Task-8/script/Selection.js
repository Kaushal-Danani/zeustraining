import { CellValueCommand } from './command-pattern/CellValueCommand.js';

export class Selection {
    constructor(grid, store, config, canvasContainer) {
        this.grid = grid;
        this.store = store;
        this.config = config;
        this.canvasContainer = canvasContainer;

        this.startCell = null;
        this.endCell = null;
        this.activeCell = null;
        this.anchorCell = null;
        this.isEditing = false;
        this.inputBox = null;
        this.isHeaderSelecting = false;
        this.selectedRanges = [];

        this.canvasContainer.setAttribute('tabindex', '0');
    }

    setActiveCell(row, col) {
        this.activeCell = { row, col, address: `${this.grid.columnNumberToLetter(col)}${row + 1}` };
        this.rerenderSelectionChangeEffect({ startRow: row, startCol: col, endRow: row, endCol: col, type: 'cell' });
    }

    setAnchorCell(row, col) {
        this.anchorCell = { row, col, address: `${this.grid.columnNumberToLetter(col)}${row + 1}` };
    }

    rerenderSelectionChangeEffect(range) {
        this.grid.updateStatusBar();
        this.grid.headerRenderer.drawColumnHeaders();
        this.grid.headerRenderer.drawRowHeaders();
        this.grid.canvasPool.renderSelection(range);
    }

    saveValue(row, col, range) {
        // Ensure the cell exists before accessing its value
        let cell = this.store.getCell(row, col);
        const oldValue = cell ? cell.value : '';
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

        this.canvasContainer.focus();
        this.preventFocusLoss();
    }

    preventFocusLoss() {
        this.canvasContainer.addEventListener('blur', (e) => {
            if (!this.isEditing) {
                e.preventDefault();
                this.canvasContainer.focus();
            }
        }, { once: true });
    }

    createInputBox(cell, initialValue = '') {
        let left = 0;
        for (let col = 0; col < cell.col; col++) {
            left += this.grid.columns.get(col)?.width || this.config.columnWidth;
        }
        let width = this.grid.columns.get(cell.col)?.width || this.config.columnWidth;
        let top = 0;
        for (let row = 0; row < cell.row; row++) {
            top += this.grid.store.rows.get(row)?.height || this.config.rowHeight;
        }
        let height = this.grid.store.rows.get(cell.row)?.height || this.config.rowHeight;

        this.inputBox = document.createElement('input');
        this.inputBox.type = 'text';
        this.inputBox.style.position = 'absolute';
        this.inputBox.style.margin = '0';
        this.inputBox.style.padding = '1.5px 3px 1.5px 3px'
        this.inputBox.style.width = `${width + 3}px`;
        this.inputBox.style.height = `${height + 3}px`;
        this.inputBox.style.background = '#FFFFFF';
        this.inputBox.style.font = '16px Arial';
        this.inputBox.style.color = '#000000';
        this.inputBox.style.outline = 'none';
        this.inputBox.style.border = `2px solid ${this.config.colors.selectionBorder}`;
        this.inputBox.style.zIndex = '1000';
        this.inputBox.style.left = `${left - 2}px`;
        this.inputBox.style.top = `${top - 2}px`;
        this.inputBox.value = initialValue || this.store.getCell(cell.row, cell.col).value || '';
        
        this.canvasContainer.appendChild(this.inputBox);
        this.inputBox.focus();

        this.inputBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveValue(cell.row, cell.col, cell);
            } else if (e.key === 'Escape') {
                this.isEditing = false;
                this.inputBox.value = '';
                this.inputBox.remove();
                this.inputBox = null;
                this.canvasContainer.focus();
                this.preventFocusLoss();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.saveValue(cell.row, cell.col, cell);
            }
        });
    }

    getSelectionText(columnNumberToLetter) {
        if (!this.selectedRanges.length || this.selectedRanges.length > 1) 
            return "";
        
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

    // Add method to update anchor cell for a new range
    updateAnchorForRange(range) {
        // Set the anchor cell to the start cell of the latest range
        this.setAnchorCell(range.startRow, range.startCol);
        this.setActiveCell(range.startRow, range.startCol);
    }
}