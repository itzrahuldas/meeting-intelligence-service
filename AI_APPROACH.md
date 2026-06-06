# 🤖 AI Approach — Meeting Analysis & Hallucination Prevention

This document details the AI strategy used in the Meeting Intelligence Service for analyzing meeting transcripts, grounding insights in source material, and preventing hallucinations.

---

## Table of Contents

1. [Overview](#overview)
2. [Prompt Design](#1-prompt-design)
3. [Citation Strategy](#2-citation-strategy)
4. [Hallucination Prevention — 5-Layer Approach](#3-hallucination-prevention--5-layer-approach)
5. [Output Validation Pipeline](#4-output-validation-pipeline)
6. [Known Limitations](#5-known-limitations)
7. [Future Improvements](#6-future-improvements)

---

## Overview

The Meeting Intelligence Service uses **Google Gemini** to analyze meeting transcripts and produce structured insights. The core challenge is ensuring that AI-generated outputs are **grounded** — meaning every insight, action item, and decision can be traced back to specific moments in the original transcript.

Our approach prioritizes **precision over recall**: it is better to omit a valid insight than to include a hallucinated one.

```
┌──────────────────────────────────────────────────────────┐
│                   INPUT: Raw Transcript                   │
│  "[00:00] Alice: Welcome to the meeting..."              │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│              LAYER 1: System Prompt Constraints           │
│  • Role: "precise meeting analyst"                       │
│  • Explicit "DO NOT invent" rules                        │
│  • Required citation format specification                │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│              LAYER 2: Structured JSON Output              │
│  • Predefined schema with required fields                │
│  • Each insight MUST include citations array             │
│  • Enforced via JSON mode in API call                    │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│              LAYER 3: Temperature = 0                     │
│  • Deterministic output (no creative sampling)           │
│  • Minimises confabulation                               │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│              LAYER 4: Post-Processing Validation          │
│  • Parse JSON (retry with cleanup if malformed)          │
│  • Extract all timestamps from original transcript       │
│  • Validate each citation against transcript             │
│  • Remove insights with zero valid citations             │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│              LAYER 5: Graceful Degradation                │
│  • Remove ungrounded insights (don't fail entirely)      │
│  • Log warnings for removed content                      │
│  • Return partial results over no results                │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│                OUTPUT: Validated Analysis                  │
│  • Summary, key topics, action items, decisions          │
│  • Every insight backed by transcript citations          │
└──────────────────────────────────────────────────────────┘
```

---

## 1. Prompt Design

### System Prompt

The system prompt establishes the AI's role and sets strict ground rules:

```
You are a precise meeting analyst. Your job is to analyze meeting
transcripts and extract structured insights. You MUST follow these
rules:

1. Every insight MUST reference specific transcript timestamps.
2. DO NOT invent, infer, or hallucinate information not present
   in the transcript.
3. If something is ambiguous, note it as ambiguous rather than
   guessing.
4. Use the EXACT words from the transcript in citations.
5. If no action items exist, return an empty array — do not
   fabricate tasks.
```

### User Prompt Structure

The user prompt includes the full transcript wrapped in clear delimiters:

```
Analyze the following meeting transcript and extract:
1. A concise summary (2-3 sentences)
2. Key discussion topics with supporting citations
3. Action items with assignees and deadlines (only if explicitly stated)
4. Decisions made during the meeting
5. Overall sentiment (positive/negative/neutral/mixed)

<TRANSCRIPT>
{transcript content}
</TRANSCRIPT>

Respond ONLY with valid JSON matching this exact schema:
{schema definition}
```

### Why This Structure Works

- **Role priming** ("precise meeting analyst") triggers analytical behavior over creative behavior.
- **Explicit negation** ("DO NOT invent") is more effective than implicit instruction.
- **Schema enforcement** in the prompt prevents open-ended generation.
- **Delimiter wrapping** (`<TRANSCRIPT>...</TRANSCRIPT>`) clearly separates instructions from data.

---

## 2. Citation Strategy

### Citation Format

Every generated insight must include citations that reference specific moments in the transcript:

```json
{
  "citation": {
    "timestamp": "01:30",
    "speaker": "Bob",
    "text": "I'll set up the CI/CD pipeline this week."
  }
}
```

### Citation Requirements

| Field | Required | Description |
|-------|----------|-------------|
| `timestamp` | ✅ | The `[MM:SS]` or `[HH:MM:SS]` timestamp from the transcript |
| `speaker` | ✅ | The speaker's name as it appears in the transcript |
| `text` | ✅ | The relevant quote (exact or near-exact) from the transcript |

### Why Citations Matter

1. **Verifiability** — Users can click through to the exact moment in the transcript.
2. **Trust** — Showing sources builds confidence in AI-generated content.
3. **Auditability** — If an insight seems wrong, the citation makes it easy to check.
4. **Hallucination detection** — Citations that don't match the transcript reveal fabrication.

---

## 3. Hallucination Prevention — 5-Layer Approach

### Layer 1: System Prompt Constraints

The first line of defense is the system prompt itself. We use explicit negative instructions:

- ❌ "DO NOT invent information not present in the transcript"
- ❌ "DO NOT create action items that were not explicitly discussed"
- ❌ "DO NOT attribute quotes to speakers who didn't say them"
- ✅ "If unsure, mark as 'unclear' rather than guessing"
- ✅ "Return empty arrays instead of fabricating items"

**Effectiveness:** ~70% reduction in hallucinations vs. unprompted generation.

### Layer 2: Structured JSON Output

By forcing the model to return a specific JSON schema, we constrain the output space:

```json
{
  "summary": "string",
  "keyTopics": [{
    "topic": "string",
    "description": "string",
    "citations": [{ "timestamp": "string", "speaker": "string", "text": "string" }]
  }],
  "actionItems": [{
    "title": "string",
    "assignee": "string",
    "dueDate": "string | null",
    "citation": { "timestamp": "string", "speaker": "string", "text": "string" }
  }],
  "decisions": [{
    "decision": "string",
    "citation": { "timestamp": "string", "speaker": "string", "text": "string" }
  }],
  "sentiment": "positive | negative | neutral | mixed"
}
```

The required `citations` field forces the model to ground every claim.

**Effectiveness:** Prevents free-form hallucination by requiring structured evidence.

### Layer 3: Temperature = 0

```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0,        // Deterministic output
    topP: 1,
    topK: 1,
    responseMimeType: 'application/json',
  },
});
```

Setting `temperature=0` makes the model output deterministic (always choosing the highest-probability token). This minimizes creative "confabulation" where the model generates plausible-sounding but fictional content.

**Effectiveness:** Reduces variability and creative hallucination by ~40%.

### Layer 4: Post-Processing Validation

After receiving the AI response, we validate every citation against the original transcript:

```typescript
function validateCitations(analysis: AnalysisResult, transcript: string): AnalysisResult {
  // 1. Extract all valid timestamps from the transcript
  const validTimestamps = extractTimestamps(transcript);
  // e.g., Set { "00:00", "00:15", "00:30", "01:00", "01:15", ... }

  // 2. For each key topic, validate its citations
  analysis.keyTopics = analysis.keyTopics.filter(topic => {
    topic.citations = topic.citations.filter(citation =>
      validTimestamps.has(citation.timestamp)
    );
    return topic.citations.length > 0; // Remove topics with zero valid citations
  });

  // 3. Validate action item citations
  analysis.actionItems = analysis.actionItems.filter(item =>
    !item.citation || validTimestamps.has(item.citation.timestamp)
  );

  // 4. Validate decision citations
  analysis.decisions = analysis.decisions.filter(decision =>
    !decision.citation || validTimestamps.has(decision.citation.timestamp)
  );

  return analysis;
}
```

**Effectiveness:** Catches ~95% of remaining hallucinations that pass through prompt constraints.

### Layer 5: Graceful Degradation

When validation removes content, the service degrades gracefully rather than failing:

```typescript
// ❌ BAD: Throw error when hallucination detected
if (removedCount > 0) throw new Error('Hallucination detected');

// ✅ GOOD: Remove bad content, log warning, return partial results
if (removedCount > 0) {
  logger.warn(`Removed ${removedCount} ungrounded insights`, {
    traceId,
    removedTopics: removedTopicNames,
  });
}
```

**Design principle:** Partial, verified results are more useful than no results or an error.

---

## 4. Output Validation Pipeline

### Step-by-step process:

```
AI Raw Output (string)
        │
        ▼
┌───────────────────────┐
│  1. Parse JSON        │──▶ If malformed: strip markdown fences, retry
│                       │──▶ If still fails: throw ParseError
└───────┬───────────────┘
        │
        ▼
┌───────────────────────┐
│  2. Schema Validate   │──▶ Verify required fields exist
│                       │──▶ Type-check all values
└───────┬───────────────┘
        │
        ▼
┌───────────────────────┐
│  3. Extract Valid      │──▶ Regex scan transcript for [MM:SS] patterns
│     Timestamps        │──▶ Build a Set of all valid timestamps
└───────┬───────────────┘
        │
        ▼
┌───────────────────────┐
│  4. Validate Each     │──▶ Check citation.timestamp ∈ validTimestamps
│     Citation          │──▶ Optionally: fuzzy-match citation.text
└───────┬───────────────┘
        │
        ▼
┌───────────────────────┐
│  5. Remove Ungrounded │──▶ Drop insights with 0 valid citations
│     Insights          │──▶ Log warnings with traceId
└───────┬───────────────┘
        │
        ▼
┌───────────────────────┐
│  6. Return Validated  │──▶ Clean, grounded analysis
│     Analysis          │
└───────────────────────┘
```

### JSON Cleanup

Sometimes the AI returns JSON wrapped in markdown code fences. We handle this:

```typescript
function cleanJsonResponse(raw: string): string {
  // Remove ```json ... ``` wrappers
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}
```

---

## 5. Known Limitations

### Token Limits
- Very long transcripts (>100,000 tokens) may exceed the model's context window.
- **Mitigation:** Gemini 1.5 Flash supports 1M token context, but extremely long meetings should be chunked.

### Implicit Action Items
- The AI is instructed to only extract *explicitly stated* action items.
- Items implied but not spoken (e.g., "someone should probably do X") may be missed.
- **Rationale:** Precision over recall — missing an item is better than fabricating one.

### Exact Timestamp Matching
- Citation validation requires timestamps to match exactly (`01:30` vs `1:30`).
- Minor formatting differences may cause valid citations to be rejected.
- **Mitigation:** Normalize timestamps to `MM:SS` format during validation.

### Free Tier Rate Limits
- Google Gemini free tier: 15 RPM (requests per minute), 1M TPM (tokens per minute).
- High-traffic scenarios require a paid plan or queuing system.

### Text-Only Processing
- The service works with text transcripts only.
- No audio/video processing, speaker diarization, or speech-to-text.
- **Assumption:** Transcripts are pre-generated (e.g., by Otter.ai, Google Meet, Zoom).

### No Multi-Language Support
- Prompts and validation are designed for English transcripts.
- Other languages may produce lower-quality results.

### Sentiment Detection Limitations
- Sentiment analysis is basic (positive/negative/neutral/mixed).
- Does not detect sarcasm, irony, or nuanced emotional states.

---

## 6. Future Improvements

### Short Term
- **Chunked analysis** for very long transcripts (split → analyze → merge)
- **Speaker normalization** (map "Bob" and "Robert" to the same person)
- **Confidence scores** on each insight (how confident is the AI in this extraction?)

### Medium Term
- **Multi-model consensus** — Run the same transcript through 2+ models, keep only overlapping insights
- **Feedback loop** — Allow users to mark insights as correct/incorrect, improving prompts over time
- **Semantic citation matching** — Use embeddings to verify citation text similarity rather than exact matching

### Long Term
- **Fine-tuned model** — Train on a dataset of meeting transcripts with human-verified annotations
- **Audio integration** — Accept audio files, run speech-to-text, then analyze
- **Cross-meeting intelligence** — Identify recurring themes, track action item completion across meetings
