import { ExcelGrid } from "./ExcelGrid.js";

/**
 * Manages a pool of canvas elements for dynamic rendering
 */
export class CanvasPool {
    /**
     * Initializes the CanvasPool object
     * @param {ExcelGrid} grid - Reference to the main ExcelGrid instance
     * @param {Object} options - Configuration options for the canvas pool
     */
    constructor(grid, options = {}) {
        this.grid = grid;
        this.activeTiles = new Map();
        this.canvasPool = [];
        this.tileSize = options.tileSize || 800;
        this.container = grid.canvasContainer;
    }

    getTileKey(tileX, tileY) {
        return `${tileX}_${tileY}`;
    }

    getVisibleTiles(viewportX, viewportY, viewportWidth, viewportHeight) {
        const buffer = this.tileSize * 0.2;
        
        const startTileX = Math.floor(Math.max(0, viewportX - buffer) / this.tileSize);
        const endTileX = Math.floor((viewportX + viewportWidth + buffer) / this.tileSize);
        const startTileY = Math.floor(Math.max(0, viewportY - buffer) / this.tileSize);
        const endTileY = Math.floor((viewportY + viewportHeight + buffer) / this.tileSize);
        
        const tiles = [];
        for (let x = startTileX; x <= endTileX; x++) {
            for (let y = startTileY; y <= endTileY; y++) {
                tiles.push({ tileX: x, tileY: y });
            }
        }
        return tiles;
    }

    createNewCanvas() {
        const canvas = document.createElement('canvas');
        canvas.className = 'grid-tile';
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = this.tileSize * dpr;
        canvas.height = this.tileSize * dpr;
        canvas.style.width = `${this.tileSize}px`;
        canvas.style.height = `${this.tileSize}px`;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        this.container.appendChild(canvas);
        return canvas;
    }

    positionCanvas(canvas, tileX, tileY) {
        const pixelX = tileX * this.tileSize;
        const pixelY = tileY * this.tileSize;
        
        canvas.style.left = `${pixelX}px`;
        canvas.style.top = `${pixelY}px`;
        canvas.style.display = 'block';
    }

    createTile(tileX, tileY) {
        const tileKey = this.getTileKey(tileX, tileY);
        
        if (this.activeTiles.has(tileKey)) {
            const canvas = this.activeTiles.get(tileKey);
            const dpr = window.devicePixelRatio || 1;
            canvas.width = this.tileSize * dpr;
            canvas.height = this.tileSize * dpr;
            canvas.style.width = `${this.tileSize}px`;
            canvas.style.height = `${this.tileSize}px`;
            
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            this.positionCanvas(canvas, tileX, tileY);
            this.renderTile(canvas, tileX, tileY);
            return canvas;
        }
        
        let canvas;
        if (this.canvasPool.length > 0) {
            canvas = this.canvasPool.pop();
        } else {
            canvas = this.createNewCanvas();
        }
        
        this.positionCanvas(canvas, tileX, tileY);
        this.renderTile(canvas, tileX, tileY);
        this.activeTiles.set(tileKey, canvas);
        
        return canvas;
    }

    removeTile(tileKey) {
        const canvas = this.activeTiles.get(tileKey);
        if (canvas) {
            canvas.style.display = 'none';
            this.canvasPool.push(canvas);
            this.activeTiles.delete(tileKey);
        }
    }

