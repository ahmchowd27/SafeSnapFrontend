import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import { incidentsApi } from '@/api/incidents';
import { metricsApi } from '@/api/metrics';
import { rcaApi } from '@/api/rca';
import { useAuth } from '@/contexts/AuthContext';
import { IncidentQueryParams } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AuthenticatedImage from '@/components/AuthenticatedImage';
import { 
  Search, 
  AlertTriangle, 
  Clock, 
  Users,
  Camera,
  LogOut,
  User,
  Activity,
  Shield,
  BarChart3
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

const CHART_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#6b7280'];

// Utility function to filter valid image URLs from debug text
const filterValidImageUrls = (urls: string[] | undefined): string[] => {
  if (!urls || !Array.isArray(urls)) return [];
  
  return urls.filter(url => {
    // Check if it's a valid URL string
    if (typeof url !== 'string' || url.trim().length === 0) {
      return false;
    }
    
    const trimmedUrl = url.trim();
    
    // Exclude debug status messages first
    const debugTexts = ['uploading', 'uploaded', 'successfully', 'error', 'failed', '✅', '❌'];
    if (debugTexts.some(debug => trimmedUrl.toLowerCase().includes(debug))) {
      return false;
    }
    
    // Only include HTTP/HTTPS URLs (this will include S3 URLs)
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return true;
    }
    
    // Exclude everything else (local file paths, relative paths, etc.)
    return false;
  });
};

const ManagerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [queryParams, setQueryParams] = useState<IncidentQueryParams>({
    page: 0,
    size: 10,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics', 'summary'],
    queryFn: () => metricsApi.getSummary(),
  });

  const { data: rcaStats } = useQuery({
    queryKey: ['rca', 'statistics'],
    queryFn: () => metricsApi.getRcaStatistics(),
  });

  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents', 'all', queryParams],
    queryFn: () => incidentsApi.getAllIncidents(queryParams),
  });

  // RCA Generation Mutation
  const generateRcaMutation = useMutation({
    mutationFn: (incidentId: string) => rcaApi.getRcaSuggestions(incidentId),
    onSuccess: () => {
      // Refresh the incidents list to show updated RCA status
      queryClient.invalidateQueries({ queryKey: ['incidents', 'all'] });
    },
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

  const handleGenerateRca = (incidentId: string) => {
    generateRcaMutation.mutate(incidentId);
  };

  // Prepare chart data with proper null checks
  const statusChartData = (metrics && metrics.incidentsByStatus) 
    ? Object.entries(metrics.incidentsByStatus).map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count
      })) 
    : [];

  const severityChartData = (metrics && metrics.incidentsBySeverity) 
    ? Object.entries(metrics.incidentsBySeverity).map(([severity, count]) => ({
        name: severity,
        value: count
      })) 
    : [];

  if (metricsLoading || incidentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
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
              <Shield className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">SafeSnap Manager</h1>
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
        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalIncidents || 0}</div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <span className="text-green-600 mr-1">{metrics?.resolvedIncidents || 0}</span>
                  resolved
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics?.openIncidents || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Require attention
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.activeWorkers || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  of {metrics?.totalUsers || 0} total users
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.averageResolutionTimeHours?.toFixed(1) || '0.0'}h</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Average time to resolve
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Incidents by Status</CardTitle>
              <CardDescription>Distribution of incident statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Incidents by Severity</CardTitle>
              <CardDescription>Severity level distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={severityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* RCA Statistics */}
        {rcaStats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Root Cause Analysis Statistics
              </CardTitle>
              <CardDescription>AI-powered RCA performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{rcaStats.totalSuggestions}</div>
                  <div className="text-sm text-muted-foreground">Total Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{(rcaStats.successRate * 100).toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{rcaStats.approvedCount}</div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{(rcaStats.averageProcessingTimeMs / 1000).toFixed(1)}s</div>
                  <div className="text-sm text-muted-foreground">Avg Processing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Team Incidents</CardTitle>
            <CardDescription>All incidents reported by your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
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
          {incidents?.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
                <p className="text-gray-600">
                  {queryParams.search || queryParams.status || queryParams.severity 
                    ? "No incidents match your current filters."
                    : "No incidents have been reported yet."
                  }
                </p>
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
                          {incident.rcaReport && (
                            <Badge className="bg-blue-100 text-blue-800">
                              RCA Complete
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {incident.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {incident.description}
                        </p>

                        {/* Images Display */}
                        {incident.imageUrls && incident.imageUrls.length > 0 && (() => {
                          const validImageUrls = filterValidImageUrls(incident.imageUrls);
                          return validImageUrls.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center mb-2">
                                <Camera className="h-4 w-4 text-gray-600 mr-2" />
                                <span className="text-sm font-medium text-gray-700">Incident Photos ({validImageUrls.length}):</span>
                              </div>
                              <div className="flex gap-3 overflow-x-auto pb-2">
                                {validImageUrls.slice(0, 4).map((imageUrl, index) => (
                                  <div key={index} className="flex-shrink-0">
                                    <AuthenticatedImage
                                      src={imageUrl}
                                      alt={`Incident photo ${index + 1}`}
                                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                      onClick={() => window.open(imageUrl, '_blank')}
                                    />
                                  </div>
                                ))}
                                {validImageUrls.length > 4 && (
                                  <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center text-sm text-gray-600 font-medium">
                                    +{validImageUrls.length - 4} more
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* RCA Information */}
                        {incident.rcaReport && (
                          <div className="mb-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center mb-3">
                              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                              <span className="text-sm font-semibold text-blue-800">Root Cause Analysis Complete</span>
                              <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                                Completed by {incident.rcaReport.manager?.name || 'Manager'}
                              </Badge>
                            </div>
                            <div className="space-y-3 text-sm">
                              {incident.rcaReport.fiveWhys && (
                                <div>
                                  <span className="font-semibold text-gray-800">Five Whys Analysis:</span>
                                  <div className="mt-1 p-2 bg-white rounded border">
                                    <pre className="text-gray-700 whitespace-pre-wrap text-xs leading-relaxed">
                                      {incident.rcaReport.fiveWhys}
                                    </pre>
                                  </div>
                                </div>
                              )}
                              {incident.rcaReport.correctiveAction && (
                                <div>
                                  <span className="font-semibold text-gray-800">Corrective Action:</span>
                                  <p className="text-gray-700 mt-1 p-2 bg-white rounded border">
                                    {incident.rcaReport.correctiveAction}
                                  </p>
                                </div>
                              )}
                              {incident.rcaReport.preventiveAction && (
                                <div>
                                  <span className="font-semibold text-gray-800">Preventive Action:</span>
                                  <p className="text-gray-700 mt-1 p-2 bg-white rounded border">
                                    {incident.rcaReport.preventiveAction}
                                  </p>
                                </div>
                              )}
                              {incident.rcaReport.createdAt && (
                                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-blue-200">
                                  RCA completed on {new Date(incident.rcaReport.createdAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* RCA AI Suggestions */}
                        {incident.rcaAiSuggestions && !incident.rcaReport && (
                          <div className="mb-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center mb-3">
                              <span className="text-sm font-semibold text-yellow-800">🤖 AI RCA Suggestions Ready</span>
                              <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs">
                                {incident.rcaAiSuggestions.status || 'Generated'}
                              </Badge>
                            </div>
                            <div className="space-y-3 text-sm">
                              {incident.rcaAiSuggestions.suggestedFiveWhys && (
                                <div>
                                  <span className="font-semibold text-gray-800">AI Five Whys Suggestion:</span>
                                  <div className="mt-1 p-2 bg-white rounded border">
                                    <pre className="text-gray-700 whitespace-pre-wrap text-xs leading-relaxed line-clamp-4">
                                      {incident.rcaAiSuggestions.suggestedFiveWhys}
                                    </pre>
                                  </div>
                                </div>
                              )}
                              {incident.rcaAiSuggestions.suggestedCorrectiveAction && (
                                <div>
                                  <span className="font-semibold text-gray-800">AI Corrective Action:</span>
                                  <p className="text-gray-700 mt-1 p-2 bg-white rounded border line-clamp-3">
                                    {incident.rcaAiSuggestions.suggestedCorrectiveAction}
                                  </p>
                                </div>
                              )}
                              {incident.rcaAiSuggestions.suggestedPreventiveAction && (
                                <div>
                                  <span className="font-semibold text-gray-800">AI Preventive Action:</span>
                                  <p className="text-gray-700 mt-1 p-2 bg-white rounded border line-clamp-3">
                                    {incident.rcaAiSuggestions.suggestedPreventiveAction}
                                  </p>
                                </div>
                              )}
                              <div className="text-xs text-yellow-700 mt-3 pt-2 border-t border-yellow-200">
                                Click "Review" to approve or modify these AI suggestions
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {incident.reportedBy}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(incident.reportedAt).toLocaleDateString()}
                          </div>
                          {incident.locationDescription && (
                            <div className="flex items-center">
                              <span>📍 {incident.locationDescription}</span>
                            </div>
                          )}
                          {incident.assignedTo && (
                            <div className="flex items-center">
                              <span>� Assigned to: {incident.assignedTo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Link to={`/manager/incidents/${incident.id}`}>
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        </Link>
                        {!incident.rcaReport && !incident.rcaAiSuggestions && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 border-blue-200"
                            onClick={() => handleGenerateRca(incident.id)}
                            disabled={generateRcaMutation.isPending}
                          >
                            {generateRcaMutation.isPending ? 'Generating...' : 'Generate RCA'}
                          </Button>
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

export default ManagerDashboard;
