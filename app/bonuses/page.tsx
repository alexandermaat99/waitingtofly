"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function BonusesPage() {
  const router = useRouter();

  const downloadableFile = {
    name: "bonusDownload.pdf",
    url: "/bonuses/bonusDownload.pdf"
  };

  const photos = [
    {
      id: 1,
      url: "/images/photo1.jpg",
      alt: "Group photo of six smiling individuals on a porch"
    },
    {
      id: 2,
      url: "/images/photo2.jpg",
      alt: "Family portrait of eight people standing by a pond with water lilies"
    },
  ];

  const [selectedPhoto, setSelectedPhoto] = useState<{ id: number; url: string; alt: string } | null>(null);

  const handleFileDownload = async () => {
    // Direct download for files (no email required)
    try {
      const response = await fetch(downloadableFile.url);
      if (!response.ok) {
        throw new Error('File not found');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadableFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: try direct link
      const link = document.createElement('a');
      link.href = downloadableFile.url;
      link.download = downloadableFile.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };

    if (selectedPhoto) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto]);


  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => router.back()}
          >
            ← Back
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Free Bonuses
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Thank you for your interest in &ldquo;Waiting to Fly&rdquo;! Download these exclusive bonus materials.
          </p>
        </div>

        {/* Downloadable File Section */}
        <section className="mb-16">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Bonus Content
            </h2>
            <p className="text-gray-600 mb-6">
              Download the companion workbook for "Waiting to Fly".
            </p>
            
            {/* Cover Preview */}
            <div className="mb-6 flex justify-center">
              <div className="relative max-w-md w-full">
                <Image
                  src="/images/coverPreview.png"
                  alt="Waiting to Fly Companion Workbook Cover"
                  width={600}
                  height={800}
                  quality={90}
                  className="w-full h-auto object-contain rounded-lg shadow-lg"
                  priority
                />
              </div>
            </div>
            
            <div className="text-center">
              <Button
                onClick={handleFileDownload}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                📥 Download {downloadableFile.name}
              </Button>
            </div>
          </Card>
        </section>

        {/* Photos Section */}
        <section className="mb-16">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Bonus Photos
            </h2>
            <p className="text-gray-600 mb-6">
              View these exclusive bonus photos.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {photos.map((photo, index) => (
                <div 
                  key={photo.id} 
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="relative overflow-hidden rounded-lg bg-gray-200 aspect-auto min-h-[300px]">
                    <Image
                      src={photo.url}
                      alt={photo.alt}
                      width={800}
                      height={600}
                      quality={85}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                      loading={index === 0 ? "eager" : "lazy"}
                      className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>

            {photos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Photos will be available here once uploaded.</p>
              </div>
            )}
          </Card>
        </section>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div 
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.alt}
                width={1200}
                height={900}
                quality={90}
                className="max-w-full max-h-full object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
