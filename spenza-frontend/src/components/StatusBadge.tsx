
export default function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    delivered: 'bg-emerald-100 text-green-800 border-emerald-200',
    failed: 'bg-rose-100 text-red-800 border-rose-200',
    retrying: 'bg-amber-100 text-amber-800 border-amber-200',
    active: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    inactive: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <span 
      className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-md border ${colors[normalizedStatus] || 'bg-slate-100 text-slate-800 border-slate-200'}`}
      role="status"
    >
      {normalizedStatus.toUpperCase()}
    </span>
  );
}