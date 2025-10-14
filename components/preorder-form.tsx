"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BOOK_INFO } from "@/lib/constants";
import Link from "next/link";

export function PreorderForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto p-8 text-center">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;re All Set!
        </h3>
        <p className="text-gray-600 mb-4">
          Thank you for your preorder! We&apos;ll send you updates about the book release and exclusive content.
        </p>
        <div className="space-y-3">
          <Link href="/checkout">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              Complete Your Order
            </Button>
          </Link>
          <Button 
            onClick={() => setIsSubmitted(false)}
            variant="outline"
            className="w-full"
          >
            Preorder Another Copy
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Reserve Your Copy
        </h3>
        <p className="text-gray-600">
          Be among the first to receive &ldquo;{BOOK_INFO.title}&rdquo; when it&apos;s released.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="space-y-3">
          <Link href="/checkout">
            <Button 
              type="button"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Complete Order & Pay Now
            </Button>
          </Link>
          
          <Button 
            type="submit" 
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Just Get Updates (No Payment)"}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Choose to complete your order with payment or just get updates about the book release.
        </p>
      </form>
    </Card>
  );
}
