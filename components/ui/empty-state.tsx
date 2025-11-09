import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="text-6xl mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {actionLabel && actionHref && (
        <CardFooter className="justify-center">
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
