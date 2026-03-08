/**
 * Snake Game - Main Game Logic
 * Developed by: 阿宅 💻 (Senior Full-Stack Engineer)
 * Features:
 * - Smooth snake movement with collision detection
 * - Score tracking with high score persistence
 * - Pause/Resume functionality
 * - Responsive design support
 */

class SnakeGame {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game configuration
        this.gridSize = 20;
        this.tileCountX = this.canvas.width / this.gridSize;
        this.tileCountY = this.canvas.height / this.gridSize;
        
        // Game state
        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.isPlaying = false;
        this.isPaused = false;
        this.gameSpeed = 100; // ms per frame
        
        // Initialize game
        this.init();
    }

    /**
     * Initialize game elements and event listeners
     */
    init() {
        this.setupEventListeners();
        this.updateHighScoreDisplay();
        this.draw();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Button controls
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        
        // Touch controls for mobile
        this.setupTouchControls();
    }

    /**
     * Setup touch/swipe controls for mobile devices
     */
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        this.canvas.addEventListener('touchend', (e) => {
            if (!this.isPlaying || this.isPaused) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (Math.abs(dx) > 30) {
                    this.changeDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
                }
            } else {
                // Vertical swipe
                if (Math.abs(dy) > 30) {
                    this.changeDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
                }
            }
        }, { passive: true });
    }

    /**
     * Handle keyboard input
     */
    handleKeyDown(e) {
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.changeDirection({ x: 0, y: -1 });
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.changeDirection({ x: 0, y: 1 });
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.changeDirection({ x: -1, y: 0 });
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.changeDirection({ x: 1, y: 0 });
                break;
            case ' ':
                e.preventDefault();
                this.togglePause();
                break;
            case 'r':
            case 'R':
                this.resetGame();
                break;
        }
    }

    /**
     * Change snake direction with validation
     */
    changeDirection(newDirection) {
        // Prevent 180-degree turns
        const isOpposite = (newDirection.x === -this.direction.x && newDirection.y === -this.direction.y);
        
        if (!isOpposite) {
            this.nextDirection = newDirection;
        }
    }

    /**
     * Start new game
     */
    startGame() {
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.isPlaying = true;
        this.isPaused = false;
        this.gameSpeed = 100;
        
        this.generateFood();
        this.updateScoreDisplay();
        this.hideOverlay();
        this.gameLoop();
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isPlaying) return;
        
        if (!this.isPaused) {
            this.update();
            this.draw();
            
            if (this.isPlaying) {
                setTimeout(() => requestAnimationFrame(() => this.gameLoop()), this.gameSpeed);
            }
        } else {
            setTimeout(() => requestAnimationFrame(() => this.gameLoop()), this.gameSpeed);
        }
    }

    /**
     * Update game state
     */
    update() {
        // Update direction
        this.direction = this.nextDirection;
        
        // Calculate new head position
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };
        
        // Check collisions
        if (this.checkCollision(head)) {
            this.endGame();
            return;
        }
        
        // Move snake
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScoreDisplay();
            this.generateFood();
            this.increaseSpeed();
        } else {
            this.snake.pop();
        }
    }

    /**
     * Draw game elements
     */
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw food
        this.drawFood();
        
        // Draw snake
        this.drawSnake();
    }

    /**
     * Draw background grid
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw snake with gradient effect
     */
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            // Head has different color
            if (index === 0) {
                this.ctx.fillStyle = '#27ae60';
                this.ctx.shadowColor = '#27ae60';
                this.ctx.shadowBlur = 10;
            } else {
                this.ctx.fillStyle = '#2ecc71';
                this.ctx.shadowColor = '#2ecc71';
                this.ctx.shadowBlur = 5;
            }
            
            // Draw rounded rectangle for each segment
            this.roundRect(
                x + 1,
                y + 1,
                this.gridSize - 2,
                this.gridSize - 2,
                index === 0 ? 6 : 4
            );
            
            this.ctx.fill();
            
            // Draw eyes on head
            if (index === 0) {
                this.drawEyes(x, y);
            }
            
            this.ctx.shadowBlur = 0;
        });
    }

    /**
     * Draw snake eyes based on direction
     */
    drawEyes(x, y) {
        this.ctx.fillStyle = '#fff';
        
        const eyeSize = this.gridSize / 5;
        const eyeOffset = this.gridSize / 3;
        
        // Position eyes based on direction
        let eye1X, eye1Y, eye2X, eye2Y;
        
        if (this.direction.y === -1) { // Up
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + this.gridSize - eyeOffset - eyeSize;
            eye2Y = y + eyeOffset;
        } else if (this.direction.y === 1) { // Down
            eye1X = x + eyeOffset;
            eye1Y = y + this.gridSize - eyeOffset - eyeSize;
            eye2X = x + this.gridSize - eyeOffset - eyeSize;
            eye2Y = y + this.gridSize - eyeOffset - eyeSize;
        } else if (this.direction.x === -1) { // Left
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + eyeOffset;
            eye2Y = y + this.gridSize - eyeOffset - eyeSize;
        } else { // Right
            eye1X = x + this.gridSize - eyeOffset - eyeSize;
            eye1Y = y + eyeOffset;
            eye2X = x + this.gridSize - eyeOffset - eyeSize;
            eye2Y = y + this.gridSize - eyeOffset - eyeSize;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(eye1X + eyeSize/2, eye1Y + eyeSize/2, eyeSize/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(eye2X + eyeSize/2, eye2Y + eyeSize/2, eyeSize/2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw food with pulse animation
     */
    drawFood() {
        const x = this.food.x * this.gridSize + this.gridSize / 2;
        const y = this.food.y * this.gridSize + this.gridSize / 2;
        const radius = this.gridSize / 2 - 2;
        
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.shadowColor = '#e74c3c';
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw shine effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(x - radius/3, y - radius/3, radius/4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }

    /**
     * Generate food at random position
     */
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCountX),
                y: Math.floor(Math.random() * this.tileCountY)
            };
        } while (this.isOnSnake(newFood));
        
        this.food = newFood;
    }

    /**
     * Check if position is on snake body
     */
    isOnSnake(position) {
        return this.snake.some(segment => 
            segment.x === position.x && segment.y === position.y
        );
    }

    /**
     * Check collision with walls or self
     */
    checkCollision(head) {
        // Wall collision
        if (head.x < 0 || head.x >= this.tileCountX || 
            head.y < 0 || head.y >= this.tileCountY) {
            return true;
        }
        
        // Self collision (skip head)
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Increase game speed as score increases
     */
    increaseSpeed() {
        if (this.score % 50 === 0 && this.gameSpeed > 50) {
            this.gameSpeed -= 5;
        }
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        if (!this.isPlaying) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showPauseOverlay();
        } else {
            this.hidePauseOverlay();
        }
    }

    /**
     * End game with final score display
     */
    endGame() {
        this.isPlaying = false;
        this.updateHighScore();
        
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        const message = document.getElementById('overlay-message');
        const button = document.getElementById('start-btn');
        
        title.textContent = '🎮 遊戲結束';
        message.textContent = `最終得分：${this.score} | 最高分：${this.highScore}`;
        button.textContent = '再玩一次';
        
        overlay.style.display = 'flex';
    }

    /**
     * Reset game to initial state
     */
    resetGame() {
        this.startGame();
    }

    /**
     * Update score display
     */
    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
    }

    /**
     * Update high score display
     */
    updateHighScoreDisplay() {
        document.getElementById('high-score').textContent = this.highScore;
    }

    /**
     * Update and save high score
     */
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore(this.highScore);
            this.updateHighScoreDisplay();
        }
    }

    /**
     * Load high score from localStorage
     */
    loadHighScore() {
        const saved = localStorage.getItem('snakeHighScore');
        return saved ? parseInt(saved, 10) : 0;
    }

    /**
     * Save high score to localStorage
     */
    saveHighScore(score) {
        localStorage.setItem('snakeHighScore', score.toString());
    }

    /**
     * Hide main overlay
     */
    hideOverlay() {
        document.getElementById('game-overlay').style.display = 'none';
    }

    /**
     * Show pause overlay
     */
    showPauseOverlay() {
        document.getElementById('pause-overlay').style.display = 'flex';
    }

    /**
     * Hide pause overlay
     */
    hidePauseOverlay() {
        document.getElementById('pause-overlay').style.display = 'none';
    }

    /**
     * Draw rounded rectangle helper
     */
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.snakeGame = new SnakeGame();
});
