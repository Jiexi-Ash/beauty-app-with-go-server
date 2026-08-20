"use client";

import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Actions from "./actions";
import { cn, formatDuration, formatZar } from "@/lib/utils";
import VisibilityToggle from "./visibility-toggle";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  categoryId: string;
  duration: number;
  price: number;
  image: string | null;
  isActive: boolean;
};

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: "name",
    header: () => (
      <div className="text-muted-foreground text-xs font-semibold">
        SERVICE NAME
      </div>
    ),
    cell: ({ row }) => {
      const service = row.original;

      return (
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-12 rounded-full">
            <Image
              src={service.image ?? "/salon-image-placeholder.jpg"}
              fill
              className={cn(
                "object-cover rounded-full",
                !service.isActive && "grayscale-100",
              )}
              alt={`${service.name} image`}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold capitalize">{service.name}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: () => (
      <div className="text-muted-foreground text-xs font-semibold">
        CATEGORY
      </div>
    ),
    cell: ({ row }) => {
      const category = row.getValue("category") as string;

      return (
        <Badge className="capitalize bg-secondary text-secondary-foreground">
          {category}
        </Badge>
      );
    },
  },
  {
    accessorKey: "price",
    header: () => (
      <div className="text-muted-foreground text-xs font-semibold">PRICE</div>
    ),
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));

      return <div className="font-semibold">{formatZar(price)}</div>;
    },
  },
  {
    accessorKey: "duration",
    header: () => (
      <div className="text-muted-foreground text-xs font-semibold">
        DURATION
      </div>
    ),
    cell: ({ row }) => {
      const duration = parseInt(row.getValue("duration"));

      return <div className="text-muted-foreground">{formatDuration(duration)}</div>;
    },
  },
  {
    accessorKey: "isActive",
    header: () => (
      <div className="text-muted-foreground text-xs font-semibold">
        VISIBILITY
      </div>
    ),
    cell: ({ row }) => {
      const service = row.original;

      return <VisibilityToggle id={service.id} isActive={service.isActive} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <Actions id={row.original.id} />;
    },
  },
];
