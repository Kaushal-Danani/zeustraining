import { CanvasPool } from "./CanvasPool.js";
import { DEFAULT_CONFIG } from "./config.js";
import { Store } from "./Store.js";
import { Column } from "./Column.js";

/**
 * Main Excel Grid class with adaptive content loading and cell selection
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
        
        /** @type {{row: number, col: number} | null} Anchor cell for range selection */
        this.selectionAnchor = null;
        
        /** @type {{row: number, col: number} | null} Current selection end */
        this.selectionEnd = null;
        
        /** @type {boolean} Flag indicating if mouse is down for drag selection */
        this.isMouseDown = false;
        
        /** @type {HTMLElement | null} Current input container */
        this.inputContainer = null;
        
        /** @type {HTMLElement | null} Current selection div */
        this.selectionDiv = null;

        this.isSelected = false;

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
     * Updates the scrollable content area
     */
    updateScrollContent() {
        const currentWidth = this.currentColumns * this.config.columnWidth;
        const currentHeight = this.currentRows * this.config.rowHeight;
        
        this.scrollContent.style.width = `${currentWidth}px`;
        this.scrollContent.style.height = `${currentHeight}px`;
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
            this.render();
            this.updateSelectionDivPosition();
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
            this.render();
            this.updateSelectionDivPosition();
        });

        // Mouse event handlers for cell selection
        this.canvasContainer.addEventListener('mousedown', (e) => {
            if (e.button !== 0) // Only handle left-click
                return; 
            else if (this.isSelected)
                return;

            this.isMouseDown = true;
            const cell = this.getCurrentCell(e.clientX - this.config.headerWidth, 
                                           e.clientY - this.config.headerHeight);

            if (cell) {
                if (e.shiftKey && this.selectionAnchor) {
                    // Extend selection
                    this.store.clearSelections();
                    this.store.setSelectionRange(
                        this.selectionAnchor.row,
                        this.selectionAnchor.col,
                        cell.row,
                        cell.col
                    );
                    this.selectionEnd = { row: cell.row, col: cell.col };
                } else {
                    // New selection
                    this.store.clearSelections();
                    this.store.setSelectionRange(cell.row, cell.col, cell.row, cell.col);
                    this.selectionAnchor = { row: cell.row, col: cell.col };
                    this.selectionEnd = { row: cell.row, col: cell.col };
                }
                this.render();
                this.updateSelectionDiv();
                this.updateStatusBar();
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isMouseDown) {
                const cell = this.getCurrentCell(e.clientX - this.config.headerWidth, 
                                               e.clientY - this.config.headerHeight);
                if (cell && (cell.row !== this.selectionEnd?.row || cell.col !== this.selectionEnd?.col)) {
                    this.store.clearSelections();
                    this.store.setSelectionRange(
                        this.selectionAnchor.row,
                        this.selectionAnchor.col,
                        cell.row,   
                        cell.col
                    );
                    this.selectionEnd = { row: cell.row, col: cell.col };
                    this.render();
                    this.scrollToCell(cell.row, this.selectionAnchor.row, cell.col, this.selectionAnchor.col);
                    this.updateSelectionDiv();
                    this.updateStatusBar();
                }
            }
        });

        this.canvasContainer.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // Double-click handler for cell editing
        this.canvasContainer.addEventListener('dblclick', (e) => {
            this.isSelected = true;
            const cell = this.getCurrentCell(e.clientX - this.config.headerWidth, 
                                           e.clientY - this.config.headerHeight);
            if (cell) {
                this.createInputBox(cell);
            }
        });

        // Keyboard navigation
        window.addEventListener('keydown', (e) => {
            if (!this.selectionAnchor) return;

            // Check if the key is alphanumeric or a special character
            const isAlphanumericOrSpecial = /^[a-zA-Z0-9`~!@#$%^&*()_+\-=\[\]{}\\|;:'",.<>\/?]$/.test(e.key);
            if (isAlphanumericOrSpecial && !this.isSelected) {
                e.preventDefault();
                this.isSelected = true;
                this.createInputBox(this.selectionAnchor, e.key);
                return;
            }

            let newRow = this.selectionAnchor.row;
            let newCol = this.selectionAnchor.col;
            let oldRow, oldCol;

            switch (e.key) {
                case 'Tab':
                    e.preventDefault();
                    oldCol = newCol;
                    newCol = Math.min(this.currentColumns - 1, newCol + 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    oldRow = newRow;
                    newRow = Math.max(0, newRow - 1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    oldRow = newRow;
                    newRow = Math.min(this.currentRows - 1, newRow + 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    oldCol = newCol;
                    newCol = Math.max(0, newCol - 1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    oldCol = newCol;
                    newCol = Math.min(this.currentColumns - 1, newCol + 1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (this.selectionAnchor) {
                        newRow = Math.min(this.currentRows - 1, newRow + 1);
                        this.updateSelectionDiv();
                        this.isSelected = false;
                    }
                    break;
                }

            if (newRow !== this.selectionAnchor.row || newCol !== this.selectionAnchor.col) {
                this.store.clearSelections();
                this.store.setSelectionRange(newRow, newCol, newRow, newCol);
                this.selectionAnchor = { row: newRow, col: newCol };
                this.selectionEnd = { row: newRow, col: newCol };
                this.scrollToCell(newRow, oldRow, newCol, oldCol);
                this.updateSelectionDiv();
                this.updateStatusBar();
            }
        });

        this.canvasContainer.setAttribute('tabindex', '0');
    }

    /**
     * Creates a selection div for the current selection range
     */
    createSelectionDiv() {
        this.removeSelectionDiv();

        if (!this.selectionAnchor || !this.selectionEnd) return;

        const minRow = Math.min(this.selectionAnchor.row, this.selectionEnd.row);
        const maxRow = Math.max(this.selectionAnchor.row, this.selectionEnd.row);
        const minCol = Math.min(this.selectionAnchor.col, this.selectionEnd.col);
        const maxCol = Math.max(this.selectionAnchor.col, this.selectionEnd.col);

        this.selectionDiv = document.createElement('div');
        this.selectionDiv.style.position = 'absolute';
        this.selectionDiv.style.width = `${(maxCol - minCol + 1) * this.config.columnWidth + 2}px`;
        this.selectionDiv.style.height = `${(maxRow - minRow + 1) * this.config.rowHeight + 2}px`;
        this.selectionDiv.style.left = `${minCol * this.config.columnWidth - 1.5}px`;
        this.selectionDiv.style.top = `${minRow * this.config.rowHeight - 2}px`;
        
        if (!((maxCol - minCol) == 0 && (maxRow - minRow) == 0))
            this.selectionDiv.style.backgroundColor = this.config.colors.selectRangeColor;

        this.selectionDiv.style.border = `2px solid ${this.config.colors.selectionBorder}`;
        this.selectionDiv.style.zIndex = '900'; // Below input box (zIndex 1000)
        this.selectionDiv.style.pointerEvents = 'none';

        const selectRect = document.createElement('div');
        selectRect.style.position = 'relative';
        selectRect.style.left = `${(maxCol - minCol + 1) * this.config.columnWidth - 3}px`
        selectRect.style.top = `${(maxRow - minRow + 1) * this.config.rowHeight - 3}px`
        selectRect.style.width = '4px';
        selectRect.style.height = '4px';
        selectRect.style.boxShadow = `0 0 0 1px white`;
        selectRect.style.backgroundColor = this.config.colors.selectionBorder;

        this.selectionDiv.appendChild(selectRect);
        this.canvasContainer.appendChild(this.selectionDiv);
    }

    /**
     * Updates the position and size of the selection div
     */
    updateSelectionDiv() {
        this.createSelectionDiv();
    }

    /**
     * Removes the current selection div if it exists
     */
    removeSelectionDiv() {
        if (this.selectionDiv) {
            this.selectionDiv.remove();
            this.selectionDiv = null;
        }
    }

    /**
     * Creates an input box for editing a cell
     * @param {{row: number, col: number}} cell - The cell to edit
     * @param {string} [initialValue=''] - Initial value for the input box
     */
     createInputBox(cell, initialValue = '') {
        this.removeSelectionDiv();
        this.removeInputBox();

        // Create input container
        this.inputContainer = document.createElement('div');
        this.inputContainer.style.position = 'absolute';
        this.inputContainer.style.width = `${this.config.columnWidth}px`;
        this.inputContainer.style.height = `${this.config.rowHeight}px`;
        this.inputContainer.style.left = `${cell.col * this.config.columnWidth - 2}px`;
        this.inputContainer.style.top = `${cell.row * this.config.rowHeight - 2}px`;
        this.inputContainer.style.zIndex = '1000';

        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.style.all = 'unset';
        input.style.width = `calc(100% - 4px)`;
        input.style.height = `calc(100% - 2px)`;
        input.style.padding = '0px 0px 0px 3px';
        input.style.margin = '0';
        input.style.border = '2px solid #137E41';
        input.style.background = 'white';
        input.style.font = `16px Arial`;
        input.style.color = this.config.colors.cellText;
        input.value = initialValue || this.store.getCell(cell.row, cell.col).value || '';

        this.inputContainer.appendChild(input);
        this.canvasContainer.appendChild(this.inputContainer);

        input.focus();
        // input.select();

        // Save value on Enter or blur
        const saveValue = () => {
            this.store.setCellValue(cell.row, cell.col, input.value);
            this.removeInputBox();
            this.canvasPool.renderTiles();
            this.createSelectionDiv();
            this.isSelected = false;
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.removeInputBox();
                this.canvasPool.renderTiles();
                this.isSelected = false;
            }
            if (e.key === 'Escape') {
                this.removeInputBox();
                this.canvasPool.renderTiles();
                this.createSelectionDiv();
            }
            if (e.key === 'Tab') {
                this.removeInputBox();
            }
        });

        input.addEventListener('blur', saveValue);
    }

    /**
     * Removes the current input box if it exists
     */
    removeInputBox() {
        if (this.inputContainer) {
            this.inputContainer.remove();
            this.inputContainer = null;
        }
    }

    /**
     * Checks scroll position and adapts content loading/unloading as needed
     */
    checkAndAdaptContent() {
        const container = this.canvasContainer;
        const threshold = this.config.loadThreshold;
        
        const visibleRows = Math.ceil(container.clientHeight / this.config.rowHeight);
        const visibleColumns = Math.ceil(container.clientWidth / this.config.columnWidth);
        const currentRow = Math.floor(container.scrollTop / this.config.rowHeight);
        const currentColumn = Math.floor(container.scrollLeft / this.config.columnWidth);
        
        const maxVisibleRow = currentRow + visibleRows;
        const maxVisibleColumn = currentColumn + visibleColumns;
        
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
            // this.resetToInitial();
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
        
        const neededRows = Math.max(
            this.config.initialRows,
            Math.min(this.maxReachedRow, currentRow + visibleRows) + this.config.minBuffer
        );
        
        if (neededRows < this.currentRows) {
            const currentScrollRatio = container.scrollTop / container.scrollHeight;
            this.currentRows = neededRows;
            this.updateScrollContent();
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
        
        const neededColumns = Math.max(
            this.config.initialColumns,
            Math.min(this.maxReachedColumn, currentColumn + visibleColumns) + this.config.minBuffer
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
        this.updateInputBoxPosition();
    }

    /**
     * Updates the position of the input box when scrolling
     */
    updateInputBoxPosition() {
        if (this.inputContainer) {
            const cell = this.store.getCell(this.selectionAnchor.row, this.selectionAnchor.col);
            if (cell) {
                this.inputContainer.style.left = `${this.selectionAnchor.col * this.config.columnWidth - 2.5}px`;
                this.inputContainer.style.top = `${this.selectionAnchor.row * this.config.rowHeight - 2.5}px`;
            }
        }
    }

    /**
     * Updates the position of the selection div when scrolling
     */
    updateSelectionDivPosition() {
        if (this.selectionDiv && this.selectionAnchor && this.selectionEnd) {
            const minRow = Math.min(this.selectionAnchor.row, this.selectionEnd.row);
            const minCol = Math.min(this.selectionAnchor.col, this.selectionEnd.col);
            // this.selectionDiv.style.left = `${minCol * this.config.columnWidth}px`;
            // this.selectionDiv.style.top = `${minRow * this.config.rowHeight}px`;
            // this.selectionDiv.style.width = `${(maxCol - minCol + 1) * this.config.columnWidth + 3}px`;
            // this.selectionDiv.style.height = `${(maxRow - minRow + 1) * this.config.rowHeight + 3}px`;
            this.selectionDiv.style.left = `${minCol * this.config.columnWidth - 1.5}px`;
            this.selectionDiv.style.top = `${minRow * this.config.rowHeight - 1.5}px`;
        }
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
     * Draws the horizontal column headers with highlight for selected columns
     */
     drawColumnHeaders() {
        const ctx = this.horizontalCtx;
        const config = this.config;
        
        const startCol = Math.floor(this.scrollX / config.columnWidth);
        const endCol = Math.min(
            startCol + Math.ceil(this.viewportWidth / config.columnWidth) + 1,
            this.currentColumns
        );

        // Determine selected column range
        const selectedCols = new Set();
        if (this.selectionAnchor && this.selectionEnd) {
            const minCol = Math.min(this.selectionAnchor.col, this.selectionEnd.col);
            const maxCol = Math.max(this.selectionAnchor.col, this.selectionEnd.col);
            for (let col = minCol; col <= maxCol; col++) {
                selectedCols.add(col);
            }
        }
        
        ctx.clearRect(0, 0, window.innerWidth, config.headerHeight);
        
        // Draw header backgrounds
        for (let col = startCol; col < endCol; col++) {
            const x = (col * config.columnWidth) - this.scrollX + config.headerWidth;
            if (x + config.columnWidth > 0 && x < this.viewportWidth) {
                ctx.fillStyle = selectedCols.has(col) ? config.colors.headerHighlight : config.colors.headerBg;
                ctx.fillRect(x, 0, config.columnWidth, config.headerHeight);
            }
        }
        
        // Draw bottom border
        ctx.strokeStyle = config.colors.headerBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, config.headerHeight - 0.5);
        ctx.lineTo(window.innerWidth, config.headerHeight - 0.5);
        ctx.stroke();
        
        // Draw vertical lines and text
        ctx.fillStyle = config.colors.headerText;
        ctx.font = config.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let col = startCol; col < endCol; col++) {
            const x = (col * config.columnWidth) - this.scrollX + config.headerWidth;
            if (x + config.columnWidth > 0 && x < this.viewportWidth) {
                const letter = this.columnNumberToLetter(col);
                ctx.fillText(letter, x + config.columnWidth / 2, config.headerHeight / 2);
                
                ctx.strokeStyle = config.colors.headerBorder;
                ctx.lineWidth = 1 / window.devicePixelRatio;
                ctx.beginPath();
                ctx.moveTo(x + config.columnWidth - 0.5, 0);
                ctx.lineTo(x + config.columnWidth - 0.5, config.headerHeight);
                ctx.stroke();
            }
        }

        // Draw green bottom border for selected columns
        if (selectedCols.size > 0) {
            ctx.strokeStyle = config.colors.headerHighlightBorder;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let col = startCol; col < endCol; col++) {
                if (selectedCols.has(col)) {
                    const x = (col * config.columnWidth) - this.scrollX + config.headerWidth;
                    if (x + config.columnWidth > 0 && x < this.viewportWidth) {
                        ctx.moveTo(x - 1.5, config.headerHeight - 1);
                        ctx.lineTo(x + config.columnWidth + 0.5, config.headerHeight - 1);
                    }
                }
            }
            ctx.stroke();
        }
        
    }

    /**
     * Draws the vertical row headers with highlight for selected rows
     */
    drawRowHeaders() {
        const ctx = this.verticalCtx;
        const config = this.config;
        
        const startRow = Math.floor(this.scrollY / config.rowHeight);
        const endRow = Math.min(
            startRow + Math.ceil(this.viewportHeight / config.rowHeight) + 1,
            this.currentRows
        );

        // Determine selected row range
        const selectedRows = new Set();
        if (this.selectionAnchor && this.selectionEnd) {
            const minRow = Math.min(this.selectionAnchor.row, this.selectionEnd.row);
            const maxRow = Math.max(this.selectionAnchor.row, this.selectionEnd.row);
            for (let row = minRow; row <= maxRow; row++) {
                selectedRows.add(row);
            }
        }
        
        ctx.clearRect(0, 0, config.headerWidth, window.innerHeight);
        
        // Draw header backgrounds
        for (let row = startRow; row < endRow; row++) {
            const y = (row * config.rowHeight) - this.scrollY + config.headerHeight;
            if (y + config.rowHeight > 0 && y < this.viewportHeight) {
                ctx.fillStyle = selectedRows.has(row) ? config.colors.headerHighlight : config.colors.headerBg;
                ctx.fillRect(0, y, config.headerWidth, config.rowHeight);
            }
        }
        
        // Draw right border
        ctx.strokeStyle = config.colors.headerBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(config.headerWidth - 0.5, 0);
        ctx.lineTo(config.headerWidth - 0.5, this.viewportHeight);
        ctx.stroke();
        
        // Draw horizontal lines and text
        ctx.fillStyle = config.colors.headerText;
        ctx.font = config.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let row = startRow; row < endRow; row++) {
            const y = (row * config.rowHeight) - this.scrollY + config.headerHeight;
            if (y + config.rowHeight > 0 && y < this.viewportHeight) {
                ctx.fillText(String(row + 1), config.headerWidth - 20, y + config.rowHeight / 2);
                
                ctx.strokeStyle = config.colors.headerBorder;
                ctx.lineWidth = 1 / window.devicePixelRatio;
                ctx.beginPath();
                ctx.moveTo(0, y + config.rowHeight - 0.5);
                ctx.lineTo(config.headerWidth, y + config.rowHeight - 0.5);
                ctx.stroke();
            }
        }

        // Draw green bottom border for selected rows
        if (selectedRows.size > 0) {
            ctx.strokeStyle = config.colors.headerHighlightBorder;
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let row = startRow; row < endRow; row++) {
                if (selectedRows.has(row)) {
                    const y = (row * config.rowHeight) - this.scrollY + config.headerHeight;
                    if (y + config.rowHeight > 0 && y < this.viewportHeight) {
                        ctx.moveTo(config.headerWidth, y - 2);
                        ctx.lineTo(config.headerWidth, y + config.rowHeight);
                    }
                }
            }
            ctx.stroke();
        }
        
    }

    /**
     * Draws the corner header
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
        const selectionText = this.selectionAnchor
            ? `Selected: ${this.columnNumberToLetter(this.selectionAnchor.col)}${this.selectionAnchor.row + 1}`
            : 'No selection';
        
        this.statusBar.textContent = `${selectionText} | Max Reached: ${this.maxReachedRow} rows × ${this.maxReachedColumn} cols | Active Tiles: ${activeTiles}`;
    }

    /**
     * Main render method that draws all grid components
     */
    render() {
        this.drawCornerHeader();
        this.drawColumnHeaders();
        this.drawRowHeaders();
    }

    /**
     * Scrolls the grid to display a specific cell
     */
    scrollToCell(row, oldRow, col, oldCol) {
        // console.log(row, col,' -> ', this.currentRows);
        // if (row >= this.currentRows) {
        //     this.currentRows = Math.min(row + this.config.loadChunkRows, this.config.maxRows);
        // }
        // if (col >= this.currentColumns) {
        //     this.currentColumns = Math.min(col + this.config.loadChunkColumns, this.config.maxColumns);
        //     this.store.updateColumns(this.currentColumns);
        //     for (let c = this.currentColumns - this.config.loadChunkColumns; c < this.currentColumns; c++) {
        //         this.columns.set(c, new Column(c, this.config.columnWidth));
        //     }
        // }

        let targetX, targetY;
        // console.log((row * this.config.rowHeight), (Math.ceil(this.canvasContainer.scrollTop)), this.canvasContainer.clientHeight );
        if ((row > oldRow) && ((row+1) * this.config.rowHeight) >= (Math.floor(this.canvasContainer.scrollTop) + this.canvasContainer.clientHeight)) {
            const variation = ((row * this.config.rowHeight) - (Math.floor(this.canvasContainer.scrollTop) + this.canvasContainer.clientHeight));

            if (variation < 0)
                targetY = this.config.rowHeight + variation;
            else 
                targetY = this.config.rowHeight;
            this.canvasContainer.scrollTop += targetY;
        }
        else if ((row < oldRow) && (row * this.config.rowHeight) < Math.floor(this.canvasContainer.scrollTop)) {
            const variation = (Math.floor(this.canvasContainer.scrollTop) - (row * this.config.rowHeight));
            if (variation > 0)
                targetY = this.config.rowHeight + (variation % this.config.rowHeight);
            else
                targetY = this.config.rowHeight;
            this.canvasContainer.scrollTop -= targetY;
        }
        else if ((col < oldCol) && (col * this.config.columnWidth) < Math.floor(this.canvasContainer.scrollLeft)) {
            const variation = (Math.floor(this.canvasContainer.scrollLeft) - (col * this.config.columnWidth));
            if (variation < 100)
                targetX = this.config.columnWidth + variation;
            else
                targetX = this.config.columnWidth;
            this.canvasContainer.scrollLeft -= targetX;
        }
        else if ((col > oldCol) && ((col+1) * this.config.columnWidth) >= (Math.floor(this.canvasContainer.scrollLeft) + this.canvasContainer.clientWidth)) {
            targetX = this.config.columnWidth + ((col * this.config.columnWidth) - (Math.floor(this.canvasContainer.scrollLeft) + this.canvasContainer.clientWidth));
            this.canvasContainer.scrollLeft += targetX;
        }
        
        this.render();
    }

    /**
     * Gets the cell at the specified coordinates
     * @param {number} x - X coordinate relative to canvas
     * @param {number} y - Y coordinate relative to canvas
     * @returns {{row: number, col: number, address: string} | null} Cell information
     */
    getCurrentCell(x, y) {
        if (x < 0 || y < 0) return null;
        const col = Math.floor((this.scrollX + x) / this.config.columnWidth);
        const row = Math.floor((this.scrollY + y) / this.config.rowHeight);
        if (row >= this.currentRows || col >= this.currentColumns) return null;
        return { row, col, address: `${this.columnNumberToLetter(col)}${row + 1}` };
    }

    /**
     * Resets the grid to initial size
     */
    resetToInitial() {
        this.currentRows = this.config.initialRows;
        this.currentColumns = this.config.initialColumns;
        this.maxReachedRow = this.config.initialRows;
        this.maxReachedColumn = this.config.initialColumns;
        this.store = new Store(this.config.initialRows, this.config.initialColumns);
        this.columns.clear();
        for (let col = 0; col < this.config.initialColumns; col++) {
            this.columns.set(col, new Column(col, this.config.columnWidth));
        }
        this.updateScrollContent();
        this.canvasContainer.scrollLeft = 0;
        this.canvasContainer.scrollTop = 0;
        this.selectionAnchor = null;
        this.selectionEnd = null;
        this.removeSelectionDiv();
        this.removeInputBox();
        this.updateViewport();
        this.render();
    }
}