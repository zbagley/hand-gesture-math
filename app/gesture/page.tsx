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
import { canvasReducer, initalCanvas } from '@/reducers/canvas-reducer';

export default function Page() {
  const [gestureState, gestureDispatch] = useReducer(
    gestureReducer,
    initialGesture
  );
  const [canvasState, canvasDispatch] = useReducer(canvasReducer, initalCanvas);
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
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm'
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
      const drawBall = (
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        stopDraw: boolean = false
      ) => {
        if (stopDraw) {
          return;
        }
        canvasDispatch({ type: 'UPDATE_LOCATION', ctx });
        requestAnimationFrame(() => drawBall(canvas, ctx));
      };
      setIsStreaming(true);
      video.addEventListener(
        'loadedmetadata',
        () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          draw.width = video.videoWidth;
          draw.height = video.videoHeight;
          canvasDispatch({
            type: 'SET_H_W',
            data: { height: draw.height, width: draw.width },
          });
          gestureRecognizer.setOptions({ runningMode: 'VIDEO' });
          const ctx = draw.getContext('2d');
          if (!ctx) return;
          requestAnimationFrame(() => drawBall(draw, ctx));
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
            gestureDispatch({
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
            gestureDispatch({
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
    if (!gestureState.gesturePipe.length) {
      return;
    }
    let didUpdate = false;
    const gestureCount = gestureState.gesturePipe
      .map((data) => data.name)
      .reduce(
        (cnt, cur) => ((cnt[cur] = cnt[cur] + 1 || 1), cnt),
        {} as { [key: string]: number }
      );
    const largest = Object.keys(gestureCount).reduce((a, b) =>
      gestureCount[a] > gestureCount[b] ? a : b
    );
    if (GestureNames.Closed_Fist === largest) {
      const nextGesture = gestureState.gesturePipe.find(
        (data) => data.name === GestureNames.Closed_Fist
      );
      if (gestureState.currentGesture.name === GestureNames.Open_Palm) {
        canvasDispatch({
          type: 'PROC',
          location: gestureState.currentGesture.location,
        });
      }
      if (nextGesture) {
        gestureDispatch({ type: GestureActionKind.UPDATE, data: nextGesture });
      }
      didUpdate = true;
    }
    if (GestureNames.Open_Palm === largest) {
      const nextGesture = gestureState.gesturePipe.find(
        (data) => data.name === GestureNames.Open_Palm
      );
      if (nextGesture) {
        gestureDispatch({ type: GestureActionKind.UPDATE, data: nextGesture });
      }
      didUpdate = true;
    }
    if (!didUpdate) {
      gestureDispatch({
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
  }, [gestureState.gesturePipe]);

  return (
    <>
      <video ref={videoRef} autoPlay={true} style={{ display: 'none' }} />
      <div className="flex flex-col h-full items-center">
        <Script
          src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js"
          crossOrigin="anonymous"
        ></Script>
        <div
          className="aspect-video flex-1"
          style={{ width: canvasRef?.current?.clientWidth ?? 0 }}
        >
          <div className="relative w-full h-full">
            <canvas
              ref={canvasRef}
              className="absolute aspect-video h-full top-0 left-0"
            ></canvas>
            <canvas
              ref={drawRef}
              className="absolute aspect-video h-full top-0 left-0"
            ></canvas>
          </div>
        </div>
        <div className="flex flex-row justify-around">
          <div className="m-4">Current Score - {canvasState.count}</div>
          <div className="m-4">
            Gesture: {gestureState.currentGesture.name} <br />
          </div>
        </div>
      </div>
    </>
  );
}
