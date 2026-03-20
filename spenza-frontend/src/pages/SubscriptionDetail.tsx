import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../api/api.service';
import StatusBadge from '../components/StatusBadge';
import { Icons } from '../assets/Icons';

export default function SubscriptionDetail() {
  const { id } = useParams();
  
  const { data: sub, isLoading: subLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: async () => {
      const res = await ApiService.getSubscription(id!);
      return res.data.data;
    },
  });

  if (subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!sub) return <div className="p-8 text-rose-600 font-bold text-center bg-rose-50 rounded-xl border border-rose-100 max-w-md mx-auto mt-20">Subscription not found</div>;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
      <nav>
        <Link to="/subscriptions" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
          {Icons.Back()}
          <span className="ml-2">Back to list</span>
        </Link>
      </nav>

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{sub.eventType?.name}</h2>
          <p className="mt-1 text-slate-500 font-medium">Subscription configuration and real-time delivery status.</p>
        </div>
        <StatusBadge status={sub.isActive ? 'active' : 'inactive'} />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            <header className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Connection Info</h3>
            </header>
            <div className="p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center text-indigo-500">
                    {Icons.Link()}
                    <span className="ml-2">Callback URL</span>
                  </dt>
                  <dd className="text-sm font-mono font-bold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100 break-all">
                    {sub.callbackUrl}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-slate-400 uppercase mb-1">Subscription ID</dt>
                  <dd className="text-sm font-mono text-slate-900">#{sub.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-slate-400 uppercase mb-1">Created At</dt>
                  <dd className="text-sm text-slate-900 font-medium">{sub.createdOn}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-bold text-slate-400 uppercase mb-1">Unique Trace ID (UUID)</dt>
                  <dd className="text-sm font-mono text-slate-500 break-all">{sub.uuid}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-indigo-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
            <header className="relative z-10 mb-6">
              <h3 className="text-xl font-bold flex items-center text-white">
                {Icons.Key()}
                <span className="ml-3">Security Integration</span>
              </h3>
              <p className="text-indigo-200 text-sm mt-1 font-medium">Use these details to secure your webhook endpoint.</p>
            </header>
            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Ingestion Endpoint</p>
                <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10 font-mono text-xs break-all leading-loose">
                  <span className="text-emerald-400 font-bold mr-2">POST</span>
                  {import.meta.env.VITE_API_BASE_URL}/webhooks/ingest/{sub.id}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">HMAC Header</p>
                  <p className="text-sm font-mono">X-Webhook-Signature</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">Payload Format</p>
                  <p className="text-sm font-mono text-emerald-400 font-bold uppercase">JSON (Application/JSON)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 font-bold uppercase text-xs tracking-widest">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                to="/events" 
                className="w-full flex items-center justify-center px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              >
                View History
              </Link>
              <button className="w-full flex items-center justify-center px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all border border-rose-100">
                Cancel Subscription
              </button>
            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
            <h3 className="font-bold text-emerald-900 mb-2">System Status</h3>
            <div className="flex items-center text-emerald-700 text-sm font-medium">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse mr-2"></span>
              Gateway Operational
            </div>
            <p className="mt-3 text-xs text-emerald-600 leading-relaxed font-medium italic">
              We are currently monitoring this subscription for activity. Delivery retries are active with exponential backoff.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}