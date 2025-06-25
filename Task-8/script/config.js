/**
 * Default configuration object for the Excel Grid
 * @type {Object}
 * @property {number} rowHeight - Height of each row in pixels
 * @property {number} columnWidth - Width of each column in pixels
 * @property {number} headerHeight - Height of the header row in pixels
 * @property {number} headerWidth - Width of the header column in pixels
 * @property {number} maxRows - Maximum number of rows allowed
 * @property {number} maxColumns - Maximum number of columns allowed
 * @property {number} initialRows - Initial number of visible rows
 * @property {number} initialColumns - Initial number of visible columns
 * @property {number} loadChunkRows - Number of rows to add when expanding
 * @property {number} loadChunkColumns - Number of columns to add when expanding
 * @property {number} tileSize - Size of each canvas tile in pixels
 * @property {number} loadThreshold - Scroll threshold for loading more content
 * @property {number} contractThreshold - Scroll threshold for contracting content
 * @property {number} minBuffer - Minimum buffer to maintain when contracting
 * @property {Object} colors - Color configuration object
 * @property {string} font - Font configuration string
 */
export const DEFAULT_CONFIG = {
    rowHeight: 25,
    columnWidth: 100,
    headerHeight: 25,
    headerWidth: 50,
    maxRows: Number.MAX_SAFE_INTEGER,
    maxColumns: Number.MAX_SAFE_INTEGER,
    initialRows: 100,
    initialColumns: 20,
    loadChunkRows: 20,
    loadChunkColumns: 8,
    tileSize: 800,
    loadThreshold: 0.8,
    contractThreshold: 0.3, 
    minBuffer: 10,       
    colors: {
        gridLine: '#e0e0e0',
        headerBg: '#f5f5f5',
        headerText: '#333333',
        headerBorder: '#d0d0d0',
        cellBg: '#ffffff',
        cellText: '#000000'
    },
    font: '12px Arial'
};