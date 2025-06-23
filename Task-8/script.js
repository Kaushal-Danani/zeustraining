// let canvas = document.querySelector('canvas');
// canvas.width = innerWidth;
// canvas.height = innerHeight;

// let penal = canvas.getContext('2d');
// // console.log(window.innerWidth);

// for (let i=0; i<(window.innerWidth/60); i++)
// {
//     penal.beginPath();
//     penal.moveTo(60*i , 0)
//     penal.lineTo(60*i, window.innerHeight);
//     penal.stroke();
// }

// for(let i=0; i<(window.innerHeight/20); i++)
// {
//     penal.beginPath();
//     penal.moveTo(0, 20*i)
//     penal.lineTo(window.innerWidth, 20*i);
//     penal.stroke();
// }

document.addEventListener("DomContentLoaded", () => {
    const mainContainer = document.getElementById('grid-container');
    const grid = new Grid(mainContainer);

    window.grid = grid;
})

const DEFAULT_CONFIG = {
    columnWidth: 100,
    rowHeight: 30,
    headerWidth: 50,
    headerHeight: 30,
    tileSize: 800,
    maxRows: 100000,
    maxColumn: 700,
    color: {
        gridLine: '#e0e0e0',
        headerBg: '#d5d5d5',
        headerText: '#333333',
        headerBorder: '#e0e0e0',
        cellBg: '#fff',
        cellText: '#000'
    },
    font: '12px Arial'
}


export class CanvasPool
{

    constructor(grid, options) {
        this.grid = grid;
        this.activeTiles = new Map();
        this.canvasPool = [];
        this.tileSize = options.tileSize || 800;
        this.rowPerTile = Math.floor(this.tileSize / grid.config.rowHeight);
        this.columnPerTile = Math.floor(this.tileSize / grid.config.columnWidth);
        this.container = grid.canvasContainer;
    }

    createNewCanavas = () => {
        const canavas = document.createElement('canvas');
        canavas.className = 'grid-tile';

        const dpr = window.devicePixelRatio || 1;
        canavas.width = this.viewportWidth * dpr;
        canavas.height = this.viewportHeight * dpr;
        canavas.style.width = `${this.viewportWidth}px`;
        canavas.style.height = `${this.viewportHeight}px`;

        const ctx = this.canavas.getContext('2d');
        ctx.scale(dpr, dpr);

        this.container.appendChild(canavas);
        return canavas;
    }

    getTileKey = (tileX, tileY) => {
        return `${tileX}_${tileY}`;
    }

    positionCanvas = (canvas, tileX, tileY) => {
        const pixelX = (tileX * this.tileSize) - this.grid.scrollX + this.grid.config.headerWidth;
        const pixelY = (tileY * this.tileSize) - this.grid.scrollY + this.grid.config.headerHeight;

        canvas.style.left = `${pixelX}px`;
        canvas.style.top = `${pixelY}px`;
        canvas.style.display = 'block';
    }

    renderTile = (canavas, tileX, tileY) => {
        const ctx = canavas.getContext('2d');
        const config = this.grid.config;

        ctx.clearRect(0, 0, this.tileSize, this.tileSize);

        const startTileX = tileX * this.tileSize;
        const startTileY = tileY * this.tileSize;

        const colStart = Math.floor(startTileX / config.columnWidth);
        const colEnd = Math.min(colStart + Math.ceil(startTileX / config.columnWidth) + 1, maxColumn);
        const rowStart = Math.floor(startTileY / config.rowHeight);
        const rowEnd = Math.min(rowStart + Math.ceil(startTileY / config.rowHeight) + 1, maxRows);

        ctx.font = config.font;

        ctx.fillStyle = config.color.cellBg;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        ctx.strokeStyle = config.color.gridLine;
        ctx.beginPath();
        for(let col=colStart; col<=colEnd; col++)
        {
            const drawLine = col * config.columnWidth;
            const accurateLine = drawLine - startTileX;
            if (accurateLine > -1 && accurateLine <= this.tileSize+1)
            {
                ctx.moveTo(accurateLine, 0);
                ctx.lineTo(accurateLine, this.tileSize);
            }
        }
        ctx.stroke();

        ctx.beginPath();
        for(let row=rowStart; row<=rowEnd; row++)
        {
            const drawLine = row * config.rowHeight;
            const accurateLine = drawLine - startTileY;
            if (accurateLine > -1 && accurateLine <= this.tileSize+1)
            {
                ctx.moveTo(0, accurateLine);
                ctx.lineTo(this.tileSize, accurateLine);
            }
        }
        ctx.stroke();
    }

    getVisibleTiles = (viewportX, viewportY, viewportWidth, viewportHeight) => {
        const buffer = this.tileSize * 0.5;

        const startTileX = Math.floor(Math.max(0, (viewportX - buffer)) / this.tileSize);
        const endTileX = Math.floor((viewportX + viewportWidth + buffer) / this.tileSize);
        const startTileY = Math.floor(Math.max(0, viewportY - buffer) / this.tileSize);
        const endTileY = Math.floor((viewportY + viewportHeight + buffer) / this.tileSize);

        const tiles = [];
        for(let x=startTileX; x<=endTileX; x++)
        {
            for(let y=startTileY; y<=endTileY; y++) {
                tiles.push({tileX: x, tileY: y});
            }
        }

        return tiles;
    }

