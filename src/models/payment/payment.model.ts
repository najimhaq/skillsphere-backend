import mongoose from 'mongoose';

import {
  PAYMENT_GATEWAYS,
  PAYMENT_STATUSES,
  type IPayment,
} from '../../types/stripe/payment.js';

const paymentSchema = new mongoose.Schema<IPayment>(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

    courseTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    amountMinor: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      default: 'usd',
    },

    gateway: {
      type: String,
      enum: PAYMENT_GATEWAYS,
      required: true,
      default: 'STRIPE',
      index: true,
    },

    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      required: true,
      default: 'PENDING',
      index: true,
    },

    stripeCheckoutSessionId: {
      type: String,
      trim: true,
      default: null,
      unique: true,
      sparse: true,
    },

    stripePaymentIntentId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({
  studentId: 1,
  courseId: 1,
  createdAt: -1,
});

paymentSchema.index({
  status: 1,
  createdAt: -1,
});

export const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);
