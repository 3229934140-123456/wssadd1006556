import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar from '@/components/patient-risk/FilterBar';
import PatientList from '@/components/patient-risk/PatientList';
import PatientDrawer from '@/components/patient-risk/PatientDrawer';
import { patients } from '@/data/patients';
import { Patient } from '@/types';
import { Users, AlertTriangle, Clock, UserCheck } from 'lucide-react';
import StatCard from '@/components/common/StatCard';

const initialFilters = {
  storeId: '',
  overdueDaysMin: '',
  overdueDaysMax: '',
  missedVisitsMin: '',
  remainingAlignersMax: '',
  riskLevel: '',
};

export default function PatientRisk() {
  const [searchParams] = useSearchParams();
  const storeIdFromUrl = searchParams.get('storeId') || '';

  const [filters, setFilters] = useState({
    ...initialFilters,
    storeId: storeIdFromUrl,
  });
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      if (filters.storeId && patient.storeId !== filters.storeId) return false;

      if (
        filters.overdueDaysMin &&
        patient.overdueDays < parseInt(filters.overdueDaysMin)
      )
        return false;

      if (
        filters.overdueDaysMax &&
        patient.overdueDays > parseInt(filters.overdueDaysMax)
      )
        return false;

      if (
        filters.missedVisitsMin &&
        patient.missedVisits < parseInt(filters.missedVisitsMin)
      )
        return false;

      if (
        filters.remainingAlignersMax &&
        patient.remainingAligners > parseInt(filters.remainingAlignersMax)
      )
        return false;

      if (filters.riskLevel && patient.riskLevel !== filters.riskLevel)
        return false;

      return true;
    });
  }, [filters]);

  const handleReset = () => {
    setFilters(initialFilters);
  };

  const highRiskCount = patients.filter((p) => p.riskLevel === 'high').length;
  const mediumRiskCount = patients.filter(
    (p) => p.riskLevel === 'medium'
  ).length;
  const totalOverdue = patients.filter((p) => p.overdueDays > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">患者风险</h2>
          <p className="text-sm text-gray-500 mt-1">
            监控患者佩戴依从性，及时干预高风险病例
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            按门店分组
          </button>
          <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            导出列表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="高风险患者"
          value={highRiskCount}
          unit="人"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          trend="up"
          trendValue={8.3}
        />
        <StatCard
          title="中风险患者"
          value={mediumRiskCount}
          unit="人"
          icon={<Clock className="w-6 h-6" />}
          color="orange"
          trend="down"
          trendValue={-2.1}
        />
        <StatCard
          title="逾期患者"
          value={totalOverdue}
          unit="人"
          icon={<Users className="w-6 h-6" />}
          color="blue"
          trend="up"
          trendValue={3.5}
        />
        <StatCard
          title="低风险患者"
          value={patients.filter((p) => p.riskLevel === 'low').length}
          unit="人"
          icon={<UserCheck className="w-6 h-6" />}
          color="green"
          trend="up"
          trendValue={5.2}
        />
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleReset}
      />

      <PatientList
        patients={filteredPatients}
        onPatientClick={setSelectedPatient}
      />

      <PatientDrawer
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}
