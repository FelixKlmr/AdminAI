// app/api/process/route.ts
import { NextResponse } from 'next/server'
import { getTokens } from '@/lib/tokens'
import {
  getProposals,
  getSupplierHistory,
  getGLAccounts,
  getVATCodes,
  getPaymentConditions,
  getDocument,
  getAttachment,
  bookProposal,
} from '@/lib/exact'
import { analyzeInvoice } from '@/lib/claude'

// We use a streaming response so the frontend can show live progress
export async function POST() {
  const { accessToken } = getTokens()
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const send = async (data: object) => {
    await writer.write(encoder.encode(JSON.stringify(data) + '\n'))
  }

  // Run processing in background
  ;(async () => {
    try {
      await send({ type: 'status', message: 'Boekingsvoorstellen ophalen...' })
      const proposals = await getProposals(accessToken)
      await send({ type: 'status', message: `${proposals.length} voorstellen gevonden` })

      if (proposals.length === 0) {
        await send({ type: 'done', message: 'Geen boekingsvoorstellen gevonden.' })
        await writer.close()
        return
      }

      // Fetch shared reference data once
      await send({ type: 'status', message: 'Grootboekrekeningen, BTW-codes en betalingscondities ophalen...' })
      const [glAccounts, vatCodes, paymentConditions] = await Promise.all([
        getGLAccounts(accessToken),
        getVATCodes(accessToken),
        getPaymentConditions(accessToken),
      ])

      let booked = 0
      let skipped = 0
      const skippedList: any[] = []

      for (const proposal of proposals) {
        await send({ type: 'status', message: `Verwerken: ${proposal.SupplierName} - factuur ${proposal.InvoiceNumber || 'onbekend'}` })

        // Get PDF text if document exists
        let pdfText = ''
        if (proposal.DocumentID) {
          try {
            const doc = await getDocument(accessToken, proposal.DocumentID)
            const attachments = doc?.DocumentAttachments?.results || []
            if (attachments.length > 0) {
              const buffer = await getAttachment(accessToken, attachments[0].ID)
              // Parse PDF server-side
              const pdfParse = (await import('pdf-parse')).default
              const parsed = await pdfParse(Buffer.from(buffer))
              pdfText = parsed.text
            }
          } catch (e: any) {
            await send({ type: 'warning', message: `PDF lezen mislukt voor ${proposal.SupplierName}: ${e.message}` })
          }
        }

        // Get supplier history
        let history: any[] = []
        if (proposal.SupplierID) {
          try {
            history = await getSupplierHistory(accessToken, proposal.SupplierID)
          } catch {
            // No history available, continue
          }
        }

        // Ask Claude to analyze
        const decision = await analyzeInvoice({
          supplierName: proposal.SupplierName || 'Onbekend',
          invoiceNumber: proposal.InvoiceNumber || '',
          invoiceDate: proposal.InvoiceDate || '',
          amount: proposal.AmountDC || 0,
          currency: proposal.Currency || 'EUR',
          pdfText,
          history,
          glAccounts,
          vatCodes,
          paymentConditions,
        })

        if (!decision.confident) {
          skipped++
          skippedList.push({
            supplier: proposal.SupplierName,
            invoice: proposal.InvoiceNumber,
            reason: decision.reason,
          })
          await send({
            type: 'skipped',
            supplier: proposal.SupplierName,
            invoice: proposal.InvoiceNumber,
            reason: decision.reason,
          })
          continue
        }

        // Book the invoice
        try {
          await bookProposal(
            accessToken,
            proposal.ID,
            [
              {
                GLAccount: decision.glAccountID,
                VATCode: decision.vatCode,
                Amount: proposal.AmountDC,
                Description: decision.description,
              },
            ],
            decision.paymentConditionCode
          )
          booked++
          await send({
            type: 'booked',
            supplier: proposal.SupplierName,
            invoice: proposal.InvoiceNumber,
            glAccount: `${decision.glAccountCode}`,
            vatCode: decision.vatCode,
            paymentCondition: decision.paymentConditionCode,
          })
        } catch (e: any) {
          skipped++
          skippedList.push({
            supplier: proposal.SupplierName,
            invoice: proposal.InvoiceNumber,
            reason: `Boeken mislukt: ${e.message}`,
          })
          await send({
            type: 'skipped',
            supplier: proposal.SupplierName,
            invoice: proposal.InvoiceNumber,
            reason: `Boeken mislukt: ${e.message}`,
          })
        }
      }

      await send({
        type: 'done',
        booked,
        skipped,
        skippedList,
        message: `Klaar! ${booked} geboekt, ${skipped} overgeslagen.`,
      })
    } catch (e: any) {
      await send({ type: 'error', message: e.message })
    } finally {
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  })
}
