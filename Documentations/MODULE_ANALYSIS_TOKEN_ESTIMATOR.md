# Module Analysis: Token Estimator Service

**Service:** `src/services/tokenEstimator/TokenEstimatorService.ts`
**Cache:** `src/services/tokenEstimator/TokenCache.ts`
**Models:** `src/services/tokenEstimator/models.ts`

---

## 1. Architecture
The Token Estimator is a **Singleton Service** that acts as the source of truth for all token calculations. It abstracts away the complexity of different provider APIs (OpenAI vs Anthropic) behind a unified `estimate()` interface.

## 2. Core Components

### The Service (`TokenEstimatorService.ts`)
*   **Debouncing:** Implements a custom `createDebounce` utility. Calculations wait for `1000ms` of idle time or force execution after `5000ms`.
*   **Event System:** Uses a subscription pattern (`subscribe`). The UI components (Status Bar) listen to changes rather than polling.
*   **Race Condition Handling:** Uses request IDs and `AbortController` to cancel stale requests if the user keeps typing.

### Strategies (Estimators)
*   **`LocalEstimator`**: Uses `js-tiktoken` (WASM-based) to calculate tokens locally for OpenAI models. Zero latency, works offline.
*   **`OnlineEstimator` (Google/Anthropic)**: Sends the text to the respective API endpoints to get exact counts. Requires API keys.

### Caching (`TokenCache.ts`)
*   **Key Generation:** `Hash(Content + ModelID)`.
*   **Mechanism:** If the content matches a previous calculation, it returns the cached result immediately, bypassing the API/WASM call. This saves API costs and CPU cycles.

### Large File Strategy
*   **Performance:** If a file exceeds `50,000` characters (configurable), the service switches to **Approximation Mode**.
*   **Logic:** It takes a sample, calculates tokens for the sample, and extrapolates the total based on character ratio. This prevents the UI from freezing when analyzing 10MB logs.

## 3. Assessment
*   **Strengths:**
    *   **Robustness:** Handles network failures, rate limits, and race conditions gracefully.
    *   **Cost Awareness:** Calculates real-time $ cost based on `models.ts` pricing definitions.
*   **Future Work:**
    *   Add support for "Custom Model" definitions (user-defined cost/token ratios).
