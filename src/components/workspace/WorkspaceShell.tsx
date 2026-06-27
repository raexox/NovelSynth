import React, { useState } from 'react';
import { useStore } from '../../store';
import { Header } from '../header/Header';
import { LeftSidebar } from '../left-sidebar/LeftSidebar';
import { Editor } from '../Editor';
import { OutlineStudio } from '../outline/OutlineStudio';
import { RightSidebar } from '../right-sidebar/RightSidebar';
import { ReferenceLibraryModal } from '../reference-library/ReferenceLibraryModal';
import { BookSettingsModal } from '../modals/BookSettingsModal';

export const WorkspaceShell: React.FC = () => {
  const { isLeftSidebarOpen, isRightSidebarOpen, viewMode } = useStore();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="app-container">
      {/* Top Application Header */}
      <Header onOpenSettings={() => setShowSettings(true)} />

      {/* Main Panel Body */}
      <main className="app-body">
        {/* Left Navigator Panel */}
        <div className={`sidebar ${isLeftSidebarOpen ? '' : 'collapsed'}`}>
          <LeftSidebar />
        </div>

        {/* Central Writing Canvas / Outline Studio */}
        {viewMode === 'outline' ? (
          <OutlineStudio />
        ) : (
          <Editor />
        )}

        {/* Right AI Assistant Panel */}
        <div className={`sidebar right-sidebar ${isRightSidebarOpen ? '' : 'collapsed'}`}>
          <RightSidebar />
        </div>
      </main>

      {/* Worldbuilding & Continuity Engine Modal */}
      <ReferenceLibraryModal />

      {/* Book Settings Modal */}
      <BookSettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};
