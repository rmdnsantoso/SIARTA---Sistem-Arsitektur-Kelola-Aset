'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as faceapi from 'face-api.js'
import { verifyFaceLogin } from '../../actions/core/user'
import { createSessionFromUser } from '../../actions/core/auth'

interface FaceScannerProps {
  onSuccess: (user?: { name: string; email: string; role: string }) => void
  onCancel: () => void
  userId?: string
  skipFaceCheck?: boolean
  skipFaceUser?: { id: string; name: string; email: string; role: string }
}

type ScanStatus = 'loading_models' | 'scanning' | 'verifying' | 'success' | 'failed' | 'error'

// ─── Module-level guards ─────────────────────────────────────────────────────
// Simpan stream di module level agar pasti bisa di-kill walau refs sudah hilang
let _activeStream: MediaStream | null = null
let modelsLoaded = false

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
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])

  const [scanStatus, setScanStatus] = useState<ScanStatus>('loading_models')
  const [faceDetected, setFaceDetected] = useState(false)
  const [error, setError] = useState('')
  const [failMessage, setFailMessage] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  // ─── Stop everything ──────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    // Hentikan via module-level reference (lebih andal daripada ref saja)
    killAllTracks()
    // Lepas srcObject dari elemen video
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // ─── Detection loop (tidak dibuat dengan useCallback agar tidak stale) ───
  const startLoop = useCallback(
    (uid: string | undefined, cancelled: { value: boolean }) => {
      if (intervalRef.current) clearInterval(intervalRef.current)

      intervalRef.current = setInterval(async () => {
        if (cancelled.value) return
        if (!videoRef.current || videoRef.current.readyState < 2) return

        let det: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>> | undefined

        try {
          det = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        } catch {
          return
        }

        if (cancelled.value) return

        setFaceDetected(!!det)

        if (!det) return

        // Hentikan loop, mulai verifikasi
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setScanStatus('verifying')

        const descriptor = Array.from(det.descriptor)
        const result = await verifyFaceLogin(descriptor, uid)

        if (cancelled.value) return

        if (result.success && result.user) {
          setScanStatus('success')
          stopAll()                          // ← kamera mati sekarang
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
      }, 700)
    },
    [stopAll],
  )

  // ─── Effect utama — dependency array kosong, gunakan `cancelled` lokal ───
  useEffect(() => {
    // `cancelled` adalah variabel LOKAL per-invocation, bukan ref.
    // React Strict Mode menjalankan effect dua kali (mount→cleanup→mount).
    // Karena `cancelled` lokal, invokasi pertama punya `cancelled` berbeda
    // dengan invokasi kedua, sehingga stream pertama pasti di-kill saat cleanup.
    const cancelled = { value: false }

    const init = async () => {
      try {
        // ── Bypass: user belum punya wajah ──────────────────────────────────
        if (skipFaceCheck) {
          setScanStatus('success')
          setTimeout(async () => {
            if (cancelled.value) return
            if (skipFaceUser) await createSessionFromUser(skipFaceUser)
            onSuccessRef.current(
              skipFaceUser
                ? { name: skipFaceUser.name, email: skipFaceUser.email, role: skipFaceUser.role }
                : undefined,
            )
          }, 700)
          return
        }

        // ── Load model (sekali saja di module level) ─────────────────────────
        setScanStatus('loading_models')
        if (!modelsLoaded) {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
          ])
          modelsLoaded = true
        }

        if (cancelled.value) return

        // ── Buka kamera ─────────────────────────────────────────────────────
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })

        // Cek lagi setelah await — mungkin sudah di-cancel (Strict Mode unmount)
        if (cancelled.value) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        // Simpan di module-level agar cleanup dijamin bisa stop-nya
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
      // Tandai invokasi ini sebagai cancelled — mencegah async callbacks berjalan
      cancelled.value = true
      // Hentikan interval dan stream secara paksa
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      killAllTracks()
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — semua state external disimpan di ref atau module-level

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Verifikasi Wajah</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          {scanStatus === 'loading_models' && 'Memuat sistem pengenalan wajah...'}
          {scanStatus === 'scanning' && 'Arahkan wajah Anda ke kamera untuk masuk'}
          {scanStatus === 'verifying' && 'Memverifikasi identitas Anda...'}
          {scanStatus === 'success' && 'Identitas berhasil diverifikasi!'}
          {scanStatus === 'failed' && 'Wajah tidak dikenali, coba lagi'}
          {scanStatus === 'error' && 'Terjadi kesalahan'}
        </p>
      </div>

      {/* Camera Box */}
      <div className="relative w-full max-w-[280px] aspect-[3/4] mx-auto rounded-3xl overflow-hidden bg-gray-900 shadow-2xl ring-4 ring-gray-100">
        {/* Loading */}
        {scanStatus === 'loading_models' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 z-20">
            <div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-white/60 text-center px-6">Memuat model AI wajah...</p>
          </div>
        )}

        {/* Error */}
        {scanStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 z-20">
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600 text-sm font-medium text-center">{error}</p>
          </div>
        )}

        {/* Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${
            scanStatus === 'loading_models' || scanStatus === 'error' ? 'opacity-0' : 'opacity-100'
          } ${scanStatus === 'success' ? 'opacity-50' : ''}`}
        />

        {/* Scanning overlay */}
        {(scanStatus === 'scanning' || scanStatus === 'verifying' || scanStatus === 'failed') && (
          <div className="absolute inset-0 z-10">
            <div className={`absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? 'border-green-400' : 'border-blue-500'}`} />
            <div className={`absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? 'border-green-400' : 'border-blue-500'}`} />
            <div className={`absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? 'border-green-400' : 'border-blue-500'}`} />
            <div className={`absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300 ${scanStatus === 'failed' ? 'border-red-500' : faceDetected ? 'border-green-400' : 'border-blue-500'}`} />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-[60%] h-[55%] border-2 rounded-[50%] transition-colors duration-500 ${scanStatus === 'failed' ? 'border-red-400 border-solid' : faceDetected ? 'border-green-400 border-solid' : 'border-white/30 border-dashed'}`} />
            </div>

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
