// import React from 'react';

// export default function Webcam() {
//   var constraints = { audio: true, video: { width: 1280, height: 720 } };
//   navigator.mediaDevices
//     .getUserMedia(constraints)
//     .then(function (mediaStream) {
//       var video = document.querySelector('video');
//       if (!video) {
//         return;
//       }

//       video.srcObject = mediaStream;
//       video.onloadedmetadata = function (_e) {
//         if (!video) {
//           return;
//         }
//         video.play();
//       };
//     })
//     .catch(function (err) {
//       console.log(err.name + ': ' + err.message);
//     }); // always check for errors at the end.
//   return (
//     <div>
//       <div id="container">
//         <video autoPlay={true} id="videoElement" controls></video>
//       </div>
//     </div>
//   );
// }
