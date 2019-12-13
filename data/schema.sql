DROP TABLE cityLocation, weather, events;

CREATE TABLE IF NOT EXISTS cityLocation(
    id SERIAL PRIMARY KEY,
    searchQuery VARCHAR(255),
    formattedQuery VARCHAR(255),
    latitude NUMERIC(18,6),
    longitude NUMERIC(18,6)

);

CREATE TABLE IF NOT EXISTS weather(
    searchID INT REFERENCES cityLocation(id),
    summary TEXT,
    timeDay DATE
);

CREATE TABLE IF NOT EXISTS events(
    searchID INT REFERENCES cityLocation(id),
    link VARCHAR(255),
    eventName VARCHAR(255),
    eventDate DATE,
    eventDetails TEXT
);



