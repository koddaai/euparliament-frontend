const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  answer?: string;
  results: TavilySearchResult[];
}

export async function searchWeb(query: string): Promise<{
  answer?: string;
  results: Array<{ title: string; url: string; snippet: string }>;
}> {
  if (!TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY is not configured');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: query,
      search_depth: 'advanced',
      include_answer: true,
      max_results: 5,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tavily search failed: ${error}`);
  }

  const data: TavilyResponse = await response.json();

  return {
    answer: data.answer,
    results: data.results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content.slice(0, 300),
    })),
  };
}
