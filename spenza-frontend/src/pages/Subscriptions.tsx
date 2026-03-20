import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../api/api.service';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Icons } from '../assets/Icons';
import Modal from '../components/Modal';
import type { UserEventMapping } from '../types/api.types';

export default function Subscriptions() {
  const queryClient = useQueryClient();
  const [cancelUuid, setCancelUuid] = useState<string | null>(null);

  const { data: subs, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await ApiService.getSubscriptions();
      return res.data.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (uuid: string) => {
      await ApiService.cancelSubscription(uuid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Subscription cancelled');
      setCancelUuid(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? (err as any).response?.data?.message : 'Failed to cancel';
      toast.error(message || 'Failed to cancel');
      setCancelUuid(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Webhook Subscriptions</h2>
          <p className="mt-2 text-slate-500">Configure where your events should be delivered.</p>
        </div>
        <Link
          to="/subscriptions/new"
          className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {Icons.Plus()}
          New Subscription
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subs?.map((sub: UserEventMapping) => (
          <article 
            key={sub.uuid} 
            className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
          >
            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-4">
                <StatusBadge status={sub.isActive ? 'active' : 'inactive'} />
                <span className="text-[10px] font-mono text-slate-400 truncate w-32" title={sub.uuid}>{sub.uuid}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 truncate" title={sub.eventType?.name}>
                {sub.eventType?.name}
              </h3>
              <div className="flex items-center text-sm text-slate-500 mb-4">
                {Icons.Link()}
                <span className="truncate ml-1.5" title={sub.callbackUrl}>{sub.callbackUrl}</span>
              </div>
              <p className="text-xs text-slate-400 font-medium italic">
                Created: {sub.createdOn}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <Link
                to={`/subscriptions/${sub.uuid}`}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Manage Details
              </Link>
              {sub.isActive && (
                <button
                  onClick={() => setCancelUuid(sub.uuid)}
                  className="text-sm font-bold text-rose-600 hover:text-rose-800 transition-colors"
                  aria-label={`Cancel subscription for ${sub.eventType?.name}`}
                >
                  Cancel
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {(!subs || subs.length === 0) && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-slate-50 mb-6">
            {Icons.Empty()}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No active subscriptions</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">
            You haven't subscribed to any webhooks yet. Create your first one to start receiving events.
          </p>
          <Link
            to="/subscriptions/new"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-bold rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {Icons.Plus()}
            Get Started
          </Link>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <Modal
        isOpen={cancelUuid !== null}
        onClose={() => setCancelUuid(null)}
        title="Cancel Subscription"
        type="warning"
        footer={
          <>
            <button
              onClick={() => cancelUuid && cancelMutation.mutate(cancelUuid)}
              disabled={cancelMutation.isPending}
              className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-rose-600 text-base font-bold text-white hover:bg-rose-700 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {cancelMutation.isPending ? 'Processing...' : 'Confirm Cancellation'}
            </button>
            <button
              onClick={() => setCancelUuid(null)}
              className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-bold text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Back
            </button>
          </>
        }
      >
        Are you sure you want to cancel this subscription? You will stop receiving webhooks for this event type immediately.
      </Modal>
    </div>
  );
}
