// Vercel Function: evaluates Vercel Flags on the server and returns plain booleans to the app.
// (The `flags/next` Flags SDK only runs inside Next.js / SvelteKit, so this Vite app uses
//  Vercel's framework-agnostic core library, which is the same engine behind `vercelAdapter()`.)
//
// Flag key in the Vercel dashboard  ->  name the app reads
import { flagsClient } from '@vercel/flags-core'

const FLAGS = {
  showButtonFilter: { key: 'show-button-filter', fallback: true },
}

export default async function handler(req, res) {
  const out = {}
  // Evaluate inside the request handler (required for request-scoped OIDC auth)
  await Promise.all(
    Object.entries(FLAGS).map(async ([name, { key, fallback }]) => {
      try {
        const result = await flagsClient.evaluate(key, fallback)
        out[name] = typeof result.value === 'boolean' ? result.value : fallback
      } catch {
        out[name] = fallback
      }
    }),
  )
  // Short CDN cache keeps flag-request usage low while toggles still apply within ~30s
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300')
  res.status(200).json(out)
}
