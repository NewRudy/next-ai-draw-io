# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server with Turbopack (port 6002)
npm run dev

# Build for production
npm run build

# Start production server (port 6001)
npm run start

# Run linting
npm run lint
```

## Architecture Overview

This is a Next.js 15 application with App Router that integrates AI capabilities with draw.io diagrams. The core architecture consists of:

### Key Components

1. **AI Integration Layer** (`lib/ai-providers.ts`):
   - Multi-provider support: AWS Bedrock, OpenAI, Anthropic, Google, Azure, Ollama, OpenRouter
   - Environment-based configuration with credential validation
   - Provider-specific optimizations (e.g., Anthropic beta headers for streaming)
   - ModelScope/ZhipuAI integration via OpenAI-compatible API
   - Enhanced logging for provider initialization debugging

2. **Diagram State Management** (`contexts/diagram-context.tsx`):
   - React Context API for diagram state
   - LocalStorage persistence for diagram history (20 item limit)
   - Export functionality (XML, PNG, SVG)
   - Base64 data URL validation and correction

3. **AI Chat Interface** (`app/api/chat/route.ts`):
   - Two-tool system: `display_diagram` (create new) and `edit_diagram` (modify existing)
   - XML-based diagram representation with draw.io compatibility
   - Multi-modal support with image upload and processing
   - ModelScope compatibility layer for Chinese AI providers
   - Retry mechanism for diagram editing (up to 3 attempts)
   - 60-second timeout for generation

4. **XML Processing** (`lib/utils.ts`):
   - Diagram XML extraction and validation with multi-stage decompression
   - Three-tier search/replace system (exact, trimmed, substring matching)
   - Node replacement and XML DOM manipulation
   - Automatic base cell creation and XML formatting
   - SVG export handling with proper MIME type support

### Technology Stack

- **Frontend**: Next.js 15.2.3, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **AI SDK**: Vercel AI SDK with streaming support
- **Diagram Engine**: react-drawio for draw.io integration
- **Key Dependencies**: @ai-sdk/* packages, zod for validation, @xmldom/xmldom for XML processing

### Environment Configuration

Required environment variables (see `env.example`):
- `AI_PROVIDER`: Provider selection (bedrock, openai, anthropic, google, azure, ollama, openrouter)
- `AI_MODEL`: Model ID for the selected provider
- Provider-specific API keys and configuration

**Current Environment Setup**:
- Using OpenAI provider with ModelScope API (ZhipuAI/GLM-4.6)
- Custom base URL: `https://api-inference.modelscope.cn/v1`
- ModelScope compatibility mode enabled

**Default Recommendation**: AWS Bedrock with Claude Sonnet 4.5 for optimal AWS architecture diagram generation.

### Provider-Specific Configurations

- **Anthropic**: Beta headers for fine-grained tool streaming (2025-05-14 feature)
- **ModelScope**: Image filtering, content cleaning, reduced temperature (0.1), special character handling
- **AWS Bedrock**: Automatic beta header application for Claude models
- **OpenAI**: Custom baseURL support for compatible APIs (ModelScope, ZhipuAI)
- **Ollama**: Local deployment support with configurable base URL

### Development Patterns

1. **AI Provider Selection**: Always validate credentials before initializing providers
2. **Diagram Modifications**: Use `edit_diagram` for targeted changes, `display_diagram` for complete regeneration
3. **XML Handling**: All diagram operations work with draw.io-compatible XML format
4. **Error Handling**: Comprehensive error handling in API routes with detailed messages
5. **Responsive Design**: Mobile-first approach with dedicated mobile UI components
6. **Multi-Modal Processing**: Handle image uploads with provider-specific compatibility checks
7. **Message Format Conversion**: Automatic conversion between different AI SDK message formats

### Error Handling Patterns

1. **Provider Validation**: Pre-flight credential checking with detailed error messages
2. **XML Processing**: Multi-stage validation with fallback mechanisms (exact → trimmed → substring matching)
3. **Message Compatibility**: Automatic format conversion for different AI providers
4. **Retry Logic**: Up to 3 attempts for diagram editing operations with exponential backoff
5. **Comprehensive Logging**: Debug information for troubleshooting provider issues
6. **ModelScope Compatibility**: Special handling for Chinese AI providers with content filtering

### Advanced Features

1. **Multi-Modal AI Support**: Image upload and processing with provider-specific compatibility handling
2. **ModelScope Integration**: Special compatibility layer for Chinese AI providers (ZhipuAI/GLM)
3. **Sophisticated XML Processing**: Multi-stage extraction with compression handling
4. **Retry Mechanisms**: Built-in retry logic for diagram editing operations (up to 3 attempts)
5. **Enhanced Error Handling**: Comprehensive error reporting with detailed logging

### Technical Constraints

- **ModelScope Limitations**: Cannot process image content, requires special character cleaning, reduced temperature (0.1)
- **XML Processing**: Requires well-formed draw.io compatible XML with proper decompression (Pako with windowBits: -15)
- **Search/Replace**: Three-tier matching system (exact, trimmed, substring) with fallback mechanisms
- **History Management**: 20-item FIFO limit for localStorage efficiency
- **Message Formatting**: Automatic conversion between different AI SDK message formats
- **Viewport Constraints**: Diagram elements must fit within 800x600 viewport
- **Generation Timeout**: 60-second timeout for AI generation requests
- **XML Compatibility**: Must be well-formed and draw.io compatible