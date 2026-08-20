"use client";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, CircleNotch, Check } from "@phosphor-icons/react";
import * as z from "zod";
import { useDebouncedCallback } from "use-debounce";
import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import ImageCropDialog, { CroppedFile } from "../image-cropper";

// Raw db.Salon shape (no json tags on the Go struct — see salons.go).
type OwnerSalon = { ID: string; Name: string; Location: string };

type PlacePrediction = { placeId: string; text: { text: string } };
type PresignResponse = { upload_url: string; public_url: string };
type TagRow = { ID: string; Name: string };

const detailsSchema = z.object({
  name: z.string().min(3, "Business name needs to be at least 3 characters long."),
  description: z.string().max(250, "Keep it under 250 characters."),
  address: z.string().min(1, "Choose an address from the suggestions"),
  city: z.string(),
  phone: z.string(),
  tagIds: z.array(z.string()).max(3, "You can only select up to 3 tags"),
});

const ACCEPTED_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function BusinessDetailForm() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const [salon, setSalon] = useState<OwnerSalon | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: () => apiClient.get<TagRow[] | null>("/tags"),
  });

  const form = useForm({
    defaultValues: { name: "", description: "", address: "", city: "", phone: "", tagIds: [] as string[] },
    validators: { onBlur: detailsSchema, onSubmit: detailsSchema },
    onSubmit: async ({ value }) => {
      try {
        const created = await apiClient.post<OwnerSalon>("/salons", {
          name: value.name,
          location: value.address,
          city: value.city || undefined,
          phone: value.phone || undefined,
          description: value.description || undefined,
          tag_ids: value.tagIds,
        });
        setSalon(created);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Something went wrong.");
      }
    },
  });

  const handleAddressChange = useDebouncedCallback(async (value: string) => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const predictions = await apiClient.get<PlacePrediction[]>(
        `/places/autocomplete?input=${encodeURIComponent(value)}`,
      );
      setSuggestions(
        (predictions ?? []).map((p) => ({ description: p.text.text, placeId: p.placeId })),
      );
    } catch {
      setSuggestions([]);
    }
  }, 400);

  const handleSelectCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_FORMATS.includes(file.type)) {
      toast.error("Invalid file format", { description: "Please upload JPEG, PNG, or WebP images only" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", { description: "Max 5MB" });
      return;
    }
    setPendingCropFile(file);
  };

  const handleCropConfirm = async (cropped: CroppedFile) => {
    setPendingCropFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!salon) return;

    setCoverPreview(cropped.url);
    setIsUploading(true);
    try {
      const { upload_url, public_url } = await apiClient.post<PresignResponse>(
        "/owner/salon/cover-image-upload-url",
        { content_type: cropped.file.type },
      );

      const uploadResponse = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": cropped.file.type },
        body: cropped.file,
      });
      if (!uploadResponse.ok) throw new Error("Failed to upload cover photo");

      await apiClient.patch("/owner/salon", {
        name: salon.Name,
        location: salon.Location,
        cover_image_url: public_url,
      });
      toast.success("Cover photo added");
    } catch {
      toast.error("Failed to upload cover photo. You can add one later from settings.");
      setCoverPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  if (salon) {
    return (
      <div className="max-w-xl space-y-6">
        <div className="flex items-center gap-2 text-primary">
          <Check className="size-5" weight="bold" />
          <p className="font-semibold">Your salon is created!</p>
        </div>

        <div className="space-y-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSelectCoverImage}
          />
          <div className="relative w-full h-40 md:h-56 bg-white rounded-xl shadow-sm overflow-hidden border border-border">
            {coverPreview && (
              <Image src={coverPreview} fill className="object-cover" alt="Cover preview" />
            )}
            <div
              className="group hover:bg-white/40 duration-200 ease-in-out absolute flex flex-col gap-2 items-center justify-center inset-0 bg-white/60 z-10 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <CircleNotch className="size-8 text-primary animate-spin" />
              ) : (
                <>
                  <div className="bg-secondary w-14 h-14 rounded-full flex justify-center items-center">
                    <Camera weight="fill" className="size-8 text-primary" />
                  </div>
                  <span className="text-black font-bold">
                    {coverPreview ? "Change cover photo" : "Add a cover photo (optional)"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => router.push("/dashboard")}
          >
            Skip for now
          </Button>
          <Button
            className="rounded-full"
            disabled={isUploading}
            onClick={() => router.push("/dashboard")}
          >
            Go to dashboard
          </Button>
        </div>

        {pendingCropFile && (
          <ImageCropDialog
            file={pendingCropFile}
            isPrimary
            primaryAspect={16 / 9}
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
    <form
      id="business-details-form"
      className="w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup className="space-y-4">
        <form.Field name="name">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Business Name</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Katlego's Nail Bar"
                  className="h-11"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Description (optional)</FieldLabel>
              <Textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="What do you do? Who is it for?"
                rows={4}
                maxLength={250}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="address">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                <div className="relative">
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={() => {
                      field.handleBlur();
                      setTimeout(() => setSuggestions([]), 100);
                    }}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      handleAddressChange(e.target.value);
                    }}
                    aria-invalid={isInvalid}
                    placeholder="123 Main str, 1321"
                    autoComplete="off"
                    className="h-11"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-border overflow-hidden">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.placeId}
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            field.handleChange(suggestion.description);
                            field.handleBlur();
                            setSuggestions([]);
                          }}
                        >
                          {suggestion.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="tagIds">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            const selectedTags = field.state.value;
            const toggleTag = (tagId: string) => {
              const isSelected = selectedTags.includes(tagId);
              if (isSelected) {
                field.handleChange(selectedTags.filter((t) => t !== tagId));
              } else {
                if (selectedTags.length >= 3) {
                  toast.error("Maximum 3 tags allowed", { description: "Remove a tag before adding a new one" });
                  return;
                }
                field.handleChange([...selectedTags, tagId]);
              }
              field.handleBlur();
            };
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel>
                  Business Tags
                  <span className="text-muted-foreground font-normal ml-1 text-xs">(select up to 3)</span>
                </FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {(tags ?? []).map((tag) => {
                    const isSelected = selectedTags.includes(tag.ID);
                    return (
                      <button
                        key={tag.ID}
                        type="button"
                        onClick={() => toggleTag(tag.ID)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {tag.Name}
                      </button>
                    );
                  })}
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="city">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>City (optional)</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-11"
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Phone (optional)</FieldLabel>
                <Input
                  id={field.name}
                  type="tel"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-11"
                />
              </Field>
            )}
          </form.Field>
        </div>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" size="lg" disabled={isSubmitting} className="rounded-full">
              {isSubmitting ? <CircleNotch className="size-4 animate-spin" /> : "Create my salon"}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}

export default BusinessDetailForm;
