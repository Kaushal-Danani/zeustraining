/**
 * Manages cell selection and ranges
 */
 export class SelectionManager {
    constructor(grid) {
        this.grid = grid;
        this.startCell = null;
        this.endCell = null;
        this.isSelecting = false;
        this.selectionCanvas = document.createElement('canvas');
        this.selectionCanvas.className = 'selection-canvas';
        this.selectionCanvas.style.position = 'absolute';
        this.selectionCanvas.style.pointerEvents = 'none';
        this.grid.canvasContainer.appendChild(this.selectionCanvas);
        this.updateSelectionCanvasSize();
        this.setupEventListeners();
    }

    updateSelectionCanvasSize() {
        const dpr = window.devicePixelRatio || 1;
        this.selectionCanvas.width = this.grid.viewportWidth * dpr;
        this.selectionCanvas.height = this.grid.viewportHeight * dpr;
        this.selectionCanvas.style.width = `${this.grid.viewportWidth}px`;
        this.selectionCanvas.style.height = `${this.grid.viewportHeight}px`;
        const ctx = this.selectionCanvas.getContext('2d');
        ctx.scale(dpr, dpr);
    }

    setupEventListeners() {
        this.grid.canvasContainer.addEventListener('mousedown', (e) => {
            if (this.grid.rowManager.isResizing || this.grid.columnManager.isResizing) return;
            const cell = this.grid.getCurrentCell(
                e.clientX - this.grid.canvasContainer.getBoundingClientRect().left,
                e.clientY - this.grid.canvasContainer.getBoundingClientRect().top
            );
            this.startCell = cell;
            this.endCell = cell;
            this.isSelecting = true;
            this.renderSelection();
        });

        this.grid.canvasContainer.addEventListener('mousemove', (e) => {
            if (!this.isSelecting) return;
            const cell = this.grid.getCurrentCell(
                e.clientX - this.grid.canvasContainer.getBoundingClientRect().left,
                e.clientY - this.grid.canvasContainer.getBoundingClientRect().top
            );
            this.endCell = cell;
            this.renderSelection();
        });

        document.addEventListener('mouseup', () => {
            this.isSelecting = false;
        });
    }

    renderSelection() {
        const ctx = this.selectionCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.grid.viewportWidth, this.grid.viewportHeight);

        if (!this.startCell || !this.endCell) return;

        const startRow = Math.min(this.startCell.row, this.endCell.row);
        const endRow = Math.max(this.startCell.row, this.endCell.row);
        const startCol = Math.min(this.startCell.col, this.endCell.col);
        const endCol = Math.max(this.startCell.col, this.endCell.col);

        let x = this.grid.config.headerWidth + this.grid.columnManager.getCumulativeWidth(startCol) - this.grid.scrollX;
        let y = this.grid.config.headerHeight + this.grid.rowManager.getCumulativeHeight(startRow) - this.grid.scrollY;
        let width = this.grid.columnManager.getCumulativeWidth(endCol + 1) - this.grid.columnManager.getCumulativeWidth(startCol);
        let height = this.grid.rowManager.getCumulativeHeight(endRow + 1) - this.grid.rowManager.getCumulativeHeight(startRow);

        ctx.fillStyle = this.grid.config.colors.selectionFill;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = this.grid.config.colors.selectionBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    getSelectedRange() {
        if (!this.startCell || !this.endCell) return null;
        return {
            startRow: Math.min(this.startCell.row, this.endCell.row),
            endRow: Math.max(this.startCell.row, this.endCell.row),
            startCol: Math.min(this.startCell.col, this.endCell.col),
            endCol: Math.max(this.startCell.col, this.endCell.col)
        };
    }
}