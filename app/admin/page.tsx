'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '../../components/admin/AdminSidebar'
import TopHeader from '../../components/shared/TopHeader'
import AnalyticsContent from '../../components/shared/AnalyticsContent'
import UserManagement from '../../components/admin/UserManagement'
import AssetMaster from '../../components/admin/AssetMaster'
import BorrowingProcess from '../../components/admin/BorrowingProcess'
import AssetMaintenance from '../../components/admin/AssetMaintenance'
import ReturnProcess from '../../components/admin/ReturnProcess'
import TicketHistory from '../../components/admin/TicketHistory'
import MaintenanceHistory from '../../components/admin/MaintenanceHistory'
import { usePolling } from '../../hooks/usePolling'
import { useRealtimeRefetch } from '../../hooks/useRealtimeRefetch'
import { getAllTickets } from '../../actions/core/ticket'
import { getLoggedInUser } from '../../actions/core/session'
import { adaptTickets } from '../../types/db'
import type { Ticket } from '../../types/ticket'

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState('Verifikasi Pinjam')
  const [isNavInitialized, setIsNavInitialized] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('admin_activeNav')
    if (saved) setActiveNav(saved)
    setIsNavInitialized(true)
  }, [])

  useEffect(() => {
    if (isNavInitialized) localStorage.setItem('admin_activeNav', activeNav)
  }, [activeNav, isNavInitialized])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null)

  const refreshData = useCallback(async () => {
    try {
      const [dbTickets, sessionRes] = await Promise.all([
        getAllTickets(1, 100),
        getLoggedInUser()
      ])
      setTickets(adaptTickets(dbTickets.data))
      if (sessionRes.success && sessionRes.user) {
        setCurrentUser({ id: sessionRes.user.id, name: sessionRes.user.name, role: sessionRes.user.role })
      }
    } catch (err) {
      console.error('Gagal memuat ulang tiket admin:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useRealtimeRefetch('Ticket', refreshData)
  usePolling(refreshData, 60000)

  const adminPendingCount = tickets.filter(
    (t) => t.overallStatus === 'Menunggu' && t.currentStage === 'Admin'
  ).length

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Memuat data admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900 relative">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        pendingCount={adminPendingCount}
        sessionUser={currentUser}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          userName={currentUser?.name || 'Admin'} 
          userId={currentUser?.id}
          roleName="Admin" 
          hideHamburgerOnMobile={true}
          onNewNotification={refreshData}
        />
        
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8">

          
          {activeNav === 'Verifikasi Pinjam' && <BorrowingProcess tickets={tickets} onSuccess={refreshData} />}
          {activeNav === 'Pengembalian Aset' && <ReturnProcess tickets={tickets} onSuccess={refreshData} />}
          {activeNav === 'Riwayat Peminjaman' && <TicketHistory tickets={tickets} />}
          {activeNav === 'Riwayat Pemeliharaan' && <MaintenanceHistory />}
          {activeNav === 'Analitik' && <AnalyticsContent />}
          {activeNav === 'Kelola Pengguna' && <UserManagement currentUserId={currentUser?.id} />}
          {activeNav === 'Master Aset' && <AssetMaster />}
          {activeNav === 'Pemeliharaan Aset' && <AssetMaintenance />}
        </div>
      </div>
    </div>
  )
}
