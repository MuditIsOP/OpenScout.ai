import { DeveloperProfile, RepositoryRecommendation, UserPreferences, ProfileAnalysisStep } from '../types';

export const INITIAL_ANALYSIS_STEPS: ProfileAnalysisStep[] = [
  { id: 'connect', label: 'Connecting to GitHub', description: 'Establishing secure OAuth handshake and retrieving profile information.', status: 'pending' },
  { id: 'fetch_repos', label: 'Fetching repositories', description: 'Reading public contribution commits, stars, and pull requests.', status: 'pending' },
  { id: 'detect_langs', label: 'Detecting languages', description: 'Analyzing source file distributions across your public contributions.', status: 'pending' },
  { id: 'detect_frameworks', label: 'Identifying frameworks and tools', description: 'Scanning config files (package.json, requirements.txt, go.mod).', status: 'pending' },
  { id: 'estimate_exp', label: 'Estimating experience level', description: 'Calibrating codebase maturity and architectural contributions.', status: 'pending' },
  { id: 'build_profile', label: 'Building developer profile', description: 'Structuring skills matrix, confidence matrices, and taxonomy.', status: 'pending' },
  { id: 'generate_recs', label: 'Generating recommendations', description: 'Matching your skills with active, beginner-friendly open source repositories.', status: 'pending' }
];

// Profile with sufficient confidence (Default)
export const SUFFICIENT_PROFILE: DeveloperProfile = {
  id: 'dev_octocat',
  githubUsername: 'octocat-scout',
  name: 'Alex Mercer',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200',
  profileUrl: 'https://github.com/octocat-scout',
  languages: [
    { name: 'TypeScript', score: 92, source: 'github' },
    { name: 'JavaScript', score: 88, source: 'github' },
    { name: 'Python', score: 75, source: 'github' },
    { name: 'Rust', score: 45, source: 'github' }
  ],
  frameworks: [
    { name: 'React', score: 90, source: 'github' },
    { name: 'Next.js', score: 85, source: 'github' },
    { name: 'Node.js', score: 80, source: 'github' },
    { name: 'Express', score: 75, source: 'github' }
  ],
  tools: [
    { name: 'Git', score: 95, source: 'github' },
    { name: 'Docker', score: 70, source: 'github' },
    { name: 'Tailwind CSS', score: 92, source: 'github' },
    { name: 'Vite', score: 88, source: 'github' }
  ],
  interests: ['Frontend Development', 'Full-Stack Development', 'Developer Tools', 'Open-Source Infrastructure'],
  experienceLevel: 'intermediate',
  confidenceScore: 87,
  repositoriesAnalyzed: 28,
  lastAnalyzedAt: '2026-07-16T23:42:00Z'
};

// Low-confidence profile (Triggers Manual onboarding fallback)
export const LOW_CONFIDENCE_PROFILE: DeveloperProfile = {
  id: 'dev_newbie',
  githubUsername: 'johndoe-codes',
  name: 'John Doe',
  avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200&h=200',
  profileUrl: 'https://github.com/johndoe-codes',
  languages: [
    { name: 'JavaScript', score: 40, source: 'github' }
  ],
  frameworks: [],
  tools: [
    { name: 'Git', score: 30, source: 'github' }
  ],
  interests: ['Frontend Development'],
  experienceLevel: 'beginner',
  confidenceScore: 32, // < 50% threshold triggers manual preferences screen
  repositoriesAnalyzed: 1,
  lastAnalyzedAt: '2026-07-16T23:42:00Z'
};

