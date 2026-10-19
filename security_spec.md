# Security Specification - DUK SMART

## Data Invariants & Security Matrix
1. **User Identity & Roles**: Default role for new users is `auditor` or assigned based on school personnel status. The bootstrapped admin is `sahwanto41@admin.sd.belajar.id`.
2. **Access Control**:
   - `admin`: Full configuration, user role management, hard deletes, app settings.
   - `operator`: Add/edit employee data, generate DUK, upload document metadata, create history audit log.
   - `kepala_sekolah`: Review DUK, validate and officially sign/freeze (`disahkan`) DUK periods and snapshots.
   - `auditor`: Read-only access to employee records, DUK, and reports.
3. **Immutability of Frozen DUK Snapshots**: Once a DUK period is marked as `DISAHKAN`, its snapshot in `dukSnapshots` is permanently locked. Any historical reprint fetches the original immutable snapshot JSON.
4. **Separation of Concerns**:
   - PNS DUK is evaluated and ranked strictly by verified civil service criteria (Golongan/Pangkat, TMT Pangkat, Jabatan, Masa Kerja, Usia/Tanggal Lahir).
   - PPPK and Non-ASN personnel are maintained in their respective dedicated registers and never mixed into the PNS hierarchy.
   - `tmtSekolah` (TMT di SD Negeri Lanas 1) is completely segregated from `tmtPangkat` and `tmtJabatan`.
