# Activity Streams store

## Usage

    npm start
    
Add an object using GET (should PUT in real life):
http://localhost:5000/object/create/?displayName=foo&content=bar

Get the 10 most recent objects:
http://localhost:5000/object/?max=10
