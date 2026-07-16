'use client'

import React, { useEffect, useRef } from 'react'

interface StyledQRCodeProps {
  value: string
  isSerialized: boolean
  size?: number
}

export default function StyledQRCode({ value, isSerialized, size = 110 }: StyledQRCodeProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    let mounted = true
    
    import('qr-code-styling').then((module) => {
      if (!mounted) return
      
      const QRCodeStyling = module.default

      // Indigo for Serialized, Amber for Bulk
      const colorDark1 = isSerialized ? '#312E81' : '#78350F' // indigo-900 / amber-900
      const colorDark2 = isSerialized ? '#4F46E5' : '#D97706' // indigo-600 / amber-600
      
      const qrCode = new QRCodeStyling({
        width: 300, // Use a large fixed size for precise dot calculations without forced margins
        height: 300,
        margin: 0,
        type: 'svg', // Sangat penting agar bisa diprint via outerHTML
        data: value,
        image: '/pgn-icon.png', // Logo PGN di tengah
        dotsOptions: {
          color: colorDark1,
          type: 'dots',
          gradient: {
            type: 'linear',
            rotation: Math.PI / 4,
            colorStops: [
              { offset: 0, color: colorDark1 },
              { offset: 1, color: colorDark2 }
            ]
          }
        },
        cornersSquareOptions: {
          type: 'extra-rounded',
          color: colorDark1,
        },
        cornersDotOptions: {
          type: 'dot',
          color: colorDark2,
        },
        backgroundOptions: {
          color: 'transparent',
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 0,
          imageSize: 0.4
        },
        qrOptions: {
          errorCorrectionLevel: 'H'
        }
      })

      if (ref.current) {
        ref.current.innerHTML = '' // Clear existing
        qrCode.append(ref.current)
        
        // Memastikan isi svg bisa responsif di container
        const svgElement = ref.current.querySelector('svg')
        if (svgElement) {
          svgElement.style.width = '100%'
          svgElement.style.height = '100%'
          svgElement.setAttribute('viewBox', '0 0 300 300')
        }
      }
    }).catch(err => {
      console.error("Gagal memuat qr-code-styling", err)
    })
    
    return () => {
      mounted = false
    }
  }, [value, isSerialized, size])

  return (
    <div 
      ref={ref} 
      className="qr-styled-container" 
      style={{ width: size, height: size, margin: '0 auto' }}
    />
  )
}
