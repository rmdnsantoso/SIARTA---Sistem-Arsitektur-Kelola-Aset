const fs = require('fs');
const files = [
  'components/admin/BorrowingProcess.tsx',
  'components/admin/ReturnProcess.tsx',
  'components/hsse/HSSEBorrowingProcess.tsx',
  'components/hsse/HSSEReturnProcess.tsx',
  'components/hsse/HSSETicketHistory.tsx',
  'components/areahead/TicketTable.tsx',
  'components/peminjam/TiketSaya.tsx',
  'components/peminjam/RiwayatPinjam.tsx'
];

files.forEach(f => {
  try {
    let code = fs.readFileSync(f, 'utf8');
    if (!code.includes("import { useRouter } from 'next/navigation'")) {
      code = code.replace(/'use client'\r?\n/, "'use client'\nimport { useRouter } from 'next/navigation'\nimport { usePolling } from '../../hooks/usePolling'\n");
      fs.writeFileSync(f, code);
      console.log('Fixed imports for', f);
    }
  } catch (e) {
    console.error('Error in', f, e.message);
  }
});
