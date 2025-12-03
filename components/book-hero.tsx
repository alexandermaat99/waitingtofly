"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBookInfo, getPreorderStatus } from "@/lib/site-config-client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function BookHero() {
  const [bookInfo, setBookInfo] = useState<any>(null);
  const [preorderStatus, setPreorderStatus] = useState<{ status: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookInfo = async () => {
      try {
        const [data, status] = await Promise.all([
          getBookInfo(),
          getPreorderStatus()
        ]);
        setBookInfo(data);
        setPreorderStatus(status);
      } catch (error) {
        console.error('Error fetching book info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookInfo();
  }, []);

  if (isLoading) {
    return (
      <section id="about" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 overflow-x-hidden">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading book information...</p>
        </div>
      </section>
    );
  }

  if (!bookInfo) {
    return (
      <section id="about" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 overflow-x-hidden">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load book information.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 overflow-x-hidden">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Book Cover */}
        <div className="flex justify-center lg:justify-start w-full max-w-full">
          {bookInfo.coverImage ? (
            <Image
              src={bookInfo.coverImage}
              alt={`${bookInfo.title} - Book Cover`}
              width={500}
              height={384}
              className="w-full max-w-full h-auto object-contain"
              priority
            />
          ) : (
            <Card className="w-full max-w-80 h-96 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📖</div>
                <p className="text-lg font-medium">Book Cover</p>
                <p className="text-sm">Coming Soon</p>
              </div>
            </Card>
          )}
        </div>

        {/* Book Information */}
        <div className="space-y-6 w-full min-w-0">
          <div className="min-w-0">
            <div className="mb-2">
              <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full break-words">
                {bookInfo.series}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 break-words">
              {bookInfo.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-2 break-words">by {bookInfo.author}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
              <span className="break-words">{bookInfo.genre}</span>
            </div>
            <Link 
              href={bookInfo.previousBookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-gray-600 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 break-words"
            >
              <p className="font-medium mb-1">Previous book in the series:</p>
              <p className="italic break-words">&ldquo;{bookInfo.previousBook}&rdquo;</p>
            </Link>
          </div>

          <div className="space-y-4 min-w-0">
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed break-words">
              {bookInfo.description}
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 break-words">
              <p className="text-green-800 font-medium break-words">
                🎉 {bookInfo.preorderBonus}
              </p>
            </div>
          </div>

          {preorderStatus && (preorderStatus.status === "Sold Out" || preorderStatus.status === "Closed") ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="mb-3">
                <span className="inline-block bg-red-100 text-red-700 text-lg font-semibold px-4 py-2 rounded-full">
                  {preorderStatus.status}
                </span>
              </div>
              <p className="text-base text-gray-700 leading-relaxed mb-4">
                {preorderStatus.message}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                <Link href="/#preorder" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg">
                    Sign up for updates
                  </Button>
                </Link>
                <Link href="#foreword" scroll={true} className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-50 px-6 sm:px-8 py-3 text-base sm:text-lg">
                    Read Foreword
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <Link href="/checkout" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg">
                  Preorder Now
                </Button>
              </Link>
              <Link href="#foreword" scroll={true} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-50 px-6 sm:px-8 py-3 text-base sm:text-lg">
                  Read Foreword
                </Button>
              </Link>
            </div>
          )}

          <div className="text-sm text-gray-500 break-words">
            <p>Expected Release: {bookInfo.releaseDate}</p>
            <p>Available in: {bookInfo.formats.join(", ")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
