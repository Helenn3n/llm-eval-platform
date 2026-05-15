import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Steps,
  message,
  Progress,
  Typography,
  Descriptions,
  List,
  Divider,
  Alert,
  Empty,
} from 'antd';
import { PlusOutlined, PlayCircleOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import type { EvaluationTask, EvaluationResult, TaskStatus } from '../../types';


const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

export default function TaskManagement() {
  const { state, dispatch } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<EvaluationTask | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  const handleCreate = () => {
    setCurrentStep(0);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleView = (task: EvaluationTask) => {
    setViewingTask(task);
  };

  const handleStartTask = (task: EvaluationTask) => {
    // Simulate starting task
    const updatedTask: EvaluationTask = {
      ...task,
      status: 'running',
      startedAt: new Date().toISOString(),
    };
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    message.success('任务已开始');

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        clearInterval(interval);
        const completedTask: EvaluationTask = {
          ...task,
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
        };
        dispatch({ type: 'UPDATE_TASK', payload: completedTask });

        // Generate mock result
        const result: EvaluationResult = generateMockResult(task);
        dispatch({ type: 'ADD_RESULT', payload: result });
        message.success('任务已完成');
      } else {
        const runningTask: EvaluationTask = {
          ...task,
          status: 'running',
          progress,
        };
        dispatch({ type: 'UPDATE_TASK', payload: runningTask });
      }
    }, 500);
  };

  const generateMockResult = (task: EvaluationTask): EvaluationResult => {
    const dataset = state.datasets.find((d) => d.id === task.datasetId);
    const modelResults = task.modelIds.map((modelId) => {
      const model = state.models.find((m) => m.id === modelId);
      const metrics = task.metricIds.map((metricId) => {
        const metric = state.metrics.find((m) => m.id === metricId);
        return {
          metricId,
          metricName: metric?.name || '',
          score: 0.6 + Math.random() * 0.35, // Random score between 0.6 and 0.95
        };
      });
      return {
        modelId,
        modelName: model?.name || '',
        metrics,
        overallScore: metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length,
      };
    });

    return {
      taskId: task.id,
      taskName: task.name,
      datasetId: task.datasetId,
      datasetName: dataset?.name || '',
      completedAt: new Date().toISOString(),
      modelResults,
    };
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const task: EvaluationTask = {
        id: `task-${Date.now()}`,
        name: values.name,
        description: values.description,
        modelIds: values.models,
        datasetId: values.dataset,
        metricIds: values.metrics,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_TASK', payload: task });
      message.success('任务创建成功');
      setIsModalOpen(false);
    });
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getStatusTag = (status: TaskStatus) => {
    const colors: Record<TaskStatus, string> = {
      pending: 'default',
      running: 'processing',
      completed: 'success',
      failed: 'error',
    };
    const statusText: Record<TaskStatus, string> = {
      pending: '待执行',
      running: '运行中',
      completed: '已完成',
      failed: '失败',
    };
    return <Tag color={colors[status]}>{statusText[status]}</Tag>;
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus, record: EvaluationTask) => (
        <Space>
          {getStatusIcon(status)}
          {getStatusTag(status)}
          {status === 'running' && <span>{record.progress}%</span>}
        </Space>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      render: (_: unknown, record: EvaluationTask) => (
        <Progress
          percent={record.progress}
          size="small"
          status={record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '模型',
      key: 'models',
      render: (_: unknown, record: EvaluationTask) => (
        <Space wrap>
          {record.modelIds.map((id) => {
            const model = state.models.find((m) => m.id === id);
            return <Tag key={id}>{model?.name || id}</Tag>;
          })}
        </Space>
      ),
    },
    {
      title: '数据集',
      key: 'dataset',
      render: (_: unknown, record: EvaluationTask) => {
        const dataset = state.datasets.find((d) => d.id === record.datasetId);
        return <span>{dataset?.name || record.datasetId}</span>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: EvaluationTask) => (
        <Space>
          {record.status === 'pending' && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => handleStartTask(record)}
            >
              开始
            </Button>
          )}
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  const steps = [
    {
      title: '基本信息',
      content: (
        <>
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="例如：GPT-4 vs Claude 基准测试" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={3} placeholder="描述评测任务" />
          </Form.Item>
        </>
      ),
    },
    {
      title: '选择模型',
      content: (
        <Form.Item
          name="models"
          label="模型"
          rules={[{ required: true, message: '请至少选择一个模型' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择要评测的模型"
            style={{ width: '100%' }}
          >
            {state.models.map((model) => (
              <Option key={model.id} value={model.id}>
                {model.name} ({model.type === 'local' ? '本地' : 'API'})
              </Option>
            ))}
          </Select>
        </Form.Item>
      ),
    },
    {
      title: '选择数据集',
      content: (
        <Form.Item
          name="dataset"
          label="数据集"
          rules={[{ required: true, message: '请选择数据集' }]}
        >
          <Select placeholder="选择评测数据集" style={{ width: '100%' }}>
            {state.datasets.map((dataset) => (
              <Option key={dataset.id} value={dataset.id}>
                {dataset.name}（{dataset.recordCount} 条记录）
              </Option>
            ))}
          </Select>
        </Form.Item>
      ),
    },
    {
      title: '选择指标',
      content: (
        <Form.Item
          name="metrics"
          label="指标"
          rules={[{ required: true, message: '请至少选择一个指标' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择评测指标"
            style={{ width: '100%' }}
          >
            {state.metrics.map((metric) => (
              <Option key={metric.id} value={metric.id}>
                {metric.name}（{metric.type === 'single' ? '单一' : '组合'}）
              </Option>
            ))}
          </Select>
        </Form.Item>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card
        style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}
        bodyStyle={{ flex: 1, overflow: 'auto', padding: '16px' }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建任务
          </Button>
        }
      >
        <Table
          dataSource={state.tasks}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => {
              const result = state.results.find((r) => r.taskId === record.id);
              if (!result) return <Empty description="No results yet" />;
              return (
                <div style={{ padding: 16 }}>
                  <Title level={5}>Evaluation Results</Title>
                  <List
                    dataSource={result.modelResults}
                    renderItem={(modelResult) => (
                      <List.Item>
                        <Card title={modelResult.modelName} style={{ width: '100%' }}>
                          <div style={{ marginBottom: 8 }}>
                            <Text strong>Overall Score: </Text>
                            <Tag color="blue">{(modelResult.overallScore * 100).toFixed(1)}%</Tag>
                          </div>
                          <Space wrap>
                            {modelResult.metrics.map((metric) => (
                              <div key={metric.metricId} style={{ marginRight: 16 }}>
                                <Text type="secondary">{metric.metricName}:</Text>
                                <div>
                                  <Tag color={metric.score >= 0.8 ? 'success' : metric.score >= 0.6 ? 'warning' : 'error'}>
                                    {(metric.score * 100).toFixed(1)}%
                                  </Tag>
                                </div>
                              </div>
                            ))}
                          </Space>
                        </Card>
                      </List.Item>
                    )}
                  />
                </div>
              );
            },
          }}
        />
      </Card>

      {/* Create Task Modal */}
      <Modal
        title="Create Evaluation Task"
        open={isModalOpen}
        onOk={() => {
          if (currentStep === steps.length - 1) {
            handleSubmit();
          } else {
            setCurrentStep(currentStep + 1);
          }
        }}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        okText={currentStep === steps.length - 1 ? '创建' : '下一步'}
      >
        <Steps
          current={currentStep}
          style={{ marginBottom: 24 }}
          items={steps.map((step) => ({ title: step.title }))}
        />

        <Form form={form} layout="vertical">
          {steps[currentStep].content}
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          {currentStep > 0 && (
            <Button style={{ marginRight: 8 }} onClick={() => setCurrentStep(currentStep - 1)}>
              上一步
            </Button>
          )}
        </div>
      </Modal>

      {/* View Task Modal */}
      <Modal
        title="任务详情"
        open={!!viewingTask}
        onCancel={() => setViewingTask(null)}
        footer={[
          <Button key="close" onClick={() => setViewingTask(null)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {viewingTask && (
          <div style={{ marginTop: 20 }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="名称">{viewingTask.name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(viewingTask.status)}
              </Descriptions.Item>
              <Descriptions.Item label="进度" span={2}>
                <Progress
                  percent={viewingTask.progress}
                  status={viewingTask.status === 'failed' ? 'exception' : viewingTask.status === 'completed' ? 'success' : 'active'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(viewingTask.createdAt).toLocaleString()}
              </Descriptions.Item>
              {viewingTask.startedAt && (
                <Descriptions.Item label="开始时间">
                  {new Date(viewingTask.startedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {viewingTask.completedAt && (
                <Descriptions.Item label="完成时间">
                  {new Date(viewingTask.completedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="描述" span={2}>
                {viewingTask.description}
              </Descriptions.Item>
            </Descriptions>

            <Divider>已选模型</Divider>
            <Space wrap>
              {viewingTask.modelIds.map((id) => {
                const model = state.models.find((m) => m.id === id);
                return <Tag key={id} color="blue">{model?.name || id}</Tag>;
              })}
            </Space>

            <Divider>已选数据集</Divider>
            {(() => {
              const dataset = state.datasets.find((d) => d.id === viewingTask.datasetId);
              return dataset ? (
                <Alert
                  message={dataset.name}
                  description={`${dataset.recordCount} 条记录 · ${dataset.fields.length} 个字段`}
                  type="info"
                />
              ) : null;
            })()}

            <Divider>已选指标</Divider>
            <Space wrap>
              {viewingTask.metricIds.map((id) => {
                const metric = state.metrics.find((m) => m.id === id);
                return (
                  <Tag key={id} color={metric?.type === 'composite' ? 'purple' : 'green'}>
                    {metric?.name || id}
                  </Tag>
                );
              })}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}
