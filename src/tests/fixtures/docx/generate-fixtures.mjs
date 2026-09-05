import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const outputDirectory = path.dirname(fileURLToPath(import.meta.url))
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')

const escapeXml = (value) => value.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[character]))
const run = (text, properties = '') => `<w:r>${properties ? `<w:rPr>${properties}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`
const paragraph = (text, style = '', properties = '') => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${run(text, properties)}</w:p>`
const listItem = (text, ordered = false) => `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${ordered ? 2 : 1}"/></w:numPr></w:pPr>${run(text)}</w:p>`
const hyperlink = (text, relationshipId) => `<w:p>${`<w:hyperlink r:id="${relationshipId}">${run(text)}</w:hyperlink>`}</w:p>`
const image = (relationshipId, id, alt) => `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="914400" cy="914400"/><wp:docPr id="${id}" name="Picture ${id}"${alt === undefined ? '' : ` descr="${escapeXml(alt)}"`}/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="image${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`

const documentXml = (body) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}<w:sectPr/></w:body></w:document>`
const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="Heading 3"/></w:style><w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="Caption"/></w:style></w:styles>`
const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`

async function writeDocx(name, { body, images = 0, links = [] , numbering = false }) {
  const zip = new JSZip()
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>${numbering ? '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' : ''}</Types>`)
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`)
  const relationships = [...links.map((target, index) => `<Relationship Id="rIdLink${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(target)}" TargetMode="External"/>`), ...Array.from({ length: images }, (_, index) => `<Relationship Id="rIdImage${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${index + 1}.png"/>`)].join('')
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`)
  zip.file('word/document.xml', documentXml(body))
  zip.file('word/styles.xml', stylesXml)
  if (numbering) zip.file('word/numbering.xml', numberingXml)
  for (let index = 1; index <= images; index += 1) zip.file(`word/media/image${index}.png`, png)
  await fs.writeFile(path.join(outputDirectory, name), await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }))
}

await fs.mkdir(outputDirectory, { recursive: true })
await writeDocx('title-style.docx', {
  body: paragraph('Digitalisasi Mahasiswa', 'Title') + paragraph('Pembuka artikel yang menjadi sumber ringkasan.') + paragraph('Tebal dan miring', '', '<w:b/><w:i/>'),
})
await writeDocx('heading-hierarchy.docx', {
  body: paragraph('Judul dari Heading 1', 'Heading1') + paragraph('Pendahuluan', 'Heading1') + paragraph('Konteks', 'Heading2') + paragraph('Isi hierarki artikel.') + listItem('Poin pertama') + listItem('Poin kedua') + listItem('Langkah pertama', true) + hyperlink('Situs aman', 'rIdLink1') + hyperlink('Situs berbahaya', 'rIdLink2'),
  links: ['https://example.com/aman', 'javascript:alert(1)'],
  numbering: true,
})
await writeDocx('paragraph-only.docx', { body: paragraph('Judul paragraf pertama') + paragraph('Isi paragraf kedua untuk artikel.') })
await writeDocx('title-duplicate.docx', { body: paragraph('Judul asli', 'Title') + paragraph('Judul asli') + paragraph('Isi setelah judul.') })
await writeDocx('images-and-caption.docx', {
  body: paragraph('Artikel bergambar.') + image('rIdImage1', 1, 'Pemandangan kampus') + paragraph('Keterangan foto', 'Caption') + image('rIdImage2', 2) + image('rIdImage3', 3, 'Gambar ketiga'),
  images: 3,
})
await writeDocx('caption-excerpt.docx', {
  body: paragraph('Artikel dengan gambar.', 'Title') + image('rIdImage1', 1, 'Foto artikel') + paragraph('Keterangan yang bukan ringkasan.', 'Caption') + paragraph('Paragraf isi yang menjadi sumber ringkasan.'),
  images: 1,
})
await writeDocx('orphan-caption.docx', {
  body: paragraph('Artikel tanpa pasangan gambar.', 'Title') + paragraph('Keterangan yatim yang bukan ringkasan.', 'Caption') + paragraph('Paragraf isi setelah caption.'),
})
await writeDocx('caption-only.docx', {
  body: paragraph('Artikel hanya caption.', 'Title') + paragraph('Keterangan saja.', 'Caption'),
})
await writeDocx('heading-caption-body.docx', {
  body: paragraph('Judul artikel.', 'Title') + paragraph('Bagian artikel.', 'Heading1') + paragraph('Keterangan setelah heading.', 'Caption') + paragraph('Prosa artikel yang menjadi sumber ringkasan.'),
})
await writeDocx('only-title.docx', { body: paragraph('Hanya Judul', 'Title') })
await writeDocx('empty.docx', { body: '' })
await fs.writeFile(path.join(outputDirectory, 'corrupt.docx'), Buffer.from('not-a-docx'))
