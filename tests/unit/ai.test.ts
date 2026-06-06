// ---------------------------------------------------------------------------
// tests/unit/ai.test.ts — AI service unit tests
// ---------------------------------------------------------------------------

// Mock the Google Generative AI module BEFORE importing the service
const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_NONE: 'BLOCK_NONE',
  },
}));

import { analyzeTranscript, TranscriptEntry } from '../../src/services/ai.service';

// ── Test Data ───────────────────────────────────────────────────────────────

const validTranscript: TranscriptEntry[] = [
  { timestamp: '00:00', speaker: 'Alice', text: 'Welcome to the sprint planning meeting.' },
  { timestamp: '00:15', speaker: 'Bob', text: "I've completed the authentication module." },
  { timestamp: '00:30', speaker: 'Charlie', text: "I'm still working on the dashboard." },
  { timestamp: '01:00', speaker: 'Alice', text: 'Charlie, can you finish the dashboard by Friday?' },
  { timestamp: '01:15', speaker: 'Charlie', text: "Yes, I'll have it done by end of day Friday." },
  { timestamp: '02:00', speaker: 'Alice', text: "Let's plan the deployment for next Monday." },
  { timestamp: '02:15', speaker: 'Bob', text: "I'll set up the CI/CD pipeline this week." },
  { timestamp: '02:30', speaker: 'Alice', text: 'Great. Meeting adjourned.' },
];

const validAIResponse = {
  summary: [
    {
      text: 'Sprint planning meeting covering progress updates and upcoming tasks.',
      citations: [
        { timestamp: '00:00', speaker: 'Alice', text: 'Welcome to the sprint planning meeting.' },
      ],
    },
  ],
  actionItems: [
    {
      task: 'Finish dashboard by Friday',
      assignee: 'Charlie',
      dueDate: null,
      citations: [
        { timestamp: '01:00', speaker: 'Alice', text: 'Can you finish the dashboard by Friday?' },
      ],
    },
    {
      task: 'Set up CI/CD pipeline',
      assignee: 'Bob',
      dueDate: null,
      citations: [
        { timestamp: '02:15', speaker: 'Bob', text: "I'll set up the CI/CD pipeline this week." },
      ],
    },
  ],
  decisions: [
    {
      text: 'Deployment planned for next Monday',
      citations: [
        { timestamp: '02:00', speaker: 'Alice', text: "Let's plan the deployment for next Monday." },
      ],
    },
  ],
  followUps: [
    {
      text: 'Check dashboard progress with Charlie before Friday',
      citations: [
        { timestamp: '01:15', speaker: 'Charlie', text: "I'll have it done by end of day Friday." },
      ],
    },
  ],
};

// Helper to build the mock Gemini response object
function buildGeminiResponse(data: object) {
  return {
    response: {
      text: () => JSON.stringify(data),
    },
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeTranscript', () => {
    it('should return a structured analysis for a valid transcript', async () => {
      mockGenerateContent.mockResolvedValue(buildGeminiResponse(validAIResponse));

      const result = await analyzeTranscript(validTranscript);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('actionItems');
      expect(result).toHaveProperty('decisions');
      expect(result).toHaveProperty('followUps');
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should include citation references for summary items', async () => {
      mockGenerateContent.mockResolvedValue(buildGeminiResponse(validAIResponse));

      const result = await analyzeTranscript(validTranscript);

      result.summary.forEach((item: any) => {
        expect(item.citations).toBeDefined();
        expect(Array.isArray(item.citations)).toBe(true);
        item.citations.forEach((citation: any) => {
          expect(citation).toHaveProperty('timestamp');
          expect(citation).toHaveProperty('speaker');
        });
      });
    });

    it('should remove insights with citations referencing non-existent timestamps', async () => {
      const responseWithBadCitation = {
        ...validAIResponse,
        decisions: [
          ...validAIResponse.decisions,
          {
            text: 'Hallucinated decision',
            citations: [
              {
                timestamp: '99:99', // does not exist in transcript
                speaker: 'Unknown',
                text: 'Something that was never said.',
              },
            ],
          },
        ],
      };

      mockGenerateContent.mockResolvedValue(buildGeminiResponse(responseWithBadCitation));

      const result = await analyzeTranscript(validTranscript);

      // The hallucinated decision with invalid timestamp should be filtered out
      const hallucinated = result.decisions.find(
        (d: any) => d.text === 'Hallucinated decision'
      );
      expect(hallucinated).toBeUndefined();
    });

    it('should handle AI returning JSON wrapped in markdown code fences', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            '```json\n' + JSON.stringify(validAIResponse) + '\n```',
        },
      });

      const result = await analyzeTranscript(validTranscript);

      expect(result).toHaveProperty('summary');
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should throw an error when the AI service completely fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Gemini API rate limit exceeded'));

      await expect(analyzeTranscript(validTranscript)).rejects.toThrow();
    });

    it('should handle empty action items from AI gracefully', async () => {
      const minimalResponse = {
        summary: [],
        actionItems: [],
        decisions: [],
        followUps: [],
      };

      mockGenerateContent.mockResolvedValue(buildGeminiResponse(minimalResponse));

      const result = await analyzeTranscript(validTranscript);

      expect(result.actionItems).toEqual([]);
      expect(result.decisions).toEqual([]);
    });
  });
});
