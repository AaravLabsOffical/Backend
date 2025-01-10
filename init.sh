#!/bin/sh

# Check if initialization has been completed by looking for a flag file
if [ ! -f /init_done ]; then
  echo "Running npm run populateData (initialization)..."
  npm run populateData
  touch /init_done  # Create a flag to mark initialization as complete
fi

# Run the main application (node index.js) after initialization
echo "Starting the app..."
exec "$@"
