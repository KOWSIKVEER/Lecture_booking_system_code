import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../../components/common/Skeleton';
import StarRating from '../../components/common/StarRating';
import Modal from '../../components/common/Modal';

const ClassCard = ({ cls, onBook, onCancel, bookedIds, onRate }) => {
  const isBooked = bookedIds.has(cls._id);
  const isFull = cls.availableSeats <= 0;
  const isPast = new Date(cls.startTime) < new Date();

  const formatTime = (dt) => new Date(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className={`card p-5 hover:shadow-md transition-shadow ${cls.recommendationScore > 60 ? 'ring-2 ring-primary-500/30' : ''}`}>
      {cls.recommendationScore > 60 && (
        <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 mb-2">
          ⭐ Recommended
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{cls.topic}</h3>
          <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-0.5">
            {cls.course?.name}
          </p>
        </div>
        <span className={`badge flex-shrink-0 ${
          cls.status === 'scheduled' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          cls.status === 'ongoing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
          cls.status === 'completed' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' :
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {cls.status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="truncate">{formatTime(cls.startTime)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="truncate">{cls.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="truncate">{cls.faculty?.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className={isFull ? 'text-red-500' : 'text-green-600 dark:text-green-400'}>
            {cls.availableSeats} seats left
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <StarRating value={cls.averageRating} readonly size="sm" />
        <div className="flex gap-2">
          {cls.status === 'completed' && (
            <button onClick={() => onRate(cls)} className="text-xs text-primary-600 hover:underline">Rate</button>
          )}
          {cls.status === 'scheduled' && !isPast && (
            isBooked ? (
              <button onClick={() => onCancel(cls._id)} className="btn-danger text-xs py-1.5 px-3">Cancel</button>
            ) : (
              <button onClick={() => onBook(cls._id)} disabled={isFull} className="btn-primary text-xs py-1.5 px-3">
                {isFull ? 'Full' : 'Book'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [bookedClasses, setBookedClasses] = useState([]);
  const [attendedClasses, setAttendedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [rateModal, setRateModal] = useState({ open: false, cls: null, rating: 0, review: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [classRes, bookingRes, attendedRes] = await Promise.all([
        api.get('/classes?status=scheduled'),
        api.get('/bookings/my-bookings?status=booked'),
        api.get('/bookings/attended')
      ]);
      setClasses(classRes.data.data);
      setBookedClasses(bookingRes.data.data);
      setAttendedClasses(attendedRes.data.data);
    } catch (err) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const bookedIds = new Set(bookedClasses.map(b => b.class?._id));

  const handleBook = async (classId) => {
    try {
      await api.post('/bookings', { classId });
      toast.success('Class booked successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleCancel = async (classId) => {
    try {
      const booking = bookedClasses.find(b => b.class?._id === classId);
      if (booking) {
        await api.delete(`/bookings/${booking._id}`);
        toast.success('Booking cancelled');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to cancel booking');
    }
  };

  const handleRate = async () => {
    try {
      await api.post('/ratings', { classId: rateModal.cls._id, rating: rateModal.rating, review: rateModal.review });
      toast.success('Rating submitted!');
      setRateModal({ open: false, cls: null, rating: 0, review: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rating failed');
    }
  };

  const recommended = classes.filter(c => (c.recommendationScore || 0) > 60);
  const upcoming = classes.filter(c => !recommended.includes(c));
  const filtered = (list) => list.filter(c => c.topic?.toLowerCase().includes(search.toLowerCase()) || c.course?.name?.toLowerCase().includes(search.toLowerCase()));

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'recommended', label: 'Recommended', count: recommended.length },
    { id: 'booked', label: 'My Bookings', count: bookedClasses.length },
    { id: 'attended', label: 'Attended', count: attendedClasses.length }
  ];

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" className="input pl-9" placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {activeTab === 'upcoming' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered(upcoming).length === 0 ? (
                <p className="col-span-full text-center text-gray-500 py-12">No upcoming classes found.</p>
              ) : filtered(upcoming).map(cls => (
                <ClassCard key={cls._id} cls={cls} onBook={handleBook} onCancel={handleCancel} bookedIds={bookedIds} onRate={(c) => setRateModal({ open: true, cls: c, rating: 0, review: '' })} />
              ))}
            </div>
          )}

          {activeTab === 'recommended' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered(recommended).length === 0 ? (
                <p className="col-span-full text-center text-gray-500 py-12">No recommendations yet. Book some classes to get personalized suggestions.</p>
              ) : filtered(recommended).map(cls => (
                <ClassCard key={cls._id} cls={cls} onBook={handleBook} onCancel={handleCancel} bookedIds={bookedIds} onRate={(c) => setRateModal({ open: true, cls: c, rating: 0, review: '' })} />
              ))}
            </div>
          )}

          {activeTab === 'booked' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookedClasses.length === 0 ? (
                <p className="col-span-full text-center text-gray-500 py-12">No booked classes.</p>
              ) : bookedClasses.map(b => b.class && (
                <ClassCard key={b._id} cls={b.class} onBook={handleBook} onCancel={handleCancel} bookedIds={bookedIds} onRate={(c) => setRateModal({ open: true, cls: c, rating: 0, review: '' })} />
              ))}
            </div>
          )}

          {activeTab === 'attended' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {attendedClasses.length === 0 ? (
                <p className="col-span-full text-center text-gray-500 py-12">No attended classes yet.</p>
              ) : attendedClasses.map(b => b.class && (
                <ClassCard key={b._id} cls={b.class} onBook={handleBook} onCancel={handleCancel} bookedIds={bookedIds} onRate={(c) => setRateModal({ open: true, cls: c, rating: 0, review: '' })} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Rate Modal */}
      <Modal isOpen={rateModal.open} onClose={() => setRateModal({ open: false, cls: null, rating: 0, review: '' })} title="Rate Class">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">{rateModal.cls?.topic}</p>
          <div>
            <label className="label">Your Rating</label>
            <StarRating value={rateModal.rating} onChange={r => setRateModal(prev => ({ ...prev, rating: r }))} size="lg" />
          </div>
          <div>
            <label className="label">Review (optional)</label>
            <textarea className="input" rows={3} placeholder="Share your experience..." value={rateModal.review} onChange={e => setRateModal(prev => ({ ...prev, review: e.target.value }))} />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setRateModal({ open: false, cls: null, rating: 0, review: '' })}>Cancel</button>
            <button className="btn-primary" onClick={handleRate} disabled={!rateModal.rating}>Submit Rating</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Classes;
