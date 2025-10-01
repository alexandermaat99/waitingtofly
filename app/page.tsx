import { BookHero } from "@/components/book-hero";
import { PreorderForm } from "@/components/preorder-form";
import { AboutAuthor } from "@/components/about-author";
import { Testimonials } from "@/components/testimonials";
import { SITE_CONFIG } from "@/lib/constants";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">

      {/* Preorder Banner */}
      <div className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-lg font-semibold">
            🎉 <strong>Limited Time:</strong> Preorder now and get a <strong>signed copy</strong> of &ldquo;Waiting to Fly&rdquo; while supplies last!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <BookHero />
        
        <section className="w-full bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Get Early Access
              </h2>
              <p className="text-lg text-gray-600">
                Preorder now and be among the first to experience this captivating story
              </p>
            </div>
            <PreorderForm />
          </div>
        </section>

        <Testimonials />
        
        <AboutAuthor />

        {/* Footer */}
        <footer className="w-full bg-green-900 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{SITE_CONFIG.name}</h3>
                <p className="text-gray-400">
                  {SITE_CONFIG.tagline}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="#about" className="hover:text-white">About the Book</Link></li>
                  <li><Link href="#author" className="hover:text-white">About the Author</Link></li>
                  <li><Link href="#preorder" className="hover:text-white">Preorder</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Stay Connected</h4>
                <p className="text-gray-400 mb-4">
                  Follow us for updates and exclusive content
                </p>
                <div className="flex space-x-4">
                  <a href={SITE_CONFIG.socialLinks.twitter} className="text-gray-400 hover:text-white">Twitter</a>
                  <a href={SITE_CONFIG.socialLinks.instagram} className="text-gray-400 hover:text-white">Instagram</a>
                  <a href={SITE_CONFIG.socialLinks.facebook} className="text-gray-400 hover:text-white">Facebook</a>
                </div>
              </div>
            </div>
            <div className="border-t border-green-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 {SITE_CONFIG.name}. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
