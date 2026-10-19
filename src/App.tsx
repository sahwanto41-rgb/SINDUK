import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { EmployeeModal } from './components/EmployeeModal';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { ArchiveModal } from './components/ArchiveModal';
import { OfficialPrintModal } from './components/OfficialPrintModal';

// Views
import { DashboardView } from './views/DashboardView';
import { DataPegawaiView } from './views/DataPegawaiView';
import { DukView } from './views/DukView';
import { RiwayatKepegawaianView } from './views/RiwayatKepegawaianView';
import { DokumenKepegawaianView } from './views/DokumenKepegawaianView';
import { ImporEksporView } from './views/ImporEksporView';
import { ArsipPeriodeView } from './views/ArsipPeriodeView';
import { LaporanView } from './views/LaporanView';
import { PenggunaView } from './views/PenggunaView';
import { PengaturanView } from './views/PengaturanView';

import {
  Employee,
  DukPeriod,
  EmploymentHistory,
  EmployeeDocument,
  AuditLog,
  AppSettings,
  DukItem,
} from './types';
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  archiveEmployee,
  deleteEmployeePermanently,
  getDukPeriods,
  addDukPeriod,
  updateDukPeriodStatus,
  getEmploymentHistory,
  getEmployeeDocuments,
  addEmployeeDocument,
  deleteEmployeeDocument,
  getAuditLogs,
  getAppSettings,
  saveAppSettings,
} from './services/firestoreService';
import { sortPnsDuk } from './utils/dukRanking';

import { LoginPage } from './components/LoginPage';

