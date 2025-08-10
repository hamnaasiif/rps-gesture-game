const MoveDisplay = ({ playerMove, computerMove, getMoveIcon, getMoveName, gameState }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center max-w-4xl mx-auto">
      {/* Player Move */}
      <div className="coupon-box pixel-border-green">
        <div className="text-center">
          <div className="pixel-text-sm text-green-400 mb-4">PLAYER MOVE</div>

          <div className="mb-6 h-24 flex items-center justify-center">
            <div className="move-icon move-icon-rock">{playerMove ? getMoveIcon(playerMove) : "?"}</div>
          </div>

          <div className="pixel-border-green p-3">
            <div className="pixel-text-sm text-green-400">{getMoveName(playerMove)}</div>
          </div>
        </div>
      </div>

      {/* VS Orb */}
      <div className="flex justify-center order-last md:order-none">
        <div className="vs-orb">VS</div>
      </div>

      {/* AI Move */}
      <div className="coupon-box pixel-border-pink">
        <div className="text-center">
          <div className="pixel-text-sm text-pink-400 mb-4">AI MOVE</div>

          <div className="mb-6 h-24 flex items-center justify-center">
            <div className="move-icon move-icon-paper">{computerMove ? getMoveIcon(computerMove) : "?"}</div>
          </div>

          <div className="pixel-border-pink p-3">
            <div className="pixel-text-sm text-pink-400">{getMoveName(computerMove)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MoveDisplay
