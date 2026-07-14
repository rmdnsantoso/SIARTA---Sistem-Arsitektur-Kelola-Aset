'use client'

import React from 'react'
import SharedSidebar from '../shared/SharedSidebar'

interface PeminjamSidebarProps {
  sidebarOpen: boolean
  activeNav: string
  setActiveNav: (nav: string) => void
  setSidebarOpen?: (open: boolean) => void
  sessionUser?: { id: string; name: string; role: string } | null
}

const mainNavItems = [
  { label: 'Katalog Alat' },
  { label: 'Tiket Saya' },
  { label: 'Riwayat Pinjam' },
]

const mobilePrimaryTabs = [
  { label: 'Katalog Alat', shortLabel: 'Katalog' },
  { label: 'Tiket Saya', shortLabel: 'Tiket' },
  { label: 'Riwayat Pinjam', shortLabel: 'Riwayat' },
]

export default function PeminjamSidebar(props: PeminjamSidebarProps) {
  return (
    <SharedSidebar
      {...props}
      dashboardTitle="Peminjam Dashboard"
      mainNavItems={mainNavItems}
      mobilePrimaryTabs={mobilePrimaryTabs}
    />
  )
}
