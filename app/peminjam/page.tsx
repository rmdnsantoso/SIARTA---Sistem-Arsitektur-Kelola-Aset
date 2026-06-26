'use client'

import { useState, useEffect } from 'react'
import PeminjamSidebar from '../../components/peminjam/PeminjamSidebar'
import TopHeader from '../../components/shared/TopHeader'
import KatalogAlat from '../../components/peminjam/KatalogAlat'
import TiketSaya from '../../components/peminjam/TiketSaya'
import RiwayatPinjam from '../../components/peminjam/RiwayatPinjam'
import { initialTickets } from '../../lib/dummyData'
import NotificationDropdown from '../../components/peminjam/NotificationDropdown'

export default function PeminjamDashboard() {
  const [activeNav, setActiveNav] = useState('Katalog Alat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tickets, setTickets] = useState(initialTickets)

  useEffect(() => {
    setTickets(initialTickets)
  }, [])

  const handleAddTicket = (newTicketData: any) => {
    const newId = `TK-${String(tickets.length + 1).padStart(3, '0')}`
    const newTicket = { id: newId, ...newTicketData }
    setTickets((prev: any) => [newTicket, ...prev])
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900 relative">
      <PeminjamSidebar
        sidebarOpen={sidebarOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          userName="Ahmad"
          roleName="Peminjam"
          hideNotificationBell={true}
          hideHamburgerOnMobile={true}
          customNotificationNode={<NotificationDropdown tickets={tickets} peminjamName="Ahmad" />}
        />

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{activeNav}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
              {activeNav === 'Katalog Alat' && 'Pilih alat dan ajukan peminjaman dengan mudah.'}
              {activeNav === 'Tiket Saya' && 'Pantau status pengajuan peminjaman Anda di sini.'}
              {activeNav === 'Riwayat Pinjam' && 'Catatan riwayat peminjaman Anda sebelumnya.'}
            </p>
          </div>
          
          {activeNav === 'Katalog Alat' && <KatalogAlat onAddTicket={handleAddTicket} />}
          {activeNav === 'Tiket Saya' && <TiketSaya tickets={tickets} onUpdateTickets={setTickets} />}
          {activeNav === 'Riwayat Pinjam' && <RiwayatPinjam tickets={tickets} />}
        </div>
      </div>
    </div>
  )
}