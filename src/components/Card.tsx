import { Box, Tooltip } from "@mantine/core"
import { Card as UnoCard } from "../game-engine/utils"

interface CardProps {
  card: UnoCard
  onClick?: () => void
  isPlayable?: boolean
  selected?: boolean
  size?: "sm" | "md" | "lg"
}

const colorMap = {
  red: "#FF4444",
  yellow: "#FFDD00",
  green: "#44DD44",
  blue: "#4444FF",
  wild: "#333333",
}

const getCardContent = (card: UnoCard) => {
  if (card.type === "number") {
    return card.value
  }
  if (card.type === "skip") return "⏭️"
  if (card.type === "reverse") return "↩️"
  if (card.type === "draw2") return "+2"
  if (card.type === "wild") return "🌈"
  if (card.type === "wilddraw4") return "+4"
  return "?"
}

export function Card({
  card,
  onClick,
  isPlayable = true,
  selected = false,
  size = "md",
}: CardProps) {
  const sizes = {
    sm: { width: 60, height: 90, fontSize: 16 },
    md: { width: 80, height: 120, fontSize: 24 },
    lg: { width: 100, height: 150, fontSize: 32 },
  }

  const dim = sizes[size]
  const bgColor = colorMap[card.color]
  const textColor = ["yellow", "wild"].includes(card.color) ? "#000" : "#fff"

  return (
    <Tooltip label={`${card.color} ${card.type}`} disabled={size === "sm"}>
      <Box
        onClick={onClick}
        style={{
          width: dim.width,
          height: dim.height,
          background: bgColor,
          border: selected ? "3px solid #FFD700" : "2px solid rgba(0,0,0,0.2)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: dim.fontSize,
          fontWeight: "bold",
          color: textColor,
          cursor: isPlayable ? "pointer" : "default",
          opacity: isPlayable ? 1 : 0.5,
          transition: "transform 0.2s, box-shadow 0.2s",
          boxShadow: selected ? "0 0 10px rgba(255,215,0,0.5)" : "none",
          "&:hover": isPlayable
            ? {
                transform: "scale(1.05)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }
            : {},
        }}
      >
        {getCardContent(card)}
      </Box>
    </Tooltip>
  )
}
