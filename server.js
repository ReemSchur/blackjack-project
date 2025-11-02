// 1. Import Express (the 'kit')
const express = require('express');

// --- NEW ---
// 1b. Import CORS (Cross-Origin Resource Sharing)
const cors = require('cors');

// 2. Import our *own* Game logic
const { Game } = require('./game-engine.js');

// 3. Create our server application
const app = express();
const port = 3000;

// 4. --- NEW --- Enable CORS for all requests
// This allows our front-end (running on the same origin) to talk to this server.
app.use(cors());

// 5. This is middleware - it tells Express to automatically parse JSON request bodies
app.use(express.json());

// 6. --- NEW --- Serve static files
// This tells Express to serve any files it finds in the 'public' folder.
// This is how our index.html and app.js will be loaded by the browser.
app.use(express.static('public'));


// 7. This will store the *one* game our server is managing
let currentGame = null;


// --- API Endpoints (Our "Game Commands") ---
// (These are exactly the same as yesterday)

/**
 * POST /game/new
 * Starts a new game.
 */
app.post('/game/new', (req, res) => {
    currentGame = new Game();
    currentGame.startGame();
    console.log("New game started!");
    
    res.json({
        message: currentGame.message,
        playerHand: currentGame.playerHand,
        dealerHand: currentGame.dealerHand,
        playerScore: currentGame.playerScore,
        isGameOver: currentGame.isGameOver
    });
});

/**
 * POST /game/hit
 * Player draws a card.
 */
app.post('/game/hit', (req, res) => {
    if (!currentGame) {
        return res.status(400).json({ error: 'No game in progress. Start a new game first.' });
    }

    currentGame.hit();
    console.log("Player HITS. New score:", currentGame.playerScore);

    res.json({
        message: currentGame.message,
        playerHand: currentGame.playerHand,
        playerScore: currentGame.playerScore,
        isGameOver: currentGame.isGameOver
    });
});

/**
 * POST /game/stand
 * Player stands, dealer plays.
 */
app.post('/game/stand', (req, res) => {
    if (!currentGame) {
        return res.status(400).json({ error: 'No game in progress. Start a new game first.' });
    }

    currentGame.stand();
    console.log("Player STANDS. Final result:", currentGame.message);

    res.json({
        message: currentGame.message,
        playerHand: currentGame.playerHand,
        dealerHand: currentGame.dealerHand,
        playerScore: currentGame.playerScore,
        dealerScore: currentGame.dealerScore,
        isGameOver: currentGame.isGameOver
    });
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Blackjack server is running and listening at http://localhost:${port}`);
    console.log("Ready to serve the game and receive commands!");
});