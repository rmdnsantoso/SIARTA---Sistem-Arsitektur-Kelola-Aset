'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as faceapi from 'face-api.js'
import { verifyFaceLogin, generateLivenessChallenge } from '../../actions/core/user'
import { ensureModelsLoaded, calculateEAR, checkBrightness, getHeadTurnDirection, getYawRatio, getEyeWidthRatio } from '../../lib/face/utils'

interface FaceScannerProps {
  onSuccess: (user?: { name: string; email: string; role: string }) => void
  onCancel: () => void
  skipFaceCheck?: boolean
  skipFaceUser?: { id: string; name: string; email: string; role: string }
}

type ScanStatus = 'loading_models' | 'scanning' | 'verifying' | 'success' | 'failed' | 'error'

// ΓöÇΓöÇΓöÇ Module-level guards ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
let _activeStream: MediaStream | null = null

function killAllTracks() {
  if (_activeStream) {
    _activeStream.getTracks().forEach(track => {
      track.enabled = false
      track.stop()
    })
    _activeStream = null
  }
}
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export default function FaceScanner({
  onSuccess,
  onCancel,
  skipFaceCheck,
  skipFaceUser,
}: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])

  const [scanStatus, setScanStatus] = useState<ScanStatus>('loading_models')
  const [faceDetected, setFaceDetected] = useState(false)
  const [error, setError] = useState('')
  const [failMessage, setFailMessage] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  // Liveness & Light states
  const [challengeSequence, setChallengeSequence] = useState<('BLINK' | 'TURN_LEFT' | 'TURN_RIGHT')[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const challengeSequenceRef = useRef<('BLINK' | 'TURN_LEFT' | 'TURN_RIGHT')[]>([])
  const currentStepIndexRef = useRef(0)
  const sessionIdRef = useRef<string>('')
  const transitionWaitUntilRef = useRef<number>(0)
  const earSnapshot = useRef<{ ear: number, yawRatio: number }[]>([])
  const headTurnSnapshot = useRef<{ dir: 'left'|'right'|'center', eyeRatio: number }[]>([])

  const [hasBlinked, setHasBlinked] = useState(false)
  const hasBlinkedRef = useRef(false)
  const earHistory = useRef<{ ear: number, yawRatio: number }[]>([])

  const [hasTurned, setHasTurned] = useState(false)
  const hasTurnedRef = useRef(false)
  const headTurnHistory = useRef<{ dir: 'left'|'right'|'center', eyeRatio: number }[]>([])
  
  const [baselineEAR, setBaselineEAR] = useState<number | null>(null)
  const baselineEARRef = useRef<number | null>(null)
  const calibrationFrames = useRef<number[]>([])

  const [lightStatus, setLightStatus] = useState<'normal' | 'dark' | 'bright'>('normal')

  // ΓöÇΓöÇΓöÇ Stop everything ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const stopAll = useCallback(() => {
    if (intervalRef.current) {
      if ('cancelVideoFrameCallback' in HTMLVideoElement.prototype && videoRef.current) {
        try { (videoRef.current as any).cancelVideoFrameCallback(intervalRef.current) } catch (e) {}
      }
      clearTimeout(intervalRef.current as any)
      intervalRef.current = null
    }
    killAllTracks()
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // ΓöÇΓöÇΓöÇ Detection loop ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const startLoop = useCallback(
    async (cancelled: { value: boolean }) => {
      if (intervalRef.current) {
        if ('cancelVideoFrameCallback' in HTMLVideoElement.prototype && videoRef.current) {
          try { (videoRef.current as any).cancelVideoFrameCallback(intervalRef.current) } catch (e) {}
        }
        clearTimeout(intervalRef.current as any)
      }
      
      // Fetch challenge
      const res = await generateLivenessChallenge()
      if (cancelled.value) return
      if (res.success && res.challenge && Array.isArray(res.challenge) && res.sessionId) {
        sessionIdRef.current = res.sessionId
        setChallengeSequence(res.challenge as any)
        challengeSequenceRef.current = res.challenge as any
        setCurrentStepIndex(0)
        currentStepIndexRef.current = 0
      } else {
        setError('Gagal mendapatkan challenge keamanan.')
        setScanStatus('error')
        return
      }

      // Reset liveness state saat restart loop
      setHasBlinked(false)
      hasBlinkedRef.current = false
      earHistory.current = []

      setHasTurned(false)
      hasTurnedRef.current = false
      headTurnHistory.current = []
      
      transitionWaitUntilRef.current = 0

      let stopped = false
      let lastBrightnessCheck = 0

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== 'undefined' ? navigator.userAgent : ''
      )
      const tickIntervalMs = isMobile ? 900 : 200

      const scheduleNext = (fn: () => void) => {
        if (stopped || cancelled.value || !videoRef.current) return
        const supportsVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype
        if (supportsVFC && !isMobile) {
          intervalRef.current = (videoRef.current as any).requestVideoFrameCallback(fn)
        } else {
          intervalRef.current = setTimeout(fn, tickIntervalMs)
        }
      }

      const tick = async () => {
        if (stopped || cancelled.value) return
        if (!videoRef.current || videoRef.current.readyState < 2) {
          if (!stopped && !cancelled.value) scheduleNext(tick)
          return
        }

        // Cek brightness secara pasif (di-throttle 500ms)
        const now = Date.now()
        
        let currentLightStatus = lightStatus
        if (now - lastBrightnessCheck > 500) {
          if (canvasRef.current) {
            currentLightStatus = checkBrightness(videoRef.current, canvasRef.current)
            setLightStatus(currentLightStatus)
          }
          lastBrightnessCheck = now
        }

        let det: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68> | undefined

        try {
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            typeof navigator !== 'undefined' ? navigator.userAgent : ''
          )
          const inputSize = isMobile ? 160 : 224

          det = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
        } catch {
          if (!stopped && !cancelled.value) scheduleNext(tick)
          return
        }

        if (stopped || cancelled.value) return

        setFaceDetected(!!det)

        if (!det) {
          if (!stopped && !cancelled.value) scheduleNext(tick)
          return
        }

        // --- Active Liveness Detection ---
        // Jika pencahayaan tidak normal, jeda proses evaluasi challenge
        if (currentLightStatus !== 'normal') {
          if (!stopped && !cancelled.value) scheduleNext(tick)
          return
        }

        const landmarks = det.landmarks.positions
        
        // --- Fase Kalibrasi EAR ---
        if (baselineEARRef.current === null) {
          const direction = getHeadTurnDirection(landmarks)
          if (direction === 'center') {
            const leftEye = landmarks.slice(36, 42)
            const rightEye = landmarks.slice(42, 48)
            const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2
            calibrationFrames.current.push(avgEAR)
            if (calibrationFrames.current.length >= 15) { // ~1 detik (tergantung FPS)
               const base = calibrationFrames.current.reduce((a, b) => a + b, 0) / calibrationFrames.current.length
               baselineEARRef.current = base
               setBaselineEAR(base)
            }
          } else {
             // Reset jika kepala bergoyang
             calibrationFrames.current = []
          }
          if (!stopped && !cancelled.value) scheduleNext(tick)
          return
        }

        const currentChallenge = challengeSequenceRef.current[currentStepIndexRef.current]
        let challengeCompleted = false

        if (currentChallenge === 'BLINK') {
          const leftEye = landmarks.slice(36, 42)
          const rightEye = landmarks.slice(42, 48)
          const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2
          const yawRatio = getYawRatio(landmarks)

          earHistory.current.push({ ear: avgEAR, yawRatio })
          if (earHistory.current.length > 10) {
            earHistory.current.shift()
          }

          if (earHistory.current.length >= 3) {
            const ears = earHistory.current.map(d => d.ear)
            const yaws = earHistory.current.map(d => d.yawRatio)
            
            const maxEAR = Math.max(...ears)
            const minEAR = Math.min(...ears)
            const latestEAR = ears[ears.length - 1]
            const maxYaw = Math.max(...yaws)
            const minYaw = Math.min(...yaws)

            // Pose-gating: pastikan yawRatio relatif stabil selama window
            if (maxEAR - minEAR >= 0.05 && latestEAR - minEAR >= 0.03 && maxYaw - minYaw <= 0.2) {
              if (!hasBlinkedRef.current) {
                hasBlinkedRef.current = true
                setHasBlinked(true)
              }
            }
          }

          challengeCompleted = hasBlinkedRef.current
        } else if (currentChallenge === 'TURN_LEFT' || currentChallenge === 'TURN_RIGHT') {
          const expectedDir = currentChallenge === 'TURN_LEFT' ? 'left' : 'right'
          const direction = getHeadTurnDirection(landmarks)
          const eyeRatio = getEyeWidthRatio(landmarks)
          
          headTurnHistory.current.push({ dir: direction, eyeRatio })
          if (headTurnHistory.current.length > 30) headTurnHistory.current.shift()

          const turnIdx = headTurnHistory.current.findIndex((d, i) => 
            d.dir === expectedDir && headTurnHistory.current.slice(i, i + 3).every(x => x.dir === expectedDir)
          )
          const returnedToCenter = turnIdx >= 0 && headTurnHistory.current.slice(turnIdx + 3).some(d => d.dir === 'center')

          if (turnIdx >= 0 && returnedToCenter) {
            // 3D Rotation Check: pastikan rasio lebar mata berubah signifikan
            const centerRatios = headTurnHistory.current.filter(d => d.dir === 'center').map(d => d.eyeRatio)
            const turnRatios = headTurnHistory.current.filter(d => d.dir === expectedDir).map(d => d.eyeRatio)
            
            if (centerRatios.length > 0 && turnRatios.length > 0) {
              const avgCenter = centerRatios.reduce((a, b) => a + b, 0) / centerRatios.length
              const avgTurn = turnRatios.reduce((a, b) => a + b, 0) / turnRatios.length
              if (Math.abs(avgCenter - avgTurn) >= 0.05) {
                if (!hasTurnedRef.current) {
                  hasTurnedRef.current = true
                  setHasTurned(true)
                }
              }
            }
          }

          challengeCompleted = hasTurnedRef.current
        }

        // ─── TRANSISI ANTAR CHALLENGE DENGAN JEDA UI ───
        if (transitionWaitUntilRef.current > 0) {
          if (now < transitionWaitUntilRef.current) {
            // Sedang menunggu jeda UI agar user bisa membaca 'Selesai...'
            if (!stopped && !cancelled.value) scheduleNext(tick)
            return
          } else {
            // Selesai menunggu, reset state dan lanjut challenge berikutnya
            transitionWaitUntilRef.current = 0
            const nextIdx = currentStepIndexRef.current + 1
            
            // Reset buffer untuk challenge berikutnya
            const nextCh = challengeSequenceRef.current[nextIdx]
            if (nextCh === 'TURN_LEFT' || nextCh === 'TURN_RIGHT') {
              hasTurnedRef.current = false
              setHasTurned(false)
              headTurnHistory.current = []
            } else if (nextCh === 'BLINK') {
              hasBlinkedRef.current = false
              setHasBlinked(false)
              earHistory.current = []
            }
            
            currentStepIndexRef.current = nextIdx
            setCurrentStepIndex(nextIdx)
            if (!stopped && !cancelled.value) scheduleNext(tick)
            return
          }
        }

        if (challengeCompleted) {
          if (currentStepIndexRef.current < challengeSequenceRef.current.length - 1) {
            // Simpan snapshot data yang membuat challenge ini lolos
            if (currentChallenge === 'BLINK') {
              earSnapshot.current = [...earHistory.current]
            } else if (currentChallenge === 'TURN_LEFT' || currentChallenge === 'TURN_RIGHT') {
              headTurnSnapshot.current = [...headTurnHistory.current]
            }

            // Mulai jeda 800ms
            transitionWaitUntilRef.current = now + 800
            if (!stopped && !cancelled.value) scheduleNext(tick)
            return
          } else {
            // Jika sudah di step terakhir dan completed, simpan snapshot
            if (currentChallenge === 'BLINK') {
              earSnapshot.current = [...earHistory.current]
            } else if (currentChallenge === 'TURN_LEFT' || currentChallenge === 'TURN_RIGHT') {
              headTurnSnapshot.current = [...headTurnHistory.current]
            }
          }
        } else {
          // Masih menunggu penyelesaian challenge
          if (!stopped && !cancelled.value) scheduleNext(tick)
          return
        }

        // --- MULAI VERIFIKASI ---
        stopped = true
        if (intervalRef.current) {
          clearTimeout(intervalRef.current as any)
          intervalRef.current = null
        }
        setScanStatus('verifying')

        // Ekstrak descriptor hanya saat kedipan sudah divalidasi
        try {
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            typeof navigator !== 'undefined' ? navigator.userAgent : ''
          )
          const inputSize = isMobile ? 160 : 224

          const fullDet = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor()

          if (!fullDet) throw new Error('Wajah menghilang.')
          const descriptor = Array.from(fullDet.descriptor)
          
          const result = await verifyFaceLogin(descriptor, sessionIdRef.current, {
            earHistory: earSnapshot.current.length > 0 ? earSnapshot.current : earHistory.current,
            headTurnHistory: headTurnSnapshot.current.length > 0 ? headTurnSnapshot.current : headTurnHistory.current
          })
          
          if (cancelled.value) return
          if (result.success && result.user) {
            setScanStatus('success')
            stopAll()
            setTimeout(() => {
              if (!cancelled.value) onSuccessRef.current(result.user as any)
            }, 700)
          } else {
            setScanStatus('failed')
            setFailMessage(result.error || 'Wajah tidak dikenali. Coba lagi.')
            setRetryCount(c => c + 1)
            // Restart setelah 2.5 detik
            setTimeout(() => {
              if (cancelled.value) return
              setFaceDetected(false)
              setFailMessage('')
              setScanStatus('scanning')
              // eslint-disable-next-line react-hooks/exhaustive-deps
              startLoop(cancelled)
            }, 2500)
          }
        } catch (err: any) {
          if (cancelled.value) return
          setScanStatus('failed')
          setFailMessage(err.message || 'Gagal mengekstrak profil wajah.')
          setTimeout(() => {
            if (cancelled.value) return
            setFaceDetected(false)
            setFailMessage('')
            setScanStatus('scanning')
            // eslint-disable-next-line react-hooks/exhaustive-deps
            startLoop(cancelled)
          }, 2500)
        }
      } // end tick()

      tick() // mulai loop
    },
    [stopAll],
  )

  // ΓöÇΓöÇΓöÇ Effect utama ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    const cancelled = { value: false }

    const init = async () => {
      try {
        if (skipFaceCheck) {
          setScanStatus('success')
          setTimeout(() => {
            if (cancelled.value) return
            onSuccessRef.current(
              skipFaceUser
                ? { name: skipFaceUser.name, email: skipFaceUser.email, role: skipFaceUser.role }
                : undefined,
            )
          }, 700)
          return
        }

        setScanStatus('loading_models')
        const loaded = await ensureModelsLoaded()
        if (!loaded) {
          setScanStatus('error')
          setError('Gagal memuat model pendeteksi wajah.')
          return
        }

        if (cancelled.value) return

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })

        if (cancelled.value) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        _activeStream = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        if (cancelled.value) {
          stopAll()
          return
        }

        setScanStatus('scanning')
        startLoop(cancelled)
      } catch (err: any) {
        if (cancelled.value) return
        if (err.name === 'NotAllowedError') {
          setError('Akses kamera ditolak. Izinkan akses kamera di browser Anda.')
        } else {
          setError('Gagal mengakses kamera atau memuat model AI.')
        }
        setScanStatus('error')
      }
    }

    init()
    window.addEventListener('pagehide', killAllTracks)

    return () => {
      window.removeEventListener('pagehide', killAllTracks)
      cancelled.value = true
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      killAllTracks()
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, []) 

  const currentChallenge = challengeSequence[currentStepIndex]
  const currentChallengeCompleted = currentChallenge === 'BLINK' ? hasBlinked : hasTurned
  let currentChallengeText = ''
  if (currentChallenge === 'BLINK') currentChallengeText = 'KEDIPKAN MATA ANDA'
  else if (currentChallenge === 'TURN_LEFT') currentChallengeText = 'TENGOK KE KIRI'
  else if (currentChallenge === 'TURN_RIGHT') currentChallengeText = 'TENGOK KE KANAN'

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Verifikasi Wajah</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          {scanStatus === 'loading_models' && 'Memuat sistem pengenalan wajah...'}
          {scanStatus === 'scanning' && baselineEAR === null && 'Menyesuaikan kalibrasi wajah...'}
          {scanStatus === 'scanning' && baselineEAR !== null && currentChallenge && `Tantangan ${currentStepIndex + 1}/${challengeSequence.length}: Arahkan wajah ke kamera dan ${currentChallengeText}`}
          {scanStatus === 'scanning' && !currentChallenge && 'Menyiapkan verifikasi...'}
          {scanStatus === 'verifying' && 'Memverifikasi identitas Anda...'}
          {scanStatus === 'success' && 'Identitas berhasil diverifikasi!'}
          {scanStatus === 'failed' && 'Wajah tidak dikenali, coba lagi'}
          {scanStatus === 'error' && 'Terjadi kesalahan'}
        </p>
      </div>

      {/* Light Warning (Passive) */}
      {lightStatus !== 'normal' && (scanStatus === 'scanning' || scanStatus === 'verifying') && (
        <div className={`px-4 py-2 rounded-xl text-xs font-bold w-full max-w-[280px] text-center shadow-md animate-pulse
          ${lightStatus === 'dark' ? 'bg-slate-800 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
          {lightStatus === 'dark' ? 'Pencahayaan redup/gelap.' : 'Pencahayaan silau/backlight.'}
        </div>
      )}

      {/* Camera Box */}
      <div className="relative w-full max-w-[280px] aspect-[3/4] mx-auto rounded-3xl overflow-hidden bg-gray-900 shadow-2xl ring-4 ring-gray-100">
        {scanStatus === 'loading_models' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 z-20">
            <div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-white/60 text-center px-6">Memuat model AI wajah...</p>
          </div>
        )}

        {scanStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 z-20">
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600 text-sm font-medium text-center">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError('')
                setScanStatus('loading_models')
                const cancelled = { value: false }
                startLoop(cancelled)
              }}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md hover:bg-blue-700 transition"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${
            scanStatus === 'loading_models' || scanStatus === 'error' ? 'opacity-0' : 'opacity-100'
          } ${scanStatus === 'success' ? 'opacity-50' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        {(scanStatus === 'scanning' || scanStatus === 'verifying' || scanStatus === 'failed') && (
          <div className="absolute inset-0 z-10">
            <div className={`absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? (currentChallengeCompleted ? 'border-green-400' : 'border-yellow-400') : 'border-blue-500'}`} />
            <div className={`absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? (currentChallengeCompleted ? 'border-green-400' : 'border-yellow-400') : 'border-blue-500'}`} />
            <div className={`absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? (currentChallengeCompleted ? 'border-green-400' : 'border-yellow-400') : 'border-blue-500'}`} />
            <div className={`absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? (currentChallengeCompleted ? 'border-green-400' : 'border-yellow-400') : 'border-blue-500'}`} />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-[60%] h-[55%] border-2 rounded-[50%] transition-colors duration-500 ${scanStatus === 'failed' ? 'border-red-400 border-solid' : faceDetected ? (currentChallengeCompleted ? 'border-green-400 border-solid' : 'border-yellow-400 border-solid') : 'border-white/30 border-dashed'}`} />
            </div>

            {/* Instruction Badge */}
            {scanStatus === 'scanning' && (
              <div className="absolute inset-x-0 bottom-8 flex justify-center z-30">
                <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-colors duration-300 ${
                  faceDetected 
                    ? (currentChallengeCompleted ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900') 
                    : 'bg-black/60 text-white/90'
                }`}>
                  {faceDetected 
                    ? (baselineEAR === null ? 'Kalibrasi...' : (currentChallengeCompleted ? 'Selesai...' : (currentChallenge === 'BLINK' ? 'Silakan Berkedip' : (currentChallenge === 'TURN_LEFT' ? 'Tengok ke Kiri' : 'Tengok ke Kanan')))) 
                    : 'Posisikan wajah Anda'}
                </span>
              </div>
            )}

            {scanStatus === 'verifying' && (
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-400 shadow-[0_0_15px_4px_rgba(59,130,246,0.6)]"
                style={{ animation: 'face-scan-line 1.5s infinite ease-in-out' }} />
            )}

            {scanStatus === 'failed' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20 backdrop-blur-sm">
                <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl mb-2">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-white text-xs font-bold drop-shadow text-center px-4">{failMessage}</p>
              </div>
            )}
          </div>
        )}

        {/* Success overlay */}
        {scanStatus === 'success' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-green-500/25 backdrop-blur-sm">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl mb-3 animate-bounce">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-wide drop-shadow-md">Wajah Dikenali</span>
          </div>
        )}
      </div>

      {retryCount > 0 && scanStatus === 'failed' && (
        <p className="text-xs text-amber-600 font-medium text-center">
          Gagal {retryCount}x - Pastikan pencahayaan cukup dan wajah terlihat jelas
        </p>
      )}

      {scanStatus !== 'success' && (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          Batalkan &amp; Kembali
        </button>
      )}

      <style>{`
        @keyframes face-scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
