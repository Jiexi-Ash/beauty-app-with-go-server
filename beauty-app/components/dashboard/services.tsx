"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  CalendarCheck,
  Clock,
  DotsThreeVertical,
  Plus,
  Scissors,
  Tag,
  Trash,
  TrendUp,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
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
} from "../ui/alert-dialog";
import { DataTable } from "./tables/services/data-table";
import { columns, Service } from "./tables/services/columns";
import Link from "next/link";
import VisibilityToggle from "./tables/services/visibility-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { formatDuration, formatZar, formatZarFromRands } from "@/lib/utils";

// Raw shapes from the Go API (no json tags on the Go structs, PascalCase).
type OwnerService = {
  ID: string;
  Name: string;
  Description: string | null;
  DurationMinutes: number;
  PriceCents: number;
  IsActive: boolean;
  CategoryID: string;
  CoverImageUrl: string | null;
};
type CategoryRow = { ID: string; Name: string };

function useOwnerServices() {
  const servicesQuery = useQuery({
    queryKey: ["owner-services"],
    queryFn: () => apiClient.get<OwnerService[] | null>("/owner/services"),
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<CategoryRow[]>("/categories"),
  });

  const categoryMap = new Map((categoriesQuery.data ?? []).map((c) => [c.ID, c.Name]));

  const services: Service[] = (servicesQuery.data ?? []).map((s) => ({
    id: s.ID,
    name: s.Name,
    description: s.Description,
    category: categoryMap.get(s.CategoryID) ?? "Uncategorised",
    categoryId: s.CategoryID,
    duration: s.DurationMinutes,
    price: s.PriceCents,
    image: s.CoverImageUrl,
    isActive: s.IsActive,
  }));

  return { services, isLoading: servicesQuery.isLoading || categoriesQuery.isLoading };
}

function Services() {
  const { services, isLoading } = useOwnerServices();

  if (isLoading) {
    return (
      <div className="px-6 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const activeServices = services.filter((service) => service.isActive);

  const totalRevenue = services.reduce((acc, s) => acc + s.price, 0) / 100;
  const avgPrice = services.length > 0 ? totalRevenue / services.length : 0;
  const topCategory =
    services.length > 0
      ? Object.entries(
          services.reduce(
            (acc, s) => {
              acc[s.category] = (acc[s.category] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        ).sort((a, b) => b[1] - a[1])[0][0]
      : "N/A";

  const hiddenServices = services.filter((service) => !service.isActive);

  if (services.length === 0) {
    return (
      <div className="min-h-[60vh] w-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center ">
          <Image
            src="/no_data.svg"
            width={200}
            height={200}
            className="opacity-80"
            alt="no services"
          />
          <div className="flex flex-col items-center text-center gap-4 mt-6">
            <div className="space-y-1">
              <p className="text-lg font-bold">No services yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first service to get started.
              </p>
            </div>

            <Button className="text-sm cursor-pointer h-10 px-6" size="lg">
              <Link
                href="/dashboard/services/create-service"
                className="flex items-center gap-2"
              >
                <Plus className="size-4" />
                New Service
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="px-6 flex flex-col space-y-4 py-6 2xl:mx-auto 2xl:max-w-[1600px]">
        <div className="flex flex-col gap-3 lg:gap-0 lg:items-center lg:flex-row lg:justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-headline font-bold md:text-3xl">Services</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage your service list, pricing, duration, and
              visibility.
            </p>
          </div>

          <Button className="text-sm cursor-pointer h-10 px-6" size="lg">
            <Link
              href="/dashboard/services/create-service"
              className="flex items-center gap-2"
            >
              <Plus className="size-4" />
              New Service
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Scissors className="text-primary size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  Active
                </p>
                <p className="font-bold text-lg leading-tight">
                  {activeServices.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hiddenServices.length} hidden
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-400/20 rounded-full flex items-center justify-center shrink-0">
                <TrendUp className="text-green-600 size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  Average Price
                </p>
                <p className="font-bold text-lg leading-tight">
                  {formatZarFromRands(avgPrice)}
                </p>
                <p className="text-xs text-muted-foreground">per service</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-400/20 rounded-full flex items-center justify-center shrink-0">
                <CalendarCheck className="text-blue-600 size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  Total Services
                </p>
                <p className="font-bold text-lg leading-tight">
                  {services.length}
                </p>
                <p className="text-xs text-muted-foreground">all time</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-400/20 rounded-full flex items-center justify-center shrink-0">
                <Tag className="text-purple-600 size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  Top Category
                </p>
                <p className="font-bold text-lg leading-tight capitalize">
                  {topCategory}
                </p>
                <p className="text-xs text-muted-foreground">most services</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 block lg:hidden">
          <h3 className="text-base md:text-lg font-semibold">All Services</h3>
          <div className="flex flex-col gap-3 ">
            {services.map((service) => (
              <ServiceCard key={service.id} {...service} />
            ))}
          </div>
        </div>

        <ServicesDesktop services={services} />
      </div>
    </div>
  );
}

export default Services;

const ServiceCard = ({ id, category, duration, image, name, price, isActive }: Service) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // No DELETE /owner/services/{id} route exists on the Go API yet — stubbed.
  const handleDelete = () => {
    toast.info("Deleting services isn't wired up yet — coming soon.");
  };

  return (
    <>
      <Card key={id} className="w-full">
        <CardContent className="flex items-center justify-between p-4">
          <Link
            href={`/dashboard/services/${id}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <div className="relative w-20 h-20 rounded-full shrink-0">
              <Image
                src={image ?? "/salon-image-placeholder.jpg"}
                fill
                className="object-cover rounded-full"
                alt={`${name} image`}
              />
            </div>

            <div className="flex min-w-0 flex-col">
              <span className="text-primary text-xs uppercase font-semibold">
                {category}
              </span>
              <span className="truncate capitalize font-bold text-sm">
                {name}
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-primary font-bold">
                  {formatZar(price)}
                </span>

                <div className="flex items-center gap-1">
                  <Clock className="size-4 text-muted-foreground overflow-hidden" />
                  <span className="text-xs">{formatDuration(duration)}</span>
                </div>
              </div>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-3">
            <VisibilityToggle id={id} isActive={isActive} />
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Service actions">
                <DotsThreeVertical className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive border p-2"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <Trash className="text-destructive" weight="fill" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this service?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {name} from your service list permanently. This
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep service</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface ServicesDesktopProps {
  services: Service[];
}
const ServicesDesktop = ({ services }: ServicesDesktopProps) => {
  return (
    <Card className="hidden lg:block">
      <CardContent className="p-0">
        <DataTable columns={columns} data={services} />
      </CardContent>
    </Card>
  );
};
