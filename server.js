// 1. Import necessary modules
const express = require('express');
const cors = require('cors');
const crypto = require('crypto'); // For generating unique IDs

// 2. Import our *own* Game logic
const { Game } = require('./game-engine.js');

// 3. Create our server application
const app = express();
const port = 3000;

// 4. Setup Middleware
app.use(cors()); // Enable CORS for all requests
app.use(express.json()); // Automatically parse JSON request bodies
app.use(express.static('public')); // Serve static files from the 'public' folder

// 5. --- Multi-Game State Management ---
let activeGames = new Map(); // Stores game objects: { sessionId -> game }
let playerWallets = new Map(); // Stores wallet balances: { sessionId -> balance }


// 6. --- NEW HELPER FUNCTION ---
/**
 * Calculates the payout, updates the wallet in the Map, and cleans up the game.
 * @param {string} sessionId - The ID of the current session
 * @param {Game} currentGame - The game object that just finished
 * @param {number} currentWallet - The player's wallet balance *before* payout
 * @returns {number} - The new wallet balance after payout
 */
function calculateAndHandlePayout(sessionId, currentGame, currentWallet) {
    const betAmount = currentGame.betAmount;
    let newWallet = currentWallet; // Start with the wallet balance

    if (currentGame.message.includes('Player wins') && !currentGame.playerHasBlackjack) {
        // Regular 1:1 win
        newWallet += (betAmount * 2); // Win: Get bet back + winnings
        console.log(`Session ${sessionId} WINS $${betAmount}. Wallet is now $${newWallet}`);
    
    } else if (currentGame.message.includes('tie (Push)')) {
        // Tie
        newWallet += betAmount; // Tie: Get bet back
        console.log(`Session ${sessionId} PUSH (tie). Wallet is now $${newWallet}`);
    
    } else if (currentGame.playerHasBlackjack && currentGame.message.includes('Player wins')) {
        // Blackjack win (was handled in /game/new, but we check again)
        // This case should ideally not be hit here, but as a safeguard
        console.log(`Session ${sessionId} had Blackjack. Payout already handled.`);
        // We do nothing because the payout was already calculated in /game/new
        // Note: we need to fetch the *updated* wallet from the map
        newWallet = playerWallets.get(sessionId);

    } else {
        // Player loses (or busts)
        // Bet was already subtracted, so wallet balance is correct.
        console.log(`Session ${sessionId} LOSES $${betAmount}. Wallet is still $${newWallet}`);
    }

    // Update the wallet in the Map
    playerWallets.set(sessionId, newWallet);
    
    // Game is over, remove it from active games to save memory
    activeGames.delete(sessionId); 
    
    return newWallet; // Return the final, calculated wallet balance
}


// --- API Endpoints ---

/**
 * POST /session/new
 * Creates a new session for a player.
 */
app.post('/session/new', (req, res) => {
    const sessionId = crypto.randomUUID();
    const startingWallet = 100;
    playerWallets.set(sessionId, startingWallet);

    console.log(`New session created: ${sessionId} with $${startingWallet}`);

    res.json({
        sessionId: sessionId,
        playerWallet: startingWallet,
        message: "Welcome! Place your bet to start."
    });
});

/**
 * POST /game/new
 * Starts a new game for a specific session.
 */
