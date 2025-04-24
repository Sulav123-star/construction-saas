'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Register Chart.js components
ChartJS.register(...registerables);

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

// Define types
interface Plan {
  id: string;
  task: string;
  start_date: string;
  project_id: string;
}

interface Workflow {
  id: string;
  name: string;
  status: string;
  project_id: string;
}

interface Project {
  id: string;
  name: string;
  location: { lat: number; lng: number };
}

interface Weather {
  main: { temp: number };
  weather: { description: string }[];
  name: string;
}

export default function Dashboard() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch today's plans
        const today = new Date().toISOString().split('T')[0];
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('id, task, start_date, project_id')
          .gte('start_date', today)
          .lte('start_date', today);
        if (plansError) throw plansError;
        setPlans(plansData || []);

        // Fetch lagging workflows
        const { data: workflowsData, error: workflowsError } = await supabase
          .from('workflows')
          .select('id, name, status, project_id')
          .eq('status', 'delayed');
        if (workflowsError) throw workflowsError;
        setWorkflows(workflowsData || []);

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, location');
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch weather (default to Kathmandu)
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=Kathmandu&appid=${process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY}&units=metric`
        );
        setWeather(response.data);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error('Error fetching data: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time subscription for plans
    const plansSubscription = supabase
      .channel('plans')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(plansSubscription);
    };
  }, []);

  // S-Curve chart data (example)
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Project Progress (%)',
        data: [10, 30, 50, 70, 90],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Today's Plans */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Today's Plans</h2>
            {plans.length ? (
              <ul className="space-y-2">
                {plans.map((plan) => (
                  <li key={plan.id} className="text-gray-600">{plan.task}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No plans for today.</p>
            )}
          </div>

          {/* Lagging Workflows */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Lagging Workflows</h2>
            {workflows.length ? (
              <ul className="space-y-2">
                {workflows.map((workflow) => (
                  <li key={workflow.id} className="text-red-600">{workflow.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No lagging workflows.</p>
            )}
          </div>

          {/* Weather */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Weather</h2>
            {weather ? (
              <div>
                <p className="text-gray-600">{weather.weather[0].description} in {weather.name}</p>
                <p className="text-gray-600">{weather.main.temp}°C</p>
              </div>
            ) : (
              <p className="text-gray-500">Loading weather...</p>
            )}
          </div>

          {/* S-Curve Chart */}
          <div className="bg-white p-6 rounded-lg shadow col-span-1 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">S-Curve (Progress)</h2>
            <div className="h-64">
              <Line data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Project Locations Map */}
          <div className="bg-white p-6 rounded-lg shadow col-span-1 lg:col-span-3">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Project Locations</h2>
            <div className="h-96">
              <MapContainer center={[27.7172, 85.3240]} zoom={10} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {projects.map((project) => (
                  <Marker key={project.id} position={[project.location.lat, project.location.lng]}>
                    <Popup>{project.name}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}