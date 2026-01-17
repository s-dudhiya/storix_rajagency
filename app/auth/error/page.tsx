import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md border-destructive/20 shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <CardTitle className="text-xl text-destructive font-bold">Authentication Error</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Something went wrong during authentication.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        The link you clicked may have expired, successfully been used, or is invalid.
                    </p>
                    <div className="pt-2">
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/">Back to Login</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
