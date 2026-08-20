import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Command, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { StaffUser } from '../types';

interface AuthCardProps {
  initialMode?: 'signup' | 'signin';
  onSuccess?: (user?: StaffUser) => void;
  onClose?: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

function scorePassword(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

export const AuthCard: React.FC<AuthCardProps> = ({
  initialMode = 'signup',
  onSuccess,
  onClose
}) => {
  const [mode, setMode] = useState<'signup' | 'signin'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Errors & Status
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const isSignup = mode === 'signup';
  const pwScore = scorePassword(password);

  const clearErrors = () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
  };

  const handleModeSwitch = (newMode: 'signup' | 'signin') => {
    setMode(newMode);
    clearErrors();
    setStatusMsg(null);
  };

  const validate = (): boolean => {
    clearErrors();
    let valid = true;

    if (isSignup) {
      if (!name.trim() || name.trim().length < 2) {
        setNameError('Please enter your full name.');
        valid = false;
      }
    }

    if (!email.trim() || !EMAIL_RE.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      valid = false;
    } else if (isSignup && !(/[A-Za-z]/.test(password) && /\d/.test(password))) {
      setPasswordError('Use at least one letter and one number.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!validate()) return;

    setLoading(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() }
          }
        });

        if (error) {
          setStatusMsg({ text: error.message, isError: true });
        } else {
          setStatusMsg({ text: 'Account created. Redirecting…', isError: false });
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 1200);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          setStatusMsg({ text: error.message, isError: true });
        } else {
          setStatusMsg({ text: 'Signed in successfully. Redirecting…', isError: false });
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 1000);
        }
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'An error occurred during authentication.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setStatusMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        setStatusMsg({ text: error.message, isError: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to initialize Google sign in', isError: true });
    }
  };

  return (
    <div className="relative flex items-center justify-center p-4 min-h-[520px] w-full">
      {/* Background Subtle Gradient Glow Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0">
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-indigo-300/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-purple-300/40 rounded-full blur-3xl" />
      </div>

      {/* Main Auth Card Container */}
      <div className="relative z-10 w-full max-w-md bg-gradient-to-b from-[#F3F5FD] to-[#E9EDF9] border border-white/90 rounded-[28px] shadow-[0_24px_60px_-20px_rgba(38,32,90,0.28)] p-7 sm:p-9 text-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* Close Button if in modal */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/50 transition"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        {/* Brand Mark Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-[18px] bg-gradient-to-tr from-[#5B4BE7] to-[#8072FF] flex items-center justify-center text-white shadow-[0_12px_24px_-10px_rgba(91,75,231,0.7)]">
            <Command className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl font-bold tracking-tight text-[#161327] mb-1 font-sans">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-xs text-[#7C7A93] mb-6 font-medium">
          {isSignup ? 'Join the future of travel management.' : 'Sign in to pick up where you left off.'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-left">
          
          {/* Name Field (Signup Mode Only) */}
          {isSignup && (
            <div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A98B4] pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="Full name"
                  className={`w-full h-12 pl-11 pr-4 bg-[#FAFBFF] hover:bg-white focus:bg-white text-sm text-[#161327] placeholder-[#A5A3BB] rounded-[14px] border border-transparent outline-none transition-all duration-200 focus:border-[#5B4BE7] focus:ring-4 focus:ring-[#5B4BE7]/15 ${
                    nameError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15' : ''
                  }`}
                />
              </div>
              {nameError && (
                <p className="text-[11.5px] text-rose-500 mt-1 ml-1 font-medium animate-in fade-in">
                  {nameError}
                </p>
              )}
            </div>
          )}

          {/* Email Field */}
          <div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A98B4] pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                placeholder="Email address"
                className={`w-full h-12 pl-11 pr-4 bg-[#FAFBFF] hover:bg-white focus:bg-white text-sm text-[#161327] placeholder-[#A5A3BB] rounded-[14px] border border-transparent outline-none transition-all duration-200 focus:border-[#5B4BE7] focus:ring-4 focus:ring-[#5B4BE7]/15 ${
                  emailError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15' : ''
                }`}
              />
            </div>
            {emailError && (
              <p className="text-[11.5px] text-rose-500 mt-1 ml-1 font-medium animate-in fade-in">
                {emailError}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A98B4] pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder={isSignup ? 'Create a password' : 'Password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                className={`w-full h-12 pl-11 pr-11 bg-[#FAFBFF] hover:bg-white focus:bg-white text-sm text-[#161327] placeholder-[#A5A3BB] rounded-[14px] border border-transparent outline-none transition-all duration-200 focus:border-[#5B4BE7] focus:ring-4 focus:ring-[#5B4BE7]/15 ${
                  passwordError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#9A98B4] hover:text-[#5B4BE7] hover:bg-[#5B4BE7]/10 rounded-lg transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-[11.5px] text-rose-500 mt-1 ml-1 font-medium animate-in fade-in">
                {passwordError}
              </p>
            )}
          </div>

          {/* Password Strength Meter (Signup Mode Only) */}
          {isSignup && password.length > 0 && (
            <div className="pt-1 px-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 flex-1">
                  {[1, 2, 3, 4].map((level) => {
                    let barColor = 'bg-slate-200';
                    if (pwScore >= level) {
                      if (pwScore === 1) barColor = 'bg-[#E5484D]';
                      else if (pwScore === 2) barColor = 'bg-[#F5A524]';
                      else if (pwScore === 3) barColor = 'bg-[#3B9E5A]';
                      else if (pwScore === 4) barColor = 'bg-[#2F8F52]';
                    }
                    return (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${barColor}`}
                      />
                    );
                  })}
                </div>
                <span className="text-[11.5px] font-semibold text-[#7C7A93] min-w-[46px] text-right">
                  {STRENGTH_LABELS[pwScore] || 'Weak'}
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-gradient-to-b from-[#5B4BE7] to-[#4535D0] hover:from-[#6657EF] hover:to-[#4B3BC3] active:scale-[0.99] text-white text-sm font-semibold rounded-[14px] shadow-[0_14px_26px_-12px_rgba(69,53,208,0.85)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isSignup ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-[14px] text-xs font-medium flex items-center gap-2 animate-in fade-in ${
                statusMsg.isError
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              {statusMsg.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5 text-[#A5A3BB] text-[11px] font-bold tracking-[0.14em] uppercase">
          <div className="flex-1 h-px bg-[#E2E5F3]" />
          <span>OR</span>
          <div className="flex-1 h-px bg-[#E2E5F3]" />
        </div>

        {/* Google SSO Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full h-12 rounded-[14px] border border-[#E2E5F3] bg-white hover:bg-slate-50 text-[#2C2A40] text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-2.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer Mode Switch */}
        <div className="mt-5 text-xs text-[#7C7A93]">
          <span>{isSignup ? 'Already have an account?' : "Don't have an account?"}</span>{' '}
          <button
            type="button"
            onClick={() => handleModeSwitch(isSignup ? 'signin' : 'signup')}
            className="font-bold text-[#5B4BE7] hover:underline focus:outline-none ml-1"
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthCard;
