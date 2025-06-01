# **App Name**: Realtime Tracker

## Core Features:

- Path Display: Display a map component centered to the average location using a coordinate system ranging from -5 to 30 on both the X and Y axis. Also display all captured device coordinates and the lines that connect them on this map. The device path lines should have reasonable thickness.
- Device Selection: Display a list of checkboxes corresponding to available devices. User selection should filter displayed map coordinates.
- Realtime Updates: Establish a connection to the Firebase Realtime Database and listen for coordinate updates. Automatically update the map and coordinate display when the database changes.
- Timestamp Display: Display timestamp when the user hovers over coordinate points on the map.

## Style Guidelines:

- Primary color: Deep sky blue (#4169E1) for a sense of technology and clear skies.
- Background color: Light gray (#E0E0E0), providing a neutral backdrop to emphasize map data.
- Accent color: Salmon (#FA8072) for interactive elements and to highlight specific data points.
- Font pairing: 'Inter' (sans-serif) for both headlines and body text, ensuring readability and a modern, objective feel.
- Simple, geometric icons to represent device locations.
- The device selection panel should be positioned on the left, while the map takes up the majority of the screen space on the right.
- Subtle animations when new data points are added to the map.