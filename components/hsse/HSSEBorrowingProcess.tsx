'use client'

import React from 'react'
import BorrowingProcess from '../admin/BorrowingProcess'
import { Ticket } from '../../lib/dummyData'

interface HSSEBorrowingProcessProps {
  tickets: Ticket[]
}

export default function HSSEBorrowingProcess({ tickets }: HSSEBorrowingProcessProps) {
  return (
    <div className="hsse-borrowing-process">
      <BorrowingProcess tickets={tickets} />
    </div>
  )
}
