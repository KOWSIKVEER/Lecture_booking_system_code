import React, { useState, useEffect } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { SkeletonStats } from '../../components/common/Skeleton';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AttendanceBadge = ({ percentage }) => {
  if (percentage >= 75) return <span className="badge attendance-high">Good ({percentage}%)</span>;
  if (percentage >= 60) return <span className="badge attendance-medium">Average ({percentage}%)</span>;
  return <span className="badge attendance-low">Low ({percentage}%)</span>;
};

const Attendance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/attendance/my-attendance');
        setData(res.data.data);
      } catch {
        toast.error('Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) return <SkeletonStats />;

  const overall = data?.overall || { total: 0, present: 0, percentage: 0 };
  const courses = data?.courses || [];

  const doughnutData = {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [overall.present, overall.total - overall.present],
      backgroundColor: ['#22c55e', '#ef4444'],
      borderWidth: 0
    }]
  };

  const barData = {
    labels: courses.map(c => c.course?.name?.substring(0, 15) + '...'),
    datasets: [{
      label: 'Attendance %',
      data: courses.map(c => c.percentage),
      backgroundColor: courses.map(c =>
        c.percentage >= 75 ? '#22c55e' : c.percentage >= 60 ? '#f59e0b' : '#ef4444'
      ),
      borderRadius: 6
    }]
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Classes', value: overall.total, color: 'text-blue-600' },
          { label: 'Attended', value: overall.present, color: 'text-green-600' },
          { label: 'Absent', value: overall.total - overall.present, color: 'text-red-600' },
          { label: 'Overall %', value: `${overall.percentage}%`, color: overall.percentage >= 75 ? 'text-green-600' : overall.percentage >= 60 ? 'text-yellow-600' : 'text-red-600' }
        ].map(stat => (
          <div key={stat.label} className="card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Overall Attendance</h3>
          <div className="flex items-center justify-center h-48">
            {overall.total > 0 ? (
              <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '70%' }} />
            ) : (
              <p className="text-gray-400">No attendance data yet</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Course-wise Attendance</h3>
          <div className="h-48">
            {courses.length > 0 ? (
              <Bar data={barData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } }
              }} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Course-wise Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Course-wise Breakdown</h3>
        </div>
        {courses.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No attendance records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Course', 'Total Classes', 'Attended', 'Absent', 'Percentage', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {courses.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.course?.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.total}</td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400">{c.present}</td>
                    <td className="px-4 py-3 text-red-600 dark:text-red-400">{c.absent}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 max-w-20">
                          <div
                            className={`h-1.5 rounded-full ${c.percentage >= 75 ? 'bg-green-500' : c.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${c.percentage}%` }}
                          />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{c.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><AttendanceBadge percentage={c.percentage} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
