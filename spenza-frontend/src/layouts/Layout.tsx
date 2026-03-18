import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export default function Layout() {
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Subscriptions', path: '/subscriptions' },
    { name: 'Event Log', path: '/events' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Global">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center group" aria-label="Spenza Webhooks Home">
                <span className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-indigo-700 transition-colors">S</span>
                <span className="ml-3 font-bold text-xl text-slate-900 hidden sm:block">Spenza Webhooks</span>
              </Link>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8 h-full">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'border-indigo-600 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="ml-8 inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm"
                aria-label="Log out of your account"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between text-slate-500 text-sm">
            <div className="flex justify-center space-x-6 md:order-2">
              <span className="hover:text-slate-600 cursor-default">v1.0.0</span>
              <a href="#" className="hover:text-slate-600 transition-colors">Documentation</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Support</a>
            </div>
            <div className="mt-8 md:mt-0 md:order-1 text-center md:text-left">
              &copy; {new Date().getFullYear()} Spenza Webhook System. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}