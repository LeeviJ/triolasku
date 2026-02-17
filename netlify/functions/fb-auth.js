export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const appId = process.env.FB_APP_ID
  if (!appId) {
    return { statusCode: 500, body: JSON.stringify({ error: 'FB_APP_ID not configured' }) }
  }

  const licenseKey = event.queryStringParameters?.licenseKey
  if (!licenseKey) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing licenseKey' }) }
  }

  const state = Buffer.from(JSON.stringify({ licenseKey })).toString('base64')
  const redirectUri = 'https://triotools.fi/.netlify/functions/fb-callback'
  const scopes = 'pages_show_list,pages_manage_posts'

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${encodeURIComponent(state)}`

  return {
    statusCode: 302,
    headers: { Location: authUrl },
    body: '',
  }
}
