import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

export interface PendingCreditRefund {
  refundId: string;
  userId: string;
  cost: number;
  createdAt: string;
  attempts: number;
}

export interface RefundLogger {
  info?: (...args: any[]) => void;
  warn?: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export type QueryExecutor = (text: string, params?: any[]) => Promise<any>;

export interface RefundCreditOptions {
  userId: string;
  cost: number;
  executeQuery: QueryExecutor;
  logger: RefundLogger;
  retryDelaysMs?: number[];
  journalPath?: string | null;
  reconcileIntervalMs?: number;
}

const REFUND_SQL = 'UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2';
const DEFAULT_PROD_RETRY_DELAYS_MS = [150, 400];
const DEFAULT_TEST_RETRY_DELAYS_MS = [10, 20];
const DEFAULT_RECONCILE_INTERVAL_MS = 15_000;

const pendingRefunds = new Map<string, PendingCreditRefund>();
let reconcileTimer: NodeJS.Timeout | null = null;
let flushing = false;
let activeQueryExecutor: QueryExecutor | null = null;
let activeLogger: RefundLogger | null = null;
let activeJournalPath: string | null | undefined = undefined;

function resolveJournalPath(explicit?: string | null): string | null {
  if (explicit !== undefined) return explicit;
  if (process.env.CREDIT_REFUND_JOURNAL_PATH) return process.env.CREDIT_REFUND_JOURNAL_PATH;
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) return null;
  return path.join(os.tmpdir(), 'lingeria-pending-credit-refunds.json');
}

function defaultRetryDelays(): number[] {
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    return DEFAULT_TEST_RETRY_DELAYS_MS;
  }
  return DEFAULT_PROD_RETRY_DELAYS_MS;
}

