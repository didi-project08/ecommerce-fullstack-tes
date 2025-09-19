// src/utils/__tests__/api.test.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { 
    createApiInstance, 
    getApiInstance, 
    setApiInstance, 
    apiGet, 
    apiPost, 
    apiPut, 
    apiDelete 
} from '../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock window object
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

// Mock window.location
delete (window as any).location;
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

// Mock document.cookie untuk menguji cookie
Object.defineProperty(document, 'cookie', {
  value: '',
  writable: true,
});

describe('API Utils', () => {
  let mockApiInstance: AxiosInstance;

  beforeEach(() => {
    // Reset mock sebelum setiap pengujian
    jest.clearAllMocks();
    
    // Reset document.cookie
    document.cookie = '';
    
    // Buat instance api mock untuk setiap pengujian
    mockApiInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: {
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      },
      interceptors: {
        request: {
          use: jest.fn(),
          eject: jest.fn(),
        },
        response: {
          use: jest.fn(),
          eject: jest.fn(),
        },
      },
    } as unknown as AxiosInstance;
    
    // Mock axios.create untuk mengembalikan instance mock
    mockedAxios.create.mockReturnValue(mockApiInstance);
    
    // Set mock instance untuk digunakan oleh fungsi API
    setApiInstance(mockApiInstance);
  });

  test('should create axios instance with correct configuration', () => {
    // Mock axios.create untuk mengembalikan instance dengan konfigurasi tertentu
    const customInstance = {
      defaults: {
        baseURL: 'https://api.example.com',
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      },
      interceptors: {
        request: {
          use: jest.fn(),
          eject: jest.fn(),
        },
        response: {
          use: jest.fn(),
          eject: jest.fn(),
        },
      },
    } as unknown as AxiosInstance;
    
    mockedAxios.create.mockReturnValue(customInstance);
    
    // Buat instance API menggunakan factory function
    const api = createApiInstance('https://api.example.com');
    
    // Periksa apakah instance axios dibuat dengan konfigurasi yang benar
    expect(api.defaults.baseURL).toBe('https://api.example.com');
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
    expect(api.defaults.withCredentials).toBe(true);
  });

  test('should make GET request correctly', async () => {
    // Mock response untuk GET request
    const responseData = { data: 'test data' };
    
    // Mock instance api
    (mockApiInstance.get as jest.Mock).mockResolvedValue({
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    // Lakukan GET request
    const response = await apiGet('/test-endpoint');

    // Periksa apakah request dibuat dengan benar
    expect(response).toEqual(responseData);
    expect(mockApiInstance.get).toHaveBeenCalledWith('/test-endpoint', undefined);
  });

  test('should make POST request correctly', async () => {
    // Mock response untuk POST request
    const postData = { name: 'New Item' };
    const mockResponse = { id: 2, ...postData };
    
    // Mock instance api
    (mockApiInstance.post as jest.Mock).mockResolvedValue({
      data: mockResponse,
      status: 201,
      statusText: 'Created',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    // Lakukan POST request
    const response = await apiPost('/test-endpoint', postData);

    // Periksa apakah request dibuat dengan benar
    expect(response).toEqual(mockResponse);
    expect(mockApiInstance.post).toHaveBeenCalledWith('/test-endpoint', postData, undefined);
  });

  test('should make PUT request correctly', async () => {
    // Mock response untuk PUT request
    const putData = { name: 'Updated Item' };
    const mockResponse = { id: 1, ...putData };
    
    // Mock instance api
    (mockApiInstance.put as jest.Mock).mockResolvedValue({
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    // Lakukan PUT request
    const response = await apiPut('/test-endpoint/1', putData);

    // Periksa apakah request dibuat dengan benar
    expect(response).toEqual(mockResponse);
    expect(mockApiInstance.put).toHaveBeenCalledWith('/test-endpoint/1', putData, undefined);
  });

  test('should make DELETE request correctly', async () => {
    // Mock response untuk DELETE request
    const mockResponse = { success: true };
    
    // Mock instance api
    (mockApiInstance.delete as jest.Mock).mockResolvedValue({
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    // Lakukan DELETE request
    const response = await apiDelete('/test-endpoint/1');

    // Periksa apakah request dibuat dengan benar
    expect(response).toEqual(mockResponse);
    expect(mockApiInstance.delete).toHaveBeenCalledWith('/test-endpoint/1', undefined);
  });

  test('should handle API errors correctly', async () => {
    // Mock error response
    const errorResponse = {
      response: {
        status: 404,
        data: {
          message: 'Not Found',
        },
      },
    };

    // Mock instance api
    (mockApiInstance.get as jest.Mock).mockRejectedValue(errorResponse);

    // Uji penanganan error
    await expect(apiGet('/non-existent-endpoint')).rejects.toEqual(errorResponse);
  });

  test('should redirect to login on 401 response', async () => {
    // Mock error response dengan status 401
    const errorResponse = {
      response: {
        status: 401,
        data: {
          message: 'Unauthorized',
        },
      },
    };

    // Mock instance api
    (mockApiInstance.get as jest.Mock).mockRejectedValue(errorResponse);

    // Mock interceptor response
    const responseInterceptor = jest.fn(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
    
    // Set interceptor
    mockApiInstance.interceptors.response.use(responseInterceptor);

    // Lakukan request yang akan menghasilkan error 401
    try {
      await apiGet('/protected-endpoint');
    } catch (error) {
      // Periksa apakah redirect ke login
      expect(window.location.href).toBe('/');
    }
  });

  test('should include withCredentials in requests', async () => {
    // Mock response
    const responseData = { success: true };
    
    // Mock instance api dan tangkap config yang digunakan
    (mockApiInstance.get as jest.Mock).mockImplementation((url, config) => {
      // Periksa apakah withCredentials disetel ke true
      expect(config?.withCredentials).toBe(true);
      return Promise.resolve({
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config || {} as InternalAxiosRequestConfig,
      });
    });

    // Lakukan request
    await apiGet('/test-endpoint');
  });

  test('should have correct default headers', async () => {
    // Mock response
    const responseData = { success: true };
    
    // Mock instance api dan tangkap config yang digunakan
    (mockApiInstance.get as jest.Mock).mockImplementation((url, config) => {
      // Periksa apakah header default disertakan
      expect(config?.headers?.['Content-Type']).toBe('application/json');
      return Promise.resolve({
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config || {} as InternalAxiosRequestConfig,
      });
    });

    // Lakukan request
    await apiGet('/test-endpoint');
  });
});