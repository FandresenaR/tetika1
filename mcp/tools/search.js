import axios from 'axios';

export async function searchWeb(args) {
  const { query, location, num_results = 10 } = args;

  try {
    // Use Tetika's existing search API endpoint
    const response = await axios.post('http://localhost:3000/api/search', {
      query,
      location,
      num_results,
    });

    if (response.data.success) {
      const results = response.data.results.map((result, index) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        position: index + 1,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query,
              total_results: results.length,
              results,
            }, null, 2),
          },
        ],
      };
    } else {
      throw new Error(response.data.error || 'Search failed');
    }
  } catch (error) {
    console.error('Web search error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Web search failed',
            message: error.message,
            query,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}
