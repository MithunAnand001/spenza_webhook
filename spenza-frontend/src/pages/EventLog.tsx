import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { useSSE } from '../hooks/useSSE';
import { Icons } from '../assets/Icons';

export default function EventLog() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['events', page],
    queryFn: async () => {
      const res = await api.get(`/events?page=${page}&limit=${limit}`);
      return res.data.data[0];
    },
  });

  useSSE(() => {
    if (page === 1) {
      queryClient.invalidateQueries({ queryKey: ['events', 1] });
    }
    queryClient.invalidateQueries({ queryKey: ['recent-events'] });
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const logs = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Live Event Log</h2>
          <p className="mt-2 text-slate-500">Real-time stream of all incoming and delivered webhooks.</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['events', page] })}
            className={`inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isFetching}
          >
            {Icons.Refresh()}
            <span className="ml-2">{isFetching ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest w-10">ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Code</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {logs.map((log: any) => (
                <React.Fragment key={log.id}>
                  <tr className={`hover:bg-slate-50/50 transition-colors ${expandedId === log.id ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-slate-600">#{log.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">{log.event?.eventType?.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.responseCode ? (
                        <span className={`text-sm font-mono font-bold ${log.responseCode < 400 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {log.responseCode}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                      {log.createdOn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-bold transition-colors"
                        aria-expanded={expandedId === log.id}
                      >
                        {expandedId === log.id ? 'Collapse' : 'Inspect'}
                        <span className="ml-1">
                          {expandedId === log.id ? Icons.ChevronUp() : Icons.ChevronDown()}
                        </span>
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={6} className="px-6 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <section>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                              Payload
                              <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px]">JSON</span>
                            </h4>
                            <div className="bg-slate-900 rounded-xl p-4 shadow-inner ring-1 ring-white/10">
                              <pre className="text-xs text-indigo-300 font-mono overflow-auto max-h-80 leading-relaxed custom-scrollbar">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            </div>
                          </section>
                          <section>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                              Response from Target
                              <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px]">RAW</span>
                            </h4>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-inner min-h-[100px]">
                              <pre className="text-xs text-slate-700 font-mono overflow-auto max-h-80 leading-relaxed custom-scrollbar whitespace-pre-wrap break-all">
                                {log.responseBody || 'No response data recorded for this attempt.'}
                              </pre>
                            </div>
                          </section>
                        </div>
                        <footer className="mt-6 flex flex-wrap gap-4 text-[10px] font-mono text-slate-400 border-t border-slate-200 pt-4 uppercase tracking-tighter">
                          <div><span className="font-bold text-slate-500 mr-1">Trace ID:</span> {log.uuid}</div>
                          <div><span className="font-bold text-slate-500 mr-1">Correlation:</span> {log.correlationId || 'NONE'}</div>
                          <div><span className="font-bold text-slate-500 mr-1">Attempts:</span> {log.attemptNumber}</div>
                        </footer>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                    No events captured yet. Use the simulator to send some!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <nav className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between" aria-label="Pagination">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  {Icons.ChevronLeft()}
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  {Icons.ChevronRight()}
                </button>
              </nav>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}