// 游戏配置
const GRID_SIZE = 4;
const CELL_SIZE = 106.25;
const CELL_GAP = 15;
const WINNING_TILE = 2048;

// 游戏状态
let grid = [];
let score = 0;
let bestScore = 0;
let won = false;
let over = false;
let keepPlaying = false;

// 方块状态跟踪（用于动画）
let tiles = [];
let tileIdCounter = 0;

// 撤销历史记录
let history = [];
const MAX_HISTORY = 10;

// DOM 元素
const splashScreen = document.getElementById('splash-screen');
const splashStartButton = document.getElementById('splash-start-button');
const gameContainer = document.getElementById('game-container');
const tileContainer = document.getElementById('tile-container');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const gameMessage = document.getElementById('game-message');
const restartButton = document.getElementById('restart-button');
const retryButton = document.getElementById('retry-button');
const keepPlayingButton = document.getElementById('keep-playing-button');
const undoButton = document.getElementById('undo-button');

// 触摸状态
let touchStartX = 0;
let touchStartY = 0;

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    loadBestScore();
    setupInput();
    setupSplashScreen();
    hideGameContainer();
});

// 设置开场界面
function setupSplashScreen() {
    splashStartButton.addEventListener('click', startGame);
    
    document.addEventListener('keydown', (e) => {
        if (splashScreen.style.display !== 'none') {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startGame();
            }
        }
    });
}

// 开始游戏
function startGame() {
    splashScreen.style.display = 'none';
    showGameContainer();
    restartGame();
}

// 显示游戏容器
function showGameContainer() {
    gameContainer.style.display = 'block';
    gameContainer.classList.add('game-fade-in');
}

// 隐藏游戏容器
function hideGameContainer() {
    gameContainer.style.display = 'none';
}

// 加载最佳分数
function loadBestScore() {
    const saved = localStorage.getItem('2048-best-score');
    if (saved) {
        bestScore = parseInt(saved, 10);
        updateScoreDisplay();
    }
}

// 保存最佳分数
function saveBestScore() {
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('2048-best-score', bestScore.toString());
        updateScoreDisplay();
    }
}

// 更新分数显示
function updateScoreDisplay() {
    animateScore(scoreElement, score);
    animateScore(bestScoreElement, bestScore);
}

// 分数动画
function animateScore(element, targetValue) {
    const currentValue = parseInt(element.textContent, 10) || 0;
    if (currentValue === targetValue) return;
    
    const diff = targetValue - currentValue;
    const steps = 10;
    const stepValue = diff / steps;
    let currentStep = 0;
    
    element.classList.add('score-changed');
    
    const animate = () => {
        currentStep++;
        const newValue = Math.round(currentValue + stepValue * currentStep);
        element.textContent = newValue;
        
        if (currentStep < steps) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = targetValue;
            element.classList.remove('score-changed');
        }
    };
    
    requestAnimationFrame(animate);
}

// 重新开始游戏
function restartGame() {
    grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    tiles = [];
    tileIdCounter = 0;
    history = [];
    score = 0;
    won = false;
    over = false;
    keepPlaying = false;
    
    updateScoreDisplay();
    updateUndoButton();
    hideMessage();
    
    addRandomTile();
    addRandomTile();
    renderGrid();
}

// 在随机空白位置生成新方块
function addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === 0) {
                emptyCells.push({ r, c });
            }
        }
    }
    
    if (emptyCells.length > 0) {
        const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        grid[r][c] = value;
        tiles.push({ id: tileIdCounter++, r, c, value, isNew: true, isMerged: false });
        return { r, c, value };
    }
    return null;
}

// 渲染网格
function renderGrid() {
    const existingTiles = new Set();
    const cellSize = getCellSize();
    const gap = getGap();
    
    tiles.forEach(tile => {
        const existingTile = document.querySelector(`.tile[data-id="${tile.id}"]`);
        if (existingTile) {
            existingTile.classList.remove('tile-new', 'tile-merged');
            existingTile.style.width = `${cellSize}px`;
            existingTile.style.height = `${cellSize}px`;
            if (tile.isNew) existingTile.classList.add('tile-new');
            if (tile.isMerged) existingTile.classList.add('tile-merged');
            existingTile.style.transform = `translate(${tile.c * (cellSize + gap)}px, ${tile.r * (cellSize + gap)}px)`;
            existingTile.textContent = tile.value;
            existingTile.className = `tile tile-${tile.value <= 2048 ? tile.value : 'super'}`;
            existingTile.style.width = `${cellSize}px`;
            existingTile.style.height = `${cellSize}px`;
            if (tile.isNew) existingTile.classList.add('tile-new');
            if (tile.isMerged) existingTile.classList.add('tile-merged');
            existingTiles.add(tile.id);
        } else {
            const newTile = createTileElement(tile, cellSize);
            tileContainer.appendChild(newTile);
            existingTiles.add(tile.id);
        }
    });
    
    document.querySelectorAll('.tile').forEach(tile => {
        const id = parseInt(tile.dataset.id, 10);
        if (!existingTiles.has(id)) {
            tile.remove();
        }
    });
    
    tiles.forEach(tile => {
        tile.isNew = false;
        tile.isMerged = false;
    });
}

