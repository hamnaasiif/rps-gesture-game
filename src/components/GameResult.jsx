const GameResult = ({ result }) => {
  const getResultConfig = () => {
    switch (result) {
      case "win":
        return {
          icon: "★",
          title: "PLAYER WINS!",
          message: "EXCELLENT MOVE!",
          borderClass: "pixel-border-green",
          textColor: "text-green-400",
        }
      case "lose":
        return {
          icon: "✗",
          title: "AI WINS!",
          message: "BETTER LUCK NEXT TIME!",
          borderClass: "pixel-border-pink",
          textColor: "text-pink-400",
        }
      case "tie":
        return {
          icon: "=",
          title: "IT'S A TIE!",
          message: "GREAT MINDS THINK ALIKE!",
          borderClass: "pixel-border",
          textColor: "text-white",
        }
      case "timeout":
        return {
          icon: "!",
          title: "TIME OUT!",
          message: "NO MOVE DETECTED!",
          borderClass: "pixel-border",
          textColor: "text-gray-400",
        }
      default:
        return {}
    }
  }

  const config = getResultConfig()

  return (
    <div className={`coupon-box ${config.borderClass} text-center relative`}>
      <div className="scan-line"></div>

      {/* Result Icon */}
      <div className="mb-6">
        <div className={`text-6xl ${config.textColor} pixel-text`}>{config.icon}</div>
      </div>

      {/* Result Title */}
      <h2 className={`pixel-text ${config.textColor} mb-4`}>{config.title}</h2>

      {/* Result Message */}
      <p className="pixel-text-sm text-gray-300 mb-6">{config.message}</p>

      {/* Decorative Elements */}
      <div className="flex justify-center items-center gap-4">
        <div className={`w-2 h-2 ${config.textColor.replace("text-", "bg-")} animate-pulse`}></div>
        <div className="pixel-text-sm text-gray-500">◆</div>
        <div className={`w-2 h-2 ${config.textColor.replace("text-", "bg-")} animate-pulse`}></div>
      </div>
    </div>
  )
}

export default GameResult
