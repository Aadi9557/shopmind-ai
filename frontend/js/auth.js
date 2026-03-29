// ─────────────────────────────────────────────────────
//  Auth.js — Supabase Authentication
//  Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY
// ─────────────────────────────────────────────────────

const SUPABASE_URL      = 'https://lcloqbgxpxptcacjnsbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjbG9xYmd4cHhwdGNhY2puc2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjI3NDUsImV4cCI6MjA4OTEzODc0NX0.I82ZIWTQzwVBW0RIYyQ0waPvou3jynL48OX14yAheI4';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── GET CURRENT SESSION ──────────────────────────────
async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

// ── GET CURRENT USER ─────────────────────────────────
async function getUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// ── GET AUTH TOKEN ───────────────────────────────────
async function getToken() {
  const session = await getSession();
  return session?.access_token || null;
}

// ── LOGIN WITH EMAIL ─────────────────────────────────
async function loginWithEmail(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// ── SIGNUP WITH EMAIL ────────────────────────────────
async function signupWithEmail(name, email, password) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });
  if (error) throw error;
  return data;
}

// ── LOGIN WITH GOOGLE ────────────────────────────────
async function loginWithGoogle() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/dashboard' }
  });
  if (error) throw error;
}

// ── FORGOT PASSWORD ──────────────────────────────────
async function forgotPassword(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password'
  });
  if (error) throw error;
}

// ── LOGOUT ───────────────────────────────────────────
async function logout() {
  await sb.auth.signOut();
  window.location.href = '/';
}

// ── REQUIRE AUTH (redirect if not logged in) ─────────
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = '/';
    return null;
  }
  return session;
}

// ── REDIRECT IF LOGGED IN ────────────────────────────
async function redirectIfLoggedIn(to = '/dashboard') {
  const session = await getSession();
  if (session) window.location.href = to;
}

// ── GET USER DISPLAY NAME ────────────────────────────
function getDisplayName(user) {
  return user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Friend';
}

// ── GET USER INITIAL ─────────────────────────────────
function getUserInitial(user) {
  const name = getDisplayName(user);
  return name.charAt(0).toUpperCase();
}
