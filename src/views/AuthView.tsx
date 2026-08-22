import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  MapPin,
  Globe,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Plane,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthViewProps {
  onSuccess: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
];

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const {
    user,
    loginWithEmail,
    registerWithDetails,
    loginAsDemoUser,
    resetPassword,
    resetPasswordDirectly,
  } = useAuth();

  // Strict 2-Step Gate State:
  // Step 1 must complete before Step 2 (Registration) can be accessed
  const [isLoginCompleted, setIsLoginCompleted] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'forgot'>('login');

  // Screen 1: Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Screen 2: Registration state (matching wireframe)
  const [selectedPhoto, setSelectedPhoto] = useState(PRESET_AVATARS[0]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMode, setForgotMode] = useState<'link' | 'direct'>('direct');
  const [newDirectPassword, setNewDirectPassword] = useState('');
  const [confirmDirectPassword, setConfirmDirectPassword] = useState('');
  const [showDirectPass, setShowDirectPass] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If user is authenticated in state but hasn't completed registration, lock them on Screen 2
  useEffect(() => {
    if (user && !user.registration_completed) {
      setIsLoginCompleted(true);
      setCurrentPage('register');
      if (user.email && !regEmail) setRegEmail(user.email);
      if (user.first_name && !firstName) setFirstName(user.first_name);
      if (user.last_name && !lastName) setLastName(user.last_name);
      if (user.city && !city) setCity(user.city);
      if (user.country && !country) setCountry(user.country);
      if (user.phone && !phoneNumber) setPhoneNumber(user.phone);
      if (user.photo && !selectedPhoto) setSelectedPhoto(user.photo);
      if (user.additional_info && !additionalInfo) setAdditionalInfo(user.additional_info);
    }
  }, [user]);

  // Prevent direct access to registration if login has not completed
  const handleAttemptRegisterTab = () => {
    if (!isLoginCompleted) {
      setErrorMsg('Access Restricted: Step 1 (Login) must be completed first before proceeding to Registration.');
      return;
    }
    setErrorMsg(null);
    setCurrentPage('register');
  };

  // Handle Step 1: Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanInput = loginUsername.trim();
    if (!cleanInput || !loginPassword) {
      setErrorMsg('Please enter both your Username / Email and Password.');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(cleanInput, loginPassword, true);

      // Derive initial details from login input to pre-populate Screen 2
      const derivedEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput.toLowerCase()}@globetrotter.io`;
      const namePart = cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput;
      const cleanName = namePart.replace(/[._-]/g, ' ');
      const words = cleanName.split(' ').filter(Boolean);
      const derivedFirst = words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : 'Global';
      const derivedLast = words.length > 1 ? words.slice(1).join(' ') : 'Traveler';

      if (!regEmail) setRegEmail(derivedEmail);
      if (!firstName) setFirstName(derivedFirst);
      if (!lastName) setLastName(derivedLast);
      if (!regPassword) setRegPassword(loginPassword);
      if (!confirmPassword) setConfirmPassword(loginPassword);

      // Mark Step 1 complete & unlock Step 2 (Registration)
      setIsLoginCompleted(true);
      setSuccessMsg('Step 1 (Login) verified successfully! Opening compulsory Step 2 (Registration Screen)...');

      setTimeout(() => {
        setSuccessMsg(null);
        setCurrentPage('register');
        setLoading(false);
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please verify your credentials.');
      setLoading(false);
    }
  };

  // Handle Step 2: Registration submission (compulsory to open the app)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanFirst = firstName.trim() || user?.first_name || (user?.name ? user.name.split(' ')[0] : 'Global');
    const cleanLast = lastName.trim() || user?.last_name || (user?.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : 'Traveler');
    const cleanEmail = regEmail.trim() || user?.email || (loginUsername ? (loginUsername.includes('@') ? loginUsername : `${loginUsername}@globetrotter.io`) : 'traveler@globetrotter.io');
    const effectivePass = regPassword || loginPassword || 'password123';

    if (!cleanFirst) {
      setErrorMsg('Please enter your First Name.');
      return;
    }
    if (!cleanLast) {
      setErrorMsg('Please enter your Last Name.');
      return;
    }
    if (!cleanEmail) {
      setErrorMsg('Please enter your Email Address.');
      return;
    }
    if (regPassword && confirmPassword && regPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await registerWithDetails({
        firstName: cleanFirst,
        lastName: cleanLast,
        email: cleanEmail,
        phone: phoneNumber.trim() || user?.phone || '',
        city: city.trim() || user?.city || 'New York',
        country: country.trim() || user?.country || 'United States',
        additionalInfo: additionalInfo.trim() || user?.additional_info || user?.bio || '',
        photo: selectedPhoto || user?.photo,
        password: effectivePass,
      });

      setSuccessMsg('Registration completed! Launching GlobeTrotter travel application...');
      onSuccess();
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMsg(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload from computer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle 1-click demo login & transition to registration
  const handleQuickDemo = (preset: 'aarav' | 'priya' | 'admin') => {
    setErrorMsg(null);
    setLoading(true);
    loginAsDemoUser(preset, true);

    if (preset === 'priya') {
      setFirstName('Priya');
      setLastName('Patel');
      setRegEmail('priya.patel@globetrotter.io');
      setPhoneNumber('+44 20 7946 0912');
      setCity('London');
      setCountry('United Kingdom');
      setAdditionalInfo('Botanical garden lover, coastal backpacker, and slow coffee enthusiast.');
      setSelectedPhoto('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80');
    } else if (preset === 'admin') {
      setFirstName('Marcus');
      setLastName('Vance');
      setRegEmail('admin@globetrotter.io');
      setPhoneNumber('+1 (415) 890-1234');
      setCity('San Francisco');
      setCountry('United States');
      setAdditionalInfo('GlobeTrotter Lead Curator & Worldwide Destination Architect.');
      setSelectedPhoto('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80');
    } else {
      setFirstName('Elena');
      setLastName('Rostova');
      setRegEmail('elena.travels@globetrotter.io');
      setPhoneNumber('+1 (555) 234-8901');
      setCity('New York');
      setCountry('United States');
      setAdditionalInfo('World traveler, culture enthusiast & food hunter exploring global destinations.');
      setSelectedPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80');
    }

    setRegPassword('password123');
    setConfirmPassword('password123');

    setIsLoginCompleted(true);
    setSuccessMsg('Demo credentials verified! Proceeding to Step 2 (Registration Screen)...');

    setTimeout(() => {
      setSuccessMsg(null);
      setCurrentPage('register');
      setLoading(false);
    }, 600);
  };

  // Reset login step if user wants to start over
  const handleResetToLogin = () => {
    setIsLoginCompleted(false);
    setCurrentPage('login');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Switch to Forgot Password
  const handleOpenForgotPassword = () => {
    if (loginUsername) {
      setForgotEmail(loginUsername.includes('@') ? loginUsername : `${loginUsername}@globetrotter.io`);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setCurrentPage('forgot');
  };

  // Handle Forgot Password Form Submission
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    setLoading(true);

    if (forgotMode === 'link') {
      try {
        const res = await resetPassword(cleanEmail);
        setSuccessMsg(res.message);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to send reset email. Please try direct reset.');
      } finally {
        setLoading(false);
      }
    } else {
      // Direct reset mode
      if (!newDirectPassword || newDirectPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      if (newDirectPassword !== confirmDirectPassword) {
        setErrorMsg('Passwords do not match.');
        setLoading(false);
        return;
      }

      try {
        const res = await resetPasswordDirectly(cleanEmail, newDirectPassword);
        if (res.success) {
          setSuccessMsg(`${res.message} Redirecting to Step 1 (Login Screen)...`);
          setLoginUsername(cleanEmail);
          setLoginPassword(newDirectPassword);
          setTimeout(() => {
            setCurrentPage('login');
            setSuccessMsg('Password updated! Click "Complete Login & Proceed to Step 2" to log in.');
          }, 1500);
        } else {
          setErrorMsg(res.message);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Unable to update password. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto py-2 sm:py-6">
      {/* 2-Step Sequential Navigation Header */}
      <div className="flex flex-col items-center justify-center mb-6 space-y-2">
        <div className="bg-slate-900/85 p-1.5 rounded-2xl border border-slate-700/60 inline-flex shadow-2xl backdrop-blur-md">
          {/* Step 1: Login Button */}
          <button
            id="step-1-login-btn"
            type="button"
            onClick={() => {
              setCurrentPage('login');
              setErrorMsg(null);
            }}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              currentPage === 'login'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isLoginCompleted ? (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-bold">
                ✓
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                1
              </span>
            )}
            <span>1. Login Screen</span>
          </button>

          {/* Step 2: Registration Button (Locked until Step 1 completes) */}
          <button
            id="step-2-registration-btn"
            type="button"
            onClick={handleAttemptRegisterTab}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              currentPage === 'register'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-600/30'
                : isLoginCompleted
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-500 hover:text-slate-400 opacity-80'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>2. Registration Screen</span>
            {!isLoginCompleted && (
              <span className="text-[10px] bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                Locked 🔒
              </span>
            )}
          </button>
        </div>

        <p className="text-[11px] text-amber-200/70 font-medium">
          {isLoginCompleted
            ? '✅ Step 1 (Login) Completed &bull; Complete Step 2 (Registration) to open the travel app'
            : '🔒 Complete Step 1 (Login) first to unlock Step 2 (Registration)'}
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden transition-all duration-300">
        {/* Error notification */}
        {errorMsg && (
          <div
            id="auth-error-banner"
            className="bg-rose-50 border-b border-rose-200 p-4 text-rose-700 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div
            id="auth-success-banner"
            className="bg-emerald-50 border-b border-emerald-200 p-4 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in duration-200"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGE 1: LOGIN SCREEN (SCREEN 1) */}
        {/* ========================================================================= */}
        {currentPage === 'login' && (
          <div className="p-6 sm:p-10 max-w-md mx-auto">
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              {/* Circular Photo / Avatar / Logo */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-amber-500/30 p-1 bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 shadow-xl shadow-amber-600/20 flex items-center justify-center overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                      alt="Traveler Photo"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-slate-900 text-amber-400 p-1.5 rounded-full border border-slate-700 shadow">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mt-3">
                  <span>Step 1 of 2: Login First</span>
                </div>

                <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your credentials below to access your travel portal
                </p>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Username / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="login-username-input"
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter username or email address"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <button
                    id="forgot-password-btn"
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              {/* Login Button (Completes Step 1 and advances to Step 2) */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-sm shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Complete Login & Proceed to Step 2</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Sequential explanation note */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 text-center">
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  🔒 <strong>Registration is unlocked</strong> once login is verified. Proceed above to finalize your profile before entering the app.
                </p>
              </div>

              {/* 1-Click Quick Demo Profiles */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
                  ⚡ 1-Click Instant Login:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('aarav')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-center transition-all text-xs cursor-pointer group"
                  >
                    <p className="font-bold text-slate-800 group-hover:text-amber-700 text-[11px]">Elena</p>
                    <p className="text-[9px] text-slate-500">Traveler</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('priya')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-center transition-all text-xs cursor-pointer group"
                  >
                    <p className="font-bold text-slate-800 group-hover:text-amber-700 text-[11px]">Priya</p>
                    <p className="text-[9px] text-slate-500">Explorer</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('admin')}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-center transition-all text-xs cursor-pointer group"
                  >
                    <p className="font-bold text-amber-900 text-[11px]">Marcus</p>
                    <p className="text-[9px] text-amber-700 font-medium">Admin</p>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGE 2: REGISTRATION SCREEN (SCREEN 2) */}
        {/* ========================================================================= */}
        {currentPage === 'register' && isLoginCompleted && (
          <div className="p-6 sm:p-10 max-w-2xl mx-auto">
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              {/* Stepper Status Badge */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span className="text-xs font-bold text-slate-700">Step 1: Login Complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span className="text-xs font-bold text-amber-700">Step 2: Traveler Registration</span>
                </div>
              </div>

              {/* Circular Photo / Avatar Picker at Top matching wireframe */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-amber-500/30 p-1 bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 shadow-xl shadow-amber-600/20 flex items-center justify-center overflow-hidden">
                    <img
                      src={selectedPhoto}
                      alt="Profile Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <label
                    htmlFor="photo-upload-input"
                    className="absolute -bottom-1 -right-1 bg-slate-900 hover:bg-amber-600 text-white p-2 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all"
                    title="Upload or Change Photo"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      id="photo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 cursor-pointer"
                  >
                    {showAvatarPicker ? 'Hide Avatar Presets' : 'Choose Photo / Avatar'}
                  </button>
                </div>

                {/* Avatar Presets Drawer */}
                {showAvatarPicker && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-2.5 animate-in fade-in duration-150">
                    {PRESET_AVATARS.map((avatar, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedPhoto(avatar);
                          setShowAvatarPicker(false);
                        }}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          selectedPhoto === avatar ? 'border-amber-600 scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={avatar} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                  Traveler Registration
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Complete your traveler profile to open the GlobeTrotter world planner app
                </p>
              </div>

              {/* Registration Form Card Container matching mockup layout */}
              <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
                {/* Row 1: First Name | Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-first-name"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First Name"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-last-name"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last Name"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Email Address | Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="traveler@example.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: City | Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      City
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. San Francisco"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Country
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-country"
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. United States"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: Additional Information ... (Textarea matching wireframe) */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Additional Information ...
                  </label>
                  <div className="relative">
                    <textarea
                      id="reg-additional-info"
                      rows={3}
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Additional Information ... (e.g. travel preferences, favorite destinations, dietary requirements, bucket list places)"
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y"
                    />
                  </div>
                </div>

                {/* Row 5: Password | Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters (or uses login password)"
                        className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-confirm-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Centered Register Now Button matching wireframe */}
              <div className="flex flex-col items-center justify-center space-y-3 pt-2">
                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-72 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-sm shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Register Now</span>
                    </>
                  )}
                </button>

                {/* Cancel & return to login */}
                <button
                  id="cancel-and-return-to-login-btn"
                  type="button"
                  onClick={handleResetToLogin}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer pt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel & Change Login Account</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Fallback if user somehow lands on register without login */}
        {currentPage === 'register' && !isLoginCompleted && (
          <div className="p-10 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Registration Locked</h3>
            <p className="text-xs text-slate-600">
              You must complete Step 1 (Login) before registering your profile details.
            </p>
            <button
              onClick={() => setCurrentPage('login')}
              className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold shadow hover:bg-amber-700 cursor-pointer"
            >
              Go to Login Screen (Screen 1)
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FORGOT PASSWORD SCREEN */}
        {/* ========================================================================= */}
        {currentPage === 'forgot' && (
          <div className="p-6 sm:p-10 max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Reset Password
              </h2>
              <p className="text-xs text-slate-500">
                Choose how you would like to recover or reset your account password
              </p>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setForgotMode('direct');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  forgotMode === 'direct'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Direct Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotMode('link');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  forgotMode === 'link'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Send Email Link
              </button>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Account Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="traveler@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {forgotMode === 'direct' && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="forgot-new-password"
                        type={showDirectPass ? 'text' : 'password'}
                        required
                        value={newDirectPassword}
                        onChange={(e) => setNewDirectPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDirectPass(!showDirectPass)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showDirectPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="forgot-confirm-password"
                        type={showDirectPass ? 'text' : 'password'}
                        required
                        value={confirmDirectPassword}
                        onChange={(e) => setConfirmDirectPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                id="forgot-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-sm shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>
                      {forgotMode === 'direct'
                        ? 'Update Password & Return to Login'
                        : 'Send Password Reset Link'}
                    </span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  id="forgot-back-to-login-btn"
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setCurrentPage('login');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Step 1 (Login Screen)</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
