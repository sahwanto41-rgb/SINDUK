import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import {
  Employee,
  EmploymentHistory,
  EmployeeDocument,
  DukPeriod,
  DukSnapshot,
  AuditLog,
  AppSettings,
  UserProfile,
  UserRole,
} from '../types';
import { INITIAL_APP_SETTINGS, INITIAL_EMPLOYEES, INITIAL_DUK_PERIOD } from './seedData';
import { sortPnsDuk } from '../utils/dukRanking';

// ==================== APP SETTINGS ====================

export async function getAppSettings(): Promise<AppSettings> {
  const path = 'appSettings/global';
  try {
    const docRef = doc(db, 'appSettings', 'global');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as AppSettings;
    }
    return INITIAL_APP_SETTINGS;
  } catch (error) {
    console.warn('Gagal membaca appSettings dari Firestore, menggunakan setelan dasar sekolah:', error);
    return INITIAL_APP_SETTINGS;
  }
}

export async function saveAppSettings(settings: AppSettings, userDisplayName: string): Promise<void> {
  const path = 'appSettings/global';
  try {
    const docRef = doc(db, 'appSettings', 'global');
    const payload = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload);
    await logAuditEvent('PERBARUI_PENGATURAN', `Pembaruan profil sekolah dan konfigurasi DUK oleh ${userDisplayName}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==================== EMPLOYEES ====================

export async function getEmployees(): Promise<Employee[]> {
  const path = 'employees';
  try {
    const colRef = collection(db, 'employees');
    const snapshot = await getDocs(colRef);
    const list: Employee[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as Employee);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const path = `employees/${id}`;
  try {
    const docRef = doc(db, 'employees', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Employee;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function addEmployee(
  employee: Employee,
  currentUser: { email: string; displayName: string; uid: string }
): Promise<void> {
  const path = `employees/${employee.id}`;
  try {
    // Cek duplikasi NIP jika bukan '-'
    if (employee.nip && employee.nip.trim() !== '-' && employee.nip.length >= 9) {
      const q = query(collection(db, 'employees'), where('nip', '==', employee.nip.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error(`NIP "${employee.nip}" sudah terdaftar untuk pegawai lain. Mohon periksa kembali.`);
      }
    }

    const docRef = doc(db, 'employees', employee.id);
    await setDoc(docRef, employee);

    // Catat riwayat awal penempatan
    await addEmploymentHistory({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      employeeId: employee.id,
      employeeName: employee.namaLengkap,
      tipePerubahan: 'PENEMPATAN',
      dataSebelum: 'Data baru dibuat',
      dataSesudah: `Penempatan di UPTD SPF SD Negeri Lanas 1, TMT: ${employee.tmtSekolah}`,
      alasanPerubahan: 'Perekaman pegawai baru pada sistem SI-DUK SMART',
      nomorDokumen: employee.noSkPenempatan || '-',
      diubahOleh: currentUser.displayName || currentUser.email,
      userId: currentUser.uid,
      timestamp: new Date().toISOString(),
    });

    await logAuditEvent('TAMBAH_PEGAWAI', `Menambahkan pegawai baru: ${employee.namaLengkap} (${employee.statusKepegawaian})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEmployee(
  id: string,
  updatedData: Partial<Employee>,
  previousData: Employee,
  currentUser: { email: string; displayName: string; uid: string },
  alasanPerubahan: string = 'Pembaruan data kepegawaian'
): Promise<void> {
  const path = `employees/${id}`;
  try {
    // Cek duplikasi NIP jika NIP diubah
    if (
      updatedData.nip &&
      updatedData.nip.trim() !== '-' &&
      updatedData.nip.trim() !== previousData.nip.trim()
    ) {
      const q = query(collection(db, 'employees'), where('nip', '==', updatedData.nip.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error(`NIP "${updatedData.nip}" sudah digunakan oleh pegawai lain.`);
      }
    }

    const docRef = doc(db, 'employees', id);
    const finalPayload = {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(docRef, finalPayload);

    // Deteksi perubahan penting untuk disimpan di employmentHistory secara terpisah
    const historyList: { tipe: any; sebelum: string; sesudah: string }[] = [];

    if (updatedData.golonganRuang && updatedData.golonganRuang !== previousData.golonganRuang) {
      historyList.push({
        tipe: 'PANGKAT',
        sebelum: `${previousData.pangkat || '-'} (${previousData.golonganRuang || '-'})`,
        sesudah: `${updatedData.pangkat || '-'} (${updatedData.golonganRuang || '-'})`,
      });
    }

    if (updatedData.jabatanUtama && updatedData.jabatanUtama !== previousData.jabatanUtama) {
      historyList.push({
        tipe: 'JABATAN',
        sebelum: `${previousData.jabatanUtama || '-'} (TMT: ${previousData.tmtJabatan || '-'})`,
        sesudah: `${updatedData.jabatanUtama || '-'} (TMT: ${updatedData.tmtJabatan || '-'})`,
      });
    }

    if (updatedData.tmtSekolah && updatedData.tmtSekolah !== previousData.tmtSekolah) {
      historyList.push({
        tipe: 'PENEMPATAN',
        sebelum: `TMT Sekolah Lama: ${previousData.tmtSekolah || '-'}`,
        sesudah: `TMT Sekolah Baru: ${updatedData.tmtSekolah || '-'}`,
      });
    }

    if (updatedData.pendidikanTerakhir && updatedData.pendidikanTerakhir !== previousData.pendidikanTerakhir) {
      historyList.push({
        tipe: 'PENDIDIKAN',
        sebelum: `${previousData.jenjangPendidikan || '-'} ${previousData.pendidikanTerakhir || '-'} (${previousData.tahunLulus || '-'})`,
        sesudah: `${updatedData.jenjangPendidikan || '-'} ${updatedData.pendidikanTerakhir || '-'} (${updatedData.tahunLulus || '-'})`,
      });
    }

    if (
      updatedData.mkGolonganTahun !== undefined &&
      (updatedData.mkGolonganTahun !== previousData.mkGolonganTahun ||
        updatedData.mkGolonganBulan !== previousData.mkGolonganBulan)
    ) {
      historyList.push({
        tipe: 'MASA_KERJA',
        sebelum: `MKG: ${previousData.mkGolonganTahun || 0} Thn ${previousData.mkGolonganBulan || 0} Bln`,
        sesudah: `MKG: ${updatedData.mkGolonganTahun || 0} Thn ${updatedData.mkGolonganBulan || 0} Bln`,
      });
    }

    if (updatedData.statusKepegawaian && updatedData.statusKepegawaian !== previousData.statusKepegawaian) {
      historyList.push({
        tipe: 'STATUS',
        sebelum: previousData.statusKepegawaian,
        sesudah: updatedData.statusKepegawaian,
      });
    }

    // Rekam audit changes ke history
    for (const h of historyList) {
      await addEmploymentHistory({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        employeeId: id,
        employeeName: updatedData.namaLengkap || previousData.namaLengkap,
        tipePerubahan: h.tipe,
        dataSebelum: h.sebelum,
        dataSesudah: h.sesudah,
        alasanPerubahan: alasanPerubahan,
        diubahOleh: currentUser.displayName || currentUser.email,
        userId: currentUser.uid,
        timestamp: new Date().toISOString(),
      });
    }

    await logAuditEvent(
      'UPDATE_PEGAWAI',
      `Memperbarui pegawai ${previousData.namaLengkap} - Alasan: ${alasanPerubahan}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function archiveEmployee(
  id: string,
  namaLengkap: string,
  status: 'MUTASI_KELUAR' | 'PENSIUN' | 'CUTI' | 'TIDAK_AKTIF',
  alasan: string,
  currentUser: { email: string; displayName: string; uid: string }
): Promise<void> {
  const path = `employees/${id}`;
  try {
    const docRef = doc(db, 'employees', id);
    await updateDoc(docRef, {
      statusAktif: status,
      keterangan: `Diarsipkan: ${status}. Alasan: ${alasan}`,
      updatedAt: new Date().toISOString(),
    });

    await addEmploymentHistory({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      employeeId: id,
      employeeName: namaLengkap,
      tipePerubahan: 'STATUS',
      dataSebelum: 'AKTIF',
      dataSesudah: status,
      alasanPerubahan: alasan,
      diubahOleh: currentUser.displayName || currentUser.email,
      userId: currentUser.uid,
      timestamp: new Date().toISOString(),
    });

    await logAuditEvent('ARSIP_PEGAWAI', `Mengarsipkan status pegawai ${namaLengkap} ke ${status} (${alasan})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteEmployeePermanently(
  id: string,
  namaLengkap: string,
  currentUser: { email: string; displayName: string; uid: string }
): Promise<void> {
  const path = `employees/${id}`;
  try {
    const docRef = doc(db, 'employees', id);
    await deleteDoc(docRef);
    await logAuditEvent('HAPUS_PEGAWAI', `Menghapus permanen data pegawai: ${namaLengkap} (ID: ${id})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== EMPLOYMENT HISTORY ====================

export async function getEmploymentHistory(employeeId?: string): Promise<EmploymentHistory[]> {
  const path = 'employmentHistory';
  try {
    const colRef = collection(db, 'employmentHistory');
    let q = query(colRef, orderBy('timestamp', 'desc'));
    if (employeeId) {
      q = query(colRef, where('employeeId', '==', employeeId), orderBy('timestamp', 'desc'));
    }
    const snap = await getDocs(q);
    const list: EmploymentHistory[] = [];
    snap.forEach((d) => list.push(d.data() as EmploymentHistory));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function addEmploymentHistory(history: EmploymentHistory): Promise<void> {
  const path = `employmentHistory/${history.id}`;
  try {
    const docRef = doc(db, 'employmentHistory', history.id);
    await setDoc(docRef, history);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ==================== EMPLOYEE DOCUMENTS ====================

export async function getEmployeeDocuments(employeeId?: string): Promise<EmployeeDocument[]> {
  const path = 'employeeDocuments';
  try {
    const colRef = collection(db, 'employeeDocuments');
    let q = query(colRef, orderBy('uploadedAt', 'desc'));
    if (employeeId) {
      q = query(colRef, where('employeeId', '==', employeeId), orderBy('uploadedAt', 'desc'));
    }
    const snap = await getDocs(q);
    const list: EmployeeDocument[] = [];
    snap.forEach((d) => list.push(d.data() as EmployeeDocument));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function addEmployeeDocument(docItem: EmployeeDocument): Promise<void> {
  const path = `employeeDocuments/${docItem.id}`;
  try {
    const docRef = doc(db, 'employeeDocuments', docItem.id);
    await setDoc(docRef, docItem);
    await logAuditEvent('UNGGAH_DOKUMEN', `Perekaman dokumen ${docItem.namaDokumen} untuk ${docItem.employeeName}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteEmployeeDocument(id: string, namaDokumen: string): Promise<void> {
  const path = `employeeDocuments/${id}`;
  try {
    const docRef = doc(db, 'employeeDocuments', id);
    await deleteDoc(docRef);
    await logAuditEvent('HAPUS_DOKUMEN', `Menghapus berkas dokumen ${namaDokumen}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== DUK PERIODS & SNAPSHOTS ====================

export async function getDukPeriods(): Promise<DukPeriod[]> {
  const path = 'dukPeriods';
  try {
    const colRef = collection(db, 'dukPeriods');
    const snap = await getDocs(colRef);
    const list: DukPeriod[] = [];
    snap.forEach((d) => list.push(d.data() as DukPeriod));
    // Sort descending by tanggalAcuan
    list.sort((a, b) => new Date(b.tanggalAcuan).getTime() - new Date(a.tanggalAcuan).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function addDukPeriod(period: DukPeriod): Promise<void> {
  const path = `dukPeriods/${period.id}`;
  try {
    const docRef = doc(db, 'dukPeriods', period.id);
    await setDoc(docRef, period);
    await logAuditEvent('BUAT_PERIODE_DUK', `Membuat periode DUK baru: ${period.namaPeriode}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDukPeriodStatus(
  periodId: string,
  newStatus: 'DRAFT' | 'DIPERIKSA' | 'DISAHKAN',
  currentUser: { email: string; displayName: string; uid: string },
  employees: Employee[],
  pengesahName: string = 'Sahwanto, S.Pd.',
  pengesahNip: string = '19680512 199303 1 008'
): Promise<void> {
  const path = `dukPeriods/${periodId}`;
  try {
    const docRef = doc(db, 'dukPeriods', periodId);
    const updates: Partial<DukPeriod> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === 'DISAHKAN') {
      const today = new Date().toISOString().split('T')[0];
      updates.tanggalPengesahan = today;
      updates.pejabatPengesah = pengesahName;
      updates.nipPengesah = pengesahNip;

      // HITUNG DAN KUNCI SNAPSHOT PERMANEN (IMMUTABLE SNAPSHOT)
      const sortedDuk = sortPnsDuk(employees);
      const snapshot: DukSnapshot = {
        id: `snap-${periodId}`,
        periodId: periodId,
        periodName: `DUK Snapshot - ${periodId}`,
        tanggalPengesahan: today,
        snapshotData: JSON.stringify(sortedDuk),
        disahkanOleh: pengesahName,
        nipPengesah: pengesahNip,
        createdAt: new Date().toISOString(),
      };

      const snapDocRef = doc(db, 'dukSnapshots', snapshot.id);
      await setDoc(snapDocRef, snapshot);

      await logAuditEvent(
        'PENGESAHAN_DUK',
        `Periode ${periodId} resmi DISAHKAN dan dibekukan snapshot urutan oleh ${pengesahName}`
      );
    }

    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getDukSnapshot(periodId: string): Promise<DukSnapshot | null> {
  const snapId = `snap-${periodId}`;
  const path = `dukSnapshots/${snapId}`;
  try {
    const snapRef = doc(db, 'dukSnapshots', snapId);
    const snapDoc = await getDoc(snapRef);
    if (snapDoc.exists()) {
      return snapDoc.data() as DukSnapshot;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ==================== AUDIT LOGS ====================

export async function logAuditEvent(action: string, details: string): Promise<void> {
  const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const path = `auditLogs/${logId}`;
  try {
    const user = auth.currentUser;
    const logDoc = doc(db, 'auditLogs', logId);
    const item: AuditLog = {
      id: logId,
      action,
      userEmail: user?.email || 'system@sdnlanas1.sch.id',
      userName: user?.displayName || user?.email || 'Pengguna Sistem',
      details,
      timestamp: new Date().toISOString(),
    };
    await setDoc(logDoc, item);
  } catch (err) {
    // Fail silently in telemetry if unauthenticated yet, or log to console
    console.warn('Could not write audit log:', err);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const path = 'auditLogs';
  try {
    const colRef = collection(db, 'auditLogs');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    const list: AuditLog[] = [];
    snap.forEach((d) => list.push(d.data() as AuditLog));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ==================== USER PROFILES ====================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    const list: UserProfile[] = [];
    snap.forEach((d) => list.push(d.data() as UserProfile));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==================== INITIALIZATION & SEEDING ====================

export async function initializeDatabaseIfEmpty(): Promise<{ seeded: boolean; count: number }> {
  // Hanya inisialisasi jika ada user yang telah terautentikasi (mencegah error permission saat unauthenticated)
  if (!auth.currentUser) {
    return { seeded: false, count: 0 };
  }
  try {
    const empSnap = await getDocs(collection(db, 'employees'));
    if (!empSnap.empty) {
      return { seeded: false, count: empSnap.size };
    }

    console.info('Menginisialisasi data dasar SD Negeri Lanas 1 ke Cloud Firestore...');

    // Seed settings
    await setDoc(doc(db, 'appSettings', 'global'), INITIAL_APP_SETTINGS);

    // Seed active DUK Period
    await setDoc(doc(db, 'dukPeriods', INITIAL_DUK_PERIOD.id), INITIAL_DUK_PERIOD);

    // Seed Initial Employees
    for (const emp of INITIAL_EMPLOYEES) {
      await setDoc(doc(db, 'employees', emp.id), emp);
    }

    // Freeze Initial Snapshot for Periode 1 Januari 2026
    const sorted = sortPnsDuk(INITIAL_EMPLOYEES);
    const snapshot: DukSnapshot = {
      id: `snap-${INITIAL_DUK_PERIOD.id}`,
      periodId: INITIAL_DUK_PERIOD.id,
      periodName: INITIAL_DUK_PERIOD.namaPeriode,
      tanggalPengesahan: INITIAL_DUK_PERIOD.tanggalPengesahan || '2026-01-05',
      snapshotData: JSON.stringify(sorted),
      disahkanOleh: INITIAL_DUK_PERIOD.pejabatPengesah || 'Sahwanto, S.Pd.',
      nipPengesah: INITIAL_DUK_PERIOD.nipPengesah || '19680512 199303 1 008',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'dukSnapshots', snapshot.id), snapshot);

    await logAuditEvent(
      'INIT_DATABASE',
      `Inisialisasi data dasar kepegawaian SD Negeri Lanas 1 (${INITIAL_EMPLOYEES.length} pegawai)`
    );

    return { seeded: true, count: INITIAL_EMPLOYEES.length };
  } catch (err) {
    console.error('Inisialisasi data gagal:', err);
    return { seeded: false, count: 0 };
  }
}
