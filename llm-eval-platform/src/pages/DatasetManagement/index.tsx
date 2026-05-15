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
  Upload,
  message,
  Popconfirm,
  Typography,
  Descriptions,
  List,
  Divider,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, UploadOutlined, FileOutlined } from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import type { Dataset, DatasetField } from '../../types';

const { TextArea } = Input;
const { Text } = Typography;

export default function DatasetManagement() {
  const { state, dispatch } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingDataset, setViewingDataset] = useState<Dataset | null>(null);
  const [uploadedData, setUploadedData] = useState<{ data: unknown[]; fileName: string; size: number } | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setUploadedData(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleView = (dataset: Dataset) => {
    setViewingDataset(dataset);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_DATASET', payload: id });
    message.success('Dataset deleted successfully');
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!Array.isArray(data)) {
          message.error('JSON file must contain an array of records');
          return;
        }

        if (data.length === 0) {
          message.error('Dataset cannot be empty');
          return;
        }

        // Infer fields from first record
        const firstRecord = data[0];
        const inferredFields: DatasetField[] = Object.entries(firstRecord).map(([key, value]) => ({
          name: key,
          type: Array.isArray(value) ? 'array' : typeof value as 'string' | 'number' | 'object',
        }));

        setUploadedData({
          data,
          fileName: file.name,
          size: file.size,
        });

        // Auto-fill form
        form.setFieldsValue({
          name: file.name.replace('.json', ''),
          description: `Dataset uploaded from ${file.name}`,
          fields: inferredFields,
        });

        message.success(`Loaded ${data.length} records`);
      } catch (error) {
        message.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    return false; // Prevent default upload
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (!uploadedData) {
        message.error('Please upload a JSON file first');
        return;
      }

      const dataset: Dataset = {
        id: `dataset-${Date.now()}`,
        name: values.name,
        description: values.description,
        fileName: uploadedData.fileName,
        size: uploadedData.size,
        recordCount: uploadedData.data.length,
        fields: values.fields || [],
        sampleData: uploadedData.data.slice(0, 3) as Record<string, unknown>[],
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_DATASET', payload: dataset });
      message.success('Dataset added successfully');
      setIsModalOpen(false);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (name: string) => (
        <Space>
          <FileOutlined />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      render: (count: number) => <Tag color="blue">{count.toLocaleString()}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '字段',
      key: 'fields',
      render: (_: unknown, record: Dataset) => (
        <Space wrap>
          {record.fields.slice(0, 3).map((field) => (
            <Tag key={field.name}>{field.name}</Tag>
          ))}
          {record.fields.length > 3 && (
            <Tag>+{record.fields.length - 3}</Tag>
          )}
        </Space>
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
      render: (_: unknown, record: Dataset) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
            查看
          </Button>
          <Popconfirm
            title="删除数据集"
            description="确定要删除此数据集吗？"
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
            上传数据集
          </Button>
        }
      >
        <Table
          dataSource={state.datasets}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="上传数据集"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={700}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item label="上传 JSON 文件" required>
            <Upload.Dragger
              beforeUpload={handleFileUpload}
              accept=".json"
              maxCount={1}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽 JSON 文件到此处</p>
              <p className="ant-upload-hint">
                支持 JSON 数组格式。每个元素应为具有相同字段的对象。
              </p>
            </Upload.Dragger>
          </Form.Item>

          {uploadedData && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
              <Text type="success">
                <FileOutlined style={{ marginRight: 8 }} />
                已加载：{uploadedData.fileName}（{uploadedData.data.length} 条记录）
              </Text>
            </div>
          )}

          <Form.Item
            name="name"
            label="数据集名称"
            rules={[{ required: true, message: '请输入数据集名称' }]}
          >
            <Input placeholder="例如：MMLU 基准测试, GSM8K 数学" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={2} placeholder="数据集的简要描述" />
          </Form.Item>

          {uploadedData && uploadedData.data.length > 0 && (
            <Form.Item label="字段映射">
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                查看并编辑字段类型以进行评测映射
              </Text>
              <Form.List name="fields" initialValue={Object.keys(uploadedData.data[0] as object).map((key) => ({
                name: key,
                type: typeof (uploadedData.data[0] as Record<string, unknown>)[key] === 'object' 
                  ? Array.isArray((uploadedData.data[0] as Record<string, unknown>)[key]) ? 'array' : 'object'
                  : typeof (uploadedData.data[0] as Record<string, unknown>)[key] as 'string' | 'number',
              }))}>
                {(fields) => (
                  <List
                    size="small"
                    bordered
                    dataSource={fields}
                    renderItem={(field) => (
                      <List.Item>
                        <Space>
                          <Text strong>{form.getFieldValue(['fields', field.name, 'name'])}</Text>
                          <Tag color="blue">{form.getFieldValue(['fields', field.name, 'type'])}</Tag>
                        </Space>
                      </List.Item>
                    )}
                  />
                )}
              </Form.List>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="数据集详情"
        open={!!viewingDataset}
        onCancel={() => setViewingDataset(null)}
        footer={[
          <Button key="close" onClick={() => setViewingDataset(null)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {viewingDataset && (
          <div style={{ marginTop: 20 }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="名称">{viewingDataset.name}</Descriptions.Item>
              <Descriptions.Item label="文件">{viewingDataset.fileName}</Descriptions.Item>
              <Descriptions.Item label="记录数">{viewingDataset.recordCount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="大小">{formatFileSize(viewingDataset.size)}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(viewingDataset.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {viewingDataset.description}
              </Descriptions.Item>
            </Descriptions>

            <Divider>字段</Divider>
            <Space wrap>
              {viewingDataset.fields.map((field) => (
                <Tag key={field.name} color="blue">
                  {field.name}: {field.type}
                </Tag>
              ))}
            </Space>

            <Divider>示例数据</Divider>
            {viewingDataset.sampleData.map((record, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <Text type="secondary">记录 {index + 1}：</Text>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    overflow: 'auto',
                    fontSize: 12,
                  }}
                >
                  {JSON.stringify(record, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
