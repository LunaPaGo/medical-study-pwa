import { localDbPromise } from '../../storage/localDb';

const cleanupCacheKey = 'cleanup:obsolete-procedure-sync-queue:v1';

function isObsoleteProcedureError(lastError?: string) {
  if (!lastError) return false;
  const normalized = lastError.toLowerCase();
  return (
    normalized.includes('23502') &&
    normalized.includes('null value in column') &&
    (normalized.includes('"title"') || normalized.includes('"category"'))
  );
}

export async function cleanupObsoleteProcedureSyncQueue() {
  const db = await localDbPromise;
  const alreadyRan = await db.get('app_cache', cleanupCacheKey);
  if (alreadyRan) return;

  const procedureItems = (await db.getAll('sync_queue')).filter(
    (item) => item.entity === 'procedure' && isObsoleteProcedureError(item.last_error)
  );

  if (procedureItems.length > 0) {
    const tx = db.transaction('sync_queue', 'readwrite');
    await Promise.all(procedureItems.map((item) => tx.store.delete(item.id)));
    await tx.done;
    window.dispatchEvent(new Event('sync-queue-changed'));
  }

  await db.put('app_cache', {
    key: cleanupCacheKey,
    value: { removed: procedureItems.length },
    updated_at: new Date().toISOString()
  });
}
