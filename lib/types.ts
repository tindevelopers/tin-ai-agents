
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  status: 'draft' | 'ready_to_publish' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

export interface KeywordCluster {
  id: string;
  name: string;
  keywords: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  category?: string;
  createdAt: Date;
}

export interface KeywordSuggestion {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  relevance: number;
}

export interface TopicSuggestion {
  topic: string;
  angle: string;
  targetKeywords: string[];
  estimatedLength: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ContentStrategy {
  mainKeyword: string;
  secondaryKeywords: string[];
  contentType: string;
  targetAudience: string;
  contentStructure: string[];
  seoTips: string[];
  wordCount?: string;
  tone?: string;
}
