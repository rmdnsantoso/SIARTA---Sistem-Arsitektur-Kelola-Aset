'use client'

import React from 'react'
import ReturnProcess from '../admin/ReturnProcess'
import { Ticket } from '../../lib/dummyData'

interface HSSEReturnProcessProps {
  tickets: Ticket[]
}

export default function HSSEReturnProcess({ tickets }: HSSEReturnProcessProps) {
  return (
    <div className="hsse-return-process">
      <ReturnProcess tickets={tickets} />
    </div>
  )
}
