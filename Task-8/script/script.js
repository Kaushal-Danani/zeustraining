import { ExcelGrid } from './ExcelGrid.js';
import { Row } from './Row.js';

// Utility function for throttling
function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function(...args) {
        const context = this;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

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
        this.loadInitialRecords();
    }

    loadInitialRecords() {
        const headers = ['ID', 'First Name', 'Last Name', 'Age', 'Salary'];
        for (let col = 0; col < headers.length; col++) {
            this.store.setCellValue(0, col, headers[col]);
        }

        const initialRows = Math.min(500, this.records.length); // Reduced initial rows
        for (let row = 0; row < initialRows; row++) {
            const record = this.records[row];
            this.store.setCellValue(row + 1, 0, record.id);
            this.store.setCellValue(row + 1, 1, record.firstName);
            this.store.setCellValue(row + 1, 2, record.lastName);
            this.store.setCellValue(row + 1, 3, record.Age);
            this.store.setCellValue(row + 1, 4, record.Salary);
        }

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

        const chunkSize = this.config.loadChunkRows || 200; // Smaller chunk size
        const newRowCount = Math.min(
            this.currentRows + chunkSize,
            this.records.length + 1
        );
        const startRow = this.currentRows;
        const endRow = newRowCount - 1;

        for (let row = startRow; row <= endRow; row++) {
            if (!this.store.rows.has(row)) {
                this.store.rows.set(row, new Row(row, this.currentColumns));
            }
            const recordIndex = row - 1;
            if (recordIndex < this.records.length) {
                const record = this.records[recordIndex];
                this.store.setCellValue(row, 0, record.id);
                this.store.setCellValue(row, 1, record.firstName);
                this.store.setCellValue(row, 2, record.lastName);
                this.store.setCellValue(row, 3, record.Age);
                this.store.setCellValue(row, 4, record.Salary);
            }
        }

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

        this.canvasContainer.addEventListener('scroll', (e) => {
             if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout); // Clear previous timeout if any
            }

            this.debounceTimeout = setTimeout(() => {
                // Your scroll logic goes here
                this.scrollX = Math.floor(e.target.scrollLeft);
                this.scrollY = Math.floor(e.target.scrollTop);

                // Check and adapt content, update viewport, render tiles, etc.
                this.checkAndAdaptContent();
                this.updateViewport();
                this.headerRenderer.drawColumnHeaders();
                this.headerRenderer.drawRowHeaders();
                this.canvasPool.renderTiles();
            }, 80);
        });

        // Smooth wheel scrolling
        this.canvasContainer.addEventListener('wheel', (e) => {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout); // Clear previous timeout if any
            }

            this.debounceTimeout = setTimeout(() => {
                e.preventDefault(); // Stop default scrolling

                // Adjust scroll position
                this.canvasContainer.scrollLeft += deltaX;
                this.canvasContainer.scrollTop += deltaY;
            }, 80);
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