// ============================================================
// SEEDED RANDOM NUMBER GENERATOR
// ============================================================

let seedValue = 0;

function setSeed(seed) {
    seedValue = seed;
}

function seededRandom() {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
}

function getTimeSeed() {
    // Get current time in milliseconds
    const now = Date.now();
    // Divide by 300000 (5 minutes in milliseconds) and floor it
    // This creates a seed that changes every 5 minutes globally
    return Math.floor(now / 300000);
}

// ============================================================
// GAME STATE & CONFIGURATION
// ============================================================

const gridSize = 7;
let regions = []; // 2D array: regions[r][c] = region id
let cellStates = []; // 2D array: cellStates[r][c] = "empty" | "x" | "queen"
let solutionQueens = []; // Array of {row, col} representing a valid solution

// Timer state
let startTime = null;
let timerInterval = null;
let timerSeconds = 0;

// Game state
let gameWon = false;
let firstMoveDetector = false;
let hintCooldown = false;

// ============================================================
// RANDOM REGION GENERATION
// ============================================================

/**
 * Generates random contiguous regions on the grid.
 * Each region has at least 2 cells and covers the entire grid.
 * Returns a 2D array with region IDs.
 */
function generateRandomRegions(size) {
    const grid = Array.from({ length: size }, () => Array(size).fill(-1));
    const targetRegionCount = Math.floor(seededRandom() * 3) + (size - 1); // 6-8 regions for size 7
    let currentRegionId = 0;
    
    // Helper: get unassigned neighbors
    function getUnassignedNeighbors(r, c) {
        const neighbors = [];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) {
                neighbors.push([nr, nc]);
            }
        }
        return neighbors;
    }
    
    // Helper: grow a region from a starting cell
    function growRegion(startR, startC, regionId, targetSize) {
        const cells = [[startR, startC]];
        grid[startR][startC] = regionId;
        
        while (cells.length < targetSize) {
            // Pick a random cell from the current region to expand from
            const randomIndex = Math.floor(seededRandom() * cells.length);
            const [r, c] = cells[randomIndex];
            const neighbors = getUnassignedNeighbors(r, c);
            
            if (neighbors.length === 0) {
                // Try another cell in the region
                const allNeighbors = [];
                for (const [cr, cc] of cells) {
                    allNeighbors.push(...getUnassignedNeighbors(cr, cc));
                }
                if (allNeighbors.length === 0) break; // Can't grow anymore
                
                const [nr, nc] = allNeighbors[Math.floor(seededRandom() * allNeighbors.length)];
                grid[nr][nc] = regionId;
                cells.push([nr, nc]);
            } else {
                const [nr, nc] = neighbors[Math.floor(seededRandom() * neighbors.length)];
                grid[nr][nc] = regionId;
                cells.push([nr, nc]);
            }
        }
        
        return cells.length;
    }
    
    // Create regions
    const regionSizes = [];
    let remainingCells = size * size;
    
    for (let i = 0; i < targetRegionCount - 1; i++) {
        const minSize = 2;
        const maxSize = Math.min(8, Math.floor(remainingCells / (targetRegionCount - i)));
        const regionSize = Math.floor(seededRandom() * (maxSize - minSize + 1)) + minSize;
        regionSizes.push(regionSize);
        remainingCells -= regionSize;
    }
    
    // Last region gets all remaining cells
    if (remainingCells >= 2) {
        regionSizes.push(remainingCells);
    } else {
        // Adjust if last region would be too small
        regionSizes[regionSizes.length - 1] += remainingCells;
    }
    
    // Place regions
    for (const targetSize of regionSizes) {
        // Find a random unassigned cell
        let startR, startC;
        let attempts = 0;
        do {
            startR = Math.floor(seededRandom() * size);
            startC = Math.floor(seededRandom() * size);
            attempts++;
            if (attempts > 1000) break; // Safety
        } while (grid[startR][startC] !== -1);
        
        if (grid[startR][startC] === -1) {
            growRegion(startR, startC, currentRegionId, targetSize);
            currentRegionId++;
        }
    }
    
    // Fill any remaining unassigned cells (edge case)
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === -1) {
                // Assign to a neighboring region
                const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                for (const [dr, dc] of dirs) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] !== -1) {
                        grid[r][c] = grid[nr][nc];
                        break;
                    }
                }
            }
        }
    }
    
    return grid;
}

