'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as faceapi from 'face-api.js'

interface FaceCaptureProps {
  onCapture: (descriptor: number[]) => void
  onCancel: () => void
}

type CaptureStatus = 'loading_models' | 'ready' | 'detecting' | 'captured' | 'no_face' | 'error'

export default function FaceCapture({ onCapture, onCancel }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionInterval = useRef<NodeJS.Timeout | null>(null)

  const [status, setStatus] = useState<CaptureStatus>('loading_models')
  const [faceDetected, setFaceDetected] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null)

  // Load models once
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        setStatus('loading_models')
        const MODEL_URL = '/models'
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)

        if (!isMounted) return

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        })

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        setStatus('ready')
        startDetection()
      } catch (err: any) {
        if (!isMounted) return
        console.error(err)
        if (err.name === 'NotAllowedError') {
          setErrorMsg('Akses kamera ditolak. Izinkan akses kamera di browser Anda.')
        } else {
          setErrorMsg('Gagal memuat kamera atau model AI. Coba refresh halaman.')
        }
        setStatus('error')
      }
    }

    const startDetection = () => {
      detectionInterval.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor()

        if (isMounted) {
          setFaceDetected(!!detection)
        }
      }, 500)
    }

    init()

    return () => {
      isMounted = false
      if (detectionInterval.current) clearInterval(detectionInterval.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [])

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return
    setStatus('detecting')

    // Ambil snapshot descriptor saat tombol diklik
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection) {
      setStatus('no_face')
      setTimeout(() => setStatus('ready'), 2000)
      return
    }

    const descriptor = Array.from(detection.descriptor)
    setCapturedDescriptor(descriptor)
    setStatus('captured')

    // Stop kamera setelah berhasil
    if (detectionInterval.current) clearInterval(detectionInterval.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setTimeout(() => {
      onCapture(descriptor)
    }, 1200)
  }, [onCapture])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header */}
      <div className="text-center">
        <h4 className="text-base font-extrabold text-gray-900">Rekam Data Wajah</h4>
        <p className="text-xs text-gray-500 mt-1">
          Arahkan wajah pengguna ke kamera, lalu tekan "Rekam Wajah"
        </p>
      </div>

      {/* Camera Box */}
      <div className="relative w-full max-w-[260px] aspect-[3/4] mx-auto rounded-2xl overflow-hidden bg-gray-900 shadow-xl ring-4 ring-gray-100">
        {status === 'loading_models' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-white/70 text-center px-4">Memuat model AI wajah...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-gray-50">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-red-600 text-center font-medium">{errorMsg}</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
            status === 'loading_models' || status === 'error' ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay */}
        {(status === 'ready' || status === 'detecting' || status === 'no_face') && (
          <div className="absolute inset-0 z-10">
            {/* Corner brackets */}
            <div className={`absolute top-5 left-5 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300 ${faceDetected ? 'border-green-400' : 'border-blue-400'}`} />
            <div className={`absolute top-5 right-5 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300 ${faceDetected ? 'border-green-400' : 'border-blue-400'}`} />
            <div className={`absolute bottom-5 left-5 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300 ${faceDetected ? 'border-green-400' : 'border-blue-400'}`} />
            <div className={`absolute bottom-5 right-5 w-8 h-8 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300 ${faceDetected ? 'border-green-400' : 'border-blue-400'}`} />

            {/* Face oval guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-[58%] h-[52%] border-2 rounded-[50%] transition-colors duration-500 ${faceDetected ? 'border-green-400 border-solid' : 'border-white/40 border-dashed'}`} />
            </div>

            {/* Status badge */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              {status === 'detecting' ? (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Mendeteksi...
                </span>
              ) : status === 'no_face' ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  Wajah tidak terdeteksi
                </span>
              ) : (
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${
                  faceDetected ? 'bg-green-500/90 text-white' : 'bg-black/50 text-white/80'
                }`}>
                  {faceDetected ? '✓ Wajah terdeteksi' : 'Posisikan wajah di sini'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Success overlay */}
        {status === 'captured' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-green-500/30 backdrop-blur-sm">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-xl animate-bounce">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white font-bold text-sm mt-3 drop-shadow">Data Wajah Direkam!</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {(status === 'ready' || status === 'detecting' || status === 'no_face') && (
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!faceDetected || status === 'detecting'}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {status === 'detecting' ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Merekam...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Rekam Wajah
              </>
            )}
          </button>
        </div>
      )}

      {status === 'loading_models' && (
        <p className="text-xs text-gray-400 text-center">Harap tunggu, mempersiapkan kamera...</p>
      )}
    </div>
  )
}
