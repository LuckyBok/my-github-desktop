/**
 * useSectionToggle Hook
 * 
 * A custom hook for managing toggle state between different sections
 */
import { useReducer } from 'react';

export type SectionToggleAction<T> = 
  | { type: 'SET_ACTIVE_SECTION'; payload: T }
  | { type: 'HIDE_ALL' };

export interface SectionToggleState<T> {
  activeSection: T | null;
}

export function createSectionToggleReducer<T>() {
  return function reducer(
    state: SectionToggleState<T>, 
    action: SectionToggleAction<T>
  ): SectionToggleState<T> {
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
}

export function useSectionToggle<T>(defaultSection?: T) {
  const initialState: SectionToggleState<T> = {
    activeSection: defaultSection || null
  };
  
  const toggleReducer = createSectionToggleReducer<T>();
  const [state, dispatch] = useReducer(toggleReducer, initialState);
  
  const setActiveSection = (section: T) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: section });
  };
  
  const hideAll = () => {
    dispatch({ type: 'HIDE_ALL' });
  };
  
  return {
    activeSection: state.activeSection,
    setActiveSection,
    hideAll
  };
}

export default useSectionToggle; 