import { PaymentEntry, PaymentStatus } from '../types';

export function calculatePaymentSummary(
  totalAmountInput: number | string,
  payments: PaymentEntry[] = []
): {
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
} {
  const totalAmount = Math.max(0, Number(totalAmountInput) || 0);
  const amountPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = Math.max(0, totalAmount - amountPaid);

  let paymentStatus: PaymentStatus = 'Unpaid';
  if (totalAmount <= 0) {
    paymentStatus = amountPaid > 0 ? 'Fully Paid' : 'Unpaid';
  } else {
    if (amountPaid >= totalAmount) {
      paymentStatus = 'Fully Paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'Partially Paid';
    } else {
      paymentStatus = 'Unpaid';
    }
  }

  return {
    totalAmount,
    amountPaid,
    balanceDue,
    paymentStatus
  };
}
