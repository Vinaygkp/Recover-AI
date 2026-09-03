import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Eye, EyeOff, AlertCircle, Sparkles, Lock, Mail, User, Building, ArrowLeft } from 'lucide-react';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const prefilledEmail = searchParams.get('email');
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await register({ 
        full_name: name, 
        email, 
        password, 
        company_name: company 
      });
      navigate('/dashboard');
    } catch (err: any) {
      const serverDetail = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.response?.data?.error?.message;
        
      if (serverDetail) {
        setError(serverDetail);
      } else if (err.response?.status === 400) {
        setError('Email is already registered. Please sign in instead.');
      } else if (err.response?.status === 500 || !err.response) {
        setError('Server connection error. Please verify the backend service on http://127.0.0.1:8000.');
      } else {
        setError('Registration failed. Please check your inputs and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-green-500/30 text-white relative overflow-hidden">
      
      {/* Neon Ambient Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-yellow-500/10 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 blur-[160px] rounded-full pointer-events-none" />
      
      {/* Subtle Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-yellow-400 transition-colors bg-neutral-900/80 border border-neutral-800 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-inner cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-mono font-bold tracking-[0.25em] uppercase mb-6 text-white hover:text-yellow-400 transition-colors">
            <Sparkles className="w-4 h-4 text-yellow-400" /> Recover AI
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">
            Create an Account
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-2">Initialize your autonomous recovery console</p>
        </div>

        <div className="bg-[#0c0c0e] border border-neutral-800 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden backdrop-blur-2xl group hover:border-yellow-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 shadow-inner"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs font-mono text-red-300 leading-relaxed font-bold">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5" htmlFor="name">
                <User className="w-3.5 h-3.5 text-yellow-400" /> Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all shadow-inner"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5" htmlFor="company">
                <Building className="w-3.5 h-3.5 text-yellow-400" /> Company Name <span className="text-neutral-500 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                autoComplete="organization"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all shadow-inner"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5" htmlFor="email">
                <Mail className="w-3.5 h-3.5 text-yellow-400" /> Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all shadow-inner"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5" htmlFor="password">
                <Lock className="w-3.5 h-3.5 text-yellow-400" /> Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 pr-12 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all shadow-inner [&::-ms-reveal]:hidden [&::-webkit-reveal]:hidden"
                  placeholder="Enter password (min 8 chars)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="primary"
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 text-black font-extrabold font-mono uppercase tracking-wider py-4 text-xs mt-3 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer pointer-events-auto"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account & Launch Console"}
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-neutral-800/80 pt-6">
            <p className="text-xs font-mono text-neutral-400">
              Already have an account?{' '}
              <Link to="/login" className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}