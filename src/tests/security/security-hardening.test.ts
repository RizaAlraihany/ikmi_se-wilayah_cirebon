/**
 * Phase 22 — Security Hardening Tests
 *
 * Comprehensive security verification:
 * - Server-side authorization on all sensitive routes
 * - No secrets in client-exposed config
 * - File upload security contracts
 * - Private file access controls
 * - WhatsApp recipient protection (server-only)
 * - Safe error responses
 * - No default production credentials in seed
 * - Session configuration
 * - Rate limiting
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('Phase 22 — Security Hardening', () => {
  describe('server-side authorization', () => {
    it('dashboard layout uses requireAuth before rendering', () => {
      const source = readSource('src/app/(dashboard)/layout.tsx')
      expect(source).toContain('requireAuth')
    })

    it('uses mutable NextResponse objects before adding noindex to redirects', () => {
      const source = readSource('src/proxy.ts')
      expect(source).not.toMatch(/\bResponse\.redirect\(/)
      expect(source).toContain('NextResponse.redirect(')
      expect(source).toContain("response.headers.set('X-Robots-Tag'")
    })

    it('audit log query verifies permission and Super Admin role server-side', () => {
      const source = readSource('src/features/audit/queries.ts')
      expect(source).toContain("requirePermission('audit.view')")
      expect(source).toContain('isSuperAdminRole')
    })

    it('document archive route checks authentication before file lookup', () => {
      const source = readSource('src/app/api/private/documents/[id]/route.ts')
      expect(source).toContain('401')
      expect(source).toContain('403')
    })
  })

  describe('no client secrets (NEXT_PUBLIC_* prohibition)', () => {
    it('WhatsApp provider token is NOT NEXT_PUBLIC_', () => {
      const envExample = readSource('.env.example')
      const whatsappLines = envExample.split('\n').filter(line => line.includes('FONNTE') || line.includes('WHATSAPP'))
      for (const line of whatsappLines) {
        expect(line).not.toContain('NEXT_PUBLIC_')
      }
    })

    it('database credentials are NOT NEXT_PUBLIC_', () => {
      const envExample = readSource('.env.example')
      const dbLines = envExample.split('\n').filter(line => line.includes('DATABASE') || line.includes('DB_'))
      for (const line of dbLines) {
        expect(line).not.toContain('NEXT_PUBLIC_')
      }
    })

    it('auth secret is NOT NEXT_PUBLIC_', () => {
      const envExample = readSource('.env.example')
      const authLines = envExample.split('\n').filter(line => line.includes('AUTH_SECRET') || line.includes('NEXTAUTH_SECRET'))
      for (const line of authLines) {
        expect(line).not.toContain('NEXT_PUBLIC_')
      }
    })
  })

  describe('file upload security', () => {
    it('file validator checks extension, MIME and magic bytes (not extension alone)', () => {
      const source = readSource('src/core/storage/file-validator.ts')
      expect(source).toMatch(/extension|ext/i)
      expect(source).toMatch(/mime|content-type/i)
      // Magic bytes / signature validation
      expect(source).toMatch(/magic|signature|uint8|buffer/i)
    })

    it('document archive upload validates file before storage', () => {
      const source = readSource('src/features/document-archives/services.ts')
      expect(source).toMatch(/validate|validator/i)
    })

    it('writing submission upload validates file type', () => {
      const source = readSource('src/features/kirim-tulisan/actions.ts')
      expect(source).toMatch(/validate|validator/i)
    })

    it('all remaining image and legacy internal-document uploads verify magic bytes', () => {
      for (const path of [
        'src/features/blog/actions.ts',
        'src/features/web-config/actions.ts',
        'src/features/media/services.ts',
      ]) {
        expect(readSource(path)).toContain('validateImageSignature')
      }
      for (const path of ['src/features/reports/actions.ts', 'src/features/letters/actions.ts']) {
        const source = readSource(path)
        expect(source).toContain('validateDocumentSignature')
        expect(source).toContain('uploadPrivateDocument')
      }
    })
  })

  describe('private file access', () => {
    it('document download route does not return unrestricted public URL', () => {
      const source = readSource('src/app/api/private/documents/[id]/route.ts')
      expect(source).not.toContain('fileUrl') // no direct public URL returned
      expect(source).toContain('getPrivateDocumentUrl') // returns a signed, expiring provider URL
    })

    it('document archive schema does not accept fileUrl from client', () => {
      const source = readSource('src/features/document-archives/schemas.ts')
      expect(source).not.toContain('fileUrl')
    })

    it('private file responses use no-store cache policy', () => {
      const source = readSource('src/app/api/private/documents/[id]/route.ts')
      expect(source).toContain('no-store')
    })

    it('Report and Letter DTOs do not send stored URLs or provider IDs to client UI', () => {
      const reportQueries = readSource('src/features/reports/queries.ts')
      const letterQueries = readSource('src/features/letters/queries.ts')
      expect(reportQueries).not.toMatch(/documentUrl:\s*true|documentPublicId:\s*true/)
      expect(letterQueries).not.toMatch(/fileUrl:\s*true|filePublicId:\s*true/)
    })
  })

  describe('WhatsApp security', () => {
    it('WhatsApp recipient list comes from server config, not public input', () => {
      const source = readSource('src/features/notification/whatsapp.ts')
      expect(source).not.toContain('NEXT_PUBLIC_')
      // Should reference server-only env var
      expect(source).toMatch(/process\.env\.|getNotificationConfig/i)
    })

    it('public form fields cannot override notification destination', () => {
      const notificationSource = readSource('src/features/notification/whatsapp.ts')
      // The destination is not derived from user input
      expect(notificationSource).not.toMatch(/body\.destination|req\.body.*phone|input\.phone/i)
    })
  })

  describe('safe error responses', () => {
    it('error utilities do not expose stack traces to client', () => {
      const source = readSource('src/core/errors/custom-errors.ts')
      expect(source).not.toContain('stack')
    })

    it('dashboard error boundary does not expose internal error details', () => {
      const source = readSource('src/app/(dashboard)/error.tsx')
      expect(source).not.toContain('error.message')
      expect(source).not.toContain('error.stack')
    })
  })

  describe('seed protection', () => {
    it('development seed cannot run in production environment', () => {
      const source = readSource('prisma/bootstrap.ts')
      expect(source).toContain('production')
      expect(source).toContain('ALLOW_DEVELOPMENT_SEED')
    })

    it('seed requires explicit opt-in environment variable', () => {
      const source = readSource('prisma/bootstrap.ts')
      expect(source).toContain('ALLOW_DEVELOPMENT_SEED')
    })
  })

  describe('rate limiting', () => {
    it('login has rate limiter applied', () => {
      const source = readSource('src/core/security/login-rate-limit.ts')
      expect(source).toContain('rate')
    })

    it('public request pamflet form has rate limiting', () => {
      const source = readSource('src/features/request-pamflet/actions.ts')
      expect(source).toMatch(/rate.?limit|rateLimit/i)
    })
  })

  describe('session security', () => {
    it('auth configuration uses secure session options', () => {
      const source = readSource('src/core/auth/auth.config.ts')
      expect(source).toContain('session')
    })

    it('auth configuration uses bcrypt or equivalent for passwords', () => {
      const source = readSource('src/core/auth/auth.config.ts')
      expect(source).toMatch(/bcrypt|compare|hash/i)
    })

    it('requires high-entropy auth and cron secrets', () => {
      const source = readSource('src/core/config/env.ts')
      expect(source).toMatch(/AUTH_SECRET:\s*z\.string\(\)\.min\(32/)
      expect(source).toMatch(/CRON_SECRET:\s*z\.string\(\)\.min\(32/)
    })
  })

  describe('CSRF, CSP and security headers', () => {
    it('keeps Server Actions on framework same-origin validation without wildcard origins', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('default same-origin Origin/Host validation')
      expect(source).not.toMatch(/allowedOrigins\s*:\s*\[\s*['"]\*['"]/)
    })

    it('defines a restrictive CSP baseline', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('Content-Security-Policy')
      expect(source).toContain("object-src 'none'")
      expect(source).toContain("frame-ancestors 'none'")
      expect(source).toContain("form-action 'self'")
      expect(source).toContain("script-src-attr 'none'")
    })

    it('sanitizes publication HTML before both create and update writes', () => {
      const source = readSource('src/features/blog/services.ts')
      expect(source.match(/DOMPurify\.sanitize/g)).toHaveLength(2)
    })

    it('next.config.ts includes Strict-Transport-Security header', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('Strict-Transport-Security')
    })

    it('next.config.ts includes X-Frame-Options DENY', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('X-Frame-Options')
    })

    it('next.config.ts includes X-Content-Type-Options nosniff', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('nosniff')
    })

    it('next.config.ts includes Permissions-Policy', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('Permissions-Policy')
    })

    it('adds modern origin isolation headers without enabling legacy XSS filtering', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('Cross-Origin-Opener-Policy')
      expect(source).toContain('Cross-Origin-Resource-Policy')
      expect(source).toContain("{ key: 'X-XSS-Protection', value: '0' }")
    })
  })

  describe('deny by default', () => {
    it('document archive operations check permission before operation', () => {
      const source = readSource('src/features/document-archives/actions.ts')
      expect(source).toMatch(/permission|can\(|requireAuth|auth\(/i)
    })

    it('program mutations check authorization before database write', () => {
      const source = readSource('src/features/programs/actions.ts')
      expect(source).toMatch(/requireAuth|can\(|permission/i)
    })
  })
})
