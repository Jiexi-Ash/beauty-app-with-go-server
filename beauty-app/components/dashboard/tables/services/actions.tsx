"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "sonner";

interface ActionProps {
  id: string;
}
function Actions({ id }: ActionProps) {
  // No DELETE /owner/services/{id} route exists on the Go API yet — stubbed.
  const handleDeleteService = () => {
    toast.info("Deleting services isn't wired up yet — coming soon.");
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-lg"
        className="rounded-lg cursor-pointer"
        aria-label="Edit service"
      >
        <Link href={`/dashboard/services/${id}`}>
          <PencilSimple className="size-4 text-primary" />
        </Link>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              className="rounded-lg cursor-pointer"
              aria-label="Delete service"
            />
          }
        >
          <Trash className="size-4 text-destructive" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <Trash className="text-destructive" weight="fill" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this service?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from your service list permanently. This
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep service</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteService}>
              Delete service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Actions;
