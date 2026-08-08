export interface LeadSubmissionResult {
  success: boolean;
  message?: string;
  leadId?: number | string;
  requestId: string | null;
  [key: string]: unknown;
}

export class LeadSubmissionRequestError extends Error {
  status: number;
  requestId: string | null;

  constructor(message: string, status: number, requestId: string | null) {
    super(message);
    this.name = "LeadSubmissionRequestError";
    this.status = status;
    this.requestId = requestId;
  }
}

const getRequestId = (response: Response, result: Record<string, unknown>) => {
  const bodyRequestId = typeof result.requestId === "string" ? result.requestId : null;
  return response.headers.get("x-osw-request-id") || bodyRequestId || response.headers.get("x-vercel-id");
};

export async function submitLeadPayload(
  payload: Record<string, unknown>,
  fetcher: typeof fetch = fetch,
): Promise<LeadSubmissionResult> {
  const response = await fetcher("/api/leads/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let result: Record<string, unknown> = {};
  try {
    const parsed = await response.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) result = parsed;
  } catch {
    // A successful write must not be shown as failed only because a proxy stripped
    // or replaced the JSON response body. The status and request ID remain authoritative.
  }

  const requestId = getRequestId(response, result);
  if (!response.ok) {
    const message = typeof result.error === "string" ? result.error : `Failed to submit form (${response.status})`;
    throw new LeadSubmissionRequestError(message, response.status, requestId);
  }

  return { ...result, success: true, requestId } as LeadSubmissionResult;
}

export function completeLeadSuccess(
  markSuccessful: () => void,
  nonCriticalActions: Array<() => void>,
  onNonCriticalError: (error: unknown) => void = console.warn,
) {
  // Commit the customer-visible success state before cart, analytics, or toast work.
  markSuccessful();
  for (const action of nonCriticalActions) {
    try {
      action();
    } catch (error) {
      onNonCriticalError(error);
    }
  }
}