export const MOCK_RECOMMENDATIONS: RepositoryRecommendation[] = [
  {
    id: 'rec_1',
    owner: 'facebook',
    name: 'react',
    fullName: 'facebook/react',
    description: 'The library for web and native user interfaces. Ideal for developers wishing to understand reactive scheduling, core diffing state, and foundational component hooks.',
    githubUrl: 'https://github.com/facebook/react',
    primaryLanguage: 'JavaScript',
    languages: ['JavaScript', 'TypeScript', 'HTML'],
    topics: ['frontend', 'library', 'ui', 'reactive'],
    stars: 224350,
    forks: 46210,
    openIssues: 1250,
    lastUpdatedAt: '2026-07-15T18:30:00Z',
    activityLevel: 'high',
    difficulty: 'challenging',
    matchScore: 92,
    confidenceScore: 89,
    beginnerFriendly: false,
    hasGoodFirstIssues: true,
    recommendationReasons: [
      'Matches your deep interest in React and frontend architectures.',
      'Contains high-quality test-suite issues requiring standalone components.',
      'Strong fit for your Intermediate experience level in structural Javascript.'
    ]
  },
  {
    id: 'rec_2',
    owner: 'vercel',
    name: 'next.js',
    fullName: 'vercel/next.js',
    description: 'The React Framework for the Web. Features automatic code splitting, optimized image loading, SSR/SSG server layers, and full routing models.',
    githubUrl: 'https://github.com/vercel/next.js',
    primaryLanguage: 'TypeScript',
    languages: ['TypeScript', 'JavaScript', 'Rust'],
    topics: ['framework', 'react', 'ssr', 'web-development'],
    stars: 122100,
    forks: 26800,
    openIssues: 1890,
    lastUpdatedAt: '2026-07-16T12:00:00Z',
    activityLevel: 'high',
    difficulty: 'challenging',
    matchScore: 95,
    confidenceScore: 92,
    beginnerFriendly: false,
    hasGoodFirstIssues: false,
    recommendationReasons: [
      'Aligns perfectly with your Top Language (TypeScript) and Next.js capability.',
      'Has active issues for routing modules which align with Full-Stack interests.',
      'Active community triage with multiple PR opportunities daily.'
    ]
  },
  {
    id: 'rec_3',
    owner: 'lucide-icons',
    name: 'lucide',
    fullName: 'lucide-icons/lucide',
    description: 'Beautiful & consistent icon toolkit made by the community. Fork of Feather Icons. Perfect for contributors looking to make lightweight, clean icon contributions.',
    githubUrl: 'https://github.com/lucide-icons/lucide',
    primaryLanguage: 'TypeScript',
    languages: ['TypeScript', 'JavaScript', 'SVG'],
    topics: ['icons', 'svg', 'design-system', 'npm-package'],
    stars: 15400,
    forks: 820,
    openIssues: 85,
    lastUpdatedAt: '2026-07-16T04:15:00Z',
    activityLevel: 'medium',
    difficulty: 'beginner',
    matchScore: 88,
    confidenceScore: 95,
    beginnerFriendly: true,
    hasGoodFirstIssues: true,
    recommendationReasons: [
      'Marked as Beginner Friendly with multiple issues tagged "good first issue".',
      'Uses TypeScript and JavaScript; great for building an open-source contribution resume.',
      'Lightweight codebase is ideal for testing custom package scripts.'
    ]
  },
  {
    id: 'rec_4',
    owner: 'expressjs',
    name: 'express',
    fullName: 'expressjs/express',
    description: 'Fast, unopinionated, minimalist web framework for Node.js. Learn the backbone of node server routing, request pipelines, and middleware architectures.',
    githubUrl: 'https://github.com/expressjs/express',
    primaryLanguage: 'JavaScript',
    languages: ['JavaScript'],
    topics: ['web-framework', 'node', 'server', 'middleware'],
    stars: 64100,
    forks: 13200,
    openIssues: 420,
    lastUpdatedAt: '2026-07-10T10:00:00Z',
    activityLevel: 'medium',
    difficulty: 'moderate',
    matchScore: 84,
    confidenceScore: 80,
    beginnerFriendly: true,
    hasGoodFirstIssues: true,
    recommendationReasons: [
      'Matches your Node.js and Express framework history.',
      'Includes active documentation updates and basic test script tasks.',
      'Moderate complexity: great middle step between libraries and heavy frameworks.'
    ]
  },
  {
    id: 'rec_5',
    owner: 'tailwindlabs',
    name: 'tailwindcss',
    fullName: 'tailwindlabs/tailwindcss',
    description: 'A utility-first CSS framework for rapid UI development. Deep dive into PostCSS plugins, pre-compilers, and custom design token engines.',
    githubUrl: 'https://github.com/tailwindlabs/tailwindcss',
    primaryLanguage: 'TypeScript',
    languages: ['TypeScript', 'CSS', 'JavaScript'],
    topics: ['css', 'tailwind', 'frontend', 'design-system'],
    stars: 81200,
    forks: 4100,
    openIssues: 210,
    lastUpdatedAt: '2026-07-16T09:45:00Z',
    activityLevel: 'high',
    difficulty: 'moderate',
    matchScore: 91,
    confidenceScore: 87,
    beginnerFriendly: false,
    hasGoodFirstIssues: true,
    recommendationReasons: [
      'Aligned with your Tailwind CSS skills (92% proficiency).',
      'Contribute to CSS utility generation parsers using TypeScript.',
      'Highly active repository with substantial community presence.'
    ]
  },
  {
    id: 'rec_6',
    owner: 'django',
    name: 'django',
    fullName: 'django/django',
    description: 'The Web framework for perfectionists with deadlines. Python-based MVC framework focusing on database ORMs, administrative dashboards, and secure user logic.',
    githubUrl: 'https://github.com/django/django',
    primaryLanguage: 'Python',
    languages: ['Python', 'HTML', 'JavaScript'],
    topics: ['python', 'web-framework', 'orm', 'mvc'],
    stars: 77800,
    forks: 31200,
    openIssues: 1650,
    lastUpdatedAt: '2026-07-14T20:10:00Z',
    activityLevel: 'medium',
    difficulty: 'challenging',
    matchScore: 78,
    confidenceScore: 72,
    beginnerFriendly: false,
    hasGoodFirstIssues: false,
    recommendationReasons: [
      'Matches your Python interest and experience.',
      'Excellent for exploring backend database operations and robust query compilers.',
      'Active bug-tracker with well-formatted reproduction instructions.'
    ]
  },
  {
    id: 'rec_7',
    owner: 'tldraw',
    name: 'tldraw',
    fullName: 'tldraw/tldraw',
    description: 'A tiny canvas library for React. Highly performant canvas handling, vector drawing algorithms, and spatial multi-user room synchronizations.',
    githubUrl: 'https://github.com/tldraw/tldraw',
    primaryLanguage: 'TypeScript',
    languages: ['TypeScript', 'CSS', 'JavaScript'],
    topics: ['canvas', 'react', 'drawing', 'whiteboard'],
    stars: 32100,
    forks: 1850,
    openIssues: 390,
    lastUpdatedAt: '2026-07-16T14:30:00Z',
    activityLevel: 'high',
    difficulty: 'moderate',
    matchScore: 89,
    confidenceScore: 84,
    beginnerFriendly: true,
    hasGoodFirstIssues: true,
    recommendationReasons: [
      'Matches your Frontend interest and high TypeScript proficiency.',
      'Features good first issues for canvas keyboard controls.',
      'Great for practicing performance optimizations in React rendering rendering loops.'
    ]
  },
  {
    id: 'rec_8',
    owner: 'honojs',
    name: 'hono',
    fullName: 'honojs/hono',
    description: 'Ultrafast web framework for Cloudflare Workers, Deno, Bun, Luvit, and Node.js. Built on Web Standards and zero-dependency architectures.',
    githubUrl: 'https://github.com/honojs/hono',
    primaryLanguage: 'TypeScript',
    languages: ['TypeScript'],
    topics: ['web-framework', 'edge', 'router', 'cloudflare-workers'],
    stars: 18900,
    forks: 790,
    openIssues: 92,
    lastUpdatedAt: '2026-07-16T15:00:00Z',
    activityLevel: 'high',
    difficulty: 'moderate',
    matchScore: 87,
    confidenceScore: 85,
    beginnerFriendly: true,
    hasGoodFirstIssues: true,
    recommendationReasons: [
      'Excellent fit for TypeScript server-side programming and router logic.',
      'Well-organized and modular edge-runtime structure, making contribution boundaries clean.',
      'Highly responsive maintainers and strong newcomer support.'
    ]
  }
];

export const ALL_PROGRAMMING_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Kotlin', 'Swift'
];

export const ALL_FRAMEWORKS_AND_TOOLS = [
  'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'React Native', 'Flutter', 'Docker', 'AWS'
];

export const ALL_AREAS_OF_INTEREST = [
  'Frontend Development', 'Backend Development', 'Full-Stack Development', 'Mobile Development', 'Artificial Intelligence', 'Machine Learning', 'DevOps', 'Cloud Computing', 'Cybersecurity', 'Developer Tools', 'Data Engineering', 'Open-Source Infrastructure'
];

export const CONTRIBUTION_GOALS = [
  'Fix bugs', 'Build features', 'Improve documentation', 'Write tests', 'Learn a new technology', 'Contribute regularly', 'Build an open-source portfolio'
];
