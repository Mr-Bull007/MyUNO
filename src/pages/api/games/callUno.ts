import db from "db"

export default async function callUno(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { gameId, userId } = req.body

    if (!gameId) {
      return res.status(400).json({ error: "gameId required" })
    }

    const game = await db.gameSession.findUnique({
      where: { id: gameId },
      include: { players: true },
    })

    if (!game) {
      return res.status(404).json({ error: "Game not found" })
    }

    // Find the player
    const playerIndex = game.players.findIndex((p) => p.userId === userId)
    if (playerIndex === -1) {
      return res.status(403).json({ error: "Not in this game" })
    }

    const currentPlayer = game.players[playerIndex]
    if (!currentPlayer) {
      return res.status(403).json({ error: "Not in this game" })
    }

    const hand = JSON.parse(currentPlayer.hand)
    if (hand.length !== 1) {
      return res.status(400).json({ error: "Can only call UNO with 1 card" })
    }

    return res.status(200).json({
      success: true,
      message: "UNO called!",
    })
  } catch (error) {
    console.error("Error calling UNO:", error)
    return res.status(500).json({ error: "Failed to call UNO" })
  }
}
