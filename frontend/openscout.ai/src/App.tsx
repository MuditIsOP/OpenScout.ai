import React, { useState, useEffect } from 'react';
import { PageContainer } from './components/layout/PageContainer';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Progress } from './components/ui/Progress';
import { GitHubLoginButton } from './components/auth/GitHubLoginButton';
import { AnalysisProgress } from './components/analysis/AnalysisProgress';
import { AnalysisSummary } from './components/analysis/AnalysisSummary';
import { DeveloperProfileCard } from './components/profile/DeveloperProfileCard';
import { RepositoryCard } from './components/recommendations/RepositoryCard';
import { RepositoryFilters } from './components/recommendations/RepositoryFilters';
import { PreferencesForm } from './components/onboarding/PreferencesForm';
import { EditPreferencesDrawer } from './components/profile/EditPreferencesDrawer';
import { AppSidebar } from './components/layout/AppSidebar';
import { DashboardHeader } from './components/layout/DashboardHeader';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { motion } from 'framer-motion';
import logoImg from './assets/OpenScout-logo.png';
import logoMain from './assets/OpenScout-main.png';

import { LoadingState } from './components/states/LoadingState';
import { EmptyState } from './components/states/EmptyState';
import { ErrorState } from './components/states/ErrorState';
import { RateLimitState } from './components/states/RateLimitState';

import {
  DeveloperProfile,
  RepositoryRecommendation,
  UserPreferences,
  ProfileAnalysisStep,
} from './types';

import {
  loginWithGitHub,
  logoutUser,
  getLoggedInUser,
  getDeveloperProfile,
  analyzeGitHubProfile,
  saveUserPreferences,
  getRecommendations,
  reanalyzeDeveloperProfile,
  isOnboardingComplete,
  generateInitialRecommendations,
} from './lib/api';

import { INITIAL_ANALYSIS_STEPS } from './lib/mock-data';

import {
  GitBranch,
  Github,
  Star,
  GitFork,
  CheckCircle,
  TrendingUp,
  Cpu,
  Lock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Sliders,
  Bell,
  Code,
  Shield,
  Activity,
  Heart,
  ChevronRight,
} from 'lucide-react';

