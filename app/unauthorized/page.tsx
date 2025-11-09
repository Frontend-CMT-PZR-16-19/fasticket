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
    <div className="container flex items-center justify-center min-h-[80vh] py-10">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You don't have permission to access this page. This area is
            restricted to organizers only.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/organizations/create">Create Organization</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
