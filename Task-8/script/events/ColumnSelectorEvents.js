export class ColumnSelectorEvents {

    constructor(grid, selection) {
        this.grid = grid;
        this.selection = selection;
        this.isHeaderSelecting = false; // Track header dragging
        this.startCol = null;
        this.startCell = null;
        this.endCell = null;
    }

    hitTest(e) {
        const horizontalHeader = document.querySelector('#horizontal-header');
        return horizontalHeader && e.target.closest('#horizontal-header') && !e.target.closest('.column-resizer');
    }

    pointerDown(e) {
        const x = e.clientX - this.grid.config.headerWidth + this.grid.scrollX;
        let colX = 0, col = 0;
        while (colX < x && col < this.grid.currentColumns) {
            colX += this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
            col++;
        }
        col = Math.max(0, col - 1);

        // if (col >= this.grid.currentColumns) return;
        this.startCol  = col;
        this.isHeaderSelecting = true;
        const range = {
            startRow: 0,
            startCol: col,
            endRow: this.grid.currentRows - 1,
            endCol: col,
            type: 'column'
        };

        if (e.ctrlKey || e.metaKey) {
            this.selection.selectedRanges = this.selection.selectedRanges.filter(
                r => r.startCol !== col || r.endCol !== col
            );
            this.selection.selectedRanges.push(range);
        } else {
            this.selection.store.clearSelections();
            this.selection.selectedRanges = [range];
        }

        this.selection.store.setSelectionRange(range.startRow, range.startCol, range.endRow, range.endCol, true);
        this.startCell  = { row: range.startRow, col: range.startCol, address: `${this.grid.columnNumberToLetter(range.startCol)}${range.startRow + 1}` };
        this.endCell  = { row: range.endRow, col: range.endCol, address: `${this.grid.columnNumberToLetter(range.endCol)}${range.endRow + 1}` };
        this.selection.rerenderSelectionChangeEffect(range);
    }

    pointerMove(e) {
        if (!this.isHeaderSelecting || this.selection.isEditing)
            return;

        const x = e.clientX - this.grid.config.headerWidth + this.grid.scrollX;
        let colX = 0, col = 0;
        while (colX < x && col < this.grid.currentColumns) {
            colX += this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
            col++;
        }
        col = Math.max(0, col - 1);

        // if (col >= this.grid.currentColumns || col === this.endCell ?.col) return;
        const range = {
            startRow: 0,
            startCol: Math.min(this.startCol , col),
            endRow: this.grid.currentRows - 1,
            endCol: Math.max(this.startCol , col),
            type: this.startCol  === col ? 'column' : 'column-range'
        };

        if (e.ctrlKey || e.metaKey) {
            this.selection.selectedRanges = this.selection.selectedRanges.filter(
                r => r.type !== 'column' && r.type !== 'column-range'
            );
            this.selection.selectedRanges.push(range);
        } else {
            this.selection.store.clearSelections();
            this.selection.selectedRanges = [range];
        }

        this.selection.store.setSelectionRange(range.startRow, range.startCol, range.endRow, range.endCol, true);
        this.endCell  = { row: range.endRow, col: range.endCol, address: `${this.grid.columnNumberToLetter(range.endCol)}${range.endRow + 1}` };
        this.selection.rerenderSelectionChangeEffect(range);
    }

    pointerUp(e) {
        this.isHeaderSelecting = false;
        this.startCol  = null;
    }
}