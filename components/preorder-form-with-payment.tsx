"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BOOK_INFO, PREORDER_BENEFITS, BOOK_FORMATS } from "@/lib/constants";
import { calculateTax } from "@/lib/tax-config";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PreorderFormWithPaymentProps {
  onSuccess?: () => void;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm({}: PreorderFormWithPaymentProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [bookFormat, setBookFormat] = useState("hardcover");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shipping information state
  const [shippingFirstName, setShippingFirstName] = useState("");
  const [shippingLastName, setShippingLastName] = useState("");
  const [shippingAddressLine1, setShippingAddressLine1] = useState("");
  const [shippingAddressLine2, setShippingAddressLine2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("US");
  const [shippingPhone, setShippingPhone] = useState("");

  const stripe = useStripe();
  const elements = useElements();

  // Tax calculation using centralized config
  const subtotal = BOOK_FORMATS[bookFormat as keyof typeof BOOK_FORMATS].price;
  const isDigital = ['ebook', 'audiobook'].includes(bookFormat);
  const { tax } = calculateTax(subtotal, shippingCountry, shippingState, isDigital);
  const total = subtotal + tax;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // First create the payment intent with actual form data
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          bookFormat,
          shippingFirstName,
          shippingLastName,
          shippingAddressLine1,
          shippingAddressLine2,
          shippingCity,
          shippingState,
          shippingPostalCode,
          shippingCountry,
          shippingPhone,
          subtotal: subtotal,
          tax: tax,
          total: total,
        }),
      });

      const { error: apiError } = await response.json();

      if (apiError) {
        throw new Error(apiError);
      }

      // Confirm payment with PaymentElement (supports both cards and PayPal)
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-success`,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Success - redirect to success page
      window.location.href = '/order-success';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 mb-2">
          Preorder &ldquo;{BOOK_INFO.title}&rdquo;
        </h3>
        <p className="text-gray-600">
          Complete your order with secure payment
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Details */}
        <Card className="p-6">
          <h4 className="text-xl font-semibold mb-4">Order Details</h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Personal Information</h5>
              
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="format">Book Format *</Label>
                <select
                  id="format"
                  value={bookFormat}
                  onChange={(e) => setBookFormat(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(BOOK_FORMATS).map(([key, format]) => (
                    <option key={key} value={key}>
                      {format.name} - ${format.price}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="space-y-4 pt-4 border-t">
              <h5 className="font-medium text-gray-900">Shipping Address</h5>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingFirstName">First Name *</Label>
                  <Input
                    id="shippingFirstName"
                    type="text"
                    value={shippingFirstName}
                    onChange={(e) => setShippingFirstName(e.target.value)}
                    required
                    className="w-full"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingLastName">Last Name *</Label>
                  <Input
                    id="shippingLastName"
                    type="text"
                    value={shippingLastName}
                    onChange={(e) => setShippingLastName(e.target.value)}
                    required
                    className="w-full"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shippingAddressLine1">Address Line 1 *</Label>
                <Input
                  id="shippingAddressLine1"
                  type="text"
                  value={shippingAddressLine1}
                  onChange={(e) => setShippingAddressLine1(e.target.value)}
                  required
                  className="w-full"
                  placeholder="Street address, P.O. box, company name"
                />
              </div>

              <div>
                <Label htmlFor="shippingAddressLine2">Address Line 2</Label>
                <Input
                  id="shippingAddressLine2"
                  type="text"
                  value={shippingAddressLine2}
                  onChange={(e) => setShippingAddressLine2(e.target.value)}
                  className="w-full"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingCity">City *</Label>
                  <Input
                    id="shippingCity"
                    type="text"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    required
                    className="w-full"
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingState">State *</Label>
                  <select
                    id="shippingState"
                    value={shippingState}
                    onChange={(e) => setShippingState(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select State</option>
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AZ">Arizona</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="DE">Delaware</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    <option value="HI">Hawaii</option>
                    <option value="ID">Idaho</option>
                    <option value="IL">Illinois</option>
                    <option value="IN">Indiana</option>
                    <option value="IA">Iowa</option>
                    <option value="KS">Kansas</option>
                    <option value="KY">Kentucky</option>
                    <option value="LA">Louisiana</option>
                    <option value="ME">Maine</option>
                    <option value="MD">Maryland</option>
                    <option value="MA">Massachusetts</option>
                    <option value="MI">Michigan</option>
                    <option value="MN">Minnesota</option>
                    <option value="MS">Mississippi</option>
                    <option value="MO">Missouri</option>
                    <option value="MT">Montana</option>
                    <option value="NE">Nebraska</option>
                    <option value="NV">Nevada</option>
                    <option value="NH">New Hampshire</option>
                    <option value="NJ">New Jersey</option>
                    <option value="NM">New Mexico</option>
                    <option value="NY">New York</option>
                    <option value="NC">North Carolina</option>
                    <option value="ND">North Dakota</option>
                    <option value="OH">Ohio</option>
                    <option value="OK">Oklahoma</option>
                    <option value="OR">Oregon</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="RI">Rhode Island</option>
                    <option value="SC">South Carolina</option>
                    <option value="SD">South Dakota</option>
                    <option value="TN">Tennessee</option>
                    <option value="TX">Texas</option>
                    <option value="UT">Utah</option>
                    <option value="VT">Vermont</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                    <option value="WV">West Virginia</option>
                    <option value="WI">Wisconsin</option>
                    <option value="WY">Wyoming</option>
                    <option value="DC">District of Columbia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingPostalCode">ZIP Code *</Label>
                  <Input
                    id="shippingPostalCode"
                    type="text"
                    value={shippingPostalCode}
                    onChange={(e) => setShippingPostalCode(e.target.value)}
                    required
                    className="w-full"
                    placeholder="ZIP code"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingCountry">Country *</Label>
                  <select
                    id="shippingCountry"
                    value={shippingCountry}
                    onChange={(e) => setShippingCountry(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="US">United States</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="shippingPhone">Phone Number</Label>
                <Input
                  id="shippingPhone"
                  type="tel"
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  className="w-full"
                  placeholder="Phone number (optional)"
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4 pt-4 border-t">
              <h5 className="font-medium text-gray-900">Payment Information</h5>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Payment Details</Label>
                <div className="p-3 border border-gray-300 rounded-md bg-white">
                  <PaymentElement
                    options={{
                      layout: 'tabs',
                      paymentMethodOrder: ['card', 'paypal'],
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Choose between credit/debit card or PayPal
                </p>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition-colors"
            >
              {isProcessing ? 'Processing...' : `Complete Order - $${total.toFixed(2)}`}
            </Button>
          </form>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>🔒 Secure payment powered by Stripe</p>
            <p>Test with: 4242 4242 4242 4242</p>
          </div>
        </Card>

        {/* Order Summary */}
        <Card className="p-6 h-fit">
          <h4 className="text-xl font-semibold mb-4">Order Summary</h4>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Book Format:</span>
              <span className="font-medium">{BOOK_FORMATS[bookFormat as keyof typeof BOOK_FORMATS].name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Book:</span>
              <span className="font-medium">{BOOK_INFO.title}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-md">
            <h5 className="font-medium text-green-800 mb-2">Preorder Benefits</h5>
            <ul className="text-sm text-green-700 space-y-1">
              {PREORDER_BENEFITS.map((benefit, index) => (
                <li key={index}>• {benefit}</li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PaymentFormWrapper({ onSuccess }: PreorderFormWithPaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create a minimal payment intent to get clientSecret
    const createInitialPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'temp@example.com',
            name: 'Temp User',
            bookFormat: 'hardcover',
            shippingFirstName: 'Temp',
            shippingLastName: 'User',
            shippingAddressLine1: '123 Main St',
            shippingCity: 'Anytown',
            shippingState: 'CA',
            shippingPostalCode: '12345',
            shippingCountry: 'US',
            shippingPhone: '555-555-5555',
            subtotal: 24.99,
            tax: 0,
            total: 24.99,
          }),
        });

        const data = await response.json();
        
        if (!response.ok || data.error) {
          console.error('Payment intent error:', data.error || 'Unknown error');
          // Continue anyway - we'll create a new one when user submits
        } else {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        console.error('Failed to create initial payment intent:', err);
        // Continue anyway - we'll create a new one when user submits
      } finally {
        setIsLoading(false);
      }
    };

    createInitialPaymentIntent();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading payment options...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to initialize payment. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm onSuccess={onSuccess} />
    </Elements>
  );
}

export function PreorderFormWithPayment({ onSuccess }: PreorderFormWithPaymentProps) {
  return <PaymentFormWrapper onSuccess={onSuccess} />;
}