// 获取当前间隙大小
function getGap() {
    const width = window.innerWidth;
    return width <= 520 ? 10 : 15;
}

// 获取当前padding大小
function getPadding() {
    const width = window.innerWidth;
    return width <= 520 ? 10 : 15;
}

// 获取单元格大小
function getCellSize() {
    const gridCell = document.querySelector('.grid-cell');
    if (gridCell) {
        return gridCell.offsetWidth;
    }
    const width = window.innerWidth;
    const containerWidth = width <= 520 ? Math.min(width - 20, 480) : 500;
    const padding = getPadding();
    const gap = getGap();
    return (containerWidth - padding * 2 - (GRID_SIZE - 1) * gap) / GRID_SIZE;
}

// 创建方块 DOM 元素
function createTileElement(tile, cellSize) {
    const element = document.createElement('div');
    element.className = `tile tile-${tile.value <= 2048 ? tile.value : 'super'}`;
    if (tile.isNew) element.classList.add('tile-new');
    if (tile.isMerged) element.classList.add('tile-merged');
    element.textContent = tile.value;
    element.dataset.id = tile.id;
    element.style.width = `${cellSize}px`;
    element.style.height = `${cellSize}px`;
    element.style.transform = `translate(${tile.c * (cellSize + getGap())}px, ${tile.r * (cellSize + getGap())}px)`;
    return element;
}

// 设置输入事件
function setupInput() {
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
    
    // 窗口大小变化时重新渲染
    window.addEventListener('resize', () => {
        if (tiles.length > 0) {
            renderGrid();
        }
    });
    
    // 触摸事件
    const gameContainer = document.querySelector('.game-container');
    gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 鼠标滑动事件（用于桌面端测试）
    let mouseDown = false;
    gameContainer.addEventListener('mousedown', (e) => {
        mouseDown = true;
        touchStartX = e.clientX;
        touchStartY = e.clientY;
    });
    gameContainer.addEventListener('mousemove', (e) => {
        if (!mouseDown) return;
        e.preventDefault();
    });
    gameContainer.addEventListener('mouseup', (e) => {
        if (!mouseDown) return;
        mouseDown = false;
        const dx = e.clientX - touchStartX;
        const dy = e.clientY - touchStartY;
        handleSwipe(dx, dy);
    });
    gameContainer.addEventListener('mouseleave', () => {
        mouseDown = false;
    });
    
    // 按钮事件
    restartButton.addEventListener('click', restartGame);
    retryButton.addEventListener('click', restartGame);
    keepPlayingButton.addEventListener('click', () => {
        keepPlaying = true;
        hideMessage();
    });
    undoButton.addEventListener('click', undo);
}

// 键盘处理
function handleKeyDown(e) {
    if (over && !keepPlaying && !e.ctrlKey) return;
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
    }
    
    const keyMap = {
        'ArrowUp': 3,
        'ArrowRight': 2,
        'ArrowDown': 1,
        'ArrowLeft': 0,
        'w': 3,
        'W': 3,
        'd': 2,
        'D': 2,
        's': 1,
        'S': 1,
        'a': 0,
        'A': 0
    };
    
    if (keyMap.hasOwnProperty(e.key)) {
        e.preventDefault();
        move(keyMap[e.key]);
    }
}

// 触摸开始
function handleTouchStart(e) {
    if (e.touches.length > 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

// 触摸移动（阻止默认滚动）
function handleTouchMove(e) {
    e.preventDefault();
}

// 触摸结束
function handleTouchEnd(e) {
    if (e.changedTouches.length > 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    handleSwipe(dx, dy);
}

// 处理滑动
function handleSwipe(dx, dy) {
    if (over && !keepPlaying) return;
    
    const minSwipeDistance = 10;
    if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) return;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 2 : 0); // 右 : 左
    } else {
        move(dy > 0 ? 1 : 3); // 下 : 上
    }
}