app.post('/game/new', (req, res) => {
    const { sessionId, betAmount } = req.body;
    
    if (!sessionId || !playerWallets.has(sessionId)) {
        return res.status(400).json({ error: 'Invalid session. Please restart.' });
    }

    let currentWallet = playerWallets.get(sessionId);
    const bet = parseInt(betAmount);

    if (!bet || bet <= 0) {
        return res.status(400).json({ error: 'Invalid bet amount.' });
    }
    if (bet > currentWallet) {
        return res.status(400).json({ error: 'Not enough money in wallet.' });
    }

    currentWallet -= bet; // Subtract the bet
    playerWallets.set(sessionId, currentWallet); // Update wallet in Map

    const newGame = new Game();
    newGame.startGame();
    newGame.betAmount = bet; 
    activeGames.set(sessionId, newGame);

    let finalWallet = currentWallet;

    // Check for immediate Blackjack
    if (newGame.isGameOver) {
        console.log("Instant game end (Blackjack logic).");
        if (newGame.message.includes('Player wins')) {
            const winnings = bet * 1.5;
            finalWallet += (bet + winnings); // Add bet back + 3:2 winnings
            console.log(`Player BLACKJACK! Wins $${winnings}. Wallet is now $${finalWallet}`);
        } else if (newGame.message.includes('Push')) {
            finalWallet += bet; // Tie: Get bet back
            console.log(`Player PUSH (tie). Wallet is now $${finalWallet}`);
        }
        // If dealer wins, bet is just lost
        
        playerWallets.set(sessionId, finalWallet); // Save final wallet to Map
        activeGames.delete(sessionId); // Clean up the game
    }
    
    console.log(`Session ${sessionId} started game. Wallet is now $${finalWallet}`);

    res.json({
        message: newGame.message,
        playerHand: newGame.playerHand,
        dealerHand: newGame.dealerHand,
        playerScore: newGame.playerScore,
        isGameOver: newGame.isGameOver,
        playerWallet: finalWallet 
    });
});

/**
 * POST /game/hit
 * Player in a specific session draws a card.
 */
app.post('/game/hit', (req, res) => {
    const { sessionId } = req.body;
    
    const currentGame = activeGames.get(sessionId);
    let currentWallet = playerWallets.get(sessionId);
    let finalWallet = currentWallet; // Default to current wallet

    if (!currentGame) {
        return res.status(400).json({ error: 'No game in progress for this session.' });
    }

    currentGame.hit(); // Player gets a card
    console.log(`Session ${sessionId} HITS. New score:`, currentGame.playerScore);
    
    // Check for auto-stand on 21
    if (currentGame.playerScore === 21 && !currentGame.isGameOver) {
        console.log("Player hit 21! Automatically standing.");
        currentGame.stand(); // Run dealer turn
    }
    
    // --- THIS IS THE FIX ---
    // *After* hit (and potential auto-stand), check if the game is over
    if (currentGame.isGameOver) {
        console.log("Game ended after hit (Bust or 21-stand). Calculating payout.");
        // This will handle bust (player > 21) OR auto-stand win/loss
        finalWallet = calculateAndHandlePayout(sessionId, currentGame, currentWallet);
    }
    // --- END OF FIX ---

    res.json({
        message: currentGame.message,
        playerHand: currentGame.playerHand,
        playerScore: currentGame.playerScore,
        isGameOver: currentGame.isGameOver,
        dealerHand: currentGame.dealerHand,
        playerWallet: finalWallet // Send the *final* wallet
    });
});

/**
 * POST /game/stand
 * Player in a specific session stands.
 */
app.post('/game/stand', (req, res) => {
    const { sessionId } = req.body;
    
    const currentGame = activeGames.get(sessionId);
    let currentWallet = playerWallets.get(sessionId);

    if (!currentGame) {
        return res.status(400).json({ error: 'No game in progress.' });
    }

    currentGame.stand(); // Dealer plays, winner is determined

    // --- CLEANUP ---
    // All the old payout logic is now inside this helper function
    const finalWallet = calculateAndHandlePayout(sessionId, currentGame, currentWallet);
    console.log(`Session ${sessionId} STANDS. Final Wallet: $${finalWallet}`);
    // --- END OF CLEANUP ---

    res.json({
        message: currentGame.message,
        playerHand: currentGame.playerHand,
        dealerHand: currentGame.dealerHand,
        playerScore: currentGame.playerScore,
        dealerScore: currentGame.dealerScore,
        isGameOver: currentGame.isGameOver,
        playerWallet: finalWallet 
    });
});

/**
 * POST /game/restart
 * Resets a specific session's wallet back to $100.
 */
app.post('/game/restart', (req, res) => {
    const { sessionId } = req.body;
    
    const startingWallet = 100;
    
    playerWallets.set(sessionId, startingWallet);
    activeGames.delete(sessionId); // Clear any old game
    
    console.log(`Session ${sessionId} wallet reset to $100`);

    res.json({
        message: "Wallet reset to $100! Place a new bet.",
        playerWallet: startingWallet,
        isGameOver: true 
    });
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Blackjack server is running and listening at http://localhost:${port}`);
    console.log("Ready to serve the game and receive commands!");
});