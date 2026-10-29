# Prompt Testing & Versioning

Read this when building a test suite, scoring prompt quality, or managing prompt versions — the testing framework, evaluation rubric, regression protocol, version-control strategy, changelog format, and diff analysis.

## Prompt Testing Framework

### Test Case Design

Every production prompt needs a test suite.

#### Test Case Structure

```json
{
  "test_id": "classify-urgent-001",
  "input": "Server is down, customers can't access the product",
  "expected": {
    "contains": ["critical", "immediate"],
    "not_contains": ["low priority", "can wait"],
    "format_regex": "^\\{.*\\}$",
    "max_tokens": 500,
    "required_fields": ["severity", "category"]
  },
  "tags": ["classification", "urgency", "happy-path"]
}
```

#### Test Suite Composition

| Category | % of Suite | Purpose |
|----------|-----------|---------|
| Happy path | 40% | Confirm basic functionality works |
| Edge cases | 30% | Boundary conditions, unusual inputs |
| Adversarial | 15% | Inputs designed to break the prompt |
| Regression | 15% | Cases that previously failed |

### Evaluation Rubric

#### Automated Scoring

| Dimension | Measurement | Weight |
|-----------|-------------|--------|
| Adherence | Contains required elements, matches schema | 30% |
| Accuracy | Correct classification/analysis/answer | 30% |
| Safety | No forbidden content, no hallucinations | 20% |
| Format | Matches expected structure, length bounds | 10% |
| Relevance | Response addresses the actual input | 10% |

#### Scoring Formula

```
score = (adherence * 0.30) + (accuracy * 0.30) + (safety * 0.20) + (format * 0.10) + (relevance * 0.10)

Pass threshold: 0.80
Warning threshold: 0.70
Fail threshold: < 0.70
```

### Regression Testing Protocol

```
1. Before any prompt change:
   - Run full test suite against current prompt (baseline)
   - Record scores per test case

2. After prompt change:
   - Run same test suite against new prompt (candidate)
   - Compare scores per test case

3. Acceptance criteria:
   - Average score: candidate >= baseline
   - No individual test case drops by more than 10%
   - Zero safety violations (any safety failure = reject)
   - If criteria met: promote candidate
   - If criteria not met: iterate on prompt or reject
```

## Prompt Versioning

### Version Control Strategy

```
prompts/
├── support-classifier/
│   ├── v1.txt                 # Original version
│   ├── v2.txt                 # Added edge case handling
│   ├── v3.txt                 # Current production
│   ├── changelog.md           # Change log with rationale
│   └── tests/
│       ├── suite.json         # Test cases
│       └── baselines/
│           ├── v1-results.json
│           ├── v2-results.json
│           └── v3-results.json
├── code-reviewer/
│   ├── v1.txt
│   └── ...
```

### Changelog Format

```markdown
## v3 (2026-03-09)
**Author:** borghei
**Change:** Added explicit handling for multi-language inputs
**Reason:** v2 defaulted to English analysis for non-English code comments
**Test results:** Average score 0.87 (v2 was 0.82). No regressions.
**Rollback plan:** Revert to v2.txt

## v2 (2026-02-15)
**Author:** borghei
**Change:** Added structured output format with JSON schema
**Reason:** Downstream parser needed consistent format
**Test results:** Average score 0.82 (v1 was 0.79). Format compliance 100% (v1 was 73%).
```

### Prompt Diff Analysis

Before deploying a new version, always diff:

```
Key questions for prompt diffs:
1. Were any constraints removed? (Risk: safety regression)
2. Were any examples changed? (Risk: calibration shift)
3. Was the output format changed? (Risk: downstream parser breaks)
4. Were any anti-patterns removed? (Risk: known failure modes return)
5. Is the new prompt longer? (Risk: context budget impact)
```
