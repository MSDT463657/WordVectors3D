// This file contains client-side utilities for OpenAI integration
// The actual API calls are made from the backend for security

export function validateApiKey(apiKey: string): boolean {
  if (!apiKey) return false;
  return apiKey.startsWith('sk-') && apiKey.length > 20;
}

export function formatApiKeyForDisplay(apiKey: string): string {
  if (apiKey.length < 10) return apiKey;
  return `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;
}
