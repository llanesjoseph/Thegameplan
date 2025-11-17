'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useUrlEnhancedRole } from '@/hooks/use-url-role-switcher'

export const dynamic = 'force-dynamic'

export default function StripeConfigAdminPage() {
  const { user, loading } = useAuth()
  const { effectiveRole, loading: roleLoading } = useUrlEnhancedRole()

  const [secretKey, setSecretKey] = useState('')
  const [publishableKey, setPublishableKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [priceIdsRaw, setPriceIdsRaw] = useState('')
  const [portalReturnUrl, setPortalReturnUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null)

  const isLoading = loading || roleLoading

  const allowedEmail = (process.env.NEXT_PUBLIC_STRIPE_CONFIG_ADMIN_EMAIL || '').toLowerCase()
  const userEmail = (user?.email || '').toLowerCase()
  const isSuperadmin = effectiveRole === 'superadmin'
  const isExplicitlyAllowed = allowedEmail && userEmail === allowedEmail

  // Load Stripe status for badge (admins only)
  useEffect(() => {
    const loadStatus = async () => {
      if (!user || (!isSuperadmin && !isExplicitlyAllowed)) {
        setStatusLoading(false)
        return
      }
      try {
        const res = await fetch('/api/admin/stripe-status')
        if (!res.ok) {
          setStripeConfigured(null)
        } else {
          const data = await res.json().catch(() => ({}))
          setStripeConfigured(!!data?.data?.configured)
        }
      } catch {
        setStripeConfigured(null)
      } finally {
        setStatusLoading(false)
      }
    }
    loadStatus()
  }, [user, isSuperadmin, isExplicitlyAllowed])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4" />
          <p className="text-gray-700 text-sm">Checking admin access…</p>
        </div>
      </div>
    )
  }

  if (!user || (!isSuperadmin && !isExplicitlyAllowed)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md shadow-sm">
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}>
            Access Restricted
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            You do not have permission to view the Stripe configuration portal.
          </p>
          <p className="text-xs text-gray-400">
            Only the superadmin and a single designated admin user may access this page.
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const priceIds = priceIdsRaw
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)

      const res = await fetch('/api/admin/save-stripe-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secretKey,
          publishableKey,
          webhookSecret,
          priceIds,
          portalReturnUrl
        })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        setError(
          data?.error ||
            'Failed to save Stripe configuration. Please check your credentials or try again later.'
        )
        return
      }

      // Clear sensitive values after successful save
      setSecretKey('')
      setPublishableKey('')
      setWebhookSecret('')
      setPriceIdsRaw('')
      setPortalReturnUrl('')

      setMessage(
        'Your Stripe configuration has been securely saved. Updates will be active within a few minutes.'
      )
    } catch (err: any) {
      setError(
        err?.message || 'Unexpected error while saving Stripe configuration. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}
          >
            Stripe Configuration
          </h1>
          {!statusLoading && stripeConfigured !== null && (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                stripeConfigured
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  stripeConfigured ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              {stripeConfigured ? 'Stripe: Configured' : 'Stripe: Not fully configured'}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: '"Open Sans", sans-serif' }}>
          Enter your live Stripe keys. These values are sent securely to the server and stored only
          in encrypted environment variables. They will never be shown again after saving.
        </p>

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="secretKey">
              Stripe Secret Key
            </label>
            <input
              id="secretKey"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="sk_live_..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="publishableKey">
              Stripe Publishable Key
            </label>
            <input
              id="publishableKey"
              type="password"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="pk_live_..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="webhookSecret">
              Webhook Signing Secret
            </label>
            <input
              id="webhookSecret"
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="whsec_..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="priceIds">
              Subscription Price ID(s)
            </label>
            <input
              id="priceIds"
              type="text"
              value={priceIdsRaw}
              onChange={(e) => setPriceIdsRaw(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="price_12345, price_67890 (comma-separated, optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="portalReturnUrl">
              Customer Portal Return URL
            </label>
            <input
              id="portalReturnUrl"
              type="url"
              value={portalReturnUrl}
              onChange={(e) => setPortalReturnUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="https://athleap.crucibleanalytics.dev/dashboard/athlete"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 rounded-lg bg-black text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : 'Save Stripe Configuration'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-xs text-gray-400">
          For security, the values you enter here are never stored in Firestore and are not
          readable from the frontend after you save.
        </p>
      </div>
    </div>
  )
}


