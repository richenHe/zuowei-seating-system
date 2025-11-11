// API调用封装 - 排座位表系统
import axios, { AxiosResponse } from 'axios';
import type { 
  Config, 
  Person, 
  PersonWithAssignment,
  DeskLayout,
  ConfigUpdateRequest,
  PersonCreateRequest,
  PersonUpdateRequest,
  BatchAssignmentUpdateRequest,
  AssignmentUpdateRequest,
  Ambassador,
  AmbassadorCreateRequest,
  AmbassadorUpdateRequest,
  ApiResponse
} from '@/types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',               // API基础路径
  timeout: 10000,                // 超时时间10秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加请求日志
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] 请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 检查业务逻辑错误
    if (!response.data.success) {
      throw new Error(response.data.error || '请求失败');
    }
    return response;
  },
  (error) => {
    console.error('[API] 响应错误:', error);
    
    // 处理网络错误
    if (!error.response) {
      throw new Error('网络连接失败，请检查网络设置');
    }
    
    // 处理HTTP错误
    const { status, data } = error.response;
    let message = '请求失败';
    
    switch (status) {
      case 400:
        message = data?.error || '请求参数错误';
        break;
      case 404:
        message = data?.error || '接口不存在';
        break;
      case 500:
        message = data?.error || '服务器内部错误';
        break;
      default:
        message = data?.error || `HTTP错误 ${status}`;
    }
    
    throw new Error(message);
  }
);

// ============ 配置相关API ============

/**
 * 获取当前配置
 */
export const getConfig = async (): Promise<Config> => {
  const response = await api.get<ApiResponse<Config>>('/config');
  return response.data.data!;
};

/**
 * 更新配置（桌数、座位数）
 */
export const updateConfig = async (config: ConfigUpdateRequest): Promise<Config> => {
  const response = await api.put<ApiResponse<Config>>('/config', config);
  return response.data.data!;
};

// ============ 人员相关API ============

/**
 * 获取所有人员
 */
export const getPersons = async (): Promise<PersonWithAssignment[]> => {
  const response = await api.get<ApiResponse<PersonWithAssignment[]>>('/persons');
  return response.data.data!;
};

/**
 * 添加人员
 */
export const createPerson = async (person: PersonCreateRequest): Promise<Person> => {
  const response = await api.post<ApiResponse<Person>>('/persons', person);
  return response.data.data!;
};

/**
 * 更新人员信息
 */
export const updatePerson = async (id: number, person: PersonUpdateRequest): Promise<Person> => {
  const response = await api.put<ApiResponse<Person>>(`/persons/${id}`, person);
  return response.data.data!;
};

/**
 * 删除人员
 */
export const deletePerson = async (id: number): Promise<void> => {
  await api.delete<ApiResponse>(`/persons/${id}`);
};

/**
 * 批量删除人员
 */
export const batchDeletePersons = async (person_ids: number[]): Promise<string> => {
  const response = await api.delete<ApiResponse<void>>('/persons/batch', {
    data: { person_ids }
  });
  return response.data.message || '批量删除成功';
};

// ============ 座位分配相关API ============

/**
 * 获取座位布局（按桌分组）
 */
export const getSeatingLayout = async (): Promise<{layout: DeskLayout[], waiting: PersonWithAssignment[]}> => {
  const response = await api.get<ApiResponse<{layout: DeskLayout[], waiting: PersonWithAssignment[]}>>('/assignments/layout');
  return response.data.data!;
};

/**
 * 批量更新座位分配（拖拽后保存）
 */
export const updateAssignments = async (assignments: BatchAssignmentUpdateRequest): Promise<void> => {
  await api.put<ApiResponse>('/assignments', assignments);
};

/**
 * 单个座位分配更新
 */
export const updateSingleAssignment = async (assignment: AssignmentUpdateRequest): Promise<void> => {
  await api.post<ApiResponse>('/assignments/single', assignment);
};

/**
 * 删除指定人员的座位分配（移至备选区）
 */
export const removeAssignment = async (personId: number): Promise<void> => {
  await api.delete<ApiResponse>(`/assignments/${personId}`);
};

// ============ 系统相关API ============

/**
 * 健康检查
 */
export const healthCheck = async (): Promise<any> => {
  const response = await api.get<ApiResponse>('/health');
  return response.data;
};

// ============ 工具函数 ============

// ============ 传播大使相关API ============

/**
 * 获取所有传播大使
 */
export const getAmbassadors = async (): Promise<Ambassador[]> => {
  const response = await api.get<ApiResponse<Ambassador[]>>('/ambassadors');
  return response.data.data!;
};

/**
 * 添加传播大使
 */
export const createAmbassador = async (ambassador: AmbassadorCreateRequest): Promise<Ambassador> => {
  const response = await api.post<ApiResponse<Ambassador>>('/ambassadors', ambassador);
  return response.data.data!;
};

/**
 * 更新传播大使信息
 */
export const updateAmbassador = async (id: number, ambassador: AmbassadorUpdateRequest): Promise<Ambassador> => {
  const response = await api.put<ApiResponse<Ambassador>>(`/ambassadors/${id}`, ambassador);
  return response.data.data!;
};

/**
 * 删除传播大使
 */
export const deleteAmbassador = async (id: number): Promise<void> => {
  await api.delete<ApiResponse>(`/ambassadors/${id}`);
};

/**
 * 批量删除传播大使
 */
export const batchDeleteAmbassadors = async (ambassador_ids: number[]): Promise<string> => {
  const response = await api.delete<ApiResponse<void>>('/ambassadors/batch', {
    data: { ambassador_ids }
  });
  return response.data.message || '批量删除传播大使成功';
};

// ============ 工具函数 ============

/**
 * 处理API错误
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误';
};
