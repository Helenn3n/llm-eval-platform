// Model Types
export type ModelType = 'local' | 'api';

export interface BaseModel {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  createdAt: string;
}

export interface LocalModel extends BaseModel {
  type: 'local';
  path: string;
  device: 'cpu' | 'cuda' | 'auto';
}

export interface APIModel extends BaseModel {
  type: 'api';
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'qwen' | 'zhipu' | 'moonshot' | 'minimax' | 'step' | 'meta' | 'custom';
  apiKey: string;
  endpoint?: string;
  modelName: string;
}

export type Model = LocalModel | APIModel;

// Dataset Types
export interface DatasetField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  fileName: string;
  size: number;
  recordCount: number;
  fields: DatasetField[];
  sampleData: Record<string, unknown>[];
  createdAt: string;
}

// Metric Types
export interface MetricParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array';
  description: string;
  defaultValue?: unknown;
  options?: string[]; // for select type
  required: boolean;
}

export interface MetricMapping {
  parameterName: string;
  datasetField: string;
}

export interface BaseMetric {
  id: string;
  name: string;
  description: string;
  category: 'builtin' | 'custom';
  parameters: MetricParameter[];
  createdAt: string;
}

export interface SingleMetric extends BaseMetric {
  type: 'single';
  evaluateFunction?: string; // Python function code for custom metrics
}

export interface WeightedMetric {
  metricId: string;
  weight: number;
}

export interface CompositeMetric extends BaseMetric {
  type: 'composite';
  metrics: WeightedMetric[];
}

export type Metric = SingleMetric | CompositeMetric;

// Task Types
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface EvaluationTask {
  id: string;
  name: string;
  description: string;
  modelIds: string[];
  datasetId: string;
  metricIds: string[];
  status: TaskStatus;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// Result Types
export interface MetricResult {
  metricId: string;
  metricName: string;
  score: number;
  details?: Record<string, unknown>;
}

export interface ModelResult {
  modelId: string;
  modelName: string;
  metrics: MetricResult[];
  overallScore: number;
}

export interface EvaluationResult {
  taskId: string;
  taskName: string;
  datasetId: string;
  datasetName: string;
  completedAt: string;
  modelResults: ModelResult[];
}

// App State
export interface AppState {
  models: Model[];
  datasets: Dataset[];
  metrics: Metric[];
  tasks: EvaluationTask[];
  results: EvaluationResult[];
}

export type AppAction =
  | { type: 'ADD_MODEL'; payload: Model }
  | { type: 'UPDATE_MODEL'; payload: Model }
  | { type: 'DELETE_MODEL'; payload: string }
  | { type: 'ADD_DATASET'; payload: Dataset }
  | { type: 'DELETE_DATASET'; payload: string }
  | { type: 'ADD_METRIC'; payload: Metric }
  | { type: 'DELETE_METRIC'; payload: string }
  | { type: 'ADD_TASK'; payload: EvaluationTask }
  | { type: 'UPDATE_TASK'; payload: EvaluationTask }
  | { type: 'ADD_RESULT'; payload: EvaluationResult };
