import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../api/api.service';
import StatusBadge from '../components/StatusBadge';
import { useWebSockets } from '../hooks/useWebSockets';
import { Icons } from '../assets/Icons';
import { WebhookEventStatus } from '../constants/status';
import type { WebhookEventLog, EventType, LogFilterState } from '../types/api.types';

export default function EventLog() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Main Active State (Triggers the API)
  const [activeFilters, setActiveFilters] = useState<LogFilterState>({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    sortField: 'createdOn',
    sortOrder: 'DESC'
  });

  // Temporary State (For the UI Inputs - uncommitted)
  const [tempFilters, setTempFilters] = useState<LogFilterState>(activeFilters);

  const { data: eventTypes } = useQuery({
    queryKey: ['event-types'],
    queryFn: async () => {
      const res = await ApiService.getEventTypes();
      return res.data.data;
    },
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['events', activeFilters],
    queryFn: async () => {
      const res = await ApiService.getEvents(activeFilters);
      return res.data.data;
    },
  });

  useWebSockets(() => {
    if (activeFilters.page === 1) {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
    queryClient.invalidateQueries({ queryKey: ['recent-events'] });
  });

  const handleApplyFilters = () => {
    setActiveFilters({ ...tempFilters, page: 1 });
  };

  const handleClearFilters = () => {
    const reset: LogFilterState = {
      ...activeFilters,
      page: 1,
      status: '',
      search: '',
      eventTypeId: undefined
    };
    setTempFilters(reset);
    setActiveFilters(reset);
  };

  const toggleSort = (field: string) => {
    const isSameField = activeFilters.sortField === field;
    const newOrder = isSameField && activeFilters.sortOrder === 'DESC' ? 'ASC' : 'DESC';
    
    const newFilters: LogFilterState = {
      ...activeFilters,
      sortField: field,
      sortOrder: newOrder
    };
    
    setActiveFilters(newFilters);
    setTempFilters(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const updated = { ...activeFilters, page: newPage };
    setActiveFilters(updated);
    setTempFilters(updated);
  };

  const logs: WebhookEventLog[] = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const SortIcon = ({ field }: { field: string }) => {
    if (activeFilters.sortField !== field) return <span className="ml-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">↕</span>;
    return <span className="ml-1 text-indigo-600">{activeFilters.sortOrder === 'ASC' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Live Event Log</h2>
          <p className="mt-2 text-slate-500">Real-time stream of all incoming and delivered webhooks.</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['events'] })}
            className={`inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isFetching}
          >
            {Icons.Refresh()}
            <span className="ml-2">{isFetching ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Filters & Search UI */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {Icons.Activity()}
            </div>
            <input
              type="text"
              placeholder="Search Correlation ID..."
              value={tempFilters.search}
              onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50/50"
            />
          </div>

          <select
            value={tempFilters.status}
            onChange={(e) => setTempFilters({ ...tempFilters, status: e.target.value as WebhookEventStatus | '' })}
            className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50/50 font-medium capitalize"
          >
            <option value="">All Statuses</option>
            {Object.values(WebhookEventStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={tempFilters.eventTypeId || ''}
            onChange={(e) => setTempFilters({ ...tempFilters, eventTypeId: e.target.value ? parseInt(e.target.value) : undefined })}
            className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50/50 font-medium"
          >
            <option value="">All Event Types</option>
            {eventTypes?.map((type: EventType) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleApplyFilters}
              className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th 
                  onClick={() => toggleSort('id')}
                  className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest w-10 cursor-pointer group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center">ID <SortIcon field="id" /></div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
                <th 
                  onClick={() => toggleSort('status')}
                  className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center">Status <SortIcon field="status" /></div>
                </th>
                <th 
                  onClick={() => toggleSort('responseCode')}
                  className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center">Code <SortIcon field="responseCode" /></div>
                </th>
                <th 
                  onClick={() => toggleSort('createdOn')}
                  className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center">Timestamp <SortIcon field="createdOn" /></div>
                </th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                  </td>
                </tr>
              ) : logs.map((log: WebhookEventLog) => (
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
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                    No events matched your search/filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <nav className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between" aria-label="Pagination">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, activeFilters.page - 1))}
              disabled={activeFilters.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, activeFilters.page + 1))}
              disabled={activeFilters.page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Page <span className="font-bold">{activeFilters.page}</span> of <span className="font-bold">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, activeFilters.page - 1))}
                  disabled={activeFilters.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  {Icons.ChevronLeft()}
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, activeFilters.page + 1))}
                  disabled={activeFilters.page === totalPages}
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
