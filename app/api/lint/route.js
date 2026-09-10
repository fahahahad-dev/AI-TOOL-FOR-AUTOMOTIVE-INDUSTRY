

export async function POST(request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return Response.json(
        { error: 'No code provided' },
        { status: 400 }
      );
    }
    
    // Proxy to remote backend lint API
    const apiUrl = 'http://20.40.58.218:3000/lint';
    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const results = await apiRes.json();
    console.log(results);
    return Response.json(results);
    
  } catch (error) {
    console.error('Lint API error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}