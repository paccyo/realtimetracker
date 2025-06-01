# Realtime Tracker

This Next.js application displays real-time device movement paths using data from a Firebase Realtime Database. Users can select specific devices to view their paths on a custom map interface.

## Features

- **Real-time Path Display**: Visualizes device movement paths on a custom map.
- **Device Selection**: Allows users to choose which devices' paths to display via checkboxes.
- **Live Updates**: Automatically updates the map as new location data arrives in Firebase.
- **Timestamp Tooltips**: Shows the timestamp of a location point when hovered over.

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Firebase Realtime Database
- Tailwind CSS
- Shadcn/ui (for UI components)
- Lucide React (for icons)

## Getting Started

### Prerequisites

- Node.js (version 18.x or later recommended)
- npm or yarn
- A Firebase project with Realtime Database set up.

### Firebase Setup

1.  Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
2.  Enable the Realtime Database.
3.  In your Firebase project settings, find your web app's Firebase configuration (apiKey, authDomain, etc.).
4.  Create a `.env.local` file in the root of the project and add your Firebase configuration:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

### Database Structure

The application expects the following data structure in your Firebase Realtime Database:

```json
{
  "devices": {
    "dummy_device_id_1": {
      "points": {
        "-ORh3FXSrA18xkT7PQ9Z": {
          "isDummy": true,
          "latitude": 18.23,
          "longitude": 27.07,
          "timestamp": "2025-06-01T19:56:18.394Z"
        },
        // ... more points
      }
    },
    "dummy_device_id_2": {
      "points": {
        // ... points for device 2
      }
    }
    // ... more devices
  }
}
```
Coordinates for latitude and longitude should generally be within the range of -5 to 30 for optimal display on the map.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd realtime-tracker
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:9002](http://localhost:9002) (or the port specified in `package.json`) with your browser to see the result.

## Project Structure

- `src/app/`: Main application pages and layout.
- `src/components/`: Reusable UI components.
  - `MapDisplay.tsx`: Custom SVG map for rendering paths.
  - `DeviceSelector.tsx`: Component for device selection checkboxes.
  - `ui/`: Shadcn/ui components.
- `src/lib/`: Utility functions and Firebase configuration.
  - `firebase.ts`: Firebase initialization.
- `src/types/`: TypeScript type definitions.
- `src/hooks/`: Custom React hooks.
- `public/`: Static assets.

## Customization

- **Map Range**: The map is configured for coordinates between -5 and 30. This can be adjusted in `src/components/MapDisplay.tsx` by changing `MIN_COORD` and `MAX_COORD`.
- **Styling**: Colors, fonts, and other styles are defined in `src/app/globals.css` and `tailwind.config.ts`. The primary theme uses Deep Sky Blue, Light Gray, and Salmon.
- **Path Colors**: A predefined list of colors for device paths is in `src/components/MapDisplay.tsx`.

## Deployment

This app is configured for Firebase App Hosting. You can deploy it using the Firebase CLI. Refer to the [Firebase App Hosting documentation](https://firebase.google.com/docs/app-hosting) for more details.
```
firebase deploy --only hosting
```

Ensure your `apphosting.yaml` is configured as needed.
