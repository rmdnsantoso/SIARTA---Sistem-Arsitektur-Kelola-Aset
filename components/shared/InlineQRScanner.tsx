'use client'

import React, { useEffect, useRef, useState } from 'react'

interface InlineQRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (decodedText: string) => void
}

export default function InlineQRScanner({ isOpen, onClose, onScanSuccess }: InlineQRScannerProps) {
  const [error, setError] = useState<string>('')
  const scannerRef = useRef<any>(null)
  const isScanning = useRef(false)
  const isMounted = useRef(true)
  const isTransitioning = useRef(false)
  const lastScanned = useRef<string>('')
  // Always hold the latest callback without triggering effect re-runs
  const onScanSuccessRef = useRef(onScanSuccess)
  const idBase = React.useId().replace(/:/g, '')
  const scannerId = `qr-reader-${idBase}`

  // Keep ref current on every render (no deps = runs after every render)
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess
  })

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(async () => {
        try {
          const { Html5Qrcode } = await import('html5-qrcode')

          if (!isMounted.current) return
          if (!document.getElementById(scannerId)) return

          if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(scannerId)
          }

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          }

          if (!isScanning.current && !isTransitioning.current) {
            isTransitioning.current = true
            scannerRef.current.start(
              { facingMode: 'environment' },
              config,
              (decodedText: string) => {
                if (isScanning.current) {
                  if (lastScanned.current !== decodedText) {
                    lastScanned.current = decodedText
                    // Call via ref so we always use the latest callback
                    // without ever needing to restart the scanner
                    onScanSuccessRef.current(decodedText)
                    setTimeout(() => { lastScanned.current = '' }, 2000)
                  }
                }
              },
              (_errorMessage: string) => {
                // Frame-level scan errors are expected – ignored
              }
            ).then(() => {
              isScanning.current = true
              isTransitioning.current = false
              setError('')
            }).catch((err: any) => {
              isTransitioning.current = false
              console.error('Camera error:', err)
              setError('Gagal mengakses kamera. Pastikan Anda telah memberikan izin kamera pada browser Anda.')
            })
          }
        } catch (e) {
          console.error('Failed to load html5-qrcode module:', e)
          setError('Terjadi kesalahan saat memuat modul pemindai.')
        }
      }, 150)

      return () => {
        clearTimeout(timer)
      }
    } else {
      // Cleanup when closed — reset all refs so re-opening is always fresh
      if (scannerRef.current && isScanning.current && !isTransitioning.current) {
        isScanning.current = false
        isTransitioning.current = true
        try {
          scannerRef.current.stop().then(() => {
            try { scannerRef.current?.clear() } catch(e) {}
            scannerRef.current = null       // fresh instance on next open
            lastScanned.current = ''        // allow re-scanning same QR
          }).catch((err: any) => {
            // Ignore DOM errors
            scannerRef.current = null
            lastScanned.current = ''
          }).finally(() => {
            isTransitioning.current = false
          })
        } catch (e) {
          scannerRef.current = null
          lastScanned.current = ''
          isTransitioning.current = false
        }
      }
    }
  // ONLY depend on isOpen — onScanSuccess is handled via ref above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (scannerRef.current && isScanning.current && !isTransitioning.current) {
        try {
          scannerRef.current.stop().then(() => {
            try { scannerRef.current?.clear() } catch(e) {}
          }).catch(() => {})
        } catch(e) {}
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="w-full flex flex-col items-center justify-center bg-gray-50 rounded-xl overflow-hidden animate-fade-in border border-blue-200 mt-2 mb-4">
      <style>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2.5s infinite ease-in-out;
        }
        #${scannerId} img { display: none !important; }
        #${scannerId}__dashboard_section_csr span { display: none !important; }
        #${scannerId}__dashboard_section_swaplink { display: none !important; }
      `}</style>

      <div className="flex items-center justify-between p-3 w-full bg-blue-50/50 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-bold text-blue-900">Kamera Aktif</span>
        </div>
        <button
          onClick={() => {
            if (scannerRef.current && isScanning.current) {
              isScanning.current = false
              try {
                scannerRef.current.stop().catch(() => {})
              } catch (e) {}
            }
            onClose()
          }}
          className="text-xs px-2 py-1 bg-white border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Tutup Kamera
        </button>
      </div>

      <div className="p-4 w-full flex flex-col items-center relative">
        {error ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center w-full">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        ) : (
          <div className="relative w-full max-w-[280px] aspect-square mx-auto">
            <div id={scannerId} className="w-full h-full overflow-hidden rounded-2xl bg-gray-900 shadow-inner"></div>

            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl z-10 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-2xl z-10 pointer-events-none"></div>

            <div className="absolute top-0 left-2 right-2 h-[2px] bg-blue-400 shadow-[0_0_10px_2px_rgba(59,130,246,0.5)] z-10 animate-scan-line pointer-events-none"></div>
          </div>
        )}

        {!error && (
          <p className="text-gray-500 text-xs mt-3 text-center animate-pulse">
            Arahkan kotak ke QR Code / Barcode Aset
          </p>
        )}
      </div>
    </div>
  )
}
