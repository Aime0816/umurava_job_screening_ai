import { logger } from '../config/logger';
import { ICandidate } from '../models/candidate.model';
import { IJob } from '../models/job.model';

export interface CandidateEvaluation {
  candidateIndex: number;
  score: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  tier: 'Strong Hire' | 'Hire' | 'Maybe' | 'No Hire';
  reasoning: string;
}

export interface ScreeningResult {
  evaluations: CandidateEvaluation[];
  modelUsed: string;
  promptTokens?: number;
}

export interface CandidateScreeningResult {
  score: number;
  decision: 'Shortlisted' | 'Rejected';
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface CandidateScreeningResponse {
  success: true;
  source: 'groq' | 'openrouter';
  result: CandidateScreeningResult;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

export class CandidateScreeningService {
  private readonly GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly GROQ_MODEL = 'llama-3.1-70b-versatile';
  private readonly OPENROUTER_MODELS = [
    'meta-llama/llama-3.1-70b-instruct',
    'mistralai/mixtral-8x7b-instruct',
    'mistralai/mistral-7b-instruct',
  ] as const;
  private readonly MAX_RETRIES = 5;
  private readonly REQUEST_TIMEOUT_MS = 10_000;

  async evaluateCandidate(profile: Record<string, unknown>): Promise<CandidateScreeningResponse> {
    const prompt = this.buildPrompt(profile);

    try {
      const result = await this.callGroqWithRetry(prompt);
      return {
        success: true,
        source: 'groq',
        result: this.normalizeScreeningResult(result),
      };
    } catch (groqError) {
      logger.error('Groq screening failed, trying OpenRouter fallback', {
        error: this.serializeError(groqError),
      });
    }

    try {
      const result = await this.callOpenRouter(prompt);
      return {
        success: true,
        source: 'openrouter',
        result: this.normalizeScreeningResult(result),
      };
    } catch (openRouterError) {
      logger.error('OpenRouter screening failed, returning safe fallback result', {
        error: this.serializeError(openRouterError),
      });

      return {
        success: true,
        source: 'openrouter',
        result: this.buildSafeFallbackResult(profile),
      };
    }
  }

  async evaluateCandidates(
    candidates: Partial<ICandidate>[],
    _job: Partial<IJob>
  ): Promise<ScreeningResult> {
    const evaluations: CandidateEvaluation[] = [];
    const sources = new Set<string>();

    for (let index = 0; index < candidates.length; index++) {
      const response = await this.evaluateCandidate(candidates[index] as Record<string, unknown>);
      sources.add(response.source);
      evaluations.push(this.toCandidateEvaluation(response, index));
    }

    return {
      evaluations,
      modelUsed: sources.size === 1 ? [...sources][0] : 'mixed',
    };
  }

  private async callGroqWithRetry(prompt: string): Promise<CandidateScreeningResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.requestGroq(prompt);
      } catch (error) {
        lastError = error;
        const retryable = this.isRetryableError(error);

        logger.warn('Groq screening request failed', {
          attempt: attempt + 1,
          maxAttempts: this.MAX_RETRIES + 1,
          retryable,
          error: this.serializeError(error),
        });

        if (!retryable || attempt === this.MAX_RETRIES) {
          break;
        }

        await this.sleep(2 ** attempt * 1000);
      }
    }