// ============================================================
// BACKTRACKING SOLVER
// ============================================================

/**
 * Solves the Queens puzzle using backtracking.
 * Returns { solved: boolean, solution: [{row, col}, ...] }
 */
function solveQueens(regionsGrid) {
    const size = regionsGrid.length;
    const queens = []; // Array of {row, col}
    const colUsed = new Set();
    const regionUsed = new Set();
    
    // Helper: check if placing a queen at (r, c) is valid
    function isValid(r, c) {
        // Check column
        if (colUsed.has(c)) return false;
        
        // Check region
        const regionId = regionsGrid[r][c];
        if (regionUsed.has(regionId)) return false;
        
        // Check adjacency (8 directions)
        for (const queen of queens) {
            const rowDiff = Math.abs(queen.row - r);
            const colDiff = Math.abs(queen.col - c);
            if (rowDiff <= 1 && colDiff <= 1) {
                return false; // Queens touch
            }
        }
        
        return true;
    }
    
    // Backtracking function: place queens row by row
    function backtrack(row) {
        if (row === size) {
            return true; // All queens placed successfully
        }
        
        for (let col = 0; col < size; col++) {
            if (isValid(row, col)) {
                // Place queen
                queens.push({ row, col });
                colUsed.add(col);
                regionUsed.add(regionsGrid[row][col]);
                
                if (backtrack(row + 1)) {
                    return true;
                }
                
                // Backtrack
                queens.pop();
                colUsed.delete(col);
                regionUsed.delete(regionsGrid[row][col]);
            }
        }
        
        return false;
    }
    
    const solved = backtrack(0);
    return { solved, solution: solved ? [...queens] : [] };
}

// ============================================================
// SOLVABLE PUZZLE GENERATION
// ============================================================

/**
 * Generates a solvable puzzle by creating random regions
 * and verifying with the solver. Retries until a solution is found.
 */
function generateSolvablePuzzle() {
    const maxAttempts = 100;
    
    // Get the 5-minute time window seed
    const timeSeed = getTimeSeed();
    setSeed(timeSeed);
    console.log('Using time-based seed:', timeSeed);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const testRegions = generateRandomRegions(gridSize);
        const result = solveQueens(testRegions);
        
        if (result.solved) {
            regions = testRegions;
            solutionQueens = result.solution;
            console.log(`Solvable puzzle found on attempt ${attempt + 1}`);
            return true;
        }
    }
    
    console.error('Failed to generate solvable puzzle after', maxAttempts, 'attempts');
    return false;
}

// ============================================================
// TIMER FUNCTIONS
// ============================================================

function startTimer() {
    if (timerInterval) return; // Already running
    
    startTime = Date.now() - (timerSeconds * 1000);
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerSeconds = elapsed;
        updateTimerDisplay();
        
        // Enable solution button after 5 minutes (300 seconds)
        if (timerSeconds >= 300) {
            const showSolutionBtn = document.getElementById('showSolutionBtn');
            if (showSolutionBtn && showSolutionBtn.disabled) {
                showSolutionBtn.disabled = false;
                showSolutionBtn.style.opacity = '1';
                showSolutionBtn.style.cursor = 'pointer';
            }
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    timerSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timer').textContent = display;
}

function getTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ============================================================
// BOARD RENDERING
// ============================================================

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = document.createElement('div');
            cell.className = `cell region-${regions[r][c]}`;
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            // Set cell content based on state
            updateCellDisplay(cell, cellStates[r][c]);
            
            // Click handler
            cell.addEventListener('click', () => handleCellClick(r, c));
            
            boardElement.appendChild(cell);
        }
    }
}