// 移动方向: 0=左, 1=下, 2=右, 3=上
function move(direction) {
    saveHistory();
    
    const previousGrid = grid.map(row => [...row]);
    const previousTiles = tiles.map(t => ({ ...t }));
    let moved = false;
    let scoreAdd = 0;
    
    // 根据方向旋转网格，统一按"左"处理
    let workingGrid = rotateGrid(grid, direction);
    let workingTiles = rotateTiles(tiles, direction);
    
    // 处理每一行
    for (let r = 0; r < GRID_SIZE; r++) {
        const result = processRow(workingGrid[r]);
        workingGrid[r] = result.row;
        scoreAdd += result.score;
        
        const rowTiles = workingTiles.filter(t => t.r === r);
        const newRowTiles = [];
        let targetC = 0;
        let i = 0;
        
        while (i < rowTiles.length) {
            if (i + 1 < rowTiles.length && rowTiles[i].value === rowTiles[i + 1].value) {
                newRowTiles.push({ ...rowTiles[i], c: targetC, value: rowTiles[i].value * 2, isMerged: true });
                rowTiles[i].mergedInto = { r, c: targetC };
                rowTiles[i + 1].mergedInto = { r, c: targetC };
                i += 2;
            } else {
                newRowTiles.push({ ...rowTiles[i], c: targetC });
                i++;
            }
            targetC++;
        }
        
        workingTiles = workingTiles.filter(t => t.r !== r).concat(newRowTiles);
    }
    
    // 旋转回原始方向
    grid = rotateGrid(workingGrid, (4 - direction) % 4);
    tiles = rotateTilesBack(workingTiles, direction);
    
    // 检查是否有变化
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] !== previousGrid[r][c]) {
                moved = true;
                break;
            }
        }
        if (moved) break;
    }
    
    if (moved) {
        score += scoreAdd;
        saveBestScore();
        updateScoreDisplay();
        
        const newTile = addRandomTile();
        renderGrid();
        
        // 检查胜利条件
        if (!won && !keepPlaying) {
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (grid[r][c] === WINNING_TILE) {
                        won = true;
                        showMessage('你赢了!', 'game-won');
                        return;
                    }
                }
            }
        }
        
        // 检查游戏结束
        if (!movesAvailable()) {
            over = true;
            showMessage('游戏结束!', 'game-over');
        }
    }
}

// 旋转方块数组
function rotateTiles(inputTiles, times) {
    return inputTiles.map(tile => {
        let { r, c } = tile;
        for (let i = 0; i < times; i++) {
            const newR = c;
            const newC = GRID_SIZE - 1 - r;
            r = newR;
            c = newC;
        }
        return { ...tile, r, c };
    });
}

// 反向旋转方块数组
function rotateTilesBack(inputTiles, times) {
    return inputTiles.filter(t => !t.mergedInto).map(tile => {
        let { r, c } = tile;
        for (let i = 0; i < (4 - times) % 4; i++) {
            const newR = c;
            const newC = GRID_SIZE - 1 - r;
            r = newR;
            c = newC;
        }
        return { ...tile, r, c };
    });
}

// 旋转网格，使指定方向变为"左"
function rotateGrid(inputGrid, times) {
    let result = inputGrid.map(row => [...row]);
    for (let i = 0; i < times; i++) {
        const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                newGrid[c][GRID_SIZE - 1 - r] = result[r][c];
            }
        }
        result = newGrid;
    }
    return result;
}

// 处理单行：移动并合并
function processRow(row) {
    let newRow = row.filter(val => val !== 0);
    let score = 0;
    
    for (let i = 0; i < newRow.length - 1; i++) {
        if (newRow[i] === newRow[i + 1]) {
            newRow[i] *= 2;
            score += newRow[i];
            newRow[i + 1] = 0;
        }
    }
    
    newRow = newRow.filter(val => val !== 0);
    
    while (newRow.length < GRID_SIZE) {
        newRow.push(0);
    }
    
    return { row: newRow, score };
}

// 检查是否还有可用移动
function movesAvailable() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === 0) return true;
            if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
            if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
        }
    }
    return false;
}

// 显示消息
function showMessage(text, className) {
    gameMessage.querySelector('p').textContent = text;
    gameMessage.className = `game-message ${className}`;
    gameMessage.style.display = 'flex';
    
    if (className === 'game-won') {
        keepPlayingButton.style.display = 'inline-block';
        retryButton.style.display = 'inline-block';
    } else {
        keepPlayingButton.style.display = 'none';
        retryButton.style.display = 'inline-block';
    }
}

// 隐藏消息
function hideMessage() {
    gameMessage.style.display = 'none';
}

// 保存历史状态
function saveHistory() {
    history.push({
        grid: grid.map(row => [...row]),
        tiles: tiles.map(t => ({ ...t })),
        score: score,
        won: won,
        over: over,
        keepPlaying: keepPlaying
    });
    
    if (history.length > MAX_HISTORY) {
        history.shift();
    }
    
    updateUndoButton();
}

// 撤销操作
function undo() {
    if (history.length === 0) return;
    
    const lastState = history.pop();
    grid = lastState.grid;
    tiles = lastState.tiles;
    score = lastState.score;
    won = lastState.won;
    over = lastState.over;
    keepPlaying = lastState.keepPlaying;
    
    updateScoreDisplay();
    renderGrid();
    updateUndoButton();
    hideMessage();
}

// 更新撤销按钮状态
function updateUndoButton() {
    undoButton.disabled = history.length === 0;
}
