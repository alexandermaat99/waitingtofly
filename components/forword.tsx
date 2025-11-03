import { Card } from "@/components/ui/card";

export function Forword() {
  return (
    <section id="forword" className="w-full max-w-6xl mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Forword
            </h2>
            <p className="text-lg text-gray-600 mb-4">by Raymond Aaron</p>
            <div className="w-24 h-1 bg-green-600 mx-auto"></div>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              I first met <strong>Samly Maat</strong> at my 10-10-10 program. From the moment she spoke, I felt her fire: calm, focused, and unstoppable. She wasn&apos;t just writing a book; she was claiming her freedom. I knew then that when she spoke of rising, she spoke from truth, not imagination.
            </p>
            
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              <strong>Waiting to Fly</strong> is more than a memoir. It is a mirror that reflects courage and endurance. Each page carries the heartbeat of a girl who refused to be broken and the woman who rose beyond fear to light the way for others.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              I have guided many authors, but few carry this rare mix of honesty and grace. Samly writes with quiet power that draws you in. She does not tell you what to believe; she shows you how belief is born.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              This book will move you. It will remind you that freedom is not given; it is chosen, earned, and lived.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Samly&apos;s journey does not end here. <strong>Waiting to Fly</strong> is one chapter in a larger story, a rise from silence to strength, from survival to leadership. Every word carries the same truth: no matter where you begin, you can always rise higher.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              I am proud to introduce <strong>Waiting to Fly</strong>. Let this story lift you.
            </p>

            <div className="text-right border-t border-gray-200 pt-6">
              <p className="text-xl font-bold text-gray-900 mb-1">— Raymond Aaron</p>
              <p className="text-lg text-green-600 font-semibold">New York Times Bestselling Author</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

