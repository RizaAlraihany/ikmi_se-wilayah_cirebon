import proxy from './proxy'

// Next.js 15 uses the conventional middleware filename under src/. The matcher
// remains literal because Next reads this export before compiling the module.
export default proxy

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