function updateCellDisplay(cellElement, state) {
    cellElement.innerHTML = '';
    
    if (state === 'x') {
        const xMark = document.createElement('span');
        xMark.className = 'x-mark';
        xMark.textContent = '✕';
        cellElement.appendChild(xMark);
    } else if (state === 'queen') {
        const queen = document.createElement('span');
        queen.className = 'queen';
        queen.textContent = '♛';
        cellElement.appendChild(queen);
    }
}

// ============================================================
// GAME INTERACTION
// ============================================================

function handleCellClick(row, col) {
    if (gameWon) return; // Don't allow changes after winning
    
    // Cycle through states: empty -> x -> queen -> empty
    const currentState = cellStates[row][col];
    
    if (currentState === 'empty') {
        cellStates[row][col] = 'x';
    } else if (currentState === 'x') {
        cellStates[row][col] = 'queen';
    } else if (currentState === 'queen') {
        cellStates[row][col] = 'empty';
    }
    
    // Update the cell display
    const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    updateCellDisplay(cellElement, cellStates[row][col]);
    
    // Validate board
    validateBoard();
}

// ============================================================
// VALIDATION & WIN DETECTION
// ============================================================

function validateBoard() {
    // Clear all invalid states
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('invalid'));
    
    const queensPositions = [];
    
    // Collect all queen positions
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (cellStates[r][c] === 'queen') {
                queensPositions.push({ row: r, col: c });
            }
        }
    }
    
    // Track validity
    let isValid = true;
    const invalidCells = new Set();
    
    // Check rows
    const rowCounts = {};
    queensPositions.forEach(q => {
        rowCounts[q.row] = (rowCounts[q.row] || 0) + 1;
    });
    
    for (const [row, count] of Object.entries(rowCounts)) {
        if (count > 1) {
            isValid = false;
            // Mark all queens in this row as invalid
            queensPositions.forEach(q => {
                if (q.row === parseInt(row)) {
                    invalidCells.add(`${q.row},${q.col}`);
                }
            });
        }
    }
    
    // Check columns
    const colCounts = {};
    queensPositions.forEach(q => {
        colCounts[q.col] = (colCounts[q.col] || 0) + 1;
    });
    
    for (const [col, count] of Object.entries(colCounts)) {
        if (count > 1) {
            isValid = false;
            // Mark all queens in this column as invalid
            queensPositions.forEach(q => {
                if (q.col === parseInt(col)) {
                    invalidCells.add(`${q.row},${q.col}`);
                }
            });
        }
    }
    
    // Check regions
    const regionCounts = {};
    queensPositions.forEach(q => {
        const regionId = regions[q.row][q.col];
        if (!regionCounts[regionId]) {
            regionCounts[regionId] = [];
        }
        regionCounts[regionId].push(q);
    });
    
    for (const [regionId, queens] of Object.entries(regionCounts)) {
        if (queens.length > 1) {
            isValid = false;
            queens.forEach(q => {
                invalidCells.add(`${q.row},${q.col}`);
            });
        }
    }
    
    // Check adjacency (no two queens can touch)
    for (let i = 0; i < queensPositions.length; i++) {
        for (let j = i + 1; j < queensPositions.length; j++) {
            const q1 = queensPositions[i];
            const q2 = queensPositions[j];
            const rowDiff = Math.abs(q1.row - q2.row);
            const colDiff = Math.abs(q1.col - q2.col);
            
            if (rowDiff <= 1 && colDiff <= 1) {
                isValid = false;
                invalidCells.add(`${q1.row},${q1.col}`);
                invalidCells.add(`${q2.row},${q2.col}`);
            }
        }
    }
    
    // Apply invalid class to cells
    invalidCells.forEach(key => {
        const [row, col] = key.split(',').map(Number);
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.classList.add('invalid');
        }
    });
    
    // Check win condition
    if (isValid && queensPositions.length === gridSize) {
        // Also verify each row has exactly one queen
        const rowsWithQueen = new Set(queensPositions.map(q => q.row));
        const colsWithQueen = new Set(queensPositions.map(q => q.col));
        
        // Count unique regions with queens
        const regionsWithQueen = new Set(queensPositions.map(q => regions[q.row][q.col]));
        
        if (rowsWithQueen.size === gridSize && 
            colsWithQueen.size === gridSize && 
            regionsWithQueen.size === gridSize) {
            triggerWin();
        }
    }
}

