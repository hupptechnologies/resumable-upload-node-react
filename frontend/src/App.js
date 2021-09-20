import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

let ourRequest;
const CancelToken = axios.CancelToken;

function App() {
  const [state, setState] = useState(null);
  const [progress, setProgress] = useState(0);

  const getUploadedData = (file, options) => {
    const params = {
      fileName: file.name,
      fileId: options.fileId
    }
    axios.get('http://localhost:5000/upload-status',
      {
        params
      }
    ).then((res) => {
      setProgress(Math.round((100 * res.data.totalChunkUploaded) / file.size));
      if(res.data.totalChunkUploaded === file.size) {
        alert("File completed uploaded")
        localStorage.clear();
        return;
      }
      uploadFile(file,{...options,startingByte: res.data.totalChunkUploaded});      
    }).catch(error => {
      if (error.response) {
        alert(JSON.stringify(error.response.data));
      }
    })
  }


  const uploadFile = (file, options) => {
    
    let formdata = new FormData();

    // Get remaining chunk based on uploaded file zie.
    const chunk = file.slice(options.startingByte);
    formdata.append('image', chunk, file.name);
    // For the cancel Request
    ourRequest = CancelToken.source();
    axios({
      method: "POST",
      url: 'http://localhost:5000/upload',
      data: formdata,
      headers:{                                                                                                                                                                                                                                              
        'X-File-Id': options.fileId,                                                                                                                                                                                                                 
        'Content-Length': chunk.size,
        'Content-Range': `bytes=${options.startingByte}-${options.startingByte+chunk.size}/${file.size}`                                                                                                                                                                                     
      },
      cancelToken: ourRequest.token,
      onUploadProgress:(event) => {
        const loaded = options.startingByte + event.loaded;
        setProgress(Math.round(loaded * 100 / file.size));
      },     
    }).then((res) => {
      console.log(res);
      if(res.data === "SUCCESSS"){
        alert("UPLOAD SUCCESS");
        localStorage.clear();
      }
    }).catch(error => {
      if (error.response) {
        alert(JSON.stringify(error.response.data));
      }
    })
  }

  const onFileSelect = (files) => {
    setState({file: files[0]});
    checkFileInLocal(files[0],{startingByte: 0});
  }

  const checkFileInLocal = (file,options) => {
    let localFile = localStorage.getItem("file");
    if(localFile) {
      localFile = JSON.parse(localFile);
      // File exist in local server with key
      console.log("HERE");
      getUploadedData(file, {...options, fileId: localFile.fileId});
    } else {
      const body = {
        fileName: file.name
      }
      axios.post('http://localhost:5000/upload-request', body).then((res) => {
        console.log("upload-request", res);
        options['fileId'] = res.data.fileId;

        localStorage.setItem("file", JSON.stringify({
          fileName: file.name,
          fileId: options.fileId
        }));

        uploadFile(file, options);
        // getUploadedData(file, options);
      }).catch(error => {
        if (error.response) {
          alert(JSON.stringify(error.response.data));
        }
      })
    }
  }
 
  const cancelUpload = () => {
    ourRequest.cancel();
  }

  const startUpload = () => {
    let localFile = localStorage.getItem("file");
    if(localFile) {
      localFile = JSON.parse(localFile);
      if(localFile.fileName === state.file.name) {
        getUploadedData(state.file, {startingByte: 0, fileId: localFile.fileId});
      }
    }  else {
      alert("File data not availalbe in your storage.")
    }
  }

  return (
    <div className="App">
      <div className="progress">
        <div className="progressFill" style={{width: (progress > 100) ? '100%' : `${progress}%`}}>

        </div>
      </div>
      <div>
        <input type="file" onChange={e => onFileSelect(e.target.files)} />
      </div>
      <div> <button onClick={() => cancelUpload()}>Puase</button> <button onClick={() => startUpload()}>Start Again</button></div>
    </div>
  );
}

export default App;
