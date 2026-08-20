"use client";

import ImageCropDialog, { CroppedFile } from "@/components/image-cropper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Camera, CircleNotch, Check } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as z from "zod";
import { SERVICE_DURATION_OPTIONS } from "@/app/constants";

// Raw shapes from the Go API (no json tags on the Go structs, PascalCase).
type OwnerService = { ID: string; Name: string; DurationMinutes: number; PriceCents: number; CategoryID: string };
type CategoryRow = { ID: string; Name: string };
type PresignResponse = { upload_url: string; public_url: string };

export const IMAGE_UPLOAD_GUIDELINES = {
  maxFileSize: 5 * 1024 * 1024,
  acceptedFormats: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

const serviceSchema = z.object({
  name: z.string().min(3, "Service name is required and needs to be at least 3 characters long"),
  categoryId: z.string().min(1, "Please select a category"),
  price: z.number().min(1, "Price must be a positive number"),
  description: z.string(),
  duration: z.number().min(1, "Please select a duration"),
});

function DashboardCreateServicePage() {
  const { data: categories, isLoading, error, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<CategoryRow[]>("/categories"),
  });

  if (isLoading) return <CreateServiceSkeleton />;

  if (error || !categories || categories.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Failed to load categories</p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );

  return <CreateServiceForm categories={categories} />;
}

export default DashboardCreateServicePage;

