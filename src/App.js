"use client"

import React from "react"
import { useState, useCallback, useRef } from "react"
import WebcamFeed from "./components/WebcamFeed"
import GameResult from "./components/GameResult"
import MoveDisplay from "./components/MoveDisplay"
import { Play, RotateCcw } from "lucide-react"

const FloatingPixelIcons = () => {
  const icons = [
    { symbol: "▲", x: 5, y: 15, delay: 0 },
    { symbol: "●", x: 15, y: 25, delay: 1 },
    { symbol: "◆", x: 85, y: 20, delay: 2 },
    { symbol: "■", x: 90, y: 35, delay: 0.5 },
    { symbol: "▼", x: 10, y: 60, delay: 1.5 },
    { symbol: "◇", x: 88, y: 65, delay: 2.5 },
    { symbol: "▪", x: 7, y: 80, delay: 3 },
    { symbol: "▫", x: 92, y: 75, delay: 1.8 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((icon, index) => (
        <div
          key={index}
          className="pixel-icon"
          style={{
            left: `${icon.x}%`,
            top: `${icon.y}%`,
            animationDelay: `${icon.delay}s`,
            opacity: 0.3,
          }}
        >
          {icon.symbol}
        </div>
      ))}
    </div>
  )
}

function App() {
  const [playerMove, setPlayerMove] = useState(null)
  const [computerMove, setComputerMove] = useState(null)
  const [gameResult, setGameResult] = useState(null)
  const [gameState, setGameState] = useState("idle")
  const [countdown, setCountdown] = useState(0)
  const [score, setScore] = useState({ player: 0, computer: 0, ties: 0 })
  const timeoutRef = useRef(null)
  const countdownIntervalRef = useRef(null)

  const moves = ["rock", "paper", "scissors"]

  const getMoveIcon = (move) => {
    switch (move) {
      case "rock":
        return "✊"
      case "paper":
        return "✋"
      case "scissors":
        return "✌"
      default:
        return "?"
    }
  }

  const getMoveName = (move) => {
    switch (move) {
      case "rock":
        return "ROCK"
      case "paper":
        return "PAPER"
      case "scissors":
        return "SCISSORS"
      default:
        return "WAITING..."
    }
  }

  const getRandomComputerMove = () => {
    const randomIndex = Math.floor(Math.random() * moves.length)
    return moves[randomIndex]
  }

  const determineWinner = (player, computer) => {
    if (!player || !computer) return null
    if (player === computer) return "tie"
    if (
      (player === "rock" && computer === "scissors") ||
      (player === "paper" && computer === "rock") ||
      (player === "scissors" && computer === "paper")
    ) {
      return "win"
    }
    return "lose"
  }

  const handleGestureDetected = useCallback(
    (detectedGesture) => {
      if (gameState === "capture") {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }

        if (!detectedGesture) {
          setPlayerMove(null)
          setComputerMove(getRandomComputerMove())
          setGameResult("timeout")
          setGameState("result")
          return
        }

        setPlayerMove(detectedGesture)
        const randomComputerMove = getRandomComputerMove()
        setComputerMove(randomComputerMove)

        const result = determineWinner(detectedGesture, randomComputerMove)
        setGameResult(result)

        setScore((prev) => ({
          ...prev,
          player: result === "win" ? prev.player + 1 : prev.player,
          computer: result === "lose" ? prev.computer + 1 : prev.computer,
          ties: result === "tie" ? prev.ties + 1 : prev.ties,
        }))

        setTimeout(() => {
          setGameState("result")
        }, 1000)
      }
    },
    [gameState],
  )

  const startCountdown = () => {
    setGameState("countdown")
    setPlayerMove(null)
    setComputerMove(null)
    setGameResult(null)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    let count = 3
    setCountdown(count)

    countdownIntervalRef.current = setInterval(() => {
      count--
      if (count > 0) {
        setCountdown(count)
      } else if (count === 0) {
        setCountdown("GO!")
        setGameState("capture")
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null

        timeoutRef.current = setTimeout(() => {
          if (gameState === "capture") {
            handleGestureDetected(null)
          }
        }, 6000)
      }
    }, 1000)
  }

  const handleStartGame = () => {
    startCountdown()
  }

  const handleReset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    setPlayerMove(null)
    setComputerMove(null)
    setGameResult(null)
    setScore({ player: 0, computer: 0, ties: 0 })
    setGameState("idle")
    setCountdown(0)
  }

  const handlePlayAgain = () => {
    startCountdown()
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  const totalGames = score.player + score.computer + score.ties
  const winRate = totalGames > 0 ? Math.round((score.player / totalGames) * 100) : 0

  return (
    <div className="min-h-screen bg-black relative">
      {/* Floating Pixel Icons */}
      <FloatingPixelIcons />

      <div className="game-container relative z-10">
        {/* Hero Section */}
        <div className="scan-line" style={{ top: "20px" }}></div>
        <header className="text-center mb-12 relative">
          {/* Main Title */}
          <h1 className="pixel-title mb-6">ROCK PAPER SCISSORS</h1>

          {/* Subtitle */}
          <p className="pixel-text-sm text-gray-400 mb-8 max-w-2xl mx-auto">
            CLASSIC ARCADE GAME WITH AI GESTURE RECOGNITION
          </p>

          {/* Status Indicator */}
          <div className="flex justify-center mb-8">
            <div className="pixel-btn-green flex items-center gap-4 cursor-default">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              AI VISION SYSTEM ONLINE
            </div>
          </div>
        </header>

        {/* Game Stats Section */}
        <section className="mb-12">
          <div className="static-grid static-grid-4 gap-6">
            {/* Player Wins */}
            <div className="coupon-box pixel-border-green text-center">
              <div className="pixel-text-sm text-green-400 mb-2">WINS</div>
              <div className="digital-number">{score.player}</div>
              <div className="pixel-text-sm text-gray-400 mt-2">PLAYER</div>
            </div>

            {/* Draws */}
            <div className="coupon-box pixel-border text-center">
              <div className="pixel-text-sm text-white mb-2">DRAWS</div>
              <div className="digital-number" style={{ color: "#FFFFFF", borderColor: "#FFFFFF" }}>
                {score.ties}
              </div>
              <div className="pixel-text-sm text-gray-400 mt-2">EQUAL</div>
            </div>

            {/* AI Wins */}
            <div className="coupon-box pixel-border-pink text-center">
              <div className="pixel-text-sm text-pink-400 mb-2">WINS</div>
              <div className="digital-number" style={{ color: "#FF2AAE", borderColor: "#FF2AAE" }}>
                {score.computer}
              </div>
              <div className="pixel-text-sm text-gray-400 mt-2">AI</div>
            </div>

            {/* Win Rate */}
            <div className="coupon-box pixel-border text-center">
              <div className="pixel-text-sm text-white mb-2">WIN RATE</div>
              <div className="digital-number" style={{ color: "#FFFFFF", borderColor: "#FFFFFF" }}>
                {winRate}%
              </div>
              <div className="pixel-text-sm text-gray-400 mt-2">SUCCESS</div>
            </div>
          </div>
        </section>

        <div className="scan-line mb-8" style={{ position: "relative" }}></div>
        {/* Main Game Area */}
        <div className="static-grid gap-8 mb-12">
          {/* Camera Feed with Controls */}
          <div className="col-span-full space-y-6">
            <WebcamFeed gameState={gameState} countdown={countdown} onGestureDetected={handleGestureDetected} />

            {/* Control Panel  */}
            <div className="coupon-box pixel-border text-center max-w-3xl mx-auto">
              <div className="flex flex-wrap justify-center gap-4">
                {gameState === "idle" && (
                  <button onClick={handleStartGame} className="pixel-btn pixel-btn-green flex items-center">
                    <Play className="w-4 h-4 mr-2" />
                    START GAME
                  </button>
                )}
                {gameState === "result" && (
                  <>
                    <button onClick={handlePlayAgain} className="pixel-btn pixel-btn-green">
                      PLAY AGAIN
                    </button>
                    <button onClick={handleReset} className="pixel-btn pixel-btn-pink">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      RESET SCORE
                    </button>
                  </>
                )}

                {(gameState === "countdown" || gameState === "capture") && (
                  <div className="pixel-btn pixel-border-green">GAME ACTIVE</div>
                )}
              </div>
            </div>
          </div>

          {/* Game Panel */}
          <div className="col-span-full">
            <MoveDisplay
              playerMove={playerMove}
              computerMove={computerMove}
              getMoveIcon={getMoveIcon}
              getMoveName={getMoveName}
              gameState={gameState}
            />
          </div>

          {/* Game Result */}
          {gameResult && gameState === "result" && (
            <div className="col-span-full">
              <GameResult result={gameResult} />
            </div>
          )}
        </div>

        {/* How to Play Section */}
        <section>
          <div className="coupon-box pixel-border">
            <h3 className="pixel-text text-center mb-8 text-white">HOW TO PLAY</h3>

            <div className="static-grid gap-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="pixel-text-sm text-green-400 min-w-0">→</div>
                  <div>
                    <div className="pixel-text-sm text-green-400 mb-2">EVENT 01</div>
                    <div className="pixel-text-sm text-gray-300">CLICK START GAME TO BEGIN</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="pixel-text-sm text-green-400 min-w-0">→</div>
                  <div>
                    <div className="pixel-text-sm text-green-400 mb-2">EVENT 02</div>
                    <div className="pixel-text-sm text-gray-300">POSITION HAND IN CAMERA VIEW</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="pixel-text-sm text-green-400 min-w-0">→</div>
                  <div>
                    <div className="pixel-text-sm text-green-400 mb-2">EVENT 03</div>
                    <div className="pixel-text-sm text-gray-300">MAKE ROCK, PAPER, OR SCISSORS</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="pixel-text-sm text-green-400 min-w-0">→</div>
                  <div>
                    <div className="pixel-text-sm text-green-400 mb-2">EVENT 04</div>
                    <div className="pixel-text-sm text-gray-300">AI WILL MAKE ITS MOVE</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Bar */}
            <div className="mt-8 p-4 pixel-border-pink text-center relative overflow-hidden">
              <div
                className="scan-line"
                style={{ background: "linear-gradient(to right, transparent, #FF2AAE, transparent)" }}
              ></div>
              <div className="pixel-text-sm text-pink-400 glitch-hover">★ READY TO CHALLENGE THE AI? ★</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
