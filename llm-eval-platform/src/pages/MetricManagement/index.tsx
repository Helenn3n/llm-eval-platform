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

  message,
  Popconfirm,
  Typography,
  List,
  Slider,
  Divider,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, CodeOutlined, MergeCellsOutlined } from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import type { Metric, SingleMetric, CompositeMetric, MetricParameter } from '../../types';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

export default function MetricManagement() {
  const { state, dispatch } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompositeModalOpen, setIsCompositeModalOpen] = useState(false);
  const [viewingMetric, setViewingMetric] = useState<Metric | null>(null);
  const [, setMetricType] = useState<'single' | 'composite'>('single');
  const [parameters, setParameters] = useState<MetricParameter[]>([]);
  const [compositeWeights, setCompositeWeights] = useState<{ metricId: string; weight: number }[]>([]);
  const [form] = Form.useForm();
  const [compositeForm] = Form.useForm();

  const handleAdd = () => {
    setMetricType('single');
    setParameters([]);
    form.resetFields();
    form.setFieldsValue({ type: 'single', category: 'custom' });
    setIsModalOpen(true);
  };

  const handleAddComposite = () => {
    setCompositeWeights([]);
    compositeForm.resetFields();
    setIsCompositeModalOpen(true);
  };

  const handleView = (metric: Metric) => {
    setViewingMetric(metric);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_METRIC', payload: id });
    message.success('Metric deleted successfully');
  };

  const handleAddParameter = () => {
    const newParam: MetricParameter = {
      name: '',
      type: 'string',
      description: '',
      required: true,
    };
    setParameters([...parameters, newParam]);
  };

  const handleUpdateParameter = (index: number, field: keyof MetricParameter, value: unknown) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      // Validate parameters
      const validParams = parameters.filter((p) => p.name.trim() !== '');
      
      const metric: SingleMetric = {
        id: `metric-${Date.now()}`,
        name: values.name,
        description: values.description,
        category: values.category,
        type: 'single',
        parameters: validParams,
        evaluateFunction: values.evaluateFunction,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_METRIC', payload: metric });
      message.success('Metric added successfully');
      setIsModalOpen(false);
    });
  };

  const handleSubmitComposite = () => {
    compositeForm.validateFields().then((values) => {
      if (compositeWeights.length < 2) {
        message.error('Please select at least 2 metrics to combine');
        return;
      }

      const totalWeight = compositeWeights.reduce((sum, w) => sum + w.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        message.error('Weights must sum to 1.0');
        return;
      }

      const metric: CompositeMetric = {
        id: `metric-${Date.now()}`,
        name: values.name,
        description: values.description,
        category: 'custom',
        type: 'composite',
        parameters: [],
        metrics: compositeWeights,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_METRIC', payload: metric });
      message.success('Composite metric created successfully');
      setIsCompositeModalOpen(false);
    });
  };

  const handleAddMetricToComposite = (metricId: string) => {
    if (compositeWeights.find((w) => w.metricId === metricId)) {
      message.warning('Metric already added');
      return;
    }
    
    // Auto-balance weights
    const newWeights = [...compositeWeights, { metricId, weight: 0 }];
    const equalWeight = 1.0 / newWeights.length;
    setCompositeWeights(newWeights.map((w) => ({ ...w, weight: equalWeight })));
  };

  const handleUpdateWeight = (metricId: string, weight: number) => {
    setCompositeWeights(compositeWeights.map((w) => 
      w.metricId === metricId ? { ...w, weight } : w
    ));
  };

  const handleRemoveFromComposite = (metricId: string) => {
    const newWeights = compositeWeights.filter((w) => w.metricId !== metricId);
    if (newWeights.length > 0) {
      const equalWeight = 1.0 / newWeights.length;
      setCompositeWeights(newWeights.map((w) => ({ ...w, weight: equalWeight })));
    } else {
      setCompositeWeights([]);
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'single' ? 'blue' : 'purple'} icon={type === 'composite' ? <MergeCellsOutlined /> : <CodeOutlined />}>
          {type === 'single' ? '单一' : '组合'}
        </Tag>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => (
        <Tag color={cat === 'builtin' ? 'green' : 'orange'}>
          {cat === 'builtin' ? '内置' : '自定义'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '参数',
      key: 'parameters',
      render: (_: unknown, record: Metric) => (
        <span>{record.parameters.length} 个参数</span>
      ),
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
      render: (_: unknown, record: Metric) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
            查看
          </Button>
          {record.category === 'custom' && (
            <Popconfirm
              title="删除指标"
              description="确定要删除此指标吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button icon={<DeleteOutlined />} size="small" danger>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card
        style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}
        bodyStyle={{ flex: 1, overflow: 'auto', padding: '16px' }}
        extra={
          <Space>
            <Button icon={<MergeCellsOutlined />} onClick={handleAddComposite}>
              创建组合指标
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加指标
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={state.metrics}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Add Single Metric Modal */}
      <Modal
        title="添加自定义指标"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={700}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="指标名称"
            rules={[{ required: true, message: '请输入指标名称' }]}
          >
            <Input placeholder="例如：自定义准确率, F1 分数" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={2} placeholder="描述此指标评测的内容" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            initialValue="custom"
            hidden
          >
            <Input />
          </Form.Item>

          <Divider>参数</Divider>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            定义将在评测期间映射到数据集字段的参数
          </Text>

          <List
            bordered
            dataSource={parameters}
            locale={{ emptyText: '未定义参数' }}
            renderItem={(param, index) => (
              <List.Item
                actions={[
                  <Button type="link" danger onClick={() => handleRemoveParameter(index)}>
                    Remove
                  </Button>,
                ]}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    placeholder="Parameter name"
                    value={param.name}
                    onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                  />
                  <Select
                    style={{ width: '100%' }}
                    value={param.type}
                    onChange={(value) => handleUpdateParameter(index, 'type', value)}
                  >
                    <Option value="string">String</Option>
                    <Option value="number">Number</Option>
                    <Option value="boolean">Boolean</Option>
                    <Option value="array">Array</Option>
                    <Option value="select">Select</Option>
                  </Select>
                  <Input
                    placeholder="Description"
                    value={param.description}
                    onChange={(e) => handleUpdateParameter(index, 'description', e.target.value)}
                  />
                </Space>
              </List.Item>
            )}
          />

          <Button type="dashed" onClick={handleAddParameter} block style={{ marginTop: 16 }}>
            + 添加参数
          </Button>

          <Divider>评测函数（可选）</Divider>
          <Form.Item name="evaluateFunction">
            <TextArea
              rows={6}
              placeholder={`# 自定义评测的 Python 函数
def evaluate(predictions, references):
    """
    评测预测结果与参考答案
    返回：分数（0 到 1 之间的浮点数）
    """
    correct = sum(1 for p, r in zip(predictions, references) if p == r)
    return correct / len(predictions)`}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Composite Metric Modal */}
      <Modal
        title="创建组合指标"
        open={isCompositeModalOpen}
        onOk={handleSubmitComposite}
        onCancel={() => setIsCompositeModalOpen(false)}
        width={700}
      >
        <Form form={compositeForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="指标名称"
            rules={[{ required: true, message: '请输入指标名称' }]}
          >
            <Input placeholder="例如：综合质量分数" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={2} placeholder="描述如何组合指标" />
          </Form.Item>

          <Divider>选择指标</Divider>
          <Select
            style={{ width: '100%', marginBottom: 16 }}
            placeholder="选择要添加的指标"
            onChange={handleAddMetricToComposite}
            value={undefined}
          >
            {state.metrics
              .filter((m) => m.type === 'single')
              .map((metric) => (
                <Option key={metric.id} value={metric.id}>
                  {metric.name}
                </Option>
              ))}
          </Select>

          {compositeWeights.length > 0 && (
            <Alert
              message="调整权重"
              description="权重之和应等于 1.0"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <List
            bordered
            dataSource={compositeWeights}
            locale={{ emptyText: '未选择指标' }}
            renderItem={(item) => {
              const metric = state.metrics.find((m) => m.id === item.metricId);
              return (
                <List.Item
                  actions={[
                    <Button type="link" danger onClick={() => handleRemoveFromComposite(item.metricId)}>
                      Remove
                    </Button>,
                  ]}
                >
                  <div style={{ width: '100%' }}>
                    <Text strong>{metric?.name}</Text>
                    <div style={{ marginTop: 8 }}>
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={item.weight}
                        onChange={(value) => handleUpdateWeight(item.metricId, value)}
                        tooltip={{ formatter: (value) => `${((value || 0) * 100).toFixed(0)}%` }}
                      />
                      <Text type="secondary">权重：{item.weight.toFixed(2)}</Text>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="指标详情"
        open={!!viewingMetric}
        onCancel={() => setViewingMetric(null)}
        footer={[
          <Button key="close" onClick={() => setViewingMetric(null)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {viewingMetric && (
          <div style={{ marginTop: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">名称：</Text>
              <Title level={4} style={{ marginTop: 4 }}>{viewingMetric.name}</Title>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">类型：</Text>
              <div>
                <Tag color={viewingMetric.type === 'single' ? 'blue' : 'purple'}>
                  {viewingMetric.type === 'single' ? '单一指标' : '组合指标'}
                </Tag>
                <Tag color={viewingMetric.category === 'builtin' ? 'green' : 'orange'}>
                  {viewingMetric.category === 'builtin' ? '内置' : '自定义'}
                </Tag>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">描述：</Text>
              <p>{viewingMetric.description}</p>
            </div>

            {viewingMetric.type === 'single' ? (
              <>
                <Divider>参数</Divider>
                {viewingMetric.parameters.length > 0 ? (
                  <List
                    bordered
                    dataSource={viewingMetric.parameters}
                    renderItem={(param) => (
                      <List.Item>
                        <Space>
                          <Text strong>{param.name}</Text>
                          <Tag>{param.type}</Tag>
                          {param.required && <Tag color="red">必填</Tag>}
                        </Space>
                        {param.description && (
                          <div><Text type="secondary">{param.description}</Text></div>
                        )}
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">未定义参数</Text>
                )}

                {(viewingMetric as SingleMetric).evaluateFunction && (
                  <>
                    <Divider>评测函数</Divider>
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: 12,
                        borderRadius: 4,
                        overflow: 'auto',
                        fontSize: 12,
                      }}
                    >
                      {(viewingMetric as SingleMetric).evaluateFunction}
                    </pre>
                  </>
                )}
              </>
            ) : (
              <>
                <Divider>组合指标</Divider>
                <List
                  bordered
                  dataSource={(viewingMetric as CompositeMetric).metrics}
                  renderItem={(item) => {
                    const metric = state.metrics.find((m) => m.id === item.metricId);
                    return (
                      <List.Item>
                        <Space>
                          <Text strong>{metric?.name}</Text>
                          <Tag color="blue">权重：{item.weight.toFixed(2)}</Tag>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
