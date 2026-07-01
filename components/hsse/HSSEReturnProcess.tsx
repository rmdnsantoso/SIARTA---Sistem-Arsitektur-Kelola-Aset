'use client'

import React from 'react'
import ReturnProcess from '../admin/ReturnProcess'
import { Ticket } from '../../lib/dummyData'

interface HSSEReturnProcessProps {
  tickets: Ticket[]
  onSuccess?: () => void
}

export default function HSSEReturnProcess({ tickets, onSuccess }: HSSEReturnProcessProps) {
  return (
    <div className="hsse-return-process">
      <ReturnProcess tickets={tickets} onSuccess={onSuccess} />
    </div>
  )
}
