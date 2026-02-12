import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// Fix for Tailwind CSS v4 oklch() colors that html2canvas cannot parse.
export const fixColorsForHtml2Canvas = (clonedDoc, clonedElement) => {
  const colorProps = [
    'color', 'background-color', 'border-color',
    'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
    'box-shadow', 'outline-color', 'text-decoration-color',
    'fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color',
  ]
  const win = clonedDoc.defaultView

  const sanitize = (v) => {
    if (!v || v === 'none' || v === 'transparent') return v
    if (v.includes('oklch') || v.includes('oklab')) return '#000000'
    return v
  }

  const allElements = clonedDoc.querySelectorAll('*')
  for (const el of allElements) {
    const computed = win.getComputedStyle(el)
    for (const prop of colorProps) {
      const resolved = computed.getPropertyValue(prop)
      if (resolved && resolved !== 'none' && resolved !== 'transparent') {
        el.style.setProperty(prop, sanitize(resolved), 'important')
      }
    }
  }

  const sheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]')
  sheets.forEach((sheet) => sheet.remove())

  clonedElement.style.visibility = 'visible'
  clonedElement.style.position = 'static'
  clonedElement.style.display = 'block'
  clonedElement.style.backgroundColor = '#ffffff'
  clonedElement.style.boxShadow = 'none'
  clonedElement.style.transform = 'none'
}

// Generate a jsPDF from a rendered DOM element
export async function generatePdfFromElement(element) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: fixColorsForHtml2Canvas,
  })

  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = 210
  const pdfHeight = 297
  const imgWidth = canvas.width
  const imgHeight = canvas.height
  const ratio = pdfWidth / imgWidth
  const scaledHeight = imgHeight * ratio

  if (scaledHeight <= pdfHeight) {
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, scaledHeight)
  } else {
    let y = 0
    const pageHeightPx = pdfHeight / ratio
    let pageIndex = 0
    while (y < imgHeight) {
      const sliceHeight = Math.min(pageHeightPx, imgHeight - y)
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = imgWidth
      pageCanvas.height = sliceHeight
      const ctx = pageCanvas.getContext('2d')
      ctx.drawImage(canvas, 0, y, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight)
      const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95)
      if (pageIndex > 0) pdf.addPage()
      pdf.addImage(pageImg, 'JPEG', 0, 0, pdfWidth, sliceHeight * ratio)
      y += sliceHeight
      pageIndex++
    }
  }

  return pdf
}
