"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function PreorderForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/mailing-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          source: 'website'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        // Handle error - you might want to show an error message
        console.error('Subscription error:', data.error);
        alert(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto p-8 text-center">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;re All Set!
        </h3>
        <p className="text-gray-600 mb-4">
          Thank you for joining our mailing list! We&apos;ll send you updates about the book release and exclusive content.
        </p>
        <p className="text-sm text-gray-500">
          Check your email for a confirmation message.
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Join our mailing list
        </h3>
        {/* <p className="text-gray-600">
          Be among the first to receive &ldquo;{BOOK_INFO.title}&rdquo; when it&apos;s released.
        </p> */}
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
          {/* <Link href="/checkout">
            <Button 
              type="button"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Complete Order & Pay Now
            </Button>
          </Link> */}
          
          <Button 
            type="submit" 
            variant="outline"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Get Updates"}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Choose to get updates about the book release.
        </p>
      </form>
    </Card>
  );
}
