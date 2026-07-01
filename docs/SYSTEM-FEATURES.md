# Memora — System Features

A living reference of every completed feature: what it does, where the code lives, and any required configuration.

---

## Authentication

**Status:** Complete  
**Feature folder:** `src/features/auth/`

### What it covers

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email + password sign-in with redirect-to-origin support |
| Register | `/register` | Email + password + full name sign-up with email confirmation |
| Forgot Password | `/forgot-password` | Sends a Supabase password-reset email |
| Reset Password | `/reset-password` | Sets a new password after arriving via recovery link |

### Auth flow

```
Sign in
  User → /login → LoginPage → authService.signIn()
    → supabase.auth.signInWithPassword()
    → onAuthStateChange(SIGNED_IN) fires → AuthProvider sets user/session
    → navigate to /dashboard (or the originally-requested route)

Register
  User → /register → RegisterPage → authService.signUp()
    → supabase.auth.signUp()
    → if email confirmation ENABLED → redirect to /login with emailConfirmationSent banner
    → if email confirmation DISABLED → onAuthStateChange(SIGNED_IN) → navigate to /dashboard

Forgot password
  User → /forgot-password → ForgotPasswordPage → authService.resetPasswordForEmail()
    → supabase.auth.resetPasswordForEmail(email, { redirectTo: /reset-password })
    → Supabase emails the user a link containing an access_token hash
    → UI shows success state with the target email address

Reset password
  User clicks email link → browser loads /reset-password#access_token=...&type=recovery
    → Supabase SDK (detectSessionInUrl: true) fires onAuthStateChange(PASSWORD_RECOVERY)
    → AuthProvider sets isRecoveryMode = true
    → AuthLayout skips the "authenticated → /dashboard" redirect
    → ResetPasswordPage shows form (guarded by isRecoveryMode check)
    → User submits → authService.updatePassword()
    → supabase.auth.updateUser({ password })
    → onAuthStateChange(USER_UPDATED) → isRecoveryMode = false
    → navigate to /login

Sign out
  useAuth().signOut() → supabase.auth.signOut()
    → onAuthStateChange(SIGNED_OUT) → AuthProvider clears user/session, queryClient clears
    → AuthLayout redirects to /login
```

### Session persistence

Sessions are stored in `localStorage` automatically by `@supabase/supabase-js` (`persistSession: true`).  
`autoRefreshToken: true` keeps the session alive silently in the background.  
On page refresh, `AuthProvider` calls `supabase.auth.getSession()` to restore the session before rendering any protected route.

### Protected routes

`ProtectedRoute` wraps all app routes. While `isLoading` is true it renders `<PageLoader />`, preventing flash-of-unauthenticated-content. Unauthenticated users are redirected to `/login` with `state.from` preserving the originally requested path.

### File map

```
src/features/auth/
  services/
    auth.service.ts          # All Supabase auth calls + error mapping
  hooks/
    useLogin.ts              # useMutation → signIn → navigate
    useRegister.ts           # useMutation → signUp → navigate
    useForgotPassword.ts     # useMutation → resetPasswordForEmail
    useResetPassword.ts      # useMutation → updatePassword → navigate
  components/
    PasswordInput.tsx        # Input with eye-toggle for show/hide password
  schemas/
    auth.schemas.ts          # Zod schemas + inferred TypeScript types
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    ForgotPasswordPage.tsx
    ResetPasswordPage.tsx

src/providers/
  AuthProvider.tsx           # AuthContext: user, session, isLoading, isAuthenticated, isRecoveryMode, signOut

src/components/
  layouts/AuthLayout.tsx     # Centered card shell; redirects authenticated users (unless isRecoveryMode)
  common/ProtectedRoute.tsx  # Redirects unauthenticated users to /login

src/hooks/
  useAuth.ts                 # Typed hook to consume AuthContext
```

### Required environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Both values are available in your Supabase project dashboard under **Settings → API**.

### Required Supabase configuration

1. **Authentication providers** — Email/Password must be enabled (Dashboard → Authentication → Providers).
2. **Email templates** — Customize the password reset email under Authentication → Email Templates → Reset Password. The default template works out of the box.
3. **Redirect URLs** — Add your site URL (e.g. `http://localhost:5173`) to the allowed Redirect URLs list (Authentication → URL Configuration) so the recovery link is accepted.
4. **Profiles table** (optional but recommended) — Create a `profiles` table with RLS enabled to store `full_name` and other user metadata.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on sign-up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## Upload Meeting

**Status:** Complete  
**Feature folder:** `src/features/meetings/`

### What it covers

- Drag-and-drop or click-to-browse file picker
- Accepts MP3, WAV, M4A (audio) and TXT (transcript)
- Client-side file validation (type + 500 MB size limit)
- Real-time upload progress bar (via Supabase `onUploadProgress`)
- Creates a `meetings` row before upload (status: `uploading`), updates to `pending` on success
- Success state with link to the new meeting detail page

### Upload flow

```
User fills title + selects file → submit
  → meetingsService.createMeeting() → inserts row (status: uploading)
  → meetingsService.uploadRecording() → uploads to meeting-recordings/{userId}/{meetingId}.{ext}
      → onUploadProgress fires → progress state updates → UploadProgress bar renders
  → meetingsService.updateMeeting() → sets status: pending, file_path
  → success state shown with "View meeting" link
```

### File map

```
src/features/meetings/
  services/
    meetings.service.ts        # createMeeting, updateMeeting, uploadRecording
  hooks/
    useUploadMeeting.ts        # upload state machine (idle|uploading|success|error) + progress
  components/
    FileDropzone.tsx           # drag-and-drop zone with validation and file preview
    UploadProgress.tsx         # accessible progress bar
  pages/
    NewMeetingPage.tsx         # form: title, description, FileDropzone, UploadProgress, success state
```

### Storage

Files are stored in the `meeting-recordings` bucket under `{userId}/{meetingId}.{ext}`.  
The bucket is private — only the owning user can read or delete their files (enforced by RLS).

---

*Add new features below this line following the same format.*
