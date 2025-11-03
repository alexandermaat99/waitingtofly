"use client";

import { Card } from "@/components/ui/card";
import { getAuthorInfo } from "@/lib/site-config-client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function AboutAuthor() {
  const [authorInfo, setAuthorInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorInfo = async () => {
      try {
        const data = await getAuthorInfo();
        setAuthorInfo(data);
      } catch (error) {
        console.error('Error fetching author info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthorInfo();
  }, []);

  if (isLoading) {
    return (
      <section id="author" className="w-full max-w-6xl mx-auto px-4 py-16">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading author information...</p>
        </div>
      </section>
    );
  }

  if (!authorInfo) {
    return (
      <section id="author" className="w-full max-w-6xl mx-auto px-4 py-16">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load author information.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="author" className="w-full max-w-6xl mx-auto px-4 py-16">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Author Photo */}
        <div className="flex justify-center lg:justify-start">
          <Card className="overflow-hidden border-2 border-gray-200">
            {authorInfo.photo ? (
              <Image
                src={authorInfo.photo}
                alt={`${authorInfo.name} - Author Photo`}
                width={200}
                height={384}
                className="w-full h-full object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">👤</div>
                  <p className="text-lg font-medium">Author Photo</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Author Information */}
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              About the Author
            </h2>
            <h3 className="text-xl text-green-600 font-semibold mb-4">
              {authorInfo.name}
            </h3>
          </div>

          <div className="space-y-4">
            <p className="text-lg text-gray-700 leading-relaxed">
              {authorInfo.bio}
            </p>
            
            <p 
              className="text-lg text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: authorInfo.personalNote }}
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium italic">
              &ldquo;{authorInfo.quote}&rdquo;
            </p>
            <p className="text-green-700 text-sm mt-2">— {authorInfo.name}</p>
          </div>

          <div className="space-y-4">
            {/* <div>
              <h4 className="font-semibold text-gray-900 mb-3">Education:</h4>
              <div className="space-y-3">
                {authorInfo.education.map((edu, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium text-gray-900">{edu.degree}</div>
                    <div className="text-sm text-green-600 font-medium">{edu.school}</div>
                    <div className="text-xs text-gray-500">{edu.years}</div>
                  </div>
                ))}
              </div>
            </div> */}

            <div>
              <h4 className="font-semibold text-gray-900">Previous Works:</h4>
              <ul className="text-gray-700 space-y-1 mt-2">
                {authorInfo.previousWorks.map((work: any, index: number) => {
                  // Hardcode year to 2020 for "Before I Became a Refugee Girl"
                  const displayYear = work.title?.includes("Before I Became a Refugee Girl") ? "2020" : (work.year || "");
                  return (
                    <li key={index}>
                      <Link 
                        href={work.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-green-600 transition-colors duration-200"
                      >
                        &ldquo;{work.title}&rdquo; ({displayYear}) - {work.achievement}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
