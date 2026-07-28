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

interface RulesEditorProps {
  rules: ConditionalRule[];
  onRulesChange: (rules: ConditionalRule[]) => void;
}

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

      {rules.length === 0 ? (
        <div className="bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-5 text-center text-xs italic">
          No conditional rules added.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-muted/20 border-border/60 relative space-y-2.5 rounded-lg border p-3"
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
