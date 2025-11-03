"use client";

import { Card } from "@/components/ui/card";
import { getBookInfo } from "@/lib/site-config-client";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OrderSuccessContent() {
  const [bookInfo, setBookInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const fetchBookInfo = async () => {
      try {
        const data = await getBookInfo();
        setBookInfo(data);
      } catch (error) {
        console.error('Error fetching book info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookInfo();
    
    // Log session ID if available (for debugging)
    if (sessionId) {
      console.log('Order completed with session ID:', sessionId);
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md mx-auto p-8 text-center">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Order Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for preordering &ldquo;{bookInfo?.title || 'Waiting to Fly'}&rdquo;! 
          You&apos;ll receive a confirmation email shortly with your order details and shipping information.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">📦 Shipping Information</h3>
          <ul className="text-sm text-blue-700 text-left space-y-1">
            <li>• Please Check your email for order confirmation</li>
            <li>• You&apos;ll receive tracking information when your book is shipped</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link 
            href="/"
            className="block w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </Card>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </main>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}

