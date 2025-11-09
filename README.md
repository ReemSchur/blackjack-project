# 🃏 Full-Stack Blackjack Game

[🎮 Click here for the Live Demo](https://your-live-demo-link)  
*(Note: The free Render service may take ~30 seconds to "wake up" on the first load.)*

---


## 🧩 Overview
This project is a complete, full-stack implementation of the game **Blackjack (21)**, built from scratch to demonstrate a deep understanding of modern web architecture.  
The application simulates a real Blackjack table, including a betting system, 3:2 Blackjack payouts, and separate sessions for each player.

The core challenge was to manage the game state and wallet persistently on the server, completely decoupled from the client-side logic.

---

## ✨ Features
- **Full Game Logic:** Implements all standard Blackjack rules (1:1 win, 3:2 Blackjack, Push, Bust, Auto-stand on 21).
- **Persistent Wallet:** Player bankroll is saved in a SQLite database, persisting between sessions.
- **Multi-Session Management:** Separate game and wallet for each connected client using a unique `sessionId`.
- **RESTful API:** Clear endpoints for `/game/new`, `/game/hit`, `/game/stand`, and session management.
- **Dynamic UI:** Clean UI with vanilla JS, CSS animations, and dynamic card images.

---

## 🏗️ System Architecture & Components

### 1. Client (Front-End)
- SPA built with **HTML**, **CSS**, and **vanilla JavaScript (ES6+)**.
- Renders UI and captures user input.
- Uses **Fetch API** for async requests.
- Stores `sessionId` in `localStorage`.

### 2. Server (Back-End)
- **Node.js / Express.js** RESTful API.
- **Game Engine (`game-engine.js`)** — pure game logic (Card, Deck, Game classes).
- **Session Management:** Active sessions managed in-memory (Map) + persistent DB backup.
- **API Endpoints:** `/game/hit`, `/session/new`, `/game/stand`, etc.

### 3. Database (Persistence)
- **SQLite** via `better-sqlite3`.
- Stores `sessionId` and wallet balance.
- Persists data even after server restart.

---

## 🗂️ File Structure
```
blackjack-project/
├── .gitignore
├── blackjack.db
├── game-engine.js
├── package-lock.json
├── package.json
├── server.js
└── public/
├── app.js
├── index.html
└── style.css
```
---

## 🧰 Setup and Execution (Run Locally)

### Prerequisites
- Node.js (with npm)
- Git

### Running the Application
```bash
# Clone the repository
git clone https://github.com/ReemSchur/blackjack-project.git
cd blackjack-project

# Install dependencies
npm install

# Start the server
node server.js

Then open your browser at:
http://localhost:3000
```
---

## 🧱 Tech Stack
Back-End: Node.js, Express.js
Database: SQLite (better-sqlite3)
Front-End: JavaScript (ES6+), HTML5, CSS3
Environment: Git, Render (Deployment)

