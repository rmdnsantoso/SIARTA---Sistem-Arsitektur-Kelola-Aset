'use client'

import React, { useEffect, useRef, useState } from 'react'

interface FaceScannerProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function FaceScanner({ onSuccess, onCancel }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState('')
  const [scanStatus, setScanStatus] = useState<'initializing' | 'scanning' | 'success'>('initializing')

  useEffect(() => {
    let timeoutId1: NodeJS.Timeout
    let timeoutId2: NodeJS.Timeout
    let timeoutId3: NodeJS.Timeout
    let isMounted = true

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' }, // Front camera preferred
          audio: false 
        })
        
        if (!isMounted) {
          // If component unmounted while we were waiting for permissions
          stream.getTracks().forEach(track => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        
        // Wait a bit before simulating the scan start
        timeoutId1 = setTimeout(() => {
          if (!isMounted) return
          setScanStatus('scanning')
          
          // Simulate the scanning process taking 3 seconds
          timeoutId2 = setTimeout(() => {
            if (!isMounted) return
            setScanStatus('success')
            
            // Wait 1 second on success before triggering callback
            timeoutId3 = setTimeout(() => {
              if (!isMounted) return
              // Stop camera immediately BEFORE calling onSuccess (which triggers navigation)
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
              }
              if (videoRef.current) {
                videoRef.current.srcObject = null
              }
              onSuccess()
            }, 1000)
            
          }, 3000)
        }, 1000)

      } catch (err) {
        if (!isMounted) return
        console.error("Error accessing camera: ", err)
        setError("Gagal mengakses kamera. Pastikan Anda telah memberikan izin kamera pada browser.")
      }
    }

    startCamera()

    return () => {
      isMounted = false
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      clearTimeout(timeoutId3)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [onSuccess])

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in flex flex-col items-center">
      <style>{`
        @keyframes face-scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-face-scan-line {
          animation: face-scan-line 2s infinite ease-in-out;
        }
      `}</style>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Verifikasi Wajah</h2>
        <p className="mt-2 text-sm text-gray-500">
          Arahkan wajah Anda ke dalam kotak untuk memverifikasi identitas.
        </p>
      </div>

      <div className="relative w-full max-w-[280px] aspect-[3/4] mx-auto rounded-3xl overflow-hidden bg-gray-900 shadow-2xl ring-4 ring-gray-100 mb-8">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-50">
            <svg className="w-12 h-12 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${scanStatus === 'success' ? 'opacity-50' : 'opacity-100'}`} 
            />

            {/* Scanning Overlay UI */}
            <div className="absolute inset-0 z-10">
              {/* Corner brackets */}
              <div className={`absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300 ${scanStatus === 'success' ? 'border-green-500' : 'border-blue-500'}`}></div>
              <div className={`absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300 ${scanStatus === 'success' ? 'border-green-500' : 'border-blue-500'}`}></div>
              <div className={`absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300 ${scanStatus === 'success' ? 'border-green-500' : 'border-blue-500'}`}></div>
              <div className={`absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300 ${scanStatus === 'success' ? 'border-green-500' : 'border-blue-500'}`}></div>

              {/* Guide face oval shape (faded) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className={`w-[60%] h-[55%] border-2 rounded-[50%] transition-colors duration-500 ${scanStatus === 'success' ? 'border-green-400' : 'border-white/30 border-dashed'}`}></div>
              </div>

              {/* Scan Line Animation */}
              {scanStatus === 'scanning' && (
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-400 shadow-[0_0_15px_4px_rgba(59,130,246,0.6)] animate-face-scan-line"></div>
              )}

              {/* Success Checkmark */}
              {scanStatus === 'success' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in bg-green-500/20 backdrop-blur-sm">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl mb-3 animate-bounce">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg tracking-wide drop-shadow-md">Wajah Dikenali</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-center w-full">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          Batalkan & Kembali
        </button>
      </div>
    </div>
  )
}
