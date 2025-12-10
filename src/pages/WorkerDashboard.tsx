import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { incidentsApi } from '@/api/incidents';
import { useAuth } from '@/contexts/AuthContext';
import { IncidentQueryParams } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Clock,
  LogOut,
  User
} from 'lucide-react';

const statusColors = {
  OPEN: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const severityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

const WorkerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [queryParams, setQueryParams] = useState<IncidentQueryParams>({
    page: 0,
    size: 10,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: incidents, isLoading, error } = useQuery({
    queryKey: ['incidents', 'my', queryParams],
    queryFn: () => incidentsApi.getMyIncidents(queryParams),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryParams(prev => ({ ...prev, search: searchTerm || undefined, page: 0 }));
  };

  const handleFilterChange = (key: keyof IncidentQueryParams, value: string | undefined) => {
    setQueryParams(prev => ({ 
      ...prev, 
      [key]: value || undefined, 
      page: 0 
    }));
  };

  const handlePageChange = (newPage: number) => {
    setQueryParams(prev => ({ ...prev, page: newPage }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading incidents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Incidents</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">SafeSnap Worker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                {user?.name}
              </div>
              <Button variant="ghost" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <Link to="/worker/incidents/new">
            <Button size="lg" className="mb-6">
              <Plus className="h-5 w-5 mr-2" />
              Report New Incident
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="flex">
                  <Input
                    placeholder="Search incidents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" className="ml-2">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
              
              <div className="flex gap-2">
                <select
                  value={queryParams.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <select
                  value={queryParams.severity || ''}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Severity</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incidents List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            My Incidents ({incidents?.totalElements || 0})
          </h2>

          {incidents?.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
                <p className="text-gray-600 mb-4">
                  {queryParams.search || queryParams.status || queryParams.severity 
                    ? "No incidents match your current filters."
                    : "You haven't reported any incidents yet."
                  }
                </p>
                <Link to="/worker/incidents/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Report Your First Incident
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {incidents?.content.map((incident) => (
                <Card key={incident.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={severityColors[incident.severity]}>
                            {incident.severity}
                          </Badge>
                          <Badge className={statusColors[incident.status]}>
                            {incident.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {incident.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {incident.description}
                        </p>
                        
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(incident.reportedAt).toLocaleDateString()}
                          </div>
                          {incident.locationDescription && (
                            <div className="flex items-center">
                              <span>📍 {incident.locationDescription}</span>
                            </div>
                          )}
                          {incident.imageUrls?.length > 0 && (
                            <div className="flex items-center">
                              <span>📸 {incident.imageUrls.length} photos</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Link to={`/worker/incidents/${incident.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        {(incident.status === 'OPEN' || incident.status === 'IN_PROGRESS') && (
                          <Link to={`/worker/incidents/${incident.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {incidents && incidents.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(queryParams.page! - 1)}
                    disabled={incidents.first}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {(queryParams.page || 0) + 1} of {incidents.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(queryParams.page! + 1)}
                    disabled={incidents.last}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
