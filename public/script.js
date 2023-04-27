let socket = null;
const settings = {
    paused: false
}

document.querySelector('#control__start').addEventListener('click', () => {
    const filelocation = document.querySelector('#filepath').value;
    if(filelocation.length === 0) {
        alert('File path cannot be empty !!');
        return;
    }
    socket = io('/', {query: `filepath=${filelocation}`});

    socket.on('wrong-filepath', () => {
        alert('File not found');
        window.location.reload(false);
    });

    socket.on('user-connected', () => {
        document.querySelector('.alert').style.display = "flex";
        document.querySelector('#control__start').disabled = true;
        document.querySelector('#control__pause').disabled = false;
        document.querySelector('#control__stop').disabled = false;
    });

    document.querySelector('#control__stop').addEventListener('click', () => {
        window.location.reload('false');
    })

    socket.on('data-received', ({data}) => {
        if(!settings.paused) {
            document.querySelector('.logs').innerHTML = '';
            for(let i=0; i<data.length; i++) {
                const p = document.createElement('p');
                p.innerHTML = data[i];
                document.querySelector('.logs').appendChild(p);
                document.querySelector('.logview').scrollTop = document.querySelector('.logview').scrollHeight;
            }
        }
    });
});

document.querySelector('#control__pause').addEventListener('click', () => {
    settings.paused = !settings.paused;
    document.querySelector('#control__pause').innerHTML = settings.paused ? 'Resume' : 'Pause';
    document.querySelector('.paused').style.display = settings.paused ? 'block' : 'none';
});

document.querySelector('#alert__close').addEventListener('click', () => {
    document.querySelector('.alert').style.display = "none";
});