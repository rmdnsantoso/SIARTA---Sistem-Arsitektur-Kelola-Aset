'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { changeUserPassword } from '../../actions/core/user'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  roleName: string
}

export default function UserProfileModal({ isOpen, onClose, userId, userName, roleName }: UserProfileModalProps) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter.')
      return
    }

    setIsLoading(true)
    try {
      const res = await changeUserPassword(userId, oldPassword, newPassword)
      if (res.success) {
        toast.success('Password berhasil diubah.')
        setShowForm(false)
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => onClose(), 1500)
      } else {
        toast.error(res.error || 'Gagal mengubah password.')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan pada server.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-sm rounded-3xl sm:rounded-[2rem] shadow-2xl p-5 sm:p-8 animate-fade-in-up mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-5 sm:mb-6 mt-1 sm:mt-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border-[3px] sm:border-[4px] border-slate-700/50 shadow-inner">
            <span className="text-2xl sm:text-3xl font-extrabold">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-800">{userName}</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{roleName}</p>
        </div>

        {!showForm ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 sm:py-3.5 px-4 bg-slate-50 hover:bg-slate-800 text-slate-700 hover:text-white rounded-xl sm:rounded-2xl font-bold text-[11px] transition-colors border border-slate-100 hover:border-slate-700 flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Ganti Password
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-amber-50 rounded-xl sm:rounded-2xl border border-amber-100">
              <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                <span className="font-bold text-amber-800">Catatan:</span> Penggantian password hanya dapat dilakukan satu kali. Jika Anda lupa atau ingin mengubah kembali, silakan hubungi Admin.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1 ml-0.5">Password Saat Ini</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-3 sm:px-4 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all font-medium"
                placeholder="Masukkan password acak dari Admin"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1 ml-0.5">Password Baru</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-3 sm:px-4 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all font-medium"
                placeholder="Minimal 8 karakter"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1 ml-0.5">Konfirmasi Password Baru</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-3 sm:px-4 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all font-medium"
                placeholder="Ulangi password baru"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={isLoading}
                className="flex-1 py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex justify-center py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors text-xs shadow-lg shadow-slate-800/30 disabled:opacity-70"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
