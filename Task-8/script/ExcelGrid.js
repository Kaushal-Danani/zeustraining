import { CanvasPool } from "./CanvasPool.js";
import { DEFAULT_CONFIG } from "./config.js";
import { Store } from "./Store.js";
import { Column } from "./Column.js";
import { Selection } from "./Selection.js";
import { HeaderRenderer } from "./HeaderRenderer.js";
import { EventManager } from './events/EventManager.js';
import { CellSelectorEvents } from './events/CellSelectorEvents.js';
import { RowSelectorEvents } from './events/RowSelectorEvents.js';
import { ColumnSelectorEvents } from './events/ColumnSelectorEvents.js';
import { RowResizerEvents } from './events/RowResizerEvents.js';
import { ColumnResizerEvents } from './events/ColumnResizerEvents.js';

/**
 * Main Excel Grid class with adaptive content loading
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
        
        /** @type {HTMLElement} Scroll content element */
        this.scrollContent = this.canvasContainer.querySelector('#scroll-content');
        
        /** @type {CanvasPool} Canvas pool for tile management */
        this.canvasPool = new CanvasPool(this, { tileSize: this.config.tileSize });
        
        /** @type {Store} Data store for cells */
        this.store = new Store(this.config.initialRows, this.config.initialColumns);
        
        /** @type {Map<number, Column>} Map of column index to Column */
        this.columns = new Map();
        for (let col = 0; col < this.config.initialColumns; col++) {
            this.columns.set(col, new Column(col, this.config.columnWidth));
        }
        
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
        
        /** @type {Selection} Selection manager */
        this.selection = new Selection(this, this.store, this.config, this.canvasContainer);

        this.eventManager = new EventManager(this, this.selection);
        
        /** @type {HeaderRenderer} Header renderer */
        this.headerRenderer = new HeaderRenderer(this);

        this.initializeCanvas();
        this.updateScrollContent();
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
     * Updates the scrollable content area based on variable column widths and row heights
     */
    updateScrollContent() {
        let totalWidth = 0;
        for (let col = 0; col < this.currentColumns; col++) {
            totalWidth += this.columns.get(col)?.width || this.config.columnWidth;
        }
        let totalHeight = 0;
        for (let row = 0; row < this.currentRows; row++) {
            totalHeight += this.store.rows.get(row)?.height || this.config.rowHeight;
        }
        
        this.scrollContent.style.width = `${totalWidth}px`;
        this.scrollContent.style.height = `${totalHeight}px`;
    }

    /**
     * Sets up all event listeners for user interaction
     */
    setupEventListeners() {
        // Main scroll event handler
        this.canvasContainer.addEventListener('scroll', (e) => {
            this.scrollX = Math.floor(e.target.scrollLeft);
            this.scrollY = Math.floor(e.target.scrollTop);
            
            this.checkAndAdaptContent();
            this.updateViewport();
            this.canvasPool.renderTiles();
            this.headerRenderer.drawColumnHeaders();
            this.headerRenderer.drawRowHeaders();
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
            this.updateScrollContent();
            this.updateViewport();
            this.canvasPool.renderTiles();
            this.headerRenderer.drawColumnHeaders();
            this.headerRenderer.drawRowHeaders();
        });

        this.eventManager.registerHandler(new RowSelectorEvents(this, this.selection));
        this.eventManager.registerHandler(new ColumnSelectorEvents(this, this.selection));
        this.eventManager.registerHandler(new CellSelectorEvents(this, this.selection));
        this.eventManager.registerHandler(new RowResizerEvents(this, this.selection));
        this.eventManager.registerHandler(new ColumnResizerEvents(this, this.selection));
        
        this.canvasContainer.setAttribute('tabindex', '0');
    }

    /**
     * Sets up resize handles for columns and rows on header containers
     */
    setupResizeHandles() {
        // Remove existing resize handles
        const horizontalHeader = document.querySelector('#horizontal-header');
        const verticalHeader = document.querySelector('#vertical-header');
        if (horizontalHeader) horizontalHeader.querySelectorAll('.column-resizer').forEach(el => el.remove());
        if (verticalHeader) verticalHeader.querySelectorAll('.row-resizer').forEach(el => el.remove());
        
        let colX = this.config.headerWidth - this.scrollX;
        let col = 0;
        while (colX < this.viewportWidth && col < this.currentColumns) {
            colX += this.columns.get(col)?.width || this.config.columnWidth;
            col++;
        }
        const endCol = Math.min(col, this.currentColumns);

        let rowY = this.config.headerHeight - this.scrollY;
        let row = 0;
        while (rowY < this.viewportHeight && row < this.currentRows) {
            rowY += this.store.rows.get(row)?.height || this.config.rowHeight;
            row++;
        }
        const endRow = Math.min(row, this.currentRows);

        // Add column resizers to horizontal-header
        if (horizontalHeader) {
            colX = this.config.headerWidth - this.scrollX;
            for (let col = 0; col < endCol; col++) {
                const colWidth = this.columns.get(col)?.width || this.config.columnWidth;
                const resizer = document.createElement('div');
                resizer.className = 'column-resizer';
                resizer.style.position = 'absolute';
                resizer.style.left = `${colX + colWidth - this.config.resizerSize / 2}px`;
                resizer.style.top = '0px';
                resizer.style.width = `${this.config.resizerSize}px`;
                resizer.style.height = `${this.config.headerHeight}px`;
                resizer.style.cursor = 'ew-resize';
                resizer.style.zIndex = '10';
                resizer.dataset.colIndex = col;
                horizontalHeader.appendChild(resizer);
                colX += colWidth;

                if (colWidth == 2) {
                    const currentCollapseDiv = document.querySelector(`div[data-col-index="${col-1}"]`);
                    if (currentCollapseDiv) {
                        currentCollapseDiv.style.backgroundColor = 'white';
                        currentCollapseDiv.style.borderLeft = `1px solid #888`;
                        currentCollapseDiv.style.borderRight = `1px solid #888`;
                    }
                }
            }
        }

        // Add row resizers to vertical-header
        if (verticalHeader) {
            rowY = this.config.headerHeight - this.scrollY;
            for (let row = 0; row < endRow; row++) {
                const rowHeight = this.store.rows.get(row)?.height || this.config.rowHeight;
                const resizer = document.createElement('div');
                resizer.className = 'row-resizer';
                resizer.style.position = 'absolute';
                resizer.style.left = '0px';
                resizer.style.top = `${rowY + rowHeight - this.config.resizerSize / 2}px`;
                resizer.style.width = `${this.config.headerWidth}px`;
                resizer.style.height = `${this.config.resizerSize}px`;
                resizer.style.cursor = 'ns-resize';
                resizer.style.zIndex = '10';
                resizer.dataset.rowIndex = row;
                verticalHeader.appendChild(resizer);
                rowY += rowHeight;

                if (rowHeight == 2) {
                    const currentCollapseDiv = document.querySelector(`div[data-row-index="${row-1}"]`);
                    if (currentCollapseDiv) {
                        currentCollapseDiv.style.backgroundColor = 'white';
                        currentCollapseDiv.style.borderTop = `1px solid #888`;
                        currentCollapseDiv.style.borderBottom = `1px solid #888`;
                    }
                }
            }
        }
    }

    /**
     * Checks scroll position and adapts content loading/unloading as needed
     */
    checkAndAdaptContent() {
        const container = this.canvasContainer;
        const threshold = this.config.loadThreshold;
        
        let visibleRows = 0;
        let currentRowY = 0;
        let currentRow = 0;
        while (currentRowY < container.clientHeight && currentRow < this.currentRows) {
            currentRowY += this.store.rows.get(currentRow)?.height || this.config.rowHeight;
            visibleRows++;
            currentRow++;
        }
        
        let visibleColumns = 0;
        let currentColX = 0;
        let currentColumn = 0;
        while (currentColX < container.clientWidth && currentColumn < this.currentColumns) {
            currentColX += this.columns.get(currentColumn)?.width || this.config.columnWidth;
            visibleColumns++;
            currentColumn++;
        }
        
        let scrollRowY = 0;
        let scrollRow = 0;
        while (scrollRowY < container.scrollTop && scrollRow < this.currentRows) {
            scrollRowY += this.store.rows.get(scrollRow)?.height || this.config.rowHeight;
            scrollRow++;
        }
        
        let scrollColX = 0;
        let scrollCol = 0;
        while (scrollColX < container.scrollLeft && scrollCol < this.currentColumns) {
            scrollColX += this.columns.get(scrollCol)?.width || this.config.columnWidth;
            scrollCol++;
        }
        
        const maxVisibleRow = scrollRow + visibleRows;
        const maxVisibleColumn = scrollCol + visibleColumns;
        
        if (maxVisibleRow > this.maxReachedRow) {
            this.maxReachedRow = maxVisibleRow;
        }
        if (maxVisibleColumn > this.maxReachedColumn) {
            this.maxReachedColumn = maxVisibleColumn;
        }
        
        const verticalScrollPercentage = (container.scrollTop + container.clientHeight) / container.scrollHeight;
        if (verticalScrollPercentage >= threshold && !this.isLoadingRows && this.currentRows < this.config.maxRows) {
            this.loadMoreRows();
        } else if (this.scrollY <= 0) {
            this.contractRows();
        }
        
        const horizontalScrollPercentage = (container.scrollLeft + container.clientWidth) / container.scrollWidth;
        if (horizontalScrollPercentage >= threshold && !this.isLoadingColumns && this.currentColumns < this.config.maxColumns) {
            this.loadMoreColumns();
        } else if (this.scrollX <= 0) {
            this.contractColumns();
        }
    }

    /**
     * Loads additional rows when user scrolls near the bottom
     * @async
     */
    loadMoreRows() {
        if (this.isLoadingRows || this.currentRows >= this.config.maxRows) return;
        
        this.isLoadingRows = true;
        
        const newRowCount = Math.min(
            this.currentRows + this.config.loadChunkRows,
            this.config.maxRows
        );
        
        this.currentRows = newRowCount;
        this.updateScrollContent();
        this.updateViewport();
        this.canvasPool.renderTiles();
        this.headerRenderer.drawRowHeaders();
        
        this.isLoadingRows = false;
        
        console.log(`Loaded more rows. Current total: ${this.currentRows}`);
    }

    /**
     * Loads additional columns when user scrolls near the right edge
     * @async
     */
    loadMoreColumns() {
        if (this.isLoadingColumns || this.currentColumns >= this.config.maxColumns) return;
        
        this.isLoadingColumns = true;
        
        const newColumnCount = Math.min(
            this.currentColumns + this.config.loadChunkColumns,
            this.config.maxColumns
        );
        
        this.currentColumns = newColumnCount;
        this.store.updateColumns(newColumnCount);
        for (let col = this.currentColumns - this.config.loadChunkColumns; col < newColumnCount; col++) {
            this.columns.set(col, new Column(col, this.config.columnWidth));
        }
        this.updateScrollContent();
        this.updateViewport();
        this.canvasPool.renderTiles();
        this.headerRenderer.drawColumnHeaders();
        
        this.isLoadingColumns = false;
        
        console.log(`Loaded more columns. Current total: ${this.currentColumns}`);
    }

    /**
     * Reduces the number of loaded rows when user scrolls away from bottom
     */
    contractRows() {
        const container = this.canvasContainer;
        let visibleRows = 0;
        let currentRowY = 0;
        let currentRow = 0;
        while (currentRowY < container.clientHeight && currentRow < this.currentRows) {
            currentRowY += this.store.rows.get(currentRow)?.height || this.config.rowHeight;
            visibleRows++;
            currentRow++;
        }
        
        let scrollRowY = 0;
        let scrollRow = 0;
        while (scrollRowY < container.scrollTop && scrollRow < this.currentRows) {
            scrollRowY += this.store.rows.get(scrollRow)?.height || this.config.rowHeight;
            scrollRow++;
        }
        
        const neededRows = Math.max(
            this.config.initialRows,
            Math.min(this.maxReachedRow, scrollRow + visibleRows) + this.config.minBuffer
        );
        
        if (neededRows < this.currentRows) {
            const currentScrollRatio = container.scrollTop / container.scrollHeight;
            this.currentRows = neededRows;
            this.updateScrollContent();
            const newScrollTop = currentScrollRatio * container.scrollHeight;
            container.scrollTop = Math.max(0, newScrollTop);
            this.updateViewport();
            this.canvasPool.renderTiles();
            this.headerRenderer.drawRowHeaders();
            console.log(`Contracted rows. Current total: ${this.currentRows}`);
        }
    }

    /**
     * Reduces the number of loaded columns when user scrolls away from right edge
     */
    contractColumns() {
        const container = this.canvasContainer;
        let visibleColumns = 0;
        let currentColX = 0;
        let currentColumn = 0;
        while (currentColX < container.clientWidth && currentColumn < this.currentColumns) {
            currentColX += this.columns.get(currentColumn)?.width || this.config.columnWidth;
            visibleColumns++;
            currentColumn++;
        }
        
        let scrollColX = 0;
        let scrollCol = 0;
        while (scrollColX < container.scrollLeft && scrollCol < this.currentColumns) {
            scrollColX += this.columns.get(scrollCol)?.width || this.config.columnWidth;
            scrollCol++;
        }
        
        const neededColumns = Math.max(
            this.config.initialColumns,
            Math.min(this.maxReachedColumn, scrollCol + visibleColumns) + this.config.minBuffer
        );
        
        if (neededColumns < this.currentColumns) {
            const currentScrollRatio = container.scrollLeft / container.scrollWidth;
            this.currentColumns = neededColumns;
            this.store.updateColumns(neededColumns);
            for (let col = neededColumns; col < this.currentColumns; col++) {
                this.columns.delete(col);
            }
            this.updateScrollContent();
            const newScrollLeft = currentScrollRatio * container.scrollWidth;
            container.scrollLeft = Math.max(0, newScrollLeft);
            this.updateViewport();
            this.canvasPool.renderTiles();
            this.headerRenderer.drawColumnHeaders();
            console.log(`Contracted columns. Current total: ${this.currentColumns}`);
        }
    }

    /**
     * Computes statistics (count, sum, avg, min, max) for the selected cell range
     * @returns {{count: number, sum: number|null, avg: number|null, min: number|null, max: number|null}} Statistics object
     */
    computeRangeStats() {
        let count = 0;
        const values = [];

        // Iterate over all selected ranges
        for (const range of this.selection.selectedRanges) {
            const minRow = Math.min(range.startRow, range.endRow);
            const maxRow = Math.max(range.startRow, range.endRow);
            const minCol = Math.min(range.startCol, range.endCol);
            const maxCol = Math.max(range.startCol, range.endCol);

            // Collect values from cells in the range
            for (let row = minRow; row <= maxRow; row++) {
                for (let col = minCol; col <= maxCol; col++) {
                    const cell = this.store.getCell(row, col);
                    const value = cell.value;
                    if (value !== '' && value !== null && value !== undefined) {
                        count++;
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                            values.push(numValue);
                        }
                    }
                }
            }
        }

        // If no values, return count with null for numeric stats
        if (values.length === 0) {
            return { count, sum: null, avg: null, min: null, max: null };
        }

        // Compute statistics for numeric values
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return { count, sum, avg, min, max };
    }

    /**
     * Updates the status bar with current grid information and selection statistics
     */
    updateStatusBar() {
        const activeTiles = this.canvasPool.activeTiles.size;
        let currentRow = 0;
        let rowY = 0;
        while (rowY < this.scrollY && currentRow < this.currentRows) {
            rowY += this.store.rows.get(currentRow)?.height || this.config.rowHeight;
            currentRow++;
        }
        currentRow = Math.min(currentRow, this.currentRows - 1) + 1;
        
        let currentCol = 0;
        let colX = 0;
        while (colX < this.scrollX && currentCol < this.currentColumns) {
            colX += this.columns.get(currentCol)?.width || this.config.columnWidth;
            currentCol++;
        }
        currentCol = Math.min(currentCol, this.currentColumns - 1);
        
        const selectionText = this.selection.getSelectionText(this.columnNumberToLetter.bind(this));
        const textStatusbar = this.statusBar.querySelector('#status-bar-text');
        const numericalStats = this.statusBar.querySelector('#status-bar-numerical-stats');

        // Compute and append statistics for selected ranges
        if (this.selection.selectedRanges.length > 0 && !this.selection.isEditing) {
            // Check if the selection is a single cell
            const isSingleCell = this.selection.selectedRanges.length === 1 &&
                this.selection.selectedRanges[0].startRow === this.selection.selectedRanges[0].endRow &&
                this.selection.selectedRanges[0].startCol === this.selection.selectedRanges[0].endCol;
            
            if (!isSingleCell) {
                const stats = this.computeRangeStats();
                if (stats.sum !== null) {
                    numericalStats.textContent = `Count: ${stats.count} | Sum: ${stats.sum.toFixed(2)} | Avg: ${stats.avg.toFixed(2)} | Min: ${stats.min} | Max: ${stats.max}`;
                }
                else {
                    numericalStats.textContent = `Count: ${stats.count}`;
                }
            }
        }
        
        textStatusbar.textContent = `${selectionText} | Max Reached: ${this.maxReachedRow} rows × ${this.maxReachedColumn} cols | Active Tiles: ${activeTiles}`;
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
        this.setupResizeHandles();
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
     * Main render method that draws all grid components
     */
    render() {
        this.headerRenderer.drawCornerHeader();
        this.headerRenderer.drawColumnHeaders();
        this.headerRenderer.drawRowHeaders();
        this.canvasPool.renderTiles();
    }

    /**
     * Scrolls the grid to display a specific cell
     */
    scrollToCell(row, oldRow, col, oldCol) {
        let targetX, targetY;
        let currentRowY = 0;
        for (let i = 0; i < row; i++) {
            currentRowY += this.store.rows.get(i)?.height || this.config.rowHeight;
        }

        let currentColX = 0;
        for (let i = 0; i < col; i++) {
            currentColX += this.columns.get(i)?.width || this.config.columnWidth;
        }
        
        if ((row > oldRow) && ((currentRowY + (this.store.rows.get(row)?.height || this.config.rowHeight)) > (Math.floor(this.canvasContainer.scrollTop) + this.canvasContainer.clientHeight))) {
            const rowHeight = this.store.rows.get(row)?.height || this.config.rowHeight;
            const variation = ((currentRowY + rowHeight) - (Math.floor(this.canvasContainer.scrollTop) + this.canvasContainer.clientHeight));
            if (variation > -3)
                targetY = Math.abs(variation) + 2;
            else
                targetY = rowHeight;
            this.canvasContainer.scrollTop += targetY;
        }
        else if ((row < oldRow) && (currentRowY < Math.floor(this.canvasContainer.scrollTop))) {
            const variation = (Math.floor(this.canvasContainer.scrollTop) - currentRowY);
            const rowHeight = this.store.rows.get(row)?.height || this.config.rowHeight;
            if (variation > 0)
                targetY = rowHeight + (variation % rowHeight);
            else
                targetY = rowHeight;
            this.canvasContainer.scrollTop -= targetY;
        }
        else if ((col < oldCol) && (currentColX < Math.floor(this.canvasContainer.scrollLeft))) {
            const variation = (Math.floor(this.canvasContainer.scrollLeft) - currentColX);
            const colWidth = this.columns.get(col)?.width || this.config.columnWidth;
            if (variation < 100)
                targetX = colWidth + variation;
            else
                targetX = colWidth;
            this.canvasContainer.scrollLeft -= targetX;
        }
        else if ((col > oldCol) && ((currentColX + (this.columns.get(col)?.width || this.config.columnWidth)) >= (Math.floor(this.canvasContainer.scrollLeft) + this.canvasContainer.clientWidth))) {
            targetX = (this.columns.get(col)?.width || this.config.columnWidth) + (currentColX - (Math.floor(this.canvasContainer.scrollLeft) + this.canvasContainer.clientWidth));
            this.canvasContainer.scrollLeft += targetX + 3;
        }
    }

    /**
     * Gets the cell at the specified coordinates
     * @param {number} x - X coordinate relative to canvas
     * @param {number} y - Y coordinate relative to canvas
     * @returns {{row: number, col: number, address: string} | null} Cell information
     */
    getCurrentCell(x, y) {
        if (x < 0 || y < 0) return null;
        
        let col = 0;
        let colX = 0;
        while (colX <= this.scrollX + x && col < this.currentColumns) {
            colX += this.columns.get(col)?.width || this.config.columnWidth;
            col++;
        }
        col = Math.max(0, col - 1);
        
        let row = 0;
        let rowY = 0;
        while (rowY <= this.scrollY + y && row < this.currentRows) {
            rowY += this.store.rows.get(row)?.height || this.config.rowHeight;
            row++;
        }
        row = Math.max(0, row - 1);
        
        if (row >= this.currentRows || col >= this.currentColumns) 
            return null;
        return { row, col, address: `${this.columnNumberToLetter(col)}${row + 1}` };
    }
}