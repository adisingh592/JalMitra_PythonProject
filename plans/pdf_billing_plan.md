# PDF Bill Download Implementation Plan

This plan details the steps to implement a standard PDF invoice generation feature in the Member Billing section, ensuring all details are included while explicitly omitting the user's password.

## Proposed Changes

### Dependencies
#### [MODIFY] frontend/package.json
- Install `jspdf` and `jspdf-autotable` in the frontend using `pnpm`. These are the standard libraries for creating structured, professional PDF documents in React.

### PDF Generation Utility
#### [NEW] frontend/src/app/lib/pdfGenerator.ts
- Create a reusable function `generateBillPDF(memberProfile, bill)`.
- It will format a professional standard bill containing:
  - **Header**: "Jal Mitra - Water Management System", "Water Utility Bill"
  - **Member Details**: Name, Consumer Number, Mobile, Village, and Address. (Password will explicitly be excluded).
  - **Bill Details**: Invoice Period, Due Date, Status (Paid/Unpaid).
  - **Usage Table**: Usage (Liters), Rate per Liter, Total Amount.

### Billing Page Updates
#### [MODIFY] frontend/src/app/pages/member/MemberBilling.tsx
- Update the API call to fetch the complete member profile (`/api/member/profile`) instead of just the list of bills. This ensures we have the member's name and address for the PDF.
- Connect the "Download PDF" button to trigger the `generateBillPDF` function with the current bill.
- Add small download icons to the "Bill History" list so users can download any past bill.
