const size = 5;
let matrix = Array.from({ length: size }, () => Array(size).fill(0));
let readyToPlayShown = false;
let gameStarted = false;
const board = document.getElementById("bingo-board");
const bingoLetters = document.querySelectorAll(".bingo-letter");

// Add click handlers to BINGO letters
bingoLetters.forEach((letter, index) => {
  letter.addEventListener("click", () => {
    letter.classList.toggle("active");
    saveGameState();
  });
});

// Local Storage Functions
function saveGameState() {
  const gameState = {
    matrix: matrix,
    gameStarted: gameStarted,
    readyToPlayShown: readyToPlayShown,
    cellData: [],
    bingoLetters: []
  };
  // Save cell data
  const cells = document.querySelectorAll("td");
  cells.forEach(cell => {
    gameState.cellData.push({
      textContent: cell.textContent,
      hasFilled: cell.classList.contains("filled"),
      hasMarked: cell.classList.contains("marked")
    });
  });
  // Save BINGO letter states
  bingoLetters.forEach(letter => {
    gameState.bingoLetters.push(letter.classList.contains("active"));
  });
  localStorage.setItem("bingoGameState", JSON.stringify(gameState));
}

function loadGameState() {
  const savedState = localStorage.getItem("bingoGameState");
  if (!savedState) return false;
  try {
    const gameState = JSON.parse(savedState);
    // Restore matrix and game state
    matrix = gameState.matrix || Array.from({ length: size }, () => Array(size).fill(0));
    gameStarted = gameState.gameStarted || false;
    readyToPlayShown = gameState.readyToPlayShown || false;
    // Restore cell data
    if (gameState.cellData) {
      const cells = document.querySelectorAll("td");
      gameState.cellData.forEach((cellData, index) => {
        if (cells[index]) {
          cells[index].textContent = cellData.textContent;
          if (cellData.hasFilled) cells[index].classList.add("filled");
          if (cellData.hasMarked) cells[index].classList.add("marked");
        }
      });
    }
    // Restore BINGO letter states
    if (gameState.bingoLetters) {
      gameState.bingoLetters.forEach((isActive, index) => {
        if (bingoLetters[index]) {
          if (isActive) {
            bingoLetters[index].classList.add("active");
          } else {
            bingoLetters[index].classList.remove("active");
          }
        }
      });
    }
    return true;
  } catch (error) {
    console.error("Error loading game state:", error);
    return false;
  }
}

function clearGameState() {
  localStorage.removeItem("bingoGameState");
}

function createBoard() {
  board.innerHTML = "";
  for (let i = 0; i < size; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < size; j++) {
      const cell = document.createElement("td");
      cell.addEventListener("click", () => handleCellClick(i, j, cell));
      row.appendChild(cell);
    }
    board.appendChild(row);
  }
}

function handleCellClick(i, j, cell) {
  // If game has started, only allow marking/unmarking, not changing numbers
  if (gameStarted) {
    if (cell.classList.contains("filled")) {
      cell.classList.toggle("marked");
      matrix[i][j] = cell.classList.contains("marked") ? 1 : 0;
      checkBingo();
    }
    return;
  }
  // If cell is empty → fill with least available number
  if (!cell.textContent.trim()) {
    const leastNumber = findLeastAvailableNumber();
    if (leastNumber === null) {
      alert("All numbers filled!");
      return;
    }
    cell.textContent = leastNumber;
    cell.classList.add("filled");
  } 
  // If cell has a number → make it empty (only remove this specific number)
  else {
    cell.textContent = "";
    cell.classList.remove("filled", "marked");
    matrix[i][j] = 0;
    // Don't renumber other cells - just remove this specific number
  }
  // Check if all cells are filled and show confirmation
  if (checkAllCellsFilled() && !readyToPlayShown) {
    readyToPlayShown = true;
    setTimeout(() => {
      if (confirm("🎯 All 25 cells are filled! Are you ready to start the game?")) {
        gameStarted = true;
      }
    }, 100);
  }
  checkBingo();
  saveGameState();
}

function findLeastAvailableNumber() {
  // Get all currently used numbers
  const usedNumbers = new Set();
  const filledCells = document.querySelectorAll("td.filled");
  filledCells.forEach(cell => {
    const number = parseInt(cell.textContent);
    if (!isNaN(number)) {
      usedNumbers.add(number);
    }
  });
  // Find the least available number from 1 to 25
  for (let i = 1; i <= 25; i++) {
    if (!usedNumbers.has(i)) {
      return i;
    }
  }
  return null; // All numbers are used
}

function checkBingo() {
  // No automatic highlighting - players will manually tap BINGO letters
  // This function is kept for potential future use but doesn't highlight letters
}

function checkAllCellsFilled() {
  // Check if all cells have numbers (all 25 cells filled)
  const filledCells = document.querySelectorAll("td.filled");
  return filledCells.length === 25;
}

function updateBingoLetters(lines) {
  bingoLetters.forEach((letter, index) => {
    letter.classList.toggle("active", index < lines);
  });
}

function randomFillBoard() {
  // Only random fill if game hasn't started yet
  if (gameStarted) {
    alert("Game has already started! Use Reset to start over.");
    return;
  }
  // Get all empty cells
  const emptyCells = Array.from(document.querySelectorAll("td")).filter(cell => !cell.textContent.trim());
  if (emptyCells.length === 0) {
    alert("All cells are already filled!");
    return;
  }
  // Get all currently used numbers
  const usedNumbers = new Set();
  const filledCells = document.querySelectorAll("td.filled");
  filledCells.forEach(cell => {
    const number = parseInt(cell.textContent);
    if (!isNaN(number)) {
      usedNumbers.add(number);
    }
  });
  // Get available numbers (1-25 that aren't used)
  const availableNumbers = [];
  for (let i = 1; i <= 25; i++) {
    if (!usedNumbers.has(i)) {
      availableNumbers.push(i);
    }
  }
  // Shuffle available numbers
  for (let i = availableNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
  }
  // Fill empty cells with random available numbers
  const cellsToFill = Math.min(emptyCells.length, availableNumbers.length);
  for (let i = 0; i < cellsToFill; i++) {
    emptyCells[i].textContent = availableNumbers[i];
    emptyCells[i].classList.add("filled");
  }
  // Save the state
  saveGameState();
  // Check if all cells are now filled
  if (checkAllCellsFilled() && !readyToPlayShown) {
    readyToPlayShown = true;
    setTimeout(() => {
      if (confirm("🎯 All 25 cells are filled! Are you ready to start the game?")) {
        gameStarted = true;
        alert("🎮 Game started! You can now only mark/unmark numbers as they're called!");
      }
    }, 100);
  }
}

function resetBoard() {
  matrix = Array.from({ length: size }, () => Array(size).fill(0));
  readyToPlayShown = false;
  gameStarted = false;
  createBoard();
  bingoLetters.forEach(l => l.classList.remove("active"));
  clearGameState();
}

// Load saved game state on page load
createBoard();
if (!loadGameState()) {
  // If no saved state, start fresh (board already created)
}
