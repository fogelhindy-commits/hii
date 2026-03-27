import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

type AuthAccount = {
  userId: string;
  email: string;
  passwordHash: string;
};

type AuthSession = {
  token: string;
  userId: string;
  expiresAt: string;
};

type AuthState = {
  accounts: AuthAccount[];
  sessions: AuthSession[];
};

const AUTH_STATE_ID = "auth";

const INITIAL_AUTH_STATE: AuthState = {
  accounts: [],
  sessions: [],
};

function cloneState(state: AuthState): AuthState {
  return {
    accounts: state.accounts.map((account) => ({ ...account })),
    sessions: state.sessions.map((session) => ({ ...session })),
  };
}

function normalizeState(value: unknown): AuthState {
  if (!value || typeof value !== "object") {
    return cloneState(INITIAL_AUTH_STATE);
  }

  const maybeState = value as Partial<AuthState>;

  return {
    accounts: Array.isArray(maybeState.accounts) ? maybeState.accounts : [],
    sessions: Array.isArray(maybeState.sessions) ? maybeState.sessions : [],
  };
}

async function loadAuthState() {
  const row = await prisma.appState.findUnique({
    where: { id: AUTH_STATE_ID },
  });

  if (!row) {
    return cloneState(INITIAL_AUTH_STATE);
  }

  try {
    return normalizeState(JSON.parse(row.data));
  } catch {
    return cloneState(INITIAL_AUTH_STATE);
  }
}

let statePromise: Promise<AuthState> | null = null;

async function getAuthState() {
  if (!statePromise) {
    statePromise = loadAuthState();
  }

  return statePromise.then(cloneState);
}

async function saveAuthState(state: AuthState) {
  const cloned = cloneState(state);

  await prisma.appState.upsert({
    where: { id: AUTH_STATE_ID },
    create: {
      id: AUTH_STATE_ID,
      data: JSON.stringify(cloned),
    },
    update: {
      data: JSON.stringify(cloned),
    },
  });

  statePromise = Promise.resolve(cloneState(cloned));
  return cloned;
}

function getSessionTtlDays() {
  const value = Number(process.env.APP_SESSION_TTL_DAYS ?? 30);

  return Number.isFinite(value) && value > 0 ? value : 30;
}

function cleanupSessions(state: AuthState) {
  const now = Date.now();
  state.sessions = state.sessions.filter(
    (session) => new Date(session.expiresAt).getTime() > now,
  );
}

export async function ensureAuthAccount(input: {
  userId: string;
  email: string;
  password: string;
}) {
  const state = await getAuthState();
  cleanupSessions(state);
  const passwordHash = hashPassword(input.password);
  const account: AuthAccount = {
    userId: input.userId,
    email: input.email.toLowerCase(),
    passwordHash,
  };

  state.accounts = state.accounts.filter(
    (entry) =>
      entry.userId !== input.userId && entry.email.toLowerCase() !== input.email.toLowerCase(),
  );
  state.accounts.push(account);

  await saveAuthState(state);
  return account;
}

export async function setAuthPassword(userId: string, password: string) {
  const state = await getAuthState();
  cleanupSessions(state);
  const account = state.accounts.find((entry) => entry.userId === userId);

  if (!account) {
    return false;
  }

  account.passwordHash = hashPassword(password);
  await saveAuthState(state);
  return true;
}

export async function removeAuthAccount(userId: string) {
  const state = await getAuthState();
  cleanupSessions(state);
  const before = state.accounts.length;

  state.accounts = state.accounts.filter((entry) => entry.userId !== userId);
  state.sessions = state.sessions.filter((entry) => entry.userId !== userId);

  await saveAuthState(state);
  return state.accounts.length !== before;
}

export async function authenticateAuthAccount(input: {
  email: string;
  password: string;
}) {
  const state = await getAuthState();
  cleanupSessions(state);
  const normalizedEmail = input.email.toLowerCase();
  const account = state.accounts.find(
    (entry) => entry.email.toLowerCase() === normalizedEmail,
  );

  if (!account || !verifyPassword(input.password, account.passwordHash)) {
    return null;
  }

  await saveAuthState(state);
  return account;
}

export async function createAuthSession(userId: string) {
  const state = await getAuthState();
  cleanupSessions(state);
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + getSessionTtlDays() * 24 * 60 * 60 * 1000);

  state.sessions.push({
    token,
    userId,
    expiresAt: expiresAt.toISOString(),
  });

  await saveAuthState(state);
  return {
    token,
    expiresAt,
  };
}

export async function getUserIdForSessionToken(token: string) {
  const state = await getAuthState();
  cleanupSessions(state);
  const session = state.sessions.find((entry) => entry.token === token);

  if (!session) {
    await saveAuthState(state);
    return null;
  }

  const expiresAt = new Date(session.expiresAt);

  if (expiresAt.getTime() <= Date.now()) {
    state.sessions = state.sessions.filter((entry) => entry.token !== token);
    await saveAuthState(state);
    return null;
  }

  await saveAuthState(state);
  return session.userId;
}

export async function deleteAuthSession(token: string) {
  const state = await getAuthState();
  cleanupSessions(state);
  state.sessions = state.sessions.filter((entry) => entry.token !== token);
  await saveAuthState(state);
}
