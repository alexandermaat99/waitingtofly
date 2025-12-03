import { PreorderFormWithPayment } from "@/components/preorder-form-with-payment";
import { Suspense } from "react";
import { PreorderStatusMessage } from "@/components/preorder-status-message";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <Suspense fallback={
        <div className="w-full max-w-4xl mx-auto p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      }>
      <PreorderStatusMessage>
        <PreorderFormWithPayment />
      </PreorderStatusMessage>
      </Suspense>
    </main>
  );
}
