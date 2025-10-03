import { GraduationCap } from 'lucide-react';
import step2Image from '@assets/Screenshot 2025-10-03 at 8.12.13 PM_1759511566561.png';
import step3Image from '@assets/Screenshot 2025-10-03 at 8.12.20 PM_1759511566561.png';
import step4Image from '@assets/Screenshot 2025-10-03 at 8.12.25 PM_1759511566560.png';

export function VectorLearningModule() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg mb-6 border-2 border-purple-200 dark:border-purple-800">
      <div className="flex items-start gap-3 mb-4">
        <GraduationCap className="text-purple-600 dark:text-purple-400 mt-1" size={24} />
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            How Vector Similarity Works: Simple Example
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Before we dive into your 1536-dimensional word vectors, let's understand the math with a simple 3-dimensional example using "cat" and "dog":
          </p>
        </div>
      </div>

      <div className="space-y-4 mt-6">
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
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                Multiply Matching Numbers (Dot Product)
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Multiply each pair of corresponding values and add them all up:
              </p>
            </div>
            <img 
              src={step2Image} 
              alt="Dot product calculation" 
              className="w-64 rounded-lg shadow-md"
            />
          </div>
        </div>

        {/* Step 3: Vector Length */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                Find the "Length" of Each Vector
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Calculate the magnitude (length) of each vector using: √(value₁² + value₂² + value₃²)
              </p>
            </div>
            <img 
              src={step3Image} 
              alt="Vector length calculation" 
              className="w-64 rounded-lg shadow-md"
            />
          </div>
        </div>

        {/* Step 4: Final Cosine Similarity */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                Put It All Together!
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Divide the dot product by the product of the two lengths:
              </p>
            </div>
            <img 
              src={step4Image} 
              alt="Cosine similarity formula" 
              className="w-64 rounded-lg shadow-md"
            />
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
    </div>
  );
}
