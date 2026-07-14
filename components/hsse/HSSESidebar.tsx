'use client'

import React from 'react'
import SharedSidebar from '../shared/SharedSidebar'

interface HSSESidebarProps {
  sidebarOpen: boolean
  activeNav: string
  setActiveNav: (nav: string) => void
  setSidebarOpen?: (open: boolean) => void
  pendingCount?: number
  sessionUser?: { id: string; name: string; role: string } | null
}

const mainNavItems = [
  { label: 'Verifikasi Pinjam' },
  { label: 'Pengembalian Aset' },
  { label: 'Master Aset' },
  { label: 'Pemeliharaan Aset' },
  { label: 'Kelola Pengguna' },
]

const bottomNavItems = [
  { label: 'Riwayat Peminjaman' },
  { label: 'Riwayat Pemeliharaan' },
]

const mobilePrimaryTabs = [
  { label: 'Verifikasi Pinjam', shortLabel: 'Verifikasi' },
  { label: 'Pengembalian Aset', shortLabel: 'Kembali' },
  { label: 'Master Aset', shortLabel: 'Master' },
  { label: 'Pemeliharaan Aset', shortLabel: 'Pelihara' },
]

const mobileMoreItems = [
  { label: 'Kelola Pengguna' },
  { label: 'Riwayat Peminjaman' },
  { label: 'Riwayat Pemeliharaan' },
]

export default function HSSESidebar(props: HSSESidebarProps) {
  return (
    <SharedSidebar
      {...props}
      dashboardTitle="HSSE Dashboard"
      mainNavItems={mainNavItems}
      bottomNavItems={bottomNavItems}
      mobilePrimaryTabs={mobilePrimaryTabs}
      mobileMoreItems={mobileMoreItems}
    />
  )
}