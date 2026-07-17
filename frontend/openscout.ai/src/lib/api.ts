import { DeveloperProfile, RepositoryRecommendation, UserPreferences, ProfileAnalysisStep } from '../types';
import { SUFFICIENT_PROFILE, LOW_CONFIDENCE_PROFILE, MOCK_RECOMMENDATIONS } from './mock-data';

// Helper to simulate network latency
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Store simple in-memory or localStorage state for the mock persistence
const STORAGE_KEYS = {
  LOGGED_IN_USER: 'openscout_user',
  PROFILE_STATE: 'openscout_profile',
  PREFERENCES_STATE: 'openscout_preferences',
  RECOMMENDATIONS_STATE: 'openscout_recommendations',
  ONBOARDING_COMPLETE: 'openscout_onboarding_complete'
};

export const loginWithGitHub = async (username: string = 'octocat-scout'): Promise<DeveloperProfile> => {
  await sleep(1200); // Simulate network handshake
  
  // Decide which profile template to load based on username entered or simulated choice
  let profile: DeveloperProfile = { ...SUFFICIENT_PROFILE };
  
  if (username.toLowerCase().includes('low') || username === 'johndoe-codes') {
    profile = { ...LOW_CONFIDENCE_PROFILE };
  } else if (username.toLowerCase().includes('error')) {
    throw new Error('API_UNAVAILABLE');
  } else if (username.toLowerCase().includes('limit')) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  } else if (username.toLowerCase().includes('empty')) {
    profile = {
      ...LOW_CONFIDENCE_PROFILE,
      id: 'dev_empty',
      githubUsername: 'empty-coder',
      name: 'No public repositories found',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200&h=200',
      languages: [],
      frameworks: [],
      tools: [],
      confidenceScore: 10,
      repositoriesAnalyzed: 0
    };
  } else {
    // Customize profile with the user's input username
    profile.githubUsername = username;
    profile.name = username.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  localStorage.setItem(STORAGE_KEYS.LOGGED_IN_USER, JSON.stringify(profile));
  localStorage.setItem(STORAGE_KEYS.PROFILE_STATE, JSON.stringify(profile));
  localStorage.removeItem(STORAGE_KEYS.PREFERENCES_STATE);
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  
  return profile;
};

export const logoutUser = async (): Promise<void> => {
  await sleep(400);
  localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_USER);
  localStorage.removeItem(STORAGE_KEYS.PROFILE_STATE);
  localStorage.removeItem(STORAGE_KEYS.PREFERENCES_STATE);
  localStorage.removeItem(STORAGE_KEYS.RECOMMENDATIONS_STATE);
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
};

export const getLoggedInUser = (): DeveloperProfile | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.LOGGED_IN_USER);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

export const getDeveloperProfile = async (): Promise<DeveloperProfile | null> => {
  await sleep(300);
  const profileStr = localStorage.getItem(STORAGE_KEYS.PROFILE_STATE);
  if (!profileStr) return null;
  try {
    return JSON.parse(profileStr);
  } catch (e) {
    return null;
  }
};

export const analyzeGitHubProfile = async (
  username: string,
  onStepUpdate?: (stepId: string, status: ProfileAnalysisStep['status']) => void
): Promise<DeveloperProfile> => {
  // Let's run a progressive analysis timer
  const steps = ['connect', 'fetch_repos', 'detect_langs', 'detect_frameworks', 'estimate_exp', 'build_profile', 'generate_recs'];
  
  for (const stepId of steps) {
    if (onStepUpdate) onStepUpdate(stepId, 'active');
    
    // Simulate processing time
    if (stepId === 'connect') await sleep(700);
    else if (stepId === 'fetch_repos') await sleep(900);
    else if (stepId === 'detect_langs') await sleep(800);
    else if (stepId === 'detect_frameworks') await sleep(800);
    else if (stepId === 'estimate_exp') await sleep(600);
    else if (stepId === 'build_profile') await sleep(700);
    else if (stepId === 'generate_recs') await sleep(800);

    if (username.toLowerCase().includes('fail') && stepId === 'detect_frameworks') {
      if (onStepUpdate) onStepUpdate(stepId, 'failed');
      throw new Error('ANALYSIS_FAILED');
    }

    if (onStepUpdate) onStepUpdate(stepId, 'completed');
  }

  // Load profile
  let profile = getLoggedInUser();
  if (!profile) {
    profile = await loginWithGitHub(username);
  }

  // If sufficient profile, generate recommendations automatically
  if (profile.confidenceScore >= 50) {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    // Save matching recommendations
    const matched = generateInitialRecommendations(profile);
    localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS_STATE, JSON.stringify(matched));
  }

  return profile;
};

