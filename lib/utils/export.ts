/**
 * Export utilities for generating CSV, Excel, and PDF files
 */

export interface ExportColumn<T = Record<string, unknown>> {
  key: string
  header: string
  width?: number
  format?: (value: unknown, row: T) => string
}

/**
 * Convert data array to CSV format
 */
export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[]
): string {
  if (data.length === 0) return ''

  // Header row
  const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`)
  const headerRow = headers.join(',')

  // Data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        const value = col.format ? col.format(row[col.key], row) : row[col.key]
        const stringValue = value?.toString() || ''
        // Escape quotes and wrap in quotes
        return `"${stringValue.replace(/"/g, '""')}"`
      })
      .join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data as CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const csvContent = convertToCSV(data, columns)
  downloadCSV(csvContent, filename)
}

/**
 * Convert data to Excel-compatible XML format (SpreadsheetML)
 * This creates an XML file that Excel can open
 */
export function convertToExcelXML<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  worksheetName = 'Datos'
): string {
  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Date">
   <NumberFormat ss:Format="Short Date"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="Currency"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXML(worksheetName)}">
  <Table>\n`

  // Column widths
  columns.forEach((col) => {
    const width = col.width || 100
    xml += `   <Column ss:Width="${width}"/>\n`
  })

  // Header row
  xml += '   <Row ss:StyleID="Header">\n'
  columns.forEach((col) => {
    xml += `    <Cell><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>\n`
  })
  xml += '   </Row>\n'

  // Data rows
  data.forEach((row) => {
    xml += '   <Row>\n'
    columns.forEach((col) => {
      const value = col.format ? col.format(row[col.key], row) : row[col.key]
      const stringValue = value?.toString() || ''

      // Determine type
      let type = 'String'
      let displayValue = escapeXML(stringValue)

      if (typeof value === 'number') {
        type = 'Number'
        displayValue = stringValue
      }

      xml += `    <Cell><Data ss:Type="${type}">${displayValue}</Data></Cell>\n`
    })
    xml += '   </Row>\n'
  })

  xml += `  </Table>
 </Worksheet>
</Workbook>`

  return xml
}

/**
 * Download Excel XML file
 */
export function downloadExcel(xmlContent: string, filename: string): void {
  const blob = new Blob([xmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8;'
  })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.xls') ? filename : `${filename}.xls`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data as Excel file
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  worksheetName = 'Datos'
): void {
  const xmlContent = convertToExcelXML(data, columns, worksheetName)
  downloadExcel(xmlContent, filename)
}

/**
 * Generate PDF-ready HTML content
 * This generates HTML that can be converted to PDF using print dialog
 */
export function generatePDFHTML<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: {
    title?: string
    subtitle?: string
    orientation?: 'portrait' | 'landscape'
    pageSize?: 'A4' | 'Letter'
    showDate?: boolean
    showPageNumbers?: boolean
  } = {}
): string {
  const {
    title = 'Reporte',
    subtitle = '',
    orientation = 'portrait',
    pageSize = 'A4',
    showDate = true,
    showPageNumbers = true
  } = options

  const escapeHTML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  const currentDate = new Date().toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(title)}</title>
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: 2cm;
      @bottom-center {
        ${showPageNumbers ? 'content: "Página " counter(page) " de " counter(pages);' : ''}
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      color: #111827;
      margin: 0;
      padding: 0;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #1f2937;
      padding-bottom: 10px;
    }

    .header h1 {
      margin: 0 0 5px 0;
      font-size: 18pt;
      color: #111827;
    }

    .header .subtitle {
      margin: 0 0 5px 0;
      font-size: 12pt;
      color: #6b7280;
    }

    .header .date {
      font-size: 10pt;
      color: #9ca3af;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th {
      background-color: #f3f4f6;
      color: #374151;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      font-size: 9pt;
      text-transform: uppercase;
    }

    td {
      padding: 6px 12px;
      border: 1px solid #e5e7eb;
      font-size: 9pt;
    }

    tr:nth-child(even) {
      background-color: #f9fafb;
    }

    tr:hover {
      background-color: #f3f4f6;
    }

    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 8pt;
      color: #9ca3af;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHTML(title)}</h1>
    ${subtitle ? `<p class="subtitle">${escapeHTML(subtitle)}</p>` : ''}
    ${showDate ? `<p class="date">Generado el ${currentDate}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        ${columns.map((col) => `<th>${escapeHTML(col.header)}</th>`).join('\n        ')}
      </tr>
    </thead>
    <tbody>
      ${data
        .map(
          (row) => `
      <tr>
        ${columns
          .map((col) => {
            const value = col.format ? col.format(row[col.key], row) : row[col.key]
            const stringValue = value?.toString() || ''
            return `<td>${escapeHTML(stringValue)}</td>`
          })
          .join('\n        ')}
      </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Total de registros: ${data.length}</p>
  </div>
</body>
</html>`
}

/**
 * Open print dialog for PDF export
 */
export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: {
    title?: string
    subtitle?: string
    orientation?: 'portrait' | 'landscape'
    pageSize?: 'A4' | 'Letter'
    showDate?: boolean
    showPageNumbers?: boolean
  } = {}
): void {
  const htmlContent = generatePDFHTML(data, columns, options)

  // Open in new window and trigger print
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

/**
 * Format functions for common data types
 */
export const formatters = {
  currency: (value: unknown): string => {
    if (typeof value !== 'number') return String(value || '')
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value)
  },

  date: (value: unknown): string => {
    if (!value) return ''
    const date = new Date(String(value))
    if (isNaN(date.getTime())) return String(value)
    return date.toLocaleDateString('es-CL')
  },

  datetime: (value: unknown): string => {
    if (!value) return ''
    const date = new Date(String(value))
    if (isNaN(date.getTime())) return String(value)
    return date.toLocaleString('es-CL')
  },

  boolean: (value: unknown): string => {
    return value ? 'Sí' : 'No'
  },

  percentage: (value: unknown): string => {
    if (typeof value !== 'number') return String(value || '')
    return `${value.toFixed(2)}%`
  },

  rut: (value: unknown): string => {
    const rut = String(value || '').replace(/[^0-9kK]/g, '')
    if (rut.length < 2) return String(value || '')
    const body = rut.slice(0, -1)
    const verifier = rut.slice(-1)
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${formatted}-${verifier}`
  }
}
