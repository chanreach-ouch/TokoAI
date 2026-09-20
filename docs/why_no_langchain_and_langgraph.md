# Architectural Decisions: Why We Skipped LangChain & LangGraph

When building the **TokoAI Commerce Agent**, developers often assume that frameworks like **LangChain** or **LangGraph** are strictly required to build an AI or RAG (Retrieval-Augmented Generation) system. 

However, for a high-performance, Multi-Tenant SaaS platform operating on TikTok's webhook infrastructure, using these frameworks introduces unnecessary overhead. This document outlines why TokoAI relies on raw Python and native SDKs instead.

---

## 1. LangGraph vs. Straight-Line RAG

### What is LangGraph?
LangGraph is a framework specifically designed for **Cyclic Workflows (Loops)** and complex **Multi-Agent Systems**. It is built for scenarios where an AI must iteratively think, test, fail, and loop back to try again (e.g., writing code, running it in a sandbox, reading the error, and rewriting the code).

### Why TokoAI Doesn't Need It
TokoAI operates a highly efficient **Straight-Line (Acyclic) Workflow**:
1. Webhook receives a message from a TikTok buyer.
2. The system queries PostgreSQL (`pgvector`) for relevant products.
3. The system passes the product context and chat history to Gemini.
4. Gemini generates a response.
5. The system sends the response back to TikTok.

Because our customer service agent answers directly and does not need to debate with other agents or loop continuously, introducing LangGraph's state-machine overhead would needlessly complicate the codebase and increase response latency. We handle conversation state (memory) far more efficiently using fast, short-lived **Redis** cache keys.

---

## 2. LangChain vs. Native SDKs

### The Multi-Tenant Database Challenge
TokoAI is a SaaS platform serving hundreds of different sellers. When a customer messages Seller A, the RAG system *must* strictly filter the database to only search Seller A's products (`WHERE shop_id = A`).

LangChain heavily abstracts database connections using "Vector Store Wrappers." Customizing these wrappers to inject secure, dynamic SQL filters (like our `shop_id`) can be notoriously difficult and brittle. 
By writing raw **SQLAlchemy** queries, we retain 100% control over our database architecture, ensuring data never leaks between sellers.

### Speed and Lightweight Execution
LangChain is a massive dependency. TikTok webhooks require sub-second acknowledgment and fast processing. By using **FastAPI** and the native **Google GenAI SDK**, TokoAI remains incredibly lightweight, ensuring fast cold-starts in Docker and rapid response times for buyers.

### Eliminating "Prompt Bloat"
Frameworks often silently inject background instructions and wrapper prompts to make their generic tools function correctly. This hidden "prompt bloat" consumes extra API tokens. By controlling the exact prompt strings in `app/agent/rag.py`, TokoAI uses exactly the number of tokens required—keeping API costs extremely low and profit margins high for the SaaS business.

---

## Conclusion
TokoAI is a fully functional, professional RAG Agent. By avoiding heavy abstraction layers, the codebase remains:
* **Lean and Fast** (Crucial for TikTok chat interfaces)
* **Secure** (Total control over Multi-Tenant database filtering)
* **Cost-Effective** (No wasted API tokens)
* **Highly Maintainable** (Readable, standard Python code without learning framework-specific syntax)
