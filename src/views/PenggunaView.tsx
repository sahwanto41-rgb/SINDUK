import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Key, CheckCircle2, Shield, User, Info, Mail } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { getAllUserProfiles, setUserProfile } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';

export const PenggunaView: React.FC = () => {
  const { userProfile, switchRoleForDemo, isDemoMode } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // New user assignment state
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('operator');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await getAllUserProfiles();
      setUsers(list);
    } catch (err) {
      console.warn('Gagal memuat profil pengguna:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newDisplayName.trim()) return;

    const userItem: UserProfile = {
      uid: `usr-${Date.now()}`,
      email: newEmail.trim().toLowerCase(),
      displayName: newDisplayName.trim(),
      role: newRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setUserProfile(userItem);
    await loadUsers();
    setNewEmail('');
    setNewDisplayName('');
  };

  const handleUpdateRole = async (targetUser: UserProfile, newR: UserRole) => {
    await setUserProfile({
      ...targetUser,
      role: newR,
      updatedAt: new Date().toISOString(),
    });
    await loadUsers();
  };

  const roles = [
    {
      role: 'admin',
      label: 'Administrator',
      desc: 'Pengaturan sistem, manajemen akun pengguna, penghapusan data, dan pencadangan database.',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    },
    {
      role: 'operator',
      label: 'Operator Kepegawaian',
      desc: 'Menambah dan memperbarui data pegawai, mengunggah dokumen, dan mencatat riwayat kepegawaian.',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    },
    {
      role: 'kepala_sekolah',
      label: 'Kepala Sekolah',
      desc: 'Pemeriksaan kepangkatan, persetujuan dan pengesahan resmi (DISAHKAN) serta pembekuan snapshot DUK.',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    },
    {
      role: 'auditor',
      label: 'Pembaca / Auditor',
      desc: 'Akses lihat data (read-only) dan pengawasan kepatuhan tanpa hak mengubah data master.',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>Manajemen Pengguna & Hak Akses (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemberian wewenang peran berjenjang: Administrator, Operator, Kepala Sekolah, dan Auditor
          </p>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Akun Anda Saat Ini:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {userProfile?.displayName} ({userProfile?.role})
          </span>
        </div>
      </div>

      {/* Security Info & First Admin Guide */}
      <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200 space-y-1">
        <div className="flex items-center gap-2 font-bold">
          <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Panduan Hak Akses & Administrator Pertama:</span>
        </div>
        <p className="text-[11px] leading-relaxed text-purple-800 dark:text-purple-300">
          Akun email resmi <strong>sahwanto41@admin.sd.belajar.id</strong> secara otomatis terdaftar dengan hak penuh sebagai Administrator dan Kepala Sekolah. Pengguna baru yang masuk dengan Google Auth akan memiliki hak sesuai peran yang diberikan di bawah ini.
        </p>
      </div>

      {/* RBAC Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((r) => (
          <div
            key={r.role}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.badge}`}>
                {r.label}
              </span>
              {userProfile?.role === r.role && (
                <span className="text-[10px] text-amber-500 font-bold">Aktif</span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {r.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Assign User Form */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-amber-500" />
          <span>Tetapkan Peran Pengguna Baru</span>
        </h3>

        <form onSubmit={handleAssignUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
              Email Akun Google <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nama@admin.sd.belajar.id"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
              Nama Lengkap / Jabatan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="Contoh: Rudi Hartono (Operator)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
              Peran Hak Akses
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="operator">Operator Kepegawaian</option>
              <option value="kepala_sekolah">Kepala Sekolah</option>
              <option value="admin">Administrator</option>
              <option value="auditor">Pembaca / Auditor</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 transition shadow-xs"
            >
              Simpan Hak Akses
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-900 text-white dark:bg-slate-950 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-3">Peran (Role)</th>
                <th className="py-3 px-4">Ubah Hak Akses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {u.displayName}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{u.email}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            : u.role === 'kepala_sekolah'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : u.role === 'operator'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u, e.target.value as UserRole)}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="admin">Administrator</option>
                        <option value="operator">Operator Kepegawaian</option>
                        <option value="kepala_sekolah">Kepala Sekolah</option>
                        <option value="auditor">Pembaca / Auditor</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