function persistJournal(journalPath: string | null, logger?: RefundLogger | null): void {
  if (!journalPath) return;
  try {
    const items = Array.from(pendingRefunds.values());
    if (items.length === 0) {
      if (fs.existsSync(journalPath)) {
        fs.unlinkSync(journalPath);
      }
      return;
    }
    fs.mkdirSync(path.dirname(journalPath), { recursive: true });
    const tmpPath = `${journalPath}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(items, null, 2), { mode: 0o600 });
    fs.renameSync(tmpPath, journalPath);
  } catch (err: any) {
    logger?.error(
      { event: 'credit_refund_journal_write_failed', error: err?.message || String(err) },
      'Failed to persist pending credit refunds journal'
    );
  }
}

function loadJournal(journalPath: string | null, logger?: RefundLogger | null): void {
  if (!journalPath || !fs.existsSync(journalPath)) return;
  try {
    const raw = fs.readFileSync(journalPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const item of parsed) {
      if (
        item &&
        typeof item.refundId === 'string' &&
        typeof item.userId === 'string' &&
        typeof item.cost === 'number' &&
        Number.isFinite(item.cost) &&
        item.cost > 0 &&
        !pendingRefunds.has(item.refundId)
      ) {
        pendingRefunds.set(item.refundId, {
          refundId: item.refundId,
          userId: item.userId,
          cost: item.cost,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
          attempts: typeof item.attempts === 'number' ? item.attempts : 0,
        });
      }
    }
  } catch (err: any) {
    logger?.error(
      { event: 'credit_refund_journal_read_failed', error: err?.message || String(err) },
      'Failed to load pending credit refunds journal'
    );
  }
}

function stopReconcileTimer(): void {
  if (reconcileTimer) {
    clearInterval(reconcileTimer);
    reconcileTimer = null;
  }
}

function ensureReconcileTimer(intervalMs: number): void {
  if (reconcileTimer || pendingRefunds.size === 0) return;
  reconcileTimer = setInterval(() => {
    void flushPendingRefunds();
  }, intervalMs);
  reconcileTimer.unref();
}

export async function flushPendingRefunds(options?: {
  executeQuery?: QueryExecutor;
  logger?: RefundLogger;
  journalPath?: string | null;
}): Promise<{ recovered: number; remaining: number }> {
  const executeQuery = options?.executeQuery ?? activeQueryExecutor;
  const logger = options?.logger ?? activeLogger;
  const journalPath =
    options?.journalPath !== undefined
      ? options.journalPath
      : activeJournalPath !== undefined
        ? activeJournalPath
        : resolveJournalPath();

  if (pendingRefunds.size === 0 && journalPath) {
    loadJournal(journalPath, logger);
  }
  if (!executeQuery || pendingRefunds.size === 0 || flushing) {
    return { recovered: 0, remaining: pendingRefunds.size };
  }

  flushing = true;
  let recovered = 0;
  try {
    for (const item of Array.from(pendingRefunds.values())) {
      try {
        await executeQuery(REFUND_SQL, [item.cost, item.userId]);
        pendingRefunds.delete(item.refundId);
        recovered += 1;
        persistJournal(journalPath, logger);
        logger?.info?.(
          { event: 'credit_refund_recovered', refundId: item.refundId, userId: item.userId, cost: item.cost },
          'Recovered previously failed credit refund'
        );
      } catch (err: any) {
        item.attempts += 1;
        persistJournal(journalPath, logger);
        logger?.warn?.(
          {
            event: 'credit_refund_retry_failed',
            refundId: item.refundId,
            userId: item.userId,
            cost: item.cost,
            attempts: item.attempts,
            error: err?.message || String(err),
          },
          'Pending credit refund retry failed; will retry after DB recovery'
        );
        // Stop draining this cycle while DB is still unreachable.
        break;
      }
    }
  } finally {
    flushing = false;
    if (pendingRefunds.size === 0) {
      stopReconcileTimer();
    }
  }

  return { recovered, remaining: pendingRefunds.size };
}

export async function initCreditRefundRecovery(
  executeQuery: QueryExecutor,
  logger: RefundLogger,
  options?: { journalPath?: string | null; reconcileIntervalMs?: number }
): Promise<{ recovered: number; remaining: number }> {
  activeQueryExecutor = executeQuery;
  activeLogger = logger;
  const journalPath = resolveJournalPath(options?.journalPath);
  activeJournalPath = journalPath;
  loadJournal(journalPath, logger);
  const result = await flushPendingRefunds({ executeQuery, logger, journalPath });
  if (result.remaining > 0) {
    ensureReconcileTimer(options?.reconcileIntervalMs ?? DEFAULT_RECONCILE_INTERVAL_MS);
  }
  return result;
}

export async function refundReservedCredit(options: RefundCreditOptions): Promise<boolean> {
  const { userId, cost, executeQuery, logger } = options;
  const delays = options.retryDelaysMs ?? defaultRetryDelays();
  const journalPath = resolveJournalPath(options.journalPath);
  const intervalMs = options.reconcileIntervalMs ?? DEFAULT_RECONCILE_INTERVAL_MS;

  activeQueryExecutor = executeQuery;
  activeLogger = logger;
  activeJournalPath = journalPath;

  let lastErr: any;
  const totalAttempts = delays.length + 1;
  for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
    try {
      await executeQuery(REFUND_SQL, [cost, userId]);
      return true;
    } catch (err: any) {
      lastErr = err;
      if (attempt < delays.length && delays[attempt] > 0) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }
    }
  }

  const refundId = crypto.randomUUID();
  pendingRefunds.set(refundId, {
    refundId,
    userId,
    cost,
    createdAt: new Date().toISOString(),
    attempts: totalAttempts,
  });
  persistJournal(journalPath, logger);
  ensureReconcileTimer(intervalMs);

  logger.error(
    {
      event: 'credit_refund_deferred',
      refundId,
      userId,
      cost,
      attempts: totalAttempts,
      error: lastErr?.message || String(lastErr),
    },
    'Balance refund error: queued for automatic recovery'
  );

  return false;
}

export function getPendingRefundCount(): number {
  return pendingRefunds.size;
}

export function resetPendingRefundsForTest(): void {
  stopReconcileTimer();
  pendingRefunds.clear();
  flushing = false;
  activeQueryExecutor = null;
  activeLogger = null;
  activeJournalPath = undefined;
}
