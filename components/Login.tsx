import React, { useState } from 'react';
import { motion as m } from 'framer-motion';
import { User, Lock, Mail } from 'lucide-react';
import { Button, Input, Label } from './UIComponents';

// Cast motion to any to avoid TypeScript errors with initial/animate props in this environment
const motion = m as any;

interface LoginProps {
  onLogin: (email: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // Login State
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await onLogin(email);
      if (!success) {
        // Error is already handled in onLogin
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      
      {/* Left Side - Banner */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-slate-900 opacity-90"></div>
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <div className="relative z-10 max-w-2xl text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex justify-center"
          >
             <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
                  <img
                    src="./assets/logo.png"
                    alt="PTC Logo"
                    className="mx-auto mb-4 h-20 w-auto"
                  />
             </div>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-medium text-emerald-200 mb-2 tracking-wide">Welcome to</h2>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Student Appointment System</h1>
            <h3 className="text-xl font-bold text-white mb-6 tracking-widest bg-white/10 py-2 px-4 rounded-lg inline-block border border-white/20">
                PATEROS TECHNOLOGICAL COLLEGE
            </h3>
          </motion.div>
          <motion.p 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="text-xl text-slate-300 font-light leading-relaxed whitespace-nowrap"
          >
            Streamlined support for academic and administrative concerns
          </motion.p>
        </div>
      </div>

      {/* Right Side - Interactive Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background Blobs for form side */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

        <div className="w-full max-w-lg z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100"
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Sign in to access the Student Portal
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <div>
                <Label htmlFor="email" className="text-black font-bold mb-1.5 block">Email address</Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    required
                    className="pl-10 h-11 bg-slate-50 focus:bg-white transition-colors text-black"
                    placeholder="student@ptc.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>


              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-11 text-base shadow-lg shadow-slate-900/20" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

    </div>
  );
};

export default Login;
