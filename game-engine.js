// Represents a single playing card
class Card {
    constructor(suit, rank) {
        this.suit = suit; // e.g. 'Spades', 'Hearts', 'Diamonds', 'Clubs'
        this.rank = rank; // e.g. 'A', '2', '3', ..., '10', 'J', 'Q', 'K'
        
        // --- THIS IS THE CRITICAL LINE ---
        // Create the image code for this card (e.g., "AS", "KH", "0D" for 10)
        this.code = this.getCardCode();
    }

    /**
     * Gets the numerical value of the card for Blackjack.
     */
    getValue() {
        if (this.rank === 'J' || this.rank === 'Q' || this.rank === 'K') {
            return 10;
        }
        if (this.rank === 'A') {
            return 11; // 1-or-11 logic is handled in calculateScore
        }
        return parseInt(this.rank); // '2' becomes 2
    }

    /**
     * Returns a nice string representation of the card for logging.
     */
    toString() {
        const suitSymbols = {
            'Spades': '♠️',
            'Hearts': '♥️',
            'Diamonds': '♦️',
            'Clubs': '♣️'
        };
        return `${this.rank} of ${this.suit} ${suitSymbols[this.suit]}`;
    }

    /**
     * Generates the card code used for the image API.
     * e.g., "A", "Spades" -> "AS"
     * e.g., "10", "Hearts" -> "0H"
     */
    getCardCode() {
        // Map ranks
        let rankCode = this.rank;
        if (this.rank === '10') rankCode = '0';
        // Standardize ranks for the API (J, Q, K, A)
        if (this.rank === 'J') rankCode = 'J';
        if (this.rank === 'Q') rankCode = 'Q';
        if (this.rank === 'K') rankCode = 'K';
        if (this.rank === 'A') rankCode = 'A';
        
        // Map suits
        let suitCode = this.suit[0]; // 'Spades' -> 'S', 'Hearts' -> 'H', etc.

        return `${rankCode}${suitCode}`;
    }
}

// Represents a 52-card deck
class Deck {
    constructor() {
        this.cards = []; 
        this.createDeck();
        this.shuffle();
    }

    createDeck() {
        const suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
        // Use standard Ranks
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        for (let suit of suits) {
            for (let rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        return this.cards.pop();
    }
}

// Represents the logic and state of a single Blackjack game
class Game {
    constructor() {
        this.deck = new Deck(); 
        this.playerHand = [];   
        this.dealerHand = [];   

        this.playerScore = 0;
        this.dealerScore = 0;
        this.isGameOver = false;
        this.message = ""; 
        this.betAmount = 0; // Store the bet

        this.playerHasBlackjack = false;
        this.dealerHasBlackjack = false;
    }

    calculateScore(hand) {
        let score = 0;
        let aceCount = 0;

        for (let card of hand) {
            // Fix for potential getValue issue
            const cardValue = card.getValue();
            if (cardValue) {
                score += cardValue;
                if (card.rank === 'A') {
                    aceCount++;
                }
            } else {
                console.error("Invalid card in hand:", card);
            }
        }

        while (score > 21 && aceCount > 0) {
            score -= 10; 
            aceCount--;
        }

        return score;
    }

    /**
     * Deals the initial two cards and CHECKS FOR BLACKJACK.
     */
    startGame() {
        this.playerHand.push(this.deck.deal());
        this.playerHand.push(this.deck.deal());
        this.playerScore = this.calculateScore(this.playerHand);

        this.dealerHand.push(this.deck.deal());
        this.dealerHand.push(this.deck.deal());
        this.dealerScore = this.calculateScore(this.dealerHand);

        // Check for immediate Blackjack
        if (this.playerScore === 21 && this.playerHand.length === 2) {
            this.playerHasBlackjack = true;
        }
        if (this.dealerScore === 21 && this.dealerHand.length === 2) {
            this.dealerHasBlackjack = true;
        }

        // Determine instant winner
        if (this.playerHasBlackjack) {
            if (this.dealerHasBlackjack) {
                this.isGameOver = true;
                this.message = "Push! Both player and dealer have Blackjack.";
            } else {
                this.isGameOver = true;
                this.message = "Blackjack! Player wins!";
            }
        } else if (this.dealerHasBlackjack) {
            this.isGameOver = true;
            this.message = "Dealer has Blackjack. Dealer wins.";
        } else {
            // No Blackjack, game continues
            this.message = "Welcome to Reem's Blackjack!";
        }
    }

    /**
     * Player requests another card.
     */
    hit() {
        if (this.isGameOver) {
            return;
        }

        this.playerHand.push(this.deck.deal());
        this.playerScore = this.calculateScore(this.playerHand);

        // Check if player busted
        if (this.playerScore > 21) {
            this.isGameOver = true;
            this.message = `Player busts with ${this.playerScore}! Dealer wins.`;
        }
    }

    /**
     * Player stands. Now it's the dealer's turn.
     */
    stand() {
        if (this.isGameOver) {
            return;
        }

        // Dealer's turn logic: Dealer must hit while their score is less than 17
        while (this.dealerScore < 17) {
            this.dealerHand.push(this.deck.deal());
            this.dealerScore = this.calculateScore(this.dealerHand);
        }

        this.isGameOver = true;
        this.determineWinner();
    }

    determineWinner() {
        // Player bust was already handled in hit()
        if (this.playerScore > 21) {
            this.message = `Player busts with ${this.playerScore}! Dealer wins.`;
            return;
        }
        
        if (this.dealerScore > 21) {
            this.message = `Dealer busts with ${this.dealerScore}! Player wins.`;
            return;
        }
        
        if (this.playerScore > this.dealerScore) {
            this.message = `Player wins with ${this.playerScore} against ${this.dealerScore}.`;
        } else if (this.playerScore < this.dealerScore) {
            this.message = `Dealer wins with ${this.dealerScore} against ${this.playerScore}.`;
        } else {
            this.message = `It's a tie (Push) with ${this.playerScore}.`;
        }
    }
}

// Export the classes so other files (like our server) can use them
module.exports = {
    Game,
    Deck,
    Card
};