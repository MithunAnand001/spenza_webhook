import { WebhookEventStatus } from '../types/api.types';

type SubscriptionStatus = 'active' | 'inactive';
type AllStatuses = WebhookEventStatus | SubscriptionStatus;

export default function StatusBadge({ status }: { status: AllStatuses }) {
  const colors: Record<AllStatuses, string> = {
    [WebhookEventStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [WebhookEventStatus.PROCESSING]: 'bg-blue-100 text-blue-800 border-blue-200',
    [WebhookEventStatus.DELIVERED]: 'bg-emerald-100 text-green-800 border-emerald-200',
    [WebhookEventStatus.FAILED]: 'bg-rose-100 text-red-800 border-rose-200',
    [WebhookEventStatus.RETRYING]: 'bg-amber-100 text-amber-800 border-amber-200',
    active: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    inactive: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <span
      className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-md border ${colors[status] || 'bg-slate-100 text-slate-800 border-slate-200'}`}
      role="status"
    >
      {status.toUpperCase()}
    </span>
  );
}
