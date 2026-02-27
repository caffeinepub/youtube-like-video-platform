# Specification

## Summary
**Goal:** Add a Dollar Bank Account Withdrawal feature to Mediatube, allowing creators to view their USD balance, request withdrawals, and track transaction history.

**Planned changes:**
- Add backend data model in `backend/main.mo` to store a USD balance per user, record withdrawal transactions (amount, timestamp, status), and expose `getBalance`, `requestWithdrawal`, and `getTransactionHistory` methods
- Reject withdrawal requests that exceed the available balance with an appropriate error
- Create a new `/withdrawal` page displaying the current USD balance, a withdrawal amount input with submit button, and a transaction history table (amount, date, status)
- Show sign-in prompt for unauthenticated users, loading skeletons while fetching, and handle offline state with the existing `OfflineErrorState` component
- Register the `/withdrawal` route in `App.tsx`
- Add a "Withdraw" navigation link (wallet/cash icon) to the desktop sidebar
- Add a "Withdraw" tab to the mobile `BottomNav` component

**User-visible outcome:** Creators can navigate to the Withdraw page from the sidebar or bottom nav, see their current USD balance, submit a withdrawal request, and review their past withdrawal transactions with status updates.
