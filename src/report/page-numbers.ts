import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

/**
 * Adds a discreet footer with page numbers to every page except the cover.
 * Chrome's print pipeline cannot emit live page counters, so numbering is
 * stamped deterministically after rendering.
 */
export async function stampPageNumbers(pdf: Buffer, label = 'EdgeLink — SEO Intelligence'): Promise<Buffer> {
  const document = await PDFDocument.load(pdf)
  const font = await document.embedFont(StandardFonts.Helvetica)
  const pages = document.getPages()
  const total = pages.length

  pages.forEach((page, index) => {
    if (index === 0) return
    const number = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
    page.drawText(label, { x: 51, y: 22, size: 7, font, color: rgb(0.43, 0.48, 0.45) })
    const width = font.widthOfTextAtSize(number, 7)
    page.drawText(number, { x: page.getWidth() - 51 - width, y: 22, size: 7, font, color: rgb(0.43, 0.48, 0.45) })
  })

  return Buffer.from(await document.save())
}
