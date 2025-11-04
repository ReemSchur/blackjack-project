// --- Client-Side JavaScript (app.js) ---

// 1. Define the server API endpoint
const API_URL = 'http://localhost:3000';

// 2. --- UPDATED --- Session ID
// We now try to load it from the browser's memory
let sessionId = localStorage.getItem('blackjackSessionId') || null;

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
 * 5. --- UPDATED --- Initialize Session
 * This function now checks for a saved session in localStorage
 */
async function initializeSession() {
    try {
        let url = `${API_URL}/session/new`; // Default
        let options = { method: 'POST' };

        // If we have a saved ID, try to resume that session instead
        if (sessionId) {
            console.log(`Found saved sessionId: ${sessionId}. Resuming...`);
            url = `${API_URL}/session/resume`;
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify({ sessionId: sessionId });
        } else {
            console.log("No saved session. Requesting new one...");
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            // If session resume fails (e.g., server restarted and lost session ID)
            // Clear the bad ID and request a new one
            console.warn("Resuming session failed, getting new one.");
            localStorage.removeItem('blackjackSessionId');
            sessionId = null;
            await initializeSession(); // Retry getting a new session
            return;
        }

        const data = await response.json();
        
        sessionId = data.sessionId; // Save/update our unique ID
        
        // --- NEW --- Save the (potentially new) ID to browser memory
        localStorage.setItem('blackjackSessionId', sessionId);

        messageArea.textContent = data.message;
        walletArea.textContent = `Wallet: $${parseFloat(data.playerWallet).toFixed(2)}`;
        
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
        body: JSON.stringify({ sessionId: sessionId })
    });
    const gameState = await response.json();

    updateUI(gameState);
}

async function restartWallet() {
    console.log("Resetting wallet...");
    
    const response = await fetch(`${API_URL}/game/restart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId: sessionId })
    });
    const gameState = await response.json();

    updateUI(gameState);

    // Manually reset the UI
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
    // Check if gameState exists
    if (!gameState) {
        console.error("Invalid gameState received");
        return;
    }

    messageArea.textContent = gameState.message || "An error occurred."; // Fallback message
    playerScoreEl.textContent = gameState.playerScore !== null && gameState.playerScore !== undefined ? gameState.playerScore : '?';
    
    if (gameState.playerWallet !== undefined) {
        walletArea.textContent = `Wallet: $${parseFloat(gameState.playerWallet).toFixed(2)}`;
    }

    if (gameState.isGameOver) {
        dealerScoreEl.textContent = gameState.dealerScore !== null && gameState.dealerScore !== undefined ? gameState.dealerScore : '?';
        betControls.style.display = 'block';
        actionControls.style.display = 'none';
    } else {
        dealerScoreEl.textContent = '?';
    }

    renderHand(gameState.playerHand, playerCardsEl);
    renderHand(gameState.dealerHand, dealerCardsEl, !gameState.isGameOver);
}

function renderHand(hand, element, hideFirstCard = false) {
    element.innerHTML = '';
    if (!hand) return;

    const cardImageUrl = 'https://deckofcardsapi.com/static/img';

    hand.forEach((card, index) => {
        const cardImg = document.createElement('img');
        cardImg.className = 'card'; 

        if (hideFirstCard && index === 0) {
            cardImg.src = `${cardImageUrl}/back.png`;
        } else {
            // Check if card object and card.code exist
            if (card && card.code) {
                cardImg.src = `${cardImageUrl}/${card.code}.png`;
            } else {
                // Fallback or error logging
                console.error("Card object is missing 'code' property:", card);
                cardImg.alt = "Error"; // Show something if image fails
            }
        }
        
        cardImg.style.animationDelay = `${index * 100}ms`;
        element.appendChild(cardImg);
    });
}


/**
 * 8. Start everything!
 */
betControls.style.display = 'none';
actionControls.style.display = 'none';
btnRestart.style.display = 'none';
messageArea.textContent = 'Connecting to server...';

// This one function now handles everything
initializeSession();

