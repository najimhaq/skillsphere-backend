import type { Types } from 'mongoose';

export const PAYMENT_STATUSES = [
  'PENDING',
  'PAID',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
  'REFUNDED',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_GATEWAYS = ['STRIPE'] as const;

export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];

export interface IPayment {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;

  courseTitle: string;

  amount: number;
  amountMinor: number;
  currency: string;

  gateway: PaymentGateway;
  status: PaymentStatus;

  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;

  paidAt?: Date | null;
  failureReason?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
