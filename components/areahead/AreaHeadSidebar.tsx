'use client'

import React from 'react'
import SharedSidebar from '../shared/SharedSidebar'

interface SidebarProps {
  sidebarOpen: boolean
  activeNav: string
  setActiveNav: (nav: string) => void
  setSidebarOpen?: (open: boolean) => void
  pendingCount: number
  sessionUser?: { id: string; name: string; role: string } | null
}

const mainNavItems = [
  { label: 'Verifikasi Pinjam' },
  { label: 'Master Aset' },
  { label: 'Kelola Pengguna' },
  { label: 'Analitik' },
]

const bottomNavItems = [
  { label: 'Riwayat Peminjaman' },
  { label: 'Riwayat Pemeliharaan' },
]

const mobilePrimaryTabs = [
  { label: 'Verifikasi Pinjam', shortLabel: 'Verifikasi' },
  { label: 'Master Aset', shortLabel: 'Master' },
  { label: 'Kelola Pengguna', shortLabel: 'Pengguna' },
  { label: 'Analitik', shortLabel: 'Analitik' },
]

const mobileMoreItems = [
  { label: 'Riwayat Peminjaman' },
  { label: 'Riwayat Pemeliharaan' },
]

export default function Sidebar(props: SidebarProps) {
  return (
    <SharedSidebar
      {...props}
      dashboardTitle="Area Head Dashboard"
      mainNavItems={mainNavItems}
      bottomNavItems={bottomNavItems}
      mobilePrimaryTabs={mobilePrimaryTabs}
      mobileMoreItems={mobileMoreItems}
    />
  )
}
