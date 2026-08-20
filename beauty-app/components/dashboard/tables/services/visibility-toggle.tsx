"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { apiClient, ApiError } from "@/lib/api-client";
import { toast } from "sonner";

export default function VisibilityToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const queryClient = useQueryClient();
  const { mutate: toggle, isPending } = useMutation({
    mutationFn: () => apiClient.patch(`/owner/services/${id}/${isActive ? "deactivate" : "activate"}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-services"] });
      toast.success(isActive ? "Service hidden" : "Service is now visible to clients");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not update visibility.");
    },
  });

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="flex items-center"
    >
      <Switch checked={isActive} disabled={isPending} onCheckedChange={() => toggle()} />
    </div>
  );
}
