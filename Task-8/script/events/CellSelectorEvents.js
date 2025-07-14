export class CellSelectorEvents {

    constructor(grid, selection) {
        this.grid = grid;
        this.selection = selection;
        this.startCell = null;
        this.endCell = null;
        this.isSelecting = false;
    }

    hitTest(e) {
        const x = e.clientX - this.grid.config.headerWidth;
        const y = e.clientY - this.grid.config.headerHeight;
        return x >= 0 && y >= 0 && !e.target.closest('.column-resizer') && !e.target.closest('.row-resizer');
    }

    pointerDown(e) {
        if (this.selection.isEditing) {
            const range = this.selection.selectedRanges.find(r => r.startRow === this.startCell.row && r.startCol === this.startCell.col && r.endRow === this.endCell.row && r.endCol === this.endCell.col);
            this.selection.saveValue(this.startCell.row, this.startCell.col, range);
        }

        const x = e.clientX - this.grid.config.headerWidth;
        const y = e.clientY - this.grid.config.headerHeight;
        const cell = this.grid.getCurrentCell(x, y);
        if (cell) {
            const range = {
                startRow: cell.row,
                startCol: cell.col,
                endRow: cell.row,
                endCol: cell.col,
                type: 'cell'
            };

            if (e.ctrlKey || e.metaKey) {
                this.selection.selectedRanges = this.selection.selectedRanges.filter(
                    r => r.startRow !== cell.row || r.startCol !== cell.col || r.endRow !== cell.row || r.endCol !== cell.col
                );
                this.selection.selectedRanges.push(range);
            } else {
                this.selection.store.clearSelections();
                this.selection.selectedRanges = [range];
            }

            this.selection.store.setSelectionRange(cell.row, cell.col, cell.row, cell.col, true);
            this.startCell = cell;
            this.selection.startCell = cell; // For global access in keydown event
            this.endCell = cell;
            this.selection.endCell = cell; // For global access in keydown event
            this.isSelecting = true;
            this.selection.rerenderSelectionChangeEffect(range);
        }
    }

    pointerMove(e) {
        if (this.isSelecting && !this.selection.isEditing) {
            const x = e.clientX - this.grid.config.headerWidth;
            const y = e.clientY - this.grid.config.headerHeight;

            const cell = this.grid.getCurrentCell(x, y);
            if (cell && (cell.row !== this.endCell?.row || cell.col !== this.endCell?.col)) {
                this.selection.store.clearSelections();
                this.endCell = cell;
                this.selection.endCell = cell; // For global access in keydown event
                const range = {
                    startRow: this.startCell.row,
                    startCol: this.startCell.col,
                    endRow: cell.row,
                    endCol: cell.col,
                    type: (this.startCell.row === cell.row && this.startCell.col === cell.col) ? 'cell' : 'cell-range'
                };
                this.selection.selectedRanges = [range];
                this.selection.store.setSelectionRange(
                    this.startCell.row,
                    this.startCell.col,
                    this.endCell.row,
                    this.endCell.col,
                    true
                );
                this.selection.rerenderSelectionChangeEffect(range);
            }
        }
    }

    pointerUp(e) {
        this.isSelecting = false;
    }
}