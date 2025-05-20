import { DashboardState, DashboardAction } from './types';

/**
 * Reducer function for managing dashboard state
 */
export const dashboardReducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case 'SET_ACTIVE_SECTION':
      return {
        ...state,
        activeSection: action.payload
      };
    case 'HIDE_ALL':
      return {
        ...state,
        activeSection: null
      };
    default:
      return state;
  }
};

/**
 * Initial dashboard state with default tab
 */
export const initialDashboardState: DashboardState = {
  activeSection: 'fileUploader'
}; 