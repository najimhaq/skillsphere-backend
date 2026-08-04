import type { Request, Response } from 'express';
import type { ParsedQs } from 'qs';

import { AdminActivityLog } from '../../models/admin/admin-activity-log.model.js';
import {
  ADMIN_ACTIVITY_ACTIONS,
  type AdminActivityAction,
} from '../../types/admin/admin-activity-log.js';

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 50;

const getSingleQueryValue = (
  value: string | string[] | ParsedQs | Array<string | ParsedQs> | undefined
): string | undefined => {
  if (Array.isArray(value)) {
    const firstValue = value[0];

    return typeof firstValue === 'string' ? firstValue : undefined;
  }

  return typeof value === 'string' ? value : undefined;
};

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number,
  maximum?: number
) => {
  const parsedValue = Number.parseInt(value ?? '', 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  if (maximum && parsedValue > maximum) {
    return maximum;
  }

  return parsedValue;
};

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const isAdminActivityAction = (value: string): value is AdminActivityAction => {
  return ADMIN_ACTIVITY_ACTIONS.includes(value as AdminActivityAction);
};

const getActivityLogFilter = (req: Request) => {
  const actionQuery = getSingleQueryValue(req.query.action);
  const searchQuery = getSingleQueryValue(req.query.search)?.trim() ?? '';

  if (
    actionQuery &&
    actionQuery !== 'ALL' &&
    !isAdminActivityAction(actionQuery)
  ) {
    return {
      error: 'Invalid activity action filter.',
    };
  }

  const filter: Record<string, unknown> = {};

  if (actionQuery && actionQuery !== 'ALL') {
    filter.action = actionQuery;
  }

  if (searchQuery) {
    const searchPattern = new RegExp(escapeRegex(searchQuery), 'i');

    filter.$or = [
      { actorName: searchPattern },
      { actorEmail: searchPattern },
      { targetName: searchPattern },
      { targetEmail: searchPattern },
      { action: searchPattern },
    ];
  }

  return { filter };
};

const formatCsvValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }

  const text =
    typeof value === 'string'
      ? value
      : typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : JSON.stringify(value);

  return `"${text.replace(/"/g, '""')}"`;
};

const getChangedField = (
  previousValue: Record<string, unknown> | null | undefined,
  nextValue: Record<string, unknown> | null | undefined
) => {
  const key =
    Object.keys(nextValue ?? {})[0] ??
    Object.keys(previousValue ?? {})[0] ??
    '';

  return {
    field: key,
    previous: previousValue?.[key] ?? null,
    next: nextValue?.[key] ?? null,
  };
};

export const getAdminActivityLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  const filterResult = getActivityLogFilter(req);

  if ('error' in filterResult) {
    res.status(400).json({
      success: false,
      message: filterResult.error,
    });
    return;
  }

  const page = parsePositiveInteger(getSingleQueryValue(req.query.page), 1);

  const limit = parsePositiveInteger(
    getSingleQueryValue(req.query.limit),
    DEFAULT_LIMIT,
    MAX_LIMIT
  );

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AdminActivityLog.find(filterResult.filter)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    AdminActivityLog.countDocuments(filterResult.filter),
  ]);

  res.status(200).json({
    success: true,
    data: logs.map((log) => ({
      _id: log._id.toString(),

      actor: {
        _id: log.actorId.toString(),
        name: log.actorName,
        email: log.actorEmail,
      },

      action: log.action,

      target: {
        type: log.targetType,
        _id: log.targetId.toString(),
        name: log.targetName,
        email: log.targetEmail ?? null,
      },

      previousValue: log.previousValue ?? null,
      nextValue: log.nextValue ?? null,
      note: log.note ?? null,

      createdAt: log.createdAt,
    })),

    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
};

export const exportAdminActivityLogsCsv = async (
  req: Request,
  res: Response
): Promise<void> => {
  const filterResult = getActivityLogFilter(req);

  if ('error' in filterResult) {
    res.status(400).json({
      success: false,
      message: filterResult.error,
    });
    return;
  }

  const logs = await AdminActivityLog.find(filterResult.filter)
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .lean();

  const header = [
    'Date and time',
    'Admin name',
    'Admin email',
    'Action',
    'Target type',
    'Target name',
    'Target email',
    'Changed field',
    'Previous value',
    'New value',
    'Review note',
  ];

  const rows = logs.map((log) => {
    const change = getChangedField(log.previousValue, log.nextValue);

    return [
      log.createdAt.toISOString(),
      log.actorName,
      log.actorEmail,
      log.action,
      log.targetType,
      log.targetName,
      log.targetEmail ?? '',
      change.field,
      change.previous,
      change.next,
      log.note ?? '',
    ].map(formatCsvValue);
  });

  const csvContent = [
    header.map(formatCsvValue).join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const date = new Date().toISOString().slice(0, 10);

  res.status(200);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="skillsphere-activity-log-${date}.csv"`
  );
  res.setHeader('Cache-Control', 'no-store');

  res.send(`\uFEFF${csvContent}`);
};
