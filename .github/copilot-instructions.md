# Copilot Instructions - Tournoi Call of Duty Mobile

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Context
This is a tournament management web application for Call of Duty Mobile Battle Royale tournaments organized by Espace Gaming CODM community.

## Tech Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **File Storage**: Cloudinary (for video uploads)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Lucide React icons, React Hot Toast

## Project Structure
- `/src/app` - Next.js App Router pages
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and configurations
- `/src/types` - TypeScript type definitions
- `/src/hooks` - Custom React hooks

## Key Features
1. **Tournament Management**: Battle Royale squad tournament with team registration
2. **Team System**: Teams of 4 players with unique team codes
3. **Video Validation**: Device check videos uploaded to Cloudinary
4. **Admin Panel**: Secure admin interface for player validation
5. **Real-time Updates**: Firebase Firestore for live data
6. **Push Notifications**: FCM for team status updates
7. **Registration Limits**: Maximum 50 teams with registration deadlines

## Business Rules
- Teams must have 4 players maximum
- Minimum 3 validated players for team validation
- Each player needs device check video
- Manual admin validation required for all players
- Registration period controlled by admin
- Unique team codes for joining incomplete teams

## Coding Guidelines
- Use TypeScript strict mode
- Implement proper error handling
- Follow Next.js 14+ app directory conventions
- Use Tailwind CSS for responsive design
- Implement proper Firebase security rules
- Use React Hook Form for form validation
- Structure components for reusability
- Implement proper loading states and error boundaries
