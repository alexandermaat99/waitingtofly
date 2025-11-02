"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { getBookInfo, getPreorderBenefits, getBookFormats } from "@/lib/site-config-client";
import { calculateTax } from "@/lib/tax-config";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

interface PreorderFormWithPaymentProps {
  onSuccess?: () => void;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormInternalProps {
  clientSecret: string | null;
  setClientSecret: (secret: string | null) => void;
}

function PaymentForm({ clientSecret, setClientSecret }: PaymentFormInternalProps) {
  const searchParams = useSearchParams();
  
  // Restore form state from localStorage if available
  const getStoredState = (key: string, defaultValue: any) => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(`checkout_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const saveState = (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`checkout_${key}`, JSON.stringify(value));
    } catch {}
  };

  const [email, setEmail] = useState(() => getStoredState('email', ''));
  const [name, setName] = useState(() => getStoredState('name', ''));
  // DO NOT restore bookFormat from localStorage - it might be invalid (e.g., "ebook")
  // Let the useEffect validate and set it from database
  const [bookFormat, setBookFormat] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'order' | 'shipping' | 'payment'>('order');
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // Data from database
  const [bookInfo, setBookInfo] = useState<any>(null);
  const [bookFormats, setBookFormats] = useState<any>(null);
  const [preorderBenefits, setPreorderBenefits] = useState<any[]>([]);

  // Shipping information state
  const [shippingFirstName, setShippingFirstName] = useState(() => getStoredState('shippingFirstName', ''));
  const [shippingLastName, setShippingLastName] = useState(() => getStoredState('shippingLastName', ''));
  const [shippingAddressLine1, setShippingAddressLine1] = useState(() => getStoredState('shippingAddressLine1', ''));
  const [shippingAddressLine2, setShippingAddressLine2] = useState(() => getStoredState('shippingAddressLine2', ''));
  const [shippingCity, setShippingCity] = useState(() => getStoredState('shippingCity', ''));
  const [shippingState, setShippingState] = useState(() => getStoredState('shippingState', ''));
  const [shippingPostalCode, setShippingPostalCode] = useState(() => getStoredState('shippingPostalCode', ''));
  const [shippingCountry, setShippingCountry] = useState(() => getStoredState('shippingCountry', 'US'));
  const [shippingPhone, setShippingPhone] = useState(() => getStoredState('shippingPhone', ''));

  // Save form state to localStorage whenever it changes
  useEffect(() => {
    const formData = {
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
    };
    
    Object.entries(formData).forEach(([key, value]) => {
      saveState(key, value);
    });
  }, [
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
  ]);

  // Clear localStorage on successful payment
  useEffect(() => {
    if (clientSecret) {
      // Payment successful, keep state until redirect
      return () => {
        // Clear on unmount after successful payment
        if (typeof window !== 'undefined') {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('checkout_')) {
              localStorage.removeItem(key);
            }
          });
        }
      };
    }
  }, [clientSecret]);

  const stripe = useStripe();
  const elements = useElements();

  // Helper function to get the first available format (prioritize physical formats)
  const getFirstAvailableFormat = (formats: any): string | null => {
    if (!formats || typeof formats !== 'object') return null;
    const formatKeys = Object.keys(formats);
    if (formatKeys.length === 0) return null;
    
    // Prioritize physical formats (hardcover, paperback) over digital (ebook, audiobook)
    const physicalFormats = formatKeys.filter(key => !['ebook', 'audiobook'].includes(key));
    if (physicalFormats.length > 0) {
      // Prefer hardcover over paperback if both exist
      if (physicalFormats.includes('hardcover')) return 'hardcover';
      if (physicalFormats.includes('paperback')) return 'paperback';
      return physicalFormats[0];
    }
    
    // Fallback to first available if no physical formats
    return formatKeys[0];
  };

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookData, formatsData, benefitsData] = await Promise.all([
          getBookInfo(),
          getBookFormats(),
          getPreorderBenefits()
        ]);
        setBookInfo(bookData);
        setBookFormats(formatsData);
        setPreorderBenefits(benefitsData || []);

        // Only set format if we're in order or shipping step and don't have a valid format
        // Don't reset format if we're already in payment step
        if (formatsData && (checkoutStep === 'order' || checkoutStep === 'shipping') && (!bookFormat || !formatsData[bookFormat])) {
          const availableFormats = Object.keys(formatsData);
          console.log('=== FORMAT INITIALIZATION ===');
          console.log('Available formats from database:', availableFormats);
          
          // Clear any invalid format from localStorage first
          if (typeof window !== 'undefined') {
            const storedFormat = localStorage.getItem('checkout_bookFormat');
            if (storedFormat) {
              try {
                const parsedFormat = JSON.parse(storedFormat);
                if (!formatsData[parsedFormat]) {
                  console.warn('Clearing invalid format from localStorage:', parsedFormat);
                  localStorage.removeItem('checkout_bookFormat');
                }
              } catch (e) {
                localStorage.removeItem('checkout_bookFormat');
              }
            }
          }
          
          const urlFormat = searchParams?.get('format');
          if (urlFormat && formatsData[urlFormat]) {
            // Use format from URL if it exists in database
            console.log('Using format from URL:', urlFormat);
            setBookFormat(urlFormat);
            if (typeof window !== 'undefined') {
              localStorage.setItem('checkout_bookFormat', JSON.stringify(urlFormat));
            }
          } else {
            // Always use first available format from database - never trust any stored value
            const firstFormat = getFirstAvailableFormat(formatsData);
            if (firstFormat) {
              console.log('Setting format to first available:', firstFormat);
              console.log('This is the ONLY valid format we trust from the database');
              setBookFormat(firstFormat);
              if (typeof window !== 'undefined') {
                localStorage.setItem('checkout_bookFormat', JSON.stringify(firstFormat));
              }
            } else {
              console.error('No available formats found in database!');
              setBookFormat('');
            }
          }
        } else if (formatsData && checkoutStep === 'payment' && bookFormat && formatsData[bookFormat]) {
          // In payment step, just ensure format is valid - don't reset it
          console.log('Payment step: preserving format:', bookFormat);
        }
      } catch (error) {
        console.error('Error fetching payment form data:', error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, checkoutStep]);

  // Additional safety: Re-validate format whenever bookFormats changes
  useEffect(() => {
    if (bookFormats && bookFormat) {
      const availableFormats = Object.keys(bookFormats);
      if (!availableFormats.includes(bookFormat)) {
        console.warn('Format validation: "' + bookFormat + '" is not in available formats:', availableFormats);
        const validFormat = getFirstAvailableFormat(bookFormats);
        if (validFormat && validFormat !== bookFormat) {
          console.log('Auto-correcting invalid format to:', validFormat);
          setBookFormat(validFormat);
          if (typeof window !== 'undefined') {
            localStorage.setItem('checkout_bookFormat', JSON.stringify(validFormat));
          }
        }
      }
    }
  }, [bookFormats]); // Only depend on bookFormats, not bookFormat, to avoid loops

  // Tax calculation - Separate estimated tax (step 1) from actual tax (step 2)
  const [displaySubtotal, setDisplaySubtotal] = useState<number>(24.99);
  const [estimatedTax, setEstimatedTax] = useState<number>(0); // State-level estimate for step 1
  const [actualTax, setActualTax] = useState<number | null>(null); // Actual ZIP-based tax from Stripe (step 2)
  
  // Stripe Tax values (set after payment intent creation)
  const [stripeTax, setStripeTax] = useState<number | null>(null);
  const [stripeSubtotal, setStripeSubtotal] = useState<number | null>(null);
  
  // Calculate ESTIMATED tax (state-level) ONLY when book format changes
  // Tax does NOT update when shipping address changes - only when "Continue" is clicked
  useEffect(() => {
    if (!bookFormats || !bookFormat) return;
    
    const subtotal = bookFormats[bookFormat as keyof typeof bookFormats]?.price || 24.99;
    setDisplaySubtotal(subtotal);
    
    // Calculate initial state-level estimate (only recalculates when format changes, not shipping)
    // User will see actual tax only after clicking "Continue to Payment"
    const isDigital = ['ebook', 'audiobook'].includes(bookFormat);
    const { tax: taxEstimate } = calculateTax(subtotal, shippingCountry, shippingState, isDigital);
    setEstimatedTax(taxEstimate);
  }, [bookFormats, bookFormat]); // Only depend on format, NOT shipping address
  
  // Get the tax to display based on current step
  // In step 1 and shipping: shows "calculated at checkout" text
  // In step 2: shows actual tax calculated by Stripe
  const hasCalculatedTax = checkoutStep === 'payment' && actualTax !== null;
  const displayTax = hasCalculatedTax ? actualTax : 0; // Will show text instead of amount until calculated
  const displayTotal = hasCalculatedTax ? displaySubtotal + displayTax : displaySubtotal; // Show subtotal only until tax calculated


  // Helper function to clear field error when user starts typing
  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Handle "Continue to Shipping" button (step order -> shipping)
  const handleContinueToShipping = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('✅ handleContinueToShipping called!');
    
    // Validate order information
    const errors: Record<string, boolean> = {};
    if (!bookFormat) {
      errors.bookFormat = true;
      setError('Please select a book format');
    } else {
      setError(null);
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    // Move to shipping step
    setCheckoutStep('shipping');
    setError(null);
    setFieldErrors({});
  };

  // Handle "Continue to Payment" button (step shipping -> payment)
  const handleContinueToPayment = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('✅ handleContinueToPayment called!');
    console.log('Form values:', {
      name: `${shippingFirstName.trim()} ${shippingLastName.trim()}`.trim() || name.trim(),
      email: email.trim(),
      bookFormat,
      shippingAddressLine1: shippingAddressLine1.trim(),
      shippingCity: shippingCity.trim(),
      shippingPostalCode: shippingPostalCode.trim(),
    });
    
    // Validate shipping information
    const errors: Record<string, boolean> = {};
    const missingFields = [];
    
    if (!email.trim()) {
      errors.email = true;
      missingFields.push('Email');
    }
    if (!shippingFirstName.trim()) {
      errors.shippingFirstName = true;
      missingFields.push('First Name');
    }
    if (!shippingLastName.trim()) {
      errors.shippingLastName = true;
      missingFields.push('Last Name');
    }
    if (!bookFormat) {
      errors.bookFormat = true;
      missingFields.push('Book Format');
    }
    if (!shippingAddressLine1.trim()) {
      errors.shippingAddressLine1 = true;
      missingFields.push('Address');
    }
    if (!shippingCity.trim()) {
      errors.shippingCity = true;
      missingFields.push('City');
    }
    if (!shippingState.trim()) {
      errors.shippingState = true;
      missingFields.push('State');
    }
    if (!shippingPostalCode.trim()) {
      errors.shippingPostalCode = true;
      missingFields.push('ZIP Code');
    }
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setFieldErrors(errors);
      return;
    }
    
    // Clear errors if validation passes
    setFieldErrors({});
    
    setIsProcessing(true);
    setError(null);
    console.log('Creating payment intent...');
    
    try {
      // Create payment intent to get actual tax calculation
      const subtotal = bookFormats[bookFormat as keyof typeof bookFormats]?.price || 24.99;
      const isDigital = ['ebook', 'audiobook'].includes(bookFormat);
      
      const requestBody = {
        email: email.trim(),
        name: `${shippingFirstName.trim()} ${shippingLastName.trim()}`.trim() || name.trim(),
        bookFormat: bookFormat, // Already validated
        shippingFirstName: shippingFirstName.trim(),
        shippingLastName: shippingLastName.trim(),
        shippingAddressLine1: shippingAddressLine1.trim(),
        shippingAddressLine2: shippingAddressLine2?.trim() || '',
        shippingCity: shippingCity.trim(),
        shippingState: shippingState.trim(),
        shippingPostalCode: shippingPostalCode.trim(),
        shippingCountry: shippingCountry.trim(),
        shippingPhone: shippingPhone?.trim() || '',
        subtotal: subtotal,
        tax: estimatedTax, // Send estimate, Stripe will calculate actual
        total: subtotal + estimatedTax, // Estimate, Stripe will calculate actual
      };
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      console.log('Payment intent created, moving to payment step');
      console.log('Actual tax calculated by Stripe:', {
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.amount,
      });
      
      // Update with actual tax amounts from Stripe
      if (data.subtotal !== undefined && data.tax !== undefined) {
        setStripeSubtotal(data.subtotal);
        setStripeTax(data.tax);
        setActualTax(data.tax);
        setDisplaySubtotal(data.subtotal);
      }
      
      // Move to payment step
      setClientSecret(data.clientSecret);
      setCheckoutStep('payment');
      setIsProcessing(false);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment intent');
      setIsProcessing(false);
    }
  };

  // Handle final payment submission (step 2)
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validate bookFormat is set
    if (!bookFormat || bookFormat.trim() === '') {
      setError('Please select a book format');
      return;
    }

    // CRITICAL: Validate bookFormat exists in available formats from database
    if (!bookFormats || typeof bookFormats !== 'object') {
      console.error('bookFormats is not available');
      setError('Unable to load book formats. Please refresh and try again.');
      return;
    }

    const availableFormats = Object.keys(bookFormats);
    if (!bookFormat || !bookFormats[bookFormat]) {
      console.error('Invalid book format:', bookFormat, 'Available formats:', availableFormats);
      // Try to fix it automatically by using first available
      const firstFormat = getFirstAvailableFormat(bookFormats);
      if (firstFormat) {
        console.log('Auto-correcting to valid format:', firstFormat);
        setBookFormat(firstFormat);
        if (typeof window !== 'undefined') {
          localStorage.setItem('checkout_bookFormat', JSON.stringify(firstFormat));
        }
        setError('Invalid format was selected. Please try again.');
        return;
      } else {
        setError(`Invalid book format selected: ${bookFormat}. Please refresh and try again.`);
        return;
      }
    }

    // Final safety check: ensure format is not "ebook" if it doesn't exist in database
    if (bookFormat === 'ebook' && !availableFormats.includes('ebook')) {
      console.error('Ebook format not available in database, but was selected:', bookFormat);
      const firstFormat = getFirstAvailableFormat(bookFormats);
      if (firstFormat) {
        console.log('Auto-correcting ebook to valid format:', firstFormat);
        setBookFormat(firstFormat);
        if (typeof window !== 'undefined') {
          localStorage.setItem('checkout_bookFormat', JSON.stringify(firstFormat));
        }
      }
      setError('Ebook format is not available. Please select a different format.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // If we already have a clientSecret, validate and confirm payment
      if (clientSecret && stripe && elements) {
        // Validate the form first (REQUIRED by Stripe)
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw new Error(submitError.message);
        }

        // Confirm payment with PaymentElement (supports both cards and PayPal)
        const { error: stripeError } = await stripe.confirmPayment({
          elements,
          clientSecret: clientSecret,
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
        return;
      }

      // First create the payment intent with actual form data
      // FINAL VALIDATION: Ensure we're using the exact format key from the database
      const availableFormats = Object.keys(bookFormats || {});
      if (!bookFormat || !bookFormats[bookFormat]) {
        console.error('CRITICAL: Invalid format before payment intent creation:', bookFormat);
        console.error('Available formats:', availableFormats);
        const fallbackFormat = getFirstAvailableFormat(bookFormats);
        if (fallbackFormat) {
          console.log('Using fallback format:', fallbackFormat);
          setBookFormat(fallbackFormat);
          throw new Error(`Invalid format "${bookFormat}" was selected. Please try again with a valid format.`);
        } else {
          throw new Error('No valid book formats are available. Please contact support.');
        }
      }

      // Double-check the format exists (safety check)
      if (!availableFormats.includes(bookFormat)) {
        console.error('CRITICAL: Format not in available list:', bookFormat, 'Available:', availableFormats);
        throw new Error(`Format "${bookFormat}" is not available. Please select a different format.`);
      }

      // ABSOLUTE FINAL CHECK: Verify format exists in database before creating request
      if (!bookFormats[bookFormat]) {
        console.error('FATAL ERROR: Invalid format detected before API call:', bookFormat);
        console.error('Available formats:', Object.keys(bookFormats));
        const fallback = getFirstAvailableFormat(bookFormats);
        if (fallback) {
          console.error('Using fallback format:', fallback);
          setBookFormat(fallback);
          throw new Error(`Invalid format "${bookFormat}" detected. Please refresh and try again.`);
        } else {
          throw new Error('No valid formats available. Please contact support.');
        }
      }
      
      const selectedBookFormat = bookFormat; // VALIDATED: Guaranteed to exist in bookFormats
      console.log('=== PAYMENT INTENT CREATION ===');
      console.log('Form bookFormat state:', bookFormat);
      console.log('Selected format:', selectedBookFormat);
      console.log('Available formats:', Object.keys(bookFormats));
      console.log('Format validation: PASSED - format exists in database');
      
      const requestBody = {
        email: email.trim(),
        name: `${shippingFirstName.trim()} ${shippingLastName.trim()}`.trim() || name.trim(),
        bookFormat: selectedBookFormat, // VALIDATED: Guaranteed valid format
        shippingFirstName: shippingFirstName.trim(),
        shippingLastName: shippingLastName.trim(),
        shippingAddressLine1: shippingAddressLine1.trim(),
        shippingAddressLine2: shippingAddressLine2?.trim() || '',
        shippingCity: shippingCity.trim(),
        shippingState: shippingState.trim(),
        shippingPostalCode: shippingPostalCode.trim(),
        shippingCountry: shippingCountry.trim(),
        shippingPhone: shippingPhone?.trim() || '',
        subtotal: displaySubtotal, // Price before tax - Stripe Tax will calculate tax automatically
        tax: displayTax, // Estimate for reference (Stripe will calculate actual tax)
        total: displayTotal, // Estimate (Stripe will use actual total)
      };
      
      console.log('Request body being sent:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      console.log('Payment intent created, setting clientSecret');
      console.log('Stripe Tax calculated:', {
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.amount,
      });
      
      // This code is now in handleContinueToPayment, not here
      // Keeping for backward compatibility if called elsewhere
      if (data.subtotal !== undefined && data.tax !== undefined) {
        setStripeSubtotal(data.subtotal);
        setStripeTax(data.tax);
        setDisplaySubtotal(data.subtotal);
        setActualTax(data.tax);
      }
      
      // Set clientSecret - this will cause Elements to remount with clientSecret
      // PaymentElement will appear, user fills payment info, then clicks "Complete Order"
      setClientSecret(data.clientSecret);
      setIsProcessing(false);
      // Don't immediately confirm payment - wait for user to fill payment info and click "Complete Order"
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
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
          Preorder &ldquo;{bookInfo?.title || 'Waiting to Fly'}&rdquo;
        </h3>
        <p className="text-gray-600">
          Complete your order with secure payment
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <Card className="p-6">
          <h4 className="text-xl font-semibold mb-4">Checkout</h4>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Prevent any default form behavior
              if (e.nativeEvent) {
                e.nativeEvent.preventDefault();
              }
              
              console.log('Form submitted, checkoutStep:', checkoutStep);
              
              try {
                if (checkoutStep === 'order') {
                  handleContinueToShipping(e).catch(err => {
                    console.error('Error in handleContinueToShipping:', err);
                    setError(err instanceof Error ? err.message : 'An error occurred');
                    setIsProcessing(false);
                  });
                } else if (checkoutStep === 'shipping') {
                  handleContinueToPayment(e).catch(err => {
                    console.error('Error in handleContinueToPayment:', err);
                    setError(err instanceof Error ? err.message : 'An error occurred');
                    setIsProcessing(false);
                  });
                } else {
                  handleSubmit(e).catch(err => {
                    console.error('Error in handleSubmit:', err);
                    setError(err instanceof Error ? err.message : 'An error occurred');
                    setIsProcessing(false);
                  });
                }
              } catch (err) {
                console.error('Error in form submission:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                setIsProcessing(false);
              }
              
              return false;
            }} 
            className="space-y-6"
            noValidate
          >
            {/* Section 1: Order Details */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setCheckoutStep('order')}
                className={`w-full flex items-center justify-between p-4 text-left ${
                  checkoutStep === 'order' ? 'bg-gray-50' : ''
                }`}
              >
                <h5 className="font-semibold text-gray-900">
                  1. Order Details
                  {bookFormat && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      - {bookFormats?.[bookFormat]?.name || bookFormat}
                    </span>
                  )}
                </h5>
                {checkoutStep === 'order' ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {checkoutStep === 'order' && (
                <div className="p-4 space-y-4 border-t">
                  <div>
                    <Label htmlFor="format">Book Format *</Label>
                    <select
                      id="format"
                      value={bookFormat || ''}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        console.log('Format changed to:', selectedValue);
                        if (bookFormats && bookFormats[selectedValue]) {
                          setBookFormat(selectedValue);
                          // Clear error when user selects format
                          if (fieldErrors.bookFormat) {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.bookFormat;
                              return newErrors;
                            });
                          }
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('checkout_bookFormat', JSON.stringify(selectedValue));
                          }
                        } else {
                          console.error('Attempted to select invalid format:', selectedValue);
                        }
                      }}
                      required
                      className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 ${
                        fieldErrors.bookFormat 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-green-500'
                      }`}
                    >
                      {!bookFormat && (
                        <option value="">-- Select a format --</option>
                      )}
                      {Object.entries(bookFormats || {}).map(([key, format]: [string, any]) => (
                        <option key={key} value={key}>
                          {format.name} - ${format.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleContinueToShipping}
                    disabled={isProcessing || !bookFormat}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Continue'}
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Shipping Address */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => checkoutStep !== 'order' && setCheckoutStep('shipping')}
                disabled={checkoutStep === 'order'}
                className={`w-full flex items-center justify-between p-4 text-left ${
                  checkoutStep === 'shipping' ? 'bg-gray-50' : ''
                } ${checkoutStep === 'order' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <h5 className="font-semibold text-gray-900">
                  2. Shipping Address
                  {checkoutStep !== 'order' && (shippingAddressLine1 || shippingCity) && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      - {shippingCity || 'Entered'}
                    </span>
                  )}
                </h5>
                {checkoutStep === 'shipping' ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {checkoutStep === 'shipping' && (
                <div className="p-4 space-y-4 border-t">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                      }}
                      required
                      className={`w-full ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shippingFirstName">First Name *</Label>
                      <Input
                        id="shippingFirstName"
                        type="text"
                        value={shippingFirstName}
                        onChange={(e) => {
                          setShippingFirstName(e.target.value);
                          clearFieldError('shippingFirstName');
                          // Update name for customer record
                          setName(`${e.target.value} ${shippingLastName}`.trim());
                        }}
                        required
                        className={`w-full ${fieldErrors.shippingFirstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shippingLastName">Last Name *</Label>
                      <Input
                        id="shippingLastName"
                        type="text"
                        value={shippingLastName}
                        onChange={(e) => {
                          setShippingLastName(e.target.value);
                          clearFieldError('shippingLastName');
                          // Update name for customer record
                          setName(`${shippingFirstName} ${e.target.value}`.trim());
                        }}
                        required
                        className={`w-full ${fieldErrors.shippingLastName ? 'border-red-500 focus:ring-red-500' : ''}`}
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
                      onChange={(e) => {
                        setShippingAddressLine1(e.target.value);
                        clearFieldError('shippingAddressLine1');
                      }}
                      required
                      className={`w-full ${fieldErrors.shippingAddressLine1 ? 'border-red-500 focus:ring-red-500' : ''}`}
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
                        onChange={(e) => {
                          setShippingCity(e.target.value);
                          clearFieldError('shippingCity');
                        }}
                        required
                        className={`w-full ${fieldErrors.shippingCity ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shippingState">State *</Label>
                      <select
                        id="shippingState"
                        value={shippingState}
                        onChange={(e) => {
                          setShippingState(e.target.value);
                          clearFieldError('shippingState');
                        }}
                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 ${
                          fieldErrors.shippingState 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-green-500'
                        }`}
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
                        onChange={(e) => {
                          setShippingPostalCode(e.target.value);
                          clearFieldError('shippingPostalCode');
                        }}
                        required
                        className={`w-full ${fieldErrors.shippingPostalCode ? 'border-red-500 focus:ring-red-500' : ''}`}
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
                  <button
                    type="button"
                    onClick={handleContinueToPayment}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Continue'}
                  </button>
                </div>
              )}
            </div>

            {/* Section 3: Payment Information */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => checkoutStep === 'payment' && clientSecret && setCheckoutStep('payment')}
                disabled={checkoutStep !== 'payment' || !clientSecret}
                className={`w-full flex items-center justify-between p-4 text-left ${
                  checkoutStep === 'payment' ? 'bg-gray-50' : ''
                } ${checkoutStep !== 'payment' || !clientSecret ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <h5 className="font-semibold text-gray-900">
                  3. Payment Information
                </h5>
                {checkoutStep === 'payment' ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {checkoutStep === 'payment' && clientSecret && (
                <div className="p-4 space-y-4 border-t">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Payment Details</Label>
                    <div className="p-3 border border-gray-300 rounded-md bg-white min-h-[200px]">
                      {stripe && elements ? (
                        <PaymentElement
                          options={{
                            layout: 'tabs',
                            paymentMethodOrder: ['card', 'paypal', 'klarna', 'cashapp', 'amazon_pay'],
                          }}
                        />
                      ) : (
                        <div className="text-sm text-gray-500 py-8 text-center">
                          <p>Loading payment options...</p>
                          <p className="text-xs mt-2">Secure payment options: Card, PayPal, Klarna, Cash App, or Amazon Pay</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Secure payment options: Card, PayPal, Klarna, Cash App, or Amazon Pay
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!stripe || isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Continue'}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
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
              <span className="font-medium">{bookFormats?.[bookFormat as keyof typeof bookFormats]?.name || 'Hardcover'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Book:</span>
              <span className="font-medium">{bookInfo?.title || 'Waiting to Fly'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${displaySubtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">
                {hasCalculatedTax 
                  ? `$${displayTax.toFixed(2)}`
                  : 'Calculated at checkout'
                }
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>
                  {hasCalculatedTax 
                    ? `$${displayTotal.toFixed(2)}`
                    : `$${displaySubtotal.toFixed(2)} + tax`
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-md">
            <h5 className="font-medium text-green-800 mb-2">Preorder Benefits</h5>
            <ul className="text-sm text-green-700 space-y-1">
              {(preorderBenefits || []).map((benefit, index) => (
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

  // Always wrap PaymentForm in Elements - useStripe/useElements require Elements context
  // When clientSecret doesn't exist, use mode: 'payment' with placeholder amount
  // When clientSecret exists, use clientSecret
  // Don't remount Elements - Stripe handles option updates dynamically
  const elementsOptions = useMemo(() => {
    if (clientSecret) {
      return { clientSecret, appearance: { theme: 'stripe' as const } };
    }
    return { 
      mode: 'payment' as const,
      amount: 100, // Placeholder - actual amount set when payment intent is created
      currency: 'usd',
      appearance: { theme: 'stripe' as const }
    };
  }, [clientSecret]);
  
  return (
    <Elements 
      stripe={stripePromise} 
      options={elementsOptions}
    >
      <PaymentForm clientSecret={clientSecret} setClientSecret={setClientSecret} />
    </Elements>
  );
}
export function PreorderFormWithPayment({ onSuccess }: PreorderFormWithPaymentProps) {
  return (
    <PaymentFormWrapper onSuccess={onSuccess} />
  );
}
