import { Ticket } from '../../types/ticket'

interface ConfirmModalProps {
  ticket: Ticket
  action: 'Setujui' | 'Tolak'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ ticket, action, onConfirm, onCancel }: ConfirmModalProps) {
  const isApprove = action === 'Setujui'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {isApprove ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
          </h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            Anda akan <strong>{isApprove ? 'menyetujui' : 'menolak'}</strong> pengajuan <strong>{ticket.id}</strong> untuk alat <strong>{ticket.alat}</strong> dari <strong>{ticket.peminjam}</strong>.
          </p>
          {isApprove && ticket.conflictWith && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-2 text-sm text-red-800">
              <strong>Peringatan:</strong> Terdapat konflik ketersediaan stok dengan tiket {ticket.conflictWith}.
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors ${
              isApprove ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {action} Pengajuan
          </button>
        </div>
      </div>
    </div>
  )
}
