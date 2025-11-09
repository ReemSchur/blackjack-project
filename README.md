🃏 Full-Stack Blackjack Game

Click here for the Live Demo
(Note: The free Render service may take ~30 seconds to "wake up" on the first load.)

(To add a screenshot: Take a picture of the game, add it to this folder as screenshot.png, and it will appear here.)

Overview

This project is a complete, full-stack implementation of the game Blackjack (21), built from scratch to demonstrate a deep understanding of modern web architecture. The application simulates a real Blackjack table, including a betting system, 3:2 Blackjack payouts, and separate sessions for each player.

The core challenge was to manage the game state and wallet persistently on the server, completely decoupled from the client-side logic.

Features

Full Game Logic: Implements all standard Blackjack rules (1:1 win, 3:2 Blackjack, Push, Bust, Auto-stand on 21).

Persistent Wallet: Player bankroll is saved in a SQLite database, persisting between sessions.

Multi-Session Management: The server manages a separate game and wallet for each connected client using a unique sessionId.

RESTful API: A clear API for all game actions (/game/new, /game/hit, /game/stand) and session management.

Dynamic UI: A clean UI built with vanilla JavaScript, CSS animations, and dynamic card images.

System Architecture & Components

The project is built on a decoupled client-server architecture.

1. Client (Front-End)

A static "single-page application" (SPA) built with HTML, CSS, and vanilla JavaScript (ES6+).

Responsible only for rendering the UI and capturing user input.

Uses the Fetch API to send asynchronous requests to the back-end.

Uses localStorage to store the unique sessionId and re-identify the client on page load.

2. Server (Back-End)

A Node.js / Express.js server that exposes a stateless RESTful API.

Game Engine (game-engine.js): A separate module containing all the pure game logic (Card, Deck, Game classes).

Session Management: Manages all active games and wallet balances in-memory (Map) for speed, backed by a persistent database.

API Endpoints: Handles all logic for game actions (/game/hit), session creation (/session/new), and payout calculations.

3. Database (Persistence)

An SQLite database (via better-sqlite3) is used as a persistent storage layer.

The database stores only the sessionId and the corresponding walletAmount, ensuring that a player's bankroll is saved even if the server restarts.

File Structure

blackjack-project/
├── .gitignore
├── blackjack.db        # SQLite database file (persistent wallet storage)
├── game-engine.js      # Core Blackjack logic (Card, Deck, Game classes)
├── package-lock.json
├── package.json        # Project dependencies and scripts
├── server.js           # The Node.js/Express back-end server (API)
└── public/
    ├── app.js          # Client-side JavaScript (Fetch API, DOM manipulation)
    ├── index.html      # The main HTML structure
    └── style.css       # All CSS styling and animations


Setup and Execution (How To Run Locally)

Instructions for running the project on a local machine.

Prerequisites

Node.js (which includes npm)

Git

Running the Application

Clone the repository:

git clone [https://github.com/ReemSchur/blackjack-project.git](https://github.com/ReemSchur/blackjack-project.git)
cd blackjack-project


Install the dependencies:
This will install express, cors, and better-sqlite3.

npm install


Start the server:
This will launch the server and create the blackjack.db file.

node server.js


Open the application:
Open your browser and navigate to: http://localhost:3000

Tech Stack

Back-End: Node.js, Express.js

Database: SQLite (via better-sqlite3)

Front-End: JavaScript (ES6+), HTML5, CSS3

Environment: Git, Render (for Deployment)

Built as a guided project with Gemini.