import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ApiService } from '../api/api.service';
import { Icons } from '../assets/Icons';
import Modal from '../components/Modal';
import type { EventType } from '../types/api.types';

export default function NewSubscription() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    eventTypeUuid: '',
    callbackUrl: '',
    authenticationType: 'none' as const,
  });
  const [urlStatus, setUrlStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [signingSecret, setSigningSecret] = useState<string | null>(null);

  const testUrl = async (url: string) => {
    if (!url || !url.startsWith('http')) return;
    setUrlStatus('testing');
    try {
      const res = await ApiService.testUrl(url);
      setUrlStatus(res.data.data.success ? 'success' : 'failed');
    } catch {
      setUrlStatus('failed');
    }
  };

  const { data: eventTypes, isLoading } = useQuery({
    queryKey: ['event-types'],
    queryFn: async () => {
      const res = await ApiService.getEventTypes();
      return res.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await ApiService.createSubscription(data);
      return res.data.data;
    },
    onSuccess: (data) => {
      if (data.signingSecret) {
        setSigningSecret(data.signingSecret);
      } else {
        toast.success('Subscription created successfully');
        navigate('/subscriptions');
      }
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? (err as any).response?.data?.errors?.[0]?.message : 'Failed to create subscription';
      toast.error(message || 'Failed to create subscription');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventTypeUuid || !formData.callbackUrl) {
      toast.error('Please fill all required fields');
      return;
    }
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <nav className="mb-8">
        <Link to="/subscriptions" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
          {Icons.Back()}
          <span className="ml-2">Back to Subscriptions</span>
        </Link>
      </nav>

      <header className="mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">New Subscription</h2>
        <p className="mt-2 text-slate-500 text-lg">Connect your application to receive real-time updates.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white shadow-sm border border-slate-200 rounded-2xl p-8 lg:p-10">
        <div className="grid grid-cols-1 gap-y-8">
          <div className="space-y-2">
            <label htmlFor="eventTypeUuid" className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
              Event Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="eventTypeUuid"
              required
              className="mt-1 block w-full py-3 px-4 border border-slate-300 bg-slate-50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm font-medium"
              value={formData.eventTypeUuid}
              onChange={(e) => setFormData({ ...formData, eventTypeUuid: e.target.value })}
            >
              <option value="">Select the event you want to monitor</option>
              {eventTypes?.map((t: EventType) => (
                <option key={t.uuid} value={t.uuid}>{t.name} — {t.shortDescription}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="callbackUrl" className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
              Target Callback URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <input
                id="callbackUrl"
                type="url"
                required
                placeholder="https://your-api.com/webhooks/receiver"
                className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full py-3 px-4 shadow-sm sm:text-sm border-slate-300 rounded-xl bg-slate-50 pr-12 transition-all"
                value={formData.callbackUrl}
                onChange={(e) => setFormData({ ...formData, callbackUrl: e.target.value })}
                onBlur={() => testUrl(formData.callbackUrl)}
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                {urlStatus === 'testing' && (
                  <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {urlStatus === 'success' && Icons.Check()}
                {urlStatus === 'failed' && Icons.Error()}
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium">We'll send a test GET request to verify this URL on blur.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="authType" className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
              Authentication Method
            </label>
            <select
              id="authType"
              className="mt-1 block w-full py-3 px-4 border border-slate-300 bg-slate-50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm font-medium"
              value={formData.authenticationType}
              onChange={(e) => setFormData({ ...formData, authenticationType: e.target.value as any })}
            >
              <option value="none">No Authentication (Public)</option>
              <option value="hmac">HMAC SHA-256 Signing (Recommended)</option>
              <option value="basic" disabled>HTTP Basic Auth (Coming soon)</option>
              <option value="bearer" disabled>Bearer Token (Coming soon)</option>
            </select>
            
            <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start">
              {Icons.Info()}
              <p className="text-xs text-indigo-700 ml-3 leading-relaxed font-medium">
                <strong>Pro Tip:</strong> Use HMAC signing to ensure requests actually come from Spenza. We'll provide a secret key after creation which you'll use to validate the <code>X-Webhook-Signature</code> header.
              </p>
            </div>
          </div>
        </div>

        <footer className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/subscriptions')}
            className="px-6 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all focus:ring-2 focus:ring-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex justify-center px-8 py-2.5 border border-transparent shadow-lg text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {mutation.isPending ? 'Processing...' : 'Create Subscription'}
          </button>
        </footer>
      </form>

      {/* Secret Key Disclosure Modal */}
      <Modal
        isOpen={signingSecret !== null}
        onClose={() => {
          setSigningSecret(null);
          navigate('/subscriptions');
        }}
        title="Your Signing Secret"
        type="success"
        footer={
          <button
            onClick={() => {
              setSigningSecret(null);
              navigate('/subscriptions');
            }}
            className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-2 bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 sm:text-sm transition-all"
          >
            I've Saved It
          </button>
        }
      >
        <p className="mb-4 text-slate-600">Please copy and save this secret key securely. You will need it to verify webhooks from Spenza. <strong className="text-rose-600 underline">This is the only time it will be shown.</strong></p>
        <div className="bg-slate-900 p-4 rounded-xl font-mono text-xs text-indigo-300 break-all select-all shadow-inner">
          {signingSecret}
        </div>
      </Modal>
    </div>
  );
}
