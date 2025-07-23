import { ExcelGrid } from './ExcelGrid.js';
import { Row } from './Row.js';

const firstNames = [
    "Raj", "Amit", "Priya", "Sneha", "Vikram", "Anjali", "Rahul", "Neha", 
    "Sanjay", "Pooja", "Arjun", "Kavita", "Rohan", "Shalini", "Vivek", "Meera"
];
const lastNames = [
    "Solanki", "Patel", "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Jain", 
    "Mehta", "Yadav", "Reddy", "Nair", "Chopra", "Das", "Joshi", "Malhotra"
];

function generateRandomRecords(numRecords) {
    const records = [];
    for (let i = 0; i < numRecords; i++) {
        const record = {
            id: i + 1,
            firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
            lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
            Age: Math.floor(Math.random() * (60 - 18 + 1)) + 18,
            Salary: Math.floor(Math.random() * (2000000 - 50000 + 1)) + 50000
        };
        records.push(record);
    }
    console.log(`Generated ${records.length} records`);
    return records;
}

class ExtendedExcelGrid extends ExcelGrid {
    constructor(container, config = {}, records) {
        super(container, config);
        this.records = records;
        this.loadedRecordCount = 0;
        // Set grid reference in Store
        this.store.setGrid(this);
        this.loadInitialRecords();
    }

    loadInitialRecords() {
        const headers = ['ID', 'First Name', 'Last Name', 'Age', 'Salary'];
        // Batch header updates
        const headerValues = headers.map((header, col) => ({
            row: 0,
            col,
            value: header
        }));
        this.store.setCellValues(headerValues);

        const initialRows = Math.min(500, this.records.length);
        const cellValues = [];
        for (let row = 0; row < initialRows; row++) {
            const record = this.records[row];
            cellValues.push(
                { row: row + 1, col: 0, value: record.id },
                { row: row + 1, col: 1, value: record.firstName },
                { row: row + 1, col: 2, value: record.lastName },
                { row: row + 1, col: 3, value: record.Age },
                { row: row + 1, col: 4, value: record.Salary }
            );
        }
        this.store.setCellValues(cellValues);

        this.loadedRecordCount = initialRows;
        this.currentRows = Math.max(this.currentRows, initialRows + 1);
        this.currentColumns = Math.max(this.currentColumns, headers.length);
        this.maxReachedRow = this.currentRows;
        this.maxReachedColumn = headers.length;

        this.store.updateColumns(headers.length);
        for (let col = 0; col < headers.length; col++) {
            if (!this.columns.has(col)) {
                this.columns.set(col, new this.columns.constructor(col, this.config.columnWidth));
            }
        }

        this.updateScrollContent();
        this.updateViewport();
        this.canvasPool.renderTiles();
        this.headerRenderer.drawColumnHeaders();
        this.headerRenderer.drawRowHeaders();
        console.log(`Loaded initial ${initialRows} records, total rows: ${this.currentRows}`);
    }

    loadMoreRows() {
        if (this.isLoadingRows || this.currentRows >= this.records.length + 1) return;

        this.isLoadingRows = true;

        const chunkSize = this.config.loadChunkRows || 200;
        const newRowCount = Math.min(
            this.currentRows + chunkSize,
            this.records.length + 1
        );
        const startRow = this.currentRows;
        const endRow = newRowCount - 1;

        const cellValues = [];
        for (let row = startRow; row <= endRow; row++) {
            if (!this.store.rows.has(row)) {
                this.store.rows.set(row, new Row(row, this.currentColumns));
            }
            const recordIndex = row - 1;
            if (recordIndex < this.records.length) {
                const record = this.records[recordIndex];
                cellValues.push(
                    { row, col: 0, value: record.id },
                    { row, col: 1, value: record.firstName },
                    { row, col: 2, value: record.lastName },
                    { row, col: 3, value: record.Age },
                    { row, col: 4, value: record.Salary }
                );
            }
        }
        this.store.setCellValues(cellValues);

        this.loadedRecordCount = endRow;
        this.currentRows = newRowCount;
        this.maxReachedRow = this.currentRows;

        this.updateScrollContent();
        this.updateViewport();
        this.canvasPool.renderTiles();
        this.headerRenderer.drawRowHeaders();

        this.isLoadingRows = false;
        console.log(`Loaded records from row ${startRow} to ${endRow}, total rows: ${this.currentRows}`);
    }

    setupEventListeners() {
        super.setupEventListeners();

        // Utility: Throttle function
        function throttle(callback, delay) {
            let lastCall = 0;
            return function (...args) {
                const now = Date.now();
                if (now - lastCall >= delay) {
                lastCall = now;
                callback.apply(this, args);
                }
            };
        }

        // Use throttle instead of debounce for smoother scrolling
        const throttledScroll = throttle(() => {
            this.scrollX = Math.floor(this.canvasContainer.scrollLeft);
            this.scrollY = Math.floor(this.canvasContainer.scrollTop);

            this.checkAndAdaptContent();
            this.updateViewport();
            this.headerRenderer.drawColumnHeaders();
            this.headerRenderer.drawRowHeaders();
            this.canvasPool.renderTiles();
        }, 20);

        this.canvasContainer.addEventListener('scroll', throttledScroll);

        // Smooth wheel scrolling
        this.canvasContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const deltaX = e.deltaX;
            const deltaY = e.deltaY;
            this.canvasContainer.scrollLeft += deltaX;
            this.canvasContainer.scrollTop += deltaY;
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const mainContainer = document.getElementById('grid-container');
    const records = generateRandomRecords(50000);
    const grid = new ExtendedExcelGrid(mainContainer, {}, records);

    // const jsonData = JSON.stringify(records, null, 2);
    // console.log('Generated JSON:', jsonData);
});