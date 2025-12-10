<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# SafeSnap Frontend - Copilot Instructions

This is a React TypeScript frontend application for SafeSnap, an incident reporting and management system.

## Project Context

SafeSnap is a comprehensive incident reporting system with two main user roles:
- **Workers**: Report incidents with photos, audio, location data, and detailed descriptions
- **Managers**: Review incidents, perform AI-powered Root Cause Analysis, and manage team safety metrics

## Key Technologies
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui for styling
- React Query for server state management
- React Router for navigation
- React Hook Form + Zod for form handling
- React Leaflet for maps
- Recharts for data visualization
- Axios for API communication

## Code Style Guidelines

### Components
- Use functional components with TypeScript
- Implement proper loading states and error handling
- Use React Query for all server data fetching
- Follow the established naming convention for components and files

### API Integration
- Use the existing API client from `src/api/client.ts`
- Implement proper error handling with user-friendly messages
- Use TypeScript interfaces from `src/types.ts`
- Handle authentication and authorization properly

### Forms
- Use React Hook Form with Zod validation schemas
- Implement proper error messages and field validation
- Handle file uploads using presigned S3 URLs

### State Management
- Use React Query for server state
- Use React Context for global client state (authentication)
- Prefer local component state for UI-only state

### Styling
- Use Tailwind CSS utility classes
- Leverage shadcn/ui components for consistency
- Ensure responsive design across all screen sizes
- Follow the established color scheme and spacing

### File Structure
- Place reusable components in `src/components/`
- Page components go in `src/pages/`
- API calls are organized in `src/api/`
- Types are centralized in `src/types.ts`

## Important Patterns

### Protected Routes
```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'WORKER' | 'MANAGER' }> = ({ 
  children, 
  requiredRole 
}) => {
  // Implementation follows authentication context
};
```

### API Error Handling
```typescript
const mutation = useMutation({
  mutationFn: apiFunction,
  onSuccess: (data) => {
    // Handle success
  },
  onError: (error: Error) => {
    // Set form errors or show notifications
  },
});
```

### Form Validation
```typescript
const schema = z.object({
  field: z.string().min(1, 'Required field'),
});

const form = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

## Feature-Specific Notes

### Incident Reporting
- Always handle geolocation permissions gracefully
- Implement proper file upload progress indicators
- Validate file types and sizes before upload

### Dashboard Analytics
- Use Recharts for consistent chart styling
- Implement responsive chart containers
- Handle empty data states properly

### Maps Integration
- Use React Leaflet with proper marker handling
- Implement click handlers for location selection
- Handle geolocation API errors gracefully

### Root Cause Analysis
- Only managers can access RCA features
- Implement proper workflow states (Generated → Reviewed → Approved)
- Handle AI suggestions with proper loading and error states

## Common Utilities

### Class Name Merging
```typescript
import { cn } from "@/lib/utils"

className={cn("base-classes", conditionalClass && "conditional-classes", className)}
```

### Date Formatting
```typescript
new Date(timestamp).toLocaleString()
new Date(timestamp).toLocaleDateString()
```

### File Upload Pattern
```typescript
const { uploadUrl, fileUrl } = await storageApi.getUploadUrl(file.name, file.type);
await storageApi.uploadFile(uploadUrl, file);
// Use fileUrl in your data
```

## Testing Considerations
- Test both worker and manager user flows
- Verify responsive design on different screen sizes
- Test error states and edge cases
- Ensure accessibility standards are met

When working on this project, prioritize user experience, type safety, and maintainable code structure.
