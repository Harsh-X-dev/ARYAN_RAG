# Aryan Mehta RAG Proxy

![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![License: ISC](https://img.shields.io/badge/license-ISC-blue)
![Status](https://img.shields.io/badge/status-active%20development-0a7ea4)

A personal Retrieval-Augmented Generation (RAG) API that answers in a consistent "Aryan" voice using Gemini + Pinecone.

The project includes:
- A data ingestion pipeline that chunks personal text data, generates embeddings, and upserts them to Pinecone.
- An Express API for text chat and speech responses.
- A retrieval test suite and evaluator to measure how well context retrieval matches expected facts.

## Table of Contents

- [What This Project Does](#what-this-project-does)
- [Why This Project Is Useful](#why-this-project-is-useful)
- [Project Structure](#project-structure)
- [How to Get Started](#how-to-get-started)
- [Usage](#usage)
- [Evaluation](#evaluation)
- [Where to Get Help](#where-to-get-help)
- [Maintainers and Contributions](#maintainers-and-contributions)
- [License](#license)

## What This Project Does

This project builds a persona-grounded assistant by combining:
- Semantic retrieval from a Pinecone vector index.
- Prompt orchestration with query classification (`casual`, `work`, `emotional`, `private`) to tune response style and safety behavior.
- Gemini generation for final responses.
- Optional text-to-speech output using ElevenLabs.

Runtime flow:
1. Client sends a message to the API.
2. The server embeds the query with Gemini embeddings.
3. Top matching chunks are fetched from Pinecone.
4. The prompt layer builds an in-character response prompt with retrieved context.
5. Gemini generates a grounded response.
6. Optional `/speak` endpoint returns an MP3 response.

## Why This Project Is Useful

- Fast way to prototype persona-aware RAG behavior.
- Clear separation of ingestion and serving flows.
- Includes retrieval quality checks (`data/rag_test_suite.json`, `data/rag_evaluator.py`) so improvements can be measured, not guessed.
- Practical baseline for:
  - Personal memory assistants
  - Character/role-specific chat systems
  - RAG prompt-style tuning experiments

## Project Structure

```text
.
├─ aryanProxy.js                  # Prompting + query classification + response generation
├─ ingest.js                      # Data ingestion: chunk -> embed -> upsert to Pinecone
├─ server.js                      # Express API (/chat, /speak, /health)
├─ package.json                   # Node project config and dependencies
├─ data/
│  ├─ aryan_mehta_personal_data.txt
│  ├─ rag_test_suite.json
│  ├─ rag_test_suite_readable.txt
│  └─ rag_evaluator.py
└─ .env                           # Local secrets (not for source control)
```

## How to Get Started

### 1. Prerequisites

- Node.js 18+
- A Pinecone account and API key
- A Gemini API key
- (Optional) ElevenLabs API key and voice ID for `/speak`

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create or update `.env` in the repository root:

```env
PINECONE_API_KEY=your_pinecone_key
GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
```

### 4. Ingest data into Pinecone

```bash
node ingest.js
```

This will:
- Read `data/aryan_mehta_personal_data.txt`
- Chunk and embed the text
- Create/use the `aryan-mehta-rag` Pinecone index
- Upsert chunk vectors with metadata

### 5. Start the API server

```bash
node server.js
```

Server default:
- `http://localhost:3000`

## Usage

### Health check

```bash
curl http://localhost:3000/health
```

### Chat endpoint

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"what are you working on right now?"}'
```

Example response:

```json
{
  "reply": "..."
}
```

### Speech endpoint (MP3)

```bash
curl -X POST http://localhost:3000/speak \
  -H "Content-Type: application/json" \
  -d '{"message":"how are you feeling these days?"}' \
  --output reply.mp3
```

## Evaluation

The repository includes a 20-case retrieval benchmark across categories such as relationship, work, daily life, family, opinion, emotional, and tricky prompts.

- Machine-readable tests: [data/rag_test_suite.json](data/rag_test_suite.json)
- Human-readable tests: [data/rag_test_suite_readable.txt](data/rag_test_suite_readable.txt)
- Evaluator utility: [data/rag_evaluator.py](data/rag_evaluator.py)

Run the evaluator directly for a self-test:

```bash
cd data
python rag_evaluator.py
```

To evaluate your actual retriever, import `run_all_tests(retrieval_fn)` from `data/rag_evaluator.py` and provide your retrieval function.

## Where to Get Help

- Review implementation files:
  - [server.js](server.js)
  - [ingest.js](ingest.js)
  - [aryanProxy.js](aryanProxy.js)
- Use the test suite and evaluator in [data](data) to diagnose retrieval quality.
- For project support, open an issue in the repository with:
  - Your environment (Node version, OS)
  - Request payload(s)
  - Observed vs expected behavior
  - Relevant logs (with secrets redacted)

## Maintainers and Contributions

### Maintainer

Maintained by the repository owner.

### Contributing

Contributions are welcome.

Suggested lightweight workflow:
1. Fork and create a feature branch.
2. Keep changes focused and scoped.
3. Add or update tests/evaluation inputs when behavior changes.
4. Submit a pull request with a clear summary and sample requests/responses.

If this project adds a dedicated contribution guide later, prefer referencing `CONTRIBUTING.md` from this section.

## License

Licensed under ISC. See package metadata in [package.json](package.json).
