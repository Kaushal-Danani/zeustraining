import { CommandManager } from "../command-pattern/CommandManager.js";

export class EventManager {
    constructor(grid, selection) {
        this.grid = grid;
        this.selection = selection;
        this.eventHandlers = [];
        this.currHandler = null;
        this.startCell = null;
        this.endCell = null;

        this.isShiftSelectionActive = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvasContainer = this.grid.canvasContainer;
        window.addEventListener('pointerdown', (e) => this.pointerDown(e));
        window.addEventListener('pointermove', (e) => this.pointerMove(e));
        window.addEventListener('pointerup', (e) => this.pointerUp(e));
        canvasContainer.addEventListener('dblclick', (e) => this.dblclick(e));
        window.addEventListener('keydown', (e) => this.keyDown(e));
    }

    registerHandler(handler) {
        this.eventHandlers.push(handler);
    }

    pointerDown(e) {
        for (const handler of this.eventHandlers) {
            if (handler.hitTest(e)) {
                this.currHandler = handler;
                break;
            }
        }

        if (this.currHandler) {
            this.currHandler.pointerDown(e);
            const x = e.clientX - this.grid.config.headerWidth;
            const y = e.clientY - this.grid.config.headerHeight;
            const cell = this.grid.getCurrentCell(x, y);
            if (cell && this.isCellInSelectedRange(cell.row, cell.col)) {
                this.selection.setActiveCell(cell.row, cell.col);
                this.selection.setAnchorCell(cell.row, cell.col);
            } else if (cell) {
                this.selection.setAnchorCell(cell.row, cell.col);
                this.selection.setActiveCell(cell.row, cell.col);
            }
        }
    }

    pointerMove(e) {
        if (this.currHandler) {
            this.currHandler.pointerMove(e);
        } 
        // else {
        //     for (const handler of this.eventHandlers) {
        //         if (handler.hitTest(e)) {
        //             // setCursor();
        //             break;
        //         }
        //     }
        // }
    }

    pointerUp(e) {
        if (this.currHandler) {
            this.currHandler.pointerUp(e);
        }
        this.currHandler = null;
    }

    dblclick(e) {
        if (this.selection.isEditing) return;

        const x = e.clientX - this.grid.config.headerWidth;
        const y = e.clientY - this.grid.config.headerHeight;

        const cell = this.grid.getCurrentCell(x, y);
        if (cell) {
            this.startCell = cell;
            this.endCell = cell;
            this.selection.isEditing = true;
            this.selection.store.clearSelections();
            const range = { startRow: cell.row, startCol: cell.col, endRow: cell.row, endCol: cell.col, type: 'cell' };
            this.selection.selectedRanges = [range];
            this.selection.setAnchorCell(cell.row, cell.col);
            this.selection.setActiveCell(cell.row, cell.col);
            this.selection.store.setSelectionRange(cell.row, cell.col, cell.row, cell.col, true);
            this.selection.createInputBox(cell);
        }
    }

    isCellInSelectedRange(row, col) {
        return this.selection.selectedRanges.some(range => {
            const minRow = Math.min(range.startRow, range.endRow);
            const maxRow = Math.max(range.startRow, range.endRow);
            const minCol = Math.min(range.startCol, range.endCol);
            const maxCol = Math.max(range.startCol, range.endCol);
            return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
        });
    }

