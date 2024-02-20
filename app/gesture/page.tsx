'use client';

import Script from 'next/script';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';
import { useEffect, useRef, useState } from 'react';

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [gestureRecognizer, setGestureRecognizer] =
    useState<GestureRecognizer | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentGesture, setCurrentGesture] = useState<{
    name: string;
    location: { x: number; y: number };
  } | null>(null);

  // Load gesture recognizer and pre-build
  useEffect(() => {
    const loadGestureRecognizer = async () => {
      if (!gestureRecognizer) {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const gRec = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task',
          },
          numHands: 1,
        });
        setGestureRecognizer(gRec);
      }
    };
    loadGestureRecognizer();
  });

  useEffect(() => {
    const enableVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setMediaStream(stream);
      } catch (error) {
        console.error('Error accessing webcam', error);
      }
    };

    enableVideoStream();
  }, []);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [videoRef, mediaStream]);

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [mediaStream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && mediaStream && gestureRecognizer && !isStreaming) {
      setIsStreaming(true);
      video.addEventListener(
        'loadedmetadata',
        () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          gestureRecognizer.setOptions({ runningMode: 'VIDEO' });
          requestAnimationFrame(loop);
        },
        { once: true }
      );
      let lastVideoTime = 0;
      const loop = () => {
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        if (video.currentTime > lastVideoTime) {
          const gestureRecognitionResult = gestureRecognizer.recognizeForVideo(
            video,
            video.currentTime
          );
          if (gestureRecognitionResult.gestures.length > 0) {
            setCurrentGesture({
              name: gestureRecognitionResult.gestures[0][0].categoryName,
              location: {
                x: +(
                  gestureRecognitionResult.landmarks[0]
                    .map((data) => data.x)
                    .reduce((prev, current) => prev + current) / 21
                ).toFixed(2),
                y: +(
                  gestureRecognitionResult.landmarks[0]
                    .map((data) => data.y)
                    .reduce((prev, current) => prev + current) / 21
                ).toFixed(2),
              },
            });
          } else {
            setCurrentGesture(null);
          }
          lastVideoTime = video.currentTime;
        }
        requestAnimationFrame(loop);
      };
    }
  }, [mediaStream, gestureRecognizer, isStreaming]);
  // let gestureRecognizer: GestureRecognizer;
  // let enableWebcamButton: HTMLButtonElement;
  // let webcamRunning: Boolean = false;
  // const videoHeight = '360px';
  // const videoWidth = '480px';

  // const createGestureRecognizer = async () => {
  //   const vision = await FilesetResolver.forVisionTasks(
  //     'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
  //   );
  //   gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
  //     baseOptions: {
  //       modelAssetPath:
  //         'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
  //       delegate: 'GPU',
  //     },
  //     runningMode: 'VIDEO',
  //   });
  // };
  // createGestureRecognizer();

  // const video = document.getElementById('webcam');
  // const canvasElement = document.getElementById('output_canvas');
  // const canvasCtx = canvasElement.getContext('2d');
  // const gestureOutput = document.getElementById('gesture_output');

  // // Check if webcam access is supported.
  // function hasGetUserMedia() {
  //   return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  // }

  // // If webcam supported, add event listener to button for when user
  // // wants to activate it.
  // if (hasGetUserMedia()) {
  //   enableWebcamButton = document.getElementById('webcamButton');
  //   enableWebcamButton.addEventListener('click', enableCam);
  // } else {
  //   console.warn('getUserMedia() is not supported by your browser');
  // }

  // // Enable the live webcam view and start detection.
  // function enableCam(event) {
  //   if (!gestureRecognizer) {
  //     alert('Please wait for gestureRecognizer to load');
  //     return;
  //   }

  //   if (webcamRunning === true) {
  //     webcamRunning = false;
  //     enableWebcamButton.innerText = 'ENABLE PREDICTIONS';
  //   } else {
  //     webcamRunning = true;
  //     enableWebcamButton.innerText = 'DISABLE PREDICTIONS';
  //   }

  //   // getUsermedia parameters.
  //   const constraints = {
  //     video: true,
  //   };

  //   // Activate the webcam stream.
  //   navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
  //     video.srcObject = stream;
  //     video.addEventListener('loadeddata', predictWebcam);
  //   });
  // }

  // let lastVideoTime = -1;
  // let results = undefined;
  // async function predictWebcam() {
  //   const webcamElement = document.getElementById('webcam');
  //   // Now let's start detecting the stream.
  //   if (runningMode === 'IMAGE') {
  //     runningMode = 'VIDEO';
  //     await gestureRecognizer.setOptions({ runningMode: 'VIDEO' });
  //   }
  //   let nowInMs = Date.now();
  //   if (video.currentTime !== lastVideoTime) {
  //     lastVideoTime = video.currentTime;
  //     results = gestureRecognizer.recognizeForVideo(video, nowInMs);
  //   }

  //   canvasCtx.save();
  //   canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  //   const drawingUtils = new DrawingUtils(canvasCtx);

  //   canvasElement.style.height = videoHeight;
  //   webcamElement.style.height = videoHeight;
  //   canvasElement.style.width = videoWidth;
  //   webcamElement.style.width = videoWidth;

  //   if (results.landmarks) {
  //     for (const landmarks of results.landmarks) {
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         GestureRecognizer.HAND_CONNECTIONS,
  //         {
  //           color: '#00FF00',
  //           lineWidth: 5,
  //         }
  //       );
  //       drawingUtils.drawLandmarks(landmarks, {
  //         color: '#FF0000',
  //         lineWidth: 2,
  //       });
  //     }
  //   }
  //   canvasCtx.restore();
  //   if (results.gestures.length > 0) {
  //     gestureOutput.style.display = 'block';
  //     gestureOutput.style.width = videoWidth;
  //     const categoryName = results.gestures[0][0].categoryName;
  //     const categoryScore = parseFloat(
  //       results.gestures[0][0].score * 100
  //     ).toFixed(2);
  //     const handedness = results.handednesses[0][0].displayName;
  //     gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
  //   } else {
  //     gestureOutput.style.display = 'none';
  //   }
  //   // Call this function again to keep predicting when the browser is ready.
  //   if (webcamRunning === true) {
  //     window.requestAnimationFrame(predictWebcam);
  //   }
  // }
  return (
    <section>
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js"
        crossOrigin="anonymous"
      ></Script>
      <h1>Hello World - Test!</h1>
      <video ref={videoRef} autoPlay={true} style={{ display: 'none' }} />
      <canvas ref={canvasRef}></canvas>
      <div>
        Gesture: <br />
        {currentGesture
          ? 'Name: ' +
            currentGesture.name +
            ' Location - x: ' +
            currentGesture.location.x +
            ' y: ' +
            currentGesture.location.y
          : 'None Found'}
      </div>
    </section>
  );
}
