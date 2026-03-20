import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../api/api.service';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { Icons } from '../assets/Icons';
import { useWebSockets } from '../hooks/useWebSockets';

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['recent-events'],
    queryFn: async () => {
      const res = await ApiService.getEvents({
        page: 1,
        limit: 5,
        status: '',
        search: '',
        sortField: 'createdOn',
        sortOrder: 'DESC'
      });
      return res.data.data;
    },
  });

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await ApiService.getSubscriptions();
      return res.data.data;
    },
  });

  // Enable live updates for the Dashboard
  useWebSockets(() => {
    queryClient.invalidateQueries({ queryKey: ['recent-events'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
  });

  if (eventsLoading || subsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" aria-busy="true">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-200 rounded-full mb-4"></div>
          <p className="text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalSubscriptions: (subsData as any)?.length || 0,
    totalEvents: (eventsData as any)?.total || 0,
    delivered: (eventsData as any)?.data?.filter((e: any) => e.status === 'delivered').length || 0,
    failed: (eventsData as any)?.data?.filter((e: any) => e.status === 'failed').length || 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section>
        <header className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h2>
          <p className="mt-2 text-slate-500">Real-time performance and system health metrics.</p>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Subscriptions" value={stats.totalSubscriptions} icon={Icons.Subscription()} />
          <StatCard title="Total Event Logs" value={stats.totalEvents} icon={Icons.Activity()} />
          <StatCard title="Successful Deliveries" value={stats.delivered} icon={Icons.Check()} color="bg-emerald-50/30" description="From recent 5 events" />
          <StatCard title="Failed Attempts" value={stats.failed} icon={Icons.Error()} color="bg-rose-50/30" description="From recent 5 events" />
        </div>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <header className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Webhook Events</h3>
            <p className="text-sm text-slate-500 mt-0.5">The latest activity across all your subscriptions.</p>
          </div>
          <Link 
            to="/events" 
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm"
          >
            View Full Log
          </Link>
        </header>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Event Type</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">HTTP Code</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {(eventsData as any)?.data?.map((event: any) => (
                <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-slate-600">#{event.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-900">{event.event?.eventType?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {event.responseCode ? (
                      <span className={`text-sm font-mono font-bold ${event.responseCode < 400 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {event.responseCode}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-sm italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                    {event.createdOn}
                  </td>
                </tr>
              ))}
              {(!(eventsData as any)?.data || (eventsData as any).data.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-slate-50 rounded-full mb-4 text-slate-300">
                        {Icons.Activity()}
                      </div>
                      <p className="text-slate-500 font-medium italic">No webhook events recorded yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
