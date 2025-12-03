"use client";

import { BookHero } from "@/components/book-hero";
import { PreorderForm } from "@/components/preorder-form";
import { AboutAuthor } from "@/components/about-author";
import { Foreword } from "@/components/foreword";
import { Testimonials } from "@/components/testimonials";
import { getSiteConfigData, getPreorderStatus } from "@/lib/site-config-client";
import Link from "next/link";
import { FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function Home() {
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [preorderStatus, setPreorderStatus] = useState<{ status: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siteData, status] = await Promise.all([
          getSiteConfigData(),
          getPreorderStatus()
        ]);
        setSiteConfig(siteData);
        setPreorderStatus(status);
      } catch (error) {
        console.error('Error fetching site data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  const isSoldOut = preorderStatus && (preorderStatus.status === "Sold Out" || preorderStatus.status === "Closed");

  return (
    <main className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">

      {/* Preorder Banner - Only show if not sold out */}
      {!isSoldOut && (
        <Link href="/checkout" className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 hover:from-green-700 hover:to-green-800 transition-all duration-200 cursor-pointer block overflow-x-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-base sm:text-lg font-semibold break-words px-2">
              🎉 <strong>Limited Time:</strong> Preorder now and get a <strong>signed copy</strong> of &ldquo;Waiting to Fly&rdquo; while supplies last!
            </p>
          </div>
        </Link>
      )}
      
      {/* Sold Out Banner */}
      {isSoldOut && (
        <div className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 overflow-x-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-base sm:text-lg font-semibold break-words px-2 mb-2">
              <span className="text-red-300 font-bold">{preorderStatus?.status}</span>: {preorderStatus?.message}
            </p>
            <a 
              href="/#preorder" 
              className="inline-block bg-white text-green-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              Sign up for updates
            </a>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 w-full overflow-x-hidden">
        <BookHero />
        
        <section id="preorder" className="w-full bg-gray-50 py-16 overflow-x-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Stay Connected
              </h2>
              <p className="text-lg text-gray-600">
              Receive new releases, event updates, and gentle reflections that offer encouragement to help you remember your light and walk your journey with courage.              </p>
            </div>
            <PreorderForm />
          </div>
        </section>

        <Testimonials />
        
        <AboutAuthor />
        
        <Foreword />

        {/* Footer */}
        <footer className="w-full bg-green-900 text-white py-16 overflow-x-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{siteConfig?.name || 'Waiting to Fly'}</h3>
                <p className="text-gray-400">
                  {siteConfig?.tagline || 'A powerful memoir about resilience, hope, and the refugee experience.'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="#about" scroll={true} className="hover:text-white transition-colors duration-200">About the Book</Link></li>
                  <li><Link href="#author" scroll={true} className="hover:text-white transition-colors duration-200">About the Author</Link></li>
                  <li><Link href="/checkout" className="hover:text-white transition-colors duration-200">Preorder</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Stay Connected</h4>
                <p className="text-gray-400 mb-4">
                  Follow us for updates and exclusive content
                </p>
                <div className="flex flex-col space-y-2 mb-4">
                  <Link href="#preorder" scroll={true} className="text-gray-400 hover:text-white transition-colors duration-200">
                    Join Mailing List
                  </Link>
                </div>
                <div className="flex space-x-4">
                  <a href={siteConfig?.socialLinks?.instagram || '#'} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200" aria-label="Instagram">
                    <FaInstagram size={24} />
                  </a>
                  <a href={siteConfig?.socialLinks?.facebook || '#'} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200" aria-label="Facebook">
                    <FaFacebook size={24} />
                  </a>
                  <a href={siteConfig?.socialLinks?.linkedin || '#'} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200" aria-label="LinkedIn">
                    <FaLinkedin size={24} />
                  </a>
                </div>
              </div>
            </div>
            <div className="border-t border-green-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 Dr. Samly Maat. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
