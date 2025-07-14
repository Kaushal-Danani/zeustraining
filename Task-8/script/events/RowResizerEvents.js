import { RowResizeCommand } from "../command-pattern/RowResizeCommand.js";

export class RowResizerEvents {
    
    constructor(grid, selection) {
        this.grid = grid;
        this.selection = selection;
        this.startY = 0;
        this.startHeight = 0;
        this.rowIndex = null;
        this.dashedLine = null;
    }

    hitTest(e) {
        return e.target.closest('.row-resizer');
    }

    pointerDown(e) {
        this.rowIndex = parseInt(e.target.dataset.rowIndex);
        this.startY = e.clientY;
        this.startHeight = this.grid.store.rows.get(this.rowIndex)?.height || this.grid.config.rowHeight;

        this.dashedLine = document.createElement('div');
        this.dashedLine.style.position = 'absolute';
        this.dashedLine.style.left = `${this.grid.config.headerWidth}px`;
        this.dashedLine.style.top = `${parseFloat(e.target.style.top) + this.grid.config.resizerSize / 2}px`;
        this.dashedLine.style.width = `${this.grid.viewportWidth}px`;
        this.dashedLine.style.height = '2px';
        this.dashedLine.style.borderTop = `2px dashed ${this.grid.config.resizerColor}`;
        this.dashedLine.style.pointerEvents = 'none';
        this.grid.container.appendChild(this.dashedLine);
    }

    pointerMove(e) {
        if (this.rowIndex === null)
            return;

        const deltaY = e.clientY - this.startY;
        const newHeight = Math.max(2, this.startHeight + deltaY);
        e.target.style.top = `${this.startY + deltaY}px`;
        if (this.dashedLine && (e.clientY > (this.startY - this.startHeight))) {
            this.dashedLine.style.top = `${this.startY + deltaY}px`;
        }
        this.grid.store.rows.get(this.rowIndex).setHeight(newHeight);
        this.grid.headerRenderer.drawRowHeaders();
    }

    pointerUp(e) {
        if (this.rowIndex === null)
            return;

        const deltaY = e.clientY - this.startY;
        const newHeight = Math.max(2, this.startHeight + deltaY);
        this.grid.store.rows.get(this.rowIndex).setHeight(newHeight);
        if (newHeight !== this.startHeight) {
            const command = new RowResizeCommand(this.grid, this.rowIndex, newHeight, this.startHeight);
            this.grid.commandManager.executeCommand(command);
        }

        if (this.dashedLine) {
            this.dashedLine.remove();
            this.dashedLine = null;
        }

        this.grid.updateScrollContent();
        this.grid.setupResizeHandles();
        this.grid.canvasPool.renderGridLines();
        this.grid.headerRenderer.drawRowHeaders();
        this.rowIndex = null;
    }
}