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
        const res = await api.get('/profile/faculty');
        setProfile(res.data.data);
        setForm({
          name: res.data.data.name,
          contact: res.data.data.contact || {},
          dob: res.data.data.dob ? res.data.data.dob.split('T')[0] : '',
          specialization: res.data.data.specialization || ''
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
      const res = await api.put('/profile/faculty', form);
      setProfile(prev => ({ ...prev, ...res.data.data }));
      dispatch(updateUser(res.data.data));
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update');
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

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 text-3xl font-bold flex-shrink-0">
            {profile.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{profile.designation} · {profile.department}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">ID: {profile.facultyId}</span>
                  {profile.is_coordinator && <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Coordinator</span>}
                  {profile.isAdmin && <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Admin</span>}
                </div>
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
              <label className="label">Specialization</label>
              <input type="text" className="input" value={form.specialization || ''} onChange={e => setForm({ ...form, specialization: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="text" className="input" value={form.contact?.phone || ''} onChange={e => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Email', value: profile.email },
            { label: 'Phone', value: profile.contact?.phone || 'Not provided' },
            { label: 'Specialization', value: profile.specialization || 'Not provided' },
            { label: 'Date of Birth', value: profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not provided' }
          ].map(item => (
            <div key={item.label}>
              <p className="text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Courses */}
      {profile.coursesHandling?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Courses Handling</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {profile.coursesHandling.map(c => (
              <div key={c._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-700 dark:text-purple-400 text-xs font-bold">
                  {c.courseId}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{c.department}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Overview */}
      {profile.timetableOverview?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Timetable Overview</h3>
          <div className="space-y-2">
            {profile.timetableOverview.map(t => (
              <div key={t._id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                <span className="font-medium text-primary-600 dark:text-primary-400 w-10">{DAYS[t.dayOfWeek]}</span>
                <span className="text-gray-600 dark:text-gray-400">{t.startTime} - {t.endTime}</span>
                <span className="font-medium text-gray-900 dark:text-white flex-1">{t.course?.name}</span>
                <span className="text-gray-500 dark:text-gray-400">{t.location}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
