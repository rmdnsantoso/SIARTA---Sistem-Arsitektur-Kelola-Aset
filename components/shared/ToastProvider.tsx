'use client'

import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'

export default function ToastProvider() {
  const [position, setPosition] = useState<'top-center' | 'bottom-right'>('bottom-right')

  useEffect(() => {
    const updatePosition = () => {
      setPosition(window.innerWidth < 640 ? 'top-center' : 'bottom-right')
    }
    
    // Set initial position based on window width
    updatePosition()
    
    // Update position on resize
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [])

  return (
    <Toaster 
      position={position} 
      toastOptions={{
        duration: 4000,
        style: {
          background: '#ffffff',
          color: '#111827',
          padding: '14px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          fontSize: '14px',
          fontWeight: 500,
          border: '1px solid #f3f4f6',
          maxWidth: '400px'
        },
        success: {
          iconTheme: {
            primary: '#059669',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#dc2626',
            secondary: '#ffffff',
          },
        },
      }}
    />
  )
}
