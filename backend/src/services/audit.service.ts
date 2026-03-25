import { AuditEntryModel } from '../models/AuditEntry';

export interface AuditEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentUsername: string;
  action: 'search' | 'view_user' | 'verify_user' | 'reveal_phone' | 'login';
  target?: string;
  details?: string;
}

export function logAction(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
  void AuditEntryModel.create({
    ...entry,
    timestamp: new Date(),
  }).catch((err) => {
    console.error('Failed to write audit entry:', err);
  });

  console.log(`[AUDIT] ${entry.action} by ${entry.agentUsername} | target: ${entry.target || '-'} | ${entry.details || ''}`);
}

export async function getAuditLog(
  page: number = 1,
  limit: number = 50
): Promise<{ entries: AuditEntry[]; total: number }> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const skip = (safePage - 1) * safeLimit;

  const [docs, total] = await Promise.all([
    AuditEntryModel.find({})
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    AuditEntryModel.countDocuments({}),
  ]);

  const entries: AuditEntry[] = docs.map((d: any) => ({
    id: String(d._id),
    timestamp: new Date(d.timestamp).toISOString(),
    agentId: d.agentId,
    agentUsername: d.agentUsername,
    action: d.action,
    target: d.target,
    details: d.details,
  }));

  return { entries, total };
}
