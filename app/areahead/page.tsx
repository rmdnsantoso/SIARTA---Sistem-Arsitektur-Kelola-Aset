'use client'

import { useState } from 'react'
import { Ticket, TicketStatus } from '../../types/ticket'
import { initialTickets } from '../../lib/dummyData'
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

export default function ApprovalDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [activeNav, setActiveNav] = useState('Verifikasi Pinjam')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [modal, setModal] = useState<{ ticket: Ticket; action: 'Setujui' | 'Tolak' } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const pendingCount = tickets.filter(
    (t) => t.overallStatus === 'Menunggu' && t.currentStage === 'Area Head'
  ).length

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleAction = (ticket: Ticket, action: 'Setujui' | 'Tolak') => {
    if (ticket.overallStatus !== 'Menunggu' || ticket.currentStage !== 'Area Head') return
    setModal({ ticket, action })
  }

  const handleConfirm = (catatan?: string) => {
    if (!modal) return
    const { ticket, action } = modal
    const newStatus: TicketStatus = action === 'Setujui' ? 'Disetujui' : 'Ditolak'
    const newStage = action === 'Setujui' ? 'Serah Terima' : 'Area Head'
    
    setTickets((prev) =>
      prev.map((t) =>
        t.id !== ticket.id ? t : {
          ...t, 
          overallStatus: newStatus,
          currentStage: newStage,
          flow: t.flow.map((f) => f.stage === 'Area Head' ? { ...f, status: newStatus } : f),
          trackingLogs: [
            ...(t.trackingLogs || []),
            {
              stage: 'Area Head',
              status: action === 'Setujui' ? 'Disetujui untuk operasi lapangan.' : 'Pengajuan ditolak oleh Area Head.',
              actor: 'Area Head',
              timestamp: new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
              notes: catatan
            }
          ]
        }
      )
    )
    showToast(
      action === 'Setujui'
        ? `Pengajuan ${ticket.id} berhasil disetujui.`
        : `Pengajuan ${ticket.id} ditolak.`,
      action === 'Setujui' ? 'success' : 'error'
    )
    setModal(null)
  }

  const stats = [
    { label: 'Menunggu Persetujuan', value: pendingCount, iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'amber' as const },
    { label: 'Total Pengajuan', value: tickets.length, iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', colorTheme: 'blue' as const },
    { label: 'Selesai Disetujui', value: tickets.filter((t) => t.overallStatus === 'Disetujui').length, iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'green' as const },
    { label: 'Konflik Stok', value: tickets.filter((t) => t.conflictWith && t.overallStatus === 'Menunggu').length, iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', colorTheme: 'red' as const },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        activeNav={activeNav} 
        setActiveNav={setActiveNav} 
        pendingCount={pendingCount} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <TopHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          userName="John Doe"
          roleName="Area Head"
        />

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          
          {activeNav !== 'Analitik' && activeNav !== 'Verifikasi Pinjam' && (
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{activeNav}</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Pusat Kendali Manajerial (Area Head)</p>
            </div>
          )}

          {activeNav === 'Analitik' && <AnalyticsContent />}
          
          {activeNav === 'Verifikasi Pinjam' && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 shrink-0">
                {stats.map((card) => (
                  <StatCard key={card.label} {...card} />
                ))}
              </div>

              <TicketTable tickets={tickets} handleAction={handleAction} />
            </>
          )}

          {activeNav === 'Master Aset' && <AssetMaster isViewOnly={true} />}
          {activeNav === 'Kelola Pengguna' && <UserManagement isViewOnly={true} />}
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

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
