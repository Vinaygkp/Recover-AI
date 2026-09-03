import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { Search, Sparkles, LogOut, ChevronDown, User, ShieldCheck, Activity, Users, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationCenter } from '../notifications/NotificationCenter';
import api from '../../services/api';

interface TransactionItem {
  id?: string;
  _id?: string;
  order_id?: string;
  amount?: number;
  [key: string]: unknown;
}

interface CaseItem {
  id?: string;
  _id?: string;
  amount?: number;
  [key: string]: unknown;
}

interface CustomerItem {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

interface SearchResults {
  transactions: TransactionItem[];
  cases: CaseItem[];
  customers: CustomerItem[];
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults>({ transactions: [], cases: [], customers: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Search Input Change with Debounced Query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ transactions: [], cases: [], customers: [] });
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchOpen(true);
        const [txRes, caseRes, custRes] = await Promise.allSettled([
          api.get('/transactions', { params: { search: searchQuery, limit: 5 } }),
          api.get('/recovery/cases', { params: { search: searchQuery, limit: 5 } }),
          api.get('/customers', { params: { search: searchQuery, limit: 5 } }),
        ]);

        setSearchResults({
          transactions: txRes.status === 'fulfilled' ? (txRes.value.data?.items || txRes.value.data || []) : [],
          cases: caseRes.status === 'fulfilled' ? (caseRes.value.data?.items || caseRes.value.data || []) : [],
          customers: custRes.status === 'fulfilled' ? (custRes.value.data?.items || custRes.value.data || []) : [],
        });
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/dashboard/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      sessionStorage.removeItem('recover_ai_token');
      sessionStorage.removeItem('recover_ai_user');
    }
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-[#000000] text-white overflow-hidden selection:bg-green-500/30">
      
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-green-500/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-pink-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Sidebar Component */}
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Premium Glassmorphic Header */}
        <header className="h-20 border-b border-neutral-800/80 bg-[#080808]/90 backdrop-blur-xl flex items-center justify-between px-8 z-30 shadow-lg relative">
          
          {/* Glowing Search Bar with Live Telemetry Search Engine */}
          <div className="flex-1 max-w-lg relative group" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-green-400 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setSearchOpen(true)}
                placeholder="Search transactions, customers, or recovery cases..."
                className="w-full bg-[#121212] border border-neutral-800 hover:border-neutral-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-green-500/60 focus:ring-2 focus:ring-green-500/20 transition-all shadow-inner font-mono text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Live Search Results Dropdown */}
            {searchOpen && (
              <div className="absolute top-12 left-0 right-0 bg-[#0c0c0e] border border-neutral-800 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-[999] overflow-hidden backdrop-blur-2xl p-3 space-y-3 font-mono text-xs max-h-96 overflow-y-auto custom-scrollbar">
                
                {isSearching ? (
                  <div className="p-4 text-center text-neutral-500">Searching telemetry records...</div>
                ) : (searchResults.transactions.length === 0 && searchResults.cases.length === 0 && searchResults.customers.length === 0) ? (
                  <div className="p-4 text-center text-neutral-500">No telemetry results found for "{searchQuery}"</div>
                ) : (
                  <>
                    {/* Recovery Cases Match */}
                    {searchResults.cases.length > 0 && (
                      <div>
                        <div className="text-[10px] text-green-400 uppercase tracking-widest font-bold mb-1.5 px-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3" /> Recovery Cases
                        </div>
                        <div className="space-y-1">
                          {searchResults.cases.slice(0, 3).map((c) => (
                            <div
                              key={c.id || c._id}
                              onClick={() => { setSearchOpen(false); navigate(`/dashboard/recovery`); }}
                              className="p-2 px-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800/80 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <span className="font-bold text-white">#{c.id?.slice(0, 8) || 'case'}</span>
                              <span className="text-amber-400">₹{c.amount?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transactions Match */}
                    {searchResults.transactions.length > 0 && (
                      <div>
                        <div className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-1.5 px-2 flex items-center gap-1.5">
                          <Activity className="w-3 h-3" /> Transactions
                        </div>
                        <div className="space-y-1">
                          {searchResults.transactions.slice(0, 3).map((t) => (
                            <div
                              key={t.id || t._id}
                              onClick={() => { setSearchOpen(false); navigate(`/dashboard/transactions/${t.id || t._id}`); }}
                              className="p-2 px-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800/80 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <span className="text-neutral-300">{t.order_id || t.id?.slice(0, 8)}</span>
                              <span className="font-bold text-white">₹{t.amount?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customers Match */}
                    {searchResults.customers.length > 0 && (
                      <div>
                        <div className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold mb-1.5 px-2 flex items-center gap-1.5">
                          <Users className="w-3 h-3" /> Customers
                        </div>
                        <div className="space-y-1">
                          {searchResults.customers.slice(0, 3).map((cust) => (
                            <div
                              key={cust.id || cust._id}
                              onClick={() => { setSearchOpen(false); navigate(`/dashboard/customers/${cust.id || cust._id}`); }}
                              className="p-2 px-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800/80 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <span className="text-white font-bold">{cust.name || cust.email}</span>
                              <span className="text-neutral-400">{cust.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Right Header Actions & Profile */}
          <div className="flex items-center gap-5 ml-6">
            
            {/* Notification Center Dropdown */}
            <NotificationCenter />
            
            {/* User Profile Section with Dropdown & Logout */}
            <div className="relative z-50 shrink-0" ref={dropdownRef}>
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 border-l border-neutral-800/80 px-4 cursor-pointer group select-none"
              >
                <div className="text-right hidden md:block max-w-[140px]">
                  <p className="text-xs font-semibold text-white tracking-tight flex items-center justify-end gap-1 font-mono truncate">
                    <span className="truncate">{user?.full_name || 'Vinay Kumar'}</span> 
                    <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse shrink-0" />
                  </p>
                  <p className="text-[10px] font-mono text-green-400 mt-0.5 uppercase tracking-wider truncate">{user?.company_name || 'Recover AI'}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-green-500 via-yellow-500 to-pink-500 p-[1px] shadow-[0_0_15px_rgba(34,197,94,0.3)] group-hover:scale-105 transition-transform shrink-0">
                    <div className="w-full h-full bg-[#0a0a0a] rounded-[11px] flex items-center justify-center text-xs font-bold text-white font-mono">
                      {user?.full_name?.charAt(0) || 'V'}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-[#121214] border border-neutral-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] py-2 z-[999] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-2xl">
                  <div className="px-4 py-3 border-b border-neutral-800/80 mb-1 bg-neutral-900/40">
                    <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Signed in as</p>
                    <p className="text-xs font-semibold text-white truncate font-mono mt-0.5">{user?.email || 'vinay@recover.ai'}</p>
                  </div>
                  
                  <button 
                    onClick={() => { setDropdownOpen(false); navigate('/dashboard/settings'); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-mono text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-neutral-400" /> Account Settings
                  </button>

                  <button 
                    onClick={() => { setDropdownOpen(false); navigate('/dashboard/simulation'); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-mono text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-green-400" /> Batch Simulation
                  </button>

                  <div className="h-[1px] bg-neutral-800/80 my-1" />

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-400" /> Secure Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>
        
        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative bg-[#020202]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        
      </div>
    </div>
  );
}