    throw lastError;
  }

  private async requestGroq(prompt: string): Promise<CandidateScreeningResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is required');
    }

    return this.executeChatRequest({
      url: this.GROQ_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: {
        model: this.GROQ_MODEL,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      },
    });
  }

  private async callOpenRouter(prompt: string): Promise<CandidateScreeningResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required');
    }

    let lastError: unknown;

    for (const model of this.OPENROUTER_MODELS) {
      try {
        return await this.executeChatRequest({
          url: this.OPENROUTER_URL,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
            'X-Title': process.env.OPENROUTER_APP_NAME || 'Umurava Talent Screening',
          },
          body: {
            model,
            temperature: 0.1,
            messages: [{ role: 'user', content: prompt }],
          },
        });
      } catch (error) {
        lastError = error;
        logger.warn('OpenRouter model failed', {
          model,
          error: this.serializeError(error),
        });
      }
    }

    throw lastError;
  }

  private async executeChatRequest({
    url,
    headers,
    body,
  }: {
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
  }): Promise<CandidateScreeningResult> {
    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(this.extractApiErrorMessage(payload) || `AI request failed with status ${response.status}`);
      Object.assign(error, { status: response.status, payload });
      throw error;
    }

    const content = this.extractMessageContent(payload as ChatCompletionResponse);
    return this.parseJsonResult(content);
  }

  private buildPrompt(profile: Record<string, unknown>): string {
    return `You are an HR AI system. Evaluate this candidate based on the Talent Profile Schema.

Return ONLY valid JSON:

{
  "score": number,
  "decision": "Shortlisted" | "Rejected",
  "strengths": string[],
  "weaknesses": string[],
  "summary": string
}

CANDIDATE:
${JSON.stringify(profile, null, 2)}
`;
  }

  private parseJsonResult(content: string): CandidateScreeningResult {
    const cleaned = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as Partial<CandidateScreeningResult>;
    return this.normalizeScreeningResult(parsed);
  }

  private normalizeScreeningResult(result: Partial<CandidateScreeningResult>): CandidateScreeningResult {
    const score = this.clamp(result.score ?? 50);
    const decision = result.decision === 'Shortlisted' || score >= 60 ? 'Shortlisted' : 'Rejected';

    return {
      score,
      decision,
      strengths: Array.isArray(result.strengths) ? result.strengths.map(String).filter(Boolean).slice(0, 5) : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses.map(String).filter(Boolean).slice(0, 5) : [],
      summary: String(result.summary || 'Candidate screened successfully.'),
    };
  }

  private toCandidateEvaluation(
    response: CandidateScreeningResponse,
    candidateIndex: number
  ): CandidateEvaluation {
    const { result, source } = response;
    const tier = this.decisionToTier(result.decision, result.score);

    return {
      candidateIndex,
      score: result.score,
      skillsScore: result.score,
      experienceScore: result.score,
      educationScore: result.score,
      strengths: result.strengths,
      gaps: result.weaknesses,
      recommendation: result.summary,
      tier,
      reasoning: `${result.summary} Evaluated via ${source}.`,
    };
  }

  private buildSafeFallbackResult(profile: Record<string, unknown>): CandidateScreeningResult {
    const skillsCount = Array.isArray(profile.skills) ? profile.skills.length : 0;
    const experienceCount = Array.isArray(profile.experience) ? profile.experience.length : 0;
    const score = this.clamp(45 + skillsCount * 5 + experienceCount * 5);
    const decision: CandidateScreeningResult['decision'] = score >= 60 ? 'Shortlisted' : 'Rejected';

    return {
      score,
      decision,
      strengths: skillsCount > 0 ? ['Candidate profile includes documented skills.'] : ['Candidate profile was processed successfully.'],
      weaknesses: experienceCount === 0 ? ['Limited work experience details were available.'] : ['Automated fallback result was used because AI providers were unavailable.'],
      summary: 'AI providers were temporarily unavailable, so a safe fallback evaluation was returned.',
    };
  }

  private decisionToTier(
    decision: CandidateScreeningResult['decision'],
    score: number
  ): CandidateEvaluation['tier'] {
    if (decision === 'Rejected') {
      return score >= 50 ? 'Maybe' : 'No Hire';
    }

    if (score >= 80) return 'Strong Hire';
    if (score >= 65) return 'Hire';
    return 'Maybe';
  }

  private extractMessageContent(payload: ChatCompletionResponse): string {
    const content = payload.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content.map(part => part.text || '').join('').trim();
    }

    throw new Error('AI response content was empty');
  }

  private extractApiErrorMessage(payload: unknown): string {
    if (typeof payload !== 'object' || payload === null) return '';

    const maybePayload = payload as {
      error?: { message?: string } | string;
      message?: string;
    };

    if (typeof maybePayload.error === 'string') return maybePayload.error;
    if (typeof maybePayload.error?.message === 'string') return maybePayload.error.message;
    if (typeof maybePayload.message === 'string') return maybePayload.message;
    return '';
  }

  private isRetryableError(error: unknown): boolean {
    const status = this.extractStatus(error);
    const message = this.extractMessage(error).toLowerCase();

    return status === 429 ||
      status === 503 ||
      status === 408 ||
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('busy') ||
      message.includes('overloaded') ||
      message.includes('429') ||
      message.includes('503');
  }

  private extractStatus(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const candidate = error as { status?: unknown; code?: unknown };
    if (typeof candidate.status === 'number') return candidate.status;
    if (typeof candidate.code === 'number') return candidate.code;
    return undefined;
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error || '');
  }

  private serializeError(error: unknown) {
    if (error instanceof Error) {
      return {
              ...(error as Error & { status?: number; code?: number; payload?: unknown }),
                   name: error.name,
                message: error.message,
          };
    }

    return error;
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.REQUEST_TIMEOUT_MS}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.min(max, Math.max(min, Math.round(Number(value) || 0)));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiScreeningService = new CandidateScreeningService();
