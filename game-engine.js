// Represents a single playing card
class Card {
    constructor(suit, rank) {
        this.suit = suit; // e.g. 'Spades', 'Hearts', 'Diamonds', 'Clubs'
        this.rank = rank; // e.g. 'A', '2', '3', ..., '10', 'J', 'Q', 'K'
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
            return 11; // For now, Ace is always 11. We'll handle the 1-or-11 logic later.
        }
        return parseInt(this.rank); // '2' becomes 2, '3' becomes 3, etc.
    }

    /**
     * Returns a nice string representation of the card for logging.
     */
    toString() {
        // Example: "K of Spades ♠️"
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
        if (this.rank === 'Ace') rankCode = 'A'; // Just in case, though we use 'A'
        
        // Map suits
        let suitCode = this.suit[0]; // 'Spades' -> 'S', 'Hearts' -> 'H', etc.
        
        return `${rankCode}${suitCode}`;
    }
}



// Represents a 52-card deck
class Deck {
    constructor() {
        this.cards = []; // An array to hold all 52 cards
        this.createDeck();
        this.shuffle();
    }

    // Fills the deck with 52 standard cards
    createDeck() {
        const suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        for (let suit of suits) {
            for (let rank of ranks) {
                // Create a new Card object and add it to the deck
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    // Shuffles the deck using the Fisher-Yates algorithm
    shuffle() {
        // Loop from the last card down to the second
        for (let i = this.cards.length - 1; i > 0; i--) {
            // Pick a random index from 0 to i
            const j = Math.floor(Math.random() * (i + 1));
            // Swap the elements at indexes i and j
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    // Deals (removes and returns) one card from the top of the deck
    deal() {
        return this.cards.pop();
    }
}

// Represents the logic and state of a single Blackjack game
class Game {
    constructor() {
        this.deck = new Deck(); // The game's deck
        this.playerHand = [];   // The player's hand
        this.dealerHand = [];   // The dealer's hand

        // Game state
        this.playerScore = 0;
        this.dealerScore = 0;
        this.isGameOver = false;
        this.message = ""; // To store messages like "Player busts!"
        this.playerHasBlackjack = false;
        this.dealerHasBlackjack = false;
    }

    /**
     * Calculates the score of a given hand (array of Cards).
     * This is where we handle the Ace (1 or 11) logic.
     */
    calculateScore(hand) {
        let score = 0;
        let aceCount = 0;

        // First, sum all cards, treating Aces as 11
        for (let card of hand) {
            score += card.getValue();
            if (card.rank === 'A') {
                aceCount++;
            }
        }

        // Now, adjust for Aces if the score is over 21
        // Loop as long as the score is too high AND we still have Aces to adjust
        while (score > 21 && aceCount > 0) {
            score -= 10; // Change an Ace from 11 to 1
            aceCount--;
        }

        return score;
    }
    /**
     * Deals the initial two cards to player and dealer.
     */
    /**
 * Deals the initial two cards and CHECKS FOR BLACKJACK.
 */
startGame() {
    // Deal two cards to the player
    this.playerHand.push(this.deck.deal());
    this.playerHand.push(this.deck.deal());
    this.playerScore = this.calculateScore(this.playerHand);

    // Deal two cards to the dealer
    this.dealerHand.push(this.deck.deal());
    this.dealerHand.push(this.deck.deal());
    this.dealerScore = this.calculateScore(this.dealerHand);

    // --- NEW --- Check for immediate Blackjack
    // Check if player has 21 on 2 cards
    if (this.playerScore === 21 && this.playerHand.length === 2) {
        this.playerHasBlackjack = true;
    }
    // Check if dealer has 21 on 2 cards
    if (this.dealerScore === 21 && this.dealerHand.length === 2) {
        this.dealerHasBlackjack = true;
    }

    // --- NEW --- Determine instant winner
    if (this.playerHasBlackjack) {
        if (this.dealerHasBlackjack) {
            // Both have Blackjack -> Push
            this.isGameOver = true;
            this.message = "Push! Both player and dealer have Blackjack.";
        } else {
            // Only player has Blackjack -> Player wins
            this.isGameOver = true;
            this.message = "Blackjack! Player wins!";
        }
    } else if (this.dealerHasBlackjack) {
        // Only dealer has Blackjack -> Dealer wins
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
        // Can only hit if the game is not over
        if (this.isGameOver) {
            return;
        }

        // Deal one card to the player
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
        // Can only stand if the game is not over
        if (this.isGameOver) {
            return;
        }

        // Dealer's turn logic: Dealer must hit while their score is less than 17
        while (this.dealerScore < 17) {
            this.dealerHand.push(this.deck.deal());
            this.dealerScore = this.calculateScore(this.dealerHand);
        }

        // Now that the dealer is done, determine the winner
        this.isGameOver = true;
        this.determineWinner();
    }

    /**
     * Compares player and dealer hands to determine the winner.
     */
    determineWinner() {
        if (this.playerScore > 21) {
            // Player already busted, this case was handled in hit()
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