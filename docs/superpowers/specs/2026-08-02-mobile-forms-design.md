# Mobile-first form system — design

Date: 2026-08-02 · Approved by Alp in-session (delegated: planning/implementation/testing to Claude)

## Problem

Every add/edit form is a centered Radix dialog. On phones they are cramped: selects
overflow the viewport edge, long forms (Planned) push the submit button off-screen,
touch targets are small, and money entry uses a plain number input with no numeric
keypad hint. The app already has a good mobile shell (bottom tabs + FAB); the forms
lag behind it.

## Decisions (made with Alp)

1. **Mobile container: full-screen takeover** (not bottom sheet). Top bar with ✕ and
   title, scrollable body, sticky bottom primary button. Desktop keeps centered dialogs.
2. **Money entry: hero amount** — big centered auto-focused value with currency symbol
   and `inputmode="decimal"`, Revolut-style, at the top of money-centric forms.
3. **Category/account picking: inline chip grids** (color dot + name), with a trailing
   "+ New" chip preserving today's jump-to-create links. No dropdown layers.
4. **Dates: Today/Yesterday chips + calendar popover** (react-day-picker already in ui/).
   Defaults to Today on create. Optional-date variant has a "None" chip.
5. **One code path**: same form internals on desktop and mobile; only the container
   (dialog vs full-screen) switches at the `md` breakpoint.

## Architecture

New `src/Components/Forms/shared/`:

- `FormShell` — wraps Radix Dialog. Below `md` the content is styled as a full-screen
  page (inset-0, h-dvh, top bar, sticky footer with safe-area padding); at `md+` it
  renders like today's DialogContent. Owns the `<form>` element so Enter submits and
  the footer button is `type="submit"`. Props: open/onOpenChange, title, description?,
  submitLabel, submitDisabled?, onSubmit, onCancel?, desktopClassName?, children.
- `AmountField` — hero amount. Internal string state (accepts "," or "." decimals),
  emits parsed number; 0 renders as empty with a muted 0.00 placeholder on create.
  Props: value, onChange, currencySymbol?, autoFocus?, label?.
- `ChipPicker` — generic single-select chip row. Items {id, label, color?, icon?}.
  Selected chip = primary tint. Optional onAddNew renders "+ New" chip. Props include
  label, error?, emptyHint?.
- `DateField` — Today/Yesterday chips + "Pick a date…" popover calendar. Value is a
  `yyyy-MM-dd` string (existing `toISODate` convention). `optional` variant adds a
  clear chip (used for deadlines/until).

`ui/dialog.tsx` gains a `showCloseButton` prop (FormShell draws its own ✕ in the
mobile top bar).

## Migration list (all keep their existing state + submit logic)

Hero-amount forms: Expense (exemplar), Income, Transfer, SavingContribution,
Budget (monthly limit), SavingsGoal (target), CommitOccurrence (actual amount).
Standard-field forms (larger touch targets, chips where applicable): Account,
Category, Currency, Planned (keeps its Expense/Income/Transfer segmented control).

Out of scope: login/signup, Settings dialog, no new dependencies.

## Verification

- `npm run build` clean; `npm test` at the 150/159 known-red baseline (9 pre-existing
  Node-25 localStorage failures in ExpensePage tests).
- Headless-Chromium screenshot sweep of every form: mobile (390×844) + desktop,
  dark + light, compared against the pre-change captures.

## Git

Branch `feat/mobile-forms` off master (contains the dark-mode fix commit). Never
pushed by automation; Alp reviews and pushes.
