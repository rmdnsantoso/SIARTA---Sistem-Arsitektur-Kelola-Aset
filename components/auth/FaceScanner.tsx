'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as faceapi from 'face-api.js'
import { verifyFaceLogin, generateLivenessChallenge } from '../../actions/core/user'
import { ensureModelsLoaded, calculateEAR, checkBrightness, getHeadTurnDirection } from '../../lib/face/utils'

interface FaceScannerProps {
  onSuccess: (user?: { name: string; email: string; role: string }) => void
  onCancel: () => void
  userId?: string
  skipFaceCheck?: boolean
  skipFaceUser?: { id: string; name: string; email: string; role: string }
}

type ScanStatus = 'loading_models' | 'scanning' | 'verifying' | 'success' | 'failed' | 'error'

// ─── Module-level guards ─────────────────────────────────────────────────────
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
// ────────────────────────────────────────────────────────────────────────────

export default function FaceScanner({
  onSuccess,
  onCancel,
  userId,
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
  const [challenge, setChallenge] = useState<'BLINK' | 'TURN_HEAD' | null>(null)
  const challengeRef = useRef<'BLINK' | 'TURN_HEAD' | null>(null)
  const sessionIdRef = useRef<string>('')

  const [hasBlinked, setHasBlinked] = useState(false)
  const hasBlinkedRef = useRef(false)
  const earHistory = useRef<number[]>([])

  const [hasTurned, setHasTurned] = useState(false)
  const hasTurnedRef = useRef(false)
  const headTurnHistory = useRef<('left'|'right'|'center')[]>([])

  const [lightStatus, setLightStatus] = useState<'normal' | 'dark' | 'bright'>('normal')

  // ─── Stop everything ──────────────────────────────────────────────────────
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

  // ─── Detection loop ───────────────────────────────────────────────────────
  const startLoop = useCallback(
    async (uid: string | undefined, cancelled: { value: boolean }) => {
      if (intervalRef.current) {
        if ('cancelVideoFrameCallback' in HTMLVideoElement.prototype && videoRef.current) {
          try { (videoRef.current as any).cancelVideoFrameCallback(intervalRef.current) } catch (e) {}
        }
        clearTimeout(intervalRef.current as any)
      }
      
      // Fetch challenge
      const sid = crypto.randomUUID()
      sessionIdRef.current = sid
      const res = await generateLivenessChallenge(sid)
      if (cancelled.value) return
      if (res.success && res.challenge) {
        setChallenge(res.challenge as any)
        challengeRef.current = res.challenge as any
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

      let stopped = false
      let lastBrightnessCheck = 0

      const scheduleNext = (fn: () => void) => {
        if (stopped || cancelled.value || !videoRef.current) return
        const supportsVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype
        if (supportsVFC) {
          intervalRef.current = (videoRef.current as any).requestVideoFrameCallback(fn)
        } else {
          intervalRef.current = setTimeout(fn, 200)
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
        if (now - lastBrightnessCheck > 500) {
          if (canvasRef.current) {
            const lStatus = checkBrightness(videoRef.current, canvasRef.current)
            setLightStatus(lStatus)
          }
          lastBrightnessCheck = now
        }

        let det: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68> | undefined

        try {
          det = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
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
        const landmarks = det.landmarks.positions
        const currentChallenge = challengeRef.current

        if (currentChallenge === 'BLINK') {
          const leftEye = landmarks.slice(36, 42)
          const rightEye = landmarks.slice(42, 48)
          const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2

          earHistory.current.push(avgEAR)
          if (earHistory.current.length > 8) {
            earHistory.current.shift()
          }

          if (earHistory.current.length >= 3) {
            const maxEAR = Math.max(...earHistory.current)
            const minEAR = Math.min(...earHistory.current)
            const latestEAR = earHistory.current[earHistory.current.length - 1]

            if (maxEAR - minEAR >= 0.05 && latestEAR - minEAR >= 0.03) {
              if (!hasBlinkedRef.current) {
                hasBlinkedRef.current = true
                setHasBlinked(true)
              }
            }
          }

          // Jangan kirim verifikasi ke server sampai user terbukti berkedip
          if (!hasBlinkedRef.current) {
            if (!stopped && !cancelled.value) scheduleNext(tick)
            return
          }
        } else if (currentChallenge === 'TURN_HEAD') {
          const direction = getHeadTurnDirection(landmarks)
          headTurnHistory.current.push(direction)
          if (headTurnHistory.current.length > 10) headTurnHistory.current.shift()

          if (direction === 'left' || direction === 'right') {
            if (!hasTurnedRef.current) {
              hasTurnedRef.current = true
              setHasTurned(true)
            }
          }

          if (!hasTurnedRef.current) {
            if (!stopped && !cancelled.value) scheduleNext(tick)
            return
          }
        } else {
          // Masih menunggu challenge
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
          const fullDet = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor()

          if (!fullDet) throw new Error('Wajah menghilang.')
          const descriptor = Array.from(fullDet.descriptor)
          
          verifyFaceLogin(descriptor, uid || '', sessionIdRef.current, {
            earHistory: earHistory.current,
            headTurnHistory: headTurnHistory.current
          }).then((result) => {
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
                startLoop(uid, cancelled)
              }, 2500)
            }
          })
        } catch (err: any) {
          if (cancelled.value) return
          setScanStatus('failed')
          setFailMessage(err.message || 'Gagal mengekstrak profil wajah.')
          setTimeout(() => {
            if (cancelled.value) return
            setFaceDetected(false)
            setFailMessage('')
            setScanStatus('scanning')
            startLoop(uid, cancelled)
          }, 2500)
        }
      } // end tick()

      tick() // mulai loop
    },
    [stopAll],
  )

  // ─── Effect utama ─────────────────────────────────────────────────────────
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
        startLoop(userId, cancelled)
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

    return () => {
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

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Verifikasi Wajah</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          {scanStatus === 'loading_models' && 'Memuat sistem pengenalan wajah...'}
          {scanStatus === 'scanning' && challenge === 'BLINK' && 'Arahkan wajah ke kamera dan BERKEDIP'}
          {scanStatus === 'scanning' && challenge === 'TURN_HEAD' && 'Arahkan wajah ke kamera dan TENGOK KIRI/KANAN'}
          {scanStatus === 'scanning' && !challenge && 'Menyiapkan verifikasi...'}
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
            <div className={`absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? ((challenge === 'BLINK' ? hasBlinked : hasTurned) ? 'border-green-400' : 'border-yellow-400') : 'border-blue-500'}`} />
            <div className={`absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? ((challenge === 'BLINK' ? hasBlinked : hasTurned) ? 'border-green-400' : 'border-yellow-400') : 'border-blue-500'}`} />
            <div className={`absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? ((challenge === 'BLINK' ? hasBlinked : hasTurned) ? 'border-green-400' : 'border-yellow-400') : 'border-blue-500'}`} />
            <div className={`absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? ((challenge === 'BLINK' ? hasBlinked : hasTurned) ? 'border-green-400' : 'border-yellow-400') : 'border-blue-500'}`} />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-[60%] h-[55%] border-2 rounded-[50%] transition-colors duration-500 ${scanStatus === 'failed' ? 'border-red-400 border-solid' : faceDetected ? ((challenge === 'BLINK' ? hasBlinked : hasTurned) ? 'border-green-400 border-solid' : 'border-yellow-400 border-solid') : 'border-white/30 border-dashed'}`} />
            </div>

            {/* Instruction Badge */}
            {scanStatus === 'scanning' && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <span className={`text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg transition-all ${
                  faceDetected 
                    ? ((challenge === 'BLINK' ? hasBlinked : hasTurned) ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900') 
                    : 'bg-black/60 text-white/90'
                }`}>
                  {faceDetected 
                    ? ((challenge === 'BLINK' ? hasBlinked : hasTurned) ? 'Memverifikasi...' : (challenge === 'BLINK' ? 'Silakan Berkedip' : 'Tengok ke Kiri/Kanan')) 
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
          Gagal {retryCount}× — Pastikan pencahayaan cukup dan wajah terlihat jelas
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
