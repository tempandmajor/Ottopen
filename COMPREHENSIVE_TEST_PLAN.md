# 🧪 Comprehensive Test Plan - Ottopen Writing Suite

**Version:** 1.0
**Date:** 2025-10-04
**Application:** Ottopen - AI-Powered Writing Platform
**Live URL:** https://ottopen.app
**Local Test URL:** http://localhost:3000

---

## 📋 Table of Contents

1. [Authentication & User Management](#1-authentication--user-management)
2. [Script/Manuscript Management](#2-scriptmanuscript-management)
3. [Editor & Writing Features](#3-editor--writing-features)
4. [AI-Powered Features (20+)](#4-ai-powered-features-20)
5. [Collaboration Features](#5-collaboration-features)
6. [Research Repository](#6-research-repository)
7. [Export & Download](#7-export--download)
8. [Subscription & Payments](#8-subscription--payments)
9. [Referral System](#9-referral-system)
10. [Social Features](#10-social-features)
11. [Book Clubs](#11-book-clubs)
12. [Admin Features](#12-admin-features)
13. [Security Testing](#13-security-testing)
14. [Performance Testing](#14-performance-testing)

---

## Test Preparation

### Required Test Accounts

Create the following test accounts before starting:

1. **Free User** - test-free@example.com
2. **Pro User** - test-pro@example.com
3. **Studio User** - test-studio@example.com
4. **Admin User** - test-admin@example.com
5. **Collaborator User** - test-collab@example.com

### Test Data Requirements

- Valid Stripe test card: `4242 4242 4242 4242` (any future date, any CVC)
- Test referral codes
- Sample script content (screenplay, documentary, stage play, book)

### Testing Tools

- Browser DevTools (Network, Console)
- Incognito/Private windows for multi-user testing
- Screen recording tool (optional)
- Postman/curl for API testing

---

## 1. Authentication & User Management

### 1.1 Sign Up

**Route:** `/auth/signup`
**API:** `POST /api/auth/signup`

| Test Case        | Steps                                                                                             | Expected Outcome                                                              | Status |
| ---------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| Valid signup     | 1. Navigate to /auth/signup<br>2. Enter valid email, password, display name<br>3. Click "Sign Up" | ✅ Account created<br>✅ Verification email sent<br>✅ Redirect to /dashboard | ☐      |
| Duplicate email  | 1. Sign up with existing email                                                                    | ❌ Error: "Email already registered"                                          | ☐      |
| Weak password    | 1. Enter password < 8 chars                                                                       | ❌ Validation error shown                                                     | ☐      |
| Missing fields   | 1. Leave required fields empty                                                                    | ❌ Form validation errors                                                     | ☐      |
| Email validation | 1. Enter invalid email format                                                                     | ❌ "Invalid email" error                                                      | ☐      |

### 1.2 Sign In

**Route:** `/auth/signin`
**API:** `POST /api/auth/signin`

| Test Case           | Steps                                                 | Expected Outcome                                   | Status |
| ------------------- | ----------------------------------------------------- | -------------------------------------------------- | ------ |
| Valid login         | 1. Enter correct email/password<br>2. Click "Sign In" | ✅ Redirect to /dashboard<br>✅ Session cookie set | ☐      |
| Invalid credentials | 1. Enter wrong password                               | ❌ Error: "Invalid credentials"                    | ☐      |
| Unverified email    | 1. Login with unverified account                      | ⚠️ Prompt to verify email                          | ☐      |
| Rate limiting       | 1. Attempt 6+ failed logins                           | ❌ Rate limit error (5 req/min)                    | ☐      |

### 1.3 Password Reset

**Route:** `/auth/forgot-password`
**API:** `POST /api/auth/reset-password`

| Test Case      | Steps                                                 | Expected Outcome                                | Status |
| -------------- | ----------------------------------------------------- | ----------------------------------------------- | ------ |
| Request reset  | 1. Enter registered email<br>2. Submit form           | ✅ Reset email sent<br>✅ Success message shown | ☐      |
| Unknown email  | 1. Enter non-existent email                           | ✅ Generic success message (security)           | ☐      |
| Complete reset | 1. Click reset link in email<br>2. Enter new password | ✅ Password updated<br>✅ Redirect to login     | ☐      |

### 1.4 Profile Management

**Route:** `/profile/[username]` and `/settings`
**API:** `PATCH /api/user/profile`

| Test Case          | Steps                                                             | Expected Outcome                               | Status |
| ------------------ | ----------------------------------------------------------------- | ---------------------------------------------- | ------ |
| View own profile   | 1. Navigate to /profile/[your-username]                           | ✅ Profile displayed<br>✅ Edit button visible | ☐      |
| View other profile | 1. Navigate to another user's profile                             | ✅ Profile displayed<br>✅ No edit button      | ☐      |
| Update profile     | 1. Go to /settings<br>2. Update bio, avatar, specialty<br>3. Save | ✅ Changes saved<br>✅ Success notification    | ☐      |
| Privacy settings   | 1. Toggle "Private Profile"<br>2. Save                            | ✅ Profile hidden from public                  | ☐      |
| Upload avatar      | 1. Click avatar upload<br>2. Select image                         | ✅ Image uploaded<br>✅ Avatar updated         | ☐      |

---

## 2. Script/Manuscript Management

### 2.1 Create Script

**Route:** `/scripts` → Create New
**API:** `POST /api/scripts`

| Test Case               | Steps                                                                                 | Expected Outcome                           | Status |
| ----------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------ | ------ |
| Create screenplay       | 1. Click "New Script"<br>2. Select "Screenplay"<br>3. Enter title, logline<br>4. Save | ✅ Script created<br>✅ Redirect to editor | ☐      |
| Create documentary      | 1. Select "Documentary" format                                                        | ✅ Documentary template loaded             | ☐      |
| Create stage play       | 1. Select "Stage Play" format                                                         | ✅ Stage play template loaded              | ☐      |
| Create non-fiction book | 1. Select "Non-fiction Book" format                                                   | ✅ Book template loaded                    | ☐      |
| Free tier limit         | 1. (As free user) Create 2nd script                                                   | ❌ Error: "Upgrade to Pro"                 | ☐      |
| Pro tier unlimited      | 1. (As Pro user) Create 5+ scripts                                                    | ✅ All scripts created                     | ☐      |

### 2.2 Edit Script

**Route:** `/editor/[manuscriptId]`
**API:** `PATCH /api/scripts/[scriptId]`

| Test Case      | Steps                                             | Expected Outcome                                     | Status |
| -------------- | ------------------------------------------------- | ---------------------------------------------------- | ------ |
| Update title   | 1. Open script<br>2. Edit title<br>3. Save        | ✅ Title updated in DB<br>✅ Auto-save indicator     | ☐      |
| Update logline | 1. Edit logline field                             | ✅ Logline saved                                     | ☐      |
| Change format  | 1. Click "Convert Format"<br>2. Select new format | ✅ AI conversion initiated<br>✅ Format changed      | ☐      |
| Auto-save      | 1. Type content<br>2. Wait 3 seconds              | ✅ Auto-save triggered<br>✅ "Saved" indicator shown | ☐      |

### 2.3 Delete Script

**API:** `DELETE /api/scripts/[scriptId]`

| Test Case           | Steps                                                  | Expected Outcome                             | Status |
| ------------------- | ------------------------------------------------------ | -------------------------------------------- | ------ |
| Delete own script   | 1. Open script menu<br>2. Click "Delete"<br>3. Confirm | ✅ Script deleted<br>✅ Redirect to /scripts | ☐      |
| Delete confirmation | 1. Click delete<br>2. Click "Cancel"                   | ✅ Script NOT deleted                        | ☐      |
| Delete unauthorized | 1. Try DELETE API with other user's ID                 | ❌ 403 Forbidden                             | ☐      |

### 2.4 Lock/Archive Script

**API:** `POST /api/scripts/[scriptId]/lock`

| Test Case      | Steps                  | Expected Outcome                                 | Status |
| -------------- | ---------------------- | ------------------------------------------------ | ------ |
| Lock script    | 1. Click "Lock Script" | ✅ Script marked locked<br>✅ Read-only mode     | ☐      |
| Unlock script  | 1. Click "Unlock"      | ✅ Script editable again                         | ☐      |
| Archive script | 1. Click "Archive"     | ✅ Moved to archives<br>✅ Hidden from main list | ☐      |

---

## 3. Editor & Writing Features

### 3.1 Script Elements

**Route:** `/editor/[manuscriptId]`
**API:** `POST /api/scripts/[scriptId]/elements`

| Test Case               | Steps                                                        | Expected Outcome                                        | Status |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------- | ------ |
| Add scene heading       | 1. Type "INT. COFFEE SHOP - DAY"<br>2. Press Enter           | ✅ Formatted as scene heading<br>✅ Auto-capitalization | ☐      |
| Add dialogue            | 1. Type character name<br>2. Press Enter<br>3. Type dialogue | ✅ Character centered<br>✅ Dialogue formatted          | ☐      |
| Add action              | 1. Type action description                                   | ✅ Left-aligned<br>✅ Proper margins                    | ☐      |
| Add parenthetical       | 1. Add "(beat)" in dialogue                                  | ✅ Formatted correctly                                  | ☐      |
| Add transition          | 1. Type "CUT TO:"                                            | ✅ Right-aligned                                        | ☐      |
| Character auto-complete | 1. Start typing existing character                           | ✅ Suggestions shown                                    | ☐      |
| Location auto-complete  | 1. Type scene heading                                        | ✅ Previous locations suggested                         | ☐      |

### 3.2 Documentary Elements

| Test Case       | Steps                                                 | Expected Outcome                | Status |
| --------------- | ----------------------------------------------------- | ------------------------------- | ------ |
| Add narration   | 1. Select "Narration" element                         | ✅ Formatted for VO             | ☐      |
| Add interview   | 1. Select "Interview"<br>2. Enter interviewer/subject | ✅ Q&A format                   | ☐      |
| Add B-roll      | 1. Select "B-Roll"<br>2. Describe footage             | ✅ B-roll description formatted | ☐      |
| Add lower third | 1. Select "Lower Third"<br>2. Enter text              | ✅ On-screen text marker        | ☐      |

### 3.3 Book Elements

| Test Case         | Steps                     | Expected Outcome                | Status |
| ----------------- | ------------------------- | ------------------------------- | ------ |
| Add chapter title | 1. Select "Chapter Title" | ✅ Title page formatting        | ☐      |
| Add heading       | 1. Select "Heading 1/2/3" | ✅ Proper heading hierarchy     | ☐      |
| Add block quote   | 1. Select "Block Quote"   | ✅ Indented, different style    | ☐      |
| Add footnote      | 1. Select "Footnote"      | ✅ Numbered footnote added      | ☐      |
| Add citation      | 1. Add inline citation    | ✅ Citation formatted (APA/MLA) | ☐      |

### 3.4 Formatting Tools

| Test Case      | Steps                                         | Expected Outcome           | Status |
| -------------- | --------------------------------------------- | -------------------------- | ------ |
| Bold text      | 1. Select text<br>2. Press Cmd/Ctrl+B         | ✅ Text bolded             | ☐      |
| Italic text    | 1. Select text<br>2. Press Cmd/Ctrl+I         | ✅ Text italicized         | ☐      |
| Undo/Redo      | 1. Make changes<br>2. Press Cmd/Ctrl+Z        | ✅ Changes undone          | ☐      |
| Find & Replace | 1. Cmd/Ctrl+F<br>2. Search term<br>3. Replace | ✅ Text found and replaced | ☐      |

---

## 4. AI-Powered Features (20+)

### 4.1 Screenplay AI

**API:** `POST /api/ai/enhance-dialogue`

| Test Case            | Steps                                                               | Expected Outcome                                               | Status |
| -------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------- | ------ |
| Dialogue Enhancement | 1. Select dialogue<br>2. Click "Enhance Dialogue"<br>3. Wait for AI | ✅ Improved dialogue returned<br>✅ Suggestions shown          | ☐      |
| Beat Generation      | 1. Click "Generate Beats"<br>2. Review 15-beat structure            | ✅ Save the Cat! beats created<br>✅ Act structure defined     | ☐      |
| Structure Analysis   | 1. Click "Analyze Structure"                                        | ✅ 3-act breakdown<br>✅ Plot point identification             | ☐      |
| Script Coverage      | 1. Click "Generate Coverage"                                        | ✅ Professional coverage report<br>✅ Logline, synopsis, notes | ☐      |
| Character Voice      | 1. Select character dialogue<br>2. Click "Check Voice"              | ✅ Consistency analysis<br>✅ Voice suggestions                | ☐      |
| Rate limit (Free)    | 1. (As free user) Make 11th AI request                              | ❌ Error: "Upgrade for more AI"                                | ☐      |
| Rate limit (Pro)     | 1. (As Pro) Make 101st request                                      | ❌ Error: "Monthly limit reached"                              | ☐      |

### 4.2 Documentary AI

**API:** `POST /api/ai/fact-check`

| Test Case            | Steps                                                   | Expected Outcome                                    | Status |
| -------------------- | ------------------------------------------------------- | --------------------------------------------------- | ------ |
| Fact-Checking        | 1. Select claim<br>2. Click "Fact-Check"                | ✅ Confidence score (0-100%)<br>✅ Sources provided | ☐      |
| Interview Questions  | 1. Enter subject/topic<br>2. Click "Generate Questions" | ✅ 10+ story-driven questions                       | ☐      |
| Doc Structure        | 1. Click "Analyze Structure"                            | ✅ 4-act breakdown<br>✅ Emotional arc analysis     | ☐      |
| Research Suggestions | 1. Enter topic<br>2. Click "Suggest Research"           | ✅ Research areas listed                            | ☐      |
| B-Roll Suggestions   | 1. Select scene<br>2. Click "Suggest B-Roll"            | ✅ Visual recommendations                           | ☐      |
| Archive Footage      | 1. Enter era/topic<br>2. Click "Search Archives"        | ✅ Archive search suggestions                       | ☐      |

### 4.3 Non-fiction Book AI

**API:** `POST /api/ai/chapter-outline`

| Test Case          | Steps                                                               | Expected Outcome                                                | Status |
| ------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------- | ------ |
| Chapter Outlines   | 1. Enter thesis<br>2. Click "Generate Outline"                      | ✅ 10+ chapter outline<br>✅ Chapter summaries                  | ☐      |
| Research Assistant | 1. Enter topic<br>2. Click "Research Help"                          | ✅ Questions to explore<br>✅ Source suggestions<br>✅ Keywords | ☐      |
| Book Fact-Checker  | 1. Select claims<br>2. Click "Fact-Check"                           | ✅ Verification results<br>✅ Sources                           | ☐      |
| Citation Manager   | 1. Add source<br>2. Select format (APA/MLA/Chicago)                 | ✅ Properly formatted citation                                  | ☐      |
| Paragraph Enhancer | 1. Select paragraph<br>2. Choose action (clarify/strengthen/expand) | ✅ Enhanced paragraph                                           | ☐      |
| Bibliography       | 1. Click "Generate Bibliography"                                    | ✅ All citations formatted<br>✅ Alphabetized list              | ☐      |

### 4.4 Advanced AI (All Formats)

**API:** `POST /api/ai/table-read`, `/api/ai/writing-room`, etc.

| Test Case           | Steps                                                       | Expected Outcome                                                                          | Status |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------ |
| Table Read          | 1. Select scene<br>2. Click "Table Read"                    | ✅ AI-performed dialogue<br>✅ Multiple character voices                                  | ☐      |
| AI Writing Room     | 1. Click "Writing Room"<br>2. Ask question                  | ✅ 5 perspectives (Producer/Director/Actor/Editor/Cinematographer)<br>✅ Diverse feedback | ☐      |
| Budget Estimation   | 1. Click "Estimate Budget"                                  | ✅ Detailed line-item budget<br>✅ Low/Medium/High ranges                                 | ☐      |
| Casting Suggestions | 1. Enter character description<br>2. Click "Suggest Actors" | ✅ 10+ actor recommendations<br>✅ Reasoning provided                                     | ☐      |
| Marketing Analysis  | 1. Click "Marketing Analysis"                               | ✅ Target audience<br>✅ Comparable titles<br>✅ Positioning strategy                     | ☐      |

### 4.5 Format Conversion AI

**API:** `POST /api/ai/convert-format`

| Test Case                | Steps                                             | Expected Outcome                                 | Status |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------ | ------ |
| Screenplay → Book        | 1. Open screenplay<br>2. Click "Convert to Book"  | ✅ Chapter outline created<br>✅ Prose generated | ☐      |
| Book → Documentary       | 1. Open book<br>2. Click "Convert to Documentary" | ✅ Treatment created<br>✅ Interview questions   | ☐      |
| Screenplay ↔ Stage Play | 1. Convert screenplay to stage play               | ✅ Stage directions added<br>✅ Format adjusted  | ☐      |
| Documentary → Screenplay | 1. Convert doc to screenplay                      | ✅ Narrative structure created                   | ☐      |
| Any → Treatment          | 1. Click "Create Treatment"                       | ✅ 2-5 page treatment<br>✅ Professional format  | ☐      |

---

## 5. Collaboration Features

### 5.1 Share & Invite

**API:** `POST /api/scripts/[scriptId]/collaborators`

| Test Case           | Steps                                                                                            | Expected Outcome                         | Status |
| ------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------- | ------ |
| Add collaborator    | 1. Click "Share"<br>2. Enter email<br>3. Select role (viewer/commenter/editor)<br>4. Send invite | ✅ Invitation sent<br>✅ Email delivered | ☐      |
| Accept invitation   | 1. (As invitee) Click email link<br>2. Accept                                                    | ✅ Added to script<br>✅ Access granted  | ☐      |
| Remove collaborator | 1. Click "Manage Access"<br>2. Remove user                                                       | ✅ User removed<br>✅ Access revoked     | ☐      |
| Change role         | 1. Edit collaborator role<br>2. Save                                                             | ✅ Permissions updated                   | ☐      |
| Free tier limit     | 1. (As free user) Add 2nd collaborator                                                           | ❌ Error: "Upgrade for collaboration"    | ☐      |
| Pro tier limit      | 1. (As Pro) Add 4th collaborator                                                                 | ❌ Error: "Max 3 writers on Pro"         | ☐      |
| Studio unlimited    | 1. (As Studio) Add 10+ collaborators                                                             | ✅ All added successfully                | ☐      |

### 5.2 Real-Time Editing

**WebSocket:** Real-time collaboration

| Test Case           | Steps                                                                      | Expected Outcome                                           | Status |
| ------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------- | ------ |
| Live cursors        | 1. Open script (User A)<br>2. Open same script (User B)<br>3. User B types | ✅ User A sees User B's cursor<br>✅ Live position updates | ☐      |
| Presence indicators | 1. Multiple users online                                                   | ✅ Avatar shown<br>✅ "2 people editing"                   | ☐      |
| Real-time sync      | 1. User A types<br>2. User B views                                         | ✅ Changes appear instantly<br>✅ No conflicts             | ☐      |
| Conflict resolution | 1. Both users edit same line                                               | ✅ Graceful merge<br>✅ No data loss                       | ☐      |
| Leave notification  | 1. User closes tab                                                         | ✅ "User left" message<br>✅ Cursor removed                | ☐      |

### 5.3 Comments & Feedback

**API:** `POST /api/scripts/[scriptId]/comments`

| Test Case             | Steps                                                     | Expected Outcome                                   | Status |
| --------------------- | --------------------------------------------------------- | -------------------------------------------------- | ------ |
| Add comment           | 1. Select text<br>2. Click "Comment"<br>3. Write feedback | ✅ Comment added<br>✅ Highlight shown             | ☐      |
| Reply to comment      | 1. Click comment<br>2. Write reply                        | ✅ Threaded reply                                  | ☐      |
| Resolve comment       | 1. Click "Resolve"                                        | ✅ Comment marked resolved<br>✅ Highlight removed | ☐      |
| Delete comment        | 1. Click "Delete" (own comment)                           | ✅ Comment deleted                                 | ☐      |
| Viewer cannot edit    | 1. (As viewer) Try to type                                | ❌ Read-only mode                                  | ☐      |
| Commenter can comment | 1. (As commenter) Add comment                             | ✅ Comment added<br>❌ Cannot edit text            | ☐      |

---

## 6. Research Repository

### 6.1 Research Notes

**Route:** `/dashboard` → Research tab
**API:** `POST /api/research`, `GET /api/research`

| Test Case             | Steps                                                              | Expected Outcome                            | Status |
| --------------------- | ------------------------------------------------------------------ | ------------------------------------------- | ------ |
| Create note           | 1. Click "New Research Note"<br>2. Enter title, content<br>3. Save | ✅ Note created<br>✅ Shown in list         | ☐      |
| Add tags              | 1. Enter tags (comma-separated)                                    | ✅ Tags saved<br>✅ Searchable              | ☐      |
| Select source type    | 1. Choose type (book/article/website/interview/video/other)        | ✅ Type saved                               | ☐      |
| Link to script        | 1. Click "Link to Script"<br>2. Select script                      | ✅ Note linked<br>✅ Accessible from script | ☐      |
| Unlink from script    | 1. Click "Unlink"<br>2. Confirm                                    | ✅ Link removed<br>✅ Note preserved        | ☐      |
| Search notes          | 1. Use search bar<br>2. Enter keyword                              | ✅ Matching notes shown                     | ☐      |
| Filter by tag         | 1. Click tag                                                       | ✅ Filtered results                         | ☐      |
| Filter by source type | 1. Select type filter                                              | ✅ Filtered by type                         | ☐      |

### 6.2 Research Authorization

**Security Test:** `PUT /api/research/[noteId]`

| Test Case                | Steps                                 | Expected Outcome | Status |
| ------------------------ | ------------------------------------- | ---------------- | ------ |
| Edit own note            | 1. Update note content<br>2. Save     | ✅ Note updated  | ☐      |
| Edit other user's note   | 1. (User B) Try PUT to User A's note  | ❌ 403 Forbidden | ☐      |
| Delete own note          | 1. Click "Delete"<br>2. Confirm       | ✅ Note deleted  | ☐      |
| Delete other user's note | 1. (User B) Try DELETE User A's note  | ❌ 403 Forbidden | ☐      |
| Link to unowned script   | 1. Try to link note to other's script | ❌ 403 Forbidden | ☐      |

### 6.3 Cross-Project Linking

**API:** `POST /api/research/[noteId]/link`

| Test Case                | Steps                                                     | Expected Outcome                                   | Status |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------- | ------ |
| Link to multiple scripts | 1. Link note to Script A<br>2. Link same note to Script B | ✅ Note appears in both                            | ☐      |
| View linked notes        | 1. Open script<br>2. View research panel                  | ✅ All linked notes shown                          | ☐      |
| Unlink from one script   | 1. Unlink from Script A                                   | ✅ Still linked to Script B<br>✅ Note not deleted | ☐      |

---

## 7. Export & Download

### 7.1 PDF Export

**API:** `GET /api/scripts/[scriptId]/export?format=pdf`

| Test Case             | Steps                                           | Expected Outcome                                                               | Status |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ | ------ |
| Export screenplay PDF | 1. Open screenplay<br>2. Click "Export" → "PDF" | ✅ PDF downloaded<br>✅ Industry-standard formatting<br>✅ Title page included | ☐      |
| Export with watermark | 1. Enable watermark<br>2. Export PDF            | ✅ Watermark on every page                                                     | ☐      |
| Page numbering        | 1. Export screenplay                            | ✅ Page numbers correct<br>✅ Title page not numbered                          | ☐      |
| Scene numbering       | 1. Enable scene numbers<br>2. Export            | ✅ Scene numbers shown                                                         | ☐      |

### 7.2 Word Export

**API:** `GET /api/scripts/[scriptId]/export?format=docx`

| Test Case            | Steps                      | expected Outcome                                           | Status |
| -------------------- | -------------------------- | ---------------------------------------------------------- | ------ |
| Export to Word       | 1. Click "Export" → "Word" | ✅ .docx file downloaded<br>✅ Editable in MS Word         | ☐      |
| Formatting preserved | 1. Open in Word            | ✅ Fonts correct<br>✅ Margins correct<br>✅ Styles intact | ☐      |

### 7.3 EPUB Export (Books Only)

**API:** `GET /api/scripts/[scriptId]/export?format=epub`

| Test Case                | Steps                                      | Expected Outcome                                     | Status |
| ------------------------ | ------------------------------------------ | ---------------------------------------------------- | ------ |
| Export book to EPUB      | 1. Open book<br>2. Click "Export" → "EPUB" | ✅ .epub file downloaded<br>✅ Readable in e-readers | ☐      |
| EPUB metadata            | 1. Check file properties                   | ✅ Title, author set<br>✅ Table of contents         | ☐      |
| Screenplay EPUB disabled | 1. Try to export screenplay as EPUB        | ❌ Option not available                              | ☐      |

### 7.4 Final Draft Export

**API:** `GET /api/scripts/[scriptId]/export?format=fdx`

| Test Case             | Steps                             | Expected Outcome                                | Status |
| --------------------- | --------------------------------- | ----------------------------------------------- | ------ |
| Export to FDX         | 1. Click "Export" → "Final Draft" | ✅ .fdx file downloaded                         | ☐      |
| Import to Final Draft | 1. Open .fdx in Final Draft       | ✅ Opens correctly<br>✅ All elements preserved | ☐      |

### 7.5 Fountain Export

**API:** `GET /api/scripts/[scriptId]/export?format=fountain`

| Test Case          | Steps                          | Expected Outcome                                           | Status |
| ------------------ | ------------------------------ | ---------------------------------------------------------- | ------ |
| Export to Fountain | 1. Click "Export" → "Fountain" | ✅ .fountain file downloaded<br>✅ Plain text format       | ☐      |
| Fountain syntax    | 1. Open in text editor         | ✅ Valid Fountain syntax<br>✅ Compatible with other tools | ☐      |

### 7.6 Plain Text Export

| Test Case     | Steps                            | Expected Outcome                                   | Status |
| ------------- | -------------------------------- | -------------------------------------------------- | ------ |
| Export to TXT | 1. Click "Export" → "Plain Text" | ✅ .txt file downloaded<br>✅ All content included | ☐      |

### 7.7 Export Permissions

| Test Case            | Steps                                | Expected Outcome                      | Status |
| -------------------- | ------------------------------------ | ------------------------------------- | ------ |
| Free tier PDF only   | 1. (As free user) Try non-PDF export | ❌ "Upgrade to Pro" message           | ☐      |
| Pro tier all formats | 1. (As Pro) Export all 6 formats     | ✅ All formats available              | ☐      |
| Collaborator export  | 1. (As collaborator) Try export      | ✅ Can export (if permission granted) | ☐      |

---

## 8. Subscription & Payments

### 8.1 Subscription Management

**Route:** `/settings` → Billing
**API:** `POST /api/checkout`, `POST /api/create-portal-session`

| Test Case               | Steps                                                                                         | Expected Outcome                                                                    | Status |
| ----------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------ |
| View plans              | 1. Click "Upgrade"                                                                            | ✅ Free, Pro, Studio plans shown<br>✅ Features listed<br>✅ Prices: $0, $20, $50   | ☐      |
| Upgrade to Pro          | 1. Click "Upgrade to Pro"<br>2. Enter test card `4242 4242 4242 4242`<br>3. Complete checkout | ✅ Redirect to Stripe Checkout<br>✅ Payment processed<br>✅ Subscription activated | ☐      |
| Upgrade to Studio       | 1. Upgrade to Studio tier                                                                     | ✅ $50/month subscription<br>✅ Unlimited features                                  | ☐      |
| View billing portal     | 1. Click "Manage Billing"                                                                     | ✅ Stripe portal opens<br>✅ Can update card, view invoices                         | ☐      |
| Cancel subscription     | 1. In billing portal, click "Cancel"<br>2. Confirm                                            | ✅ Subscription cancelled<br>✅ Access until period end                             | ☐      |
| Reactivate subscription | 1. Click "Reactivate" before period ends                                                      | ✅ Subscription continues                                                           | ☐      |

### 8.2 Subscription Features

| Test Case                | Steps                          | Expected Outcome                     | Status |
| ------------------------ | ------------------------------ | ------------------------------------ | ------ |
| Free: Script limit       | 1. (As free) Create 2nd script | ❌ "Upgrade required"                | ☐      |
| Free: AI limit           | 1. Make 11th AI request        | ❌ "10/month limit reached"          | ☐      |
| Free: Export limit       | 1. Try EPUB export             | ❌ PDF only                          | ☐      |
| Free: No collaboration   | 1. Try to add collaborator     | ❌ "Upgrade for collaboration"       | ☐      |
| Pro: Unlimited scripts   | 1. Create 10+ scripts          | ✅ All created                       | ☐      |
| Pro: 100 AI requests     | 1. Make 100 AI requests        | ✅ All processed<br>❌ 101st blocked | ☐      |
| Pro: 3 collaborators     | 1. Add 3 users                 | ✅ All added<br>❌ 4th blocked       | ☐      |
| Pro: All exports         | 1. Export all 6 formats        | ✅ All available                     | ☐      |
| Studio: Unlimited AI     | 1. Make 200+ AI requests       | ✅ No limit                          | ☐      |
| Studio: Unlimited collab | 1. Add 10+ users               | ✅ All added                         | ☐      |

### 8.3 Payment Edge Cases

| Test Case            | Steps                                  | Expected Outcome                                                     | Status |
| -------------------- | -------------------------------------- | -------------------------------------------------------------------- | ------ |
| Declined card        | 1. Use test card `4000 0000 0000 0002` | ❌ Payment declined error<br>✅ No subscription created              | ☐      |
| Expired subscription | 1. Wait for subscription to expire     | ✅ Downgraded to Free<br>✅ Scripts remain (read-only if over limit) | ☐      |
| Failed renewal       | 1. Simulate card failure               | ✅ Email notification sent<br>✅ Grace period applied                | ☐      |

---

## 9. Referral System

### 9.1 Referral Links

**Route:** `/referrals`
**API:** `GET /api/referrals/link`, `POST /api/referrals/track`

| Test Case               | Steps                                                             | Expected Outcome                                                         | Status |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| View referral dashboard | 1. Navigate to /referrals                                         | ✅ Referral link shown<br>✅ Earnings displayed<br>✅ Statistics visible | ☐      |
| Copy referral link      | 1. Click "Copy Link"                                              | ✅ Link copied to clipboard<br>✅ Format: `ottopen.app?ref=USER123`      | ☐      |
| Track referral click    | 1. Open referral link in incognito<br>2. Check dashboard          | ✅ Click tracked<br>✅ Count incremented                                 | ☐      |
| Referral signup         | 1. User B signs up via User A's link<br>2. User B upgrades to Pro | ✅ User A earns $5<br>✅ Shown in dashboard                              | ☐      |
| Referral payout         | 1. Earn $50+<br>2. Request payout                                 | ✅ Payout requested<br>✅ Status: "Processing"                           | ☐      |

### 9.2 Referral Earnings

**API:** `GET /api/referrals/balance`, `POST /api/referrals/payout`

| Test Case          | Steps                                   | Expected Outcome                                                    | Status |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------- | ------ |
| View balance       | 1. Check /referrals dashboard           | ✅ Total earned shown<br>✅ Available balance<br>✅ Pending balance | ☐      |
| Earnings breakdown | 1. View referrals list                  | ✅ Each referral shown<br>✅ Status (pending/confirmed/paid)        | ☐      |
| Minimum payout     | 1. Request payout with $49 balance      | ❌ Error: "$50 minimum required"                                    | ☐      |
| Request payout     | 1. Request payout with $50+             | ✅ Payout initiated<br>✅ Email sent<br>✅ Status updated           | ☐      |
| Payout methods     | 1. Select payout method (PayPal/Stripe) | ✅ Method saved<br>✅ Payout processed                              | ☐      |

### 9.3 Referral Security

**API:** `POST /api/referrals/confirm`

| Test Case                | Steps                                          | Expected Outcome         | Status |
| ------------------------ | ---------------------------------------------- | ------------------------ | ------ |
| Webhook authentication   | 1. Call confirm endpoint without secret        | ❌ 401 Unauthorized      | ☐      |
| Webhook with secret      | 1. Call with correct `INTERNAL_WEBHOOK_SECRET` | ✅ Referral confirmed    | ☐      |
| Self-referral prevention | 1. Sign up with own referral link              | ❌ Referral not credited | ☐      |

---

## 10. Social Features

### 10.1 Feed & Posts

**Route:** `/feed`
**API:** `GET /api/posts`, `POST /api/posts`

| Test Case          | Steps                                                                   | Expected Outcome                                                       | Status |
| ------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------ |
| View feed          | 1. Navigate to /feed                                                    | ✅ Posts from followed users<br>✅ Newest first<br>✅ Pagination works | ☐      |
| Create post        | 1. Click "New Post"<br>2. Write content<br>3. Select mood<br>4. Publish | ✅ Post created<br>✅ Appears in feed                                  | ☐      |
| Add image to post  | 1. Upload image<br>2. Publish                                           | ✅ Image shown in post                                                 | ☐      |
| Like post          | 1. Click heart icon                                                     | ✅ Like added<br>✅ Count incremented                                  | ☐      |
| Unlike post        | 1. Click heart again                                                    | ✅ Like removed                                                        | ☐      |
| Comment on post    | 1. Write comment<br>2. Submit                                           | ✅ Comment added<br>✅ Count updated                                   | ☐      |
| Delete own post    | 1. Click "Delete"<br>2. Confirm                                         | ✅ Post deleted                                                        | ☐      |
| Delete own comment | 1. Click "Delete" on comment                                            | ✅ Comment removed                                                     | ☐      |

### 10.2 Post Reporting

**API:** `POST /api/posts/[postId]/report`

| Test Case        | Steps                                                                                           | Expected Outcome                        | Status |
| ---------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------- | ------ |
| Report post      | 1. Click "Report"<br>2. Select reason (spam/harassment/etc.)<br>3. Add description<br>4. Submit | ✅ Report created<br>✅ Success message | ☐      |
| Duplicate report | 1. Report same post twice                                                                       | ❌ Error: "Already reported"            | ☐      |
| Invalid reason   | 1. Submit with invalid reason                                                                   | ❌ Validation error                     | ☐      |

### 10.3 Authors & Discovery

**Route:** `/authors`
**API:** `GET /api/users/discover`

| Test Case           | Steps                        | Expected Outcome                                 | Status |
| ------------------- | ---------------------------- | ------------------------------------------------ | ------ |
| Browse authors      | 1. Navigate to /authors      | ✅ List of writers shown<br>✅ Filters available | ☐      |
| Filter by specialty | 1. Select "Screenwriter"     | ✅ Filtered results                              | ☐      |
| Follow author       | 1. Click "Follow" on profile | ✅ Now following<br>✅ Posts appear in feed      | ☐      |
| Unfollow author     | 1. Click "Unfollow"          | ✅ No longer following                           | ☐      |
| View follower count | 1. Check profile             | ✅ Follower/following count shown                | ☐      |

---

## 11. Book Clubs

### 11.1 Browse & Join Clubs

**Route:** `/clubs`
**API:** `GET /api/book-clubs`, `POST /api/book-clubs/[clubId]/join`

| Test Case         | Steps                                                           | Expected Outcome                                            | Status |
| ----------------- | --------------------------------------------------------------- | ----------------------------------------------------------- | ------ |
| Browse clubs      | 1. Navigate to /clubs                                           | ✅ List of clubs shown<br>✅ Member count visible           | ☐      |
| View club details | 1. Click on club                                                | ✅ Description, schedule shown<br>✅ Current book displayed | ☐      |
| Join club         | 1. Click "Join Club"                                            | ✅ Joined successfully<br>✅ Member count +1                | ☐      |
| Leave club        | 1. Click "Leave Club"<br>2. Confirm                             | ✅ Left club<br>✅ Member count -1                          | ☐      |
| Create club       | 1. Click "Create Club"<br>2. Enter name, description<br>3. Save | ✅ Club created<br>✅ User is admin                         | ☐      |

### 11.2 Discussions

**API:** `GET /api/book-clubs/[clubId]/discussions`, `POST /api/book-clubs/[clubId]/discussions`

| Test Case                 | Steps                                                           | Expected Outcome                                          | Status |
| ------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| View discussions          | 1. Open club<br>2. Go to discussions                            | ✅ List of discussion threads                             | ☐      |
| Create discussion         | 1. Click "New Discussion"<br>2. Enter title, content<br>3. Post | ✅ Discussion created<br>✅ Notifications sent to members | ☐      |
| Reply to discussion       | 1. Open discussion<br>2. Write reply<br>3. Post                 | ✅ Reply added<br>✅ Reply count updated                  | ☐      |
| Link script to discussion | 1. Add script_id to discussion                                  | ✅ Script linked<br>✅ Visible to members                 | ☐      |
| Non-member access         | 1. (Not a member) Try to view private club                      | ❌ 403 Forbidden                                          | ☐      |

---

## 12. Admin Features

### 12.1 Admin Dashboard

**Route:** `/admin` (requires admin role)
**API:** `GET /api/admin/stats`

| Test Case           | Steps                                   | Expected Outcome                                                    | Status |
| ------------------- | --------------------------------------- | ------------------------------------------------------------------- | ------ |
| Access as admin     | 1. (As admin) Navigate to /admin        | ✅ Dashboard displayed                                              | ☐      |
| Access as non-admin | 1. (As regular user) Navigate to /admin | ❌ 403 Forbidden or redirect                                        | ☐      |
| View statistics     | 1. Check dashboard                      | ✅ User count<br>✅ Script count<br>✅ Revenue stats<br>✅ AI usage | ☐      |

### 12.2 User Management

**API:** `PATCH /api/admin/users/[userId]`, `DELETE /api/admin/users/[userId]`

| Test Case         | Steps                                  | Expected Outcome                   | Status |
| ----------------- | -------------------------------------- | ---------------------------------- | ------ |
| View all users    | 1. Go to admin users page              | ✅ List of all users               | ☐      |
| Ban user          | 1. Click "Ban" on user<br>2. Confirm   | ✅ User banned<br>✅ Cannot log in | ☐      |
| Unban user        | 1. Click "Unban"                       | ✅ User restored                   | ☐      |
| Grant Pro access  | 1. Manually upgrade user to Pro        | ✅ User has Pro features           | ☐      |
| View user scripts | 1. Click user<br>2. View their scripts | ✅ All scripts shown               | ☐      |

### 12.3 Content Moderation

**API:** `GET /api/admin/reports`, `PATCH /api/posts/[postId]`

| Test Case      | Steps                                | Expected Outcome                                       | Status |
| -------------- | ------------------------------------ | ------------------------------------------------------ | ------ |
| View reports   | 1. Go to reports page                | ✅ All post reports shown<br>✅ Status, reason visible | ☐      |
| Review report  | 1. Click report<br>2. View post      | ✅ Post content shown<br>✅ Reporter info visible      | ☐      |
| Take action    | 1. Click "Remove Post"<br>2. Confirm | ✅ Post deleted<br>✅ Report closed                    | ☐      |
| Dismiss report | 1. Click "Dismiss"                   | ✅ Report closed<br>✅ Post remains                    | ☐      |

### 12.4 Analytics

**API:** `POST /api/update-stats`

| Test Case           | Steps                                   | Expected Outcome                              | Status |
| ------------------- | --------------------------------------- | --------------------------------------------- | ------ |
| Update statistics   | 1. Click "Refresh Stats"                | ✅ Stats recalculated<br>✅ Dashboard updated | ☐      |
| Unauthorized access | 1. (As non-admin) Call update-stats API | ❌ 401 Unauthorized                           | ☐      |

---

## 13. Security Testing

### 13.1 Authentication Security

| Test Case           | Steps                                                             | Expected Outcome                              | Status |
| ------------------- | ----------------------------------------------------------------- | --------------------------------------------- | ------ |
| Session timeout     | 1. Log in<br>2. Wait 24 hours<br>3. Try to access protected route | ❌ Redirect to login                          | ☐      |
| Logout              | 1. Click "Logout"                                                 | ✅ Session cleared<br>✅ Redirect to homepage | ☐      |
| Concurrent sessions | 1. Log in on 2 devices                                            | ✅ Both sessions valid                        | ☐      |

### 13.2 Authorization Security

| Test Case                  | Steps                                           | Expected Outcome | Status |
| -------------------------- | ----------------------------------------------- | ---------------- | ------ |
| Access other user's script | 1. Try to open `/editor/[other-user-script-id]` | ❌ 403 Forbidden | ☐      |
| Edit other user's script   | 1. Try `PATCH /api/scripts/[other-user-id]`     | ❌ 403 Forbidden | ☐      |
| Delete other user's script | 1. Try `DELETE /api/scripts/[other-user-id]`    | ❌ 403 Forbidden | ☐      |
| Access other's research    | 1. Try `PUT /api/research/[other-user-note]`    | ❌ 403 Forbidden | ☐      |
| Link to unowned script     | 1. Try to link note to script you don't own     | ❌ 403 Forbidden | ☐      |

### 13.3 Rate Limiting

| Test Case           | Steps                                 | Expected Outcome              | Status |
| ------------------- | ------------------------------------- | ----------------------------- | ------ |
| AI rate limit       | 1. Make 11 requests in 1 minute       | ❌ Rate limit error (10/min)  | ☐      |
| Auth rate limit     | 1. Attempt 6 logins in 1 minute       | ❌ Rate limit error (5/min)   | ☐      |
| API rate limit      | 1. Make 101 API calls in 1 minute     | ❌ Rate limit error (100/min) | ☐      |
| Referral rate limit | 1. Make 21 referral requests in 5 min | ❌ Rate limit error (20/5min) | ☐      |

### 13.4 Input Validation

| Test Case               | Steps                                             | Expected Outcome                   | Status |
| ----------------------- | ------------------------------------------------- | ---------------------------------- | ------ |
| XSS prevention          | 1. Submit `<script>alert('XSS')</script>` in post | ✅ Sanitized, no execution         | ☐      |
| SQL injection           | 1. Submit `'; DROP TABLE users; --` in search     | ✅ Treated as string, no DB impact | ☐      |
| Invalid UUID            | 1. Call API with malformed UUID                   | ❌ 400 Bad Request                 | ☐      |
| Missing required fields | 1. Submit form without required data              | ❌ Validation errors shown         | ☐      |
| Max length validation   | 1. Submit 10,001 char content (max 10,000)        | ❌ Validation error                | ☐      |

---

## 14. Performance Testing

### 14.1 Page Load Performance

| Test Case      | Metric              | Target  | Actual   | Status |
| -------------- | ------------------- | ------- | -------- | ------ |
| Homepage load  | Time to Interactive | < 2s    | \_\_\_s  | ☐      |
| Editor load    | Time to Interactive | < 3s    | \_\_\_s  | ☐      |
| Feed load      | Time to Interactive | < 2s    | \_\_\_s  | ☐      |
| Search results | Time to First Byte  | < 500ms | \_\_\_ms | ☐      |

### 14.2 API Performance

| Test Case         | Metric        | Target  | Actual   | Status |
| ----------------- | ------------- | ------- | -------- | ------ |
| GET /api/scripts  | Response time | < 200ms | \_\_\_ms | ☐      |
| POST /api/scripts | Response time | < 500ms | \_\_\_ms | ☐      |
| AI requests       | Response time | < 10s   | \_\_\_s  | ☐      |
| Export PDF        | Response time | < 5s    | \_\_\_s  | ☐      |

### 14.3 Real-Time Features

| Test Case           | Metric | Target  | Actual   | Status |
| ------------------- | ------ | ------- | -------- | ------ |
| Cursor sync latency | Delay  | < 100ms | \_\_\_ms | ☐      |
| Text sync latency   | Delay  | < 200ms | \_\_\_ms | ☐      |
| Presence update     | Delay  | < 500ms | \_\_\_ms | ☐      |

### 14.4 Load Testing

| Test Case                | Steps                               | Expected Outcome                          | Status |
| ------------------------ | ----------------------------------- | ----------------------------------------- | ------ |
| 10 concurrent users      | 1. Open 10 editor instances         | ✅ All responsive<br>✅ No crashes        | ☐      |
| 100 concurrent API calls | 1. Send 100 requests simultaneously | ✅ All processed<br>✅ No timeouts        | ☐      |
| Large script (500 pages) | 1. Open 500-page script             | ✅ Loads within 5s<br>✅ Scrolling smooth | ☐      |

---

## Test Execution Tracking

### Test Summary

| Category          | Total Tests | Passed | Failed | Blocked | Not Tested |
| ----------------- | ----------- | ------ | ------ | ------- | ---------- |
| Authentication    | 18          | 0      | 0      | 0       | 18         |
| Script Management | 15          | 0      | 0      | 0       | 15         |
| Editor Features   | 25          | 0      | 0      | 0       | 25         |
| AI Features       | 32          | 0      | 0      | 0       | 32         |
| Collaboration     | 14          | 0      | 0      | 0       | 14         |
| Research          | 13          | 0      | 0      | 0       | 13         |
| Export            | 15          | 0      | 0      | 0       | 15         |
| Payments          | 18          | 0      | 0      | 0       | 18         |
| Referrals         | 11          | 0      | 0      | 0       | 11         |
| Social            | 14          | 0      | 0      | 0       | 14         |
| Book Clubs        | 9           | 0      | 0      | 0       | 9          |
| Admin             | 11          | 0      | 0      | 0       | 11         |
| Security          | 18          | 0      | 0      | 0       | 18         |
| Performance       | 12          | 0      | 0      | 0       | 12         |
| **TOTAL**         | **225**     | **0**  | **0**  | **0**   | **225**    |

---

## Critical Path Tests (Must Pass Before Production)

These are the absolute minimum tests that MUST pass:

1. ✅ **User can sign up and verify email**
2. ✅ **User can log in and access dashboard**
3. ✅ **User can create a screenplay**
4. ✅ **User can write and format script elements**
5. ✅ **User can use at least one AI feature**
6. ✅ **User can export to PDF**
7. ✅ **User can upgrade to Pro subscription**
8. ✅ **User can add a collaborator (Pro)**
9. ✅ **Real-time collaboration works**
10. ✅ **Research notes can be created and linked**
11. ✅ **Authorization prevents access to other users' data**
12. ✅ **Rate limiting prevents abuse**

---

## Bug Reporting Template

When you find a bug, use this template:

```
**Bug ID:** BUG-001
**Severity:** Critical / High / Medium / Low
**Component:** [e.g., Editor, AI, Payments]
**Test Case:** [Reference from this document]

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshot/Video:**
[If applicable]

**Browser/Device:**
[e.g., Chrome 120, macOS 14]

**Console Errors:**
[Any error messages]
```

---

## Test Environment Checklist

Before starting testing, ensure:

- [ ] Local dev server running (`npm run dev`)
- [ ] Database migrations applied
- [ ] Environment variables set (.env.local)
- [ ] Stripe test mode enabled
- [ ] 5 test accounts created (free, pro, studio, admin, collaborator)
- [ ] Test data populated (sample scripts, posts, clubs)
- [ ] Browser DevTools open
- [ ] Network monitoring enabled
- [ ] Test plan printed/accessible

---

## Notes

- **Test Execution:** Execute tests in order within each category
- **Dependencies:** Some tests require previous tests to pass (e.g., can't test collaboration without creating scripts)
- **Data Isolation:** Use separate test accounts to avoid conflicts
- **Cleanup:** Delete test data after each major section to start fresh
- **Report Issues:** Document any bugs immediately using the template above

**Good luck with testing! 🚀**
