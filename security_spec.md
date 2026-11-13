# Collaborative Study Room Firestore Security Specification

## 1. Data Invariants
1. No PII (such as user email, phone number, or home address) is stored in any public/shared study room document. Only displayName and auth UID are stored.
2. Every room requires a verified authenticated creator (`ownerId == request.auth.uid`), valid server timestamps (`request.time`), and strict string/array bounds.
3. Private rooms cannot be listed via queries (`allow list` permits only `visibility == 'public'` or `ownerId == request.auth.uid`) and private `get` requires ownership or an active member document at `/study_rooms/{roomId}/members/{uid}`.
4. Joining a private room requires presenting the matching `inviteCode == room.roomCode` when creating the member document.
5. Regular members cannot promote themselves to `owner` or `moderator`, nor unmute themselves, nor post messages or strokes while muted or when the room is `closed`.
6. Once a room status becomes `closed`, messages, whiteboard strokes, and room edits are locked against further updates.

## 2. Adversarial Payloads Guarded Against
1. Unauthenticated read/write attempt -> Rejected (`isSignedIn()`).
2. Unverified email spoofing -> Rejected (`request.auth.token.email_verified == true`).
3. Oversized ID poisoning (>128 chars or invalid regex) -> Rejected (`isValidId()`).
4. Shadow field injection (`isAdmin: true`) -> Rejected (`hasOnly(...)`).
5. Privilege escalation on join (`role: 'moderator'` or `muted: false` self-promotion) -> Rejected (`role == 'member'`).
6. Cross-user impersonation (`authorId != request.auth.uid`) -> Rejected.
7. Muted participant sending chat message or drawing stroke -> Rejected (`!member.muted`).
8. Drawing on locked whiteboard as regular member -> Rejected (`!room.whiteboardLocked || isRoomModerator`).
9. Private room `allow list` scraping -> Rejected (`resource.data.visibility == 'public' || resource.data.ownerId == request.auth.uid`).
10. Joining private room without valid `inviteCode` -> Rejected (`incoming().inviteCode == room.roomCode`).
11. Modifying immutable fields (`ownerId`, `createdAt`, `roomCode`) after creation -> Rejected.
12. Client-forged timestamps -> Rejected (`request.time`).
