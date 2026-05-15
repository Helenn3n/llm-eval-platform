import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { AppState, AppAction } from '../types';
import { mockModels, mockDatasets, mockMetrics, mockTasks, mockResults } from '../mock/data';

const initialState: AppState = {
  models: mockModels,
  datasets: mockDatasets,
  metrics: mockMetrics,
  tasks: mockTasks,
  results: mockResults,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_MODEL':
      return { ...state, models: [...state.models, action.payload] };
    case 'UPDATE_MODEL':
      return {
        ...state,
        models: state.models.map((m) => (m.id === action.payload.id ? action.payload : m)),
      };
    case 'DELETE_MODEL':
      return { ...state, models: state.models.filter((m) => m.id !== action.payload) };
    case 'ADD_DATASET':
      return { ...state, datasets: [...state.datasets, action.payload] };
    case 'DELETE_DATASET':
      return { ...state, datasets: state.datasets.filter((d) => d.id !== action.payload) };
    case 'ADD_METRIC':
      return { ...state, metrics: [...state.metrics, action.payload] };
    case 'DELETE_METRIC':
      return { ...state, metrics: state.metrics.filter((m) => m.id !== action.payload) };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'ADD_RESULT':
      return { ...state, results: [...state.results, action.payload] };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
