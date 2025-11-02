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


// 3. Add Event Listeners to the buttons
btnNewGame.addEventListener('click', newGame);
btnHit.addEventListener('click', hit);
btnStand.addEventListener('click', stand);


/**
 * 4. Game Functions - These talk to the server
 */

async function newGame() {
    console.log("Starting new game...");
    
    // Call the '/game/new' endpoint on our server
    const response = await fetch(`${API_URL}/game/new`, {
        method: 'POST'
    });
    const gameState = await response.json();

    // Update the screen with the new game state
    updateUI(gameState);
    
    // Enable the Hit and Stand buttons
    btnHit.disabled = false;
    btnStand.disabled = false;
}

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
 * 5. Helper Functions - These update the webpage
 */

function updateUI(gameState) {
    // Update messages and scores
    messageArea.textContent = gameState.message;
    playerScoreEl.textContent = gameState.playerScore;
    
    // If the game is over, show the dealer's final score
    if (gameState.isGameOver) {
        dealerScoreEl.textContent = gameState.dealerScore;
        // Disable buttons
        btnHit.disabled = true;
        btnStand.disabled = true;
    } else {
        // If game is not over, hide dealer's score
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