const REQUEST_TIMEOUT_MS = 8_000;

export class MobileApiError extends Error {
  readonly status: number | null;
  readonly authRequired: boolean;
  readonly retryable: boolean;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "MobileApiError";
    this.status = status;
    this.authRequired = status === 401;
    this.retryable = status === 408 || status === 429 || (status !== null && status >= 500);
  }
}

type JsonRequestResult<T> = {
  response: Response;
  payload: T;
};

export async function requestJson<T>(
  url: string,
  init: RequestInit,
  invalidResponseMessage: string,
  signal?: AbortSignal,
): Promise<JsonRequestResult<T>> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const abortExternalRequest = () => controller.abort();
  signal?.addEventListener("abort", abortExternalRequest, { once: true });

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    let payload: T;
    try {
      payload = (await response.json()) as T;
    } catch {
      throw new Error(invalidResponseMessage);
    }
    return { response, payload };
  } catch (reason) {
    if (reason instanceof Error && reason.message === invalidResponseMessage) throw reason;
    if (timedOut) throw new Error("The traffic service took too long to respond.");
    if (signal?.aborted) throw new Error("The request was cancelled.");
    throw new Error("The traffic service is unreachable. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortExternalRequest);
  }
}
