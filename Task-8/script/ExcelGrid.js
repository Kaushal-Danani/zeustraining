import { CanvasPool } from "./CanvasPool.js";
import { DEFAULT_CONFIG } from "./config.js";

/**
 * Main Excel Grid class with adaptive content loading
 * Provides a virtual spreadsheet interface with dynamic row/column loading
 */
export class ExcelGrid {
    
    /**
     * Initializes the ExcelGrid object
     * @param {HTMLElement} container - The DOM container element for the grid
     * @param {Object} config - Configuration options (merged with DEFAULT_CONFIG)
     */
    constructor(container, config = {}) {
        /** @type {HTMLElement} Main container element */
        this.container = container;
        
        /** @type {Object} Grid configuration settings */
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        /** @type {HTMLElement} Container for canvas tiles */
        this.canvasContainer = container.querySelector('.canvas-container');
        
        /** @type {HTMLCanvasElement} Canvas for horizontal headers */
        this.horizontalCanvas = document.querySelector('#h-canvas');
        
        /** @type {HTMLCanvasElement} Canvas for vertical headers */
        this.verticalCanvas = document.querySelector('#v-canvas');
        
        /** @type {CanvasRenderingContext2D} Context for horizontal headers */
        this.horizontalCtx = this.horizontalCanvas.getContext('2d');
        this.horizontalCtx.translate(0.5, 0.5);
        
        /** @type {CanvasRenderingContext2D} Context for vertical headers */
        this.verticalCtx = this.verticalCanvas.getContext('2d');
        this.verticalCtx.translate(0.5, 0.5);
        
        /** @type {HTMLElement} Status bar element */
        this.statusBar = this.container.querySelector('#status-bar');
        
        /** @type {CanvasPool} Canvas pool for tile management */
        this.canvasPool = new CanvasPool(this, { tileSize: this.config.tileSize });
        
        /** @type {number} Current number of loaded rows */
        this.currentRows = this.config.initialRows;
        
        /** @type {number} Current number of loaded columns */
        this.currentColumns = this.config.initialColumns;
        
        /** @type {number} Maximum row position reached by user */
        this.maxReachedRow = this.config.initialRows;
        
        /** @type {number} Maximum column position reached by user */
        this.maxReachedColumn = this.config.initialColumns;
        
        /** @type {number} Current horizontal scroll position */
        this.scrollX = 0;
        
        /** @type {number} Current vertical scroll position */
        this.scrollY = 0;
        
        /** @type {number} Current viewport width */
        this.viewportWidth = 0;
        
        /** @type {number} Current viewport height */
        this.viewportHeight = 0;
        
        /** @type {boolean} Flag indicating if rows are currently being loaded */
        this.isLoadingRows = false;
        
        /** @type {boolean} Flag indicating if columns are currently being loaded */
        this.isLoadingColumns = false;
        
        this.initializeCanvas();
        this.setupEventListeners();
        this.updateViewport();
        this.render();
    }

    /**
     * Initializes canvas elements with proper scaling for high DPI displays
     */
    initializeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        
        this.viewportWidth = this.container.clientWidth;
        this.viewportHeight = this.container.clientHeight;
        
        this.horizontalCanvas.width = this.viewportWidth * dpr;
        this.horizontalCanvas.height = this.config.headerHeight * dpr;
        this.horizontalCanvas.style.width = `${this.viewportWidth}px`;
        this.horizontalCanvas.style.height = `${this.config.headerHeight}px`;

        this.verticalCanvas.width = this.config.headerWidth * dpr;
        this.verticalCanvas.height = this.viewportHeight * dpr;
        this.verticalCanvas.style.width = `${this.config.headerWidth}px`;
        this.verticalCanvas.style.height = `${this.viewportHeight}px`;

