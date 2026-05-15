import React from 'react';
import { Layout as AntLayout, Menu, Typography, Alert } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DatabaseOutlined,
  LineChartOutlined,
  ExperimentOutlined,
  SettingOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Sider, Content, Header } = AntLayout;
const { Title } = Typography;

const menuItems = [
  {
    key: '/models',
    icon: <DatabaseOutlined />,
    label: <Link to="/models">模型管理</Link>,
  },
  {
    key: '/datasets',
    icon: <DatabaseOutlined />,
    label: <Link to="/datasets">数据集管理</Link>,
  },
  {
    key: '/metrics',
    icon: <LineChartOutlined />,
    label: <Link to="/metrics">评测指标管理</Link>,
  },
  {
    key: '/tasks',
    icon: <ExperimentOutlined />,
    label: <Link to="/tasks">评测任务管理</Link>,
  },
  {
    key: '/results',
    icon: <BarChartOutlined />,
    label: <Link to="/results">评测结果</Link>,
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <AntLayout style={{ minHeight: '100vh', height: '100vh' }}>
      <Sider theme="light" width={250} style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            <SettingOutlined style={{ marginRight: 8 }} />
            大模型评测平台
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0, height: 'calc(100vh - 72px)', overflow: 'auto' }}
        />
      </Sider>
      <AntLayout style={{ height: '100vh' }}>
        <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexShrink: 0 }}>
          <Title level={3} style={{ margin: 0, lineHeight: '64px' }}>
            {menuItems.find((item) => item.key === location.pathname)?.label.props.children || '仪表盘'}
          </Title>
        </Header>
        <Content style={{ margin: 0, padding: 0, background: '#f0f2f5', overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Alert
            message="仅作 Demo 演示"
            description="本系统为演示版本，所有数据均为模拟数据，仅供功能展示使用。"
            type="warning"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ margin: '8px 16px 0 16px', flexShrink: 0 }}
          />
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
