export type CardColor = "red" | "yellow" | "green" | "blue" | "wild"
export type CardType = "number" | "skip" | "reverse" | "draw2" | "wild" | "wilddraw4"

export interface Card {
  id: string
  color: CardColor
  type: CardType
  value?: number // 0-9 for number cards
}

export interface GameState {
  deck: Card[]
  discardPile: Card[]
  players: PlayerState[]
  currentPlayerIndex: number
  direction: 1 | -1 // 1 = clockwise, -1 = counter-clockwise
  drawCount: number
  gameStatus: "active" | "finished"
  winner?: number
  currentColor?: CardColor
  currentNumber?: number
}

export interface PlayerState {
  id: string
  hand: Card[]
  hasCalledUno: boolean
}
