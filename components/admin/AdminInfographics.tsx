import StatCard from '../dashboard/StatCard'

export default function AdminInfographics() {
  const stats = [
    { label: 'Total Aset Aktif', value: 1245, iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: 'Sedang Dipinjam', value: 156, iconPath: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { label: 'Peringatan Stok Tipis', value: 8, iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { label: 'Pemeliharaan / Rusak', value: 23, iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grafik Peminjaman Mingguan</h3>
          <div className="h-64 bg-gray-50 rounded flex items-end justify-between p-4 gap-2">
            {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
              <div key={i} className="w-full bg-blue-100 rounded-t relative group">
                <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all duration-500"></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 px-4">
            <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terakhir</h3>
          <div className="space-y-4">
            {[
              { text: 'Ahmad mengembalikan 2 unit Gas Detector', time: '10 menit yang lalu' },
              { text: 'Budi mengajukan peminjaman Safety Harness', time: '1 jam yang lalu' },
              { text: 'Stok APAR di Gudang Timur tersisa 3 unit', time: '2 jam yang lalu', alert: true },
              { text: 'Audit stok bulanan selesai dilakukan', time: 'Kemarin' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 mt-1.5 rounded-full ${activity.alert ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <div>
                  <p className={`text-sm ${activity.alert ? 'font-semibold text-red-600' : 'text-gray-700'}`}>{activity.text}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
