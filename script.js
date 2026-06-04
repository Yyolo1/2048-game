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

// DOM 元素
const tileContainer = document.getElementById('tile-container');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const gameMessage = document.getElementById('game-message');
const restartButton = document.getElementById('restart-button');
const retryButton = document.getElementById('retry-button');
const keepPlayingButton = document.getElementById('keep-playing-button');

// 触摸状态
let touchStartX = 0;
let touchStartY = 0;

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    loadBestScore();
    setupInput();
    restartGame();
});

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
    scoreElement.textContent = score;
    bestScoreElement.textContent = bestScore;
}

// 重新开始游戏
function restartGame() {
    grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    won = false;
    over = false;
    keepPlaying = false;
    
    updateScoreDisplay();
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
        grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        return { r, c, value: grid[r][c] };
    }
    return null;
}

// 渲染网格
function renderGrid() {
    tileContainer.innerHTML = '';
    
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] !== 0) {
                const tile = createTileElement(r, c, grid[r][c]);
                tileContainer.appendChild(tile);
            }
        }
    }
}

// 创建方块 DOM 元素
function createTileElement(r, c, value) {
    const tile = document.createElement('div');
    tile.className = `tile tile-${value <= 2048 ? value : 'super'}`;
    tile.textContent = value;
    tile.style.transform = `translate(${c * (CELL_SIZE + CELL_GAP)}px, ${r * (CELL_SIZE + CELL_GAP)}px)`;
    return tile;
}

// 设置输入事件
function setupInput() {
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
    
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
}

// 键盘处理
function handleKeyDown(e) {
    if (over && !keepPlaying) return;
    
    const keyMap = {
        'ArrowUp': 0,
        'ArrowRight': 1,
        'ArrowDown': 2,
        'ArrowLeft': 3,
        'w': 0,
        'W': 0,
        'd': 1,
        'D': 1,
        's': 2,
        'S': 2,
        'a': 3,
        'A': 3
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
        move(dx > 0 ? 1 : 3); // 右 : 左
    } else {
        move(dy > 0 ? 2 : 0); // 下 : 上
    }
}

// 移动方向: 0=上, 1=右, 2=下, 3=左
function move(direction) {
    const previousGrid = grid.map(row => [...row]);
    let moved = false;
    let scoreAdd = 0;
    
    // 根据方向旋转网格，统一按"左"处理
    let workingGrid = rotateGrid(grid, direction);
    
    // 处理每一行
    for (let r = 0; r < GRID_SIZE; r++) {
        const result = processRow(workingGrid[r]);
        workingGrid[r] = result.row;
        scoreAdd += result.score;
    }
    
    // 旋转回原始方向
    grid = rotateGrid(workingGrid, (4 - direction) % 4);
    
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
