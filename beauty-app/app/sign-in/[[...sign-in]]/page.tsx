"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CircleNotch } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field, FieldGroup } from "@/components/ui/field"

export default function Page() {
  return (
    <Suspense>
      <SignInPage />
    </Suspense>
  )
}

function SignInPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (mode === "sign-in") {
        await login(email, password)
      } else {
        await register(email, password)
      }
      router.push(searchParams.get("redirect_url") ?? "/")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center w-full h-screen px-4">
      <Card className="w-full max-w-sm rounded-2xl">
        <CardContent className="space-y-6 py-2">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-headline font-bold">
              {mode === "sign-in" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "sign-in"
                ? "Sign in to book appointments and manage your salon."
                : "Join to book appointments and save favorites."}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-12 rounded-xl"
                />
              </Field>
              <Field>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 h-12 rounded-xl"
                />
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full rounded-full py-6"
            >
              {isSubmitting ? (
                <CircleNotch className="size-4 animate-spin" />
              ) : mode === "sign-in" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "sign-in" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
              className="font-semibold text-primary hover:underline cursor-pointer"
            >
              {mode === "sign-in" ? "Create one" : "Sign in"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