function triggerWin() {
    gameWon = true;
    stopTimer();
    
    // Show win modal
    document.getElementById('winTime').textContent = getTimerDisplay();
    document.getElementById('winModal').classList.remove('hidden');
    
    // Make modal draggable
    makeDraggable(document.querySelector('.modal-content'));
}

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    
    element.addEventListener('mousedown', dragMouseDown);
    element.addEventListener('touchstart', dragTouchStart, { passive: false });
    
    function dragMouseDown(e) {
        // Don't drag if clicking on buttons
        if (e.target.tagName === 'BUTTON') return;
        
        e.preventDefault();
        isDragging = true;
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
    }
    
    function dragTouchStart(e) {
        // Don't drag if touching buttons
        if (e.target.tagName === 'BUTTON') return;
        
        e.preventDefault();
        isDragging = true;
        pos3 = e.touches[0].clientX;
        pos4 = e.touches[0].clientY;
        document.addEventListener('touchend', closeDragElement);
        document.addEventListener('touchmove', elementTouchDrag, { passive: false });
    }
    
    function elementDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        element.style.top = newTop + 'px';
        element.style.left = newLeft + 'px';
        element.style.bottom = 'auto';
        element.style.transform = 'none';
    }
    
    function elementTouchDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        pos1 = pos3 - e.touches[0].clientX;
        pos2 = pos4 - e.touches[0].clientY;
        pos3 = e.touches[0].clientX;
        pos4 = e.touches[0].clientY;
        
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        element.style.top = newTop + 'px';
        element.style.left = newLeft + 'px';
        element.style.bottom = 'auto';
        element.style.transform = 'none';
    }
    
    function closeDragElement() {
        isDragging = false;
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('touchend', closeDragElement);
        document.removeEventListener('touchmove', elementTouchDrag);
    }
}

// ============================================================
// HINT & SOLUTION FEATURES
// ============================================================

/**
 * Provides a hint by highlighting a cell where a queen should be placed
 */
function showHint() {
    if (gameWon) return;
    if (hintCooldown) return;
    
    // Set cooldown
    hintCooldown = true;
    const hintBtn = document.getElementById('hintBtn');
    hintBtn.disabled = true;
    hintBtn.style.opacity = '0.5';
    hintBtn.style.cursor = 'not-allowed';
    
    let countdown = 20;
    const originalText = hintBtn.textContent;
    hintBtn.textContent = `Hint (${countdown}s)`;
    
    const cooldownInterval = setInterval(() => {
        countdown--;
        hintBtn.textContent = `Hint (${countdown}s)`;
        
        if (countdown <= 0) {
            clearInterval(cooldownInterval);
            hintCooldown = false;
            hintBtn.disabled = false;
            hintBtn.style.opacity = '1';
            hintBtn.style.cursor = 'pointer';
            hintBtn.textContent = originalText;
        }
    }, 1000);
    
    // Clear previous hints
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('hint'));
    
    // Find a solution queen position that isn't already filled
    for (const queenPos of solutionQueens) {
        if (cellStates[queenPos.row][queenPos.col] !== 'queen') {
            // Highlight this cell as a hint
            const cellElement = document.querySelector(`[data-row="${queenPos.row}"][data-col="${queenPos.col}"]`);
            if (cellElement) {
                cellElement.classList.add('hint');
                
                // Remove hint highlight after 4 seconds
                setTimeout(() => {
                    cellElement.classList.remove('hint');
                }, 4000);
            }
            return;
        }
    }
    
    // If all queens are placed correctly
    alert('All queens are already in the correct positions!');
}

