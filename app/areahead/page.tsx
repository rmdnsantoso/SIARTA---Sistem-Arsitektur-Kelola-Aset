'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Ticket, TicketStatus } from '../../types/ticket'
import Sidebar from '../../components/areahead/AreaHeadSidebar'
import TopHeader from '../../components/shared/TopHeader'
import StatCard from '../../components/shared/StatCard'
import TicketTable from '../../components/areahead/TicketTable'
import ConfirmModal from '../../components/areahead/ConfirmModal'
import AnalyticsContent from '../../components/shared/AnalyticsContent'
import AssetMaster from '../../components/admin/AssetMaster'
import UserManagement from '../../components/admin/UserManagement'
import TicketHistory from '../../components/admin/TicketHistory'
import MaintenanceHistoryAreaHead from '../../components/areahead/MaintenanceHistoryAreaHead'
import { usePolling } from '../../hooks/usePolling'
import { getTicketsForAreaHead } from '../../actions/core/ticket'
import { approveTicketByAreaHead, rejectTicketByAreaHead } from '../../actions/workflows/approval'
import { getLoggedInUser } from '../../actions/core/session'
import { adaptTickets } from '../../types/db'

export default function ApprovalDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('Verifikasi Pinjam')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [modal, setModal] = useState<{ ticket: Ticket; action: 'Setujui' | 'Tolak' } | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null)

  const refreshData = async () => {
    try {
      const [dbTickets, sessionRes] = await Promise.all([
        getTicketsForAreaHead(1, 100),
        getLoggedInUser()
      ])
      setTickets(adaptTickets(dbTickets.data))
      if (sessionRes.success && sessionRes.user) {
        setCurrentUser({ id: sessionRes.user.id, name: sessionRes.user.name, role: sessionRes.user.role })
      }
    } catch (err) {
      console.error('Gagal memuat ulang data area head:', err)
    } finally {
      setLoading(false)
    }
  }

  usePolling(refreshData, 15000)

  const handleAction = (ticket: Ticket, action: 'Setujui' | 'Tolak') => {
    if (ticket.overallStatus !== 'Menunggu' || ticket.currentStage !== 'Area Head') return
    setModal({ ticket, action })
  }

  const pendingCount = tickets.filter(
    (t) => t.overallStatus === 'Menunggu' && t.currentStage === 'Area Head'
  ).length

  const handleConfirm = async (catatan?: string) => {
    if (!modal) return
    const { ticket, action } = modal

    if (action === 'Setujui') {
      if (ticket.dbId) {
        const res = await approveTicketByAreaHead(ticket.dbId, catatan)
        if (!res.success) {
          toast.error(`Gagal menyetujui pengajuan: ${res.error}`)
          return
        }
      }
    } else {
      if (ticket.dbId) {
        const res = await rejectTicketByAreaHead(ticket.dbId, catatan || 'Ditolak Area Head')
        if (!res.success) {
          toast.error(`Gagal menolak pengajuan: ${res.error}`)
          return
        }
      }
    }

    await refreshData()
    toast.success(
      action === 'Setujui'
        ? `Pengajuan ${ticket.id} berhasil disetujui.`
        : `Pengajuan ${ticket.id} ditolak.`
    )
    setModal(null)
  }

  const stats = [
    { label: 'Menunggu Persetujuan', value: pendingCount, iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'amber' as const },
    { label: 'Total Pengajuan', value: tickets.length, iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', colorTheme: 'blue' as const },
    { label: 'Disetujui Area Head', value: tickets.filter((t) => t.overallStatus === 'Disetujui' || (t.flow.find(f => f.stage === 'Area Head')?.status === 'Disetujui')).length, iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'green' as const },
    { label: 'Ditolak Area Head', value: tickets.filter((t) => t.overallStatus === 'Ditolak' && (t.currentStage as string).includes('Area Head')).length, iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'red' as const },
  ]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Memuat data area head...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        activeNav={activeNav} 
        setActiveNav={setActiveNav} 
        pendingCount={pendingCount}
        sessionUser={currentUser}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          userName={currentUser?.name || 'Area Head'}
          userId={currentUser?.id}
          roleName="Area Head"
          hideHamburgerOnMobile={true}
        />

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8">


          {activeNav === 'Analitik' && <AnalyticsContent />}
          
          {activeNav === 'Verifikasi Pinjam' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-6 shrink-0">
                {stats.map((card) => (
                  <StatCard key={card.label} {...card} />
                ))}
              </div>
              <TicketTable tickets={tickets.filter(t => t.overallStatus === 'Menunggu' && t.currentStage === 'Area Head')} handleAction={handleAction} />
            </>
          )}

          {activeNav === 'Master Aset' && <AssetMaster isViewOnly={true} />}
          {activeNav === 'Kelola Pengguna' && <UserManagement isViewOnly={true} currentUserId={currentUser?.id} />}
          {activeNav === 'Riwayat Peminjaman' && <TicketHistory tickets={tickets} />}
          {activeNav === 'Riwayat Pemeliharaan' && <MaintenanceHistoryAreaHead />}
        </div>
      </div>

      {modal && (
        <ConfirmModal
          ticket={modal.ticket}
          action={modal.action}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
