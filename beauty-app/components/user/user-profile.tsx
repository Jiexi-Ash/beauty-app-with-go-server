"use client"
import { Avatar, AvatarFallback } from '../ui/avatar'
import { cn, getInitials } from '@/lib/utils'
import { ArrowRight, CircleNotch } from '@phosphor-icons/react'
import z from 'zod'
import { useForm } from '@tanstack/react-form'
import { Field, FieldGroup } from '../ui/field'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiError } from '@/lib/api-client'
import { toast } from 'sonner'
import { Skeleton } from '../ui/skeleton'
import DeleteAccountSection from './delete-account-section'

type Profile = {
    id: string
    email: string
    name: string | null
    surname: string | null
}

type BookingCounts = {
    Upcoming: number
    Completed: number
    Cancelled: number
}

const userSchema = z.object({
    name: z.string().min(1, "Required"),
    surname: z.string().min(1, "Required"),
})

function UserProfile() {
    const queryClient = useQueryClient()
    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: () => apiClient.get<Profile>("/profile"),
    })
    const { data: counts, isLoading: isCountsLoading } = useQuery({
        queryKey: ["booking-counts"],
        queryFn: () => apiClient.get<BookingCounts>("/bookings/counts"),
    })

    const form = useForm({
        defaultValues: {
            name: profile?.name ?? "",
            surname: profile?.surname ?? "",
        },
        validators: {
            onSubmit: userSchema
        },
        onSubmit: async ({ value }) => {
            try {
                await apiClient.patch("/profile", { name: value.name, surname: value.surname })
                queryClient.invalidateQueries({ queryKey: ["profile"] })
                toast.success("Profile updated.")
            } catch (error) {
                toast.error(error instanceof ApiError ? error.message : "Something went wrong.")
            }
        }
    })

    const fullName = [profile?.name, profile?.surname].filter(Boolean).join(" ")
    const upcoming = counts?.Upcoming ?? 0
    const completed = counts?.Completed ?? 0
    const cancelled = counts?.Cancelled ?? 0
    const total = upcoming + completed + cancelled

    if (isProfileLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center gap-4 my-10">
                <Skeleton className="size-24 rounded-full" />
                <Skeleton className="h-64 w-full max-w-2xl rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col justify-center">
            <div className="my-10 space-y-8 max-w-2xl mx-auto">
                <div className="w-full flex flex-col items-center gap-4">
                    <div className="p-1.5 rounded-full bg-black/[0.04] ring-1 ring-black/5">
                        <Avatar size="xl" className="size-24 ring-4 ring-surface-container-lowest">
                            <AvatarFallback className="font-headline text-lg">{getInitials(fullName || profile?.email || "")}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="text-center space-y-0.5">
                        <h1 className="font-headline font-bold text-xl">{fullName || "Your profile"}</h1>
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard value={isCountsLoading ? "—" : upcoming} label="Upcoming" accent />
                    <StatCard value={isCountsLoading ? "—" : completed} label="Completed" />
                    <StatCard value={isCountsLoading ? "—" : cancelled} label="Cancelled" />
                    <StatCard value={isCountsLoading ? "—" : total} label="Total" />
                </div>

                <Card className="rounded-2xl ring-1 ring-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                    <CardContent>
                        <form className="space-y-4"
                            id="update-profile"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.handleSubmit();
                            }}
                        >
                            <FieldGroup>
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field name="name">
                                        {(field) => (
                                            <Field>
                                                <Label className="text-[11px] uppercase font-semibold text-muted-foreground tracking-widest">
                                                    First Name
                                                </Label>
                                                <Input
                                                    value={field.state.value}
                                                    className="mt-1.5 bg-transparent border-foreground/15 rounded-xl h-12 text-sm"
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                />
                                            </Field>
                                        )}
                                    </form.Field>

                                    <form.Field name="surname">
                                        {(field) => (
                                            <Field>
                                                <Label className="text-[11px] uppercase font-semibold text-muted-foreground tracking-widest">
                                                    Last Name
                                                </Label>
                                                <Input
                                                    value={field.state.value}
                                                    className="mt-1.5 bg-transparent border-foreground/15 rounded-xl h-12 text-sm"
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                />
                                            </Field>
                                        )}
                                    </form.Field>
                                </div>

                                <Field>
                                    <Label className="text-[11px] uppercase font-semibold text-muted-foreground tracking-widest">
                                        Email Address
                                    </Label>
                                    <Input
                                        value={profile?.email ?? ""}
                                        className="mt-1.5 bg-transparent border-foreground/15 rounded-xl h-12 text-sm"
                                        readOnly
                                    />
                                </Field>
                            </FieldGroup>

                            <form.Subscribe selector={(state) => state.isSubmitting}>
                                {(isSubmitting) => (
                                    <Button size="lg"
                                        className="group w-full rounded-full text-base py-6 bg-primary hover:bg-primary/90 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                                        disabled={isSubmitting}
                                        type="submit">
                                        {isSubmitting ? (
                                            <CircleNotch className="text-white animate-spin size-4" />
                                        ) : (
                                            <>
                                                Update Details
                                                <span className="ml-1.5 flex items-center justify-center size-6 rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                                                    <ArrowRight className="size-3.5 text-white" />
                                                </span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </form.Subscribe>
                        </form>
                    </CardContent>
                </Card>

                <DeleteAccountSection />
            </div>

        </div>
    )
}

function StatCard({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
    return (
        <div
            className={cn(
                "rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5",
                accent
                    ? "bg-primary shadow-[0_8px_24px_rgba(221,39,94,0.2)]"
                    : "bg-surface-container-lowest ring-1 ring-black/5 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]",
            )}
        >
            <p className={cn("font-headline font-bold text-2xl", accent ? "text-white" : "text-foreground")}>
                {value}
            </p>
            <p className={cn("font-medium tracking-wider text-[10px] uppercase", accent ? "text-white/70" : "text-muted-foreground")}>
                {label}
            </p>
        </div>
    )
}

export default UserProfile
