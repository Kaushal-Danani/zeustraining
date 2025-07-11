export class RowSelectorEvents {

    constructor(grid, selection) {
        this.grid = grid;
        this.selection = selection;
        this.isHeaderSelecting = false; // Track header dragging
        this.startRow = null;
        this.startCell = null;
        this.endCell = null;
    }

    hitTest(e) {
        const verticalHeader = document.querySelector('#vertical-header');
        return verticalHeader && e.target.closest('#vertical-header') && !e.target.closest('.row-resizer');
    }

    pointerDown(e) {
        const y = e.clientY - this.grid.config.headerHeight + this.grid.scrollY;
        let rowY = 0, row = 0;
        while (rowY < y && row < this.grid.currentRows) {
            rowY += this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;
            row++;
        }
        row = Math.max(0, row - 1);

        this.startRow = row;
        this.isHeaderSelecting = true;
        const range = {
            startRow: row,
            startCol: 0,
            endRow: row,
            endCol: this.grid.currentColumns - 1,
            type: 'row'
        };

        if (e.ctrlKey || e.metaKey) {
            this.selection.selectedRanges = this.selection.selectedRanges.filter(
                r => r.startRow !== row || r.endRow !== row
            );
            this.selection.selectedRanges.push(range);
        } else {
            this.selection.store.clearSelections();
            this.selection.selectedRanges = [range];
        }

        this.selection.store.setSelectionRange(range.startRow, range.startCol, range.endRow, range.endCol, true);
        this.startCell = { row: range.startRow, col: range.startCol, address: `${this.grid.columnNumberToLetter(range.startCol)}${range.startRow + 1}` };
        this.endCell = { row: range.endRow, col: range.endCol, address: `${this.grid.columnNumberToLetter(range.endCol)}${range.endRow + 1}` };
        this.selection.rerenderSelectionChangeEffect(range);
    }

    pointerMove(e) {
        if (!this.isHeaderSelecting || this.selection.isEditing)
            return;

        const y = e.clientY - this.grid.config.headerHeight + this.grid.scrollY;
        let rowY = 0, row = 0;
        while (rowY < y && row < this.grid.currentRows) {
            rowY += this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;
            row++;
        }
        row = Math.max(0, row - 1);

        const range = {
            startRow: Math.min(this.startRow, row),
            startCol: 0,
            endRow: Math.max(this.startRow, row),
            endCol: this.grid.currentColumns - 1,
            type: this.startRow === row ? 'row' : 'row-range'
        };

        if (e.ctrlKey || e.metaKey) {
            this.selection.selectedRanges = this.selection.selectedRanges.filter(
                r => r.type !== 'row' && r.type !== 'row-range'
            );
            this.selection.selectedRanges.push(range);
        } else {
            this.selection.store.clearSelections();
            this.selection.selectedRanges = [range];
        }

        this.selection.store.setSelectionRange(range.startRow, range.startCol, range.endRow, range.endCol, true);
        this.endCell = { row: range.endRow, col: range.endCol, address: `${this.grid.columnNumberToLetter(range.endCol)}${range.endRow + 1}` };
        this.selection.rerenderSelectionChangeEffect(range);
    }

    pointerUp(e) {
        this.isHeaderSelecting = false;
        this.startRow = null;
    }
}