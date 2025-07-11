export class ColumnResizerEvents {

    constructor(grid, selection) {
        this.grid = grid;
        this.selection = selection;
        this.startX = 0;
        this.startWidth = 0;
        this.colIndex = null;
        this.dashedLine = null;
    }

    hitTest(e) {
        return e.target.closest('.column-resizer');
    }

    pointerDown(e) {
        this.colIndex = parseInt(e.target.dataset.colIndex);
        this.startX = e.clientX;
        this.startWidth = this.grid.columns.get(this.colIndex)?.width || this.grid.config.columnWidth;

        this.dashedLine = document.createElement('div');
        this.dashedLine.style.position = 'absolute';
        this.dashedLine.style.left = `${parseFloat(e.target.style.left)}px`;
        this.dashedLine.style.top = `${this.grid.config.headerHeight}px`;
        this.dashedLine.style.width = '2px';
        this.dashedLine.style.height = `${this.grid.viewportHeight}px`;
        this.dashedLine.style.borderLeft = `2px dashed ${this.grid.config.resizerColor}`;
        this.dashedLine.style.pointerEvents = 'none';
        this.grid.container.appendChild(this.dashedLine);
    }

    pointerMove(e) {
        if (this.colIndex === null)
            return;

        const deltaX = e.clientX - this.startX;
        const newWidth = Math.max(2, this.startWidth + deltaX);
        e.target.style.left = `${this.startX + deltaX}px`;
        if (this.dashedLine && (e.clientX > (this.startX - this.startWidth))) {
            this.dashedLine.style.left = `${this.startX + deltaX}px`;
        }
        this.grid.columns.get(this.colIndex).setWidth(newWidth);
        this.grid.headerRenderer.drawColumnHeaders();
    }

    pointerUp(e) {
        if (this.colIndex === null)
            return;

        const deltaX = e.clientX - this.startX;
        const newWidth = Math.max(2, this.startWidth + deltaX);
        this.grid.columns.get(this.colIndex).setWidth(newWidth);

        if (this.dashedLine) {
            this.dashedLine.remove();
            this.dashedLine = null;
        }

        this.grid.updateScrollContent();
        this.grid.setupResizeHandles();
        this.grid.canvasPool.renderGridLines();
        this.grid.headerRenderer.drawColumnHeaders();
        this.colIndex = null;
    }
}