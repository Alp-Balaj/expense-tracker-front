import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import LoadingSpinner from "@/Components/General/LoadingSpinner";
import PotFormModal from "@/Components/Pots/PotFormModal";
import { getApiErrorMessage } from "@/lib/errors";
import { formatPosition, formatPotAmount } from "@/lib/potMoney";
import { cn } from "@/lib/utils";
import { useCreatePot, usePotsQuery } from "@/Hooks/queries/usePots";

/**
 * Cycle U W1: the pots a person belongs to.
 *
 * A user in no pots sees an empty state and nothing else — this route is the
 * only place in the app that mentions pots at all, which is deliberate. The
 * dashboard, the export and the category list are untouched by this wave and
 * pinned that way by tests on both sides.
 */
export default function PotsPage() {
  const [formOpen, setFormOpen] = useState(false);

  const { data: pots = [], isLoading } = usePotsQuery();
  const createPot = useCreatePot();

  const handleCreate = async (data: { name: string; lowBalanceThreshold: number }) => {
    try {
      await createPot.mutateAsync({
        name: data.name,
        lowBalanceThreshold: data.lowBalanceThreshold,
      });
      toast.success("Pot created. Invite someone to it.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not create that pot."));
      throw e; // keep the form open — see PotFormModal
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-[-0.01em]">Pots</h1>
          <p className="text-sm text-muted-foreground">
            Shared wallets — a household, a flat, a trip.
          </p>
        </div>

        <Button type="button" onClick={() => setFormOpen(true)} className="h-11">
          <Plus className="mr-2 h-4 w-4" />
          New pot
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : pots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <Users className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="font-medium text-foreground">You are not in any pots</p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Create one to share costs with other people, or open an invite link somebody
                sent you.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => setFormOpen(true)}>
              Create a pot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pots.map((pot) => (
            <Link
              key={pot.id}
              to={`/pots/${pot.id}`}
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  >
                    <Users className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{pot.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pot.memberCount} {pot.memberCount === 1 ? "member" : "members"} ·{" "}
                      {formatPotAmount(pot.balance, pot.currencyCode)} in the pot
                      {pot.isLow ? " · running low" : ""}
                    </p>
                    {/* Two facts, not one: the pot's cash, then where this
                        reader stands against it. A member can be up while the
                        pot is nearly empty, and that is not a contradiction. */}
                    <p
                      className={cn(
                        "text-sm tabular-nums",
                        pot.yourPosition > 0 && "text-emerald-600 dark:text-emerald-400",
                        pot.yourPosition < 0 && "text-destructive",
                        pot.yourPosition === 0 && "text-muted-foreground",
                      )}
                    >
                      {formatPosition(pot.yourPosition, pot.currencyCode)} yours
                    </p>
                  </div>

                  <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <PotFormModal open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
    </div>
  );
}
