export class EventManager {

    constructor(grid, selection) {
        this.grid = grid;
        this.selection = selection;
        this.eventHandlers = [];
        this.currHandler = null;
        this.startCell = null;
        this.endCell = null;

        this.setupEventListeners();
    }

    /**
    * Sets up event listeners on the canvas container
    */
    setupEventListeners() {
        const canvasContainer = this.grid.canvasContainer;
        window.addEventListener('pointerdown', (e) => this.pointerDown(e));
        window.addEventListener('pointermove', (e) => this.pointerMove(e));
        window.addEventListener('pointerup', (e) => this.pointerUp(e));
        canvasContainer.addEventListener('dblclick', (e) => this.dblclick(e));
        canvasContainer.addEventListener('keydown', (e) => this.keyDown(e));
    }

    registerHandler(handler) {
        this.eventHandlers.push(handler);
    }

    pointerDown(e) {
        for (const handler of this.eventHandlers) {
            if (handler.hitTest(e)) {
                this.currHandler = handler;
                break;
            }
        }

        if (this.currHandler)
            this.currHandler.pointerDown(e);
    }

    pointerMove(e) {
        if (this.currHandler)
            this.currHandler.pointerMove(e);
        else {
            for (const handler of this.eventHandlers) {
                if (handler.hitTest(e))
                    // setCursor();
                    break;
            }
        }
    }

    pointerUp(e) {
        if (this.currHandler)
            this.currHandler.pointerUp(e);
        this.currHandler = null;
    }

    dblclick(e) {
        if (this.selection.isEditing)
            return;

        const x = e.clientX - this.grid.config.headerWidth;
        const y = e.clientY - this.grid.config.headerHeight;

        const cell = this.grid.getCurrentCell(x, y);
        if (cell) {
            this.startCell = cell;
            this.endCell = cell;
            this.selection.isEditing = true;
            this.selection.store.clearSelections();
            const range = { startRow: cell.row, startCol: cell.col, endRow: cell.row, endCol: cell.col, type: 'cell' };
            this.selection.selectedRanges = [range];
            this.selection.store.setSelectionRange(cell.row, cell.col, cell.row, cell.col, true);
            this.selection.createInputBox(cell);
        }
    }

    keyDown(e) {
        if (this.selection.isEditing)
            return;

        this.startCell = this.selection.startCell;
        this.endCell = this.selection.endCell;

        // Handle alphanumeric or special character input to start editing
        const isAlphanumericOrSpecial = /^[a-zA-Z0-9`~!@#$%^&*()_+\-=\[\]{}\\|;:'",.<>\/?]$/.test(e.key);
        if (isAlphanumericOrSpecial && this.startCell) {
            e.preventDefault();
            this.selection.isEditing = true;
            this.selection.store.clearSelections();
            const range = { startRow: this.startCell.row, startCol: this.startCell.col, endRow: this.startCell.row, endCol: this.startCell.col, type: 'cell' };
            this.selection.selectedRanges = [range];
            this.selection.store.setSelectionRange(this.startCell.row, this.startCell.col, this.startCell.row, this.startCell.col, true);
            this.selection.createInputBox(this.startCell, e.key);
            return;
        }

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

        this.selection.store.clearSelections();
        const range = { startRow: newRow, startCol: newCol, endRow: newRow, endCol: newCol, type: 'cell' };
        this.selection.selectedRanges = [range];
        this.selection.store.setSelectionRange(newRow, newCol, newRow, newCol, true);
        this.grid.scrollToCell(newRow, this.startCell.row, newCol, this.startCell.col);
        this.startCell = { row: newRow, col: newCol, address: `${this.grid.columnNumberToLetter(newCol)}${newRow + 1}` };
        this.endCell = this.startCell;
        this.selection.startCell = this.startCell; // Global access for next key event and keep track of previous cell
        this.selection.endCell = this.endCell; // Global access for next key event and keep track of previous cell
        
        this.selection.rerenderSelectionChangeEffect(range);
    }
}	
