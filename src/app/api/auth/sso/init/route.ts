import { NextResponse } from 'next/server';

const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const TENANT_ID = 'common';

export async function GET(request: Request) {
  if (!AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Konfigurasi SSO tidak lengkap. Hubungi administrator.' },
      { status: 500 }
    );
  }

  const host = request.headers.get('host') || 'localhost:3000';
  const isLocalhost = host.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const origin = `${protocol}://${host}`;
  const redirectUri = `${origin}/api/auth/sso/callback`;

  const state = crypto.randomUUID();

  const authUrl = new URL(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set('client_id', AZURE_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('scope', 'openid email profile User.Read');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(authUrl.toString());
}
