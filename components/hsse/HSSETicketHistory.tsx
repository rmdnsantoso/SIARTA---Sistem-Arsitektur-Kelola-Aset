'use client'

import React from 'react'
import TicketHistory from '../admin/TicketHistory'
import { Ticket } from '../../types/ticket'

interface HSSETicketHistoryProps {
  tickets: Ticket[]
}

import { getTicketsForHSSE } from '../../actions/core/ticket'

export default function HSSETicketHistory({ tickets }: HSSETicketHistoryProps) {

  return (
    <div className="hsse-ticket-history">
      <TicketHistory tickets={tickets} fetchAction={getTicketsForHSSE} />
    </div>
  )
}
