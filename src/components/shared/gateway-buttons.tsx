"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { gatewayLabel } from "@/lib/payment-labels";

interface GatewayButtonsProps {
  /** Exactly the names `GET /payment/gateways` returned. */
  gateways: readonly string[];
  /** The gateway whose payment is being started, if any. */
  pendingGateway: string | null;
  disabled?: boolean;
  onSelect: (gateway: string) => void;
}

/** One button per enabled gateway. Starting a payment disables all of them and shows a loader on the chosen one. */
export function GatewayButtons({
  gateways,
  pendingGateway,
  disabled = false,
  onSelect,
}: GatewayButtonsProps) {
  const busy = pendingGateway !== null;
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {gateways.map((gateway, index) => (
        <Button
          key={gateway}
          type="button"
          variant={index === 0 ? "default" : "outline"}
          disabled={disabled || busy}
          aria-busy={pendingGateway === gateway}
          onClick={() => onSelect(gateway)}
          className="w-full sm:w-auto"
        >
          {pendingGateway === gateway ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Opening {gatewayLabel(gateway)}
            </>
          ) : (
            `Pay with ${gatewayLabel(gateway)}`
          )}
        </Button>
      ))}
    </div>
  );
}
