import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin

  // Get the code from the query params
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    // OAuth succeeded - redirect to home
    return NextResponse.redirect(`${origin}/`)
  }

  // No code - redirect to home anyway
  return NextResponse.redirect(`${origin}/`)
}
