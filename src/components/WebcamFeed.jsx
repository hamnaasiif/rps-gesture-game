"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Camera, CameraOff, Wifi } from "lucide-react"
import { Hands } from "@mediapipe/hands"
import { Camera as MediaPipeCamera } from "@mediapipe/camera_utils"
import * as tf from "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"

const drawConnectors = (ctx, landmarks, connections, { color = "#00FF80", lineWidth = 2 }) => {
  if (!landmarks || !connections) return
  for (const connection of connections) {
    const [startIdx, endIdx] = connection
    const start = landmarks[startIdx]
    const end = landmarks[endIdx]
    if (start && end) {
      ctx.beginPath()
      ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height)
      ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height)
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.stroke()
    }
  }
}

const drawLandmarks = (ctx, landmarks, { color = "#FF2AAE", radius = 4 }) => {
  if (!landmarks) return
  for (const landmark of landmarks) {
    ctx.beginPath()
    ctx.arc(landmark.x * ctx.canvas.width, landmark.y * ctx.canvas.height, radius, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
  }
}

// Hand connections for drawing
const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // Thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // Index
  [9, 10],
  [10, 11],
  [11, 12], // Middle
  [13, 14],
  [14, 15],
  [15, 16], // Ring
  [17, 18],
  [18, 19],
  [19, 20], // Pinky
  [0, 17],
  [5, 9],
  [9, 13],
  [13, 17], // Palm
]

// Global variables for gesture detection
let gesturePromiseResolve = null
let gestureTimeoutId = null

