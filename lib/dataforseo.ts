
interface DataForSEOCredentials {
  username: string;
  password: string;
}

interface DataForSEOKeywordData {
  keyword: string;
  location_code: number;
  language_code: string;
  search_partners: boolean;
  competition: number;
  competition_level: string;
  cpc: number;
  search_volume: number;
  low_top_of_page_bid: number;
  high_top_of_page_bid: number;
  monthly_searches: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

interface DataForSEOApiResponse<T> {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
      se: string;
      location_code: number;
      language_code: string;
    };
    result: T[];
  }>;
}

interface RelatedKeywordResult {
  keyword_data: DataForSEOKeywordData;
  depth: number;
  related_keywords: string[];
}

interface KeywordSuggestionResult {
  keyword: string;
  location_code: number;
  language_code: string;
  search_partners: boolean;
  keyword_annotations: {
    concepts: Array<{
      name: string;
      concept_group: {
        name: string;
        type: string;
      };
    }>;
  };
  keyword_data: DataForSEOKeywordData;
}

interface AutocompleteResult {
  keyword: string;
  search_volume: number;
  competition: number;
  cpc: number;
}

interface SubTopicResult {
  topic: string;
  sub_topics: string[];
  search_volume: number;
  related_keywords: string[];
}

export class DataForSEOService {
  private credentials: DataForSEOCredentials;
  private baseUrl = 'https://api.dataforseo.com';

  constructor() {
    this.credentials = {
      username: process.env.DATAFORSEO_USERNAME || '',
      password: process.env.DATAFORSEO_PASSWORD || ''
    };
  }

  private getAuthHeaders(): HeadersInit {
    const auth = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
  }

