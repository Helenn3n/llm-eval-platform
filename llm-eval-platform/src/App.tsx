import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import ModelManagement from './pages/ModelManagement';
import DatasetManagement from './pages/DatasetManagement';
import MetricManagement from './pages/MetricManagement';
import TaskManagement from './pages/TaskManagement';
import Results from './pages/Results';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AppProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/models" element={<ModelManagement />} />
              <Route path="/datasets" element={<DatasetManagement />} />
              <Route path="/metrics" element={<MetricManagement />} />
              <Route path="/tasks" element={<TaskManagement />} />
              <Route path="/results" element={<Results />} />
              <Route path="/" element={<Navigate to="/models" replace />} />
            </Routes>
          </Layout>
        </Router>
      </AppProvider>
    </ConfigProvider>
  );
}

export default App;
