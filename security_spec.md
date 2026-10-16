# AquaTrack Security Specification

## 1. Data Invariants
1. **User Scoping & Isolation**: All swim sessions and user settings belong strictly to the authenticated user `/users/{userId}/...`. A user may never read, list, create, update, or delete sessions belonging to another `userId`.
2. **Identity Integrity**: For every write in `/users/{userId}/sessions/{sessionId}`, `incoming().userId == request.auth.uid` AND `userId == request.auth.uid`.
3. **Data Sanity**:
   - `laps > 0 && laps <= 1000`
   - `poolLength >= 10 && poolLength <= 100`
   - `distance > 0 && distance <= 100000`
   - `durationSeconds > 0 && durationSeconds <= 86400`
   - `paceSecondsPer100m > 0 && paceSecondsPer100m <= 600`
4. **Immutable Ownership**: On update, `incoming().userId == existing().userId`.
5. **Default Deny**: All unmapped paths are rejected.

## 2. The Dirty Dozen Payloads
1. **Payload 1 (Impersonation Write)**: An unauthenticated request attempts to create a session in `/users/user123/sessions/session1`. (Expected: PERMISSION_DENIED)
2. **Payload 2 (Cross-User Read)**: User `userA` attempts to read `/users/userB/sessions/session1`. (Expected: PERMISSION_DENIED)
3. **Payload 3 (Cross-User List)**: User `userA` attempts to query `/users/userB/sessions`. (Expected: PERMISSION_DENIED)
4. **Payload 4 (Identity Spoofing in Document)**: User `userA` creates a session at `/users/userA/sessions/s1` with `{ userId: "userB" }`. (Expected: PERMISSION_DENIED)
5. **Payload 5 (Negative Laps Attack)**: User `userA` writes session with `{ laps: -50 }`. (Expected: PERMISSION_DENIED)
6. **Payload 6 (Oversized Payload / Denial of Wallet)**: Session note with string length > 50,000 characters. (Expected: PERMISSION_DENIED)
7. **Payload 7 (Path Traversal / Invalid Doc ID)**: Attempting to write with doc ID containing illegal path characters `../../admin`. (Expected: PERMISSION_DENIED)
8. **Payload 8 (Owner Mutation on Update)**: User `userA` tries to update session and change `userId` to `userB`. (Expected: PERMISSION_DENIED)
9. **Payload 9 (Zero Duration / Pace Anomaly)**: Attempting to insert `durationSeconds: 0`. (Expected: PERMISSION_DENIED)
10. **Payload 10 (Ghost Field Injection)**: Injecting `{ isAdmin: true, role: 'root' }` into session data. (Expected: PERMISSION_DENIED)
11. **Payload 11 (Unauthenticated Settings Read)**: Anonymous guest reading user settings. (Expected: PERMISSION_DENIED)
12. **Payload 12 (Root Document Bypass)**: Attempting to write directly to `/admin_roles` or arbitrary root paths. (Expected: PERMISSION_DENIED)