        this.horizontalCtx.scale(dpr, dpr);
        this.verticalCtx.scale(dpr, dpr);
    }

    /**
     * Sets up all event listeners for user interaction
     */
    setupEventListeners() {
        // Main scroll event handler with adaptive loading
        this.canvasContainer.addEventListener('scroll', (e) => {
            this.scrollX = e.target.scrollLeft;
            this.scrollY = e.target.scrollTop;
            
            // Check if we need to load more content or contract
            this.checkAndAdaptContent();
            
            this.updateViewport();
            this.render();
        });

        // Mouse wheel support
        this.canvasContainer.addEventListener('wheel', (e) => {
            const scrollLeft = this.canvasContainer.scrollLeft + e.deltaX;
            const scrollTop = this.canvasContainer.scrollTop + e.deltaY;
            
            this.canvasContainer.scrollLeft = Math.max(0, scrollLeft);
            this.canvasContainer.scrollTop = Math.max(0, scrollTop);
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.initializeCanvas();
            this.updateViewport();
            this.render();
        });

        // Mouse move handler for debugging
        this.canvasContainer.addEventListener('mousemove', (e) => {
            console.log(e.clientX, e.clientY);
            console.log(this.getCurrentCell(e.clientX-this.config.headerWidth, e.clientY-this.config.headerHeight));
        });

        // Keyboard navigation
        this.canvasContainer.addEventListener('keydown', (e) => {
            const scrollAmount = this.config.rowHeight * 3;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.canvasContainer.scrollTop = Math.max(0, this.canvasContainer.scrollTop - scrollAmount);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.canvasContainer.scrollTop = this.canvasContainer.scrollTop + scrollAmount;
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.canvasContainer.scrollLeft = Math.max(0, this.canvasContainer.scrollLeft - this.config.columnWidth);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.canvasContainer.scrollLeft = this.canvasContainer.scrollLeft + this.config.columnWidth
                    break;
            }
        });

        this.canvasContainer.setAttribute('tabindex', '0');
        this.canvasContainer.focus();
    }

    /**
     * Checks scroll position and adapts content loading/unloading as needed
     */
    checkAndAdaptContent() {
        const container = this.canvasContainer;
        const threshold = this.config.loadThreshold;
        const contractThreshold = this.config.contractThreshold;
        
        // Calculate current visible area
        const visibleRows = Math.ceil(container.clientHeight / this.config.rowHeight);
        const visibleColumns = Math.ceil(container.clientWidth / this.config.columnWidth);
        const currentRow = Math.floor(container.scrollTop / this.config.rowHeight);
        const currentColumn = Math.floor(container.scrollLeft / this.config.columnWidth);
        
        // Update maximum reached positions
        const maxVisibleRow = currentRow + visibleRows;
        const maxVisibleColumn = currentColumn + visibleColumns;
        
        if (maxVisibleRow > this.maxReachedRow) {
            this.maxReachedRow = maxVisibleRow;
        }
        if (maxVisibleColumn > this.maxReachedColumn) {
            this.maxReachedColumn = maxVisibleColumn;
        }
        
        // console.log(container.scrollHeight);
        // Check vertical scrolling (rows)
        const verticalScrollPercentage = (container.scrollTop + container.clientHeight) / container.scrollHeight;
        if (verticalScrollPercentage >= threshold && !this.isLoadingRows && this.currentRows < this.config.maxRows) {
            this.loadMoreRows();
        } else if (verticalScrollPercentage <= contractThreshold && this.currentRows > this.config.initialRows) {
            this.contractRows();
        }
        
        // Check horizontal scrolling (columns)
        const horizontalScrollPercentage = (container.scrollLeft + container.clientWidth) / container.scrollWidth;
        if (horizontalScrollPercentage >= threshold && !this.isLoadingColumns && this.currentColumns < this.config.maxColumns) {
            this.loadMoreColumns();
        } else if (horizontalScrollPercentage <= contractThreshold && this.currentColumns > this.config.initialColumns) {
            this.contractColumns();
        }
    }

    /**
     * Loads additional rows when user scrolls near the bottom
     * @async
     */
    async loadMoreRows() {
        if (this.isLoadingRows || this.currentRows >= this.config.maxRows) return;
        
        this.isLoadingRows = true;
        
        const newRowCount = Math.min(
            this.currentRows + this.config.loadChunkRows,
            this.config.maxRows
        );
        
        this.currentRows = newRowCount;
        this.updateViewport();
        
        this.isLoadingRows = false;
        
        console.log(`Loaded more rows. Current total: ${this.currentRows}`);
    }

    /**
     * Loads additional columns when user scrolls near the right edge
     * @async
     */
    async loadMoreColumns() {
        if (this.isLoadingColumns || this.currentColumns >= this.config.maxColumns) return;
        
        this.isLoadingColumns = true;
        
        const newColumnCount = Math.min(
            this.currentColumns + this.config.loadChunkColumns,
            this.config.maxColumns
        );
        
        this.currentColumns = newColumnCount;
        this.updateViewport();
        
        this.isLoadingColumns = false;
        
        console.log(`Loaded more columns. Current total: ${this.currentColumns}`);
    }

    /**
     * Reduces the number of loaded rows when user scrolls away from bottom
     */
    contractRows() {
        const container = this.canvasContainer;
        const visibleRows = Math.ceil(container.clientHeight / this.config.rowHeight);
        const currentRow = Math.floor(container.scrollTop / this.config.rowHeight);
        
        // Calculate how many rows we actually need
        const neededRows = Math.max(
            this.config.initialRows,
            Math.max(this.maxReachedRow, currentRow + visibleRows) + this.config.minBuffer
        );
        
        if (neededRows < this.currentRows) {
            const currentScrollRatio = container.scrollTop / container.scrollHeight;
            console.log(currentScrollRatio);
            
            this.currentRows = neededRows;
            
            // Maintain scroll position ratio
            const newScrollTop = currentScrollRatio * container.scrollHeight;
            container.scrollTop = Math.max(0, newScrollTop);
            
            this.updateViewport();
            console.log(`Contracted rows. Current total: ${this.currentRows}`);
        }
    }

    /**
     * Reduces the number of loaded columns when user scrolls away from right edge
     */
    contractColumns() {
        const container = this.canvasContainer;
        const visibleColumns = Math.ceil(container.clientWidth / this.config.columnWidth);
        const currentColumn = Math.floor(container.scrollLeft / this.config.columnWidth);
        
        // Calculate how many columns we actually need
        const neededColumns = Math.max(
            this.config.initialColumns,
            Math.max(this.maxReachedColumn, currentColumn + visibleColumns) + this.config.minBuffer
        );
        
        if (neededColumns < this.currentColumns) {
            const currentScrollRatio = container.scrollLeft / container.scrollWidth;
            
            this.currentColumns = neededColumns;
            
            // Maintain scroll position ratio
            const newScrollLeft = currentScrollRatio * container.scrollWidth;
            container.scrollLeft = Math.max(0, newScrollLeft);
            
            this.updateViewport();
            console.log(`Contracted columns. Current total: ${this.currentColumns}`);
        }
    }

    /**
     * Updates viewport dimensions and triggers tile updates
     */
    updateViewport() {
        const canvasRect = this.canvasContainer.getBoundingClientRect();
        this.viewportWidth = canvasRect.width;
        this.viewportHeight = canvasRect.height;
        
        this.canvasPool.updateVisibleTiles(this.scrollX, this.scrollY, this.viewportWidth, this.viewportHeight);
        this.updateStatusBar();
    }

    /**
     * Converts a column number to its corresponding letter representation
     * @param {number} colNum - Zero-based column number
     * @returns {string} Column letter (A, B, C, ..., AA, AB, etc.)
     */
    columnNumberToLetter(colNum) {
        let result = '';
        while (colNum >= 0) {
            result = String.fromCharCode(65 + (colNum % 26)) + result;
            colNum = Math.floor(colNum / 26) - 1;
        }
        return result;
    }

    /**
     * Draws the horizontal column headers
     */
    drawColumnHeaders() {
        const ctx = this.horizontalCtx;
        const config = this.config;
        
        const startCol = Math.floor(this.scrollX / config.columnWidth);
        const endCol = Math.min(
            startCol + Math.ceil(this.viewportWidth / config.columnWidth) + 1,
            this.currentColumns
        );
        
        ctx.clearRect(0, 0, this.viewportWidth, config.headerHeight);
        ctx.fillStyle = config.colors.headerBg;
        ctx.fillRect(config.headerWidth, 0, this.viewportWidth, config.headerHeight);
        
        ctx.strokeStyle = config.colors.headerBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(config.headerWidth, config.headerHeight - 0.5);
        ctx.lineTo(window.innerWidth, config.headerHeight - 0.5);
        ctx.stroke();
        
        ctx.fillStyle = config.colors.headerText;
        ctx.font = config.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let col = startCol; col < endCol; col++) {
            const x = config.headerWidth + (col * config.columnWidth) - this.scrollX;
            if (x + config.columnWidth > config.headerWidth && x < this.viewportWidth) {
                const letter = this.columnNumberToLetter(col);
                ctx.fillText(letter, x + config.columnWidth / 2, config.headerHeight / 2);
                
                ctx.strokeStyle = config.colors.headerBorder;
                ctx.beginPath();
                ctx.moveTo(x + config.columnWidth - 0.5, 0);
                ctx.lineTo(x + config.columnWidth - 0.5, config.headerHeight);
                ctx.stroke();
            }
        }
    }

    /**
     * Draws the vertical row headers
     */
    drawRowHeaders() {
        const ctx = this.verticalCtx;
        const config = this.config;
        
        const startRow = Math.floor(this.scrollY / config.rowHeight);
        const endRow = Math.min(
            startRow + Math.ceil(this.viewportHeight / config.rowHeight) + 1,
            this.currentRows
        );
        
        ctx.clearRect(0, 0, config.headerWidth, this.viewportHeight);
        ctx.fillStyle = config.colors.headerBg;
        ctx.fillRect(0, config.headerHeight, config.headerWidth, this.viewportHeight);
        
        ctx.strokeStyle = config.colors.headerBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(config.headerWidth - 0.5, config.headerHeight);
        ctx.lineTo(config.headerWidth - 0.5, window.innerHeight);
        ctx.stroke();
        
        ctx.fillStyle = config.colors.headerText;
        ctx.font = config.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        console.log(this.scrollY);
        for (let row = startRow; row < endRow; row++) {
            const y = config.headerHeight + (row * config.rowHeight) - this.scrollY;
            if (y + config.rowHeight > config.headerHeight && y < this.viewportHeight) {
                ctx.fillText(String(row + 1), config.headerWidth / 2, y + config.rowHeight / 2);
                
                ctx.beginPath();
                ctx.moveTo(0, y + config.rowHeight - 0.5);
                ctx.lineTo(config.columnWidth, y + config.rowHeight - 0.5);
                ctx.stroke();
            }
        }
    }

    /**
     * Draws the corner header (intersection of row and column headers)
     */
    drawCornerHeader() {
        const intersection = document.getElementById('top-left-intersection');
        intersection.style.width = `${this.config.headerWidth}px`;
        intersection.style.height = `${this.config.headerHeight}px`;
        intersection.style.backgroundColor = this.config.colors.headerBg;
        intersection.style.borderRight = `1px solid ${this.config.colors.headerBorder}`;
        intersection.style.borderBottom = `1px solid ${this.config.colors.headerBorder}`;
    }

    /**
     * Updates the status bar with current grid information
     */
    updateStatusBar() {
        const activeTiles = this.canvasPool.activeTiles.size;
        const currentRow = Math.floor(this.scrollY / this.config.rowHeight) + 1;
        const currentCol = this.columnNumberToLetter(Math.floor(this.scrollX / this.config.columnWidth));

        // Position: ${currentCol}${currentRow} | 
        this.statusBar.textContent = `Max Reached: ${this.maxReachedRow} rows × ${this.maxReachedColumn} cols | Active Tiles: ${activeTiles}`;
    }

    /**
     * Main render method that draws all grid components
     */
    render() {
        this.drawColumnHeaders();
        this.drawRowHeaders();
        this.drawCornerHeader();
    }

    /**
     * Scrolls the grid to display a specific cell
     */
     scrollToCell(row, col) {
        // Ensure content is loaded up to the target cell
        if (row >= this.currentRows) {
            this.currentRows = Math.min(row + this.config.loadChunkRows, this.config.maxRows);
        }
        if (col >= this.currentColumns) {
            this.currentColumns = Math.min(col + this.config.loadChunkColumns, this.config.maxColumns);
        }
        
        const targetX = col * this.config.columnWidth;
        const targetY = row * this.config.rowHeight;
        
        this.canvasContainer.scrollLeft = targetX;
        this.canvasContainer.scrollTop = targetY;
    }

    getCurrentCell(x, y) {
        const col = Math.floor(this.scrollX+x / this.config.columnWidth);
        const row = Math.floor(this.scrollY+y / this.config.rowHeight);

        // const row = Math.floor(y / this.config.rowHeight);
        // const col = Math.floor(x / this.config.columnWidth);
        return { row, col, address: `${this.columnNumberToLetter(col)}${row + 1}` };
    }

    // Method to reset the grid to initial size
    resetToInitial() {
        this.currentRows = this.config.initialRows;
        this.currentColumns = this.config.initialColumns;
        this.maxReachedRow = this.config.initialRows;
        this.maxReachedColumn = this.config.initialColumns;
        this.canvasContainer.scrollLeft = 0;
        this.canvasContainer.scrollTop = 0;
        this.updateViewport();
        this.render();
    }
}