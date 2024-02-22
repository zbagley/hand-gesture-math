'use client';

import Script from 'next/script';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';
import { useEffect, useReducer, useRef, useState } from 'react';
import {
  GestureActionKind,
  GestureNames,
  gestureReducer,
  initialGesture,
} from '@/reducers/gesture-reducer';

export default function Page() {
  const [state, dispatch] = useReducer(gestureReducer, initialGesture);
  const drawRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [gestureRecognizer, setGestureRecognizer] =
    useState<GestureRecognizer | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
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
    const ball = {
      x: 0,
      y: 0,
      vy: 6,
      radius: 25,
      color: 'blue',
      draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        if (ball.y < 0 || ball.x < 0 || ball.y > canvas.height) {
          ball.y = 0;
          ball.x = canvas.width * Math.random();
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
      },
    };
    const drawBall = (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D
    ) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ball.draw(canvas, ctx);
      ball.y += ball.vy;
      window.requestAnimationFrame(() => drawBall(canvas, ctx));
    };

    const canvas = canvasRef.current;
    const draw = drawRef.current;
    const video = videoRef.current;
    if (
      draw &&
      canvas &&
      video &&
      mediaStream &&
      gestureRecognizer &&
      !isStreaming
    ) {
      setIsStreaming(true);
      video.addEventListener(
        'loadedmetadata',
        () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          draw.width = video.videoWidth;
          draw.height = video.videoHeight;
          gestureRecognizer.setOptions({ runningMode: 'VIDEO' });
          const ctx = draw.getContext('2d');
          if (!ctx) return;
          drawBall(draw, ctx);
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
            dispatch({
              type: GestureActionKind.ADD,
              data: {
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
              },
            });
          } else {
            dispatch({
              type: GestureActionKind.ADD,
              data: {
                name: GestureNames.None,
                location: {
                  x: 0,
                  y: 0,
                },
              },
            });
          }
          lastVideoTime = video.currentTime;
        }
        requestAnimationFrame(loop);
      };
    }
  }, [mediaStream, gestureRecognizer, isStreaming]);

  useEffect(() => {
    if (!state.gesturePipe.length) {
      return;
    }
    let didUpdate = false;
    const gestureCount = state.gesturePipe
      .map((data) => data.name)
      .reduce(
        (cnt, cur) => ((cnt[cur] = cnt[cur] + 1 || 1), cnt),
        {} as { [key: string]: number }
      );
    const largest = Object.keys(gestureCount).reduce((a, b) =>
      gestureCount[a] > gestureCount[b] ? a : b
    );
    if (GestureNames.Closed_Fist === largest) {
      const nextGesture = state.gesturePipe.find(
        (data) => data.name === GestureNames.Closed_Fist
      );
      if (state.currentGesture.name === GestureNames.Open_Palm) {
        console.log("Proc'd at ", state.currentGesture.location);
      }
      if (nextGesture) {
        dispatch({ type: GestureActionKind.UPDATE, data: nextGesture });
      }
      didUpdate = true;
    }
    if (GestureNames.Open_Palm === largest) {
      const nextGesture = state.gesturePipe.find(
        (data) => data.name === GestureNames.Open_Palm
      );
      if (nextGesture) {
        dispatch({ type: GestureActionKind.UPDATE, data: nextGesture });
      }
      didUpdate = true;
    }
    if (!didUpdate) {
      dispatch({
        type: GestureActionKind.UPDATE,
        data: {
          name: GestureNames.None,
          location: {
            x: -1,
            y: -1,
          },
        },
      });
    }
    // TODO: Move updates for current action into reducer if possible
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gesturePipe]);

  return (
    <section>
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js"
        crossOrigin="anonymous"
      ></Script>
      <h1>Hello World - Test!</h1>
      <video ref={videoRef} autoPlay={true} style={{ display: 'none' }} />
      <div
        style={{ position: 'relative', height: videoRef.current?.videoHeight }}
      >
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0 }}
        ></canvas>
        <canvas
          ref={drawRef}
          style={{ position: 'absolute', top: 0, left: 0 }}
        ></canvas>
      </div>
      <div>
        Gesture: {state.currentGesture.name} <br />
        Location - x: {state.currentGesture.location.x}, y:{' '}
        {state.currentGesture.location.y}
      </div>
    </section>
  );
}
