import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Compass,
  AlertCircle,
  KeyRound,
  Plane,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const {
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    loginAsDemoUser,
    resetPassword,
    sendPasswordResetOtp,
    verifyOtpAndResetPassword,
    user,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [resetStep, setResetStep] = useState<'request_otp' | 'verify_otp'>('request_otp');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtpHint, setGeneratedOtpHint] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [homeAirport, setHomeAirport] = useState('DEL (Delhi)');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both your Email ID and Password.');
        }
        await loginWithEmail(email.trim(), password);
        setSuccessMsg('Namaste! Logged in successfully. Redirecting to your planner...');
        setTimeout(() => onSuccess(), 500);
      } else if (mode === 'signup') {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('Please fill in your Full Name, Email, and Password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }
        await signupWithEmail(name.trim(), email.trim(), password, homeAirport);
        setSuccessMsg('Account created successfully! Welcome to GlobeTrotter Bharat.');
        setTimeout(() => onSuccess(), 600);
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your registered Email ID.');
        }
        if (resetStep === 'request_otp') {
          const generatedCode = await sendPasswordResetOtp(email.trim());
          setGeneratedOtpHint(generatedCode);
          setResetStep('verify_otp');
          setSuccessMsg(`6-Digit Verification OTP sent to ${email.trim()}! Check below or use demo OTP: ${generatedCode}`);
        } else {
          if (!otpCode.trim() || otpCode.trim().length !== 6) {
            throw new Error('Please enter a valid 6-digit OTP code.');
          }
          if (!newPassword || newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters.');
          }
          if (newPassword !== confirmNewPassword) {
            throw new Error('New passwords do not match. Please re-enter.');
          }
          await verifyOtpAndResetPassword(email.trim(), otpCode.trim(), newPassword);
          setSuccessMsg('Password updated successfully! You can now log in with your new password.');
          setTimeout(() => {
            setMode('login');
            setResetStep('request_otp');
            setOtpCode('');
            setPassword('');
            setGeneratedOtpHint(null);
          }, 1500);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (preset: 'aarav' | 'priya' | 'admin') => {
    setErrorMsg(null);
    setLoading(true);
    loginAsDemoUser(preset);
    setSuccessMsg(`Switched to ${preset === 'admin' ? 'Vikram (Admin)' : preset === 'priya' ? 'Priya Patel' : 'Aarav Sharma'}!`);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 450);
  };

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 w-full">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: India Travel Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-amber-700 via-orange-900 to-slate-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Art */}
          <div className="absolute inset-0 z-0 opacity-25">
            <img
              src="https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1000&q=80"
              alt="Rajasthan Palace"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>World-Class Global Travel Engine</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Your Global Passport & Itinerary Studio
              </h1>
              <p className="text-sm text-slate-200 mt-2 leading-relaxed font-medium">
                25 iconic worldwide destinations, 300+ verified spots, stadiums & culinary gems, day-by-day timelines, and USD ($) budget tracking.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-amber-100 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>12+ Verified Sights, Stadiums & Dining Spots per City</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-amber-100 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Interactive Day-by-Day Route & Timeline Builder</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-amber-100 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-Time USD ($) Expense Ledger & Over-Budget Alerts</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Traveler Switcher */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/10 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              ⚡ Instant 1-Click Demo Profiles:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('aarav')}
                className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all text-xs cursor-pointer"
              >
                <p className="font-bold text-white leading-tight">Aarav</p>
                <p className="text-[10px] text-amber-200">Heritage Traveler</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('priya')}
                className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all text-xs cursor-pointer"
              >
                <p className="font-bold text-white leading-tight">Priya</p>
                <p className="text-[10px] text-amber-200">Coastal Explorer</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="px-2.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-left transition-all text-xs cursor-pointer"
              >
                <p className="font-bold text-amber-300 leading-tight">Vikram</p>
                <p className="text-[10px] text-amber-200">Admin Console</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Working Auth Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Top Tabs */}
          <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-3">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-2 px-1 text-sm font-bold transition-all relative ${
                mode === 'login'
                  ? 'text-amber-700 border-b-2 border-amber-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In (Login)
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-2 px-1 text-sm font-bold transition-all relative ${
                mode === 'signup'
                  ? 'text-amber-700 border-b-2 border-amber-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register (Sign Up)
            </button>
            <button
              id="auth-tab-forgot"
              type="button"
              onClick={() => {
                setMode('forgot');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-2 px-1 text-sm font-bold transition-all relative ${
                mode === 'forgot'
                  ? 'text-amber-700 border-b-2 border-amber-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Forgot Password
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Heading */}
          <div className="mb-4">
            <h2 className="text-xl font-extrabold text-slate-900">
              {mode === 'login' && 'Welcome Back to GlobeTrotter'}
              {mode === 'signup' && 'Create Your Explorer Account'}
              {mode === 'forgot' && (resetStep === 'request_otp' ? 'Forgot Password via OTP' : 'Verify OTP & Set New Password')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login' && 'Sign in with your email and password to access your saved trips and itineraries.'}
              {mode === 'signup' && 'Join thousands of travelers crafting bespoke Indian adventures.'}
              {mode === 'forgot' && (
                resetStep === 'request_otp'
                  ? 'Enter your registered email ID to receive a secure 6-digit OTP code.'
                  : `Enter the 6-digit OTP code sent to ${email} and choose a new password.`
              )}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-name-input"
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Email Address / ID *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  disabled={mode === 'forgot' && resetStep === 'verify_otp'}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                    mode === 'forgot' && resetStep === 'verify_otp' ? 'bg-slate-100 opacity-85' : 'bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Mode: Forgot Password - Step 2: OTP Verification & New Password */}
            {mode === 'forgot' && resetStep === 'verify_otp' && (
              <div className="space-y-4 pt-1 animate-in fade-in">
                {generatedOtpHint && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-600 font-medium">Demo/Preview OTP: </span>
                      <strong className="text-amber-800 text-sm font-mono tracking-widest">{generatedOtpHint}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpCode(generatedOtpHint)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold"
                    >
                      Auto-Fill OTP
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-slate-600">
                      6-Digit OTP / Code *
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const newCode = await sendPasswordResetOtp(email.trim());
                          setGeneratedOtpHint(newCode);
                          setSuccessMsg(`New OTP sent! Demo code: ${newCode}`);
                        } catch (err: any) {
                          setErrorMsg(err.message || 'Failed to resend OTP');
                        }
                      }}
                      className="text-xs text-amber-700 hover:underline font-bold"
                    >
                      Resend OTP Code
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reset-otp-input"
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 849201"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reset-new-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reset-confirm-new-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-slate-600">
                    Password *
                  </label>
                  {mode === 'login' && (
                    <button
                      id="link-forgot-password"
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setResetStep('request_otp');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-amber-700 hover:underline font-bold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-confirm-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Home Departure City / Hub
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-city-input"
                    type="text"
                    placeholder="e.g. DEL (Delhi), BOM (Mumbai), BLR (Bengaluru)"
                    value={homeAirport}
                    onChange={(e) => setHomeAirport(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>Remember my login</span>
                </label>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Sign In to My Account'
                      : mode === 'signup'
                      ? 'Create Account & Start Planning'
                      : resetStep === 'request_otp'
                      ? 'Send 6-Digit OTP Code'
                      : 'Verify OTP & Reset Password'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'forgot' && (
            <div className="mt-3 flex items-center justify-between text-xs">
              {resetStep === 'verify_otp' && (
                <button
                  type="button"
                  onClick={() => {
                    setResetStep('request_otp');
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetStep('request_otp');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="inline-flex items-center gap-1.5 text-amber-700 hover:underline font-bold cursor-pointer ml-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          )}

          {/* Social / Direct Google Sign In */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <button
              id="auth-google-btn"
              type="button"
              onClick={loginWithGoogle}
              className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {user && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <p className="text-xs text-amber-900">
                  Currently active as <strong className="text-amber-800">{user.name}</strong> ({user.email})
                </p>
                <button
                  type="button"
                  onClick={onSuccess}
                  className="mt-1.5 text-xs text-amber-700 font-bold hover:underline"
                >
                  Continue to Planner Dashboard →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

