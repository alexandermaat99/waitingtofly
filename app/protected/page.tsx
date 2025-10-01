import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { PreorderForm } from "@/components/preorder-form";
import { PREORDER_BENEFITS } from "@/lib/constants";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-blue-50 text-sm p-3 px-5 rounded-md text-blue-800 flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          Welcome back! You're now logged in and can access exclusive preorder benefits.
        </div>
      </div>
      
      <div className="flex flex-col gap-8 items-center">
        <div className="text-center">
          <h2 className="font-bold text-3xl mb-4 text-gray-900">
            Ready to Preorder?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            As a registered user, you get exclusive early access to "Waiting to Fly" 
            and special preorder bonuses.
          </p>
        </div>
        
        <div className="w-full max-w-md">
          <PreorderForm />
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 max-w-2xl">
          <h3 className="font-semibold text-lg mb-3">Preorder Benefits:</h3>
          <ul className="space-y-2 text-gray-700">
            {PREORDER_BENEFITS.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
