🃏 Full-Stack Blackjack Game

This is a complete, full-stack implementation of the game Blackjack (21), built from scratch with a modern client-server architecture.

Click here for the Live Demo
(Note: The free Render service may take ~30 seconds to "wake up" on the first load.)

(To add a screenshot: Take a picture of the game, add it to this folder as screenshot.png, and it will appear here.)

🚀 About This Project

This project was built to demonstrate a deep understanding of full-stack development principles, from creating a RESTful API in Node.js to managing client-side state with vanilla JavaScript. The application simulates a real Blackjack table, including a betting system, 3:2 Blackjack payouts, and separate sessions for each player.

The core challenge was to manage the game state and wallet persistently on the server, completely decoupled from the client-side logic.

✨ Key Features

Full-Stack Architecture: Complete separation between the logical Back-End ("The Dealer") and the visual Front-End ("The Table").

Persistent Database: Player wallet balances are saved in a SQLite database, allowing players to return later and continue with their saved bankroll.

Multi-Session Management: The server manages a separate game and wallet for each connected client using a unique sessionId stored in localStorage.

RESTful API: A clear API for all game actions (/game/new, /game/hit, /game/stand) and session management.

Complete Game Logic: Implements all standard Blackjack rules:

1:1 payout for a regular win.

Special 3:2 payout for a natural "Blackjack".

Push (tie).

Bust.

Automatic stand on 21.

Dynamic Front-End: A clean UI built with vanilla JavaScript, CSS animations, and dynamic card images.

🛠️ Tech Stack

Back-End

Node.js

Express.js (for the RESTful API)

better-sqlite3 (for SQLite database management)

CORS (for cross-origin requests)

Front-End

JavaScript (ES6+)

Fetch API (for async server communication)

localStorage (for session persistence)

HTML5

CSS3 (including keyframes animations)

Deployment

Render (for the Web Service)

🚀 How To Run Locally

Clone the repository:

git clone [https://github.com/ReemSchur/blackjack-project.git](https://github.com/ReemSchur/blackjack-project.git)
cd blackjack-project


Install the dependencies:

npm install


Start the server:

node server.js


Open your browser and navigate to:
http://localhost:3000

Built as a guided project with Gemini.
