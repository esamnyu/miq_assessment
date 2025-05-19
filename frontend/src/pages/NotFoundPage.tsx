import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Assuming your path alias for shadcn/ui is working
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-bold text-primary">404</CardTitle>
          <CardDescription className="text-2xl font-semibold mt-2">
            Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Oops! The page you are looking for does not exist, might have been removed,
            or is temporarily unavailable.
          </p>
          <Link to="/">
            <Button>Go to Homepage</Button>
          </Link>
          <p className="mt-8 text-sm text-muted-foreground">
            Error Code: {new Date().getFullYear()}-PNF </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFoundPage;