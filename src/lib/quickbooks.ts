import { prisma } from "@/lib/prisma";
import { getAppOrigin } from "@/lib/site-url";

export type QuickBooksEnvironment = "sandbox" | "production";

export type QuickBooksConnection = {
  id: string;
  realmId: string;
  environment: QuickBooksEnvironment;
  companyName: string | null;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  connectedAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date | null;
};

type QuickBooksConnectionInput = {
  id: string;
  realmId: string;
  environment: QuickBooksEnvironment;
  companyName: string | null;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  connectedAt?: Date;
  lastSyncedAt?: Date | null;
};

const QUICKBOOKS_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QUICKBOOKS_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QUICKBOOKS_SCOPES = ["com.intuit.quickbooks.accounting"];
const DEFAULT_CONNECT_ID = "primary";

function requireConfiguredValue(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function getQuickBooksEnvironment(): QuickBooksEnvironment {
  return process.env.QUICKBOOKS_ENVIRONMENT === "production"
    ? "production"
    : "sandbox";
}

export function getQuickBooksRedirectUri(fallbackOrigin?: string) {
  const configured = process.env.QUICKBOOKS_REDIRECT_URI?.trim();

  if (configured) {
    return configured;
  }

  const origin = getAppOrigin(fallbackOrigin);

  return `${origin}/api/quickbooks/callback`;
}

export function getQuickBooksAuthUrl(input: {
  state: string;
  redirectUri: string;
}) {
  const clientId = requireConfiguredValue("QUICKBOOKS_CLIENT_ID");
  const url = new URL(QUICKBOOKS_AUTH_URL);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", QUICKBOOKS_SCOPES.join(" "));
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", input.state);

  return url.toString();
}

async function parseQuickBooksResponse(response: Response) {
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`QuickBooks request failed (${response.status}): ${text}`);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("QuickBooks returned an invalid response.");
  }
}

function toDateFromSeconds(seconds: unknown) {
  const total = Number(seconds);

  if (!Number.isFinite(total) || total <= 0) {
    return null;
  }

  return new Date(Date.now() + total * 1000);
}

function getApiBaseUrl(connection: QuickBooksConnection) {
  const host =
    connection.environment === "production"
      ? "https://quickbooks.api.intuit.com"
      : "https://sandbox-quickbooks.api.intuit.com";

  return `${host}/v3/company/${connection.realmId}`;
}

async function tokenRequest(body: URLSearchParams) {
  const clientId = requireConfiguredValue("QUICKBOOKS_CLIENT_ID");
  const clientSecret = requireConfiguredValue("QUICKBOOKS_CLIENT_SECRET");

  const response = await fetch(QUICKBOOKS_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  return parseQuickBooksResponse(response);
}

export async function exchangeQuickBooksCode(input: {
  code: string;
  redirectUri: string;
  realmId: string;
}) {
  const payload = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
  });

  const data = await tokenRequest(payload);

  if (!data) {
    throw new Error("QuickBooks did not return token data.");
  }

  return saveQuickBooksConnection({
    id: DEFAULT_CONNECT_ID,
    realmId: input.realmId,
    environment: getQuickBooksEnvironment(),
    companyName: null,
    accessToken: String(data.access_token ?? ""),
    refreshToken: String(data.refresh_token ?? ""),
    accessTokenExpiresAt: new Date(
      Date.now() + Number(data.expires_in ?? 3600) * 1000,
    ),
    refreshTokenExpiresAt:
      toDateFromSeconds(data.x_refresh_token_expires_in) ??
      new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
  });
}

export async function refreshQuickBooksConnection(connection: QuickBooksConnection) {
  const payload = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: connection.refreshToken,
  });

  const data = await tokenRequest(payload);

  if (!data) {
    throw new Error("QuickBooks did not return refreshed token data.");
  }

  return saveQuickBooksConnection({
    ...connection,
    accessToken: String(data.access_token ?? connection.accessToken),
    refreshToken: String(data.refresh_token ?? connection.refreshToken),
    accessTokenExpiresAt: new Date(
      Date.now() + Number(data.expires_in ?? 3600) * 1000,
    ),
    refreshTokenExpiresAt:
      toDateFromSeconds(data.x_refresh_token_expires_in) ??
      connection.refreshTokenExpiresAt,
  });
}

export async function getQuickBooksConnection() {
  const connection = await prisma.quickBooksConnection.findUnique({
    where: { id: DEFAULT_CONNECT_ID },
  });

  return connection
    ? ({
        ...connection,
        environment: connection.environment as QuickBooksEnvironment,
      } satisfies QuickBooksConnection)
    : null;
}

export async function saveQuickBooksConnection(input: QuickBooksConnectionInput) {
  const connection = await prisma.quickBooksConnection.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      realmId: input.realmId,
      environment: input.environment,
      companyName: input.companyName,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      refreshTokenExpiresAt: input.refreshTokenExpiresAt,
      connectedAt: input.connectedAt ?? new Date(),
      lastSyncedAt: input.lastSyncedAt ?? null,
    },
    update: {
      realmId: input.realmId,
      environment: input.environment,
      companyName: input.companyName,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      refreshTokenExpiresAt: input.refreshTokenExpiresAt,
      lastSyncedAt: input.lastSyncedAt ?? null,
    },
  });

  return {
    ...connection,
    environment: connection.environment as QuickBooksEnvironment,
  };
}

export async function disconnectQuickBooksConnection() {
  await prisma.quickBooksConnection.deleteMany({
    where: { id: DEFAULT_CONNECT_ID },
  });
}

async function getFreshQuickBooksConnection() {
  const connection = await getQuickBooksConnection();

  if (!connection) {
    throw new Error("QuickBooks is not connected yet.");
  }

  if (connection.accessTokenExpiresAt.getTime() <= Date.now() + 60_000) {
    return refreshQuickBooksConnection(connection);
  }

  return connection;
}

