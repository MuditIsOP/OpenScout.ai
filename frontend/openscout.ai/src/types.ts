export interface SkillItem {
  name: string;
  score: number; // 0-100 representing expertise detected
  source: 'github' | 'manual';
}

export interface DeveloperProfile {
  id: string;
  githubUsername: string;
  name: string;
  avatarUrl: string;
  profileUrl: string;
  languages: SkillItem[];
  frameworks: SkillItem[];
  tools: SkillItem[];
  interests: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  confidenceScore: number;
  repositoriesAnalyzed: number;
  lastAnalyzedAt: string;
}

export interface RepositoryRecommendation {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  githubUrl: string;
  primaryLanguage: string;
  languages: string[];
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  lastUpdatedAt: string;
  activityLevel: 'high' | 'medium' | 'low';
  difficulty: 'beginner' | 'moderate' | 'challenging';
  matchScore: number;
  confidenceScore: number;
  beginnerFriendly: boolean;
  hasGoodFirstIssues: boolean;
  recommendationReasons: string[];
}

export interface UserPreferences {
  languages: string[];
  frameworks: string[];
  interests: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredDifficulties: Array<'beginner' | 'moderate' | 'challenging'>;
  contributionGoals: string[];
}

export interface ProfileAnalysisStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
}
