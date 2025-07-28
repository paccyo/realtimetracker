import json

def calculate_heatmap(device_data, selected_devices, congestion_threshold, grid_size=5, min_coord=0, max_coord=21):
    """
    Calculates heatmap data based on device locations.

    Args:
        device_data (dict): A dictionary containing device data.
        selected_devices (list): A list of selected device IDs.
        congestion_threshold (int): The minimum number of devices in a grid cell to be considered congested.
        grid_size (int): The size of the grid cells.
        min_coord (int): The minimum coordinate value.
        max_coord (int): The maximum coordinate value.

    Returns:
        list: A list of dictionaries, where each dictionary represents a congested circle with its center coordinates and radius.
    """

    def transform_coordinates(lon, lat):
        if not all(isinstance(coord, (int, float)) for coord in [lon, lat]):
            return {'x': -1000, 'y': -1000}
        return {'x': lon, 'y': min_coord + (max_coord - lat)}

    latest_points = []
    for device_id in selected_devices:
        device = device_data.get(device_id)
        if not device or not device.get('points'):
            continue
        
        points_array = sorted(
            [p for p in device['points'].values() if all(isinstance(p.get(k), (int, float)) for k in ['latitude', 'longitude'])],
            key=lambda p: p['timestamp'],
            reverse=True
        )
        
        if points_array:
            latest_points.append(points_array[0])

    if len(latest_points) < 2:
        return []

    grid = {}
    for point in latest_points:
        coords = transform_coordinates(point['longitude'], point['latitude'])
        grid_x = int(coords['x'] / grid_size)
        grid_y = int(coords['y'] / grid_size)
        key = f"{grid_x},{grid_y}"
        
        if key not in grid:
            grid[key] = []
        grid[key].append(point)

    circles = []
    for key, cell_points in grid.items():
        if len(cell_points) >= congestion_threshold:
            transformed_cell_points = [transform_coordinates(p['longitude'], p['latitude']) for p in cell_points]
            
            center_x = sum(p['x'] for p in transformed_cell_points) / len(transformed_cell_points)
            center_y = sum(p['y'] for p in transformed_cell_points) / len(transformed_cell_points)
            
            radius = max(
                ((p['x'] - center_x)**2 + (p['y'] - center_y)**2)**0.5
                for p in transformed_cell_points
            )
            
            circles.append({
                'cx': center_x,
                'cy': center_y,
                'r': radius + 0.5,  # LATEST_POINT_RADIUS_SVG_UNITS
            })
            
            print(f"Grid Cell: {key}, Device Count: {len(cell_points)}")

    return circles

if __name__ == '__main__':
    # Example Usage
    with open('sample_device_data.json', 'r') as f:
        sample_device_data = json.load(f)
    
    selected_devices = ['device1', 'device2', 'device3']
    congestion_threshold = 2
    
    heatmap_circles = calculate_heatmap(sample_device_data, selected_devices, congestion_threshold)
    
    print("\nCongested Circles:")
    print(json.dumps(heatmap_circles, indent=2))