async function qboFetch(
  connection: QuickBooksConnection,
  path: string,
  init?: RequestInit,
) {
  const freshConnection = await getFreshQuickBooksConnection();
  const response = await fetch(`${getApiBaseUrl(connection)}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${freshConnection.accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  return parseQuickBooksResponse(response);
}

async function qboQuery(
  connection: QuickBooksConnection,
  query: string,
) {
  const data = await qboFetch(
    connection,
    `/query?query=${encodeURIComponent(query)}`,
  );

  const queryResponse = data as { QueryResponse?: Record<string, unknown[]> };
  const values = queryResponse.QueryResponse;

  if (!values) {
    return [];
  }

  return Object.values(values).flat() as Array<Record<string, unknown>>;
}

function escapeQuickBooksQueryValue(value: string) {
  return value.replace(/'/g, "''");
}

async function getOrCreateCustomer(
  connection: QuickBooksConnection,
  displayName: string,
) {
  const existing = await qboQuery(
    connection,
    `select * from Customer where DisplayName = '${escapeQuickBooksQueryValue(displayName)}' maxresults 1`,
  );

  if (existing[0]?.Id) {
    return String(existing[0].Id);
  }

  const created = (await qboFetch(connection, "/customer", {
    method: "POST",
    body: JSON.stringify({
      DisplayName: displayName,
    }),
  })) as { Customer?: { Id?: string } };

  const id = created.Customer?.Id;

  if (!id) {
    throw new Error("QuickBooks customer creation did not return an ID.");
  }

  return id;
}

async function getOrCreateVendor(
  connection: QuickBooksConnection,
  displayName: string,
) {
  const existing = await qboQuery(
    connection,
    `select * from Vendor where DisplayName = '${escapeQuickBooksQueryValue(displayName)}' maxresults 1`,
  );

  if (existing[0]?.Id) {
    return String(existing[0].Id);
  }

  const created = (await qboFetch(connection, "/vendor", {
    method: "POST",
    body: JSON.stringify({
      DisplayName: displayName,
    }),
  })) as { Vendor?: { Id?: string } };

  const id = created.Vendor?.Id;

  if (!id) {
    throw new Error("QuickBooks vendor creation did not return an ID.");
  }

  return id;
}

async function getOrCreateTuitionItem(connection: QuickBooksConnection) {
  const existing = await qboQuery(
    connection,
    `select * from Item where Name = 'Tuition' maxresults 1`,
  );

  if (existing[0]?.Id) {
    return String(existing[0].Id);
  }

  const incomeAccount = await getFirstAccount(connection, "Income");

  if (!incomeAccount?.Id) {
    throw new Error("No income account is available in QuickBooks.");
  }

  const created = (await qboFetch(connection, "/item", {
    method: "POST",
    body: JSON.stringify({
      Name: "Tuition",
      Type: "Service",
      IncomeAccountRef: {
        value: String(incomeAccount.Id),
      },
      Taxable: false,
    }),
  })) as { Item?: { Id?: string } };

  const id = created.Item?.Id;

  if (!id) {
    throw new Error("QuickBooks item creation did not return an ID.");
  }

  return id;
}

async function getFirstAccount(
  connection: QuickBooksConnection,
  type: "Income" | "Expense",
) {
  const records = await qboQuery(
    connection,
    `select * from Account where AccountType = '${type}' maxresults 1`,
  );

  return records[0] ?? null;
}

export async function syncInvoiceToQuickBooks(input: {
  recipientName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  description: string;
}) {
  const connection = await getFreshQuickBooksConnection();
  const customerId = await getOrCreateCustomer(connection, input.recipientName);
  const itemId = await getOrCreateTuitionItem(connection);

  const created = (await qboFetch(connection, "/invoice", {
    method: "POST",
    body: JSON.stringify({
      CustomerRef: {
        value: customerId,
      },
      TxnDate: input.issueDate,
      DueDate: input.dueDate,
      PrivateNote: input.description,
      Line: [
        {
          Amount: input.amount,
          DetailType: "SalesItemLineDetail",
          SalesItemLineDetail: {
            ItemRef: {
              value: itemId,
            },
            Qty: 1,
            UnitPrice: input.amount,
          },
        },
      ],
    }),
  })) as { Invoice?: { Id?: string; DocNumber?: string } };

  await prisma.quickBooksConnection.update({
    where: { id: DEFAULT_CONNECT_ID },
    data: { lastSyncedAt: new Date() },
  });

  return created.Invoice ?? null;
}

export async function syncBillToQuickBooks(input: {
  recipientName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  description: string;
}) {
  const connection = await getFreshQuickBooksConnection();
  const vendorId = await getOrCreateVendor(connection, input.recipientName);
  const expenseAccount = await getFirstAccount(connection, "Expense");

  if (!expenseAccount?.Id) {
    throw new Error("No expense account is available in QuickBooks.");
  }

  const created = (await qboFetch(connection, "/bill", {
    method: "POST",
    body: JSON.stringify({
      VendorRef: {
        value: vendorId,
      },
      TxnDate: input.issueDate,
      DueDate: input.dueDate,
      PrivateNote: input.description,
      Line: [
        {
          Amount: input.amount,
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: {
            AccountRef: {
              value: String(expenseAccount.Id),
            },
          },
        },
      ],
    }),
  })) as { Bill?: { Id?: string; DocNumber?: string } };

  await prisma.quickBooksConnection.update({
    where: { id: DEFAULT_CONNECT_ID },
    data: { lastSyncedAt: new Date() },
  });

  return created.Bill ?? null;
}
