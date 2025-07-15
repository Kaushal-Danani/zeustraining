export class CellSelectorEvents {

    constructor(grid, selection) {
        this.grid = grid;
        this.selection = selection;
        this.startCell = null;
        this.endCell = null;
        this.isSelecting = false;
        this.lastScrollTime = 0;
        this.autoScrollFrame = null;
        this.lastCursorPos = { x: 0, y: 0 };
        this.bindMouseMove();
    }

    bindMouseMove() {
        document.addEventListener('pointermove', (e) => {
            if (this.isSelecting) {
                this.lastCursorPos = { x: e.clientX, y: e.clientY };
                if (!this.autoScrollFrame) {
                    this.handleAutoScroll();
                }
            }
        });
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

            if (e.ctrlKey) {
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
            this.selection.startCell = cell;
            this.endCell = cell;
            this.selection.endCell = cell;
            this.isSelecting = true;
            this.lastCursorPos = { x: e.clientX, y: e.clientY };
            this.selection.rerenderSelectionChangeEffect(range);
            this.handleAutoScroll();
        }
    }

    pointerMove(e) {
        if (this.isSelecting && !this.selection.isEditing) {
            this.lastCursorPos = { x: e.clientX, y: e.clientY };
            this.updateSelection();
        }
    }

    updateSelection() {
        const canvasRect = this.grid.canvasContainer.getBoundingClientRect();
        let x = this.lastCursorPos.x - canvasRect.left;
        let y = this.lastCursorPos.y - canvasRect.top;
        let scrollX = this.grid.canvasContainer.scrollLeft;
        let scrollY = this.grid.canvasContainer.scrollTop;

        if (this.lastCursorPos.x < canvasRect.left) {
            x = 0;
        } else if (this.lastCursorPos.x > canvasRect.right) {
            x = canvasRect.width;
        }
        if (this.lastCursorPos.y < canvasRect.top) {
            y = 0;
        } else if (this.lastCursorPos.y > canvasRect.bottom) {
            y = canvasRect.height;
        }

        const adjustedX = x + scrollX;
        const adjustedY = y + scrollY;
        const cell = this.grid.getCurrentCell(adjustedX, adjustedY);

        if (cell && (cell.row !== this.endCell?.row || cell.col !== this.endCell?.col)) {
            this.selection.store.clearSelections();
            this.endCell = cell;
            this.selection.endCell = cell;
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

    handleAutoScroll() {
        if (!this.isSelecting || this.selection.isEditing) {
            if (this.autoScrollFrame) {
                cancelAnimationFrame(this.autoScrollFrame);
                this.autoScrollFrame = null;
            }
            return;
        }

        const now = performance.now();
        if (now - this.lastScrollTime < 16) {
            this.autoScrollFrame = requestAnimationFrame(() => this.handleAutoScroll());
            return;
        }
        this.lastScrollTime = now;

        const canvasRect = this.grid.canvasContainer.getBoundingClientRect();
        let scrollX = this.grid.canvasContainer.scrollLeft;
        let scrollY = this.grid.canvasContainer.scrollTop;
        let scrollXDelta = 0;
        let scrollYDelta = 0;
        const maxScrollSpeed = 20;
        const edgeThreshold = 10;

        let outsideCanvas = false;
        if (this.lastCursorPos.x < canvasRect.left) {
            const distance = canvasRect.left - this.lastCursorPos.x;
            scrollXDelta = -Math.min(maxScrollSpeed, distance / edgeThreshold * maxScrollSpeed);
            outsideCanvas = true;
        } else if (this.lastCursorPos.x > canvasRect.right) {
            const distance = this.lastCursorPos.x - canvasRect.right;
            scrollXDelta = Math.min(maxScrollSpeed, distance / edgeThreshold * maxScrollSpeed);
            outsideCanvas = true;
        }
        if (this.lastCursorPos.y < canvasRect.top) {
            const distance = canvasRect.top - this.lastCursorPos.y;
            scrollYDelta = -Math.min(maxScrollSpeed, distance / edgeThreshold * maxScrollSpeed);
            outsideCanvas = true;
        } else if (this.lastCursorPos.y > canvasRect.bottom) {
            const distance = this.lastCursorPos.y - canvasRect.bottom;
            scrollYDelta = Math.min(maxScrollSpeed, distance / edgeThreshold * maxScrollSpeed);
            outsideCanvas = true;
        }

        if (scrollXDelta || scrollYDelta) {
            this.grid.canvasContainer.scrollLeft = Math.max(0, scrollX + scrollXDelta);
            this.grid.canvasContainer.scrollTop = Math.max(0, scrollY + scrollYDelta);
            this.grid.checkAndAdaptContent();
            this.updateSelection();
        }

        if (outsideCanvas) {
            this.autoScrollFrame = requestAnimationFrame(() => this.handleAutoScroll());
        } else if (this.autoScrollFrame) {
            cancelAnimationFrame(this.autoScrollFrame);
            this.autoScrollFrame = null;
        }
    }

    pointerUp(e) {
        if (this.autoScrollFrame) {
            cancelAnimationFrame(this.autoScrollFrame);
            this.autoScrollFrame = null;
        }
        this.isSelecting = false;
    }
}