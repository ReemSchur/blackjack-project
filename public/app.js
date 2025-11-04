// --- Client-Side JavaScript (app.js) ---

// 1. Define the server API endpoint
const API_URL = 'http://localhost:3000';

// 2. Get references to all the HTML elements we need
const btnNewGame = document.getElementById('btn-new-game');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');

const messageArea = document.getElementById('message-area');

const dealerScoreEl = document.getElementById('dealer-score');
const playerScoreEl = document.getElementById('player-score');

const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');

const walletArea = document.getElementById('wallet-area');
const betAmountInput = document.getElementById('bet-amount');
const betControls = document.getElementById('bet-controls');
const actionControls = document.getElementById('action-controls');
const btnRestart = document.getElementById('btn-restart');

// 3. Add Event Listeners to the buttons
btnNewGame.addEventListener('click', newGame);
btnHit.addEventListener('click', hit);
btnStand.addEventListener('click', stand);
btnRestart.addEventListener('click', restartWallet);


/**
 * 4. Game Functions - These talk to the server
 */

async function newGame() {
    console.log("Starting new game...");

    // --- NEW --- Get bet amount from input
    const betAmount = betAmountInput.value;

    // Call the '/game/new' endpoint on our server
    const response = await fetch(`${API_URL}/game/new`, {
        method: 'POST',
        // --- NEW --- Send the bet amount in the body
        headers: {
            'Content-Type': 'application/json' // Tell the server we're sending JSON
        },
        body: JSON.stringify({ betAmount: betAmount }) // Convert our data to a JSON string
    });

    const gameState = await response.json();

    // --- NEW --- Check for errors from the server (e.g. not enough money)
    if (gameState.error) {
        messageArea.textContent = gameState.error;
        return; // Stop here if there was an error
    }

    // Update the screen with the new game state
updateUI(gameState); // updateUI will handle buttons *if* game is over

// --- NEW LOGIC ---
// Only hide bet controls IF the game is *not* over
if (!gameState.isGameOver) {
    // Normal game start, show action buttons
    betControls.style.display = 'none';
    actionControls.style.display = 'block';
}
}
// If the game *is* over (from Blackjack), updateUI already handled
// showing the bet controls, so we do nothing here.


async function hit() {
    console.log("Player HITS...");

    // Call the '/game/hit' endpoint
    const response = await fetch(`${API_URL}/game/hit`, {
        method: 'POST'
    });
    const gameState = await response.json();
    
    // Update the screen
    updateUI(gameState);
}

async function stand() {
    console.log("Player STANDS...");

    // Call the '/game/stand' endpoint
    const response = await fetch(`${API_URL}/game/stand`, {
        method: 'POST'
    });
    const gameState = await response.json();

    // Update the screen with the final result
    updateUI(gameState);
}

/**
 * Resets the wallet via the server.
 */
async function restartWallet() {
    console.log("Resetting wallet...");
    
    // Call the '/game/restart' endpoint
    const response = await fetch(`${API_URL}/game/restart`, {
        method: 'POST'
    });
    const gameState = await response.json();

    // Update the UI with the reset state
    updateUI(gameState);

    // Manually reset the UI to the starting position
    betControls.style.display = 'block';
    actionControls.style.display = 'none';
    dealerScoreEl.textContent = '?';
    playerScoreEl.textContent = '?';
    playerCardsEl.innerHTML = '';
    dealerCardsEl.innerHTML = '';
    messageArea.textContent = gameState.message; // Show reset message
}

/**
 * 5. Helper Functions - These update the webpage
 */

function updateUI(gameState) {
    // Update messages and scores
    messageArea.textContent = gameState.message;
    playerScoreEl.textContent = gameState.playerScore;

    // --- NEW --- Update wallet display
    // Use ?? (Nullish Coalescing) in case wallet isn't sent every time
    // (Though our server *does* send it, this is good practice)
    if (gameState.playerWallet !== undefined) {
        walletArea.textContent = `Wallet: $${gameState.playerWallet}`;
    }

    // If the game is over...
    if (gameState.isGameOver) {
        dealerScoreEl.textContent = gameState.dealerScore;

        // --- NEW --- Show betting, hide Hit/Stand
        betControls.style.display = 'block';
        actionControls.style.display = 'none';

    } else { // If game is NOT over...
        dealerScoreEl.textContent = '?';
    }

    // Render the hands
    renderHand(gameState.playerHand, playerCardsEl);
    renderHand(gameState.dealerHand, dealerCardsEl, !gameState.isGameOver);
}
/**
 * Renders the cards for a specific hand
 * @param {Array} hand - Array of card objects
 * @param {HTMLElement} element - The HTML element to put the cards in
 * @param {boolean} hideFirstCard - If true, hides the dealer's first card
 */
function renderHand(hand, element, hideFirstCard = false) {
    // Clear previous cards
    element.innerHTML = '';
    
    // Handle edge case where hand might be empty
    if (!hand) return;

    // Create a card element for each card
    hand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card'; // We will use this for styling later

        if (hideFirstCard && index === 0) {
            // Show a card back instead of the real card
            cardDiv.textContent = '🂠'; // Unicode for card back
            cardDiv.classList.add('card-back');
        } else {
            // Show the real card
            // Use the toString() method from our game-engine!
            const suitSymbols = {
                'Spades': '♠️',
                'Hearts': '♥️',
                'Diamonds': '♦️',
                'Clubs': '♣️'
            };
            cardDiv.textContent = `${card.rank} ${suitSymbols[card.suit]}`;
            // Add a class for color (red/black)
            if (card.suit === 'Hearts' || card.suit === 'Diamonds') {
                cardDiv.classList.add('red');
            }
        }
        element.appendChild(cardDiv);
    });
}