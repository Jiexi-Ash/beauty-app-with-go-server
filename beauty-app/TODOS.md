# TODOS

## Booking & Payment

### Set up convex-test + Vitest test harness

**What:** Install `convex-test`, `vitest`, `@edge-runtime/vm`, add a `vitest.config.ts`.

**Why:** Zero test infrastructure exists in `convex/` today. This is the prerequisite for writing any of the regression/fix tests identified in the 2026-07-10 eng review, and for any future automated testing on this codebase.

**Context:** No jest/vitest config, no test directories, no `.test.ts` files anywhere in the repo. Convex's own docs (docs.convex.dev/testing) recommend `convex-test` + Vitest as the standard, officially-maintained approach — it mocks the backend in pure JS, supports fake timers, and supports mocked scheduled functions (`t.finishInProgressScheduledFunctions`), which the sweep/webhook tests below need.

**Effort:** S
**Priority:** P1
**Depends on:** None

### Write the 9 regression/fix tests from the 2026-07-10 eng review

**What:** Write the following tests, using the harness above:
1. `createBookingRecord`/`rescheduleBookingRecord` — 24h overlap lookback is consistent between booking and reschedule (regresses `reschedule-lookback-narrow`).
2. `bookSlot` — throws before any mutation runs when `SPLIT_MAX` is missing/invalid (regresses `paystack-split-max-nan`).
3. `handlePaystackEvent`/`markCompleted` — `merchantAmount`/`paymentSplits` populate on completion (regresses `paystack-merchant-amount-never-set`).
4. `handlePaystackEvent`/`markCompleted` fallback branch — commission capped at `SPLIT_MAX` even when `fees_split` is missing (regresses `r30-cap-gap-only-retry-path`).
5. `business/admin.ts createBusiness` — subaccount-exists check runs before any Paystack API call (regresses `paystack-before-business-check`).
6. `onboarding.tsx` ConvexError extraction — `typeof error.data === "string"` checked before treating it as an object (regresses `convex-error-string-extraction`).
7. `computeSplitFallback()` — under cap, over cap, exactly-at-cap boundary.
8. `bookSlot` + `cancelOrphanedBooking` — Paystack init failure triggers cancellation, frees the slot, idempotent on double-call.
9. `createBookingRecord` → `bookSlot` — deposit amount passed through, not recomputed.

**Why:** Locks in the 6-bug history and this session's 4 new fixes so none can silently regress again — this exact code path has produced 6 found-and-fixed bugs already.

**Context:** Full test plan with edge cases and user flows lives at `~/.gstack/projects/Jiexi-Ash-beauty-app/jiexi-develop-eng-review-test-plan-20260710-173014.md`. Tests 4, 7, 8, and 9 can now be written against real code — `computeSplitFallback()`, `cancelOrphanedBooking`, and the deposit-amount passthrough all landed on 2026-07-10 (see Completed section below).

**Effort:** M
**Priority:** P1
**Depends on:** Test harness setup (above)

### Track deposit checkout abandonment once real bookings start

**What:** Manual log (date, deposit amount shown, completed vs. abandoned) once a real operator has live bookings.

**Why:** `DEPOSIT_PERCENT = 0.5` (50%) is well above the 20-30% industry deposit norm. The founder's justification is that it mirrors informal WhatsApp/EFT norms among solo stylists — but an informally-negotiated deposit between people who already know each other may not transfer to a cold, app-enforced deposit before any trust exists. This is the only way to actually validate or falsify that assumption.

**Context:** No analytics infra exists yet — start with a manual log, not a new event-tracking system. Flagged during the 2026-07-10 /office-hours session as an untested transfer risk (revised premise #2 in the design doc).

**Effort:** S
**Priority:** P2
**Depends on:** A real operator with live bookings (recruitment not yet started as of this session)

### Prod cutover: Clerk + Convex + Paystack to production

**What:** Switch all three systems (Clerk, Convex, Paystack) from dev/test to production as an explicit, sequenced step.

**Why:** Currently everything runs on dev/test across all three systems — a real operator cannot transact yet regardless of recruitment progress. This cutover is the actual gate before any real money moves, and it wasn't written down anywhere before this session.

**Context:** The 4 code fixes (shared cap-fallback helper, dedup deposit calc, orphan-booking cancellation, pending-slot lockout fix) are done — see Completed section below. Sequence this cutover AFTER the live Paystack dry run so production never runs against code the dry run hasn't exercised. Surfaced via outside-voice cross-model review during the 2026-07-10 /plan-eng-review session.

**Effort:** M
**Priority:** P1
**Depends on:** Live Paystack dry run complete

## Completed

### Extract commission-split fallback helper, apply SPLIT_MAX cap

**What:** New shared `computeSplitFallback()` in `convex/paystack/split.ts`, used by `booking/admin.ts:markCompleted` and `paystack/mutations.ts:handlePaystackEvent`. Applies `Math.min(x, SPLIT_MAX)` when Paystack's `fees_split` is missing, and consolidates `SPLIT_MAX` env parsing (`getSplitMaxCents()`) out of `booking/actions.ts` too.

**Why:** The duplicated fallback calc in two files neither applied the R30 cap — a dashboard-accuracy drift (not fund misallocation; real money already settled correctly via the capped `transaction_charge`), but records could show an uncapped commission if `fees_split` ever came back missing.

**Completed:** 2026-07-10 (eng review + same-session implementation)

### Return computed deposit amount instead of recomputing

**What:** `createBookingRecord` (`booking/public.ts`) now returns `depositAmount` instead of `servicePrice`; `bookSlot` (`booking/actions.ts`) uses it directly instead of recomputing `Math.round(price * DEPOSIT_PERCENT)` a second time.

**Why:** Two independent computations of the same formula meant a future edit to one and not the other would silently desync the amount charged via Paystack from `bookingPayment.amount` — the value the webhook/poll paths treat as ground truth for their amount-mismatch check.

**Completed:** 2026-07-10 (eng review + same-session implementation)

### Compensating cancellation on Paystack init failure

**What:** New `cancelOrphanedBooking` mutation (`booking/admin.ts`); `bookSlot` wraps the Paystack checkout call in try/catch and calls it on failure before re-throwing.

**Why:** If Paystack initialization threw after `createBookingRecord`'s mutation already committed the booking+payment as "pending," the booking was orphaned forever — Convex actions don't roll back mutations when a later step fails, and the stale-pending sweep can't resolve a payment reference Paystack never registered.

**Completed:** 2026-07-10 (eng review + same-session implementation)

### Fix pending-slot lockout vector

**What:** Rate limit in `createBookingRecord` (`booking/public.ts`) — max 3 pending/abandoned booking attempts per user per business per rolling hour, counting only `pending`/`cancelled_by_payment_failed` statuses so legitimate repeat customers aren't penalized.

**Why:** Outside-voice review found any logged-in user could repeatedly start-and-abandon checkout to hold a solo operator's single slot (`maxConcurrentBookings=1`) indefinitely, since each abandoned hold only released after the ~15-20min stale-pending sweep and nothing stopped immediately re-creating one.

**Completed:** 2026-07-10 (outside voice finding + same-session implementation)
