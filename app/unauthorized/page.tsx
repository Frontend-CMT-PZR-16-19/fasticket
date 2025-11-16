import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Unauthorized - Fasticket",
  description: "You don't have permission to access this page",
};

export default function UnauthorizedPage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        <Card className="border-destructive/20">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-destructive/10 rounded-full">
                <ShieldAlert className="h-16 w-16 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-3xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground text-lg">
              You don't have permission to access this page. This area is
              restricted to organizers only.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/">Go to Home</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/organizations/create">Create Organization</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
