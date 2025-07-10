/**
 * Handles rendering of grid headers (column, row, and corner)
 */
export class HeaderRenderer {
    /**
     * Initializes the HeaderRenderer object
     * @param {ExcelGrid} grid - Reference to the main ExcelGrid instance
     */
    constructor(grid) {
        this.grid = grid;
    }

    /**
     * Draws the horizontal column headers with highlight for selected columns
     */
    drawColumnHeaders() {
        const ctx = this.grid.horizontalCtx;
        const config = this.grid.config;
        
        let colX = this.grid.config.headerWidth - this.grid.scrollX;
        let col = 0;
        while (colX < this.grid.viewportWidth && col < this.grid.currentColumns) {
            colX += this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
            col++;
        }
        const endCol = Math.min(col, this.grid.currentColumns);

        ctx.clearRect(0, 0, window.innerWidth, config.headerHeight);
        
        const selectedCols = this.grid.selection.getSelectedColumns();
        // Draw header backgrounds
        colX = this.grid.config.headerWidth - this.grid.scrollX;
        for (col = 0; col < endCol; col++) {
            const colWidth = this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
            if (colX + colWidth > 0 && colX < this.grid.viewportWidth) {
                // Find the selection range that includes this column
                const range = this.grid.selection.selectedRanges.find(r => 
                    col >= Math.min(r.startCol, r.endCol) && col <= Math.max(r.startCol, r.endCol)
                );

                let fillStyle = config.colors.headerBg; // Default background
                if (range && (range.type === 'cell' || range.type === 'cell-range' || range.endCol > col) && range.type !== 'column-range')
                    fillStyle = config.colors.headerHighlight;
                else if (range && (range.type === 'column' || range.type === 'column-range'))
                    fillStyle = config.colors.headerSelectFill;
                else if (selectedCols.has(col))
                    fillStyle = config.colors.headerHighlight;

                ctx.fillStyle = fillStyle;

                const currentColumnRange = this.grid.selection.selectedRanges.find(r => r.startCol == col  && r.endCol == col && r.startRow == 0 && r.endRow >= config.initialRows-1);
                if (currentColumnRange && selectedCols.has(col)) {
                    ctx.fillStyle = config.colors.headerSelectFill;
                }
                ctx.fillRect(colX, 0, colWidth, config.headerHeight);
            }
            colX += colWidth;
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
        
        colX = this.grid.config.headerWidth - this.grid.scrollX;
        for (col = 0; col < endCol; col++) {
            const colWidth = this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
            if (colX + colWidth > 0 && colX < this.grid.viewportWidth && colWidth > 5) {
                const letter = this.grid.columnNumberToLetter(col);
                    
                let fillStyle = 'black', font = config.font;
                const currentColumnRange = this.grid.selection.selectedRanges.find(r => r.startCol == col && r.endCol == col && r.startRow == 0 && r.endRow >= config.initialRows-1);
                if (currentColumnRange && selectedCols.has(col)) {
                    fillStyle = 'white';
                    font = 'bold 12px Arial';
                }
                ctx.font = font;
                ctx.fillStyle = fillStyle;
                ctx.fillText(letter, colX + colWidth / 2, config.headerHeight / 2);
                
                ctx.strokeStyle = config.colors.headerBorder;
                ctx.lineWidth = 1 / window.devicePixelRatio;
                ctx.beginPath();
                ctx.moveTo(colX + colWidth - 0.5, 0);
                ctx.lineTo(colX + colWidth - 0.5, config.headerHeight);
                ctx.stroke();
            }
            colX += colWidth;
        }

        // Draw bottom border for selected columns
        if (selectedCols.size > 0) {
            ctx.lineWidth = 2;
            colX = this.grid.config.headerWidth - this.grid.scrollX;
            for (col = 0; col < endCol; col++) {
                const colWidth = this.grid.columns.get(col)?.width || this.grid.config.columnWidth;
                if (selectedCols.has(col) && colX + colWidth > 0 && colX < this.grid.viewportWidth) {
                    ctx.strokeStyle = config.colors.headerHighlightBorder;
                    ctx.beginPath();
                    ctx.moveTo(colX - 2, config.headerHeight - 1);
                    ctx.lineTo(colX + colWidth + 1, config.headerHeight - 1);
                    ctx.stroke();
                }
                colX += colWidth;
            }
        }
    }

    /**
     * Draws the vertical row headers with highlight for selected rows
     */
    drawRowHeaders() {
        const ctx = this.grid.verticalCtx;
        const config = this.grid.config;
        
        let rowY = this.grid.config.headerHeight - this.grid.scrollY;
        let row = 0;
        while (rowY < this.grid.viewportHeight && row < this.grid.currentRows) {
            rowY += this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;
            row++;
        }
        const endRow = Math.min(row, this.grid.currentRows);

        ctx.clearRect(0, 0, config.headerWidth, window.innerHeight);
        
        const selectedRows = this.grid.selection.getSelectedRows();
        // Draw header backgrounds
        rowY = this.grid.config.headerHeight - this.grid.scrollY;
        for (row = 0; row < endRow; row++) {
            const rowHeight = this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;
            if (rowY + rowHeight > 0 && rowY < this.grid.viewportHeight) {
                // Find the selection range that includes this row
                const range = this.grid.selection.selectedRanges.find(r => 
                    row >= Math.min(r.startRow, r.endRow) && row <= Math.max(r.startRow, r.endRow)
                );

                let fillStyle = config.colors.headerBg; // Default background
                if (range && (range.type === 'cell' || range.type === 'cell-range' || range.endRow > row) && range.type !== 'row-range')
                    fillStyle = config.colors.headerHighlight;
                else if (range && (range.type === 'row' || range.type === 'row-range'))
                    fillStyle = config.colors.headerSelectFill;
                else if (selectedRows.has(row))
                    fillStyle = config.colors.headerHighlight;

                ctx.fillStyle = fillStyle;
                
                const currentRowRange = this.grid.selection.selectedRanges.find(r => r.startRow == row && r.endRow == row && r.startCol == 0 && r.endCol >= config.initialColumns-1);
                if (currentRowRange && selectedRows.has(row)) {
                    ctx.fillStyle = config.colors.headerSelectFill;
                }

                ctx.fillRect(0, rowY, config.headerWidth, rowHeight);
            }
            rowY += rowHeight;
        }
        
        // Draw right border
        ctx.strokeStyle = config.colors.headerBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(config.headerWidth - 0.5, 0);
        ctx.lineTo(config.headerWidth - 0.5, window.innerHeight);
        ctx.stroke();
        
        // Draw horizontal lines and text
        ctx.fillStyle = config.colors.headerText;
        ctx.font = config.font;
        ctx.textBaseline = 'middle';
        
        rowY = this.grid.config.headerHeight - this.grid.scrollY;
        for (row = 0; row < endRow; row++) {
            const rowHeight = this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;
            if (rowY + rowHeight > 0 && rowY < this.grid.viewportHeight && rowHeight > 5) {   
                let fillStyle = 'black', font = config.font;
                const currentRowRange = this.grid.selection.selectedRanges.find(r => r.startRow == row && r.endRow == row && r.startCol == 0 && r.endCol >= config.initialColumns-1);
                if (currentRowRange && selectedRows.has(row)) {
                    fillStyle = 'white';
                    font = 'bold 12px Arial';
                }
                ctx.font = font;
                ctx.fillStyle = fillStyle;
                ctx.fillText(String(row+1), config.headerWidth - ctx.measureText(row+1).width - 5, rowY + rowHeight / 2);
                
                ctx.strokeStyle = config.colors.headerBorder;
                ctx.lineWidth = 1 / window.devicePixelRatio;
                ctx.beginPath();
                ctx.moveTo(0, rowY + rowHeight - 0.5);
                ctx.lineTo(config.headerWidth, rowY + rowHeight - 0.5);
                ctx.stroke();
            }
            rowY += rowHeight;
        }

        // Draw right border for selected rows
        if (selectedRows.size > 0) {
            ctx.lineWidth = 4;
            rowY = this.grid.config.headerHeight - this.grid.scrollY;
            for (row = 0; row < endRow; row++) {
                const rowHeight = this.grid.store.rows.get(row)?.height || this.grid.config.rowHeight;
                if (selectedRows.has(row) && rowY + rowHeight > 0 && rowY < this.grid.viewportHeight) {
                    ctx.strokeStyle = config.colors.headerHighlightBorder;
                    ctx.beginPath();
                    ctx.moveTo(config.headerWidth, rowY - 2);
                    ctx.lineTo(config.headerWidth, rowY + rowHeight + 1);
                    ctx.stroke();
                }
                rowY += rowHeight;
            }
        }
    }

    /**
     * Draws the corner header
     */
    drawCornerHeader() {
        const intersection = document.getElementById('top-left-intersection');
        intersection.style.width = `${this.grid.config.headerWidth}px`;
        intersection.style.height = `${this.grid.config.headerHeight}px`;
        intersection.style.backgroundColor = this.grid.config.colors.headerBg;
        intersection.style.borderRight = `1px solid ${this.grid.config.colors.headerBorder}`;
        intersection.style.borderBottom = `1px solid ${this.grid.config.colors.headerBorder}`;
    }
}