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
    
    // Remove imports
    code = code.replace(/import \{ useRouter \} from 'next\/navigation'[\r\n]+/, '');
    code = code.replace(/import \{ usePolling \} from '..\/..\/hooks\/usePolling'[\r\n]+/, '');
    
    // Remove hooks initialization
    code = code.replace(/[\r\n]*\s*const router = useRouter\(\);?/, '');
    code = code.replace(/[\r\n]*\s*usePolling\(\(\) => \{ router\.refresh\(\) \}, \d+\);?/, '');
    code = code.replace(/[\r\n]*\s*usePolling\(\(\) => router\.refresh\(\), \d+\);?/, '');
    
    fs.writeFileSync(f, code);
    console.log('Cleaned', f);
  } catch (e) {
    console.error('Error cleaning', f, e.message);
  }
});
