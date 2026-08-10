'use client'

import React, { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

export interface LiveCameraCaptureProps {
  maxPhotos?: number
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  isCameraOpen: boolean
  setIsCameraOpen: (isOpen: boolean) => void
}

export default function LiveCameraCapture({ 
  maxPhotos = 5, 
  photos, 
  onPhotosChange, 
  isCameraOpen, 
  setIsCameraOpen 
}: LiveCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isCameraOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch(err => {
          console.error(err)
          toast.error('Gagal mengakses kamera. Pastikan izin telah diberikan.')
          setIsCameraOpen(false)
        })
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [isCameraOpen, setIsCameraOpen])

  if (!isCameraOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black items-center justify-center">
      <div className="relative w-full max-w-md h-full sm:h-[80vh] sm:rounded-2xl overflow-hidden bg-gray-900 flex flex-col">
        <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 w-full z-10">
          <span className="text-white font-mono text-sm">KAMERA AKTIF ({photos.length}/{maxPhotos})</span>
          <button onClick={() => setIsCameraOpen(false)} className="text-white hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">
          <video ref={videoRef} autoPlay playsInline className="absolute min-w-full min-h-full object-cover" />
          {/* Target bracket */}
          <div className="absolute w-48 h-48 border-2 border-white/20 z-10 flex flex-col justify-between pointer-events-none">
            <div className="w-full flex justify-between"><div className="w-4 h-4 border-t-2 border-l-2 border-white"></div><div className="w-4 h-4 border-t-2 border-r-2 border-white"></div></div>
            <div className="w-full flex justify-between"><div className="w-4 h-4 border-b-2 border-l-2 border-white"></div><div className="w-4 h-4 border-b-2 border-r-2 border-white"></div></div>
          </div>
        </div>

        <div className="h-32 bg-black flex items-center justify-between px-8 pb-4 z-10">
          <div className="w-16">
            {photos.length > 0 && (
              <div className="relative">
                <img src={photos[photos.length - 1]} className="w-12 h-12 object-cover rounded-md border-2 border-white" alt="Last capture" />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {photos.length}
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              if (photos.length >= maxPhotos) {
                toast.error(`Maksimal ${maxPhotos} foto telah tercapai.`);
                return;
              }
              if (videoRef.current) {
                let targetWidth = videoRef.current.videoWidth;
                let targetHeight = videoRef.current.videoHeight;
                const MAX_WIDTH = 800;
                if (targetWidth > MAX_WIDTH) {
                  targetHeight = Math.floor((MAX_WIDTH / targetWidth) * targetHeight);
                  targetWidth = MAX_WIDTH;
                }
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);
                  const base64 = canvas.toDataURL('image/jpeg', 0.6);
                  onPhotosChange([...photos, base64]);
                  toast.success(`Foto ${photos.length + 1}/${maxPhotos} berhasil ditangkap!`);
                }
              }
            }}
            className={`w-16 h-16 rounded-full border-4 border-white transition-colors ${photos.length >= maxPhotos ? 'bg-gray-600' : 'bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
          ></button>
          <div className="w-16 flex justify-end">
            <button onClick={() => setIsCameraOpen(false)} className="text-white font-bold text-sm bg-gray-800 px-4 py-2 rounded-full hover:bg-gray-700 transition-colors">
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
