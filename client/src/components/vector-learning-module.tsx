import { GraduationCap } from 'lucide-react';

export function VectorLearningModule() {
  return (
    <section className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg border-2 border-purple-200 dark:border-purple-800 fade-in">
      <div className="flex items-start gap-3 mb-6">
        <GraduationCap className="text-purple-600 dark:text-purple-400 mt-1" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            How Vector Similarity Works: Simple Example
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Let's understand the math with a simple 3-dimensional example using "cat" and "dog":
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Step 1: Vector Representation */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
            Words as Vectors
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Each word is represented as a list of numbers (a vector). In this simple example:
          </p>
          <div className="mt-2 bg-purple-50 dark:bg-purple-900/30 p-3 rounded font-mono text-sm">
            <div className="text-purple-700 dark:text-purple-300">cat = [0.12, -0.03, 0.44]</div>
            <div className="text-orange-600 dark:text-orange-400">dog = [0.10, -0.01, 0.47]</div>
          </div>
        </div>

        {/* Step 2: Dot Product */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
            Multiply Matching Numbers (Dot Product)
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Multiply each pair of corresponding values and add them all up:
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <th className="text-left pb-2 text-gray-700 dark:text-gray-300">Word</th>
                  <th className="text-center pb-2 text-gray-700 dark:text-gray-300">Value 1</th>
                  <th className="text-center pb-2 text-gray-700 dark:text-gray-300">Value 2</th>
                  <th className="text-center pb-2 text-gray-700 dark:text-gray-300">Value 3</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-purple-100 dark:bg-purple-900/30">
                  <td className="py-1 font-semibold text-purple-700 dark:text-purple-300">cat</td>
                  <td className="text-center">0.12</td>
                  <td className="text-center">-0.03</td>
                  <td className="text-center">0.44</td>
                </tr>
                <tr className="bg-orange-100 dark:bg-orange-900/30">
                  <td className="py-1 font-semibold text-orange-600 dark:text-orange-400">dog</td>
                  <td className="text-center">0.10</td>
                  <td className="text-center">-0.01</td>
                  <td className="text-center">0.47</td>
                </tr>
                <tr className="border-t border-gray-300 dark:border-gray-600">
                  <td className="py-1 font-semibold text-gray-700 dark:text-gray-300">Multiply ×</td>
                  <td className="text-center text-gray-600 dark:text-gray-400">↓</td>
                  <td className="text-center text-gray-600 dark:text-gray-400">↓</td>
                  <td className="text-center text-gray-600 dark:text-gray-400">↓</td>
                </tr>
                <tr className="bg-green-100 dark:bg-green-900/30">
                  <td className="py-1 font-semibold text-gray-700 dark:text-gray-300">Result</td>
                  <td className="text-center font-mono">0.012</td>
                  <td className="text-center font-mono">0.0003</td>
                  <td className="text-center font-mono">0.2068</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3 text-center font-semibold text-gray-800 dark:text-gray-200">
              Add them all: 0.012 + 0.0003 + 0.2068 = <span className="text-orange-600 dark:text-orange-400">0.2191</span>
            </div>
            <div className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
              This is called the "dot product" ✏️
            </div>
          </div>
        </div>

        {/* Step 3: Vector Length */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
            Find the "Length" of Each Vector
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Calculate the magnitude (length) of each vector using: √(value₁² + value₂² + value₃²)
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded">
              <div className="font-semibold text-purple-700 dark:text-purple-300 mb-2">cat length:</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div>Step 1: Square each value</div>
                <div className="font-mono bg-purple-50 dark:bg-purple-900/20 p-2 rounded my-1">
                  0.12² + (-0.03)² + 0.44²
                </div>
                <div>Step 2: Add them together</div>
                <div className="font-mono bg-purple-50 dark:bg-purple-900/20 p-2 rounded my-1">
                  0.0144 + 0.0009 + 0.1936 = 0.2089
                </div>
                <div>Step 3: Take the square root</div>
                <div className="font-mono bg-purple-50 dark:bg-purple-900/20 p-2 rounded my-1">
                  √0.2089 ≈ <strong>0.457</strong>
                </div>
              </div>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded">
              <div className="font-semibold text-orange-600 dark:text-orange-400 mb-2">dog length:</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div>Step 1: Square each value</div>
                <div className="font-mono bg-orange-50 dark:bg-orange-900/20 p-2 rounded my-1">
                  0.10² + (-0.01)² + 0.47²
                </div>
                <div>Step 2: Add them together</div>
                <div className="font-mono bg-orange-50 dark:bg-orange-900/20 p-2 rounded my-1">
                  0.01 + 0.0001 + 0.2209 = 0.231
                </div>
                <div>Step 3: Take the square root</div>
                <div className="font-mono bg-orange-50 dark:bg-orange-900/20 p-2 rounded my-1">
                  √0.231 ≈ <strong>0.481</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Final Cosine Similarity */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
            Put It All Together!
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Divide the dot product by the product of the two lengths:
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
            <div className="text-center">
              <div className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">
                Cosine Similarity Formula:
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded font-mono text-lg mb-3">
                (dot product) ÷ (length₁ × length₂)
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                = 0.2191 ÷ (0.457 × 0.481)
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                = 0.2191 ÷ 0.2197
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 my-3">
                ≈ 0.997
              </div>
              <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                0.997 ≈ 99.7% similar! 🎉
              </div>
            </div>
          </div>
        </div>

        {/* Bridge to Real Analysis */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 p-4 rounded-lg border-2 border-purple-300 dark:border-purple-700">
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
            <strong>Now for your words:</strong> Instead of 3 dimensions, OpenAI's model uses <strong>1536 dimensions</strong>! 
            The exact same math applies - we just have many more numbers to multiply and add. 
            Check the "Show Calculation Steps" section below to see the actual math with your words. ↓
          </p>
        </div>
      </div>
    </section>
  );
}
