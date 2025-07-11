export class TileRenderer {
    constructor(grid, tileSize) {
        this.grid = grid;
        this.tileSize = tileSize;
        this.config = grid.config;
    }

    drawGridLines(canvas, tileX, tileY) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, this.tileSize, this.tileSize);
        ctx.fillStyle = this.config.colors.cellBg;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        ctx.strokeStyle = this.config.colors.gridLine;
        ctx.lineWidth = 1 / window.devicePixelRatio;

        let colX = -tileX * this.tileSize;
        ctx.beginPath();
        for (let col = 0; col < this.grid.currentColumns; col++) {
            const colWidth = this.grid.columns.get(col)?.width || this.config.columnWidth;
            const canvasX = colX + colWidth;
            if (canvasX >= -1 && canvasX <= this.tileSize + 1 && colWidth > 5) {
                ctx.moveTo(canvasX - 0.5, 0);
                ctx.lineTo(canvasX - 0.5, this.tileSize);
            }
            colX += colWidth;
        }
        ctx.stroke();

        let rowY = -tileY * this.tileSize;
        ctx.beginPath();
        for (let row = 0; row < this.grid.currentRows; row++) {
            const rowHeight = this.grid.store.rows.get(row)?.height || this.config.rowHeight;
            const canvasY = rowY + rowHeight;
            if (canvasY >= -1 && canvasY <= this.tileSize + 1 && rowHeight > 5) {
                ctx.moveTo(0, canvasY - 0.5);
                ctx.lineTo(this.tileSize, canvasY - 0.5);
            }
            rowY += rowHeight;
        }
        ctx.stroke();
    }

    drawSelection(canvas, tileX, tileY, range) {
        if (this.grid.selection.isEditing) return;

        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2;

        const minRow = Math.min(range.startRow, range.endRow);
        const maxRow = Math.max(range.startRow, range.endRow);
        const minCol = Math.min(range.startCol, range.endCol);
        const maxCol = Math.max(range.startCol, range.endCol);

        let selLeft = -tileX * this.tileSize;
        for (let col = 0; col < minCol; col++) {
            selLeft += this.grid.columns.get(col)?.width || this.config.columnWidth;
        }
        let selWidth = 0;
        for (let col = minCol; col <= maxCol; col++) {
            selWidth += this.grid.columns.get(col)?.width || this.config.columnWidth;
        }

        let selTop = -tileY * this.tileSize;
        for (let row = 0; row < minRow; row++) {
            selTop += this.grid.store.rows.get(row)?.height || this.config.rowHeight;
        }
        let selHeight = 0;
        for (let row = minRow; row <= maxRow; row++) {
            selHeight += this.grid.store.rows.get(row)?.height || this.config.rowHeight;
        }

        if (selLeft >= -selWidth && selLeft <= this.tileSize && selTop >= -selHeight && selTop <= this.tileSize) {
            const { borderStyle, fillStyle, handleFillStyle } = this.getSelectionStyles(range);
            ctx.strokeStyle = borderStyle;

            const isSingleRowOrCol = (this.grid.selection.getSelectedRows().size === 1 || this.grid.selection.getSelectedColumns().size === 1) && (range.type === 'column' || range.type === 'row');
            if (isSingleRowOrCol || range.type === 'cell-range' || range.type === 'cell') {
                const mod = minCol % ((this.config.tileSize / this.config.columnWidth) - 1);
                const rem = minCol / ((this.config.tileSize / this.config.columnWidth) - 1);
                let offsetX = ((mod === 0 && rem !== 0) || mod === 1) ? 1 : -1;
                let handleOffsetX = mod === 1 ? -4 : (mod === 0 && rem !== 0) ? -6 : -3;

                ctx.strokeRect(selLeft + offsetX, selTop - 1, selWidth - ((mod === 0 && rem !== 0) || mod === 1 ? 2 : -1), selHeight + 1);
                ctx.fillStyle = handleFillStyle;
                ctx.fillRect(selLeft + selWidth + handleOffsetX, selTop + selHeight - 3, 6, 6);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.strokeRect(selLeft + selWidth + handleOffsetX, selTop + selHeight - 3, 6, 6);
            }

            if (!(maxCol === minCol && maxRow === minRow)) {
                ctx.fillStyle = fillStyle;
                const fillOffsetX = minCol % ((this.config.tileSize / this.config.columnWidth) - 1);
                ctx.fillRect(selLeft + (fillOffsetX === 0 || fillOffsetX === 1 ? 2 : 0), selTop, selWidth - (fillOffsetX === 1 || fillOffsetX === 0 ? 4 : 1), selHeight - 1 );
            }
        }
    }

    getSelectionStyles(range) {
        const { selectionBorder, selectRangeColor } = this.config.colors;
        let borderStyle = selectionBorder;
        let fillStyle = selectRangeColor;
        let handleFillStyle = selectionBorder;

        if (range.type === 'cell') {
            fillStyle = 'rgba(255, 200, 200, 0.6)';
        }

        return { borderStyle, fillStyle, handleFillStyle };
    }

    drawCellValue(canvas, tileX, tileY, row, col) {
        const ctx = canvas.getContext('2d');
        ctx.font = '16px Arial';
        ctx.fillStyle = this.config.colors.cellText;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        const colWidth = this.grid.columns.get(col)?.width || this.config.columnWidth;
        const rowHeight = this.grid.store.rows.get(row)?.height || this.config.rowHeight;
        
        let colX = -tileX * this.tileSize;
        for (let i = 0; i < col; i++) {
            colX += this.grid.columns.get(i)?.width || this.config.columnWidth;
        }
        let rowY = -tileY * this.tileSize;
        for (let i = 0; i < row; i++) {
            rowY += this.grid.store.rows.get(i)?.height || this.config.rowHeight;
        }

        if (colX >= -colWidth && colX <= this.tileSize && rowY >= -rowHeight && rowY <= this.tileSize) {
            const cell = this.grid.store.getCell(row, col);
            if (cell.value && colWidth > 15) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(colX, rowY, colWidth - 3, rowHeight);
                ctx.clip();

                const canvasX = isNaN(cell.value) 
                    ? colX + 2 
                    : colX + colWidth - ctx.measureText(cell.value).width - 3;
                const canvasY = rowY + rowHeight - 3;
                console.log("Cell Value at:",canvasX, canvasY);
                ctx.fillText(cell.value, canvasX, canvasY);

                ctx.restore();
            }
        }
    }
}