"use client";

import { useState } from "react";
import { ClipboardList, Eye } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { Pagination } from "@/components/shared/pagination";
import { TextFilter } from "@/components/shared/text-filter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDateTime } from "@/lib/format";
import type { AuditLogRow } from "@/types/admin";
import { useAuditLogs } from "../../_hooks/use-admin-queries";

const DEFAULT_LIMIT = 20;

/** Pretty-printed JSON as plain text. It is rendered as a text node, so it is never parsed as HTML. */
function toJsonText(value: unknown): string {
  if (value === null || value === undefined) return "No data recorded";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "This value cannot be shown";
  }
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="min-w-0 space-y-1.5">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <pre
        tabIndex={0}
        aria-label={`${title} JSON`}
        className="max-h-64 overflow-auto rounded-lg border bg-muted p-3 font-mono text-xs break-words whitespace-pre-wrap text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {toJsonText(value)}
      </pre>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm break-words text-foreground">{value || "Not recorded"}</dd>
    </div>
  );
}

function AuditLogDialog({ log, onClose }: { log: AuditLogRow | null; onClose: () => void }) {
  return (
    <Dialog open={log !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {log ? (
          <>
            <DialogHeader>
              <DialogTitle>{log.action}</DialogTitle>
              <DialogDescription>
                {log.entity} · {formatDateTime(log.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Detail label="Entity id" value={log.entityId} />
              <Detail label="Actor email" value={log.actorEmail} />
              <Detail label="Actor id" value={log.actorId} />
              <Detail label="Actor role" value={log.actorRole} />
              <Detail label="IP address" value={log.ipAddress} />
              <Detail label="User agent" value={log.userAgent} />
            </dl>
            <div className="grid gap-4 md:grid-cols-2">
              <JsonBlock title="Before" value={log.before} />
              <JsonBlock title="After" value={log.after} />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

const COLUMNS: DataTableColumn<AuditLogRow>[] = [
  {
    key: "action",
    header: "Action",
    cell: (log) => (
      <div className="max-w-56 min-w-0">
        <p className="truncate font-medium text-foreground" title={log.action}>
          {log.action}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={log.entity}>
          {log.entity}
        </p>
      </div>
    ),
  },
  {
    key: "actor",
    header: "Actor",
    cell: (log) => (
      <div className="max-w-56 min-w-0">
        <p className="truncate text-sm text-foreground" title={log.actorEmail ?? "System"}>
          {log.actorEmail ?? "System"}
        </p>
        {log.actorRole ? <p className="truncate text-xs text-muted-foreground">{log.actorRole}</p> : null}
      </div>
    ),
  },
  {
    key: "createdAt",
    header: "When",
    cell: (log) => <span className="text-sm text-muted-foreground">{formatDateTime(log.createdAt)}</span>,
  },
];

export function AuditLogsList() {
  const { page, limit, getParam } = useUrlState({ defaultLimit: DEFAULT_LIMIT });
  const action = getParam("action");
  const entity = getParam("entity");
  const actorId = getParam("actorId");
  const actorEmail = getParam("actorEmail");
  const query = useAuditLogs({ page, limit, action, entity, actorId, actorEmail });
  const [selected, setSelected] = useState<AuditLogRow | null>(null);

  const filtered = Boolean(action || entity || actorId || actorEmail);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TextFilter param="action" label="Action contains" placeholder="e.g. USER_BLOCKED" className="sm:w-full" />
        <TextFilter param="entity" label="Entity" placeholder="e.g. User" className="sm:w-full" />
        <TextFilter param="actorEmail" label="Actor email contains" placeholder="e.g. admin@" className="sm:w-full" />
        <TextFilter param="actorId" label="Actor id" placeholder="Exact id" className="sm:w-full" />
      </div>

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          caption="Audit logs"
          columns={COLUMNS}
          rows={query.data?.rows ?? []}
          getRowId={(log) => log.id}
          isLoading={query.isPending}
          skeletonRows={8}
          actions={(log) => (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`View details of ${log.action}`}
              onClick={() => setSelected(log)}
            >
              <Eye aria-hidden="true" />
            </Button>
          )}
          empty={{
            icon: ClipboardList,
            title: filtered ? "No log entries match these filters" : "No log entries yet",
            description: filtered
              ? "Try a different action, entity or actor."
              : "Admin and system actions are recorded here.",
          }}
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}

      <AuditLogDialog log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