export default function App() {
  // ----------------------------------------------------
  // Application routing / state views
  // 'landing' | 'analysis' | 'preferences' | 'dashboard'
  // ----------------------------------------------------
  const [currentView, setCurrentView] = useState<'landing' | 'analysis' | 'preferences' | 'dashboard'>('landing');
  const [sidebarView, setSidebarView] = useState<'dashboard' | 'profile' | 'preferences'>('dashboard');

  // Auth & Profile states
  const [loggedInUser, setLoggedInUser] = useState<DeveloperProfile | null>(null);
  const [usernameInput, setUsernameInput] = useState('octocat-scout');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Analysis states
  const [analysisSteps, setAnalysisSteps] = useState<ProfileAnalysisStep[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzedProfile, setAnalyzedProfile] = useState<DeveloperProfile | null>(null);
  const [showAnalysisSummary, setShowAnalysisSummary] = useState(false);

  // Recommendation states
  const [recommendations, setRecommendations] = useState<RepositoryRecommendation[]>([]);
  const [isRecsLoading, setIsRecsLoading] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isEditPrefsOpen, setIsEditPrefsOpen] = useState(false);

  // Global filters
  const [filters, setFilters] = useState({
    language: '',
    difficulty: '',
    activity: '',
    minStars: 0,
    beginnerFriendlyOnly: false,
    search: '',
  });

  // Restore session if available on startup
  useEffect(() => {
    const user = getLoggedInUser();
    if (user) {
      setLoggedInUser(user);
      const onboarded = isOnboardingComplete();
      if (onboarded) {
        setCurrentView('dashboard');
        loadDashboardData();
      } else {
        setCurrentView('preferences');
      }
    }
  }, []);

  const loadDashboardData = async () => {
    setIsRecsLoading(true);
    try {
      const recs = await getRecommendations();
      setRecommendations(recs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecsLoading(false);
    }
  };

  // ----------------------------------------------------
  // Core Handlers
  // ----------------------------------------------------

  const handleGitHubLogin = async (simulatedUser: string = 'octocat-scout') => {
    setIsLoggingIn(true);
    setAnalysisError(null);
    try {
      // Step 1: Login
      const profile = await loginWithGitHub(simulatedUser);
      setLoggedInUser(profile);

      // Step 2: Trigger progressive analysis transition
      setCurrentView('analysis');
      triggerAnalysis(profile.githubUsername);
    } catch (err: any) {
      setAnalysisError(err.message || 'API_UNAVAILABLE');
      setCurrentView('analysis'); // route to show error handler
    } finally {
      setIsLoggingIn(false);
    }
  };

  const triggerAnalysis = async (username: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setShowAnalysisSummary(false);
    setAnalyzedProfile(null);

    // Deep clone original steps
    const stepsCopy = INITIAL_ANALYSIS_STEPS.map((s) => ({ ...s, status: 'pending' as const }));
    setAnalysisSteps(stepsCopy);

    try {
      const profile = await analyzeGitHubProfile(username, (stepId, status) => {
        setAnalysisSteps((prev) =>
          prev.map((s) => (s.id === stepId ? { ...s, status } : s))
        );
      });

      setAnalyzedProfile(profile);
      setShowAnalysisSummary(true);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // allow users to preview snapshot

      // Navigation Logic: redirect based on confidence
      if (profile.confidenceScore >= 50) {
        setLoggedInUser(profile);
        setCurrentView('dashboard');
        loadDashboardData();
      } else {
        // Low confidence fallback
        setLoggedInUser(profile);
        setCurrentView('preferences');
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'ANALYSIS_FAILED');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSavePreferences = async (prefs: UserPreferences) => {
    setIsSavingPrefs(true);
    try {
      const updatedProfile = await saveUserPreferences(prefs);
      setLoggedInUser(updatedProfile);
      setCurrentView('dashboard');
      loadDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setLoggedInUser(null);
    setAnalyzedProfile(null);
    setRecommendations([]);
    setCurrentView('landing');
    setSidebarView('dashboard');
    setFilters({
      language: '',
      difficulty: '',
      activity: '',
      minStars: 0,
      beginnerFriendlyOnly: false,
      search: '',
    });
  };

  const handleReanalyzeProfile = async () => {
    if (!loggedInUser) return;
    setIsRecsLoading(true);
    try {
      const reanalyzed = await reanalyzeDeveloperProfile(loggedInUser.githubUsername);
      setLoggedInUser(reanalyzed);
      const recs = await getRecommendations();
      setRecommendations(recs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      language: '',
      difficulty: '',
      activity: '',
      minStars: 0,
      beginnerFriendlyOnly: false,
      search: '',
    });
  };

  // ----------------------------------------------------
  // Dynamic Client-Side Filtering
  // ----------------------------------------------------
  const filteredRecommendations = recommendations.filter((rec) => {
    if (filters.language && rec.primaryLanguage.toLowerCase() !== filters.language.toLowerCase()) {
      return false;
    }
    if (filters.difficulty && rec.difficulty.toLowerCase() !== filters.difficulty.toLowerCase()) {
      return false;
    }
    if (filters.minStars && rec.stars < filters.minStars) {
      return false;
    }
    if (filters.beginnerFriendlyOnly && !rec.beginnerFriendly) {
      return false;
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const matchName = rec.name.toLowerCase().includes(s);
      const matchOwner = rec.owner.toLowerCase().includes(s);
      const matchDesc = rec.description.toLowerCase().includes(s);
      const matchLang = rec.primaryLanguage.toLowerCase().includes(s);
      if (!matchName && !matchOwner && !matchDesc && !matchLang) {
        return false;
      }
    }
    return true;
  });

  // Convert current developer profile to UserPreferences schema to edit
  const getProfilePreferences = (): UserPreferences | undefined => {
    if (!loggedInUser) return undefined;
    return {
      languages: loggedInUser.languages.map((l) => l.name),
      frameworks: loggedInUser.frameworks.map((f) => f.name),
      interests: loggedInUser.interests,
      experienceLevel: loggedInUser.experienceLevel,
      preferredDifficulties: ['beginner', 'moderate'], // default initial filter
      contributionGoals: [],
    };
  };

  // ----------------------------------------------------
  // View 1: Landing Page UI
  // ----------------------------------------------------
  const renderLandingPage = () => {
    // Framer Motion Animation Variants
    const fadeInUp = {
      hidden: { opacity: 0, y: 40 },
      visible: (custom: number) => ({
        opacity: 1,
        y: 0,
        transition: { 
          delay: custom * 0.18,
          duration: 0.9,
          ease: [0.16, 1, 0.3, 1] 
        }
      })
    };

    const scaleIn = {
      hidden: { opacity: 0, scale: 0.96 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { 
          delay: 0.4,
          duration: 0.9, 
          ease: [0.16, 1, 0.3, 1] 
        }
      }
    };

    const staggerContainer = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.12,
          delayChildren: 0.15
        }
      }
    };

    const itemReveal = {
      hidden: { opacity: 0, y: 25 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] }
      }
    };

    return (
      <div className="flex flex-col min-h-screen font-sans relative bg-[#020308] text-slate-100 overflow-x-hidden">
        {/* Cryptera-style space background canvas */}
        <div className="space-bg-canvas">
          <div className="circular-grid" />
          <div className="bottom-glow" />
          
          {/* Twinkling Star Dots */}
          <div className="star-dot animate-twinkle-slow" style={{ top: '12%', left: '10%', transform: 'scale(0.8)' }} />
          <div className="star-dot animate-twinkle-medium" style={{ top: '24%', left: '86%', transform: 'scale(1.2)' }} />
          <div className="star-dot animate-twinkle-fast" style={{ top: '48%', left: '16%', transform: 'scale(1)' }} />
          <div className="star-dot animate-twinkle-slow" style={{ top: '68%', left: '76%', transform: 'scale(0.7)' }} />
          <div className="star-dot animate-twinkle-medium" style={{ top: '82%', left: '20%', transform: 'scale(1.1)' }} />
          <div className="star-dot animate-twinkle-fast" style={{ top: '15%', left: '64%', transform: 'scale(0.9)' }} />
          
          {/* Twinkling Star Crosses */}
          <div className="star-cross animate-twinkle-slow" style={{ top: '20%', left: '24%' }} />
          <div className="star-cross animate-twinkle-fast" style={{ top: '16%', left: '78%' }} />
          <div className="star-cross animate-twinkle-medium" style={{ top: '56%', left: '88%' }} />
          <div className="star-cross animate-twinkle-slow" style={{ top: '62%', left: '14%' }} />
        </div>

        {/* Floating Capsule Glassmorphic Header */}
        <div className="sticky top-0 z-50 w-full px-4 py-4 md:px-8">
          <header className="glass-navbar rounded-full max-w-7xl mx-auto h-16 flex items-center justify-between px-6 md:px-10 transition-all duration-300">
            <div className="flex items-center gap-3">
              <img 
                src={logoImg} 
                alt="OpenScout.ai Logo" 
                className="h-8 w-auto object-contain rounded-lg border border-white/10" 
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wider font-display bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  OpenScout.ai
                </span>
                <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase font-bold">
                  Phase 1 Scout
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-xs text-slate-400 hover:text-white transition-colors relative group py-2 font-medium">
                <span>How It Works</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#features" className="text-xs text-slate-400 hover:text-white transition-colors relative group py-2 font-medium">
                <span>Features</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#privacy" className="text-xs text-slate-400 hover:text-white transition-colors relative group py-2 font-medium">
                <span>Privacy Promise</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full" />
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <a 
                href="https://discord.gg" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-2 px-4 border border-white/5 bg-white/5 rounded-full font-medium"
              >
                <span>Join Our Discord</span>
              </a>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 border-none text-white font-semibold rounded-full px-5 py-2 group cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-300"
                  onClick={() => handleGitHubLogin('octocat-scout')}
                >
                  <Github className="w-3.5 h-3.5 mr-2 text-white" />
                  <span>Sign Up</span>
                </Button>
                <button 
                  onClick={() => handleGitHubLogin('octocat-scout')}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all shadow-[0_0_12px_rgba(99,102,241,0.25)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  <ArrowRight className="w-3.5 h-3.5 -rotate-45" />
                </button>
              </div>
            </div>
          </header>
        </div>

        {/* Hero Section */}
        <section className="relative z-10 px-6 py-24 md:py-32 flex flex-col items-center text-center max-w-6xl mx-auto space-y-10">
          <motion.div 
            custom={0}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 p-1 border border-white/10 bg-white/5 rounded-full font-medium text-[11px] text-slate-300 tracking-wide shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          >
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">OpenScout</span>
            <span className="pr-3 text-slate-400 font-sans">Secure • Smart • Decentralized Open-Source Matching</span>
          </motion.div>

          <motion.h1 
            custom={1}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-5xl md:text-7xl lg:text-8xl font-black font-display text-white tracking-tight leading-[1.05] max-w-5xl"
          >
            Powering the Next Generation{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              of Open-Source Contributions
            </span>
          </motion.h1>

          <motion.p 
            custom={2}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-base md:text-lg lg:text-xl text-slate-400 max-w-3xl leading-relaxed font-sans font-medium"
          >
            OpenScout.ai analyzes your public GitHub profile—assessing commit patterns, language distributions, and repository complexity—to recommend repositories perfectly aligned with your expertise, experience, and contribution goals.
          </motion.p>

          {/* Cryptera-style horizontal capsule input box */}
          <motion.div 
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="w-full max-w-xl mx-auto pt-4"
          >
            <div className="capsule-input-container">
              <select
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="flex-1 bg-transparent text-slate-200 text-sm py-2 focus:outline-none cursor-pointer font-sans appearance-none"
                style={{ border: 'none' }}
              >
                <option value="octocat-scout" className="bg-[#0b0c15] text-slate-200">octocat-scout (Sufficient Profile - 87% Match)</option>
                <option value="johndoe-codes" className="bg-[#0b0c15] text-slate-200">johndoe-codes (Low Confidence Fallback - 32% Match)</option>
                <option value="empty-coder" className="bg-[#0b0c15] text-slate-200">empty-coder (Empty Profile - Manual Preferences)</option>
                <option value="error-coder" className="bg-[#0b0c15] text-slate-200">error-coder (Simulated Connection Error)</option>
                <option value="limit-coder" className="bg-[#0b0c15] text-slate-200">limit-coder (Simulated Rate Limit Error)</option>
              </select>
              
              <button
                onClick={() => handleGitHubLogin(usernameInput)}
                disabled={isLoggingIn}
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full px-7 py-3.5 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:scale-[1.02] duration-300 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                {isLoggingIn ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Github className="w-4 h-4" />
                )}
                <span>Scout Profile</span>
              </button>
            </div>
            <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-3.5 font-sans">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>OAuth handshake secured via Clerk. We never write to repositories.</span>
            </div>
          </motion.div>

          {/* Client & Partners Logos Section */}
          <motion.div 
            custom={3}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="w-full pt-16 pb-6 text-center space-y-6"
          >
            <h4 className="text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase font-sans">Our Recent Clients & Partners</h4>
            
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-50 hover:opacity-85 transition-opacity duration-500">
              <div className="flex items-center gap-2 text-slate-400 font-sans font-bold text-sm tracking-wide">
                <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
                  <Code className="w-3 h-3 text-purple-400" />
                </div>
                <span>Ephemeral</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-sans font-bold text-sm tracking-wide">
                <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
                  <Star className="w-3 h-3 text-blue-400" />
                </div>
                <span>Wildcrafted</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-sans font-bold text-sm tracking-wide">
                <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
                  <Cpu className="w-3 h-3 text-pink-400" />
                </div>
                <span>Codecraft_</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-sans font-bold text-sm tracking-wide">
                <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
                  <Shield className="w-3 h-3 text-emerald-400" />
                </div>
                <span>Convergence</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-sans font-bold text-sm tracking-wide">
                <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <span>ImgCompress</span>
              </div>
            </div>
          </motion.div>

          {/* Floating dashboard mockup using OpenScout-main.png */}
          <motion.div
            custom={4}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="w-full max-w-5xl pt-16 relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/5 blur-3xl rounded-full opacity-60 pointer-events-none" />
            
            <div className="relative border border-white/10 bg-slate-950/45 rounded-3xl p-3 shadow-[0_30px_70px_rgba(0,0,0,0.6)] backdrop-blur-md overflow-hidden transform group-hover:scale-[1.01] transition-transform duration-500">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5 rounded-t-2xl">
                <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="text-[10px] text-slate-500 ml-4 font-mono">OpenScout Analysis Engine Dashboard Mockup</span>
              </div>
              <img 
                src={logoMain} 
                alt="OpenScout Main Showcase" 
                className="w-full h-auto object-cover rounded-b-2xl border border-white/5 shadow-2xl" 
              />
            </div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="border-t border-white/5 bg-slate-950/10 py-28 px-6 md:px-16 relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto space-y-16 relative z-10"
          >
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white">How OpenScout.ai Works</h2>
              <p className="text-[10px] text-slate-500 max-w-sm mx-auto font-mono uppercase tracking-wider">Three simple developer steps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div variants={itemReveal} className="glass-card-premium rounded-2xl p-8 space-y-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-mono font-bold text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.1)]">
                  01
                </div>
                <h3 className="text-lg font-bold font-display text-white">Connect GitHub</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Sign in securely with your GitHub account using standard OAuth. OpenScout only requests read access to public metadata profiles.
                </p>
              </motion.div>

              <motion.div variants={itemReveal} className="glass-card-premium rounded-2xl p-8 space-y-5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-sm font-mono font-bold text-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.1)]">
                  02
                </div>
                <h3 className="text-lg font-bold font-display text-white">Analyze Developer Profile</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Our background models review language sizes, active frameworks in package config files, and commit weights to determine real expertise.
                </p>
              </motion.div>

              <motion.div variants={itemReveal} className="glass-card-premium rounded-2xl p-8 space-y-5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-sm font-mono font-bold text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
                  03
                </div>
                <h3 className="text-lg font-bold font-display text-white">Discover Repositories</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Receive personalized, high-fidelity recommendations ranked by a calculated percentage matching score. Instantly find beginner issues!
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-white/5 py-28 px-6 md:px-16 relative overflow-hidden">
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto space-y-16 relative z-10"
          >
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white">Engineered for Contributors</h2>
              <p className="text-[10px] text-slate-500 max-w-sm mx-auto font-mono uppercase tracking-wider">Features built to eliminate onboarding friction</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'GitHub Profile Analysis', desc: 'No complex questionnaires. We extract frameworks and experience statistics from active repositories.', icon: Github },
                { title: 'Skill-Based Matching', desc: 'Identifies deep semantic matches in TypeScript, Python, or Rust codebases instead of surface text keywords.', icon: Code },
                { title: 'Experience-Aware Recommendations', desc: 'Matches beginners with high-quality documentation, and seniors with core architectural updates.', icon: Sliders },
                { title: 'Repository Activity Filtering', desc: 'Filters out abandoned codebases. Recommends repositories with recent commit histories and active triaging.', icon: Activity },
                { title: 'Personalized Recommendation Reasons', desc: 'Provides comprehensive, transparent outlines indicating exactly why each repository fits your skillset.', icon: Sparkles },
                { title: 'Secure Onboarding Fallback', desc: 'Incomplete profile or few public codebases? Easily input custom languages and framework preferences.', icon: Shield },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div 
                    key={i} 
                    variants={itemReveal}
                    className="glass-card-premium rounded-2xl space-y-4 p-8 flex flex-col items-start"
                  >
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-purple-400 shadow-[0_0_10px_rgba(139,92,246,0.15)]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-slate-200 font-display">{feature.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">{feature.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* Privacy Promise Section */}
        <section id="privacy" className="border-t border-white/5 bg-slate-950/10 py-28 px-6 md:px-16">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            custom={0}
            className="max-w-xl mx-auto text-center space-y-6"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Shield className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-bold font-display text-white">Our Privacy Promise</h2>
            
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              We operate strictly under permission-restricted security. OpenScout.ai only accesses required public profiles. Private repositories are never parsed or cached, and your technical data is never rented or sold to advertiser grids.
            </p>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 px-6 md:px-16 bg-[#040610]/95 relative z-10">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-sans">
            <div className="flex items-center gap-3">
              <img 
                src={logoImg} 
                alt="OpenScout.ai Logo" 
                className="h-6 w-auto object-contain rounded-sm" 
              />
              <span className="font-bold text-slate-400 font-display">OpenScout.ai</span>
              <span>© {new Date().getFullYear()}</span>
            </div>

            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Security</a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1 hover:text-slate-300 transition-colors group"
              >
                <Github className="w-3.5 h-3.5 text-slate-400 transition-transform group-hover:scale-110 duration-200" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  // ----------------------------------------------------
  // View 2: GitHub Profile Analysis UI
  // ----------------------------------------------------
  const renderAnalysisPage = () => {
    // If rate limit or other error occurred before triggering analysis
    if (analysisError === 'API_UNAVAILABLE') {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <ErrorState
            message="We were unable to communicate with the GitHub OAuth services."
            onRetry={() => handleGitHubLogin(usernameInput)}
            onManualPreferences={() => setCurrentView('preferences')}
          />
        </div>
      );
    }

    if (analysisError === 'RATE_LIMIT_EXCEEDED') {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <RateLimitState onRetry={() => handleGitHubLogin(usernameInput)} />
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center p-6 font-sans">
        <Card variant="default" className="w-full max-w-xl p-8 border-slate-900/80 bg-slate-950/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
          
          <div className="space-y-6 relative z-10">
            {/* Header branding */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-5">
              <div className="flex items-center gap-2.5">
                <GitBranch className="w-5 h-5 text-purple-400 animate-pulse" />
                <h2 className="text-base font-bold font-display text-white">Analyzing Your Profile</h2>
              </div>
              <Badge variant="blue">scout engine v1.0</Badge>
            </div>

            {/* Simulated target account bar */}
            {loggedInUser && (
              <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl p-4 flex items-center gap-4">
                <img
                  src={loggedInUser.avatarUrl}
                  alt={loggedInUser.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-200 truncate">{loggedInUser.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">@{loggedInUser.githubUsername}</p>
                </div>
              </div>
            )}

            {/* If error occurs during step processing */}
            {analysisError ? (
              <ErrorState
                message="GitHub profiling failed during codebase indexing. This usually happens when rate-limiting metrics trigger."
                onRetry={() => triggerAnalysis(loggedInUser?.githubUsername || usernameInput)}
                onManualPreferences={() => setCurrentView('preferences')}
              />
            ) : (
              <div className="space-y-6">
                <AnalysisProgress steps={analysisSteps} />

                {/* Snapshots summary after completing */}
                {analyzedProfile && showAnalysisSummary && (
                  <div className="animate-fade-in">
                    <AnalysisSummary profile={analyzedProfile} />
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  // ----------------------------------------------------
  // View 3: Onboarding Manual Preferences UI
  // ----------------------------------------------------
  const renderPreferencesPage = () => {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-6 font-sans">
        <Card variant="default" className="w-full max-w-3xl p-8 border-slate-900 bg-slate-950/20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full" />
          
          <div className="space-y-6 relative z-10">
            {/* Header branding */}
            <div className="border-b border-slate-900 pb-5">
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block mb-1">
                Profile Onboarding
              </span>
              <h2 className="text-xl font-bold font-display text-white">
                Help us personalize your recommendations
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                If your GitHub profile activity is quiet or newly created, specify your favorite tech stack manually to seed matching repositories.
              </p>
            </div>

            <PreferencesForm
              onSubmit={handleSavePreferences}
              onReanalyze={
                loggedInUser
                  ? () => {
                      setCurrentView('analysis');
                      triggerAnalysis(loggedInUser.githubUsername);
                    }
                  : undefined
              }
              isSubmitting={isSavingPrefs}
            />
          </div>
        </Card>
      </div>
    );
  };

  // ----------------------------------------------------
  // View 4: Dashboard Matches Flow
  // ----------------------------------------------------
  const renderDashboardPage = () => {
    if (!loggedInUser) return null;

    // Sidebar navigation trigger views on single page container
    const renderSidebarContent = () => {
      if (sidebarView === 'profile') {
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold font-display text-white border-b border-slate-900 pb-3">
              Developer Profile Card
            </h3>
            <div className="max-w-md">
              <DeveloperProfileCard
                profile={loggedInUser}
                onEditSkills={() => setIsEditPrefsOpen(true)}
                onReanalyze={handleReanalyzeProfile}
              />
            </div>
          </div>
        );
      }

      if (sidebarView === 'preferences') {
        return (
          <div className="space-y-6 animate-fade-in max-w-3xl">
            <div className="border-b border-slate-900 pb-3">
              <h3 className="text-lg font-bold font-display text-white">
                Preferences Configurations
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage your technical index, difficulty targets, and matching constraints.
              </p>
            </div>
            <PreferencesForm
              initialValues={getProfilePreferences()}
              onSubmit={handleSavePreferences}
              isSubmitting={isSavingPrefs}
            />
          </div>
        );
      }

      // Default Recommendations lists
      return (
        <div className="space-y-6 animate-fade-in">
          {/* Welcome Block */}
          <div className="bg-slate-950/20 border border-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 blur-3xl rounded-full" />
            <div className="space-y-1 relative z-10">
              <h3 className="text-lg font-bold text-white font-display">
                Welcome back, {loggedInUser.name}!
              </h3>
              <p className="text-xs text-slate-400">
                Here are open-source repositories recommended based on your languages, experience level, and preferred difficulty.
              </p>
            </div>
            <div className="flex gap-2 relative z-10">
              <Button
                variant="outline"
                size="sm"
                className="flex gap-1.5"
                onClick={() => setIsEditPrefsOpen(true)}
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Preferences</span>
              </Button>
              <Button
                variant="glass"
                size="sm"
                className="flex gap-1.5"
                onClick={handleReanalyzeProfile}
                isLoading={isRecsLoading}
              >
                {!isRecsLoading && <RefreshCw className="w-3.5 h-3.5 text-slate-400" />}
                <span>Refresh Suggestions</span>
              </Button>
            </div>
          </div>

          {/* Filtering panel */}
          <RepositoryFilters
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
          />

          {/* Matches content block */}
          {isRecsLoading ? (
            <LoadingState />
          ) : filteredRecommendations.length === 0 ? (
            <EmptyState
              onUpdatePreferences={() => setIsEditPrefsOpen(true)}
              onGenerateAgain={handleReanalyzeProfile}
              onReanalyze={handleReanalyzeProfile}
              isGenerating={isRecsLoading}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              {filteredRecommendations.map((rec) => (
                <RepositoryCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="flex min-h-screen bg-[#03050c]">
        {/* Responsive Desktop Sidebar */}
        <AppSidebar
          currentView={sidebarView}
          onNavigate={setSidebarView}
          onLogout={handleLogout}
          username={loggedInUser.githubUsername}
        />

        {/* Responsive Mobile Drawer Navigation Menu */}
        <MobileNavigation
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          currentView={sidebarView}
          onNavigate={setSidebarView}
          onLogout={handleLogout}
          username={loggedInUser.githubUsername}
        />

        {/* Edit Preferences Drawer Modal Overlay */}
        <EditPreferencesDrawer
          isOpen={isEditPrefsOpen}
          onClose={() => setIsEditPrefsOpen(false)}
          initialValues={getProfilePreferences()}
          onSubmit={handleSavePreferences}
          isSubmitting={isSavingPrefs}
        />

        {/* Dashboard Frame Content Area */}
        <div className="flex-1 md:pl-64 flex flex-col min-h-screen font-sans">
          <DashboardHeader
            profile={loggedInUser}
            onLogout={handleLogout}
            onMenuToggle={() => setIsMenuOpen(true)}
            title={
              sidebarView === 'profile'
                ? 'Developer Portfolio Snapshot'
                : sidebarView === 'preferences'
                ? 'Personalize Search Index'
                : 'Your Open-Source Matches'
            }
          />

          <main className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
            {renderSidebarContent()}
          </main>
        </div>
      </div>
    );
  };

  // Switch between views
  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return renderLandingPage();
      case 'analysis':
        return renderAnalysisPage();
      case 'preferences':
        return renderPreferencesPage();
      case 'dashboard':
        return renderDashboardPage();
      default:
        return renderLandingPage();
    }
  };

  return <PageContainer>{renderCurrentView()}</PageContainer>;
}
