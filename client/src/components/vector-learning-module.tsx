export function VectorLearningModule() {
  return (
    <section className="bg-card p-6 rounded-lg border border-border fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-2">
        How Vector Similarity Works: Simple Example
      </h2>
      <p className="text-muted-foreground mb-6">
        Let's understand the math with a simple 3-dimensional example using "cat" and "dog":
      </p>

      <div className="space-y-4">
        {/* Step 1: Vector Representation */}
        <div className="bg-muted/30 dark:bg-muted/10 p-4 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-2">
            Words as Vectors
          </h4>
          <p className="text-sm text-muted-foreground">
            Each word is represented as a list of numbers (a vector). In this simple example:
          </p>
          <div className="mt-2 bg-background p-3 rounded font-mono text-sm border border-border">
            <div className="text-foreground">cat = [0.12, -0.03, 0.44]</div>
            <div className="text-foreground">dog = [0.10, -0.01, 0.47]</div>
          </div>
        </div>

        {/* Step 2: Dot Product */}
        <div className="bg-muted/30 dark:bg-muted/10 p-4 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-2">
            Multiply Matching Numbers (Dot Product)
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Multiply each pair of corresponding values and add them all up:
          </p>
          <div className="bg-background p-3 rounded border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-2 text-foreground">Word</th>
                  <th className="text-center pb-2 text-foreground">Value 1</th>
                  <th className="text-center pb-2 text-foreground">Value 2</th>
                  <th className="text-center pb-2 text-foreground">Value 3</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 font-semibold text-foreground">cat</td>
                  <td className="text-center text-muted-foreground">0.12</td>
                  <td className="text-center text-muted-foreground">-0.03</td>
                  <td className="text-center text-muted-foreground">0.44</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 font-semibold text-foreground">dog</td>
                  <td className="text-center text-muted-foreground">0.10</td>
                  <td className="text-center text-muted-foreground">-0.01</td>
                  <td className="text-center text-muted-foreground">0.47</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 font-semibold text-foreground">Multiply ×</td>
                  <td className="text-center text-muted-foreground">↓</td>
                  <td className="text-center text-muted-foreground">↓</td>
                  <td className="text-center text-muted-foreground">↓</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold text-foreground">Result</td>
                  <td className="text-center font-mono text-muted-foreground">0.012</td>
                  <td className="text-center font-mono text-muted-foreground">0.0003</td>
                  <td className="text-center font-mono text-muted-foreground">0.2068</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3 text-center font-semibold text-foreground">
              Add them all: 0.012 + 0.0003 + 0.2068 = <span className="text-primary">0.2191</span>
            </div>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              This is called the "dot product"
            </div>
          </div>
        </div>

        {/* Step 3: Vector Length */}
        <div className="bg-muted/30 dark:bg-muted/10 p-4 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-2">
            Find the "Length" of Each Vector
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Calculate the magnitude (length) of each vector using: √(value₁² + value₂² + value₃²)
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-background p-3 rounded border border-border">
              <div className="font-semibold text-foreground mb-2">cat length:</div>
              <div className="text-sm text-muted-foreground space-y-2">
                <div>Square each value</div>
                <div className="font-mono bg-muted/30 dark:bg-muted/10 p-2 rounded">
                  0.12² + (-0.03)² + 0.44²
                </div>
                <div>Add them together</div>
                <div className="font-mono bg-muted/30 dark:bg-muted/10 p-2 rounded">
                  0.0144 + 0.0009 + 0.1936 = 0.2089
                </div>
                <div>Take the square root</div>
                <div className="font-mono bg-muted/30 dark:bg-muted/10 p-2 rounded">
                  √0.2089 ≈ <strong className="text-primary">0.457</strong>
                </div>
              </div>
            </div>
            <div className="bg-background p-3 rounded border border-border">
              <div className="font-semibold text-foreground mb-2">dog length:</div>
              <div className="text-sm text-muted-foreground space-y-2">
                <div>Square each value</div>
                <div className="font-mono bg-muted/30 dark:bg-muted/10 p-2 rounded">
                  0.10² + (-0.01)² + 0.47²
                </div>
                <div>Add them together</div>
                <div className="font-mono bg-muted/30 dark:bg-muted/10 p-2 rounded">
                  0.01 + 0.0001 + 0.2209 = 0.231
                </div>
                <div>Take the square root</div>
                <div className="font-mono bg-muted/30 dark:bg-muted/10 p-2 rounded">
                  √0.231 ≈ <strong className="text-primary">0.481</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Final Cosine Similarity */}
        <div className="bg-muted/30 dark:bg-muted/10 p-4 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-2">
            Put It All Together!
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Divide the dot product by the product of the two lengths:
          </p>
          <div className="bg-background p-4 rounded border border-border">
            <div className="text-center">
              <div className="font-semibold text-lg text-foreground mb-2">
                Cosine Similarity Formula:
              </div>
              <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded font-mono text-lg mb-3">
                (dot product) ÷ (length₁ × length₂)
              </div>
              <div className="text-muted-foreground mb-2">
                = 0.2191 ÷ (0.457 × 0.481)
              </div>
              <div className="text-muted-foreground mb-2">
                = 0.2191 ÷ 0.2197
              </div>
              <div className="text-3xl font-bold text-primary my-3">
                ≈ 0.997
              </div>
              <div className="text-xl font-semibold text-foreground">
                0.997 ≈ 99.7% similar!
              </div>
            </div>
          </div>
        </div>

        {/* Bridge to Real Analysis */}
        <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20">
          <p className="text-sm text-foreground font-medium">
            <strong>Now for your words:</strong> Instead of 3 dimensions, OpenAI's model uses <strong>1536 dimensions</strong>! 
            The exact same math applies - we just have many more numbers to multiply and add. 
            Check the "Show Calculation Steps" section below to see the actual math with your words.
          </p>
        </div>
      </div>
    </section>
  );
}
