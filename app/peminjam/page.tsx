'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import PeminjamSidebar from '../../components/peminjam/PeminjamSidebar'
import TopHeader from '../../components/shared/TopHeader'
import KatalogAlat from '../../components/peminjam/KatalogAlat'
import TiketSaya from '../../components/peminjam/TiketSaya'
import RiwayatPinjam from '../../components/peminjam/RiwayatPinjam'
import NotificationDropdown from '../../components/peminjam/NotificationDropdown'
import { getTicketsByUser } from '../../actions/core/ticket'
import { getAvailableAssets } from '../../actions/core/asset'
import { createBorrowTicket } from '../../actions/workflows/peminjaman'
import { adaptTickets } from '../../types/db'
import type { Ticket } from '../../types/ticket'

export default function PeminjamDashboard() {
  const [activeNav, setActiveNav] = useState('Katalog Alat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Ahmad pakai ID tetap dari seed (simulasi sesi login)
  const AHMAD_USER_ID = 'usr-peminjam-01'

  const refreshData = async () => {
    try {
      const [dbTickets, dbAssets] = await Promise.all([
        getTicketsByUser(AHMAD_USER_ID),
        getAvailableAssets()
      ])
      setTickets(adaptTickets(dbTickets))
      if (dbAssets.success && dbAssets.data) {
        const adaptedAssets = dbAssets.data.map((a: any) => {
          return {
            id: a.id,
            name: a.name,
            totalStock: a.computedTotalStock,
            availableStock: a.computedAvailableStock,
            trackingType: a.isSerialized ? 'SERIALIZED' : 'NON_SERIALIZED',
            imageUrl: a.spec || ''
          }
        })
        setAssets(prev => JSON.stringify(prev) !== JSON.stringify(adaptedAssets) ? adaptedAssets : prev)
      }
    } catch (err) {
      console.error('Gagal memuat data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(() => {
      refreshData()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleAddTicket = async (newTicketData: any) => {
    try {
      if (newTicketData.assetId) {
        const res = await createBorrowTicket({
          assetId: newTicketData.assetId,
          jumlah: newTicketData.jumlah,
          tanggalPinjam: newTicketData.tanggalPinjam,
          tanggalKembali: newTicketData.tanggalKembali,
          alasan: newTicketData.alasan,
          notes: newTicketData.alasan
        })
        if (!res.success) {
          console.error('Gagal membuat tiket di database:', res.error)
          toast.error(`Gagal mengajukan pinjaman: ${res.error}`)
          return
        } else {
          // Refresh tiket dari database
          await refreshData()
          return
        }
      }
    } catch (err) {
      console.error(err)
    }

    // Fallback UI update jika aset dummy / tanpa DB
    const newId = `TK-${String(tickets.length + 1).padStart(3, '0')}`
    const newTicket = { id: newId, ...newTicketData }
    setTickets((prev: any) => [newTicket, ...prev])
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Memuat data...</p>
        </div>
      </div>
    )
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
          
          {activeNav === 'Katalog Alat' && <KatalogAlat onAddTicket={handleAddTicket} assets={assets.length > 0 ? assets : undefined} />}
          {activeNav === 'Tiket Saya' && <TiketSaya tickets={tickets} onSuccess={refreshData} />}
          {activeNav === 'Riwayat Pinjam' && <RiwayatPinjam tickets={tickets} />}
        </div>
      </div>
    </div>
  )
}