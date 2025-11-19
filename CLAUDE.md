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

2. **Diagram State Management** (`contexts/diagram-context.tsx`):
   - React Context API for diagram state
   - LocalStorage persistence for diagram history (20 item limit)
   - Export functionality (XML, PNG, SVG)

3. **AI Chat Interface** (`app/api/chat/route.ts`):
   - Two-tool system: `display_diagram` (create new) and `edit_diagram` (modify existing)
   - XML-based diagram representation with draw.io compatibility
   - Layout constraints: 800x600 viewport, AWS 2025 icons support
   - 60-second timeout for generation

4. **XML Processing** (`lib/utils.ts`):
   - Diagram XML extraction and validation
   - Node replacement and search/replace operations
   - SVG export handling

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

Default configuration uses AWS Bedrock with Claude Sonnet 4.5 for optimal AWS architecture diagram generation.

### Development Patterns

1. **AI Provider Selection**: Always validate credentials before initializing providers
2. **Diagram Modifications**: Use `edit_diagram` for targeted changes, `display_diagram` for complete regeneration
3. **XML Handling**: All diagram operations work with draw.io-compatible XML format
4. **Error Handling**: Comprehensive error handling in API routes with detailed messages
5. **Responsive Design**: Mobile-first approach with dedicated mobile UI components

### Important Constraints

- Diagram elements must fit within 800x600 viewport
- Maximum 20 items in diagram history for localStorage efficiency
- 60-second timeout for AI generation requests
- XML must be well-formed and draw.io compatible