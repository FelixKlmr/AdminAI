// lib/claude.ts
// Uses Claude API to determine GL account, VAT code, payment condition

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface InvoiceContext {
  supplierName: string
  invoiceNumber: string
  invoiceDate: string
  amount: number
  currency: string
  pdfText: string
  history: any[]
  glAccounts: any[]
  vatCodes: any[]
  paymentConditions: any[]
}

interface BookingDecision {
  confident: boolean
  reason?: string
  glAccountCode: string
  glAccountID: string
  vatCode: string
  vatCodeID: string
  paymentConditionCode: string
  paymentConditionID: string
  description: string
}

export async function analyzeInvoice(ctx: InvoiceContext): Promise<BookingDecision> {
  const historyText = ctx.history.length > 0
    ? ctx.history.map((h: any) => {
        const lines = h.Lines || []
        return `Factuur ${h.InvoiceNumber} (${h.InvoiceDate?.slice(0, 10)}): bedrag ${h.AmountDC} - ` +
          lines.map((l: any) => `GL: ${l.GLAccountCode}, BTW: ${l.VATCode}`).join(', ')
      }).join('\n')
    : 'Geen historische boekingen beschikbaar voor deze leverancier.'

  const glList = ctx.glAccounts.map((g: any) => `${g.Code} - ${g.Description} (ID: ${g.ID})`).join('\n')
  const vatList = ctx.vatCodes.map((v: any) => `${v.Code} - ${v.Description} ${v.Percentage}% (ID: ${v.ID})`).join('\n')
  const payList = ctx.paymentConditions.map((p: any) => `${p.Code} - ${p.Description} ${p.PaymentTermDays} dagen (ID: ${p.ID})`).join('\n')

  const prompt = `Je bent een ervaren boekhouder die inkoopfacturen verwerkt in Exact Online.

FACTUURGEGEVENS:
Leverancier: ${ctx.supplierName}
Factuurnummer: ${ctx.invoiceNumber}
Factuurdatum: ${ctx.invoiceDate}
Bedrag: ${ctx.amount} ${ctx.currency}

INHOUD VAN DE PDF:
${ctx.pdfText || 'Geen PDF-tekst beschikbaar'}

HISTORISCHE BOEKINGEN VAN DEZE LEVERANCIER:
${historyText}

BESCHIKBARE GROOTBOEKREKENINGEN:
${glList}

BESCHIKBARE BTW-CODES:
${vatList}

BESCHIKBARE BETALINGSCONDITIES:
${payList}

Bepaal de juiste boeking voor deze factuur op basis van de PDF-inhoud en historische boekingen.

Reageer ALLEEN met een JSON object in dit formaat (geen tekst eromheen):
{
  "confident": true of false,
  "reason": "Reden als niet zeker (anders leeg)",
  "glAccountCode": "de grootboekcode",
  "glAccountID": "de GUID van de grootboekrekening",
  "vatCode": "de BTW-code",
  "vatCodeID": "de GUID van de BTW-code",
  "paymentConditionCode": "de betalingsconditie code",
  "paymentConditionID": "de GUID van de betalingsconditie",
  "description": "omschrijving voor de boeking"
}

Zet confident op false als je echt niet zeker bent (bijv. totaal nieuwe leverancier zonder duidelijke PDF-inhoud). Geef dan in reason aan waarom.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {
      confident: false,
      reason: `Kon Claude-antwoord niet parsen: ${text}`,
      glAccountCode: '',
      glAccountID: '',
      vatCode: '',
      vatCodeID: '',
      paymentConditionCode: '',
      paymentConditionID: '',
      description: '',
    }
  }
}
