import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

export const PaymentBadge = ({
  status,
  type,
  balanceCollected,
}: {
  status?: "pending" | "completed" | "failed" | "refunded" | "cancelled";
  type?: "deposit" | "full-payment";
  balanceCollected?: boolean;
}) => {
  if (!status) {
    return (
      <Badge className="bg-muted text-muted-foreground font-medium">
        No payment
      </Badge>
    );
  }

  const isDeposit = type === "deposit";
  const isSettled = status === "completed" && (!isDeposit || balanceCollected);

  return (
    <Badge
      className={cn(
        "font-medium",
        isSettled
          ? "bg-primary/10 text-primary"
          : status === "completed" && isDeposit
            ? "bg-amber-400/20 text-amber-600"
            : "bg-muted text-muted-foreground",
      )}
    >
      {isSettled
        ? "Paid in full"
        : status === "completed" && isDeposit
          ? "Deposit · balance due"
          : status === "failed"
            ? "Payment failed"
            : "Awaiting payment"}
    </Badge>
  );
};
