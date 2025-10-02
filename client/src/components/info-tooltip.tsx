import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  content: string;
  title?: string;
}

export default function InfoTooltip({ content, title }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center" data-testid="tooltip-trigger">
            <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" data-testid="tooltip-content">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
