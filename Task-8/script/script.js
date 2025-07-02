import { ExcelGrid } from './ExcelGrid.js';

document.addEventListener("DOMContentLoaded", () => {
    const mainContainer = document.getElementById('grid-container');
    const grid = new ExcelGrid(mainContainer);

    // window.excelGrid = grid;
})