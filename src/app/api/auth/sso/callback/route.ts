import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signCookie } from '@/lib/secureCookie';
import { createAuditLog } from '@/lib/auditLog';

const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const TENANT_ID = 'common';

export async function GET(request: Request) {
  try {
    const host = request.headers.get('host') || 'localhost:3000';
    const isLocalhost = host.includes('localhost');
    const protocol = isLocalhost ? 'http' : 'https';
    const origin = `${protocol}://${host}`;
    const redirectUri = `${origin}/api/auth/sso/callback`;

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url));
    }

    if (!AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
      return NextResponse.redirect(new URL('/login?error=oauth_config', request.url));
    }

    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const tokenBody = new URLSearchParams({
      client_id: AZURE_CLIENT_ID,
      client_secret: AZURE_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/login?error=token_exchange', request.url));
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user:', await userResponse.text());
      return NextResponse.redirect(new URL('/login?error=user_fetch', request.url));
    }

    const user = await userResponse.json();
    const email = user.mail || user.userPrincipalName;

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=no_email', request.url));
    }

    const normalizedEmail = email.toLowerCase();
    const isValidDomain = 
      normalizedEmail.endsWith('@mahasiswa.itb.ac.id')

    if (!isValidDomain) {
      await createAuditLog({
        action: 'LOGIN_SSO_REJECTED',
        actorEmail: email,
        actorRole: 'VOTER',
        status: 'BLOCKED',
        errorMsg: 'Email tidak menggunakan domain ITB',
      });
      return NextResponse.redirect(new URL('/login?error=invalid_domain', request.url));
    }

    const nim = normalizedEmail.split('@')[0];
    const emailDomain = normalizedEmail.split('@')[1];

    // Check if voter exists in Voter table
    const voterRecord = await prisma.voter.findUnique({
      where: { nim },
    });

    if (!voterRecord) {
      await createAuditLog({
        action: 'LOGIN_SSO_REJECTED',
        actorEmail: normalizedEmail,
        actorRole: 'VOTER',
        status: 'BLOCKED',
        errorMsg: 'NIM tidak terdaftar di Voter table',
      });
      return NextResponse.redirect(new URL('/login?error=not_in_whitelist', request.url));
    }

    let isAdmin = false;
    try {
      const admin = await prisma.admin.findUnique({ where: { nim } });
      isAdmin = !!admin;
    } catch (e) {}

    // Update voter name if changed
    if (voterRecord.name !== user.displayName) {
      await prisma.voter.update({
        where: { nim },
        data: { name: user.displayName },
      });
    }

    const signedSession = signCookie(normalizedEmail);
    const response = NextResponse.redirect(new URL('/', request.url));

    response.cookies.set('voter_session', signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
    });

    await createAuditLog({
      action: 'LOGIN_SSO_SUCCESS',
      actorNim: nim,
      actorEmail: normalizedEmail,
      actorRole: isAdmin ? 'ADMIN' : 'VOTER',
      status: 'SUCCESS',
      details: { domain: emailDomain },
    });

    return response;
  } catch (error) {
    console.error('SSO Callback Error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
