import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/profile/student');
        setProfile(res.data.data);
        setForm({
          name: res.data.data.name,
          contact: res.data.data.contact || {},
          dob: res.data.data.dob ? res.data.data.dob.split('T')[0] : ''
        });
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put('/profile/student', form);
      setProfile(prev => ({ ...prev, ...res.data.data }));
      dispatch(updateUser(res.data.data));
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-6 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => <div key={j} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />)}
          </div>
        </div>
      ))}
    </div>
  );

  if (!profile) return null;

  const attendancePct = profile.attendancePercentage || 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-3xl font-bold flex-shrink-0">
            {profile.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{profile.rollNumber} · {profile.department}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Year {profile.year} · Semester {profile.semester}</p>
              </div>
              <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm">
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Edit Profile</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="text" className="input" value={form.contact?.phone || ''} onChange={e => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
            </div>
            <div>
              <label className="label">Address</label>
              <input type="text" className="input" value={form.contact?.address || ''} onChange={e => setForm({ ...form, contact: { ...form.contact, address: e.target.value } })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'GPA', value: profile.gpa?.toFixed(1) || '0.0', color: 'text-primary-600' },
          { label: 'Attendance', value: `${attendancePct}%`, color: attendancePct >= 75 ? 'text-green-600' : attendancePct >= 60 ? 'text-yellow-600' : 'text-red-600' },
          { label: 'Courses', value: profile.enrolledCourses?.length || 0, color: 'text-blue-600' },
          { label: 'Semester', value: profile.semester || '-', color: 'text-purple-600' }
        ].map(stat => (
          <div key={stat.label} className="card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Personal Info */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Email', value: profile.email },
            { label: 'Phone', value: profile.contact?.phone || 'Not provided' },
            { label: 'Date of Birth', value: profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not provided' },
            { label: 'Address', value: profile.contact?.address || 'Not provided' }
          ].map(item => (
            <div key={item.label}>
              <p className="text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Enrolled Courses</h3>
        {profile.enrolledCourses?.length === 0 ? (
          <p className="text-gray-500">No courses enrolled.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {profile.enrolledCourses?.map(e => (
              <div key={e._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-bold">
                  {e.course?.courseId}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{e.course?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{e.course?.credits} credits</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Academic Performance */}
      {profile.academicPerformance?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Academic Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Course', 'Semester', 'Internal', 'External', 'Total', 'Grade', 'GPA'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {profile.academicPerformance.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{p.course?.name}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{p.semester}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{p.internalMarks}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{p.externalMarks}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{p.totalMarks}</td>
                    <td className="px-3 py-2"><span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{p.grade}</span></td>
                    <td className="px-3 py-2 font-semibold text-primary-600 dark:text-primary-400">{p.semesterGPA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
