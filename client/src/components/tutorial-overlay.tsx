import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to AI Word Vector Visualizer! 🎉",
    description: "This interactive tool helps you understand how AI represents and relates words using vector embeddings. Let's take a quick tour!",
  },
  {
    title: "Step 1: Enter Words",
    description: "Start by entering 2-4 words in the input boxes. Try related words like 'king, queen, man, woman' or any words you're curious about!",
    target: "input-word1",
  },
  {
    title: "Step 2: Analyze Vectors",
    description: "Click 'Analyze Word Vectors' to convert your words into 1536-dimensional embeddings using OpenAI's AI model. The AI captures the meaning and context of each word.",
    target: "button-analyze",
  },
  {
    title: "Step 3: See Similarities",
    description: "View cosine similarity scores between word pairs. Scores range from -1 to 1, where higher scores mean words are more semantically related.",
  },
  {
    title: "Step 4: Explore 3D Space",
    description: "See your words visualized in 3D space! Words with similar meanings appear closer together. You can rotate, zoom, and explore the visualization.",
  },
  {
    title: "Try Word Prediction",
    description: "Scroll down to try the word prediction demo. See how AI uses vector similarity to predict the next word in a sentence!",
  },
  {
    title: "Save & Compare",
    description: "Save your analyses and compare different word sets side-by-side to discover patterns and relationships!",
  },
  {
    title: "You're All Set! 🚀",
    description: "Now you understand how AI represents words as vectors. Start exploring and learning how AI understands language!",
  },
];

const TUTORIAL_STORAGE_KEY = "wordvector_tutorial_completed";

export default function TutorialOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-2xl max-w-lg w-full border-2 border-primary/30">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary" size={24} />
              <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-testid="button-close-tutorial"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-foreground/80 mb-6">{step.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep === 0 && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  data-testid="button-skip-tutorial"
                >
                  Skip Tutorial
                </Button>
              )}
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  data-testid="button-previous-step"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                data-testid="button-next-step"
              >
                {currentStep === tutorialSteps.length - 1 ? (
                  "Get Started"
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