    renderTile(canvas, tileX, tileY) {
        const ctx = canvas.getContext('2d');
        const config = this.grid.config;
        
        ctx.clearRect(0, 0, this.tileSize, this.tileSize);
        
        const tileStartX = tileX * this.tileSize;
        const tileStartY = tileY * this.tileSize;
        
        // Calculate column and row ranges based on variable widths and heights
        let startCol = 0;
        let endCol = 0;
        let colX = 0;
        for (let col = 0; col < this.grid.currentColumns; col++) {
            const colWidth = this.grid.columns.get(col)?.width || config.columnWidth;
            if (colX >= tileStartX - colWidth && colX <= tileStartX + this.tileSize) {
                if (!startCol && colX >= tileStartX) startCol = col;
                endCol = col + 1;
            }
            colX += colWidth;
        }
        endCol = Math.min(endCol, this.grid.currentColumns);

        let startRow = 0;
        let endRow = 0;
        let rowY = 0;
        for (let row = 0; row < this.grid.currentRows; row++) {
            const rowHeight = this.grid.store.rows.get(row)?.height || config.rowHeight;
            if (rowY >= tileStartY - rowHeight && rowY <= tileStartY + this.tileSize) {
                if (!startRow && rowY >= tileStartY) startRow = row;
                endRow = row + 1;
            }
            rowY += rowHeight;
        }
        endRow = Math.min(endRow, this.grid.currentRows);

        ctx.font = '16px Arial';
        ctx.lineWidth = 1 / window.devicePixelRatio;
        
        // Draw cells background
        ctx.fillStyle = config.colors.cellBg;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Draw vertical grid lines
        ctx.strokeStyle = config.colors.gridLine;
        ctx.beginPath();
        colX = -tileStartX;
        for (let col = 0; col < this.grid.currentColumns; col++) {
            const colWidth = this.grid.columns.get(col)?.width || config.columnWidth;
            const canvasX = colX + colWidth;
            if (canvasX >= -1 && canvasX <= this.tileSize + 1) {
                ctx.moveTo(canvasX - 0.5, 0);
                ctx.lineTo(canvasX - 0.5, this.tileSize);
            }
            colX += colWidth;
        }
        ctx.stroke();
        
        // Draw horizontal grid lines
        ctx.beginPath();
        rowY = -tileStartY;
        for (let row = 0; row < this.grid.currentRows; row++) {
            const rowHeight = this.grid.store.rows.get(row)?.height || config.rowHeight;
            const canvasY = rowY + rowHeight;
            if (canvasY >= -1 && canvasY <= this.tileSize + 1) {
                ctx.moveTo(0, canvasY - 0.5);
                ctx.lineTo(this.tileSize, canvasY - 0.5);
            }
            rowY += rowHeight;
        }
        ctx.stroke();
        
        // Draw cell values
        ctx.fillStyle = config.colors.cellText;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        rowY = -tileStartY;
        for (let row = startRow; row < endRow; row++) {
            const rowHeight = this.grid.store.rows.get(row)?.height || config.rowHeight;
            colX = -tileStartX;
            for (let col = startCol; col < endCol; col++) {
                const colWidth = this.grid.columns.get(col)?.width || config.columnWidth;
                const cell = this.grid.store.getCell(row, col);
                if (cell.value) {
                    const canvasX = colX + 2;
                    const canvasY = rowY + rowHeight / 2;
                    ctx.fillText(cell.value, canvasX, canvasY);
                }
                colX += colWidth;
            }
            rowY += rowHeight;
        }
    }

    /**
     * Re-renders all active tiles (used after cell value changes)
     */
    renderTiles() {
        this.activeTiles.forEach((canvas, tileKey) => {
            const [tileX, tileY] = tileKey.split('_').map(Number);
            this.renderTile(canvas, tileX, tileY);
        });
    }

    updateVisibleTiles(scrollX, scrollY, viewportWidth, viewportHeight) {
        const visibleTiles = this.getVisibleTiles(scrollX, scrollY, viewportWidth, viewportHeight);
        const newActiveTiles = new Set();
        
        visibleTiles.forEach(({tileX, tileY}) => {
            const tileKey = this.getTileKey(tileX, tileY);
            newActiveTiles.add(tileKey);
            this.createTile(tileX, tileY);
        });
        
        this.activeTiles.forEach((canvas, tileKey) => {
            if (!newActiveTiles.has(tileKey)) {
                this.removeTile(tileKey);
            }
        });
    }
}