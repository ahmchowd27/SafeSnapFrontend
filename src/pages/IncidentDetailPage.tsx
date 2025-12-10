import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { incidentsApi } from '@/api/incidents';
import { rcaApi } from '@/api/rca';
import { useAuth } from '@/contexts/AuthContext';
import { IncidentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AuthenticatedImage from '@/components/AuthenticatedImage';
import { 
  ArrowLeft, 
  MapPin, 
  Camera, 
  Mic, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  Edit,
  Settings,
  FileText,
  Brain
} from 'lucide-react';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

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

const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: incident, isLoading, error } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentsApi.getIncident(id!),
    enabled: !!id,
  });

  const { data: rcaSuggestions } = useQuery({
    queryKey: ['rca-suggestions', id],
    queryFn: () => rcaApi.getRcaSuggestions(id!),
    enabled: !!id && user?.role === 'MANAGER' && incident?.status === 'UNDER_REVIEW',
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: IncidentStatus }) => 
      incidentsApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });

  const reviewRcaMutation = useMutation({
    mutationFn: () => rcaApi.reviewRcaSuggestions(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rca-suggestions', id] });
    },
  });

  const approveRcaMutation = useMutation({
    mutationFn: () => rcaApi.approveRcaSuggestions(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rca-suggestions', id] });
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Incident Not Found</h2>
          <p className="text-gray-600 mb-4">The incident you're looking for doesn't exist or you don't have access to it.</p>
          <Link to={user?.role === 'MANAGER' ? '/manager' : '/worker'}>
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'WORKER' && 
    incident.reportedByEmail === user?.email && 
    (incident.status === 'OPEN' || incident.status === 'IN_PROGRESS');

  const canManage = user?.role === 'MANAGER';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to={user?.role === 'MANAGER' ? '/manager' : '/worker'}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 ml-6">Incident Details</h1>
            </div>
            <div className="flex items-center space-x-2">
              {canEdit && (
                <Link to={`/worker/incidents/${id}/edit`}>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Incident
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={severityColors[incident.severity]}>
                        {incident.severity}
                      </Badge>
                      <Badge className={statusColors[incident.status]}>
                        {incident.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl">{incident.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{incident.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            {(incident.latitude && incident.longitude) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {incident.locationDescription && (
                    <p className="text-gray-700 mb-4">{incident.locationDescription}</p>
                  )}
                  <div className="border rounded-md overflow-hidden">
                    <MapContainer 
                      center={[incident.latitude, incident.longitude]} 
                      zoom={15} 
                      style={{ height: '300px', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[incident.latitude, incident.longitude]} />
                    </MapContainer>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Coordinates: {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Media */}
            {(incident.imageUrls?.length > 0 || incident.audioUrls?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Evidence & Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Images */}
                  {incident.imageUrls?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Camera className="h-4 w-4 mr-2" />
                        Photos ({incident.imageUrls.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {incident.imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <AuthenticatedImage
                              src={url}
                              alt={`Incident photo ${index + 1}`}
                              className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(url, '_blank')}
                            />
                            {incident.imageTags && incident.imageTags.length > 0 && (
                              <div className="absolute bottom-1 left-1 right-1">
                                <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                  AI Tags: {incident.imageTags.join(', ')}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audio */}
                  {incident.audioUrls?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Mic className="h-4 w-4 mr-2" />
                        Audio Recordings ({incident.audioUrls.length})
                      </h4>
                      <div className="space-y-2">
                        {incident.audioUrls.map((url, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Recording {index + 1}</span>
                            </div>
                            <audio controls className="w-full">
                              <source src={url} />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Suggestions */}
            {incident.aiSuggestions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    AI Safety Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {incident.aiSuggestions.map((suggestion, index) => (
                      <li key={index} className="text-gray-700">{suggestion}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* RCA Section (Manager Only) */}
            {canManage && rcaSuggestions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Root Cause Analysis (AI Generated)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      (rcaSuggestions as any).status === 'GENERATED' ? 'secondary' :
                      (rcaSuggestions as any).status === 'REVIEWED' ? 'default' :
                      'default'
                    }>
                      {(rcaSuggestions as any).status}
                    </Badge>
                    <div className="space-x-2">
                      {(rcaSuggestions as any).status === 'GENERATED' && (
                        <Button 
                          variant="outline" 
                          onClick={() => reviewRcaMutation.mutate()}
                          disabled={reviewRcaMutation.isPending}
                        >
                          Mark as Reviewed
                        </Button>
                      )}
                      {(rcaSuggestions as any).status === 'REVIEWED' && (
                        <Button 
                          onClick={() => approveRcaMutation.mutate()}
                          disabled={approveRcaMutation.isPending}
                        >
                          Approve & Finalize
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Five Whys Analysis</h4>
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="whitespace-pre-wrap text-gray-700">{(rcaSuggestions as any).suggestedFiveWhys}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Corrective Actions</h4>
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="whitespace-pre-wrap text-gray-700">{(rcaSuggestions as any).suggestedCorrectiveAction}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Preventive Actions</h4>
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="whitespace-pre-wrap text-gray-700">{(rcaSuggestions as any).suggestedPreventiveAction}</p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p><strong>Category:</strong> {(rcaSuggestions as any).incidentCategory}</p>
                      <p><strong>Generated:</strong> {new Date((rcaSuggestions as any).generatedAt).toLocaleString()}</p>
                      {(rcaSuggestions as any).reviewedAt && (
                        <p><strong>Reviewed:</strong> {new Date((rcaSuggestions as any).reviewedAt).toLocaleString()} by {(rcaSuggestions as any).reviewedByName}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Final RCA Report */}
            {incident.rcaReport && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Final RCA Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Five Whys Analysis</h4>
                    <div className="bg-green-50 p-3 rounded border">
                      <p className="whitespace-pre-wrap text-gray-700">{incident.rcaReport.fiveWhys}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Corrective Actions</h4>
                    <div className="bg-green-50 p-3 rounded border">
                      <p className="whitespace-pre-wrap text-gray-700">{incident.rcaReport.correctiveAction}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Preventive Actions</h4>
                    <div className="bg-green-50 p-3 rounded border">
                      <p className="whitespace-pre-wrap text-gray-700">{incident.rcaReport.preventiveAction}</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 pt-2 border-t">
                    <p><strong>Completed by:</strong> {incident.rcaReport.manager.name}</p>
                    <p><strong>Completed on:</strong> {new Date(incident.rcaReport.createdAt).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management (Manager Only) */}
            {canManage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Manage Incident
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Update Status
                    </label>
                    <select
                      value={incident.status}
                      onChange={(e) => updateStatusMutation.mutate({ status: e.target.value as IncidentStatus })}
                      disabled={updateStatusMutation.isPending}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Incident Info */}
            <Card>
              <CardHeader>
                <CardTitle>Incident Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">Reported by</p>
                    <p className="text-gray-600">{incident.reportedBy}</p>
                    <p className="text-gray-500 text-xs">{incident.reportedByEmail}</p>
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">Reported on</p>
                    <p className="text-gray-600">{new Date(incident.reportedAt).toLocaleString()}</p>
                  </div>
                </div>

                {incident.assignedTo && (
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">Assigned to</p>
                      <p className="text-gray-600">{incident.assignedTo}</p>
                      <p className="text-gray-500 text-xs">{incident.assignedToEmail}</p>
                    </div>
                  </div>
                )}

                {incident.updatedAt && incident.updatedBy && (
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">Last updated</p>
                      <p className="text-gray-600">{new Date(incident.updatedAt).toLocaleString()}</p>
                      <p className="text-gray-500 text-xs">by {incident.updatedBy}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailPage;
