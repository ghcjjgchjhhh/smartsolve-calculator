# Collaborative Study Room & Cloud Sync Firestore Security Specification

## 1. Data Invariants
1. No PII (such as user email, phone number, or home address) is stored in any public/shared study room, quiz battle, or workspace sync document. Only `displayName` and auth `uid` are stored.
2. Every room, quiz battle, and user workspace requires a verified authenticated user (`isSignedIn()` checking `request.auth.token.email_verified == true`), server timestamps (`request.time`), and strict string/list bounds.
3. Private rooms cannot be listed via queries (`allow list` permits only `visibility == 'public'` or `ownerId == request.auth.uid`) and private `get` requires ownership or an active member document at `/study_rooms/{roomId}/members/{uid}`.
4. Joining a private room requires presenting the matching `inviteCode == room.roomCode` when creating the member document.
5. Regular members cannot promote themselves to `owner` or `moderator`, nor unmute themselves, nor post messages, strokes, or quiz battles while muted or when the room is `closed`.
6. Once a room status becomes `closed`, messages, whiteboard strokes, quiz battles, and room edits are locked against further updates.
7. Quiz battles can only be launched and closed by the room owner or moderator, and each participant can submit only their own keyed submission (`/submissions/{uid}` matching `request.auth.uid`).
8. User Workspace Cloud Sync documents (`/user_workspaces/{userId}`) are strictly private per authenticated owner (`userId == request.auth.uid`), with `allow list: if false` preventing any cross-user enumeration.

## 2. Adversarial Payloads Guarded Against
1. Unauthenticated read/write attempt -> Rejected (`isSignedIn()`).
2. Unverified email spoofing -> Rejected (`request.auth.token.email_verified == true`).
3. Oversized ID poisoning (>128 chars or invalid regex) -> Rejected (`isValidId()`).
4. Shadow field injection (`isAdmin: true`) -> Rejected (`hasOnly(...)` / `affectedKeys().hasOnly(...)`).
5. Privilege escalation on join (`role: 'moderator'` or `muted: false` self-promotion) -> Rejected (`role == 'member'`).
6. Cross-user impersonation (`authorId != request.auth.uid` or `ownerId != request.auth.uid`) -> Rejected.
7. Muted participant sending chat message or drawing stroke -> Rejected (`!member.muted`).
8. Drawing on locked whiteboard as regular member -> Rejected (`!room.whiteboardLocked || isRoomModerator`).
9. Private room `allow list` scraping -> Rejected (`resource.data.visibility == 'public' || resource.data.ownerId == request.auth.uid`).
10. Cross-user workspace scraping -> Rejected (`allow list: if false` and `userId == request.auth.uid`).
11. Modifying immutable fields (`ownerId`, `createdAt`, `roomCode`, `questions`) after creation -> Rejected.
12. Client-forged timestamps or oversized lists/arrays -> Rejected (`request.time`, strict `.size()` bounds).
