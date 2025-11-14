// app/game-engine/uno-logic.ts

// Initialize a fresh deck with 108 cards
import { Card, CardColor, CardType, GameState, PlayerState } from "./utils"

export function initializeDeck(): Card[] {
  const deck: Card[] = []
  let cardId = 0
  const colors: CardColor[] = ["red", "yellow", "green", "blue"]

  // Number cards (0-9): 4 colors × 10 values × 2 of each = 80 cards
  colors.forEach((color) => {
    for (let num = 0; num <= 9; num++) {
      // Add two of each number (except 0, which appears once per color)
      const count = num === 0 ? 1 : 2
      for (let i = 0; i < count; i++) {
        deck.push({
          id: `card_${cardId++}`,
          color,
          type: "number",
          value: num,
        })
      }
    }
  })

  // Action cards (Skip, Reverse, Draw 2): 4 colors × 3 types × 2 of each = 24 cards
  const actionTypes: CardType[] = ["skip", "reverse", "draw2"]
  colors.forEach((color) => {
    actionTypes.forEach((actionType) => {
      for (let i = 0; i < 2; i++) {
        deck.push({
          id: `card_${cardId++}`,
          color,
          type: actionType,
        })
      }
    })
  })

  // Wild cards: 4 cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `card_${cardId++}`,
      color: "wild",
      type: "wild",
    })
  }

  // Wild Draw 4 cards: 4 cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `card_${cardId++}`,
      color: "wild",
      type: "wilddraw4",
    })
  }

  return deck
}

// Shuffle array (Fisher-Yates)
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  if (shuffled.length === 0) {
    throw new Error("Deck is empty")
  } else {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = shuffled[i]!
      shuffled[i] = shuffled[j]!
      shuffled[j] = temp
    }
  }
  return shuffled
}

// Initialize game state
export function initializeGame(player1Id: string, player2Id: string): GameState {
  let deck = initializeDeck()
  deck = shuffleDeck(deck)

  const players: PlayerState[] = [
    { id: player1Id, hand: [], hasCalledUno: false },
    { id: player2Id, hand: [], hasCalledUno: false },
  ]

  // Deal 7 cards to each player
  players.forEach((player) => {
    for (let i = 0; i < 7; i++) {
      player.hand.push(deck.pop()!)
    }
  })

  // Draw a starting card for the discard pile
  let startCard = deck.pop()!
  while (startCard.type !== "number") {
    // Ensure start card is a number card (no action cards)
    deck.push(startCard)
    deck = shuffleDeck(deck)
    startCard = deck.pop()!
  }

  return {
    deck,
    discardPile: [startCard],
    players,
    currentPlayerIndex: 0,
    direction: 1,
    drawCount: 0,
    gameStatus: "active",
    currentColor: startCard.color,
    currentNumber: startCard.value,
  }
}

// Check if a card can be played
export function canPlayCard(card: Card, currentColor?: CardColor, currentNumber?: number): boolean {
  if (card.type === "wild" || card.type === "wilddraw4") {
    return true // Wild cards always playable
  }

  // Must match color or number
  return card.color === currentColor || card.value === currentNumber
}

// Get valid cards from hand
export function getValidCards(
  hand: Card[],
  currentColor?: CardColor,
  currentNumber?: number
): Card[] {
  return hand.filter((card) => canPlayCard(card, currentColor, currentNumber))
}

// Play a card
export function playCard(
  state: GameState,
  cardId: string,
  chosenColor?: CardColor // For wild cards
): GameState {
  const newState = { ...state }
  const currentPlayer = newState.players[newState.currentPlayerIndex]
  if (!currentPlayer) throw new Error("Current player not found")

  // Find and remove card from hand
  const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId)
  if (cardIndex === -1) throw new Error("Card not found in hand")

  const card = currentPlayer.hand.splice(cardIndex, 1)[0]
  if (!card) throw new Error("Card not found in hand")

  // Add to discard pile
  newState.discardPile.push(card)

  // Update current color/number
  if (card.type === "wild" || card.type === "wilddraw4") {
    newState.currentColor = chosenColor
    newState.currentNumber = undefined
  } else {
    newState.currentColor = card.color
    newState.currentNumber = card.value
  }

  // Check for UNO (1 card left)
  if (currentPlayer.hand.length === 1) {
    currentPlayer.hasCalledUno = true
  } else if (currentPlayer.hand.length === 0) {
    // Win condition
    newState.gameStatus = "finished"
    newState.winner = newState.currentPlayerIndex
  }

  // Handle action cards
  if (card.type === "skip") {
    newState.currentPlayerIndex = getNextPlayerIndex(newState)
  } else if (card.type === "reverse") {
    newState.direction = (newState.direction * -1) as 1 | -1
  } else if (card.type === "draw2") {
    newState.drawCount += 2
  } else if (card.type === "wilddraw4") {
    newState.drawCount += 4
  }

  // Move to next player (if not already moved by Skip)
  if (card.type !== "skip") {
    newState.currentPlayerIndex = getNextPlayerIndex(newState)
  }

  return newState
}

// Draw cards
export function drawCards(state: GameState, count: number = 1): GameState {
  const newState = { ...state }
  const currentPlayer = newState.players[newState.currentPlayerIndex]
  if (!currentPlayer) throw new Error("Current player not found")

  for (let i = 0; i < count; i++) {
    // Reshuffle if deck is empty
    if (newState.deck.length === 0) {
      if (newState.discardPile.length <= 1) {
        throw new Error("Not enough cards in deck and discard pile")
      }
      const lastCard = newState.discardPile.pop()!
      newState.deck = shuffleDeck(newState.discardPile)
      newState.discardPile = [lastCard]
    }

    currentPlayer.hand.push(newState.deck.pop()!)
  }

  newState.drawCount = 0
  newState.currentPlayerIndex = getNextPlayerIndex(newState)

  return newState
}

// Get next player index (respects direction)
export function getNextPlayerIndex(state: GameState): number {
  const nextIndex =
    (state.currentPlayerIndex + state.direction + state.players.length) % state.players.length
  return nextIndex
}

// Call UNO (player declares they have 1 card)
export function callUno(state: GameState): GameState {
  const newState = { ...state }
  const currentPlayer = newState.players[newState.currentPlayerIndex]
  if (!currentPlayer) throw new Error("Current player not found")
  currentPlayer.hasCalledUno = true
  return newState
}

// Check if player forgot to call UNO (has 1 card but didn't call)
export function checkMissedUno(state: GameState): boolean {
  const currentPlayer = state.players[state.currentPlayerIndex]
  if (!currentPlayer) return false
  return currentPlayer.hand.length === 1 && !currentPlayer.hasCalledUno
}

// Serialize game state to JSON for database storage
export function serializeGameState(state: GameState): string {
  return JSON.stringify(state)
}

// Deserialize game state from database
export function deserializeGameState(json: string): GameState {
  return JSON.parse(json)
}
