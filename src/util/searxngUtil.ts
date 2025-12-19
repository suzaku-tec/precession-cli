import axios from 'axios';

const SEARXNG_URL = 'http://localhost:18080/search';

export async function webSearch(query: string) {
  const { data } = await axios.get(SEARXNG_URL, {
    params: {
      q: query,
      format: 'json',
      language: 'ja',
      categories: 'general'
    }
  });

  // 上位3件だけ使う例
  return (data.results ?? []).slice(0, 3).map((r: any) => ({
    title: r.title,
    url: r.url,
    snippet: r.content || r.summary || ''
  }));
}
