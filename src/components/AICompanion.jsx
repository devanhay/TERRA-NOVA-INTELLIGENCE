import React from 'react';
import TerraDashboard from './ai/TerraDashboard';

/**
 * AICompanion wrapper replacing the old primitive chat
 * Now mounts the full Terra AI Operating System Dashboard
 */
const AICompanion = ({ projectId, appContext, onLayoutModeChange }) => {
  return (
    <div style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
      <TerraDashboard 
        projectId={projectId} 
        appContext={appContext} 
        onLayoutModeChange={onLayoutModeChange}
      />
    </div>
  );
};

export default AICompanion;