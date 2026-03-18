import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  description?: string;
}

export default function StatCard({ title, value, icon, color = 'bg-white', description }: StatCardProps) {
  return (
    <article className={`${color} overflow-hidden shadow-sm border border-slate-200 rounded-xl transition-all hover:shadow-md`}>
      <div className="p-6">
        <div className="flex items-center">
          {icon && (
            <div className="flex-shrink-0 p-3 bg-indigo-50 rounded-lg text-indigo-600 mr-4">
              {icon}
            </div>
          )}
          <div className="w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-500 truncate uppercase tracking-wider">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
        {description && (
          <p className="mt-4 text-xs text-slate-400">
            {description}
          </p>
        )}
      </div>
    </article>
  );
}