// --- Client-Side JavaScript (app.js) ---

// 1. Define the server API endpoint
const API_URL = 'http://localhost:3000';

// 2. --- NEW --- Session ID
// This will store the unique ID for this player's session
let sessionId = null;

// 3. Get references to all the HTML elements
const btnNewGame = document.getElementById('btn-new-game');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnRestart = document.getElementById('btn-restart');

const messageArea = document.getElementById('message-area');
const walletArea = document.getElementById('wallet-area');
const betAmountInput = document.getElementById('bet-amount');

const betControls = document.getElementById('bet-controls');
const actionControls = document.getElementById('action-controls');

const dealerScoreEl = document.getElementById('dealer-score');
const playerScoreEl = document.getElementById('player-score');

const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');


// 4. Add Event Listeners to the buttons
btnNewGame.addEventListener('click', newGame);
btnHit.addEventListener('click', hit);
btnStand.addEventListener('click', stand);
btnRestart.addEventListener('click', restartWallet);


/**
 * 5. --- NEW --- Initialize Session
 * This function is called immediately when the page loads.
 * It gets a unique session ID from the server.
 */
async function initializeSession() {
    try {
        const response = await fetch(`${API_URL}/session/new`, {
            method: 'POST'
        });
        const data = await response.json();
        
        sessionId = data.sessionId; // Save our unique ID
        
        // Update UI with initial data from server
        messageArea.textContent = data.message;
        walletArea.textContent = `Wallet: $${data.playerWallet}`;
        
        // Now that we are ready, show the betting controls
        betControls.style.display = 'block';
        btnRestart.style.display = 'block';

    } catch (error) {
        console.error("Error initializing session:", error);
        messageArea.textContent = "Error connecting to server. Please refresh.";
    }
}

/**
 * 6. Game Functions - These talk to the server
 */

async function newGame() {
    console.log("Starting new game...");
    const betAmount = betAmountInput.value;

    const response = await fetch(`${API_URL}/game/new`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // Send BOTH the session ID and the bet
        body: JSON.stringify({ 
            sessionId: sessionId, 
            betAmount: betAmount 
        })
    });

    const gameState = await response.json();

    if (gameState.error) {
        messageArea.textContent = gameState.error;
        return;
    }

    updateUI(gameState);

    // Only show action buttons if the game isn't over (e.g., from Blackjack)
    if (!gameState.isGameOver) {
        betControls.style.display = 'none';
        actionControls.style.display = 'block';
    }
}

async function hit() {
    console.log("Player HITS...");

    const response = await fetch(`${API_URL}/game/hit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // Send the session ID so the server knows *who* is hitting
        body: JSON.stringify({ sessionId: sessionId })
    });
    const gameState = await response.json();
    
    updateUI(gameState);
}

async function stand() {
    console.log("Player STANDS...");

    const response = await fetch(`${API_URL}/game/stand`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // Send the session ID so the server knows *who* is standing
        body: JSON.stringify({ sessionId: sessionId })
    });
    const gameState = await response.json();

    updateUI(gameState);
}

/**
 * Resets the wallet via the server.
 */
async function restartWallet() {
    console.log("Resetting wallet...");
    
    const response = await fetch(`${API_URL}/game/restart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // Send the session ID to reset the correct wallet
        body: JSON.stringify({ sessionId: sessionId })
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
    messageArea.textContent = gameState.message;
}


/**
 * 7. Helper Functions - These update the webpage
 */

function updateUI(gameState) {
    messageArea.textContent = gameState.message;
    
    // Check for null score, default to '?'
    playerScoreEl.textContent = gameState.playerScore !== null ? gameState.playerScore : '?';
    
    if (gameState.playerWallet !== undefined) {
        // Format wallet to 2 decimal places if it's a fraction (from 3:2 payout)
        walletArea.textContent = `Wallet: $${parseFloat(gameState.playerWallet).toFixed(2)}`;
    }

    if (gameState.isGameOver) {
        dealerScoreEl.textContent = gameState.dealerScore !== null ? gameState.dealerScore : '?';
        // Show betting, hide Hit/Stand
        betControls.style.display = 'block';
        actionControls.style.display = 'none';
    } else {
        dealerScoreEl.textContent = '?';
    }

    // Render the hands
    renderHand(gameState.playerHand, playerCardsEl);
    renderHand(gameState.dealerHand, dealerCardsEl, !gameState.isGameOver);
}

/**
 * --- THIS FUNCTION IS UPDATED ---
 * Renders the cards for a specific hand using <img> tags
 * @param {Array} hand - Array of card objects
 * @param {HTMLElement} element - The HTML element to put the cards in
 * @param {boolean} hideFirstCard - If true, hides the dealer's first card
 */
function renderHand(hand, element, hideFirstCard = false) {
    // Clear previous cards
    element.innerHTML = '';
    
    if (!hand) return;

    // Base URL for card images
    const cardImageUrl = 'https://deckofcardsapi.com/static/img';

    hand.forEach((card, index) => {
        // Create an <img> element
        const cardImg = document.createElement('img');
        cardImg.className = 'card'; // For styling

        if (hideFirstCard && index === 0) {
            // Show a card back
            cardImg.src = `${cardImageUrl}/back.png`;
        } else {
            // Show the real card using the 'code' (e.g., "AS", "KH", "0H")
            cardImg.src = `${cardImageUrl}/${card.code}.png`;
        }
        
        // Add a little delay to each card for a "dealing" animation
        // This makes the animation staggered
        cardImg.style.animationDelay = `${index * 100}ms`;

        element.appendChild(cardImg);
    });
}


/**
 * 8. --- NEW --- Start everything!
 * We hide all controls by default to prevent clicks before session is ready
 */
betControls.style.display = 'none';
actionControls.style.display = 'none';
btnRestart.style.display = 'none';
messageArea.textContent = 'Connecting to server...';

// Call the initialize function when the script loads
initializeSession();