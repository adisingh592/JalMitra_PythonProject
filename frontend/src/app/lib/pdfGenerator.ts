import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define the shape of the data we expect, without leaking anything like passwords
export type BillData = {
  id: number;
  period: string;
  amount: number;
  due_date: string | null;
  paid: boolean;
  paid_date: string | null;
  notes: string | null;
  usage_liters: number;
  rate_per_liter: number;
};

export type MemberProfile = {
  full_name: string | null;
  username: string;
  consumer_number: string | null;
  mobile: string | null;
  address: string | null;
  village_name: string | null;
};

export function generateBillPDF(member: MemberProfile, bill: BillData) {
  const doc = new jsPDF();
  
  // Brand Header
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185); // A nice blue
  doc.text('Jal Mitra', 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Water Management System', 14, 28);
  
  // Document Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('WATER UTILITY BILL', 140, 20);
  
  doc.setFontSize(10);
  doc.text(`Invoice No: #JM-BL-${bill.id}`, 140, 28);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 34);

  // Divider Line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 40, 196, 40);

  // Bill To Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 14, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // We explicitly use only safe fields (no password)
  const name = member.full_name || member.username;
  doc.text(`Name: ${name}`, 14, 58);
  doc.text(`Consumer No: ${member.consumer_number || 'N/A'}`, 14, 64);
  doc.text(`Mobile: ${member.mobile || 'N/A'}`, 14, 70);
  
  if (member.address || member.village_name) {
    const addr = [member.address, member.village_name].filter(Boolean).join(', ');
    doc.text(`Address: ${addr}`, 14, 76);
  }

  // Bill Summary Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill Summary:', 120, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Billing Period: ${bill.period}`, 120, 58);
  doc.text(`Due Date: ${bill.due_date || 'N/A'}`, 120, 64);
  
  doc.setFont('helvetica', 'bold');
  const status = bill.paid ? 'PAID' : 'PENDING';
  const statusColor = bill.paid ? [39, 174, 96] : [231, 76, 60];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Status: ${status}`, 120, 70);
  
  if (bill.paid && bill.paid_date) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Paid On: ${new Date(bill.paid_date).toLocaleDateString()}`, 120, 76);
  }

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Usage Details Table
  autoTable(doc, {
    startY: 90,
    head: [['Description', 'Usage (Liters)', 'Rate per Liter', 'Total']],
    body: [
      [
        `Water Usage (${bill.period})`,
        bill.usage_liters.toLocaleString(),
        `Rs ${bill.rate_per_liter}`,
        `Rs ${bill.amount.toLocaleString()}`
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // Total Amount Footer
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount Due:', 130, finalY + 15);
  doc.text(`Rs ${bill.amount.toLocaleString()}`, 170, finalY + 15);

  // Footer / Notes
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  if (bill.notes) {
    doc.text(`Notes: ${bill.notes}`, 14, finalY + 30);
  }
  
  doc.text('Thank you for choosing Jal Mitra Water Management System.', 14, finalY + 40);
  doc.text('If you have any questions about this bill, please contact your local administration.', 14, finalY + 45);

  // Save the PDF
  doc.save(`JalMitra_Bill_${bill.period}_${name.replace(/\s+/g, '_')}.pdf`);
}