    createTile = (tileX, tileY) => {
        const tileKey = this.getTileKey(tileX, tileY);

        if(this.activeTiles.has(tileKey)) {
            return this.activeTiles.get(tileKey);
        }

        let canvas;
        if(this.canvasPool.length > 0) {
            canvas = this.canvasPool.pop();
        }
        else {
            canvas = this.createNewCanavas();
        }

        this.positionCanvas(canvas, tileX, tileY);
        this.renderTile(canvas, tileX, tileY);

        this.activeTiles.set(tileKey, canvas);
        return canvas;
    }

    removeTile = (tileKey) => {
        const canvas = this.activeTiles.get(tileKey);

        if (canvas) {
            canvas.style.display = 'none';
            this.canvasPool.push(canvas);
            this.activeTiles.delete(canvas);
        }
    }

    updateVisiableTiles = (scrollX, scrollY, viewportWidth, viewportHeight) => {
        const visibleTiles = this.getVisibleTiles(scrollX, scrollY, viewportWidth, viewportHeight);

        const newActiveTiles = new set();

        visibleTiles.forEach(({tileX, tileY}) => {
            const tileKey = this.getTileKey(tileX, tileY);
            newActiveTiles.add(tileKey);
            this.createTile(tileX, tileY);
        });

        this.activeTiles.forEach((canavas, tileKey) => {
            if (!newActiveTiles.has(tileKey)) {
                this.activeTiles.removeTile(tileKey);
            }
        });

        repositionAllTiles();
    }

    repositionAllTiles = () => {
        this.activeTiles.forEach((canvas, tileKey) => {
            const [tileX, tileY] = tileKey.split('_').Map(Number);
            this.positionCanvas(canvas, tileX, tileY);
        });
    }
}


export class Grid {

    constructor(container, config = {}) {
        this.container = container;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.canvasContainer = document.querySelector('.canvas-container');
        this.overlayCanvas = document.querySelector('#overlay-canvas');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        this.canvasPool = new CanvasPool(this, { tileSize: this.config.tileSize });
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        this.scrollX = 0;
        this.scrollY = 0;

        initiateCanvas();
        
        updateViewport();
    }

    innitiateCanvas = () => {
        const dpr = window.devicePixelRatio || 1;

        this.viewportWidth = this.container.clientWidth;
        this.viewportHeight = this.container.clientHeight;

        this.overlayCanvas.width = this.viewportWidth * dpr;
        this.overlayCanvas.height = this.viewportHeight * dpr;
        this.overlayCanvas.style.width = `${this.viewportWidth}px`;
        this.overlayCanvas.style.height = `${this.viewportHeight}px`;

        this.overlayCtx.scale(dpr, dpr);
    }

    updateViewport = () => {

    }

    columnNumberToLetter = (colNum) => {
        const result = '';
        while (colNum >= 0) {
            result = String.fromCharCode(65 + (colNum % 26)) + result;
            colNum = Math.floor(colNum/26) - 1;
        }
        return result;
    }

    drawColumnHeader = () => {
        const overlayCtx = this.overlayCtx;
        const config = this.config;
        
        const startCol = Math.floor(this.scrollX / config.columnWidth);
        const endCol = Math.min(startCol + Math.ceil(this.viewportWidth / config.columnWidth) +1, config.maxColumn);

        overlayCtx.fillStyle = config.color.headerBg;
        overlayCtx.fillRect(config.headerWidth, 0, this.viewportWidth, config.headerHeight);

        overlayCtx.strokeStyle = config.color.headerBorder;
        overlayCtx.beginPath();
        overlayCtx.moveTo(config.headerWidth, config.headerHeight);
        overlayCtx.lineTo(this.viewportWidth, config.headerHeight);
        overlayCtx.stroke();

        overlayCtx.fillStyle = config.color.headerText;
        overlayCtx.textAlign = 'center';
        overlayCtx.textBaseline = 'middle';

        for(let col=startCol; col<endCol; col++)
        {
            const x = config.headerWidth + (col * config.columnWidth) - this.scrollX;
            if (x + config.columnWidth > this.headerWidth && x < this.viewportWidth)
            {
                const letter = this.columnNumberToLetter(col);
                overlayCtx.fillText(letter, (x+config.columnWidth)/2, config.headerHeight/2);

                overlayCtx.strokeStyle = config.color.headerBorder;
                overlayCtx.beginPath();
                overlayCtx.moveTo(x + config.columnWidth, 0);
                overlayCtx.lineTo(x + config.columnWidth, config.headerHeight);
                overlayCtx.stroke();
            }
        }
    }

    
}
