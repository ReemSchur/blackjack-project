// 1. Import necessary modules
const express = require('express');
const cors = require('cors');
const crypto = require('crypto'); // For generating unique IDs
const Database = require('better-sqlite3'); // --- NEW: Import the database driver ---

// 2. Import our *own* Game logic
const { Game } = require('./game-engine.js');

// 3. Create our server application
const app = express();
const port = process.env.PORT || 3000;

// 4. --- NEW: Setup Database ---
// This creates a file 'blackjack.db' in your project folder
const db = new Database('blackjack.db'); 
// Create the wallets table if it doesn't exist.
db.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
        sessionId TEXT PRIMARY KEY NOT NULL,
        wallet REAL NOT NULL
    )
`);
// --- END NEW DB SETUP ---

// 5. Setup Middleware
app.use(cors()); // Enable CORS for all requests
app.use(express.json()); // Automatically parse JSON request bodies
app.use(express.static('public')); // Serve static files from the 'public' folder

// 6. --- STATE MANAGEMENT (Now in DB) ---
// We no longer use global Maps for wallets! They are in the DB.
// We *still* use a Map for *active games* (which are temporary, in-memory)
let activeGames = new Map(); // Stores game objects: { sessionId -> game }


// 7. --- NEW HELPER FUNCTION --- (This is from our last update)
/**
 * Calculates the payout, updates the wallet in the Database, and cleans up the game.
 * @param {string} sessionId - The ID of the current session
 * @param {Game} currentGame - The game object that just finished
 * @param {number} currentWallet - The player's wallet balance *before* payout
 * @returns {number} - The new wallet balance after payout
 */
function calculateAndHandlePayout(sessionId, currentGame, currentWallet) {
    const betAmount = currentGame.betAmount;
    let newWallet = currentWallet; 

    if (currentGame.message.includes('Player wins') && !currentGame.playerHasBlackjack) {
        // Regular 1:1 win
        newWallet += (betAmount * 2); // Win: Get bet back + winnings
        console.log(`Session ${sessionId} WINS $${betAmount}. Wallet is now $${newWallet}`);
    
    } else if (currentGame.message.includes('tie (Push)')) {
        // Tie
        newWallet += betAmount; // Tie: Get bet back
        console.log(`Session ${sessionId} PUSH (tie). Wallet is now $${newWallet}`);
    
    } else {
        // Player loses (or busts), or Dealer Blackjack
        console.log(`Session ${sessionId} LOSES $${betAmount}. Wallet is still $${newWallet}`);
    }

    // --- NEW: Update the wallet *in the Database* ---
    try {
        const stmt = db.prepare('UPDATE wallets SET wallet = ? WHERE sessionId = ?');
        stmt.run(newWallet, sessionId);
    } catch (err) {
        console.error("DB Update Error:", err.message);
    }
    
    // Game is over, remove it from active games to save memory
    activeGames.delete(sessionId); 
    
    return newWallet; // Return the final, calculated wallet balance
}


// --- API Endpoints ---

/**
 * --- NEW ENDPOINT ---
 * POST /session/resume
 * Client is sending an ID it has in storage. Check if it's valid.
 */
app.post('/session/resume', (req, res) => {
    const { sessionId } = req.body;
    
    // Check if this session exists in the DB
    const stmt = db.prepare('SELECT wallet FROM wallets WHERE sessionId = ?');
    const data = stmt.get(sessionId);

    if (data) {
        // Session found! Return the saved wallet.
        console.log(`Resuming session ${sessionId}. Wallet: $${data.wallet}`);
        res.json({
            sessionId: sessionId,
            playerWallet: data.wallet,
            message: "Welcome back! Place your bet."
        });
    } else {
        // Session not found (e.g., DB was cleared). Create a new one.
        console.log(`Session ${sessionId} not found. Creating new session.`);
        createNewSession(res); // Call the 'new session' logic
    }
});

/**
 * POST /session/new
 * Creates a brand new session for a player.
 */
app.post('/session/new', (req, res) => {
    createNewSession(res);
});

// Helper function to create a new session
function createNewSession(res) {
    const sessionId = crypto.randomUUID();
    const startingWallet = 100;
    
    // --- NEW: Save the new session to the Database ---
    try {
        const stmt = db.prepare('INSERT INTO wallets (sessionId, wallet) VALUES (?, ?)');
        stmt.run(sessionId, startingWallet);
    } catch (err) {
        console.error("DB Insert Error:", err.message);
        return res.status(500).json({ error: "Could not create session." });
    }

    console.log(`New session created: ${sessionId} with $${startingWallet}`);

    res.json({
        sessionId: sessionId,
        playerWallet: startingWallet,
        message: "Welcome! Place your bet to start."
    });
}

/**
 * POST /game/new
 * Starts a new game for a specific session.
 */
app.post('/game/new', (req, res) => {
    const { sessionId, betAmount } = req.body;
    
    // --- NEW: Get wallet from Database ---
    const stmt_get = db.prepare('SELECT wallet FROM wallets WHERE sessionId = ?');
    const data = stmt_get.get(sessionId);

    if (!data) {
        return res.status(400).json({ error: 'Invalid session. Please restart.' });
    }

    let currentWallet = data.wallet;
    const bet = parseInt(betAmount);

    if (!bet || bet <= 0) {
        return res.status(400).json({ error: 'Invalid bet amount.' });
    }
    if (bet > currentWallet) {
        return res.status(400).json({ error: 'Not enough money in wallet.' });
    }

    currentWallet -= bet; // Subtract the bet
    
    // --- NEW: Update wallet in DB *before* game starts ---
    const stmt_update = db.prepare('UPDATE wallets SET wallet = ? WHERE sessionId = ?');
    stmt_update.run(currentWallet, sessionId); 

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
            finalWallet += (bet + winnings); 
            console.log(`Player BLACKJACK! Wins $${winnings}.`);
        } else if (newGame.message.includes('Push')) {
            finalWallet += bet; 
            console.log(`Player PUSH (tie).`);
        }
        
        // --- NEW: Update wallet in DB after Blackjack payout ---
        stmt_update.run(finalWallet, sessionId); 
        activeGames.delete(sessionId); // Clean up game
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
    
    // --- NEW: Get wallet from DB ---
    const stmt_get = db.prepare('SELECT wallet FROM wallets WHERE sessionId = ?');
    const data = stmt_get.get(sessionId);
    let currentWallet = data ? data.wallet : 0; // Get wallet, or default if error
    let finalWallet = currentWallet; // Default

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
    
    // *After* hit (and potential auto-stand), check if the game is over
    if (currentGame.isGameOver) {
        console.log("Game ended after hit (Bust or 21-stand). Calculating payout.");
        finalWallet = calculateAndHandlePayout(sessionId, currentGame, currentWallet);
    }

    res.json({
        message: currentGame.message,
        playerHand: currentGame.playerHand,
        playerScore: currentGame.playerScore,
        isGameOver: currentGame.isGameOver,
        dealerHand: currentGame.dealerHand,
        playerWallet: finalWallet 
    });
});

/**
 * POST /game/stand
 * Player in a specific session stands.
 */
app.post('/game/stand', (req, res) => {
    const { sessionId } = req.body;
    
    const currentGame = activeGames.get(sessionId);
    
    // --- NEW: Get wallet from DB ---
    const stmt_get = db.prepare('SELECT wallet FROM wallets WHERE sessionId = ?');
    const data = stmt_get.get(sessionId);
    let currentWallet = data ? data.wallet : 0;

    if (!currentGame) {
        return res.status(400).json({ error: 'No game in progress.' });
    }

    currentGame.stand(); // Dealer plays, winner is determined

    const finalWallet = calculateAndHandlePayout(sessionId, currentGame, currentWallet);
    console.log(`Session ${sessionId} STANDS. Final Wallet: $${finalWallet}`);

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
 * Resets a specific session's wallet back to $100 in the DB.
 */
app.post('/game/restart', (req, res) => {
    const { sessionId } = req.body;
    
    const startingWallet = 100;
    
    // --- NEW: Update the wallet *in the Database* ---
    try {
        const stmt = db.prepare('UPDATE wallets SET wallet = ? WHERE sessionId = ?');
        stmt.run(startingWallet, sessionId);
        activeGames.delete(sessionId); // Clear any old game
    } catch (err) {
        console.error("DB Restart Error:", err.message);
    }
    
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