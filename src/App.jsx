import React, { useState } from 'react';
import AuthWrapper, { useApp } from './components/AuthWrapper';
import IngestionCenter from './components/IngestionCenter';
import HeatmapMap from './components/HeatmapMap';
import PriorityQueue from './components/PriorityQueue';
import AdminDashboard from './components/AdminDashboard';
import ImpactDashboard from './components/ImpactDashboard';
import DataOrganizer from './components/DataOrganizer';
import ManageTasks from './components/ManageTasks';
import ManageVolunteers from './components/ManageVolunteers';
import AssignTaskModal from './components/AssignTaskModal';
import ProfileSidebar from './components/ProfileSidebar';

function AppContent() {
  const { isAdmin, user, profileSidebarOpen, setProfileSidebarOpen } = useApp();
  const [activeTab, setActiveTab] = useState('ingest');
  const [assignModalTaskId, setAssignModalTaskId] = useState(null);

  const openAssignModal = (taskId) => setAssignModalTaskId(taskId);
  const closeAssignModal = () => setAssignModalTaskId(null);
  const refreshTasks = () => { /* optionally refresh */ };

  const renderContent = () => {
    switch(activeTab) {
      case 'ingest': return <IngestionCenter />;
      case 'heatmap': return <HeatmapMap />;
      case 'priority': return <PriorityQueue />;
      case 'admin': return isAdmin ? <AdminDashboard /> : <div className="text-center text-white p-10">Access Denied</div>;
      case 'impact': return <ImpactDashboard />;
      case 'organizer': return <DataOrganizer />;
      case 'manageTasks': return isAdmin ? <ManageTasks openAssignModal={openAssignModal} /> : <div>Access Denied</div>;
      case 'manageVolunteers': return isAdmin ? <ManageVolunteers /> : <div>Access Denied</div>;
      default: return <IngestionCenter />;
    }
  };

  return (
    <>
      <ProfileSidebar 
        isOpen={profileSidebarOpen} 
        onClose={() => setProfileSidebarOpen(false)} 
        user={user} 
        isAdmin={isAdmin} 
        setActiveTab={setActiveTab} 
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab buttons remain same as before, but we also show new tabs for admin */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/20 pb-2">
          {/* existing buttons */}
          <button onClick={() => setActiveTab('ingest')} className={`px-5 py-2.5 rounded-full font-medium ${activeTab === 'ingest' ? 'bg-white/20 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>Ingest Data</button>
          <button onClick={() => setActiveTab('heatmap')} className={`px-5 py-2.5 rounded-full font-medium ${activeTab === 'heatmap' ? 'bg-white/20 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>Heatmap</button>
          <button onClick={() => setActiveTab('priority')} className={`px-5 py-2.5 rounded-full font-medium ${activeTab === 'priority' ? 'bg-white/20 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>Priority Queue</button>
          <button onClick={() => setActiveTab('impact')} className={`px-5 py-2.5 rounded-full font-medium ${activeTab === 'impact' ? 'bg-white/20 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>Impact Dashboard</button>
          <button onClick={() => setActiveTab('organizer')} className={`px-5 py-2.5 rounded-full font-medium ${activeTab === 'organizer' ? 'bg-white/20 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>Data Organizer</button>
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('admin')} className={`px-5 py-2.5 rounded-full font-medium ${activeTab === 'admin' ? 'bg-white/20 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>Admin Panel</button>
              <button onClick={() => setActiveTab('manageTasks')} className={`px-5 py-2.5 rounded-full font-medium ${activeTab === 'manageTasks' ? 'bg-white/20 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>Manage Tasks</button>
              <button onClick={() => setActiveTab('manageVolunteers')} className={`px-5 py-2.5 rounded-full font-medium ${activeTab === 'manageVolunteers' ? 'bg-white/20 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>Manage Volunteers</button>
            </>
          )}
        </div>
        <div className="animate-fadeIn">
          {renderContent()}
        </div>
      </div>
      {assignModalTaskId && <AssignTaskModal taskId={assignModalTaskId} onClose={closeAssignModal} onAssigned={refreshTasks} />}
    </>
  );
}

function App() {
  return (
    <AuthWrapper>
      <AppContent />
    </AuthWrapper>
  );
}

export default App;