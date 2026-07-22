import React, { useState } from 'react'
import { Ticket } from '../../types/ticket'

interface ConfirmModalProps {
  ticket: Ticket
  action: 'Setujui' | 'Tolak'
  onConfirm: (catatan?: string) => Promise<void>
  onCancel: () => void
}

export default function ConfirmModal({ ticket, action, onConfirm, onCancel }: ConfirmModalProps) {
  const [catatan, setCatatan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isApprove = action === 'Setujui'

  React.useEffect(() => {
    setCatatan('')
  }, [ticket.id])

  const handleConfirm = async () => {
    if (!isApprove && !catatan.trim()) return
    setIsSubmitting(true)
    try {
      await onConfirm(catatan)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className={`px-4 sm:px-6 py-4 flex items-center justify-between ${
          isApprove ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold">
              {isApprove ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
            </h3>
            <p className="text-xs sm:text-sm opacity-90 mt-1">
              Tiket: {ticket.id}
            </p>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
            <div className="text-sm font-bold text-gray-900">{ticket.alat}</div>
            <div className="text-xs text-gray-500 mt-1">Pemohon: <strong className="text-gray-900">{ticket.peminjam}</strong></div>
            <div className="text-xs text-gray-500 mt-0.5">Diminta: <strong className="text-gray-900">{ticket.jumlah}</strong> unit</div>
          </div>

          {isApprove ? (
            <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-xl">
              <p className="text-sm text-blue-800 font-medium">Anda akan menyetujui pengajuan ini untuk dilanjutkan ke tahap Serah Terima.</p>
            </div>
          ) : null}

          {!isApprove && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-xl">
                <p className="text-sm text-red-800 font-medium">Anda akan menolak pengajuan ini. Harap berikan alasan yang jelas agar pemohon mengerti.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Alasan Penolakan <span className="text-red-500">*</span></label>
                <textarea 
                  spellCheck={false}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Misal: Proyek dihentikan sementara..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] resize-y"
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100 transition-colors w-full sm:w-auto disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            onClick={handleConfirm}
            disabled={(!isApprove && !catatan.trim()) || isSubmitting}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all shadow-sm w-full sm:w-auto ${
              (!isApprove && !catatan.trim()) || isSubmitting
                ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                : isApprove 
                  ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-md' 
                  : 'bg-red-600 hover:bg-red-700 hover:shadow-md'
            }`}
          >
            {isSubmitting && (
              <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? 'Proses...' : isApprove ? 'Setujui' : 'Konfirmasi Tolak'}
          </button>
        </div>
      </div>
    </div>
  )
}
