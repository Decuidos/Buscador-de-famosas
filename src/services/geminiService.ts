export interface SearchResult {
  title: string;
  uri: string;
  snippet?: string;
}

export async function performSearch(query: string): Promise<{ text: string }> {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error('Error en la búsqueda');
  }

  return response.json();
}
