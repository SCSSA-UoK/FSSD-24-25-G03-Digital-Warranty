import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { handleMockRoute } from './mockBackend';

// Simulated latency in milliseconds to give authentic UI feedback
const SIMULATED_DELAY_MS = 120;

export const mockAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const method = config.method || 'get';
  const url = config.url || '';

  // Extract parsed data
  let parsedData = config.data;
  if (typeof parsedData === 'string') {
    try {
      parsedData = JSON.parse(parsedData);
    } catch {
      // Keep as string or FormData
    }
  }

  // Artificial async delay to simulate realistic network latency
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

  // Route to mock engine
  const mockRes = handleMockRoute(method, url, parsedData, config.headers as any);

  if (mockRes.status >= 200 && mockRes.status < 300) {
    const response: AxiosResponse = {
      data: mockRes.data,
      status: mockRes.status,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    };
    return response;
  } else {
    const error: any = new Error(mockRes.data?.message || 'Request failed with status ' + mockRes.status);
    error.config = config;
    error.response = {
      data: mockRes.data,
      status: mockRes.status,
      statusText: mockRes.status === 404 ? 'Not Found' : 'Bad Request',
      headers: {},
      config,
      request: {},
    };
    return Promise.reject(error);
  }
};
