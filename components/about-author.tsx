import { Card } from "@/components/ui/card";
import { AUTHOR_INFO } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";

export function AboutAuthor() {
  return (
    <section id="author" className="w-full max-w-6xl mx-auto px-4 py-16">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Author Photo */}
        <div className="flex justify-center lg:justify-start">
          <Card className="overflow-hidden border-2 border-gray-200">
            {AUTHOR_INFO.photo ? (
              <Image
                src={AUTHOR_INFO.photo}
                alt={`${AUTHOR_INFO.name} - Author Photo`}
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
              {AUTHOR_INFO.name}
            </h3>
          </div>

          <div className="space-y-4">
            <p className="text-lg text-gray-700 leading-relaxed">
              {AUTHOR_INFO.bio}
            </p>
            
            <p 
              className="text-lg text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: AUTHOR_INFO.personalNote }}
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium italic">
              &ldquo;{AUTHOR_INFO.quote}&rdquo;
            </p>
            <p className="text-green-700 text-sm mt-2">— {AUTHOR_INFO.name}</p>
          </div>

          <div className="space-y-4">
            {/* <div>
              <h4 className="font-semibold text-gray-900 mb-3">Education:</h4>
              <div className="space-y-3">
                {AUTHOR_INFO.education.map((edu, index) => (
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
                {AUTHOR_INFO.previousWorks.map((work, index) => (
                  <li key={index}>
                    <Link 
                      href={work.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-600 transition-colors duration-200"
                    >
                      • &ldquo;{work.title}&rdquo; ({work.year}) - {work.achievement}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
