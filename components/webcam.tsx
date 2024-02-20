import React, { useRef, useState, useEffect } from 'react';

const Webcam = ({
  videoStream,
}: {
  videoStream: (_videoData: MediaStream | null) => void;
}) => {
  const videoRef = useRef<any>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  // const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
  //   null
  // );

  // const videoStream = (data: string) => {
  //   socket.emit('videoData', data);
  // };
  useEffect(() => {
    const enableVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setMediaStream(stream);
        videoStream(stream);
        // setMediaRecorder(new MediaRecorder(stream));
      } catch (error) {
        console.error('Error accessing webcam', error);
      }
    };

    enableVideoStream();
  }, []);

  // useEffect(() => {
  //   if (mediaRecorder && mediaRecorder.state !== 'recording') {
  //     console.log('recorder!');
  //     mediaRecorder.start(5000);
  //     mediaRecorder.ondataavailable = (blob) => {
  //       videoStream(blob.data);
  //     };
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [mediaRecorder]);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      console.log('stream', mediaStream);
    }
  }, [videoRef, mediaStream]);

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          console.log('in tracks with: ', track);
          track.stop();
        });
      }
    };
  }, [mediaStream]);

  return (
    <>
      <video ref={videoRef} autoPlay={true} />
    </>
  );
};
export default Webcam;
