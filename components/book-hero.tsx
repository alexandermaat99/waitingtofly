"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BOOK_INFO } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";

export function BookHero() {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-16">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Book Cover */}
        <div className="flex justify-center lg:justify-start">
          {BOOK_INFO.coverImage ? (
            <Image
              src={BOOK_INFO.coverImage}
              alt={`${BOOK_INFO.title} - Book Cover`}
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
                {BOOK_INFO.series}
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {BOOK_INFO.title}
            </h1>
            <p className="text-xl text-gray-600 mb-2">by {BOOK_INFO.author}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <span>{BOOK_INFO.genre}</span>
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Previous book in the series:</p>
              <p className="italic">&ldquo;{BOOK_INFO.previousBook}&rdquo;</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-lg text-gray-700 leading-relaxed">
              {BOOK_INFO.description}
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                🎉 {BOOK_INFO.preorderBonus}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/checkout">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
                Preorder Now
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
              Read Sample
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            <p>Expected Release: {BOOK_INFO.releaseDate}</p>
            <p>Available in: {BOOK_INFO.formats.join(", ")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
