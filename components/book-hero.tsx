"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBookInfo } from "@/lib/site-config-client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function BookHero() {
  const [bookInfo, setBookInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  if (isLoading) {
    return (
      <section id="about" className="w-full max-w-6xl mx-auto px-4 py-16">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading book information...</p>
        </div>
      </section>
    );
  }

  if (!bookInfo) {
    return (
      <section id="about" className="w-full max-w-6xl mx-auto px-4 py-16">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load book information.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="w-full max-w-6xl mx-auto px-4 py-16">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Book Cover */}
        <div className="flex justify-center lg:justify-start">
          {bookInfo.coverImage ? (
            <Image
              src={bookInfo.coverImage}
              alt={`${bookInfo.title} - Book Cover`}
              width={500}
              height={384}
              className="max-w-full h-auto object-contain"
              priority
            />
          ) : (
            <Card className="w-80 h-96 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📖</div>
                <p className="text-lg font-medium">Book Cover</p>
                <p className="text-sm">Coming Soon</p>
              </div>
            </Card>
          )}
        </div>

        {/* Book Information */}
        <div className="space-y-6">
          <div>
            <div className="mb-2">
              <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                {bookInfo.series}
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {bookInfo.title}
            </h1>
            <p className="text-xl text-gray-600 mb-2">by {bookInfo.author}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <span>{bookInfo.genre}</span>
            </div>
            <Link 
              href={bookInfo.previousBookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-gray-600 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <p className="font-medium mb-1">Previous book in the series:</p>
              <p className="italic">&ldquo;{bookInfo.previousBook}&rdquo;</p>
            </Link>
          </div>

          <div className="space-y-4">
            <p className="text-lg text-gray-700 leading-relaxed">
              {bookInfo.description}
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                🎉 {bookInfo.preorderBonus}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/checkout">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
                Preorder Now
              </Button>
            </Link>
            <Link href="#forward" scroll={true}>
              <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 text-lg">
                Read Forward
              </Button>
            </Link>
          </div>

          <div className="text-sm text-gray-500">
            <p>Expected Release: {bookInfo.releaseDate}</p>
            <p>Available in: {bookInfo.formats.join(", ")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
