// Game constants
const ROWS = 6;
const COLS = 7;
const CELL_SIZE = 80;
const BOARD_PADDING = 20;
const ANIMATION_SPEED = 15;

// Colors
const BOARD_COLOR = '#2C3E50';
const EMPTY_COLOR = '#ECF0F1';
const PLAYER1_COLOR = '#FF6B6B';
const PLAYER2_COLOR = '#FFD93D';
const HOVER_COLOR = 'rgba(255, 255, 255, 0.3)';
const WIN_GLOW_COLOR = 'rgba(46, 204, 113, 0.5)';

// Game state
let board = [];
let currentPlayer = 1;
let gameOver = false;
let winner = null;
let winningCells = [];
let animatingPiece = null;
let hoverColumn = -1;

function setup() {
    let canvas = createCanvas(
        COLS * CELL_SIZE + BOARD_PADDING * 2,
        ROWS * CELL_SIZE + BOARD_PADDING * 2 + CELL_SIZE
    );
    canvas.parent('canvas-container');
    initializeBoard();
    updateStatus();
}

function draw() {
    background(240);
    
    // Draw hover effect
    if (!gameOver && hoverColumn >= 0) {
        drawHoverEffect();
    }
    
    // Draw board
    drawBoard();
    
    // Draw pieces
    drawPieces();
    
    // Animate falling piece
    if (animatingPiece) {
        animateFallingPiece();
    }
    
    // Draw winning line effect
    if (winningCells.length > 0) {
        drawWinningEffect();
    }
}

function initializeBoard() {
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
    currentPlayer = 1;
    gameOver = false;
    winner = null;
    winningCells = [];
    animatingPiece = null;
    hoverColumn = -1;
}

function drawBoard() {
    // Draw board background
    fill(BOARD_COLOR);
    noStroke();
    rect(BOARD_PADDING, BOARD_PADDING + CELL_SIZE, 
         COLS * CELL_SIZE, ROWS * CELL_SIZE, 10);
    
    // Draw empty cells
    fill(EMPTY_COLOR);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            let x = BOARD_PADDING + col * CELL_SIZE + CELL_SIZE / 2;
            let y = BOARD_PADDING + CELL_SIZE + row * CELL_SIZE + CELL_SIZE / 2;
            circle(x, y, CELL_SIZE * 0.8);
        }
    }
}

function drawHoverEffect() {
    if (hoverColumn >= 0 && hoverColumn < COLS) {
        fill(HOVER_COLOR);
        noStroke();
        rect(BOARD_PADDING + hoverColumn * CELL_SIZE, 
             BOARD_PADDING + CELL_SIZE,
             CELL_SIZE, ROWS * CELL_SIZE);
        
        // Draw preview piece at top
        let x = BOARD_PADDING + hoverColumn * CELL_SIZE + CELL_SIZE / 2;
        let y = BOARD_PADDING + CELL_SIZE / 2;
        fill(currentPlayer === 1 ? PLAYER1_COLOR : PLAYER2_COLOR);
        stroke(255, 255, 255, 150);
        strokeWeight(3);
        circle(x, y, CELL_SIZE * 0.7);
        noStroke();
    }
}

function drawPieces() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] !== 0) {
                let x = BOARD_PADDING + col * CELL_SIZE + CELL_SIZE / 2;
                let y = BOARD_PADDING + CELL_SIZE + row * CELL_SIZE + CELL_SIZE / 2;
                
                // Add shadow effect
                fill(0, 0, 0, 30);
                circle(x + 3, y + 3, CELL_SIZE * 0.75);
                
                // Draw piece
                fill(board[row][col] === 1 ? PLAYER1_COLOR : PLAYER2_COLOR);
                circle(x, y, CELL_SIZE * 0.75);
                
                // Add shine effect
                fill(255, 255, 255, 100);
                circle(x - CELL_SIZE * 0.1, y - CELL_SIZE * 0.1, CELL_SIZE * 0.25);
            }
        }
    }
}

function animateFallingPiece() {
    if (animatingPiece) {
        let x = BOARD_PADDING + animatingPiece.col * CELL_SIZE + CELL_SIZE / 2;
        let targetY = BOARD_PADDING + CELL_SIZE + animatingPiece.row * CELL_SIZE + CELL_SIZE / 2;
        
        // Draw falling piece
        fill(animatingPiece.player === 1 ? PLAYER1_COLOR : PLAYER2_COLOR);
        circle(x, animatingPiece.y, CELL_SIZE * 0.75);
        
        // Update position
        animatingPiece.y += ANIMATION_SPEED;
        
        // Check if animation is complete
        if (animatingPiece.y >= targetY) {
            board[animatingPiece.row][animatingPiece.col] = animatingPiece.player;
            animatingPiece = null;
            
            // Check for win after piece is placed
            checkWin();
        }
    }
}

