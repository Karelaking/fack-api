"use client";

import * as React from "react";
import { RiSparkling2Fill, RiLoader2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AiPromptFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isGenerating: boolean;
}

const TEMPLATE_PRESETS = [
  {
    label: "🛒 E-Commerce",
    prompt:
      "Create an e-commerce API with products catalog, categories, user shopping cart, and checkout orders.",
  },
  {
    label: "📱 Social Network",
    prompt:
      "Create a social media API where users can create profiles, publish feed posts, comment, like posts, and follow friends.",
  },
  {
    label: "🍔 Food Delivery",
    prompt:
      "Create a food delivery API with nearby restaurants, food menus, customer carts, and delivery tracking orders.",
  },
  {
    label: "🔐 Auth & Users",
    prompt:
      "Add complete authentication and user management APIs with login, register, profile, and session refresh.",
  },
  {
    label: "📊 SaaS Analytics",
    prompt:
      "Create a SaaS project management API with workspace projects, issue tracker tasks, milestones, and team members.",
  },
];

export const AiPromptForm = ({
  prompt,
  onPromptChange,
  onSubmit,
  isGenerating,
}: AiPromptFormProps): React.JSX.Element => {
  return (
    <form
      onSubmit={onSubmit}
      aria-busy={isGenerating}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="ai-prompt-textarea"
          className="text-foreground text-xs font-semibold"
        >
          Describe your backend requirement:
        </label>
        <Textarea
          id="ai-prompt-textarea"
          placeholder="e.g. Create a booking API for vacation rentals with properties, availability dates, reservations, and reviews..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={4}
          required
          minLength={1}
          className="resize-none"
          disabled={isGenerating}
        />
      </div>

      {/* Quick Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-[11px] font-medium">
          Quick Templates:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onPromptChange(preset.prompt)}
              disabled={isGenerating}
              className="border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center rounded-md border px-2.5 py-1 text-xs transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={isGenerating || !prompt.trim()}>
          <span className="flex items-center gap-2">
            {isGenerating ? (
              <>
                <RiLoader2Line className="size-4 animate-spin" />
                <span>Designing API...</span>
              </>
            ) : (
              <>
                <RiSparkling2Fill className="size-4" />
                <span>Generate Mock API</span>
              </>
            )}
          </span>
        </Button>
      </div>
    </form>
  );
};
