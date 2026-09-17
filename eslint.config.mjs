import { plugin as shadcn } from "@shadcn/lint";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        plugins: {
            shadcn,
        },
        rules: {
            "shadcn/no-restyle": ["error", { allow: ["layout"] }],
        },
    },
    {
        files: ["components/ui/**"],
        rules: {
            "shadcn/no-restyle": "off",
        },
    },
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
        "coverage/**",
    ]),
]);

export default eslintConfig;
