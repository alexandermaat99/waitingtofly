import { Card } from "@/components/ui/card";
import { TESTIMONIALS, BOOK_INFO } from "@/lib/constants";
import Link from "next/link";

export function Testimonials() {

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          What Readers Are Saying
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        The following words are drawn from early reader responses to Samly Maat&apos;s first memoir, <Link href={BOOK_INFO.previousBookUrl} target="_blank" rel="noopener noreferrer" className="font-semibold italic hover:text-green-600 transition-colors duration-200">Before I Became a Refugee Girl</Link>. They capture the spirit of courage, gratitude, and hope that continues in her next book, <span className="font-semibold italic">Waiting to Fly</span>.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {TESTIMONIALS.map((testimonial, index) => (
          <Card key={index} className="p-6 bg-white border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="text-yellow-400 text-2xl">
                ⭐⭐⭐⭐⭐
              </div>
              <blockquote className="text-gray-700 italic leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="border-t border-gray-100 pt-4">
                <p className="font-semibold text-gray-900">
                  {testimonial.author}
                </p>
                <p className="text-sm text-gray-600">
                  {testimonial.role}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* <div className="text-center mt-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Join Thousands of Preorder Readers
          </h3>
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">{PREORDER_STATS.earlyPreorders}</div>
              <div className="text-sm text-gray-600">Early Preorders</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{PREORDER_STATS.rating}</div>
              <div className="text-sm text-gray-600">Early Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{PREORDER_STATS.countries}</div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
          </div>
        </div>
      </div> */}
    </section>
  );
}
