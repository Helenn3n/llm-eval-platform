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
  Radio,
  message,
  Popconfirm,
  Descriptions,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import type { Model, LocalModel, APIModel } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

export default function ModelManagement() {
  const { state, dispatch } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [viewingModel, setViewingModel] = useState<Model | null>(null);
  const [form] = Form.useForm();
  const [modelType, setModelType] = useState<'local' | 'api'>('api');

  const handleAdd = () => {
    setEditingModel(null);
    setModelType('api');
    form.resetFields();
    form.setFieldsValue({ type: 'api' });
    setIsModalOpen(true);
  };

  const handleEdit = (model: Model) => {
    setEditingModel(model);
    setModelType(model.type);
    form.setFieldsValue({
      ...model,
      apiKey: model.type === 'api' ? '' : undefined, // Don't show actual API key
    });
    setIsModalOpen(true);
  };

  const handleView = (model: Model) => {
    setViewingModel(model);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_MODEL', payload: id });
    message.success('Model deleted successfully');
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const modelData: Model = {
        ...values,
        id: editingModel?.id || `model-${Date.now()}`,
        createdAt: editingModel?.createdAt || new Date().toISOString(),
      };

      if (editingModel) {
        dispatch({ type: 'UPDATE_MODEL', payload: modelData });
        message.success('Model updated successfully');
      } else {
        dispatch({ type: 'ADD_MODEL', payload: modelData });
        message.success('Model added successfully');
      }
      setIsModalOpen(false);
    });
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'local' ? 'blue' : 'green'}>
          {type === 'local' ? '本地' : 'API'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
    },
    {
      title: '提供商/路径',
      key: 'provider',
      width: 150,
      ellipsis: true,
      render: (_: unknown, record: Model) => {
        if (record.type === 'api') {
          const providerMap: Record<string, string> = {
            openai: 'OpenAI',
            anthropic: 'Anthropic',
            google: 'Google',
            azure: 'Azure',
            qwen: '阿里通义',
            zhipu: '智谱AI',
            moonshot: '月之暗面',
            minimax: 'MiniMax',
            step: '阶跃星辰',
            meta: 'Meta',
            custom: '自定义',
          };
          return <Tag>{providerMap[(record as APIModel).provider] || (record as APIModel).provider}</Tag>;
        }
        return <span style={{ fontSize: '12px' }}>{(record as LocalModel).path}</span>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: Model) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
            查看
          </Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="删除模型"
            description="确定要删除此模型吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              删除
            </Button>
          </Popconfirm>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加模型
          </Button>
        }
      >
        <Table
          dataSource={state.models}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000, y: 'calc(100vh - 280px)' }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingModel ? '编辑模型' : '添加模型'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="例如：GPT-4, Llama 2 7B" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={2} placeholder="模型的简要描述" />
          </Form.Item>

          <Form.Item
            name="type"
            label="模型类型"
            rules={[{ required: true }]}
          >
            <Radio.Group
              onChange={(e) => setModelType(e.target.value)}
              disabled={!!editingModel}
            >
              <Radio.Button value="api">API 模型</Radio.Button>
              <Radio.Button value="local">本地模型</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {modelType === 'api' ? (
            <>
              <Form.Item
                name="provider"
                label="提供商"
                rules={[{ required: true, message: '请选择提供商' }]}
              >
                <Select placeholder="选择提供商">
                  <Option value="openai">OpenAI</Option>
                  <Option value="anthropic">Anthropic</Option>
                  <Option value="google">Google</Option>
                  <Option value="azure">Azure OpenAI</Option>
                  <Option value="qwen">阿里通义千问</Option>
                  <Option value="zhipu">智谱 AI</Option>
                  <Option value="moonshot">月之暗面 Kimi</Option>
                  <Option value="minimax">MiniMax</Option>
                  <Option value="step">阶跃星辰</Option>
                  <Option value="meta">Meta</Option>
                  <Option value="custom">自定义</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="modelName"
                label="模型名称/ID"
                rules={[{ required: true, message: '请输入模型名称/ID' }]}
              >
                <Input placeholder="例如：gpt-4, claude-3-opus-20240229" />
              </Form.Item>

              <Form.Item
                name="apiKey"
                label="API Key"
                rules={[{ required: !editingModel, message: '请输入 API Key' }]}
              >
                <Input.Password placeholder={editingModel ? '输入新密钥以更新' : '输入 API Key'} />
              </Form.Item>

              <Form.Item name="endpoint" label="自定义端点（可选）">
                <Input placeholder="https://api.example.com/v1" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="path"
                label="模型路径"
                rules={[{ required: true, message: '请输入模型路径' }]}
              >
                <Input placeholder="/path/to/model 或 HuggingFace 模型 ID" />
              </Form.Item>

              <Form.Item
                name="device"
                label="设备"
                rules={[{ required: true }]}
                initialValue="auto"
              >
                <Select>
                  <Option value="auto">自动</Option>
                  <Option value="cpu">CPU</Option>
                  <Option value="cuda">CUDA (GPU)</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="模型详情"
        open={!!viewingModel}
        onCancel={() => setViewingModel(null)}
        footer={[
          <Button key="close" onClick={() => setViewingModel(null)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {viewingModel && (
          <Descriptions bordered column={1} style={{ marginTop: 20 }}>
            <Descriptions.Item label="名称">{viewingModel.name}</Descriptions.Item>
            <Descriptions.Item label="描述">{viewingModel.description}</Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag color={viewingModel.type === 'local' ? 'blue' : 'green'}>
                {viewingModel.type === 'local' ? '本地' : 'API'}
              </Tag>
            </Descriptions.Item>
            {viewingModel.type === 'api' ? (
              <>
                <Descriptions.Item label="提供商">
                  {(viewingModel as APIModel).provider}
                </Descriptions.Item>
                <Descriptions.Item label="模型名称">
                  {(viewingModel as APIModel).modelName}
                </Descriptions.Item>
                {(viewingModel as APIModel).endpoint && (
                  <Descriptions.Item label="端点">
                    {(viewingModel as APIModel).endpoint}
                  </Descriptions.Item>
                )}
              </>
            ) : (
              <>
                <Descriptions.Item label="路径">
                  {(viewingModel as LocalModel).path}
                </Descriptions.Item>
                <Descriptions.Item label="设备">
                  {(viewingModel as LocalModel).device}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="创建时间">
              {new Date(viewingModel.createdAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
