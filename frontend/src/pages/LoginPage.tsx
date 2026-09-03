import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Eye, EyeOff, AlertCircle, Sparkles, Lock, Mail, ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      const serverDetail = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.response?.data?.error?.message;
        
      if (serverDetail) {
        setError(serverDetail);
      } else if (err.response?.status === 401) {
        setError('Incorrect email or password. Please check your credentials and try again.');
      } else if (err.response?.status === 400) {
        setError('Invalid request. Please verify your email and password.');
      } else if (err.response?.status === 500 || !err.response) {
        setError('Server connection error. Please verify the backend service on http://127.0.0.1:8000.');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 selection:bg-green-500/30 text-white relative overflow-hidden">
      
      {/* Neon Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-green-500/10 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-500/10 blur-[160px] rounded-full pointer-events-none" />
      
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
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-green-400 transition-colors bg-neutral-900/80 border border-neutral-800 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-inner cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-mono font-bold tracking-[0.25em] uppercase mb-6 text-white hover:text-green-400 transition-colors">
            <Sparkles className="w-4 h-4 text-green-400" /> Recover AI
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">
            Sign in to Console
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-2">Enter your credentials to access autonomous recovery pipelines</p>
        </div>

        <div className="bg-[#0c0c0e] border border-neutral-800 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden backdrop-blur-2xl group hover:border-green-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />

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
              <label className="block text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5" htmlFor="email">
                <Mail className="w-3.5 h-3.5 text-green-400" /> Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-inner"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5" htmlFor="password">
                <Lock className="w-3.5 h-3.5 text-green-400" /> Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  data-lpignore="true"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 pr-12 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-inner [&::-ms-reveal]:hidden [&::-webkit-reveal]:hidden"
                  placeholder="Enter password"
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
              className="w-full bg-green-500 hover:bg-green-400 text-black font-extrabold font-mono uppercase tracking-wider py-4 text-xs mt-3 shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all cursor-pointer pointer-events-auto"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Sign in to Console"}
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-neutral-800/80 pt-6">
            <p className="text-xs font-mono text-neutral-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-400 hover:text-green-300 font-bold transition-colors">
                Register
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}