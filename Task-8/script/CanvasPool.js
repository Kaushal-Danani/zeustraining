import { ExcelGrid } from "./ExcelGrid.js";
import { TileRenderer } from "./TileRenderer.js";

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
        this.tileRenderer = new TileRenderer(grid, this.tileSize);
        this.previousSelections = new Set(); // Cache previous selection ranges
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

    rowRangeOfTile(rowY, endRow, tileStartY, startRow) {
        for (let row = 0; row < this.grid.currentRows; row++) {
            const rowHeight = this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;
            if (rowY >= tileStartY - rowHeight && rowY <= tileStartY + this.tileSize) {
                if (!startRow && rowY >= tileStartY)
                    startRow = row;
                endRow = row + 1;
            }
            rowY += rowHeight;
        }
        return { rowY, endRow, startRow };
    }

    columnRangeOfTile(colX, endCol, tileStartX, startCol) {
        for (let col = 0; col < this.grid.currentColumns; col++) {
            const colWidth = this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
            if (colX >= tileStartX - colWidth && colX <= tileStartX + this.tileSize) {
                if (!startCol && colX >= tileStartX) 
                    startCol = col;
                endCol = col + 1;
            }
            colX += colWidth;
        }
        return { colX, endCol, startCol };
    }

    renderTile(canvas, tileX, tileY) {
        // Full tile rendering: grid lines, selections, and cell values
        this.tileRenderer.drawGridLines(canvas, tileX, tileY);

        if (!this.grid.selection.isEditing) {
            this.grid.selection.selectedRanges.forEach(range => {
                this.tileRenderer.drawSelection(canvas, tileX, tileY, range);
            });
        }

        const tileStartX = tileX * this.tileSize;
        const tileStartY = tileY * this.tileSize;
        let startRow = 0;
        let endRow = 0;
        let rowY = 0;
        ({ rowY, endRow, startRow } = this.rowRangeOfTile(rowY, endRow, tileStartY, startRow));
        endRow = Math.min(endRow, this.grid.currentRows);

        let startCol = 0;
        let endCol = 0;
        let colX = 0;
        ({ colX, endCol, startCol } = this.columnRangeOfTile(colX, endCol, tileStartX, startCol));
        endCol = Math.min(endCol, this.grid.currentColumns);

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                this.tileRenderer.drawCellValue(canvas, tileX, tileY, row, col);
            }
        }
    }

    /**
     * Re-renders all active tiles (used after major changes)
     */
    renderTiles() {
        this.activeTiles.forEach((canvas, tileKey) => {
            const [tileX, tileY] = tileKey.split('_').map(Number);
            this.renderTile(canvas, tileX, tileY);
        });
        // Update previous selections cache
        this.previousSelections = new Set(this.grid.selection.selectedRanges.map(range => JSON.stringify(range)));
    }

    /**
     * Renders a single cell's value across affected tiles
     * @param {number} row - Row index of the cell
     * @param {number} col - Column index of the cell
     */
    renderCell(row, col) {
        this.activeTiles.forEach((canvas, tileKey) => {
            const [tileX, tileY] = tileKey.split('_').map(Number);
            const tileStartX = tileX * this.tileSize;
            const tileStartY = tileY * this.tileSize;

            // Check if the cell is within the tile's bounds
            let colX = -tileStartX;
            for (let c = 0; c <= col; c++) {
                colX += this.grid.columns.get(c)?.width || this.grid.config.columnWidth;
            }
            let rowY = -tileStartY;
            for (let r = 0; r <= row; r++) {
                rowY += this.grid.store.rows.get(r)?.height || this.grid.config.rowHeight;
            }
            const colWidth = this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
            const rowHeight = this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;

            const ctx = canvas.getContext('2d');
            if (colX >= -colWidth && colX <= this.tileSize && rowY >= -rowHeight && rowY <= this.tileSize) {
                ctx.save();
                ctx.beginPath();

                // Redraw grid lines within the cell
                ctx.strokeStyle = this.grid.config.colors.gridLine;
                ctx.lineWidth = 1 / window.devicePixelRatio;
                ctx.beginPath();
                if (colWidth > 5) {
                    ctx.moveTo(colX - 0.5, rowY); // Left border
                    ctx.lineTo(colX - 0.5, rowY + rowHeight);
                    ctx.moveTo(colX + colWidth - 0.5, rowY); // Right border
                    ctx.lineTo(colX + colWidth - 0.5, rowY + rowHeight);
                }
                if (rowHeight > 5) {
                    ctx.moveTo(colX, rowY - 0.5); // Top border
                    ctx.lineTo(colX + colWidth, rowY - 0.5);
                    ctx.moveTo(colX, rowY + rowHeight - 0.5); // Bottom border
                    ctx.lineTo(colX + colWidth, rowY + rowHeight - 0.5);
                }
                ctx.stroke();

                // Draw the cell value
                this.tileRenderer.drawCellValue(canvas, tileX, tileY, row, col);
                ctx.restore();
            }
        });
    }

    /**
     * Renders a single selection range across affected tiles
     * @param {Object} range - Selection range object
     */
    renderSelection(range) {
        const currentSelections = new Set(this.grid.selection.selectedRanges.map(r => JSON.stringify(r)));
        const allSelections = new Set([...this.previousSelections, ...currentSelections]);

        this.activeTiles.forEach((canvas, tileKey) => {
            const [tileX, tileY] = tileKey.split('_').map(Number);
            const tileStartX = tileX * this.tileSize;
            const tileStartY = tileY * this.tileSize;
            const ctx = canvas.getContext('2d');

            // Calculate the bounding box of all affected selections
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            allSelections.forEach(sel => {
                const r = JSON.parse(sel);
                let left = -tileStartX;
                for (let col = 0; col < Math.min(r.startCol, r.endCol); col++) {
                    left += this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
                }
                let width = 0;
                for (let col = Math.min(r.startCol, r.endCol); col <= Math.max(r.startCol, r.endCol); col++) {
                    width += this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
                }
                let top = -tileStartY;
                for (let row = 0; row < Math.min(r.startRow, r.endRow); row++) {
                    top += this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;
                }
                let height = 0;
                for (let row = Math.min(r.startRow, r.endRow); row <= Math.max(r.startRow, r.endRow); row++) {
                    height += this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;
                }
                if (left < this.tileSize && left + width > 0 && top < this.tileSize && top + height > 0) {
                    minX = Math.min(minX, left);
                    maxX = Math.max(maxX, left + width);
                    minY = Math.min(minY, top);
                    maxY = Math.max(maxY, top + height);
                }
            });

            if (minX !== Infinity) {
                // Clip to the affected area
                ctx.save();
                ctx.beginPath();
                const padding = 4; // Extra padding to clear selection borders
                ctx.rect(minX - padding, minY - padding, maxX - minX + 2 * padding, maxY - minY + 2 * padding);
                ctx.clip();

                // Clear the affected area
                ctx.fillStyle = this.grid.config.colors.cellBg;
                ctx.fillRect(minX - padding, minY - padding, maxX - minX + 2 * padding, maxY - minY + 2 * padding);

                // Redraw grid lines in the affected area
                let colX = -tileStartX;
                for (let col = 0; col < this.grid.currentColumns; col++) {
                    const colWidth = this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
                    if (colX + colWidth >= minX - padding && colX + colWidth <= maxX + padding && colWidth > 5) {
                        ctx.strokeStyle = this.grid.config.colors.gridLine;
                        ctx.lineWidth = 1 / window.devicePixelRatio;
                        ctx.beginPath();
                        ctx.moveTo(colX + colWidth - 0.5, minY - padding);
                        ctx.lineTo(colX + colWidth - 0.5, maxY + padding);
                        ctx.stroke();
                    }
                    colX += colWidth;
                }

                let rowY = -tileStartY;
                for (let row = 0; row < this.grid.currentRows; row++) {
                    const rowHeight = this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;
                    if (rowY + rowHeight >= minY - padding && rowY + rowHeight <= maxY + padding && rowHeight > 5) {
                        ctx.strokeStyle = this.grid.config.colors.gridLine;
                        ctx.lineWidth = 1 / window.devicePixelRatio;
                        ctx.beginPath();
                        ctx.moveTo(minX - padding, rowY + rowHeight - 0.5);
                        ctx.lineTo(maxX + padding, rowY + rowHeight - 0.5);
                        ctx.stroke();
                    }
                    rowY += rowHeight;
                }

                // Draw all current selections
                if (!this.grid.selection.isEditing) {
                    this.grid.selection.selectedRanges.forEach(selRange => {
                        this.tileRenderer.drawSelection(canvas, tileX, tileY, selRange);
                    });
                }

                // Redraw cell values in the affected area
                rowY = -tileStartY;
                for (let row = 0; row < this.grid.currentRows; row++) {
                    const rowHeight = this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;
                    if (rowY >= minY - rowHeight - padding && rowY <= maxY + padding) {
                        colX = -tileStartX;
                        for (let col = 0; col < this.grid.currentColumns; col++) {
                            const colWidth = this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
                            if (colX >= minX - colWidth - padding && colX <= maxX + padding) {
                                this.tileRenderer.drawCellValue(canvas, tileX, tileY, row, col);
                            }
                            colX += colWidth;
                        }
                    }
                    rowY += rowHeight;
                }
                ctx.restore();
            }
        });

        // Update previous selections cache
        this.previousSelections = currentSelections;
    }

    /**
     * Renders grid lines across all active tiles (used after resizing)
     */
    renderGridLines() {
        this.activeTiles.forEach((canvas, tileKey) => {
            const [tileX, tileY] = tileKey.split('_').map(Number);
            this.tileRenderer.drawGridLines(canvas, tileX, tileY);
            // Redraw cell values and selections to preserve them
            const tileStartX = tileX * this.tileSize;
            const tileStartY = tileY * this.tileSize;
            let startRow = 0;
            let endRow = 0;
            let rowY = 0;
            ({ rowY, endRow, startRow } = this.rowRangeOfTile(rowY, endRow, tileStartY, startRow));
            endRow = Math.min(endRow, this.grid.currentRows);

            let startCol = 0;
            let endCol = 0;
            let colX = 0;
            ({ colX, endCol, startCol } = this.columnRangeOfTile(colX, endCol, tileStartX, startCol));
            endCol = Math.min(endCol, this.grid.currentColumns);
            
            if (!this.grid.selection.isEditing) {
                this.grid.selection.selectedRanges.forEach(range => {
                    this.tileRenderer.drawSelection(canvas, tileX, tileY, range);
                });
            }

            for (let row = startRow; row < endRow; row++) {
                for (let col = startCol; col < endCol; col++) {
                    this.tileRenderer.drawCellValue(canvas, tileX, tileY, row, col);
                }
            }
        });
    }

    updateVisibleTiles(scrollX, scrollY, viewportWidth, viewportHeight) {
        const visibleTiles = this.getVisibleTiles(scrollX, scrollY, viewportWidth, viewportHeight);
        const newActiveTiles = new Set();

        visibleTiles.forEach(({ tileX, tileY }) => {
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