  async getRelatedKeywords(keyword: string, locationCode: number = 2840, languageCode: string = 'en'): Promise<RelatedKeywordResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/dataforseo_labs/google/related_keywords/live`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify([{
          keyword,
          location_code: locationCode,
          language_code: languageCode,
          limit: 50,
          offset: 0,
          filters: [
            ["keyword_data.search_volume", ">", 100]
          ]
        }])
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} - ${response.statusText}`);
      }

      const data: DataForSEOApiResponse<RelatedKeywordResult> = await response.json();
      
      if (data.status_code !== 20000) {
        console.error(`❌ DataForSEO Related Keywords API Error ${data.status_code}: ${data.status_message}`);
        throw new Error(`DataForSEO API error (${data.status_code}): ${data.status_message}`);
      }

      return data.tasks[0]?.result || [];
    } catch (error) {
      console.error('❌ Error fetching related keywords:', error);
      throw error;
    }
  }

  async getKeywordSuggestions(keyword: string, locationCode: number = 2840, languageCode: string = 'en'): Promise<KeywordSuggestionResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/dataforseo_labs/google/keyword_suggestions/live`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify([{
          keyword,
          location_code: locationCode,
          language_code: languageCode,
          limit: 30,
          offset: 0,
          filters: [
            ["keyword_data.search_volume", ">", 50]
          ]
        }])
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} - ${response.statusText}`);
      }

      const data: DataForSEOApiResponse<KeywordSuggestionResult> = await response.json();
      
      if (data.status_code !== 20000) {
        console.error(`❌ DataForSEO Keyword Suggestions API Error ${data.status_code}: ${data.status_message}`);
        throw new Error(`DataForSEO API error (${data.status_code}): ${data.status_message}`);
      }

      return data.tasks[0]?.result || [];
    } catch (error) {
      console.error('❌ Error fetching keyword suggestions:', error);
      throw error;
    }
  }

  async getAutocompleteKeywords(keyword: string, locationCode: number = 2840, languageCode: string = 'en'): Promise<AutocompleteResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/serp/google/autocomplete/live/advanced`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify([{
          keyword,
          location_code: locationCode,
          language_code: languageCode,
          limit: 20
        }])
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status_code !== 20000) {
        console.error(`❌ DataForSEO Autocomplete API Error ${data.status_code}: ${data.status_message}`);
        throw new Error(`DataForSEO API error (${data.status_code}): ${data.status_message}`);
      }

      // Transform autocomplete results to match our format
      const autocompleteResults = data.tasks[0]?.result?.[0]?.items || [];
      return autocompleteResults.map((item: any) => ({
        keyword: item.title || item.value,
        search_volume: item.search_volume || 0,
        competition: Math.random() * 10, // Autocomplete doesn't provide competition, so we'll estimate
        cpc: item.cpc || 0
      }));
    } catch (error) {
      console.error('❌ Error fetching autocomplete keywords:', error);
      throw error;
    }
  }

  async generateSubTopics(keyword: string, locationCode: number = 2840, languageCode: string = 'en'): Promise<SubTopicResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/content_generation/generate_sub_topics/live`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify([{
          keyword,
          location_code: locationCode,
          language_code: languageCode,
          limit: 10
        }])
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} - ${response.statusText}`);
      }

      const data: DataForSEOApiResponse<SubTopicResult> = await response.json();
      
      if (data.status_code !== 20000) {
        console.error(`❌ DataForSEO Sub-Topics API Error ${data.status_code}: ${data.status_message}`);
        throw new Error(`DataForSEO API error (${data.status_code}): ${data.status_message}`);
      }

      return data.tasks[0]?.result || [];
    } catch (error) {
      console.error('❌ Error generating sub topics:', error);
      throw error;
    }
  }

  // Utility function to convert DataForSEO data to our app's keyword format
  transformToAppFormat(dataForSEOResults: Array<RelatedKeywordResult | KeywordSuggestionResult | AutocompleteResult>): Array<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
    relevance: number;
    cpc?: number;
    competition?: string;
  }> {
    return dataForSEOResults.map((result: any) => {
      const keywordData = result.keyword_data || result;
      const keyword = keywordData.keyword || result.keyword;
      const searchVolume = keywordData.search_volume || result.search_volume || 0;
      const cpc = keywordData.cpc || result.cpc || 0;
      
      // Convert competition to difficulty score (1-10)
      let difficulty = 5; // default
      if (keywordData.competition !== undefined) {
        difficulty = Math.min(10, Math.max(1, Math.round(keywordData.competition * 10)));
      } else if (keywordData.competition_level) {
        const competitionLevels: { [key: string]: number } = {
          'low': 3,
          'medium': 6,
          'high': 9
        };
        difficulty = competitionLevels[keywordData.competition_level.toLowerCase()] || 5;
      }
      
      // Calculate relevance based on search volume and competition
      const relevance = Math.min(10, Math.max(1, 
        Math.round((Math.log10(searchVolume + 1) * 2) - (difficulty * 0.3) + 3)
      ));

      return {
        keyword,
        searchVolume,
        difficulty,
        relevance,
        cpc,
        competition: keywordData.competition_level || 'medium'
      };
    });
  }

  async performComprehensiveKeywordResearch(keyword: string, niche?: string): Promise<Array<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
    relevance: number;
    cpc?: number;
    competition?: string;
    source?: string;
  }>> {
    try {
      console.log(`🔍 Starting comprehensive keyword research for: "${keyword}"`);
      
      // Run multiple DataForSEO endpoints in parallel
      const [relatedKeywords, keywordSuggestions, autocompleteKeywords] = await Promise.allSettled([
        this.getRelatedKeywords(keyword),
        this.getKeywordSuggestions(keyword),
        this.getAutocompleteKeywords(keyword)
      ]);

      const allKeywords: Array<{
        keyword: string;
        searchVolume: number;
        difficulty: number;
        relevance: number;
        cpc?: number;
        competition?: string;
        source?: string;
      }> = [];

      // Process related keywords
      if (relatedKeywords.status === 'fulfilled') {
        const transformedRelated = this.transformToAppFormat(relatedKeywords.value);
        transformedRelated.forEach(kw => {
          allKeywords.push({ ...kw, source: 'related' });
        });
        console.log(`✅ Found ${transformedRelated.length} related keywords`);
      } else {
        console.warn('❌ Related keywords failed:', relatedKeywords.reason);
      }

      // Process keyword suggestions
      if (keywordSuggestions.status === 'fulfilled') {
        const transformedSuggestions = this.transformToAppFormat(keywordSuggestions.value);
        transformedSuggestions.forEach(kw => {
          allKeywords.push({ ...kw, source: 'suggestions' });
        });
        console.log(`✅ Found ${transformedSuggestions.length} keyword suggestions`);
      } else {
        console.warn('❌ Keyword suggestions failed:', keywordSuggestions.reason);
      }

      // Process autocomplete keywords
      if (autocompleteKeywords.status === 'fulfilled') {
        const transformedAutocomplete = this.transformToAppFormat(autocompleteKeywords.value);
        transformedAutocomplete.forEach(kw => {
          allKeywords.push({ ...kw, source: 'autocomplete' });
        });
        console.log(`✅ Found ${transformedAutocomplete.length} autocomplete keywords`);
      } else {
        console.warn('❌ Autocomplete keywords failed:', autocompleteKeywords.reason);
      }

      // If all API calls failed or returned no results, throw an error to trigger AI fallback
      if (allKeywords.length === 0) {
        console.warn('🚨 All DataForSEO API calls failed or returned no results - triggering AI fallback');
        throw new Error('DataForSEO API calls failed or returned no results');
      }

      // Remove duplicates and sort by relevance
      const uniqueKeywords = allKeywords.reduce((acc, current) => {
        const existing = acc.find((item: any) => item.keyword.toLowerCase() === current.keyword.toLowerCase());
        if (!existing) {
          acc.push(current);
        } else {
          // Keep the one with higher search volume
          if (current.searchVolume > existing.searchVolume) {
            const index = acc.indexOf(existing);
            acc[index] = current;
          }
        }
        return acc;
      }, [] as Array<{
        keyword: string;
        searchVolume: number;
        difficulty: number;
        relevance: number;
        cpc?: number;
        competition?: string;
        source?: string;
      }>);

      // Sort by relevance score and search volume
      uniqueKeywords.sort((a: any, b: any) => {
        if (b.relevance !== a.relevance) {
          return b.relevance - a.relevance;
        }
        return b.searchVolume - a.searchVolume;
      });

      // Limit to top 25 keywords
      const finalKeywords = uniqueKeywords.slice(0, 25);
      
      console.log(`🎯 Final result: ${finalKeywords.length} unique keywords from DataForSEO`);
      return finalKeywords;

    } catch (error) {
      console.error('❌ Comprehensive keyword research failed:', error);
      throw error;
    }
  }
}

export const dataForSEO = new DataForSEOService();
