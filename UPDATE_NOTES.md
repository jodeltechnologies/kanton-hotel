# Kanton Hotel update

## Included changes

- The homepage, navigation and footer now link to the public booking kiosk.
- Clients can reserve with the configured advance or pay in full, in both the normal booking form and kiosk.
- The kiosk lets clients choose arrival and departure dates and shows rooms available for those dates.
- Mobile Money codes and WhatsApp payment messages use the selected amount. Guests who have already paid an advance can pay only their remaining balance.
- Reception confirms actual transfers. A client reporting a transfer does not mark money as received. Full-payment receipts show a zero balance after confirmation.
- Receipts, invoices and unpaid reservation slips use a narrow black-on-white thermal layout with 80 mm and 58 mm options. Print controls stay off the paper. Guest details, room, dates, item prices, amounts received, references and balance remain visible.
- Failed payment inserts show an error at the desk instead of opening a nonexistent receipt.
- The dedicated reception tablet still uses the existing PIN at `/kiosk?tablet=1`. Guests use `/kiosk`.

## Upload to your repository

1. Extract this ZIP.
2. Copy the contents of `kanton-hotel-main` into the root of your existing repository, replacing matching files. Do not place that folder inside another copy of the project.
3. Keep your existing `.env.local` and your deployment environment variables.
4. Include the new `package-lock.json`. Run `npm ci`, then `npm run build` using your existing Supabase configuration.
5. Commit and push the changes. Your existing deployment workflow can then rebuild the app.

No database migration is required for this update. Payment choices are stored in the existing reservation history. The ZIP contains source files, public assets, SQL files and documentation. It excludes installed packages, build output, QA fixtures and credentials.

## Thermal printer settings

Select the receipt width in the app, then select the same 58 mm or 80 mm paper in your thermal printer driver. Use 100% scale, no margins, and no browser headers or footers. The app measures the receipt length instead of forcing A4 paper. A physical printer still needs the correct driver and paper settings.

## Verification

- TypeScript checking and a full production build passed.
- Browser checks against a local test database fixture passed for normal bookings and kiosk bookings, with both advance and full-payment choices.
- Confirmed that reporting a transfer leaves the amount received unchanged until reception records it.
- Checked an advance-paid booking, a fully paid booking, the staff payment receipt flow, and a failed payment insert.
- Verified the kiosk at a 375 px mobile width and checked the reception tablet PIN flow.
- Generated and inspected 58 mm and 80 mm PDFs. Each contained the complete receipt on one page, with no horizontal clipping, visible guest and payment details, and a zero balance for full payment.

These checks used test data. No live Supabase data was changed and no physical printer was connected.
