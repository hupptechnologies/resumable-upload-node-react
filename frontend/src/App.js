import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

let ourRequest;
const CancelToken = axios.CancelToken;
function App() {
  const [state, setState] = useState(null);
  const [progress, setProgress] = useState(0);
  

  useEffect(() => {
    console.log("LOADING.....");
  },[])

  const getUploadedData = (file, options) => {
    console.log("FILE", file);
    const params = {
      fileName: file.name,
        fileId: 'ABCD123'
    }
    axios.get('http://localhost:5000/upload-status',
      {
        params
      }
    ).then((res) => {
      console.log(res.data);
      setProgress(Math.round((100 * res.data.totalChunkUploaded) / file.size));
      if(res.data.totalChunkUploaded === file.size) {
        alert("File completed uploaded")
        return;
      }
      // 2342912 3227354
      uploadFile(file,{...options,startingByte: res.data.totalChunkUploaded});

      
    }).catch(err => {
      console.log(err);
    })
  }


  const uploadFile = (file, options) => {
    console.log(file)
    let formdata = new FormData();
    console.log({options})
    const chunk = file.slice(options.startingByte);


    formdata.append('image', chunk, file.name);
    ourRequest = CancelToken.source()
    console.log({ourRequest})
    axios({
      method: "POST",
      url: 'http://localhost:5000/upload',
      data: formdata,
      headers:{                                                                                                                                                                                                                                              
        'X-File-Id': 'ABCD123',                                                                                                                                                                                                                 
        'Content-Length': chunk.size,
        'Content-Range': `bytes=${options.startingByte}-${options.startingByte+chunk.size}/${file.size}`                                                                                                                                                                                     
      },
      cancelToken: ourRequest.token,
      onUploadProgress:(event) => {
        console.log({event});
        const loaded = options.startingByte + event.loaded;
        setProgress(Math.round(loaded * 100 / file.size));
      },
      

    }).then((res) => {
      console.log(res);
    }).catch(err => {
      console.log(err);
    })
  }

  const onFileSelect = (files) => {
    console.log(files);
    setState({file: files[0]});
    getUploadedData(files[0],{startingByte: 0});
  }

  const cancelUpload = () => {
    ourRequest.cancel();
  }

  const startUpload = () => {
    getUploadedData(state.file, {startingByte: 0});
  }

  return (
    <div className="App">
      <div>
        {progress && progress.toString()}
      </div>
      <div>
        <input type="file" onChange={e => onFileSelect(e.target.files)} />
      </div>
      <div> <button onClick={() => cancelUpload()}>Puase</button> <button onClick={() => startUpload()}>Start Again</button></div>
    </div>
  );
}

export default App;
