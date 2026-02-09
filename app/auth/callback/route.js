import { NextResponse } from 'next/server'

export async function GET(request) {
  // OAuth callback handler
  // This redirects users back to home after OAuth login
  return NextResponse.redirect(new URL('/', request.url))
}
