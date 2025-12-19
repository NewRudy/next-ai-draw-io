import { bedrock } from '@ai-sdk/amazon-bedrock';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { azure } from '@ai-sdk/azure';
import { ollama } from 'ollama-ai-provider-v2';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export type ProviderName =
  | 'bedrock'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'ollama'
  | 'openrouter';

interface ModelConfig {
  model: any;
  providerOptions?: any;
}

// Anthropic beta headers for fine-grained tool streaming
const ANTHROPIC_BETA_OPTIONS = {
  anthropic: {
    additionalModelRequestFields: {
      anthropic_beta: ['fine-grained-tool-streaming-2025-05-14']
    }
  }
};

/**
 * Validate that required API keys are present for the selected provider
 */
function validateProviderCredentials(provider: ProviderName): void {
  const requiredEnvVars: Record<ProviderName, string | null> = {
    bedrock: 'AWS_ACCESS_KEY_ID',
    openai: null, // OPENAI_API_KEY or MODELSCOPE_TOKEN (checked separately for custom baseURL)
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_GENERATIVE_AI_API_KEY',
    azure: 'AZURE_API_KEY',
    ollama: null, // No credentials needed for local Ollama
    openrouter: 'OPENROUTER_API_KEY',
  };

  const requiredVar = requiredEnvVars[provider];
  if (requiredVar && !process.env[requiredVar]) {
    throw new Error(
      `${requiredVar} environment variable is required for ${provider} provider. ` +
      `Please set it in your .env.local file.`
    );
  }
}

/**
 * Get the AI model based on environment variables
 *
 * Environment variables:
 * - AI_PROVIDER: The provider to use (bedrock, openai, anthropic, google, azure, ollama, openrouter)
 * - AI_MODEL: The model ID/name for the selected provider
 *
 * Provider-specific env vars:
 * - OPENAI_API_KEY: OpenAI API key (or use MODELSCOPE_TOKEN for ModelScope)
 * - MODELSCOPE_TOKEN: ModelScope Token (ms-*) for ModelScope API (optional, takes precedence over OPENAI_API_KEY)
 * - OPENAI_BASE_URL: Custom base URL for OpenAI-compatible APIs (optional, e.g., ModelScope)
 * - ANTHROPIC_API_KEY: Anthropic API key
 * - GOOGLE_GENERATIVE_AI_API_KEY: Google API key
 * - AZURE_RESOURCE_NAME, AZURE_API_KEY: Azure OpenAI credentials
 * - AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY: AWS Bedrock credentials
 * - OLLAMA_BASE_URL: Ollama server URL (optional, defaults to http://localhost:11434)
 * - OPENROUTER_API_KEY: OpenRouter API key
 */
export function getAIModel(): ModelConfig {
  const provider = (process.env.AI_PROVIDER || 'bedrock') as ProviderName;
  const modelId = process.env.AI_MODEL;

  if (!modelId) {
    throw new Error(
      `AI_MODEL environment variable is required. Example: AI_MODEL=claude-sonnet-4-5`
    );
  }

  // Validate provider credentials
  validateProviderCredentials(provider);

  // Log initialization for debugging
  console.log(`[AI Provider] Initializing ${provider} with model: ${modelId}`);

  let model: any;
  let providerOptions: any = undefined;

  switch (provider) {
    case 'bedrock':
      model = bedrock(modelId);
      // Add Anthropic beta headers if using Claude models via Bedrock
      if (modelId.includes('anthropic.claude')) {
        providerOptions = ANTHROPIC_BETA_OPTIONS;
      }
      break;

    case 'openai':
      // Support custom baseURL for OpenAI-compatible APIs (e.g., ModelScope)
      if (process.env.OPENAI_BASE_URL) {
        // For ModelScope, use ModelScope Token (ms-*) if provided, otherwise fall back to OPENAI_API_KEY
        let apiKey = process.env.MODELSCOPE_TOKEN || process.env.OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error(
            'Either MODELSCOPE_TOKEN or OPENAI_API_KEY is required when using OPENAI_BASE_URL. ' +
            'For ModelScope, use MODELSCOPE_TOKEN with format: ms-xxxxx'
          );
        }

        // Check if using ModelScope API
        const isModelScope = process.env.OPENAI_BASE_URL.includes('modelscope');

        if (isModelScope) {
          // Validate ModelScope Token format
          if (!apiKey.startsWith('ms-')) {
            console.warn(
              '[ModelScope] Warning: API key does not start with "ms-". ' +
              'ModelScope requires a ModelScope Token (format: ms-xxxxx). ' +
              'Please set MODELSCOPE_TOKEN environment variable.'
            );
          }

          // Log ModelScope-specific information
          console.log(`[ModelScope] Base URL: ${process.env.OPENAI_BASE_URL}`);
          console.log(`[ModelScope] Model ID: ${modelId}`);
          console.log(`[ModelScope] Token format: ${apiKey.startsWith('ms-') ? 'Valid ModelScope Token' : 'Non-standard format'}`);

          // Common ModelScope model alternatives if the requested model fails
          if (modelId.includes('GLM-4.6')) {
            console.warn(
              '[ModelScope] Note: If GLM-4.6 is not supported, try alternative models: ' +
              'ZhipuAI/GLM-4.5, Qwen/Qwen2.5-72B-Instruct, or check ModelScope website for available models.'
            );
          }
        }

        // ModelScope API expects the token as-is (with ms- prefix)
        const customOpenAI = createOpenAI({
          baseURL: process.env.OPENAI_BASE_URL,
          apiKey: apiKey,
        });
        console.log(`[AI Provider] Using custom OpenAI baseURL: ${process.env.OPENAI_BASE_URL}`);
        console.log(`[AI Provider] Using API key format: ${apiKey.startsWith('ms-') ? 'ModelScope Token' : 'OpenAI Key'}`);
        console.log(`[AI Provider] Model ID: ${modelId}`);
        model = customOpenAI.chat(modelId);
      } else {
        model = openai(modelId);
      }
      break;

    case 'anthropic':
      model = anthropic(modelId);
      // Add beta headers for fine-grained tool streaming
      providerOptions = ANTHROPIC_BETA_OPTIONS;
      break;

    case 'google':
      model = google(modelId);
      break;

    case 'azure':
      model = azure(modelId);
      break;

    case 'ollama':
      model = ollama(modelId);
      break;

    case 'openrouter':
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      model = openrouter(modelId);
      break;

    default:
      throw new Error(
        `Unknown AI provider: ${provider}. Supported providers: bedrock, openai, anthropic, google, azure, ollama, openrouter`
      );
  }

  // Log if provider options are being applied
  if (providerOptions) {
    console.log('[AI Provider] Applying provider-specific options');
  }

  return { model, providerOptions };
}
