export const initalCanvas: ObjectLocation = {
  x: -50,
  y: -50,
  height: 0,
  width: 0,
  reset: false,
  count: 0,
};

export type CanvasActionType =
  | { type: 'PROC'; location: { x: number; y: number } }
  | { type: 'UPDATE_LOCATION'; ctx: CanvasRenderingContext2D }
  | { type: 'SET_H_W'; data: { height: number; width: number } };

export interface ObjectLocation {
  x: number;
  y: number;
  height: number;
  width: number;
  reset: boolean;
  count: number;
}

export const canvasReducer = (
  state: ObjectLocation,
  action: CanvasActionType
) => {
  const { type } = action;

  switch (type) {
    case 'PROC': {
      const ballX = state.x / state.width;
      const ballyY = state.y / state.height;
      const procX = action.location.x;
      const procY = action.location.y;
      const reset =
        Math.abs(ballX - procX) < 0.1 && Math.abs(ballyY - procY) < 0.1;
      return {
        ...state,
        reset,
        count: reset ? state.count + 1 : state.count,
      };
    }
    case 'UPDATE_LOCATION': {
      const canvasState = { x: state.x, y: state.y };
      const ctx = action.ctx;
      ctx.clearRect(0, 0, state.width, state.height);
      ctx.beginPath();
      ctx.arc(canvasState.x, canvasState.y, 25, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = 'blue';
      ctx.fill();
      if (
        canvasState.y < 0 ||
        canvasState.x < 0 ||
        canvasState.y > state.height ||
        state.reset
      ) {
        const randomNum = state.width * Math.random();
        return { ...state, x: randomNum, y: 0, reset: false };
      }
      return { ...state, y: state.y + 7 };
    }
    case 'SET_H_W': {
      return { ...state, height: action.data.height, width: action.data.width };
    }
    default:
      return state;
  }
};
