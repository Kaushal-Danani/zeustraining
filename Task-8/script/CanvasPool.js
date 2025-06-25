import { ExcelGrid } from "./ExcelGrid.js";

/**
 * Manages a pool of canvas elements for dynamic rendering
 * Implements tile-based rendering for efficient display of large grids
 */
export class CanvasPool {
    
    /**
     * Initializes the CanvasPool object
     * @param {ExcelGrid} grid - Reference to the main ExcelGrid instance
     * @param {Object} options - Configuration options for the canvas pool
     * @param {number} options.tileSize - Size of each canvas tile in pixels
     */
    constructor(grid, options = {}) {
        /** @type {ExcelGrid} Reference to the main grid instance */
        this.grid = grid;
        
        /** @type {Map<string, HTMLCanvasElement>} Map of active canvas tiles */
        this.activeTiles = new Map();
        
        /** @type {HTMLCanvasElement[]} Pool of reusable canvas elements */
        this.canvasPool = [];
        
        /** @type {number} Size of each tile in pixels */
        this.tileSize = options.tileSize || 800;
        
        /** @type {number} Number of rows that fit in one tile */
        this.rowsPerTile = Math.floor(this.tileSize / grid.config.rowHeight);
        
        /** @type {number} Number of columns that fit in one tile */
        this.colsPerTile = Math.floor(this.tileSize / grid.config.columnWidth);
        
        /** @type {HTMLElement} Container element for canvas tiles */
        this.container = grid.canvasContainer;
    }

    /**
     * Generates a unique key for a tile based on its coordinates
     * @param {number} tileX - X coordinate of the tile
     * @param {number} tileY - Y coordinate of the tile
     * @returns {string} Unique tile key
     */
    getTileKey(tileX, tileY) {
        return `${tileX}_${tileY}`;
    }

    /**
     * Calculates which tiles are visible in the current viewport
     * @param {number} viewportX - X position of the viewport
     * @param {number} viewportY - Y position of the viewport
     * @param {number} viewportWidth - Width of the viewport
     * @param {number} viewportHeight - Height of the viewport
     * @returns {Array<Object>} Array of visible tile coordinates
     */
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

    /**
     * Creates a new canvas element with proper scaling
     * @returns {HTMLCanvasElement} Newly created canvas element
     */
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

    /**
     * Positions a canvas element at the specified tile coordinates
     * @param {HTMLCanvasElement} canvas - The canvas element to position
     * @param {number} tileX - X coordinate of the tile
     * @param {number} tileY - Y coordinate of the tile
     */
    positionCanvas(canvas, tileX, tileY) {
        const pixelX = tileX * this.tileSize;
        const pixelY = tileY * this.tileSize;
        
        canvas.style.left = `${pixelX}px`;
        canvas.style.top = `${pixelY}px`;
        canvas.style.display = 'block';
    }

    /**
     * Creates or updates a tile at the specified coordinates
     * @param {number} tileX - X coordinate of the tile
     * @param {number} tileY - Y coordinate of the tile
     * @returns {HTMLCanvasElement} The canvas element for the tile
     */
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

    /**
     * Removes a tile from active use and returns it to the pool
     * @param {string} tileKey - Unique key of the tile to remove
     */
    removeTile(tileKey) {
        const canvas = this.activeTiles.get(tileKey);
        if (canvas) {
            canvas.style.display = 'none';
            this.canvasPool.push(canvas);
            this.activeTiles.delete(tileKey);
        }
    }

    /**
     * Renders the grid content on a specific tile
     * @param {HTMLCanvasElement} canvas - The canvas element to render on
     * @param {number} tileX - X coordinate of the tile
     * @param {number} tileY - Y coordinate of the tile
     */
    renderTile(canvas, tileX, tileY) {
        const ctx = canvas.getContext('2d');
        const config = this.grid.config;
        
        ctx.clearRect(0, 0, this.tileSize, this.tileSize);
        
        const tileStartX = tileX * this.tileSize;
        const tileStartY = tileY * this.tileSize;
        
        const startCol = Math.floor(tileStartX / config.columnWidth);
        const endCol = Math.min(startCol + Math.ceil(this.tileSize / config.columnWidth) + 1, this.grid.currentColumns);
        const startRow = Math.floor(tileStartY / config.rowHeight);
        const endRow = Math.min(startRow + Math.ceil(this.tileSize / config.rowHeight) + 1, this.grid.currentRows);
        
        ctx.font = config.font;
        ctx.translate(0.5, 0.5);
        ctx.lineWidth = 1;
        
        // Draw cells background
        ctx.fillStyle = config.colors.cellBg;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Draw vertical grid lines
        ctx.strokeStyle = config.colors.gridLine;
        ctx.beginPath();
        for (let col = startCol; col <= endCol; col++) {
            const gridX = col * config.columnWidth;
            const canvasX = gridX - tileStartX;
            if (canvasX >= -1 && canvasX <= this.tileSize + 1) {
                ctx.moveTo(canvasX - 0.5, 0);
                ctx.lineTo(canvasX - 0.5, this.tileSize);
            }
        }
        ctx.stroke();
        
        // Draw horizontal grid lines
        ctx.beginPath();
        for (let row = startRow; row <= endRow; row++) {
            const gridY = row * config.rowHeight;
            const canvasY = gridY - tileStartY;
            if (canvasY >= -1 && canvasY <= this.tileSize + 1) {
                ctx.moveTo(0, canvasY - 0.5);
                ctx.lineTo(this.tileSize, canvasY - 0.5);
            }
        }
        ctx.stroke();
    }

    /**
     * Updates which tiles are visible and manages tile creation/removal
     * @param {number} scrollX - Current horizontal scroll position
     * @param {number} scrollY - Current vertical scroll position
     * @param {number} viewportWidth - Width of the viewport
     * @param {number} viewportHeight - Height of the viewport
     */
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