"use client";

import * as React from "react";
import { RiAddLine, RiDeleteBin6Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConditionalRule } from "@/lib/mock-engine";
import { toast } from "sonner";

interface RulesEditorProps {
  rules: ConditionalRule[];
  onRulesChange: (rules: ConditionalRule[]) => void;
}

const RULE_PRESETS: { label: string; rule: Omit<ConditionalRule, "id"> }[] = [
  {
    label: "401 If No Auth Header",
    rule: {
      type: "header",
      key: "authorization",
      operator: "exists",
      value: "",
      responseStatus: 401,
      responseBody:
        '{\n  "error": "Unauthorized",\n  "message": "Missing authorization header"\n}',
    },
  },
  {
    label: "404 On Not Found ID",
    rule: {
      type: "query",
      key: "id",
      operator: "equals",
      value: "999",
      responseStatus: 404,
      responseBody:
        '{\n  "error": "Not Found",\n  "message": "Record 999 does not exist"\n}',
    },
  },
  {
    label: "500 On ?error=true",
    rule: {
      type: "query",
      key: "error",
      operator: "equals",
      value: "true",
      responseStatus: 500,
      responseBody:
        '{\n  "error": "Internal Server Error",\n  "message": "Simulated server failure"\n}',
    },
  },
];

export const RulesEditor = ({
  rules,
  onRulesChange,
}: RulesEditorProps): React.JSX.Element => {
  const handleAdd = () => {
    const newRule: ConditionalRule = {
      id: crypto.randomUUID(),
      type: "query",
      key: "",
      operator: "equals",
      value: "",
      responseStatus: 200,
      responseBody: "",
    };
    onRulesChange([...rules, newRule]);
  };

  const handleAddPreset = (preset: (typeof RULE_PRESETS)[number]) => {
    const newRule: ConditionalRule = {
      id: crypto.randomUUID(),
      ...preset.rule,
    };
    onRulesChange([...rules, newRule]);
    toast.success(`Added "${preset.label}" rule`);
  };

  const handleRemove = (id: string) => {
    onRulesChange(rules.filter((r) => r.id !== id));
  };

  const handleChange = (
    id: string,
    field: keyof ConditionalRule,
    value: string | number,
  ) => {
    onRulesChange(
      rules.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold">Conditional Response Rules</h3>
          <p className="text-muted-foreground text-[10px]">
            Override status and payload based on query params, headers, or URL
            params.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          className="h-7 text-xs font-semibold"
        >
          <RiAddLine className="h-3.5 w-3.5" />
          <span>Add Rule</span>
        </Button>
      </div>

      {/* Quick Rule Presets */}
      <div className="space-y-1">
        <span className="text-muted-foreground block text-[9.5px] font-bold tracking-wider uppercase">
          Rule Presets
        </span>
        <div className="flex flex-wrap gap-1">
          {RULE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleAddPreset(preset)}
              className="bg-muted/40 hover:bg-muted border-border text-foreground hover:border-muted-foreground/30 flex cursor-pointer items-center gap-1 border px-2 py-0.5 font-mono text-[9.5px] transition-colors"
            >
              <RiAddLine className="text-muted-foreground h-2.5 w-2.5" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="bg-muted/20 border-border/80 flex flex-col items-center justify-center space-y-1.5 border border-dashed p-6 text-center">
          <span className="text-xs font-semibold">No rules configured</span>
          <p className="text-muted-foreground max-w-64 text-[10px] leading-normal">
            Rules allow matching requests (e.g. `?error=true`) to return dynamic
            mock status codes and JSON payloads.
          </p>
          <Button
            type="button"
            size="xs"
            variant="secondary"
            onClick={handleAdd}
            className="h-6.5 px-2 text-[10px] font-bold"
          >
            Create First Rule
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-card border-border relative space-y-2.5 border p-3 shadow-xs"
            >
              {/* Condition trigger configuration */}
              <div className="flex flex-wrap items-center gap-1.5 pr-6">
                <span className="text-muted-foreground text-[9.5px] font-bold uppercase">
                  IF
                </span>
                <Select
                  value={rule.type}
                  onValueChange={(val) =>
                    handleChange(rule.id, "type", val ?? "query")
                  }
                >
                  <SelectTrigger
                    aria-label="Condition Type"
                    className="bg-card h-7 w-21.25 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="query">Query</SelectItem>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="param">Param</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Input
                  value={rule.key}
                  onChange={(e) => handleChange(rule.id, "key", e.target.value)}
                  placeholder="key (e.g. status)"
                  aria-label="Condition Key"
                  className="bg-card h-7 min-w-17.5 flex-1 text-xs"
                />

                <Select
                  value={rule.operator}
                  onValueChange={(val) =>
                    handleChange(rule.id, "operator", val ?? "equals")
                  }
                >
                  <SelectTrigger
                    aria-label="Condition Operator"
                    className="bg-card h-7 w-22.5 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="exists">Exists</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {rule.operator !== "exists" && (
                  <Input
                    value={rule.value}
                    onChange={(e) =>
                      handleChange(rule.id, "value", e.target.value)
                    }
                    placeholder="value (e.g. error)"
                    aria-label="Condition Value"
                    className="bg-card h-7 min-w-17.5 flex-1 text-xs"
                  />
                )}
              </div>

              {/* Action triggers: Status and Response Body */}
              <div className="grid grid-cols-5 items-start gap-2">
                <div className="col-span-1 space-y-1">
                  <label
                    htmlFor={`rule-status-${rule.id}`}
                    className="text-muted-foreground block text-[8px] font-bold tracking-wider uppercase"
                  >
                    Status
                  </label>
                  <Input
                    id={`rule-status-${rule.id}`}
                    type="number"
                    value={rule.responseStatus}
                    onChange={(e) =>
                      handleChange(
                        rule.id,
                        "responseStatus",
                        parseInt(e.target.value, 10) || 200,
                      )
                    }
                    placeholder="200"
                    aria-label="Response Status"
                    className="bg-card h-7 text-xs"
                  />
                </div>
                <div className="col-span-4 space-y-1">
                  <label
                    htmlFor={`rule-body-${rule.id}`}
                    className="text-muted-foreground block text-[8px] font-bold tracking-wider uppercase"
                  >
                    Custom Response Body (JSON)
                  </label>
                  <Textarea
                    id={`rule-body-${rule.id}`}
                    value={rule.responseBody}
                    onChange={(e) =>
                      handleChange(rule.id, "responseBody", e.target.value)
                    }
                    placeholder='{"error": "Custom Error"}'
                    aria-label="Custom Response Body"
                    className="bg-card h-14 resize-none p-1.5 font-mono text-[10px] leading-tight"
                  />
                </div>
              </div>

              {/* Remove button */}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 absolute top-1.5 right-1.5 h-6 w-6 shrink-0"
                title="Delete Rule"
                aria-label="Delete Rule"
                onClick={() => handleRemove(rule.id)}
              >
                <RiDeleteBin6Line className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RulesEditor;
