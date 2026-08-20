"use client";

import { ArrowLeft, Camera, CircleNotch } from "@phosphor-icons/react";
import Image from "next/image";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "../ui/input-group";
import ImageCropDialog, { CroppedFile } from "../image-cropper";
import z from "zod";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import {
  CreateServiceSkeleton,
  IMAGE_UPLOAD_GUIDELINES,
} from "@/app/dashboard/services/create-service/page";
import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { SERVICE_DURATION_OPTIONS } from "@/app/constants";

// Raw shapes from the Go API (no json tags on the Go structs, PascalCase).
type OwnerService = {
  ID: string;
  Name: string;
  Description: string | null;
  DurationMinutes: number;
  PriceCents: number;
  CategoryID: string;
  CoverImageUrl: string | null;
};
type CategoryRow = { ID: string; Name: string };
type PresignResponse = { upload_url: string; public_url: string };

const serviceSchema = z.object({
  name: z.string().min(3, "Service name is required and needs to be at least 3 characters long"),
  categoryId: z.string().min(1, "Please select a category"),
  price: z.number().min(1, "Price must be a positive number"),
  description: z.string(),
  duration: z.number().min(1, "Please select a duration"),
});

function DashboardService({ id }: { id: string }) {
  const router = useRouter();
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["owner-services"],
    queryFn: () => apiClient.get<OwnerService[] | null>("/owner/services"),
  });
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<CategoryRow[]>("/categories"),
  });

  const service = (services ?? []).find((s) => s.ID === id);

  if (servicesLoading || categoriesLoading) return <CreateServiceSkeleton />;

  if (!service || !categories)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Service not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="size-4 mr-2" />
          Go Back
        </Button>
      </div>
    );

  return <DashboardServiceForm categories={categories} service={service} />;
}

export default DashboardService;

interface DashboardServiceFormProps {
  categories: CategoryRow[];
  service: OwnerService;
}

function DashboardServiceForm({ service, categories }: DashboardServiceFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverImage, setCoverImage] = useState<string | null>(service.CoverImageUrl);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);

  const form = useForm({
    defaultValues: {
      name: service.Name,
      categoryId: service.CategoryID,
      price: service.PriceCents / 100,
      description: service.Description ?? "",
      duration: service.DurationMinutes,
    },
    validators: { onSubmit: serviceSchema },
    onSubmit: async ({ value }) => {
      try {
        await apiClient.patch(`/owner/services/${service.ID}`, {
          name: value.name,
          duration_minutes: value.duration,
          price_cents: Math.round(value.price * 100),
          category_id: value.categoryId,
          description: value.description || undefined,
        });
        toast.success("Service updated successfully");
        router.push("/dashboard/services");
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

    setCoverImage(cropped.url);
    setIsUploadingImage(true);
    try {
      const { upload_url, public_url } = await apiClient.post<PresignResponse>(
        `/owner/services/${service.ID}/cover-image-upload-url`,
        { content_type: cropped.file.type },
      );

      const uploadResponse = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": cropped.file.type },
        body: cropped.file,
      });
      if (!uploadResponse.ok) throw new Error("Failed to upload service image.");

      const current = form.state.values;
      await apiClient.patch(`/owner/services/${service.ID}`, {
        name: current.name,
        duration_minutes: current.duration,
        price_cents: Math.round(current.price * 100),
        category_id: current.categoryId,
        cover_image_url: public_url,
      });
      toast.success("Service image updated");
    } catch {
      toast.error("Failed to upload service image.");
      setCoverImage(service.CoverImageUrl);
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen w-full">
      <div className="space-y-6 px-6 pt-4 pb-6">
        <div>
          <h1 className="text-2xl font-headline font-bold">Edit Service</h1>
          <p className="text-sm text-muted-foreground">Update your service details</p>
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
            <Field>
              <Input
                id="cover-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleSelectImage}
              />
              <div className="relative w-2/3 aspect-4/3 bg-card rounded-lg shadow-lg overflow-hidden">
                <Image
                  src={coverImage ?? "/salon-image-placeholder.jpg"}
                  fill
                  className="object-cover rounded-lg"
                  alt="Service image"
                />
                <div
                  className={cn(
                    "group absolute flex flex-col gap-2 items-center justify-center inset-0 z-10 rounded cursor-pointer duration-200 ease-in-out",
                    coverImage ? "bg-transparent hover:bg-background/60" : "bg-background/60",
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploadingImage ? (
                    <CircleNotch className="size-8 text-primary animate-spin" />
                  ) : (
                    <>
                      <div className="bg-secondary w-14 h-14 rounded-full flex justify-center items-center">
                        <Camera weight="fill" className="size-8 text-primary" />
                      </div>
                      <span className="text-foreground font-bold">
                        {coverImage ? "Change Service image" : "Upload Service Image"}
                      </span>
                      <span className="text-sm">PNG, JPG 5MB</span>
                    </>
                  )}
                </div>
              </div>
            </Field>

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
                    <InputGroupText className="tabular-nums">{field.state.value?.length ?? 0}/250 characters</InputGroupText>
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
            onClick={() => router.push("/dashboard/services")}
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