const MainApp: React.FC = () => {
  const { userProfile, user, loading } = useAuth();

  // Navigation & Layout
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Firestore Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [periods, setPeriods] = useState<DukPeriod[]>([]);
  const [histories, setHistories] = useState<EmploymentHistory[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEmpForEdit, setSelectedEmpForEdit] = useState<Employee | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEmpForDetail, setSelectedEmpForDetail] = useState<Employee | null>(null);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [selectedEmpForArchive, setSelectedEmpForArchive] = useState<Employee | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printItems, setPrintItems] = useState<DukItem[]>([]);
  const [printTitle, setPrintTitle] = useState('DAFTAR URUT KEPANGKATAN');
  const [printPeriode, setPrintPeriode] = useState('Periode 1 Januari 2026');

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load public app settings on boot
  useEffect(() => {
    getAppSettings().then(setSettings).catch(console.warn);
  }, []);

  // Load protected data from Firestore ONLY when user is authenticated
  const loadAllData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [empList, periodList, histList, docList, logList, appSetting] =
        await Promise.all([
          getEmployees(),
          getDukPeriods(),
          getEmploymentHistory(),
          getEmployeeDocuments(),
          getAuditLogs(),
          getAppSettings(),
        ]);

      setEmployees(empList);
      setPeriods(periodList);
      setHistories(histList);
      setDocuments(docList);
      setAuditLogs(logList);
      setSettings(appSetting);
    } catch (err) {
      console.error('Error loading Firestore data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // Active period
  const activePeriod = periods.find((p) => p.isAktif) || periods[0] || null;

  // Handlers for Employee
  const handleSaveEmployee = async (emp: Employee, alasanPerubahan: string) => {
    const currentUser = {
      email: userProfile?.email || 'admin@sdnlanas1.sch.id',
      displayName: userProfile?.displayName || 'Admin',
      uid: userProfile?.uid || 'user-1',
    };

    if (selectedEmpForEdit) {
      await updateEmployee(emp.id, emp, selectedEmpForEdit, currentUser, alasanPerubahan);
    } else {
      await addEmployee(emp, currentUser);
    }
    await loadAllData();
  };

  const handleArchiveConfirm = async (
    id: string,
    nama: string,
    status: 'MUTASI_KELUAR' | 'PENSIUN' | 'CUTI' | 'TIDAK_AKTIF',
    alasan: string
  ) => {
    const currentUser = {
      email: userProfile?.email || 'admin@sdnlanas1.sch.id',
      displayName: userProfile?.displayName || 'Admin',
      uid: userProfile?.uid || 'user-1',
    };
    await archiveEmployee(id, nama, status, alasan, currentUser);
    await loadAllData();
  };

  const handleDeleteEmployee = async (id: string, nama: string) => {
    const currentUser = {
      email: userProfile?.email || 'admin@sdnlanas1.sch.id',
      displayName: userProfile?.displayName || 'Admin',
      uid: userProfile?.uid || 'user-1',
    };
    await deleteEmployeePermanently(id, nama, currentUser);
    await loadAllData();
  };

  // Handlers for Periods
  const handleCreatePeriod = async (newPeriod: DukPeriod) => {
    await addDukPeriod(newPeriod);
    await loadAllData();
  };

  const handleUpdatePeriodStatus = async (
    periodId: string,
    newStatus: 'DRAFT' | 'DIPERIKSA' | 'DISAHKAN',
    pengesahName: string = settings?.namaKepalaSekolah || 'Sahwanto, S.Pd.',
    nip: string = settings?.nipKepalaSekolah || '19680512 199303 1 008'
  ) => {
    const currentUser = {
      email: userProfile?.email || 'admin@sdnlanas1.sch.id',
      displayName: userProfile?.displayName || 'Sahwanto, S.Pd.',
      uid: userProfile?.uid || 'user-ks',
    };
    await updateDukPeriodStatus(periodId, newStatus, currentUser, employees, pengesahName, nip);
    await loadAllData();
  };

  // Handlers for Settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    await saveAppSettings(newSettings, userProfile?.displayName || 'Admin');
    setSettings(newSettings);
  };

  // Handler for Excel Bulk Import
  const handleSaveImportedEmployees = async (importedList: Employee[]) => {
    const currentUser = {
      email: userProfile?.email || 'admin@sdnlanas1.sch.id',
      displayName: userProfile?.displayName || 'Operator',
      uid: userProfile?.uid || 'usr-op',
    };

    for (const emp of importedList) {
      const existing = employees.find((x) => x.nip && x.nip !== '-' && x.nip === emp.nip);
      if (existing) {
        await updateEmployee(existing.id, emp, existing, currentUser, 'Impor pembaruan massal Excel');
      } else {
        await addEmployee(emp, currentUser);
      }
    }
    await loadAllData();
  };

  // Handler for JSON Restore
  const handleRestoreBackup = async (data: {
    employees: Employee[];
    settings?: AppSettings;
    periods?: DukPeriod[];
  }) => {
    if (data.settings) {
      await saveAppSettings(data.settings, 'Pemulihan Cadangan');
    }
    if (data.employees) {
      const currentUser = {
        email: userProfile?.email || 'admin@sdnlanas1.sch.id',
        displayName: 'Pemulihan Cadangan',
        uid: 'sys',
      };
      for (const emp of data.employees) {
        await addEmployee(emp, currentUser);
      }
    }
    await loadAllData();
  };

  // Trigger Print Modal
  const handleOpenPrint = (
    items: DukItem[] = sortPnsDuk(employees),
    title: string = 'DAFTAR URUT KEPANGKATAN PEGAWAI NEGERI SIPIL',
    periode: string = activePeriod?.namaPeriode || 'Periode 1 Januari 2026'
  ) => {
    setPrintItems(items);
    setPrintTitle(title);
    setPrintPeriode(periode);
    setIsPrintModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-300">Memeriksa Sesi Autentikasi SI-DUK SMART SDN Lanas 1...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage settings={settings} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Header Bar */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        setMobileOpen={setMobileOpen}
        activePeriod={activePeriod}
        settings={settings}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content View Area */}
      <main
        className={`flex-1 p-4 lg:p-6 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-68'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              employees={employees}
              activePeriod={activePeriod}
              auditLogs={auditLogs}
              settings={settings}
              setActiveTab={setActiveTab}
              onAddEmployee={() => {
                setSelectedEmpForEdit(null);
                setIsEmployeeModalOpen(true);
              }}
              onOpenPrint={() => handleOpenPrint()}
            />
          )}

          {activeTab === 'data-pegawai' && (
            <DataPegawaiView
              employees={employees}
              onAdd={() => {
                setSelectedEmpForEdit(null);
                setIsEmployeeModalOpen(true);
              }}
              onEdit={(emp) => {
                setSelectedEmpForEdit(emp);
                setIsEmployeeModalOpen(true);
              }}
              onDetail={(emp) => {
                setSelectedEmpForDetail(emp);
                setIsDetailModalOpen(true);
              }}
              onArchive={(emp) => {
                setSelectedEmpForArchive(emp);
                setIsArchiveModalOpen(true);
              }}
              onDelete={handleDeleteEmployee}
              onOpenImport={() => setActiveTab('impor-ekspor')}
            />
          )}

          {activeTab === 'duk' && (
            <DukView
              employees={employees}
              activePeriod={activePeriod}
              settings={settings}
              onDetail={(emp) => {
                setSelectedEmpForDetail(emp);
                setIsDetailModalOpen(true);
              }}
              onOpenPrint={(items, title) => handleOpenPrint(items, title)}
            />
          )}

          {activeTab === 'riwayat' && (
            <RiwayatKepegawaianView histories={histories} />
          )}

          {activeTab === 'dokumen' && (
            <DokumenKepegawaianView
              documents={documents}
              employees={employees}
              onAddDoc={async (doc) => {
                await addEmployeeDocument(doc);
                await loadAllData();
              }}
              onDeleteDoc={async (id, name) => {
                await deleteEmployeeDocument(id, name);
                await loadAllData();
              }}
            />
          )}

          {activeTab === 'impor-ekspor' && (
            <ImporEksporView
              employees={employees}
              settings={settings}
              onSaveImportedEmployees={handleSaveImportedEmployees}
              onOpenPrint={() => handleOpenPrint()}
            />
          )}

          {activeTab === 'arsip-periode' && (
            <ArsipPeriodeView
              periods={periods}
              employees={employees}
              settings={settings}
              onCreatePeriod={handleCreatePeriod}
              onUpdateStatus={handleUpdatePeriodStatus}
              onOpenPrintSnapshot={(items, title, periode) =>
                handleOpenPrint(items, title, periode)
              }
            />
          )}

          {activeTab === 'laporan' && (
            <LaporanView
              employees={employees}
              settings={settings}
              activePeriod={activePeriod}
              onOpenPrint={(items, title) => handleOpenPrint(items, title)}
            />
          )}

          {activeTab === 'pengguna' && <PenggunaView />}

          {activeTab === 'pengaturan' && (
            <PengaturanView
              settings={settings}
              employees={employees}
              periods={periods}
              histories={histories}
              onSaveSettings={handleSaveSettings}
              onRestoreBackup={handleRestoreBackup}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setSelectedEmpForEdit(null);
        }}
        onSave={handleSaveEmployee}
        initialData={selectedEmpForEdit}
        existingEmployees={employees}
      />

      <EmployeeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEmpForDetail(null);
        }}
        employee={selectedEmpForDetail}
        onEdit={(emp) => {
          setSelectedEmpForEdit(emp);
          setIsEmployeeModalOpen(true);
        }}
        onArchive={(emp) => {
          setSelectedEmpForArchive(emp);
          setIsArchiveModalOpen(true);
        }}
      />

      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => {
          setIsArchiveModalOpen(false);
          setSelectedEmpForArchive(null);
        }}
        employee={selectedEmpForArchive}
        onConfirm={handleArchiveConfirm}
      />

      <OfficialPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        items={printItems}
        title={printTitle}
        periodeName={printPeriode}
        settings={settings}
        onUpdateSettings={handleSaveSettings}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
