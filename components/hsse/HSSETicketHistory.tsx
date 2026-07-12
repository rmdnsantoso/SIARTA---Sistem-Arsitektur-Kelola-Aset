'use client'

import React from 'react'
import TicketHistory from '../admin/TicketHistory'
import { Ticket } from '../../lib/dummyData'

interface HSSETicketHistoryProps {
  tickets: Ticket[]
}

export default function HSSETicketHistory({ tickets }: HSSETicketHistoryProps) {

  return (
    <div className="hsse-ticket-history">
      <TicketHistory tickets={tickets} />
    </div>
  )
}
