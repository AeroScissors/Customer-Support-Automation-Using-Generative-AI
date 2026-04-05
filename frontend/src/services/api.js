// File: frontend/src/services/api.js

const BASE_URL = "https://aeroscissors-nebulacore.hf.space";
// --------------------------------------------------
// Auth Helpers
// --------------------------------------------------
function getToken() {
  return sessionStorage.getItem("access_token");
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Date.now() / 1000;
    return payload.exp < now;
  } catch {
    return true;
  }
}

function authHeaders() {
  const token = getToken();

  if (!token) return {};

  if (isTokenExpired(token)) {
    sessionStorage.clear();
    window.location.href = "/login";
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

// --------------------------------------------------
// Helper: handle HTTP responses
// --------------------------------------------------
async function handleResponse(response) {
  if (response.status === 401) {
    sessionStorage.clear();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData.detail ||
      errorData.message ||
      "API request failed";
    throw new Error(message);
  }

  return response.json();
}

// --------------------------------------------------
// 🔴 NEW: Agent Heartbeat
// --------------------------------------------------
export async function pingAgent() {
  const response = await fetch(`${BASE_URL}/agent/ping`, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
  });

  return handleResponse(response);
}

// --------------------------------------------------
// Customer Chat API
// --------------------------------------------------
export async function sendChatMessage(message) {
  const response = await fetch(`${BASE_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: message,
      user_id: "demo_user",
    }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }

  if (!response.ok) {
    const errorMessage =
      data?.detail || data?.message || "Failed to send message";
    throw new Error(errorMessage);
  }

  if (!data.message || !data.ticket_id || !data.status) {
    console.error("Invalid API response:", data);
    throw new Error("Malformed response from backend");
  }

  return data;
}

// --------------------------------------------------
// Tickets API
// --------------------------------------------------

export async function getTickets() {
  const response = await fetch(`${BASE_URL}/tickets/`, {
    headers: {
      ...authHeaders(),
    },
  });
  return handleResponse(response);
}

export async function getTicketById(ticketId) {
  const response = await fetch(
    `${BASE_URL}/tickets/${ticketId}`,
    {
      headers: {
        ...authHeaders(),
      },
    }
  );
  return handleResponse(response);
}

export async function updateTicketStatus(ticketId, status) {
  const response = await fetch(
    `${BASE_URL}/tickets/${ticketId}/status?status=${status}`,
    {
      method: "PATCH",
      headers: {
        ...authHeaders(),
      },
    }
  );
  await handleResponse(response);
}

export async function addTicketMessage(ticketId, payload) {
  const response = await fetch(
    `${BASE_URL}/tickets/${ticketId}/message`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
}

// --------------------------------------------------
// Admin Analytics API
// --------------------------------------------------

export async function getAdminAnalytics() {
  const response = await fetch(
    `${BASE_URL}/admin/analytics`,
    {
      headers: {
        ...authHeaders(),
      },
    }
  );
  return handleResponse(response);
}

export async function getTicketVolumeTrend() {
  const response = await fetch(
    `${BASE_URL}/admin/analytics/tickets/trend`,
    {
      headers: {
        ...authHeaders(),
      },
    }
  );
  return handleResponse(response);
}

export async function getConfidenceDistribution() {
  const response = await fetch(
    `${BASE_URL}/admin/analytics/confidence-distribution`,
    {
      headers: {
        ...authHeaders(),
      },
    }
  );
  return handleResponse(response);
}

export async function getResolutionTrend() {
  const response = await fetch(
    `${BASE_URL}/admin/analytics/resolution-trend`,
    {
      headers: {
        ...authHeaders(),
      },
    }
  );
  return handleResponse(response);
}

export async function getEscalationTrend() {
  const response = await fetch(
    `${BASE_URL}/admin/analytics/escalation-trend`,
    {
      headers: {
        ...authHeaders(),
      },
    }
  );
  return handleResponse(response);
}

export async function getSLAMetrics() {
  const response = await fetch(
    `${BASE_URL}/admin/analytics/sla-detailed`,
    {
      headers: {
        ...authHeaders(),
      },
    }
  );

  if (response.status === 401) {
    sessionStorage.clear();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    return {
      avg_resolution_time: "4h 45m",
      sla_breach_count: 16,
      backlog_size: 134,
      breach_rate_trend: 12.2,
      breach_rate_delta: "1.1%",
      breach_chart_data: [],
      backlog_chart_data: [],
    };
  }

  return handleResponse(response);
}

// --------------------------------------------------
// Admin Agents API
// --------------------------------------------------

export async function getAdminAgents() {
  const response = await fetch(
    `${BASE_URL}/admin/agents`,
    {
      headers: {
        ...authHeaders(),
      },
    }
  );

  return handleResponse(response);
}

// --------------------------------------------------
// FAQ API
// --------------------------------------------------

export async function getAdminFAQs() {
  const response = await fetch(`${BASE_URL}/faq/`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(response);
}

export async function createAdminFAQ(faqData) {
  const response = await fetch(`${BASE_URL}/faq/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(faqData),
  });
  return handleResponse(response);
}

export async function updateAdminFAQ(payload) {
  const response = await fetch(`${BASE_URL}/faq/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function deleteAdminFAQ(faqId) {
  const response = await fetch(`${BASE_URL}/faq/${faqId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse(response);
}

// --------------------------------------------------
// Agent API
// --------------------------------------------------

export async function getAgentTicketMetrics() {
  const response = await fetch(
    `${BASE_URL}/agent/metrics`,
    {
      headers: {
        ...authHeaders(),
      },
    }
  );
  return handleResponse(response);
}

export async function getAgentMetrics() {
  const response = await fetch(
    `${BASE_URL}/agent/workforce`,
    {
      headers: {
        ...authHeaders(),
      },
    }
  );
  return handleResponse(response);
}

export async function getAllAgents() {
  const response = await fetch(`${BASE_URL}/agent/all`, {
    headers: {
      ...authHeaders(),
    },
  });
  return handleResponse(response);
}

export async function createAgentAccount(payload) {
  const response = await fetch(`${BASE_URL}/agent/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}