function drawWinningEffect() {
    // Draw glowing effect on winning pieces
    for (let cell of winningCells) {
        let x = BOARD_PADDING + cell.col * CELL_SIZE + CELL_SIZE / 2;
        let y = BOARD_PADDING + CELL_SIZE + cell.row * CELL_SIZE + CELL_SIZE / 2;
        
        // Pulsing glow effect
        let pulseSize = CELL_SIZE * 0.9 + sin(frameCount * 0.1) * 10;
        fill(WIN_GLOW_COLOR);
        noStroke();
        circle(x, y, pulseSize);
        
        // Draw the piece on top
        fill(board[cell.row][cell.col] === 1 ? PLAYER1_COLOR : PLAYER2_COLOR);
        circle(x, y, CELL_SIZE * 0.75);
        
        // Extra bright shine
        fill(255, 255, 255, 150);
        circle(x - CELL_SIZE * 0.1, y - CELL_SIZE * 0.1, CELL_SIZE * 0.3);
    }
}

function mousePressed() {
    if (gameOver || animatingPiece) return;
    
    let col = floor((mouseX - BOARD_PADDING) / CELL_SIZE);
    
    if (col >= 0 && col < COLS) {
        dropPiece(col);
    }
}

function mouseMoved() {
    if (!gameOver && !animatingPiece) {
        let col = floor((mouseX - BOARD_PADDING) / CELL_SIZE);
        if (col >= 0 && col < COLS && mouseY > BOARD_PADDING + CELL_SIZE) {
            hoverColumn = col;
        } else {
            hoverColumn = -1;
        }
    }
}

function dropPiece(col) {
    // Find the lowest empty row in this column
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === 0) {
            // Start animation
            animatingPiece = {
                row: row,
                col: col,
                player: currentPlayer,
                y: BOARD_PADDING + CELL_SIZE / 2
            };
            return;
        }
    }
}

function checkWin() {
    // Check horizontal
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS - 3; col++) {
            if (board[row][col] !== 0 &&
                board[row][col] === board[row][col + 1] &&
                board[row][col] === board[row][col + 2] &&
                board[row][col] === board[row][col + 3]) {
                winGame(row, col, 0, 1);
                return;
            }
        }
    }
    
    // Check vertical
    for (let row = 0; row < ROWS - 3; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] !== 0 &&
                board[row][col] === board[row + 1][col] &&
                board[row][col] === board[row + 2][col] &&
                board[row][col] === board[row + 3][col]) {
                winGame(row, col, 1, 0);
                return;
            }
        }
    }
    
    // Check diagonal (down-right)
    for (let row = 0; row < ROWS - 3; row++) {
        for (let col = 0; col < COLS - 3; col++) {
            if (board[row][col] !== 0 &&
                board[row][col] === board[row + 1][col + 1] &&
                board[row][col] === board[row + 2][col + 2] &&
                board[row][col] === board[row + 3][col + 3]) {
                winGame(row, col, 1, 1);
                return;
            }
        }
    }
    
    // Check diagonal (down-left)
    for (let row = 0; row < ROWS - 3; row++) {
        for (let col = 3; col < COLS; col++) {
            if (board[row][col] !== 0 &&
                board[row][col] === board[row + 1][col - 1] &&
                board[row][col] === board[row + 2][col - 2] &&
                board[row][col] === board[row + 3][col - 3]) {
                winGame(row, col, 1, -1);
                return;
            }
        }
    }
    
    // Check for draw
    let isFull = true;
    for (let col = 0; col < COLS; col++) {
        if (board[0][col] === 0) {
            isFull = false;
            break;
        }
    }
    
    if (isFull) {
        gameOver = true;
        updateStatus('Unentschieden! 🤝');
        return;
    }
    
    // Switch player
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateStatus();
}

function winGame(startRow, startCol, rowDir, colDir) {
    gameOver = true;
    winner = currentPlayer;
    
    // Store winning cells
    for (let i = 0; i < 4; i++) {
        winningCells.push({
            row: startRow + i * rowDir,
            col: startCol + i * colDir
        });
    }
    
    updateStatus(`Spieler ${winner} hat gewonnen! 🎉`);
}

function updateStatus(message) {
    const statusDiv = document.getElementById('status');
    if (message) {
        statusDiv.innerHTML = message;
    } else {
        const playerColor = currentPlayer === 1 ? 'player1' : 'player2';
        statusDiv.innerHTML = `<span class="player-indicator ${playerColor}"></span> Spieler ${currentPlayer} ist am Zug`;
    }
}

function resetGame() {
    initializeBoard();
    updateStatus();
}
