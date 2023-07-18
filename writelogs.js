const fs = require('fs');

// Define a function that writes a log message to a file
const writeData = () => {
    const data = `${new Date()} : This is a log line\n`; // Create a log message with the current date and time
    fs.appendFile('./logs/test2.log', data, 'utf8', (err) => { // Append the log message to a file
        if(err) // Handle any errors
            throw err;
        console.log('Appended data to file'); // Log a message to the console when the data has been appended to the file
    });
}

// Define a function that starts the log writing process
const start = () => setInterval(writeData, 2000); // Call the writeData function every 2 seconds using setInterval

start(); // Start the log writing process by calling the start function
