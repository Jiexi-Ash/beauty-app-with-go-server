"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    type Crop,
    type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface CroppedFile {
    file: File;
    url: string;
}

interface AspectOption {
    label: string;
    value: number | undefined; // undefined = free
    description: string;
}

interface ImageCropDialogProps {
    /** Raw File the user selected */
    file: File | null;
    /** Whether this is the primary image — locks the crop to primaryAspect */
    isPrimary?: boolean;
    primaryAspect?: number;
    /** Called when the user confirms the crop */
    onCropConfirm: (result: CroppedFile) => void;
    /** Called when the user cancels */
    onCancel: () => void;
}

// Exported so the parent (product upload form) can derive the correct
// aspect ratio from the selected category before opening this dialog

const DEFAULT_PRIMARY_ASPECT = 1; // fallback if category has no mapping

const GALLERY_ASPECT_OPTIONS: AspectOption[] = [
    { label: "Free", value: undefined, description: "Any ratio" },
    { label: "1:1", value: 1, description: "Square" },
    { label: "3:4", value: 3 / 4, description: "Portrait (phone)" },
    { label: "2:3", value: 2 / 3, description: "Portrait (pro)" },
    { label: "4:3", value: 4 / 3, description: "Landscape (phone)" },
    { label: "3:2", value: 3 / 2, description: "Landscape (pro)" },
    { label: "16:9", value: 16 / 9, description: "Wide" },
];

/** Derive a human-readable label from a numeric aspect ratio */
export function aspectLabel(value: number): string {
    const match = GALLERY_ASPECT_OPTIONS.find((o) => o.value === value);
    if (match) return match.label;
    // Fallback for unmapped values — shouldn't happen in practice
    return value < 1 ? "Portrait" : value === 1 ? "Square" : "Landscape";
}

/** Seed a centred crop that fills ~90% of the image at the given aspect ratio */
function buildInitialCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number | undefined
): Crop {
    if (!aspect) {
        return { unit: "%", x: 5, y: 5, width: 90, height: 90 };
    }
    return centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight
    );
}

/** Draw the cropped region onto an off-screen canvas and return a File */
async function cropToFile(
    image: HTMLImageElement,
    pixelCrop: PixelCrop,
    originalFile: File
): Promise<CroppedFile> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.floor(pixelCrop.width * scaleX);
    canvas.height = Math.floor(pixelCrop.height * scaleY);

    ctx.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        pixelCrop.width * scaleX,
        pixelCrop.height * scaleY,
        0, 0,
        canvas.width,
        canvas.height
    );

    return new Promise<CroppedFile>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Canvas toBlob failed"));
            const ext = originalFile.name.split(".").pop() ?? "jpg";
            const name = originalFile.name.replace(/\.[^.]+$/, `_cropped.${ext}`);
            const file = new File([blob], name, { type: originalFile.type });
            resolve({ file, url: URL.createObjectURL(blob) });
        }, originalFile.type);
    });
}

