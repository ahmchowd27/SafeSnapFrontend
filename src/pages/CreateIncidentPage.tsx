import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { incidentsApi } from '@/api/incidents';
import { storageApi } from '@/api/storage';
import { CreateIncidentRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Camera, 
  Mic, 
  MapPin, 
  X, 
  ArrowLeft,
  AlertTriangle,
  Loader2
} from 'lucide-react';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const incidentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  locationDescription: z.string().optional(),
});

type IncidentFormData = z.infer<typeof incidentSchema>;

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedPosition: [number, number] | null;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, selectedPosition }) => {
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  return (
    <MapContainer 
      center={[37.7749, -122.4194]} 
      zoom={13} 
      style={{ height: '300px', width: '100%' }}
      className="rounded-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler />
      {selectedPosition && <Marker position={selectedPosition} />}
    </MapContainer>
  );
};

const CreateIncidentPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedAudio, setUploadedAudio] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: '',
      description: '',
      severity: 'MEDIUM',
      locationDescription: '',
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: (data: CreateIncidentRequest) => incidentsApi.createIncident(data),
    onSuccess: () => {
      navigate('/worker');
    },
    onError: (error: Error) => {
      form.setError('root', { message: error.message });
    },
  });

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'audio') => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Get presigned URL
        const { uploadUrl, fileUrl } = await storageApi.getUploadUrl(file.name, file.type);
        
        // Upload file to S3
        await storageApi.uploadFile(uploadUrl, file);
        
        // Add to state
        if (type === 'image') {
          setUploadedImages(prev => [...prev, fileUrl]);
        } else {
          setUploadedAudio(prev => [...prev, fileUrl]);
        }
      }
    } catch (error) {
      form.setError('root', { message: 'Failed to upload files. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (url: string, type: 'image' | 'audio') => {
    if (type === 'image') {
      setUploadedImages(prev => prev.filter(u => u !== url));
    } else {
      setUploadedAudio(prev => prev.filter(u => u !== url));
    }
  };

  const onSubmit = (data: IncidentFormData) => {
    const incidentData: CreateIncidentRequest = {
      ...data,
      latitude: selectedPosition?.[0],
      longitude: selectedPosition?.[1],
      imageUrls: uploadedImages,
      audioUrls: uploadedAudio,
    };

    createIncidentMutation.mutate(incidentData);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedPosition([latitude, longitude]);
        },
        () => {
          form.setError('root', { message: 'Unable to get your location. Please select manually on the map.' });
        }
      );
    } else {
      form.setError('root', { message: 'Geolocation is not supported by this browser.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/worker">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 ml-6">Report New Incident</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {form.formState.errors.root && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-4 rounded-md">
              <AlertTriangle className="h-4 w-4" />
              <span>{form.formState.errors.root.message}</span>
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Incident Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of what happened"
                  {...form.register('title')}
                  className={form.formState.errors.title ? 'border-red-500' : ''}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about the incident, including what happened, when, and any immediate actions taken..."
                  rows={4}
                  {...form.register('description')}
                  className={form.formState.errors.description ? 'border-red-500' : ''}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity Level *</Label>
                <select
                  id="severity"
                  {...form.register('severity')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="LOW">Low - Minor issue, no immediate danger</option>
                  <option value="MEDIUM">Medium - Moderate risk, requires attention</option>
                  <option value="HIGH">High - Serious risk, needs prompt action</option>
                  <option value="CRITICAL">Critical - Immediate danger, urgent response required</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="locationDescription">Location Description</Label>
                <Input
                  id="locationDescription"
                  placeholder="e.g., Building A, Floor 2, Near the main entrance"
                  {...form.register('locationDescription')}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pin Location on Map</Label>
                  <Button type="button" variant="outline" onClick={getCurrentLocation}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Use Current Location
                  </Button>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <LocationPicker
                    onLocationSelect={(lat, lng) => setSelectedPosition([lat, lng])}
                    selectedPosition={selectedPosition}
                  />
                </div>
                {selectedPosition && (
                  <p className="text-sm text-gray-600">
                    Selected coordinates: {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photos</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Add Photos
                  </Button>
                  {isUploading && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, 'image')}
                />
                
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Incident photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeFile(url, 'image')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audio Upload */}
              <div className="space-y-2">
                <Label>Audio Recordings</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Add Audio
                </Button>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, 'audio')}
                />
                
                {uploadedAudio.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {uploadedAudio.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <div className="flex items-center">
                          <Mic className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">Audio recording {index + 1}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(url, 'audio')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link to="/worker">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={createIncidentMutation.isPending || isUploading}
            >
              {createIncidentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Incident...
                </>
              ) : (
                'Create Incident'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIncidentPage;