/**
 * Shows the complete solution
 */
function showSolution() {
    if (gameWon) return;
    
    const confirmed = confirm('Are you sure you want to see the solution? This will reveal all queen positions.');
    
    if (!confirmed) return;
    
    // Start timer if not started
    if (!firstMoveDetector) {
        firstMoveDetector = true;
        startTimer();
    }
    
    // Clear the board first
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            cellStates[r][c] = 'empty';
        }
    }
    
    // Place all queens from the solution
    for (const queenPos of solutionQueens) {
        cellStates[queenPos.row][queenPos.col] = 'queen';
    }
    
    // Re-render the entire board
    renderBoard();
    
    // Validate to trigger win state
    validateBoard();
}

// ============================================================
// GAME CONTROLS
// ============================================================

function newGame() {
    // Reset state
    gameWon = false;
    firstMoveDetector = false;
    hintCooldown = false;
    resetTimer();
    
    // Hide welcome screen and show board
    const welcomeScreen = document.getElementById('welcomeScreen');
    const board = document.getElementById('board');
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (board) board.classList.remove('hidden');
    
    // Show game-only controls
    document.querySelectorAll('.game-only').forEach(btn => btn.classList.remove('hidden'));
    
    // Reset hint button
    const hintBtn = document.getElementById('hintBtn');
    if (hintBtn) {
        hintBtn.disabled = false;
        hintBtn.style.opacity = '1';
        hintBtn.style.cursor = 'pointer';
        hintBtn.textContent = 'Hint';
    }
    
    // Disable show solution button
    const showSolutionBtn = document.getElementById('showSolutionBtn');
    if (showSolutionBtn) {
        showSolutionBtn.disabled = true;
        showSolutionBtn.style.opacity = '0.5';
        showSolutionBtn.style.cursor = 'not-allowed';
    }
    
    // Hide win modal
    document.getElementById('winModal').classList.add('hidden');
    
    // Generate new solvable puzzle
    const success = generateSolvablePuzzle();
    
    if (!success) {
        alert('Failed to generate a solvable puzzle. Please try again.');
        return;
    }
    
    // Initialize cell states
    cellStates = Array.from({ length: gridSize }, () => Array(gridSize).fill('empty'));
    
    // Render board
    renderBoard();
    
    // Start timer immediately when New Game is clicked
    startTimer();
}

function clearBoard() {
    // Keep regions and solution, just clear cell states
    gameWon = false;
    firstMoveDetector = false;
    cellStates = Array.from({ length: gridSize }, () => Array(gridSize).fill('empty'));
    resetTimer();
    renderBoard();
}

function playAgain() {
    // Clear board but keep the same puzzle
    document.getElementById('winModal').classList.add('hidden');
    clearBoard();
}

// ============================================================
// EVENT LISTENERS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Button event listeners
    document.getElementById('newGameBtn').addEventListener('click', newGame);
    document.getElementById('clearBoardBtn').addEventListener('click', clearBoard);
    document.getElementById('hintBtn').addEventListener('click', showHint);
    document.getElementById('showSolutionBtn').addEventListener('click', showSolution);
    
    document.getElementById('howToPlayBtn').addEventListener('click', () => {
        const howToPlay = document.getElementById('howToPlay');
        howToPlay.classList.toggle('hidden');
    });
    
    document.getElementById('newGameFromWin').addEventListener('click', newGame);
    document.getElementById('playAgain').addEventListener('click', playAgain);
    
    // Don't auto-start - wait for user to click New Game
});
