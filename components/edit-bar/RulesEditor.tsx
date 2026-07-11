"use client";

import * as React from "react";
import { RiAddLine, RiDeleteBin6Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConditionalRule } from "@/lib/mock-engine";

interface RulesEditorProps {
  rules: ConditionalRule[];
  onRulesChange: (rules: ConditionalRule[]) => void;
}

export function RulesEditor({
  rules,
  onRulesChange,
}: RulesEditorProps): React.JSX.Element {
  const handleAdd = () => {
    const newRule: ConditionalRule = {
      id: crypto.randomUUID(),
      type: "query",
      key: "",
      operator: "equals",
      value: "",
      responseStatus: 400,
      responseBody: '{\n  "error": "Bad Request"\n}',
    };
    onRulesChange([...rules, newRule]);
  };

  const handleRemove = (id: string) => {
    onRulesChange(rules.filter((r) => r.id !== id));
  };

  const handleChange = (id: string, field: keyof ConditionalRule, val: string | number) => {
    const updated = rules.map((rule) => {
      if (rule.id === id) {
        return { ...rule, [field]: val } as ConditionalRule;
      }
      return rule;
    });
    onRulesChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-semibold">Conditional Response Rules</h3>
          <span className="text-muted-foreground text-[10px] leading-normal">
            Short-circuit matching requests with custom status codes and payloads.
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          className="h-7 gap-1 text-xs shrink-0"
        >
          <RiAddLine className="h-3 w-3" />
          <span>Add Rule</span>
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-5 text-center text-xs italic">
          No conditional rules configured. Default payload schema will always be returned.
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="border-border bg-muted/10 relative space-y-2.5 rounded-lg border p-3"
            >
              {/* Header: Rule Selection Parameters */}
              <div className="flex flex-wrap items-center gap-1.5 pr-8">
                <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                  IF Request
                </span>
                
                <Select
                  value={rule.type}
                  onValueChange={(val) => handleChange(rule.id, "type", val ?? "query")}
                >
                  <SelectTrigger className="h-7 text-xs w-[85px] bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="query">Query</SelectItem>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="param">Param</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  value={rule.key}
                  onChange={(e) => handleChange(rule.id, "key", e.target.value)}
                  placeholder="key (e.g. status)"
                  className="h-7 text-xs flex-1 min-w-[70px] bg-card"
                />

                <Select
                  value={rule.operator}
                  onValueChange={(val) => handleChange(rule.id, "operator", val ?? "equals")}
                >
                  <SelectTrigger className="h-7 text-xs w-[90px] bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="exists">Exists</SelectItem>
                  </SelectContent>
                </Select>

                {rule.operator !== "exists" && (
                  <Input
                    value={rule.value}
                    onChange={(e) => handleChange(rule.id, "value", e.target.value)}
                    placeholder="value (e.g. error)"
                    className="h-7 text-xs flex-1 min-w-[70px] bg-card"
                  />
                )}
              </div>

              {/* Action triggers: Status and Response Body */}
              <div className="grid grid-cols-5 gap-2 items-start">
                <div className="col-span-1 space-y-1">
                  <label className="text-muted-foreground text-[8px] font-bold uppercase tracking-wider block">
                    Status
                  </label>
                  <Input
                    type="number"
                    value={rule.responseStatus}
                    onChange={(e) =>
                      handleChange(
                        rule.id,
                        "responseStatus",
                        parseInt(e.target.value, 10) || 200
                      )
                    }
                    placeholder="200"
                    className="h-7 text-xs bg-card"
                  />
                </div>
                <div className="col-span-4 space-y-1">
                  <label className="text-muted-foreground text-[8px] font-bold uppercase tracking-wider block">
                    Custom Response Body (JSON)
                  </label>
                  <Textarea
                    value={rule.responseBody}
                    onChange={(e) => handleChange(rule.id, "responseBody", e.target.value)}
                    placeholder='{"error": "Custom Error"}'
                    className="h-14 font-mono text-[10px] leading-tight resize-none bg-card p-1.5"
                  />
                </div>
              </div>

              {/* Remove button */}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 absolute right-1.5 top-1.5 h-6 w-6 shrink-0"
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
}

export default RulesEditor;
