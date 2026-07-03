import type { CSSProperties } from "react";

const DEFAULT_SEARCH_PROMPTS = [
  "Which sectors are leading the NIFTY 50 today?",
  "Find stocks with rising volume and positive news",
  "Which banks are outperforming the index?",
  "Show weak stocks despite market strength",
];

interface AnimatedSearchPromptProps {
  prompts?: string[];
  className?: string;
}

export function AnimatedSearchPrompt({
  prompts = DEFAULT_SEARCH_PROMPTS,
  className = "",
}: AnimatedSearchPromptProps) {
  const promptList = prompts.filter(Boolean).slice(0, 4);
  const visiblePrompts = promptList.length > 0 ? promptList : DEFAULT_SEARCH_PROMPTS;
  const promptStyle = {
    "--animated-search-prompt-count": visiblePrompts.length,
  } as CSSProperties;

  return (
    <span
      className={["animated-search-prompt", className].filter(Boolean).join(" ")}
      style={promptStyle}
      aria-hidden="true"
    >
      {visiblePrompts.map((prompt, index) => (
        <span
          key={prompt}
          className="animated-search-prompt-line"
          style={
            {
              "--animated-search-prompt-index": index,
              "--animated-search-prompt-ch": prompt.length + 1,
            } as CSSProperties
          }
        >
          {prompt}
        </span>
      ))}
    </span>
  );
}

