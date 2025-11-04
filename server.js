// 1. Import Express (the 'kit')
const express = require('express');

// 1b. Import CORS (Cross-Origin Resource Sharing)
const cors = require('cors');

// 2. Import our *own* Game logic
const { Game } = require('./game-engine.js');

// 3. Create our server application
const app = express();
const port = 3000;

// 4. Enable CORS for all requests
app.use(cors());

// 5. This is middleware - it tells Express to automatically parse JSON request bodies
app.use(express.json());

// 6. Serve static files from the 'public' folder
app.use(express.static('public'));


// 7. This will store the *one* game our server is managing
let currentGame = null;
let playerWallet = 100; // Player starts with $100


// --- API Endpoints (Our "Game Commands") ---

/**
 * POST /game/new
 * Starts a new game, checks for immediate Blackjack, and handles payout.
 */
app.post('/game/new', (req, res) => {
    // Get the bet amount from the request
    const betAmount = parseInt(req.body.betAmount);

    // Validation
    if (!betAmount || betAmount <= 0) {
        return res.status(400).json({ error: 'Invalid bet amount.' });
    }
    if (betAmount > playerWallet) {
        return res.status(400).json({ error: 'Not enough money in wallet.' });
    }

    // Subtract the bet from the wallet
    playerWallet -= betAmount;

    // Create a new game
    currentGame = new Game();
    currentGame.startGame(); // This will deal and check for Blackjack
    currentGame.betAmount = betAmount; 

    // Check if the game *immediately* ended (due to Blackjack)
    if (currentGame.isGameOver) {
        console.log("Instant game end (Blackjack logic).");
        
        if (currentGame.message.includes('Player wins')) {
            // Player Blackjack! Pay 3:2
            const winnings = betAmount * 1.5;
            playerWallet += (betAmount + winnings); // Bet back + Winnings
            console.log(`Player BLACKJACK! Wins $${winnings}. Wallet is now $${playerWallet}`);

        } else if (currentGame.message.includes('Push')) {
            // Tie: Get bet back
            playerWallet += betAmount; 
            console.log(`Player PUSH (tie). Wallet is now $${playerWallet}`);
        }
        // If message is "Dealer wins", player just loses the bet (which was already subtracted)
    }

    console.log(`New game started. Wallet is now $${playerWallet}`);
    
    // Send the game state (which might be over, or might be just beginning)
    res.json({
        message: currentGame.message,
        playerHand: currentGame.playerHand,
        dealerHand: currentGame.dealerHand,
        playerScore: currentGame.playerScore,
        isGameOver: currentGame.isGameOver,
        playerWallet: playerWallet 
    });
});

/**
 * POST /game/hit
 * Player draws a card.
 */
app.post('/game/hit', (req, res) => {
    if (!currentGame) {
        return res.status(400).json({ error: 'No game in progress.' });
    }

    // Use our game engine to perform the action
    currentGame.hit();
    console.log("Player HITS. New score:", currentGame.playerScore);
    
    // --- NEW: Auto-stand if player hits to 21 ---
    if (currentGame.playerScore === 21 && !currentGame.isGameOver) {
        console.log("Player hit 21! Automatically standing.");
        currentGame.stand(); // This will run the dealer's turn and determine the winner
    }
    // --- End of new code ---

    // Send the updated game state
    res.json({
        message: currentGame.message,
        playerHand: currentGame.playerHand,
        playerScore: currentGame.playerScore,
        isGameOver: currentGame.isGameOver,
        dealerHand: currentGame.dealerHand,
        playerWallet: playerWallet // Send the wallet (it didn't change)
    });
});
/**
 * POST /game/stand
 * Player stands, dealer plays, and payouts are calculated.
 */
app.post('/game/stand', (req, res) => {
    if (!currentGame) {
        return res.status(400).json({ error: 'No game in progress.' });
    }

    // Use our game engine to perform the action
    currentGame.stand(); // This determines the winner

    // Calculate Payout
    const betAmount = currentGame.betAmount;
    if (currentGame.message.includes('Player wins') && !currentGame.playerHasBlackjack) {
        playerWallet += (betAmount * 2); // Win: Get bet back + winnings
        console.log(`Player WINS $${betAmount}. Wallet is now $${playerWallet}`);
    } else if (currentGame.message.includes('tie (Push)')) {
        playerWallet += betAmount; // Tie: Get bet back
        console.log(`Player PUSH (tie). Wallet is now $${playerWallet}`);
    } else {
        // Player loses (or busts), bet was already subtracted.
        console.log(`Player LOSES $${betAmount}. Wallet is still $${playerWallet}`);
    }

    // Send the final game state
    res.json({
        message: currentGame.message,
        playerHand: currentGame.playerHand,
        dealerHand: currentGame.dealerHand,
        playerScore: currentGame.playerScore,
        dealerScore: currentGame.dealerScore,
        isGameOver: currentGame.isGameOver,
        playerWallet: playerWallet // Send the final wallet amount
    });
});

/**
 * POST /game/restart
 * Resets the player's wallet back to $100.
 */
app.post('/game/restart', (req, res) => {
    playerWallet = 100; // Reset wallet
    currentGame = null; // Clear any old game
    console.log("Wallet reset to $100");

    res.json({
        message: "Wallet reset to $100! Place a new bet.",
        playerWallet: playerWallet,
        isGameOver: true // This will ensure the bet controls are shown
    });
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Blackjack server is running and listening at http://localhost:${port}`);
    console.log("Ready to serve the game and receive commands!");
});