    keyDown(e) {
        if (this.selection.isEditing) return;

        if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            this.grid.commandManager.undo();
            return;
        } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            this.grid.commandManager.redo();
            return;
        }

        this.startCell = this.selection.startCell;
        this.endCell = this.selection.endCell;
        
        let activeRow = this.selection.activeCell?.row ?? this.startCell?.row ?? 0;
        let activeCol = this.selection.activeCell?.col ?? this.startCell?.col ?? 0;
        let newRow = activeRow;
        let newCol = activeCol;
        let updateActiveCell = false;

        // Check if the selection is a single cell (no range)
        const isSingleCell = this.selection.selectedRanges.length === 1 &&
            this.selection.selectedRanges[0].startRow === this.selection.selectedRanges[0].endRow &&
            this.selection.selectedRanges[0].startCol === this.selection.selectedRanges[0].endCol;

        const isAlphanumericOrSpecial = /^[a-zA-Z0-9`~!@#$%^&*()_+\-=\[\]{}\\|;:'",.<>\/?]$/.test(e.key);
        if (isAlphanumericOrSpecial && this.startCell && isSingleCell) {
            e.preventDefault();
            this.selection.isEditing = true;
            this.selection.store.clearSelections();
            const range = { startRow: this.startCell.row, startCol: this.startCell.col, endRow: this.startCell.row, endCol: this.startCell.col, type: 'cell' };
            this.selection.selectedRanges = [range];
            this.selection.store.setSelectionRange(this.startCell.row, this.startCell.col, this.startCell.row, this.startCell.col, true);
            this.selection.createInputBox(this.startCell, e.key);
            return;
        } else if (isAlphanumericOrSpecial && this.selection.anchorCell) {
            e.preventDefault();
            this.selection.isEditing = true;
            this.selection.createInputBox({ row: newRow, col: newCol }, e.key); // Use anchor cell position
            return;
        }

        const range = this.selection.selectedRanges[0];
        const minRow = Math.min(range.startRow, range.endRow);
        const maxRow = Math.max(range.startRow, range.endRow);
        const minCol = Math.min(range.startCol, range.endCol);
        const maxCol = Math.max(range.startCol, range.endCol);

        // Helper for shift+arrow selection expansion
        const expandSelection = (direction) => {
            this.isShiftSelectionActive = true;
            let anchor = this.selection.anchorCell || this.selection.activeCell;
            let endRow = this.selection.selectedRanges[0].endRow;
            let endCol = this.selection.selectedRanges[0].endCol;
            switch (direction) {
                case 'up': endRow = Math.max(0, endRow - 1); break;
                case 'down': endRow = Math.min(this.grid.currentRows - 1, endRow + 1); break;
                case 'left': endCol = Math.max(0, endCol - 1); break;
                case 'right': endCol = Math.min(this.grid.currentColumns - 1, endCol + 1); break;
            }
            let range = {
                startRow: anchor.row,
                startCol: anchor.col,
                endRow,
                endCol,
                type: 'cell-range'
            };
            this.selection.selectedRanges = [range];
            this.selection.store.setSelectionRange(anchor.row, anchor.col, endRow, endCol, true);
            console.log(endRow, activeRow, endCol, activeCol);
            this.grid.scrollToCell(endRow, activeRow, endCol, activeCol);
            this.selection.rerenderSelectionChangeEffect(range);
        };

        switch (e.key) {
            case 'Tab':
                e.preventDefault();
                if (e.shiftKey) {
                    if (this.selection.selectedRanges.length > 0 && !isSingleCell) {
                        if (activeCol > minCol) {
                            newCol = activeCol - 1;
                        } else {
                            newCol = maxCol;
                            newRow = activeRow > minRow ? activeRow - 1 : maxRow;
                        }
                    } else {
                        newCol = this.selection.activeCell.col = Math.max(0, newCol - 1);
                    }
                }
                else {
                    if (this.selection.selectedRanges.length > 0 && !isSingleCell) {
                       if (activeCol < maxCol) {
                            newCol = activeCol + 1;
                        } else {
                            newCol = minCol;
                            newRow = activeRow < maxRow ? activeRow + 1 : minRow;
                        }
                    } else {
                        newCol = this.selection.activeCell.col = Math.min(this.grid.currentColumns - 1, newCol + 1);
                    }
                }
                updateActiveCell = true;
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (e.shiftKey) {
                    expandSelection('up');
                } else if (isSingleCell || this.isShiftSelectionActive) {
                    newRow = this.selection.activeCell.row = Math.max(0, newRow - 1);
                    updateActiveCell = true;
                    this.isShiftSelectionActive = false;
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (e.shiftKey) {
                    expandSelection('down');
                } else if (isSingleCell || this.isShiftSelectionActive) {
                    newRow = this.selection.activeCell.row = Math.min(this.grid.currentRows - 1, newRow + 1);
                    updateActiveCell = true;
                    this.isShiftSelectionActive = false;
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (e.shiftKey) {
                    expandSelection('left');
                } else if (isSingleCell || this.isShiftSelectionActive) {
                    newCol = this.selection.activeCell.col = Math.max(0, newCol - 1);
                    updateActiveCell = true;
                    this.isShiftSelectionActive = false;
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (e.shiftKey) {
                    expandSelection('right');
                } else if (isSingleCell || this.isShiftSelectionActive) {
                    newCol = this.selection.activeCell.col = Math.min(this.grid.currentColumns - 1, newCol + 1);
                    updateActiveCell = true;
                    this.isShiftSelectionActive = false;
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (e.shiftKey) {
                    if (this.selection.selectedRanges.length > 0 && !isSingleCell) {
                        if (activeRow > minRow) {
                            newRow = activeRow - 1;
                        } else if (activeCol > minCol) {
                            newRow = maxRow;
                            newCol = activeCol - 1;
                        } else {
                            newRow = maxRow;
                            newCol = maxCol;
                        }
                    } else {
                        newRow = this.selection.activeCell.row = Math.max(0, newRow - 1);
                    }
                } else {
                    if (this.selection.selectedRanges.length > 0 && !isSingleCell) {
                        if (activeRow < maxRow) {
                            newRow = activeRow + 1;
                        } else if (activeCol < maxCol) {
                            newRow = minRow;
                            newCol = activeCol + 1;
                        } else {
                            newRow = minRow;
                            newCol = minCol;
                        }
                    } else {
                        newRow = this.selection.activeCell.row = Math.min(this.grid.currentRows - 1, newRow + 1);
                    }
                }
                updateActiveCell = true;
                break;
            default:
                break;
        }

        if (updateActiveCell && (newRow !== activeRow || newCol !== activeCol) && !isSingleCell) {
            this.selection.setActiveCell(newRow, newCol);
            this.selection.setAnchorCell(newRow, newCol); // Move anchor cell with navigation
            const range = { startRow: newRow, startCol: newCol, endRow: newRow, endCol: newCol, type: 'cell' };
            if (!this.isCellInSelectedRange(newRow, newCol)) {
                this.selection.store.clearSelections();
                this.selection.selectedRanges = [range];
                this.selection.setAnchorCell(newRow, newCol);
                this.selection.store.setSelectionRange(newRow, newCol, newRow, newCol, true);   
            }
            this.grid.scrollToCell(newRow, activeRow, newCol, activeCol);
            this.selection.rerenderSelectionChangeEffect(range);
        } else if (newRow === this.startCell.row && newCol === this.startCell.col) {
            return;
        }
        else {
            this.selection.store.clearSelections();
            const range = { startRow: newRow, startCol: newCol, endRow: newRow, endCol: newCol, type: 'cell' };
            this.selection.selectedRanges = [range];
            this.selection.store.setSelectionRange(newRow, newCol, newRow, newCol, true);
            this.grid.scrollToCell(newRow, this.startCell.row, newCol, this.startCell.col);
            this.startCell = { row: newRow, col: newCol, address: `${this.grid.columnNumberToLetter(newCol)}${newRow + 1}` };
            this.endCell = this.startCell;
            this.selection.startCell = this.startCell; // Global access for next key event and keep track of previous cell
            this.selection.endCell = this.endCell; // Global access for next key event and keep track of previous cell
            
            this.selection.rerenderSelectionChangeEffect(range);
        }
    }
}