export default function ImageCropDialog({
    file,
    isPrimary = false,
    primaryAspect = DEFAULT_PRIMARY_ASPECT,
    onCropConfirm,
    onCancel,
}: ImageCropDialogProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [selectedAspect, setSelectedAspect] = useState<AspectOption>(GALLERY_ASPECT_OPTIONS[0]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [srcUrl, setSrcUrl] = useState("");

    // Derived — no useState needed. Defined early so the ref below can track it.
    const currentAspect = isPrimary ? primaryAspect : selectedAspect.value;

    // Keep both in refs so callbacks stay stable without stale closures
    const selectedAspectRef = useRef(selectedAspect);
    selectedAspectRef.current = selectedAspect;
    const currentAspectRef = useRef(currentAspect);
    currentAspectRef.current = currentAspect;

    // Derived label for UI strings — updates automatically when primaryAspect changes
    const primaryAspectLabel = aspectLabel(primaryAspect);

    // Object URL lifecycle — effect is correct here, revokeObjectURL requires cleanup.
    // Also resets selectedAspect so each new file starts fresh.
    useEffect(() => {
        if (!file) {
            setSrcUrl("");
            return;
        }
        setSelectedAspect(GALLERY_ASPECT_OPTIONS[0]);
        const url = URL.createObjectURL(file);
        setSrcUrl(url);
        return () => {
            URL.revokeObjectURL(url);
            setSrcUrl("");
        };
    }, [file]);

    const handleDialogOpenChange = useCallback(
        (open: boolean) => { if (!open) onCancel(); },
        [onCancel]
    );

    const onImageLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            const { width, height } = e.currentTarget;
            // Read from ref — always current value, no stale closure
            setCrop(buildInitialCrop(width, height, currentAspectRef.current));
            setCompletedCrop(undefined);
        },
        [] // stable — all values read via refs
    );

    // When the user picks a different aspect ratio (gallery only)
    const handleAspectChange = (option: AspectOption) => {
        setSelectedAspect(option);
        if (!imgRef.current) return;
        const { width, height } = imgRef.current;
        setCrop(buildInitialCrop(width, height, option.value));
    };

    const handleConfirm = async () => {
        if (!imgRef.current || !completedCrop || !file) return;
        setIsProcessing(true);
        try {
            const result = await cropToFile(imgRef.current, completedCrop, file);
            onCropConfirm(result);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={!!file} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-xl">
                {/* ── Header ── */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gray-50">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                        {isPrimary ? (
                            <>
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold">
                                    1
                                </span>
                                Crop Primary Image
                                <span className="ml-1 text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                    {primaryAspectLabel} required
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-700 text-white text-[10px] font-bold">
                                    ✂
                                </span>
                                Crop Gallery Image
                            </>
                        )}
                    </DialogTitle>

                    {/* Aspect ratio selector — gallery images only */}
                    {!isPrimary && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {GALLERY_ASPECT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.label}
                                    type="button"
                                    title={opt.description}
                                    onClick={() => handleAspectChange(opt)}
                                    className={cn(
                                        "px-3 py-1 text-xs font-medium rounded-full border transition-all",
                                        selectedAspect.label === opt.label
                                            ? "bg-primary text-white border-primary shadow-sm"
                                            : "bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </DialogHeader>

                {/* ── Crop area ── */}
                <div className="flex items-center justify-center bg-gray-100 px-6 py-5 min-h-[320px] max-h-[60vh] overflow-hidden">
                    {srcUrl && (
                        // w-fit collapses wrapper to image size so ReactCrop's
                        // aspect math is grounded to the image, not the flex container
                        <div className="relative overflow-hidden w-fit">
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={currentAspect}
                                minWidth={50}
                                minHeight={50}
                                keepSelection
                                className="max-w-full max-h-full"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    ref={imgRef}
                                    src={srcUrl}
                                    alt="Crop preview"
                                    onLoad={onImageLoad}
                                    className="max-w-full max-h-[55vh] object-contain"
                                />
                            </ReactCrop>
                        </div>
                    )}
                </div>

                {/* ── Tip bar ── */}
                <div className="px-6 py-2 bg-blue-50 border-t border-blue-100">
                    <p className="text-xs text-blue-700">
                        {isPrimary
                            ? `Drag the crop box or resize it — it will stay ${primaryAspectLabel}. This image becomes your primary product photo.`
                            : `Drag and resize the crop box. ${selectedAspect.value ? `Aspect ratio locked to ${selectedAspect.label}.` : "Free crop: any ratio."}`}
                    </p>
                </div>

                {/* ── Footer ── */}
                <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex gap-2 mb-2 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!completedCrop || isProcessing}
                        className="min-w-28"
                    >
                        {isProcessing ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Cropping…
                            </span>
                        ) : (
                            "Use Crop"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}