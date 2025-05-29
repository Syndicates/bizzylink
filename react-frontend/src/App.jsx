import { AdminHoverPanel } from './components/AdminHoverPanel';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          {/* ... existing routes ... */}
        </Routes>
      </div>
      <AdminHoverPanel />
    </div>
  );
}

export default App; 