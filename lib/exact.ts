// lib/exact.ts
// Exact Online API helper functions

const EXACT_BASE = 'https://start.exactonline.nl/api/v1'
const TOKEN_URL = 'https://start.exactonline.nl/api/oauth2/token'
const AUTH_URL = 'https://start.exactonline.nl/api/oauth2/auth'

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.EXACT_CLIENT_ID!,
    redirect_uri: process.env.EXACT_REDIRECT_URI!,
    response_type: 'code',
    force_login: '0',
  })
  return `${AUTH_URL}?${params}`
}

export async function exchangeCode(code: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: process.env.EXACT_CLIENT_ID!,
      client_secret: process.env.EXACT_CLIENT_SECRET!,
      redirect_uri: process.env.EXACT_REDIRECT_URI!,
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function refreshToken(refresh_token: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
      client_id: process.env.EXACT_CLIENT_ID!,
      client_secret: process.env.EXACT_CLIENT_SECRET!,
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)
  return res.json()
}

export async function exactGet(path: string, accessToken: string) {
  const division = process.env.EXACT_DIVISION
  const url = `${EXACT_BASE}/${division}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Exact GET ${path} failed: ${await res.text()}`)
  return res.json()
}

export async function exactPost(path: string, accessToken: string, body: object) {
  const division = process.env.EXACT_DIVISION
  const url = `${EXACT_BASE}/${division}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Exact POST ${path} failed: ${await res.text()}`)
  return res.json()
}

export async function exactPut(path: string, accessToken: string, body: object) {
  const division = process.env.EXACT_DIVISION
  const url = `${EXACT_BASE}/${division}${path}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Exact PUT ${path} failed: ${await res.text()}`)
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

// Fetch purchase invoice proposals (boekingsvoorstellen)
// Status filtering niet ondersteund door Exact API — client-side filteren op Status 10
export async function getProposals(accessToken: string) {
  const data = await exactGet(
    `/purchase/PurchaseInvoices?$select=ID,InvoiceID,SupplierName,SupplierID,InvoiceDate,InvoiceNumber,AmountDC,Currency,DocumentID,Status&$top=50`,
    accessToken
  )
  const all = data?.d?.results || []
  return all.filter((inv: any) => inv.Status === 10)
}

// Fetch historical bookings for a supplier
// Status filtering niet ondersteund — client-side filteren op Status 50 (geboekt)
export async function getSupplierHistory(accessToken: string, supplierID: string) {
  const data = await exactGet(
    `/purchase/PurchaseInvoices?$filter=SupplierID eq guid'${supplierID}'&$select=ID,InvoiceNumber,InvoiceDate,AmountDC,Status&$top=20&$orderby=InvoiceDate desc&$expand=Lines`,
    accessToken
  )
  const all = data?.d?.results || []
  return all.filter((inv: any) => inv.Status === 50)
}

// Fetch GL accounts (grootboekrekeningen)
export async function getGLAccounts(accessToken: string) {
  const data = await exactGet(
    `/financial/GLAccounts?$select=ID,Code,Description,Type&$filter=Type eq 20 or Type eq 30&$top=250`,
    accessToken
  )
  return data?.d?.results || []
}

// Fetch VAT codes
export async function getVATCodes(accessToken: string) {
  const data = await exactGet(
    `/vat/VATCodes?$select=ID,Code,Description,Percentage`,
    accessToken
  )
  return data?.d?.results || []
}

// Fetch payment conditions
export async function getPaymentConditions(accessToken: string) {
  const data = await exactGet(
    `/cashflow/PaymentConditions?$select=ID,Code,Description,PaymentTermDays`,
    accessToken
  )
  return data?.d?.results || []
}

// Fetch document (PDF) for a proposal
export async function getDocument(accessToken: string, documentID: string) {
  const data = await exactGet(
    `/documents/Documents(guid'${documentID}')?$select=ID,Subject,Type&$expand=DocumentAttachments`,
    accessToken
  )
  return data?.d
}

// Download attachment binary
export async function getAttachment(accessToken: string, attachmentID: string) {
  const division = process.env.EXACT_DIVISION
  const url = `${EXACT_BASE}/${division}/documents/DocumentAttachments(guid'${attachmentID}')/$value`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Attachment download failed: ${await res.text()}`)
  return res.arrayBuffer()
}

// Book a purchase invoice proposal
export async function bookProposal(
  accessToken: string,
  invoiceID: string,
  lines: Array<{
    GLAccount: string
    VATCode: string
    Amount: number
    Description: string
  }>,
  paymentCondition: string
) {
  await exactPut(
    `/purchase/PurchaseInvoices(guid'${invoiceID}')`,
    accessToken,
    { PaymentCondition: paymentCondition }
  )

  for (const line of lines) {
    await exactPost(
      `/purchase/PurchaseInvoiceLines`,
      accessToken,
      {
        PurchaseInvoice: invoiceID,
        GLAccount: line.GLAccount,
        VATCode: line.VATCode,
        AmountDC: line.Amount,
        Description: line.Description,
      }
    )
  }

  await exactPut(
    `/purchase/PurchaseInvoices(guid'${invoiceID}')`,
    accessToken,
    { Status: 20 }
  )
}
