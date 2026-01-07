import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to CSV
 * @param data Array of objects to export
 * @param filename Desired filename (without extension)
 */
export const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;

    const replacer = (key: string, value: any) => (value === null ? '' : value);
    const header = Object.keys(data[0]);
    const csv = [
        header.join(','), // header row first
        ...data.map((row) =>
            header
                .map((fieldName) => JSON.stringify(row[fieldName], replacer))
                .join(',')
        ),
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

/**
 * Export data to PDF (Table View)
 * @param data Array of objects to export
 * @param columns Array of column headers
 * @param title PDF Title
 */
export const exportToPDF = (data: any[], columns: string[], title: string) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Table
    const tableRows = data.map(item => Object.values(item));
    const tableHeaders = [columns];

    autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
        styles: { fontSize: 8 },
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};
