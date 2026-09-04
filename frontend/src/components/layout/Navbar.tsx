import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHomeClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname === '/home' || location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/home');
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        'fixed top-0 left-0 right-0 w-full z-[100] transition-all duration-300 h-20 border-b pointer-events-auto',
        isScrolled 
          ? 'bg-[#000000]/95 backdrop-blur-xl border-neutral-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.9)]' 
          : 'bg-transparent border-transparent'
      )}
    >
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 h-full flex items-center justify-between relative z-[101]">
        
        {/* Brand Logo & Name with Razorpay Styling */}
        <div className="flex items-center gap-3 group cursor-pointer" onClick={handleHomeClick}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 via-blue-500 to-amber-400 p-[1px] shadow-[0_0_20px_rgba(56,189,248,0.3)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0a0a0a] rounded-[11px] flex items-center justify-center p-1.5">
              {/* Razorpay Brand Icon SVG */}
              <svg className="w-full h-full" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 0L0 25H6.5L12.5 13L18.5 25H25L12.5 0Z" fill="#38BDF8"/>
              </svg>
            </div>
          </div>
          <span className="text-xl font-extrabold tracking-widest text-white uppercase font-mono flex items-center gap-1.5">
            RECOVER <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500">AI</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 bg-neutral-900/60 border border-neutral-800/80 px-7 py-2.5 rounded-full backdrop-blur-md shadow-inner">
          <button 
            type="button"
            onClick={handleHomeClick}
            className="text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-yellow-400 transition-colors bg-transparent border-none cursor-pointer"
          >
            Home
          </button>
          <a href="#features" className="text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-yellow-400 transition-colors cursor-pointer">Features</a>
          <a href="#use-cases" className="text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-yellow-400 transition-colors cursor-pointer">Use Cases</a>
          <a href="#engine" className="text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-yellow-400 transition-colors cursor-pointer">Engine</a>
        </div>

        {/* Action Buttons: Sign In / Sign Up */}
        <div className="hidden md:flex items-center gap-5 font-mono text-xs">
          <Link 
            to="/login"
            className="text-neutral-300 hover:text-white uppercase tracking-wider font-semibold transition-colors cursor-pointer"
          >
            Sign in
          </Link>
          <Link 
            to="/register"
            className="bg-transparent border border-white/80 hover:border-yellow-400 text-white hover:text-yellow-300 px-5 py-2.5 rounded-full font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            Sign up
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button 
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer relative z-[102]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-20 left-0 right-0 w-full bg-[#0a0a0a] border-b border-neutral-800 p-6 shadow-2xl backdrop-blur-2xl z-[100]"
        >
          <div className="flex flex-col space-y-4">
            <button 
              type="button"
              onClick={handleHomeClick} 
              className="text-left text-sm font-mono text-neutral-300 hover:text-yellow-400 py-2 border-b border-neutral-900 bg-transparent cursor-pointer"
            >
              Home
            </button>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-mono text-neutral-300 hover:text-yellow-400 py-2 border-b border-neutral-900">Features</a>
            <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="text-sm font-mono text-neutral-300 hover:text-yellow-400 py-2 border-b border-neutral-900">Use Cases</a>
            <a href="#engine" onClick={() => setMobileMenuOpen(false)} className="text-sm font-mono text-neutral-300 hover:text-yellow-400 py-2 border-b border-neutral-900">Engine</a>
            <div className="flex flex-col gap-3 pt-3">
              <Link 
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-xs font-mono text-neutral-300 py-3 border border-neutral-800 rounded-xl cursor-pointer"
              >
                Sign In
              </Link>
              <Link 
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-xs font-mono bg-yellow-400 text-black font-bold py-3 rounded-xl cursor-pointer"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}