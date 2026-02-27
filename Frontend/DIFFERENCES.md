# Differences: Frontend (Vite) vs frontend-next (Next.js)

This doc lists intentional and behavioral differences that can affect “features not working as expected.”

## 1. **Component tree (fixed)**

- **Frontend:** `ClientAutoConnect`, `CallNotificationHandler`, `SipJsCallNotificationHandler`, and `SipJsCall` are **siblings** of `PageLayout`, not inside it.
- **frontend-next (before fix):** They were rendered **inside** `PageLayout`.
- **frontend-next (now):** Matches Frontend: same components are siblings of `PageLayout`. Important for correct DOM order and any logic that assumes these are outside the main content.

## 2. **Toasts**

- **Frontend:** Uses Radix-style `Toaster` from `@/components/ui/toaster` and also calls `toast()` from the `sonner` package in Dialer, ClientOptions, SimpleUserDialer, SipJsCallNotificationHandler. The original app does **not** mount the Sonner `<Toaster />`, so those `toast()` calls may not show in Vite either unless sonner auto-mounts.
- **frontend-next:** Mounts both the Radix-style Toaster and `<Toaster />` from `sonner` in the root layout so every `toast()` from `sonner` actually displays.

## 3. **Host / RTC URL**

- **Frontend:** `hostAtom` is set from `window.location.search` and `import.meta.env.VITE_RTC_HOST` at module load (browser only). Note: original code uses `atom<string>(host)` where `host` is a **function**, so the atom’s value is a function, not a string (likely a bug in the original).
- **frontend-next:** `hostAtom` is SSR-safe: initial value is `process.env.NEXT_PUBLIC_RTC_HOST ?? ''`. A `HostSync` component runs in `useEffect` and updates the atom from `window.location.search` so `?host=...` is applied after hydration. If the Telnyx client is created before `HostSync` runs, it may briefly use the env host; it will be recreated when the atom updates.

## 4. **Environment variables**

- **Frontend:** `VITE_RTC_HOST`, `VITE_SIP_HOST`, and `import.meta.env.MODE` / `import.meta.env.DEV` (in `@/lib/vite`).
- **frontend-next:** `NEXT_PUBLIC_RTC_HOST`, `NEXT_PUBLIC_SIP_HOST`, and `process.env.NODE_ENV` (in `@/lib/env`). Copy `.env.local.example` to `.env.local` and set these if you override defaults.

## 5. **Rendering and WebRTC**

- **Frontend:** Single client bundle; everything runs in the browser.
- **frontend-next:** The main demo UI is loaded with `dynamic(..., { ssr: false })`, so the whole tree (including WebRTC usage like `RTCRtpSender`) runs only on the client. No server-side execution of that code.

## 6. **SDK version dropdown**

- **Frontend:** Dynamic import from `` `https://esm.sh/@telnyx/webrtc@${version}` `` (Vite supports this).
- **frontend-next:** Same URL is used with `/* webpackIgnore: true */` so the bundler doesn’t resolve it. If loading a specific version from esm.sh fails in your environment (e.g. network/CORS), the dropdown may not switch versions correctly.

## 7. **Theme**

- **Frontend:** Custom `ThemeProvider`; `localStorage` read at init.
- **frontend-next:** Same provider with `'use client'` and a `typeof window !== 'undefined'` guard so `localStorage` isn’t read during SSR.

## 8. **ThemeProvider `setTheme`**

- **Both:** The context value uses `setTheme(theme)` where the inner `setTheme` is the React state setter. Naming is confusing but behavior is correct (state and `localStorage` are updated).

---

If something still doesn’t work, check:

- **Connection / registration:** Host and credentials; ensure `NEXT_PUBLIC_*` are set and, if needed, `?host=...` in the URL.
- **Toasts:** Confirm both Toasters are mounted (Radix + Sonner) and that the code path calls `toast()` from `sonner` where you expect.
- **Calls / UI:** Ensure you’re in the right mode (SDK vs SIP.js vs AI Agent) and that the handlers are siblings of `PageLayout` (current frontend-next matches Frontend).
