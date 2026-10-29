/**
 * Twilio WhatsApp — assessment mock.
 *
 * Contract required by the assessment: sendWhatsApp(clientId, pdfPath, score).
 * Logs the client identifier, SEO score, report path, a mock delivery id and a
 * mock status. It never contacts Twilio and never claims delivery: the status
 * is deliberately `mock_sent`, and the audit pipeline records it as MOCKED.
 *
 * @param {string} clientId   Client identifier the report belongs to
 * @param {string} pdfPath    Report reference (storage key or absolute path)
 * @param {number} score      Overall SEO score included in the message
 * @returns {Promise<{ id: string, status: 'mock_sent', channel: 'whatsapp', to: string, score: number, pdfPath: string, mock: true, createdAt: string }>}
 */
export async function sendWhatsApp(clientId, pdfPath, score) {
  const delivery = {
    id: `mock_sent_${clientId}_${Date.now().toString(36)}`,
    status: /** @type {const} */ ('mock_sent'),
    channel: /** @type {const} */ ('whatsapp'),
    to: `client:${clientId}`,
    score,
    pdfPath,
    mock: /** @type {const} */ (true),
    createdAt: new Date().toISOString(),
  }

  console.log(
    JSON.stringify({
      level: 'info',
      time: delivery.createdAt,
      message: 'WhatsApp notification simulated (mock mode)',
      adapter: 'twilio.mock',
      clientId,
      score,
      pdfPath,
      deliveryId: delivery.id,
      deliveryStatus: delivery.status,
    }),
  )

  return delivery
}

export default { sendWhatsApp }
