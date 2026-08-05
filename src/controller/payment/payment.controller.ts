import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import Stripe from 'stripe';

import { env } from '../../config/env.js';
import { Course } from '../../models/course.model.js';
import { Enrollment } from '../../models/enrollment.model.js';
import { Payment } from '../../models/payment/payment.model.js';
import { stripe } from '../../lib/stripe.js';

type CreateCheckoutBody = {
  courseId?: unknown;
};

const getCourseId = (value: unknown) => {
  return typeof value === 'string' ? value : '';
};

const createEnrollmentAfterPayment = async (
  paymentId: string,
  stripeSession: Stripe.Checkout.Session
) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new Error('Payment record was not found.');
  }

  if (payment.status === 'PAID') {
    return payment;
  }

  const expectedAmount = payment.amountMinor;
  const receivedAmount = stripeSession.amount_total ?? 0;
  const receivedCurrency = stripeSession.currency?.toLowerCase();

  if (
    stripeSession.payment_status !== 'paid' ||
    receivedAmount !== expectedAmount ||
    receivedCurrency !== payment.currency
  ) {
    throw new Error('Stripe payment verification did not match the order.');
  }

  await Enrollment.updateOne(
    {
      studentId: payment.studentId,
      courseId: payment.courseId,
    },
    {
      $setOnInsert: {
        studentId: payment.studentId,
        courseId: payment.courseId,
        status: 'ACTIVE',
        progressPercentage: 0,
        enrolledAt: new Date(),
        completedAt: null,
      },
    },
    {
      upsert: true,
    }
  );

  payment.status = 'PAID';
  payment.stripePaymentIntentId =
    typeof stripeSession.payment_intent === 'string'
      ? stripeSession.payment_intent
      : (stripeSession.payment_intent?.id ?? null);
  payment.paidAt = new Date();
  payment.failureReason = null;

  await payment.save();

  return payment;
};

export const createStripeCheckoutSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = req.authUser;
  const { courseId: rawCourseId } = req.body as CreateCheckoutBody;
  const courseId = getCourseId(rawCourseId);

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      message: 'Only students can purchase courses.',
    });
    return;
  }

  if (!Types.ObjectId.isValid(user.id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid student identifier.',
    });
    return;
  }

  if (!Types.ObjectId.isValid(courseId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid course identifier.',
    });
    return;
  }

  const studentId = new Types.ObjectId(user.id);
  const courseObjectId = new Types.ObjectId(courseId);

  const [course, existingEnrollment, existingPendingPayment] =
    await Promise.all([
      Course.findOne({
        _id: courseObjectId,
        status: 'PUBLISHED',
      }).lean(),

      Enrollment.findOne({
        studentId,
        courseId: courseObjectId,
        status: {
          $in: ['ACTIVE', 'COMPLETED'],
        },
      }).lean(),

      Payment.findOne({
        studentId,
        courseId: courseObjectId,
        gateway: 'STRIPE',
        status: 'PENDING',
      })
        .sort({
          createdAt: -1,
        })
        .lean(),
    ]);

  if (!course) {
    res.status(404).json({
      success: false,
      message: 'Published course not found.',
    });
    return;
  }

  if (existingEnrollment) {
    res.status(409).json({
      success: false,
      message: 'You are already enrolled in this course.',
    });
    return;
  }
if (existingPendingPayment) {
  res.status(409).json({
    success: false,
    message:
      'A payment checkout is already pending for this course. Please complete or cancel the existing Stripe Checkout session before trying again.',
  });
  return;
}
  if (!Number.isFinite(course.price) || course.price <= 0) {
    res.status(400).json({
      success: false,
      message:
        'This is a free course. Please use the normal enrollment option.',
    });
    return;
  }

  const amountMinor = Math.round(course.price * 100);

  if (amountMinor < 50) {
    res.status(400).json({
      success: false,
      message: 'Course price is too low for checkout.',
    });
    return;
  }

  const payment = await Payment.create({
    studentId,
    courseId: courseObjectId,
    courseTitle: course.title,
    amount: course.price,
    amountMinor,
    currency: 'usd',
    gateway: 'STRIPE',
    status: 'PENDING',
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',

      client_reference_id: payment._id.toString(),

      customer_email: user.email,

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountMinor,
            product_data: {
              name: course.title,
              description: course.shortDescription,
            },
          },
        },
      ],

      metadata: {
        paymentId: payment._id.toString(),
        courseId: course._id.toString(),
        studentId: studentId.toString(),
      },

      payment_intent_data: {
        metadata: {
          paymentId: payment._id.toString(),
          courseId: course._id.toString(),
          studentId: studentId.toString(),
        },
      },

      success_url: `${env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/payment/cancel`,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL.');
    }

    payment.stripeCheckoutSessionId = session.id;
    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Stripe Checkout session created successfully.',
      data: {
        paymentId: payment._id.toString(),
        checkoutUrl: session.url,
      },
    });
  } catch (error: unknown) {
    payment.status = 'FAILED';
    payment.failureReason =
      error instanceof Error
        ? error.message.slice(0, 1000)
        : 'Unable to create Stripe Checkout session.';
    await payment.save();

    throw error;
  }
};

export const stripeWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const signature = req.headers['stripe-signature'];

  if (!signature || Array.isArray(signature)) {
    res.status(400).send('Missing Stripe signature.');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Invalid webhook signature.';

    console.error(`Stripe webhook signature verification failed: ${message}`);

    res.status(400).send('Invalid Stripe webhook signature.');
    return;
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId =
        session.metadata?.paymentId ?? session.client_reference_id;

      if (!paymentId || !Types.ObjectId.isValid(paymentId)) {
        throw new Error('Stripe session is missing a valid payment ID.');
      }

      await createEnrollmentAfterPayment(paymentId, session);
    }

    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId =
        session.metadata?.paymentId ?? session.client_reference_id;

      if (paymentId && Types.ObjectId.isValid(paymentId)) {
        await Payment.findOneAndUpdate(
          {
            _id: paymentId,
            status: 'PENDING',
          },
          {
            $set: {
              status:
                event.type === 'checkout.session.expired'
                  ? 'EXPIRED'
                  : 'FAILED',
              failureReason:
                event.type === 'checkout.session.expired'
                  ? 'Stripe Checkout session expired.'
                  : 'Stripe reported an asynchronous payment failure.',
            },
          }
        );
      }
    }

    res.status(200).json({
      received: true,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to process Stripe webhook.';

    console.error(`Stripe webhook processing failed: ${message}`);

    res.status(500).json({
      received: false,
      message: 'Webhook processing failed.',
    });
  }
};
