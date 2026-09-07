# Kanton brand fix — logo and colour theme

Drop these files into the `kanton-hotel` project, keeping the same paths. Everything here
either replaces an existing file or is new; nothing needs deleting, and no other file
changes. Then `npm run dev`, or commit and push and Vercel rebuilds.

```
public/logo.png            the full lockup, transparent, for light backgrounds
public/logo-on-dark.png    same lockup with the tagline in white, for the navy bars
public/logo-mark.png       just the K with the chef's hat
src/app/icon.png           browser tab icon (Next picks this up on its own)
src/app/apple-icon.png     icon when the tablet page is added to a home screen
src/app/globals.css        the new palette
src/app/layout.tsx         tab title, icons, browser theme colour
src/components/chrome.tsx  logo in the header and the footer
src/app/kiosk/page.tsx     logo on the reception tablet
src/app/kiosk/[code]/page.tsx
src/app/receipt/[code]/page.tsx   logo on printed receipts and invoices
src/lib/email.ts           logo and brand colours in guest email
```

After copying, hard-refresh once (Ctrl/Cmd + Shift + R) — browsers hold on to the old tab
icon for a while.

## The palette

Read off the sign itself, so the app matches what is over the door.

| Token | Value | Where it shows |
|---|---|---|
| `--brand-red` | `#A80F22` | the wordmark; every primary button, prices due, the active item in the sidebar |
| `--brand-orange` | `#F26A0C` | the flag over the "o"; the rule under the hero, the price tag on a room card, the selected tab |
| `--brand-navy` | `#0D1826` | the letter outlines and the tagline; the top bar, the sidebar, the kiosk header |
| `--brand-blue` | `#17548F` | pulled out of the pale sign plate; amenity chips, "in house", secondary buttons |
| `--brand-paper` | `#E9F1FA` | the plate itself; the page background |

Everything else in the app already reads from these tokens, which is why one stylesheet
repaints the whole system — guest site, front desk, tablet, receipts and email.

A dark-mode set is defined alongside, so the console stays readable on a phone or tablet
set to dark.

## If you rename the hotel

The logo is an image, so `Hotel settings → Hotel name` no longer changes what is drawn in
the header. Replace `public/logo.png` and `public/logo-on-dark.png` with your own artwork
at the same names — anything around 1400 × 690 with a transparent background works.