const WebcamFeed = ({ gameState, countdown, onGestureDetected }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handsRef = useRef(null)
  const cameraRef = useRef(null)
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [error, setError] = useState(null)
  const [currentGesture, setCurrentGesture] = useState(null)
  const [handsDetected, setHandsDetected] = useState(false)
  const [gestureConfidence, setGestureConfidence] = useState(0)

  // Finger tip IDs
  const tipIds = [4, 8, 12, 16, 20]

  // Gesture detection logic
  const detectGestureFromLandmarks = useCallback((lmList) => {
    try {
      if (!lmList || lmList.length === 0) {
        return { gesture: null, confidence: 0 }
      }

      const fingers = []

      // THUMB detection
      const thumbTip = lmList[4]
      const thumbIP = lmList[3]
      const thumbMCP = lmList[2]
      const thumbExtended = Math.abs(thumbTip.x - thumbIP.x) > 0.02 && Math.abs(thumbTip.x - thumbMCP.x) > 0.03
      fingers.push(thumbExtended ? 1 : 0)

      // OTHER FINGERS detection
      for (let id = 1; id < 5; id++) {
        const tipY = lmList[tipIds[id]].y
        const pipY = lmList[tipIds[id] - 2].y
        const mcpY = lmList[tipIds[id] - 3].y
        const fingerExtended = tipY < pipY - 0.03 && tipY < mcpY - 0.01
        fingers.push(fingerExtended ? 1 : 0)
      }

      const [thumb, index, middle, ring, pinky] = fingers
      const totalFingers = fingers.reduce((sum, finger) => sum + finger, 0)

      // Gesture classification
      let detectedGesture = null
      let confidence = 0

      if (totalFingers === 0) {
        detectedGesture = "rock"
        confidence = 0.95
      } else if (totalFingers === 1 && thumb === 1) {
        detectedGesture = "rock"
        confidence = 0.8
      } else if (index === 1 && middle === 1 && ring === 0 && pinky === 0) {
        detectedGesture = "scissors"
        confidence = thumb === 0 ? 0.95 : 0.85
      } else if (totalFingers >= 4) {
        detectedGesture = "paper"
        confidence = totalFingers === 5 ? 0.95 : 0.85
      } else if (totalFingers === 3 && index === 1 && middle === 1 && ring === 1) {
        detectedGesture = "paper"
        confidence = 0.75
      } else if (totalFingers === 2) {
        if (index === 1 && middle === 1) {
          detectedGesture = "scissors"
          confidence = 0.8
        } else if (index === 1 && pinky === 1) {
          detectedGesture = "scissors"
          confidence = 0.7
        }
      }

      setGestureConfidence(confidence)
      return { gesture: detectedGesture, confidence }
    } catch (error) {
      return { gesture: null, confidence: 0 }
    }
  }, [])

  // Clean gesture detection method
  const detectGesture = useCallback(async () => {
    if (!videoRef.current) {
      return "timeout"
    }

    return new Promise((resolve) => {
      if (gestureTimeoutId) {
        clearTimeout(gestureTimeoutId)
        gestureTimeoutId = null
      }

      gesturePromiseResolve = resolve

      gestureTimeoutId = setTimeout(() => {
        if (gesturePromiseResolve) {
          gesturePromiseResolve("timeout")
          gesturePromiseResolve = null
          gestureTimeoutId = null
        }
      }, 5000)
    })
  }, [])

  const onResults = useCallback(
    (results) => {
      const canvasElement = canvasRef.current
      if (!canvasElement) return

      const canvasCtx = canvasElement.getContext("2d")

      canvasCtx.save()
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height)

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setHandsDetected(true)

        const landmarks = results.multiHandLandmarks[0]

        // Draw hand landmarks with pixel-art styling
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: "#00FF80", lineWidth: 2 })
        drawLandmarks(canvasCtx, landmarks, { color: "#FF2AAE", radius: 3 })

        const lmList = landmarks.map((landmark, id) => ({
          id: id,
          x: landmark.x,
          y: landmark.y,
          cx: Math.floor(landmark.x * canvasElement.width),
          cy: Math.floor(landmark.y * canvasElement.height),
        }))

        // Gesture detection logic
        if (gesturePromiseResolve) {
          const detection = detectGestureFromLandmarks(lmList)

          if (detection.gesture && detection.confidence > 0.75) {
            if (gestureTimeoutId) {
              clearTimeout(gestureTimeoutId)
              gestureTimeoutId = null
            }

            gesturePromiseResolve(detection.gesture)
            gesturePromiseResolve = null
            setCurrentGesture(detection.gesture)
          }
        }
      } else {
        setHandsDetected(false)
        setGestureConfidence(0)
      }
      canvasCtx.restore()
    },
    [detectGestureFromLandmarks],
  )

  // Handle gesture detection when game state changes to capture
  useEffect(() => {
    if (gameState === "capture" && isStreamActive) {
      detectGesture().then((result) => {
        if (result !== "timeout") {
          onGestureDetected(result)
        } else {
          onGestureDetected(null)
        }
      })
    } else if (gameState !== "capture") {
      if (gestureTimeoutId) {
        clearTimeout(gestureTimeoutId)
        gestureTimeoutId = null
      }
      if (gesturePromiseResolve) {
        gesturePromiseResolve = null
      }
      setCurrentGesture(null)
      setGestureConfidence(0)
    }
  }, [gameState, isStreamActive, detectGesture, onGestureDetected])

  const startWebcam = async () => {
    if (isStreamActive) return

    try {
      await tf.setBackend("webgl")

      handsRef.current = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        },
      })

      handsRef.current.setOptions({
        staticImageMode: false,
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.8,
        minTrackingConfidence: 0.8,
      })

      handsRef.current.onResults(onResults)

      const videoElement = videoRef.current
      if (!videoElement) {
        setError("CAMERA INITIALIZATION FAILED")
        return
      }

      cameraRef.current = new MediaPipeCamera(videoElement, {
        onFrame: async () => {
          if (handsRef.current) {
            await handsRef.current.send({ image: videoElement })
          }
        },
        width: 640,
        height: 480,
      })

      await cameraRef.current.start()
      setIsStreamActive(true)
      setError(null)
    } catch (err) {
      setError("CAMERA ACCESS DENIED - PLEASE ALLOW PERMISSIONS")
      setIsStreamActive(false)
    }
  }

  const stopWebcam = () => {
    if (gestureTimeoutId) {
      clearTimeout(gestureTimeoutId)
      gestureTimeoutId = null
    }
    if (gesturePromiseResolve) {
      gesturePromiseResolve = null
    }

    if (cameraRef.current) {
      cameraRef.current.stop()
      cameraRef.current = null
    }
    if (handsRef.current) {
      handsRef.current.close()
      handsRef.current = null
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsStreamActive(false)
    setCurrentGesture(null)
    setHandsDetected(false)
    setGestureConfidence(0)
  }

  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  const getCountdownDisplay = () => {
    if (gameState === "countdown") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-lg">
          <div className="text-center">
            <div
              className="text-6xl font-bold text-green-400 mb-4 pixel-text"
              style={{ textShadow: "0 0 8px #00FF80" }}
            >
              {countdown}
            </div>
            <div className="pixel-text-sm text-white">GET READY</div>
          </div>
        </div>
      )
    } else if (gameState === "capture") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-lg">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-pink-400 mb-4 pixel-text" style={{ textShadow: "0 0 8px #FF2AAE" }}>
              {countdown}
            </div>

            {currentGesture ? (
              <div className="pixel-border-green p-3">
                <div className="pixel-text-sm text-green-400">{currentGesture.toUpperCase()} DETECTED</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="pixel-text-sm text-white">MAKE YOUR MOVE</div>
                <div className="flex justify-center items-center gap-3 pixel-text-sm text-gray-400">
                  <span>✊ ROCK</span>
                  <span>✋ PAPER</span>
                  <span>✌ SCISSORS</span>
                </div>
              </div>
            )}
          </div>

          {/* Fallback buttons */}
          <div className="flex gap-2">
            {["rock", "paper", "scissors"].map((move) => (
              <button
                key={move}
                onClick={() => onGestureDetected(move)}
                className="pixel-btn pixel-btn-green text-xs px-3 py-2"
              >
                {move.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="coupon-box pixel-border relative max-w-3xl mx-auto">
      <div className="relative overflow-hidden bg-black rounded-lg" style={{ aspectRatio: "16/9" }}>
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white min-h-[300px]">
            <div className="mb-4">
              <CameraOff className="h-12 w-12 text-pink-400" />
            </div>
            <h3 className="pixel-text text-pink-400 mb-3">CAMERA ERROR</h3>
            <p className="text-center text-gray-300 mb-6 px-4 max-w-md pixel-text-sm">{error}</p>
            <button onClick={startWebcam} className="pixel-btn pixel-btn-green">
              <Camera className="w-4 h-4 mr-2" />
              RETRY
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas
              ref={canvasRef}
              className="relative w-full h-full object-cover"
              width="640"
              height="480"
              style={{ transform: "scaleX(-1)" }}
            />

            {!isStreamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <div className="mb-6">
                  <Camera className="h-16 w-16 text-green-400" />
                </div>
                <h3 className="pixel-text text-green-400 mb-3">CAMERA READY</h3>
                <p className="text-gray-300 mb-6 text-center pixel-text-sm max-w-sm">
                  CLICK TO ACTIVATE CAMERA FOR GESTURE DETECTION
                </p>
                <button onClick={startWebcam} className="pixel-btn pixel-btn-green">
                  ACTIVATE CAMERA
                </button>
              </div>
            )}

            {/* Countdown Overlay */}
            {getCountdownDisplay()}
          </>
        )}
      </div>

      {/* Status bar */}
      {isStreamActive && (
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${handsDetected ? "bg-green-400" : "bg-gray-500"}`}></div>
              <span className="pixel-text-sm text-white">{handsDetected ? "HAND DETECTED" : "SCANNING..."}</span>
            </div>

            {gestureConfidence > 0.8 && (
              <div className="pixel-border-green p-1">
                <span className="pixel-text-sm text-green-400">{Math.round(gestureConfidence * 100)}% CONFIDENCE</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Wifi className="w-3 h-3 text-green-400" />
              <span className="pixel-text-sm text-green-400">AI ACTIVE</span>
            </div>
          </div>

          <button
            onClick={stopWebcam}
            className="pixel-btn text-red-400 border-red-400 hover:bg-red-400 hover:text-black text-xs px-2 py-1"
          >
            STOP
          </button>
        </div>
      )}
    </div>
  )
}

export default WebcamFeed
