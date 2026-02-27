# WebRTC Demo (Next.js)

Next.js port of the WebRTC demo from the Vite-based Frontend. Same features and logic; runs on the App Router.

## Setup

```bash
npm install
cp .env.local.example .env.local   # optional: edit NEXT_PUBLIC_* if needed
```

## Run

```bash
npm run dev    # http://localhost:3000
npm run build
npm run start
```

## Env

- `NEXT_PUBLIC_RTC_HOST` – RTC host (e.g. `wss://rtc.telnyx.com`)
- `NEXT_PUBLIC_SIP_HOST` – SIP host (e.g. `sip.telnyx.com`)

Defaults are in `.env.local`.