export function CreateServiceSkeleton() {
  return (
    <div className="min-h-screen w-full">
      <div className="space-y-6 px-6 pt-4 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-24 rounded-full" />
        <div className="w-full max-w-xl space-y-3">
          <Skeleton className="w-2/3 aspect-4/3 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface CreateServiceFormProps {
  categories: CategoryRow[];
}

export const CreateServiceForm = ({ categories }: CreateServiceFormProps) => {
  const router = useRouter();
  const [createdService, setCreatedService] = useState<OwnerService | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      categoryId: categories[0].ID,
      price: 100,
      description: "",
      duration: 60,
    },
    validators: { onSubmit: serviceSchema },
    onSubmit: async ({ value }) => {
      try {
        const created = await apiClient.post<OwnerService>("/owner/services", {
          name: value.name,
          description: value.description || undefined,
          duration_minutes: value.duration,
          price_cents: Math.round(value.price * 100),
          category_id: value.categoryId,
        });
        toast.success("Service created successfully");
        setCreatedService(created);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Something went wrong.");
      }
    },
  });

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!IMAGE_UPLOAD_GUIDELINES.acceptedFormats.includes(file.type)) {
      toast.error("Invalid file format", { description: "Please upload JPEG, PNG, or WebP images only" });
      return;
    }
    if (file.size > IMAGE_UPLOAD_GUIDELINES.maxFileSize) {
      toast.error("File too large", { description: "Max 5MB" });
      return;
    }
    setPendingCropFile(file);
  };

  const handleCropConfirm = async (cropped: CroppedFile) => {
    setPendingCropFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!createdService) return;

    setCoverPreview(cropped.url);
    setIsUploading(true);
    try {
      const { upload_url, public_url } = await apiClient.post<PresignResponse>(
        `/owner/services/${createdService.ID}/cover-image-upload-url`,
        { content_type: cropped.file.type },
      );

      const uploadResponse = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": cropped.file.type },
        body: cropped.file,
      });
      if (!uploadResponse.ok) throw new Error("Failed to upload service image.");

      await apiClient.patch(`/owner/services/${createdService.ID}`, {
        name: createdService.Name,
        duration_minutes: createdService.DurationMinutes,
        price_cents: createdService.PriceCents,
        category_id: createdService.CategoryID,
        cover_image_url: public_url,
      });
      toast.success("Service image added");
    } catch {
      toast.error("Failed to upload service image. You can add one later.");
      setCoverPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  if (createdService) {
    return (
      <div className="min-h-screen w-full">
        <div className="space-y-6 px-6 pt-4 pb-6 max-w-xl">
          <div className="flex items-center gap-2 text-primary">
            <Check className="size-5" weight="bold" />
            <p className="font-semibold">{createdService.Name} is created!</p>
          </div>

          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSelectImage}
            />
            <div className="relative w-2/3 aspect-4/3 bg-card rounded-lg shadow-lg overflow-hidden">
              {coverPreview && (
                <Image src={coverPreview} fill className="object-cover rounded-lg" alt="Service image" />
              )}
              <div
                className={cn(
                  "group absolute flex flex-col gap-2 items-center justify-center inset-0 z-10 rounded cursor-pointer duration-200 ease-in-out",
                  coverPreview ? "bg-transparent hover:bg-background/60" : "bg-background/60",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <CircleNotch className="size-8 text-primary animate-spin" />
                ) : (
                  <>
                    <div className="bg-secondary w-14 h-14 rounded-full flex justify-center items-center">
                      <Camera weight="fill" className="size-8 text-primary" />
                    </div>
                    <span className="text-foreground font-bold">
                      {coverPreview ? "Change service image" : "Add a service image (optional)"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="rounded-full" onClick={() => router.push("/dashboard/services")}>
              Skip for now
            </Button>
            <Button className="rounded-full" disabled={isUploading} onClick={() => router.push("/dashboard/services")}>
              Done
            </Button>
          </div>
        </div>

        {pendingCropFile && (
          <ImageCropDialog
            file={pendingCropFile}
            isPrimary
            primaryAspect={4 / 3}
            onCropConfirm={handleCropConfirm}
            onCancel={() => {
              setPendingCropFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="space-y-6 px-6 pt-4 pb-6">
        <div>
          <h1 className="text-2xl font-headline font-bold">Create New Service</h1>
          <p className="text-sm text-muted-foreground">
            Add a new service to your business to start taking bookings
          </p>
        </div>

        <Button
          variant="outline"
          className="text-primary h-10"
          onClick={() => router.back()}
          size="lg"
        >
          <ArrowLeft className="text-primary size-4" />
          Go Back
        </Button>

        <form
          id="service-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="w-full max-w-xl pl-1"
        >
          <FieldGroup className="space-y-3">
            <form.Field name="name">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Service Name</FieldLabel>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Box braids"
                      autoComplete="off"
                      className="h-9 bg-muted placeholder:text-sm rounded-sm border-none"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <div className="flex flex-col gap-3 md:flex-row">
              <form.Field name="categoryId">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                      <Select onValueChange={(val) => field.handleChange(val ?? "")} value={field.state.value}>
                        <SelectTrigger id={field.name} onBlur={field.handleBlur} className="h-9 bg-muted rounded-sm border-none">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((opt) => (
                            <SelectItem className="capitalize" key={opt.ID} value={opt.ID}>
                              {opt.Name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="price">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Price (R)</FieldLabel>
                      <div className="flex gap-0.5 items-center bg-muted rounded-sm pl-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                        <div className="font-semibold text-primary">R</div>
                        <Input
                          id={field.name}
                          onBlur={field.handleBlur}
                          value={field.state.value === 0 ? "" : field.state.value}
                          onChange={(e) => field.handleChange(e.target.value === "" ? 0 : Number(e.target.value))}
                          aria-invalid={isInvalid}
                          placeholder="0.00"
                          type="number"
                          className="h-9 placeholder:text-sm border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                        />
                      </div>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
            </div>

            <form.Field name="duration">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Duration</FieldLabel>
                    <Select
                      onValueChange={(val) => field.handleChange(Number(val))}
                      value={field.state.value ? String(field.state.value) : undefined}
                    >
                      <SelectTrigger id={field.name} onBlur={field.handleBlur} className="h-9 bg-muted rounded-sm border-none">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Description (optional)</FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      id={field.name}
                      onBlur={field.handleBlur}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="This can be a brief information about the service"
                      rows={6}
                      className="h-9 bg-muted placeholder:text-sm rounded-sm border-none min-h-24"
                    />
                  </InputGroup>
                  <InputGroupAddon align="block-end">
                    <InputGroupText className="tabular-nums">{field.state.value.length}/250 characters</InputGroupText>
                  </InputGroupAddon>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>
      </div>

      <footer className="sticky bottom-0 bg-background z-50 border-t border-border p-6">
        <div className="flex gap-3 md:justify-end">
          <Button
            variant="secondary"
            type="button"
            onClick={() => router.back()}
            className="flex-1 md:flex-none h-12 px-6 rounded-full"
            size="lg"
          >
            Cancel
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                form="service-form"
                className="flex-1 md:flex-none h-12 px-6 rounded-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircleNotch className="text-primary-foreground animate-spin size-4" /> : "Save Service"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </footer>
    </div>
  );
};