// Generate recommendations based on profile skills
export const generateInitialRecommendations = (profile: DeveloperProfile): RepositoryRecommendation[] => {
  const profileLangs = profile.languages.map(l => l.name.toLowerCase());
  const profileFrameworks = profile.frameworks.map(f => f.name.toLowerCase());
  const profileInterests = profile.interests.map(i => i.toLowerCase());

  // Return recommendations scored against this profile
  const scored = MOCK_RECOMMENDATIONS.map(rec => {
    let scoreMultiplier = 60; // baseline
    
    // lang match
    if (profileLangs.includes(rec.primaryLanguage.toLowerCase())) {
      scoreMultiplier += 15;
    }

    // frameworks intersection
    const matchingFrameworks = rec.topics.filter(topic => profileFrameworks.includes(topic.toLowerCase()));
    scoreMultiplier += matchingFrameworks.length * 8;

    // difficulty match
    if (profile.experienceLevel === 'beginner' && rec.difficulty === 'beginner') {
      scoreMultiplier += 10;
    } else if (profile.experienceLevel === 'intermediate' && rec.difficulty === 'moderate') {
      scoreMultiplier += 10;
    } else if (profile.experienceLevel === 'advanced' && rec.difficulty === 'challenging') {
      scoreMultiplier += 10;
    }

    // bound score to max 98%
    const finalScore = Math.min(98, scoreMultiplier);

    return {
      ...rec,
      matchScore: finalScore
    };
  });

  // Sort by match score
  return scored.sort((a, b) => b.matchScore - a.matchScore);
};

export const saveUserPreferences = async (prefs: UserPreferences): Promise<DeveloperProfile> => {
  await sleep(1500); // Simulate database saving

  const existingProfile = getLoggedInUser();
  if (!existingProfile) throw new Error('NO_ACTIVE_PROFILE');

  // Convert preference strings to SkillItems
  const languages: DeveloperProfile['languages'] = prefs.languages.map(lang => {
    const existing = existingProfile.languages.find(l => l.name === lang);
    return {
      name: lang,
      score: existing ? existing.score : 70, // default manual input score
      source: existing ? existing.source : 'manual'
    };
  });

  const frameworks: DeveloperProfile['frameworks'] = prefs.frameworks.map(fw => {
    const existing = existingProfile.frameworks.find(f => f.name === fw);
    return {
      name: fw,
      score: existing ? existing.score : 65,
      source: existing ? existing.source : 'manual'
    };
  });

  // Merge into updated profile
  const updatedProfile: DeveloperProfile = {
    ...existingProfile,
    languages,
    frameworks,
    interests: prefs.interests,
    experienceLevel: prefs.experienceLevel,
    confidenceScore: Math.max(existingProfile.confidenceScore, 85), // Onboarding complete elevates confidence
    lastAnalyzedAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEYS.PROFILE_STATE, JSON.stringify(updatedProfile));
  localStorage.setItem(STORAGE_KEYS.LOGGED_IN_USER, JSON.stringify(updatedProfile));
  localStorage.setItem(STORAGE_KEYS.PREFERENCES_STATE, JSON.stringify(prefs));
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');

  // Regnerate recommendations matching these specific preferences
  const recommended = generateRecommendationsForPreferences(updatedProfile, prefs);
  localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS_STATE, JSON.stringify(recommended));

  return updatedProfile;
};

// Generate highly tailored recommendations based on explicit onboarding / editing preferences
export const generateRecommendationsForPreferences = (
  profile: DeveloperProfile,
  prefs: UserPreferences
): RepositoryRecommendation[] => {
  const selectedLangs = prefs.languages.map(l => l.toLowerCase());
  const selectedFws = prefs.frameworks.map(f => f.toLowerCase());
  const selectedInterests = prefs.interests.map(i => i.toLowerCase());

  const scored = MOCK_RECOMMENDATIONS.map(rec => {
    let score = 55; // base

    // Primary language matches preferred
    if (selectedLangs.includes(rec.primaryLanguage.toLowerCase())) {
      score += 20;
    }

    // Core topics and frameworks match
    const fwIntersection = rec.topics.some(topic => selectedFws.includes(topic.toLowerCase()));
    if (fwIntersection) {
      score += 15;
    }

    // Match difficulty exactly
    if (prefs.preferredDifficulties.includes(rec.difficulty)) {
      score += 10;
    }

    const finalScore = Math.min(99, score);

    return {
      ...rec,
      matchScore: finalScore
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
};

export const getRecommendations = async (): Promise<RepositoryRecommendation[]> => {
  await sleep(600); // Simulate database fetch
  const recsStr = localStorage.getItem(STORAGE_KEYS.RECOMMENDATIONS_STATE);
  if (!recsStr) {
    const profile = getLoggedInUser();
    if (profile) {
      const generated = generateInitialRecommendations(profile);
      localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS_STATE, JSON.stringify(generated));
      return generated;
    }
    return [];
  }
  try {
    return JSON.parse(recsStr);
  } catch (e) {
    return [];
  }
};

export const reanalyzeDeveloperProfile = async (username: string): Promise<DeveloperProfile> => {
  await sleep(2000); // quick re-analysis
  const profile = await loginWithGitHub(username);
  
  // Update last analyzed timestamp
  profile.lastAnalyzedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.PROFILE_STATE, JSON.stringify(profile));
  localStorage.setItem(STORAGE_KEYS.LOGGED_IN_USER, JSON.stringify(profile));

  // Regenerate matches
  const generated = generateInitialRecommendations(profile);
  localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS_STATE, JSON.stringify(generated));

  return profile;
};

export const isOnboardingComplete = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
};
