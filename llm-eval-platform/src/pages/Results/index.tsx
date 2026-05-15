import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Select,
  Typography,
  Row,
  Col,
  Statistic,
  Empty,
  Tabs,
  List,
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import { BarChartOutlined, RadarChartOutlined, LineChartOutlined, TrophyOutlined } from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import type { EvaluationResult, ModelResult } from '../../types';

const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

export default function Results() {
  const { state } = useAppContext();
  // Default to the multi-dimensional evaluation task (task-multidim-all-vendors)
  const [selectedResult, setSelectedResult] = useState<EvaluationResult | null>(
    state.results.find((r) => r.taskId === 'task-multidim-all-vendors') || state.results[0] || null
  );

  // Prepare data for bar chart
  const getBarChartData = () => {
    if (!selectedResult) return [];
    
    const metrics = selectedResult.modelResults[0]?.metrics.map((m) => m.metricName) || [];
    
    return metrics.map((metricName) => {
      const dataPoint: Record<string, string | number> = { name: metricName };
      selectedResult.modelResults.forEach((modelResult) => {
        const metric = modelResult.metrics.find((m) => m.metricName === metricName);
        dataPoint[modelResult.modelName] = metric ? Math.round(metric.score * 100) : 0;
      });
      return dataPoint;
    });
  };

  // Prepare data for radar chart
  const getRadarChartData = () => {
    if (!selectedResult) return [];
    
    const metrics = selectedResult.modelResults[0]?.metrics.map((m) => m.metricName) || [];
    
    return metrics.map((metricName) => {
      const dataPoint: Record<string, string | number> = { metric: metricName };
      selectedResult.modelResults.forEach((modelResult) => {
        const metric = modelResult.metrics.find((m) => m.metricName === metricName);
        dataPoint[modelResult.modelName] = metric ? Math.round(metric.score * 100) : 0;
      });
      return dataPoint;
    });
  };

  // Prepare data for individual metric comparison (for Hallucination task)
  const getIndividualMetricData = () => {
    if (!selectedResult) return [];
    
    // Group by model for individual metric scores
    return selectedResult.modelResults.map((model) => ({
      name: model.modelName,
      'ROUGE-L': model.metrics.find((m) => m.metricId === 'metric-3')?.score || 0,
      'BERTScore': model.metrics.find((m) => m.metricId === 'metric-bertscore')?.score || 0,
      'Hallucination Score': model.metrics.find((m) => m.metricId === 'metric-hallucination')?.score || 0,
      '综合加权': model.metrics.find((m) => m.metricId === 'metric-multidim')?.score || 0,
    }));
  };

  // Extended colors for charts (more models)
  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2',
    '#eb2f96', '#fadb14', '#a0d911', '#52c41a', '#2f54eb', '#fa541c'
  ];

  // Get best performing model
  const getBestModel = () => {
    if (!selectedResult) return null;
    return selectedResult.modelResults.reduce((best, current) =>
      current.overallScore > best.overallScore ? current : best
    );
  };

  const columns = [
    {
      title: '模型',
      dataIndex: 'modelName',
      key: 'modelName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    ...((selectedResult?.modelResults[0]?.metrics.map((m) => ({
      title: m.metricName,
      key: m.metricId,
      render: (_: unknown, record: ModelResult) => {
        const metric = record.metrics.find((metric) => metric.metricId === m.metricId);
        const score = metric ? metric.score : 0;
        return (
          <Tag color={score >= 0.8 ? 'success' : score >= 0.6 ? 'warning' : 'error'}>
            {(score * 100).toFixed(1)}%
          </Tag>
        );
      },
    })) || []) as { title: string; key: string; render: (_: unknown, record: ModelResult) => React.ReactElement }[]),
    {
      title: '综合得分',
      key: 'overall',
      render: (_: unknown, record: ModelResult) => (
        <Tag color="blue" style={{ fontSize: 14, padding: '4px 8px' }}>
          {(record.overallScore * 100).toFixed(1)}%
        </Tag>
      ),
    },
  ];

  const bestModel = getBestModel();
  const barData = getBarChartData();
  const radarData = getRadarChartData();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card
        style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}
        bodyStyle={{ flex: 1, overflow: 'auto', padding: '16px' }}
        extra={
          <Select
            style={{ width: 300 }}
            placeholder="选择评测结果"
            value={selectedResult?.taskId}
            onChange={(value) => {
              const result = state.results.find((r) => r.taskId === value);
              setSelectedResult(result || null);
            }}
          >
            {state.results.map((result) => (
              <Option key={result.taskId} value={result.taskId}>
                {result.taskName}
              </Option>
            ))}
          </Select>
        }
      >
        {!selectedResult ? (
          <Empty description="暂无评测结果" />
        ) : (
          <>
            {/* Summary Statistics */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="评测模型数"
                    value={selectedResult.modelResults.length}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="使用指标数"
                    value={selectedResult.modelResults[0]?.metrics.length || 0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="数据集"
                    value={selectedResult.datasetName}
                    valueStyle={{ fontSize: 16 }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="最佳模型"
                    value={bestModel?.modelName || '-'}
                    valueStyle={{ fontSize: 16, color: '#52c41a' }}
                    prefix={<TrophyOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Rankings */}
            <Card title="模型排名" style={{ marginBottom: 24 }}>
              <List
                dataSource={[...selectedResult.modelResults].sort((a, b) => b.overallScore - a.overallScore)}
                renderItem={(item, index) => (
                  <List.Item>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <div style={{ width: 40, textAlign: 'center' }}>
                        {index === 0 ? (
                          <TrophyOutlined style={{ color: '#faad14', fontSize: 24 }} />
                        ) : (
                          <Text strong style={{ fontSize: 18 }}>#{index + 1}</Text>
                        )}
                      </div>
                      <div style={{ flex: 1, marginLeft: 16 }}>
                        <Text strong style={{ fontSize: 16 }}>{item.modelName}</Text>
                        <div style={{ marginTop: 4 }}>
                          {item.metrics.map((metric) => (
                            <Tag key={metric.metricId}>
                              {metric.metricName}: {(metric.score * 100).toFixed(1)}%
                            </Tag>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Tag color={item.overallScore >= 0.8 ? 'success' : item.overallScore >= 0.6 ? 'warning' : 'error'} style={{ fontSize: 16, padding: '4px 12px' }}>
                          {(item.overallScore * 100).toFixed(1)}%
                        </Tag>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            {/* Charts */}
            <Tabs defaultActiveKey="bar">
              <TabPane
                tab={<span><BarChartOutlined /> 指标对比柱状图</span>}
                key="bar"
              >
                <Row gutter={24}>
                  <Col span={24}>
                    <div style={{ height: 450 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12 }}
                            angle={-30}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          {selectedResult.modelResults.map((model, index) => (
                            <Bar
                              key={model.modelId}
                              dataKey={model.modelName}
                              fill={colors[index % colors.length]}
                              radius={[4, 4, 0, 0]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                </Row>
                <Row gutter={24} style={{ marginTop: 24 }}>
                  <Col span={24}>
                    <Card title="单项指标对比" size="small">
                      <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={getIndividualMetricData()} 
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                            <Tooltip formatter={(value) => `${((value as number) * 100).toFixed(1)}%`} />
                            <Legend />
                            <Bar dataKey="ROUGE-L" fill="#1890ff" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="BERTScore" fill="#52c41a" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="Hallucination Score" fill="#faad14" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="综合加权" fill="#722ed1" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              <TabPane
                tab={<span><RadarChartOutlined /> 能力雷达图</span>}
                key="radar"
              >
                <Row gutter={24}>
                  <Col span={16}>
                    <div style={{ height: 550 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} margin={{ top: 40, right: 80, left: 80, bottom: 40 }}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 14, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 12 }} />
                          {selectedResult.modelResults.slice(0, 6).map((model, index) => (
                            <Radar
                              key={model.modelId}
                              name={model.modelName}
                              dataKey={model.modelName}
                              stroke={colors[index % colors.length]}
                              fill={colors[index % colors.length]}
                              fillOpacity={0.15}
                              strokeWidth={2}
                            />
                          ))}
                          <Legend 
                            layout="vertical" 
                            align="right" 
                            verticalAlign="middle"
                            wrapperStyle={{ fontSize: 12, paddingLeft: '20px' }}
                          />
                          <Tooltip formatter={(value) => `${value}%`} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                  <Col span={8}>
                    <Card title="雷达图说明" size="small" style={{ marginTop: 40 }}>
                      <Text type="secondary">
                        雷达图展示了各模型在多个评测维度上的综合能力表现。
                        覆盖面积越大，表示模型综合性能越强。
                      </Text>
                      <div style={{ marginTop: 16 }}>
                        <Text strong>当前评测指标：</Text>
                        <div style={{ marginTop: 8 }}>
                          {selectedResult.modelResults[0]?.metrics.map((m) => (
                            <Tag key={m.metricId} style={{ marginBottom: 4 }}>{m.metricName}</Tag>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              <TabPane
                tab={<span><LineChartOutlined /> 趋势对比图</span>}
                key="line"
              >
                <div style={{ height: 450 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        angle={-30}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      {selectedResult.modelResults.map((model, index) => (
                        <Line
                          key={model.modelId}
                          type="monotone"
                          dataKey={model.modelName}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={{ r: 5, strokeWidth: 2 }}
                          activeDot={{ r: 7 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Row gutter={24} style={{ marginTop: 24 }}>
                  {['ROUGE-L', 'BERTScore', 'Hallucination Score', '综合加权'].map((metricName, idx) => (
                    <Col span={6} key={metricName}>
                      <Card size="small" title={metricName}>
                        <div style={{ height: 200 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                              data={getIndividualMetricData().map(d => ({ name: d.name, score: d[metricName as keyof typeof d] as number * 100 }))}
                              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="name" hide />
                              <YAxis domain={[0, 100]} hide />
                              <Tooltip formatter={(value) => `${value}%`} />
                              <Line 
                                type="monotone" 
                                dataKey="score" 
                                stroke={colors[idx]} 
                                strokeWidth={2}
                                dot={{ r: 3 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </TabPane>
            </Tabs>

            {/* Detailed Table */}
            <Card title="详细结果" style={{ marginTop: 24 }}>
              <Table
                dataSource={selectedResult.modelResults}
                columns={columns}
                rowKey="modelId"
                pagination={false}
              />
            </Card>
          </>
        )}
      </Card>
    </div>
  );
}
