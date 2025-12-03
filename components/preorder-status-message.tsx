"use client";

import { useEffect, useState } from "react";
import { getPreorderStatus } from "@/lib/site-config-client";
import { Card } from "@/components/ui/card";

interface PreorderStatusMessageProps {
  children: React.ReactNode;
}

export function PreorderStatusMessage({ children }: PreorderStatusMessageProps) {
  const [preorderStatus, setPreorderStatus] = useState<{ status: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getPreorderStatus();
        setPreorderStatus(status);
      } catch (error) {
        console.error('Error fetching preorder status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If status is "Sold Out" or "Closed", show the message instead of the form
  if (preorderStatus && (preorderStatus.status === "Sold Out" || preorderStatus.status === "Closed")) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8">
        <Card className="p-8 text-center">
          <div className="mb-4">
            <span className="inline-block bg-red-100 text-red-700 text-lg font-semibold px-4 py-2 rounded-full">
              {preorderStatus.status}
            </span>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            {preorderStatus.message}
          </p>
          <div className="mt-6">
            <a 
              href="/#preorder" 
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-md transition-colors"
            >
              Sign up for updates
            </a>
          </div>
        </Card>
      </div>
    );
  }

  // Otherwise, show the normal form
  return <>{children}</>;
}

