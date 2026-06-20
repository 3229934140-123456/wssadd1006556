import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@/components/layout/Header';
import StoreOverview from '@/pages/StoreOverview';
import PatientRisk from '@/pages/PatientRisk';
import BatchTracking from '@/pages/BatchTracking';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-[1440px] mx-auto px-6 py-6">
          <Routes>
            <Route path="/" element={<StoreOverview />} />
            <Route path="/patients" element={<PatientRisk />} />
            <Route path="/batches" element={<BatchTracking />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
