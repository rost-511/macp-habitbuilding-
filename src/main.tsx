import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' // Your styles might be named differently, keep whatever you had here
import { ClerkProvider } from '@clerk/clerk-react'

// Import your Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// A safety net to warn you if the key is missing
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

/* ─────────────────────────────────────────────────────────────────────────────
   MACP CLERK THEME
   A MACP-native skin over Clerk's real backend. We never replace Clerk — we
   only restyle its supported components so the auth experience reads as MACP
   (near-black surfaces, amber CTA, cream text, mono micro-labels) instead of
   the default light Clerk UI. Shell-specific overrides (hiding Clerk's own
   header/footer, transparent card) live alongside <SignIn/> / <SignUp/> in
   App.tsx; this provider-level theme guarantees the palette/type everywhere
   (including the signed-in UserButton popover).
───────────────────────────────────────────────────────────────────────────── */
const macpClerkAppearance = {
  variables: {
    colorPrimary: '#d4922a',
    colorBackground: '#0f1013',
    colorText: '#f0ece3',
    colorTextSecondary: '#9a9699',
    colorTextOnPrimaryBackground: '#07080a',
    colorInputBackground: '#161719',
    colorInputText: '#f0ece3',
    colorDanger: '#c94040',
    colorSuccess: '#2d9e5f',
    colorNeutral: '#f0ece3',
    colorShimmer: 'rgba(212,146,42,0.18)',
    fontFamily: "'Outfit', sans-serif",
    fontFamilyButtons: "'Outfit', sans-serif",
    fontSize: '0.95rem',
    borderRadius: '8px',
    spacingUnit: '1rem',
  },
  elements: {
    card: {
      backgroundColor: 'transparent',
      boxShadow: 'none',
      border: 'none',
    },
    // Provider buttons: dark, bordered, large, clean — the eye lands on the amber CTA.
    socialButtonsBlockButton: {
      backgroundColor: '#161719',
      border: '1px solid #2a2b30',
      borderRadius: '8px',
      minHeight: '52px',
      color: '#f0ece3',
      fontWeight: 600,
      letterSpacing: '0.01em',
      transition: 'border-color .18s, background-color .18s, transform .18s',
      '&:hover': {
        backgroundColor: '#1b1c1f',
        borderColor: 'rgba(212,146,42,0.45)',
      },
    },
    socialButtonsBlockButtonText: {
      fontSize: '0.95rem',
      fontWeight: 600,
      color: '#f0ece3',
    },
    dividerLine: { backgroundColor: '#1f2024' },
    dividerText: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.62rem',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#6b6870',
    },
    // Field micro-labels in mono — MACP's signature texture.
    formFieldLabel: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.62rem',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#9a9699',
    },
    formFieldInput: {
      backgroundColor: '#161719',
      border: '1px solid #2a2b30',
      borderRadius: '8px',
      minHeight: '52px',
      color: '#f0ece3',
      fontSize: '0.95rem',
      '&:focus': {
        borderColor: 'rgba(212,146,42,0.6)',
        boxShadow: '0 0 0 3px rgba(212,146,42,0.10)',
      },
    },
    // The one filled element: solid amber, dark text.
    formButtonPrimary: {
      backgroundColor: '#d4922a',
      color: '#07080a',
      borderRadius: '8px',
      minHeight: '52px',
      fontSize: '0.95rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
      textTransform: 'none',
      boxShadow: '0 0 32px rgba(212,146,42,0.30)',
      transition: 'transform .18s, box-shadow .18s',
      '&:hover': {
        backgroundColor: '#dc9c36',
        boxShadow: '0 0 44px rgba(212,146,42,0.42)',
      },
      '&:focus': { boxShadow: '0 0 0 3px rgba(212,146,42,0.25)' },
    },
    // The real Clerk OTP / email-code inputs (Clerk owns this flow).
    otpCodeFieldInput: {
      backgroundColor: '#0f1013',
      border: '1px solid #2a2b30',
      borderRadius: '10px',
      color: '#f0ece3',
      '&:focus': {
        borderColor: '#d4922a',
        boxShadow: '0 0 18px rgba(212,146,42,0.25)',
      },
    },
    formResendCodeLink: { color: '#d4922a', fontWeight: 600 },
    identityPreviewText: { color: '#f0ece3' },
    identityPreviewEditButton: { color: '#d4922a' },
    formFieldErrorText: { color: '#c94040' },
    formFieldSuccessText: { color: '#2d9e5f' },
    footerActionLink: { color: '#d4922a', fontWeight: 600 },
    footerActionText: { color: '#9a9699' },
    backLink: { color: '#9a9699' },
    spinner: { color: '#d4922a' },
    // Themed signed-in account popover (improves the signed-in header treatment).
    userButtonPopoverCard: {
      backgroundColor: '#0f1013',
      border: '1px solid #1f2024',
      boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
    },
    userButtonPopoverActionButton: { color: '#f0ece3' },
    userButtonPopoverActionButtonText: { color: '#f0ece3' },
    userButtonPopoverActionButtonIcon: { color: '#9a9699' },
    userPreviewMainIdentifier: { color: '#f0ece3' },
    userPreviewSecondaryIdentifier: { color: '#9a9699' },
  },
}

// Minimal localization tweaks so the divider reads in MACP's voice. Unknown keys
// fall back to Clerk defaults; this never alters the real auth flow.
const macpClerkLocalization = {
  dividerText: 'or continue with email',
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={macpClerkAppearance}
      localization={macpClerkLocalization}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
