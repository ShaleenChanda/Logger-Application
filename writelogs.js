const fs = require('fs');
const writeData = () => {
    const data = `${new Date()} : This is a log line\n`;
    fs.appendFile('./test.log', data, 'utf8', (err) => {
        if(err)
            throw err;
        console.log('Appended data to file');        
    });
}

const start = () => setInterval(writeData, 2000);

start();